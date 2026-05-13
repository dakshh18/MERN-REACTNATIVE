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
  console.log('[push] getExpoPushToken: start. isDevice=', Device.isDevice)
  if (!Device.isDevice) {
    console.warn('[push] not a real device, skipping')
    return null
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  console.log('[push] existing permission status=', existing)
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    console.log('[push] after request, status=', status)
    finalStatus = status
  }
  if (finalStatus !== 'granted') {
    console.warn('[push] permission not granted, aborting. final=', finalStatus)
    return null
  }

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
  console.log('[push] projectId=', projectId)

  if (!projectId) {
    console.warn('[push] missing EAS projectId, cannot fetch Expo push token')
    return null
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
    console.log('[push] got token=', tokenData.data)
    return tokenData.data
  } catch (err) {
    console.error('[push] getExpoPushTokenAsync threw:', err)
    return null
  }
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
