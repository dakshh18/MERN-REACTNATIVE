import { View, Text, ScrollView, Switch } from 'react-native'
import React, { useState } from 'react'
import SafeScreen from '@/components/SafeScreen'
import ScreenHeader from '@/components/ScreenHeader'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'

interface ToggleSetting {
  key: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  iconColor: string
  title: string
  description: string
  defaultValue: boolean
}

const SETTINGS: ToggleSetting[] = [
  {
    key: 'orderUpdates',
    icon: 'cube-outline',
    iconColor: '#00D9FF',
    title: 'Order Updates',
    description: 'Shipping, delivery, and order status changes',
    defaultValue: true,
  },
  {
    key: 'promotions',
    icon: 'pricetag-outline',
    iconColor: '#1DB954',
    title: 'Deals & Promotions',
    description: 'Sales, discount codes, and flash offers',
    defaultValue: true,
  },
  {
    key: 'recommendations',
    icon: 'sparkles-outline',
    iconColor: '#FFC107',
    title: 'Personalized Picks',
    description: 'Recommendations based on your activity',
    defaultValue: false,
  },
  {
    key: 'wishlist',
    icon: 'heart-outline',
    iconColor: '#FF6B6B',
    title: 'Wishlist Alerts',
    description: 'Price drops and back-in-stock on saved items',
    defaultValue: false,
  },
  {
    key: 'newsletter',
    icon: 'mail-outline',
    iconColor: '#888',
    title: 'Weekly Newsletter',
    description: 'Curated finds delivered to your inbox',
    defaultValue: false,
  },
]

const NotificationsScreen = () => {
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(SETTINGS.map((s) => [s.key, s.defaultValue]))
  )

  const toggle = (key: string) => {
    setValues((v) => ({ ...v, [key]: !v[key] }))
    Toast.show({
      type: 'info',
      text1: 'Saved locally',
      text2: 'Server-side preferences are coming soon.',
      position: 'top',
      visibilityTime: 1400,
    })
  }

  return (
    <SafeScreen>
      <ScreenHeader title='Notifications' subtitle='Control what we send you' />

      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission banner */}
        <View className='bg-surface rounded-3xl p-4 mb-4 flex-row items-center'>
          <View className='w-10 h-10 rounded-full bg-primary/20 items-center justify-center'>
            <Ionicons name='notifications' size={20} color='#00D9FF' />
          </View>
          <View className='flex-1 ml-3'>
            <Text className='text-text-primary font-semibold text-sm'>
              Push notifications enabled
            </Text>
            <Text className='text-text-secondary text-xs mt-0.5'>
              You can change this anytime in your device settings.
            </Text>
          </View>
        </View>

        <Text className='text-text-secondary text-xs uppercase tracking-wider mb-2 ml-1'>
          What you&apos;ll receive
        </Text>
        <View className='bg-surface rounded-3xl overflow-hidden'>
          {SETTINGS.map((s, idx) => (
            <View key={s.key}>
              <View className='flex-row items-center px-4 py-4'>
                <View
                  className='w-10 h-10 rounded-full items-center justify-center'
                  style={{ backgroundColor: `${s.iconColor}22` }}
                >
                  <Ionicons name={s.icon} size={18} color={s.iconColor} />
                </View>
                <View className='flex-1 ml-3 mr-3'>
                  <Text className='text-text-primary font-semibold text-sm'>
                    {s.title}
                  </Text>
                  <Text className='text-text-secondary text-xs mt-0.5'>
                    {s.description}
                  </Text>
                </View>
                <Switch
                  value={values[s.key]}
                  onValueChange={() => toggle(s.key)}
                  trackColor={{ false: '#333', true: '#1DB95488' }}
                  thumbColor={values[s.key] ? '#1DB954' : '#888'}
                />
              </View>
              {idx !== SETTINGS.length - 1 && (
                <View className='h-px bg-background-lighter ml-16' />
              )}
            </View>
          ))}
        </View>

        <Text className='text-text-secondary text-xs text-center mt-6 px-4 leading-5'>
          Real push notification delivery is coming soon. Toggles save locally
          for now.
        </Text>
      </ScrollView>
    </SafeScreen>
  )
}

export default NotificationsScreen
