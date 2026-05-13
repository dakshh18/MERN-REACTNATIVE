import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { useAuth } from '@clerk/clerk-expo'
import { router } from 'expo-router'
import { useApi } from '@/lib/api'

// While the app is in foreground, show the banner + play the sound so the user
// notices something arrived even without leaving the app.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1DB954',
    })
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId

  if (!projectId) {
    console.warn('[push] missing EAS projectId, cannot fetch Expo push token')
    return null
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
  return tokenData.data
}

const usePushNotifications = () => {
  const { isSignedIn, isLoaded } = useAuth()
  const api = useApi()
  const tokenSent = useRef<string | null>(null)
  const tapSubRef = useRef<Notifications.Subscription | null>(null)

  // Register + sync token after the user is authenticated
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    let cancelled = false

    ;(async () => {
      try {
        const token = await getExpoPushToken()
        if (!token || cancelled) return
        if (tokenSent.current === token) return
        await api.post('/user/push-token', { pushToken: token })
        tokenSent.current = token
      } catch (err) {
        console.warn('[push] register failed:', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, api])

  // Handle taps on a notification — deep-link to the order if present
  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as
        | { orderId?: string; type?: string }
        | undefined
      const orderId = data?.orderId
      if (orderId) {
        router.push(`/account/orders/${orderId}`)
      }
    }

    // App was already running
    tapSubRef.current = Notifications.addNotificationResponseReceivedListener(handle)

    // App was opened by tapping a notification while it was killed
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handle(response)
    })

    return () => {
      tapSubRef.current?.remove()
    }
  }, [])
}

export default usePushNotifications
