import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import React from 'react'
import SafeScreen from '@/components/SafeScreen'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import useCart from '@/hooks/useCart'
import useWishList from '@/hooks/useWishList'
import useOrders from '@/hooks/useOrders'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'

type IconName = React.ComponentProps<typeof Ionicons>['name']

interface MenuItem {
  icon: IconName
  label: string
  onPress: () => void
  danger?: boolean
}

const ProfileScreen = () => {
  const { user, isLoaded } = useUser()
  const { signOut } = useAuth()
  const { itemCount } = useCart()
  const { wishListCount } = useWishList()
  const { orderCount } = useOrders()

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/(auth)')
        },
      },
    ])
  }

  const menuItems: MenuItem[] = [
    {
      icon: 'location-outline',
      label: 'Shipping Addresses',
      onPress: () => router.push('/account/addresses'),
    },
    {
      icon: 'receipt-outline',
      label: 'My Orders',
      onPress: () => router.push('/account/orders'),
    },
    {
      icon: 'card-outline',
      label: 'Payment Methods',
      onPress: () => router.push('/account/payment-methods'),
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      onPress: () => router.push('/account/notifications'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      onPress: () => router.push('/account/help'),
    },
    {
      icon: 'log-out-outline',
      label: 'Sign Out',
      onPress: handleSignOut,
      danger: true,
    },
  ]

  if (!isLoaded) {
    return (
      <SafeScreen>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#00D9FF' />
        </View>
      </SafeScreen>
    )
  }

  const displayName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Shopper'
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const avatar = user?.imageUrl

  return (
    <SafeScreen>
      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className='px-6 pb-2 pt-6'>
          <Text className='text-text-primary text-3xl font-bold tracking-tighter'>
            Profile
          </Text>
          <Text className='text-text-secondary text-sm mt-1 ml-2'>
            Manage your account
          </Text>
        </View>

        {/* Identity card */}
        <View className='mx-6 mt-6 bg-surface rounded-3xl p-5 flex-row items-center'>
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              className='w-16 h-16 rounded-full bg-background-lighter'
              resizeMode='cover'
            />
          ) : (
            <View className='w-16 h-16 rounded-full bg-background-lighter items-center justify-center'>
              <Ionicons name='person' size={28} color='#666' />
            </View>
          )}
          <View className='flex-1 ml-4'>
            <Text className='text-text-primary font-bold text-lg' numberOfLines={1}>
              {displayName}
            </Text>
            <Text className='text-text-secondary text-sm' numberOfLines={1}>
              {email}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'Coming soon',
                text2: 'Edit profile via Clerk is not wired up yet.',
                position: 'top',
                visibilityTime: 1800,
              })
            }
            className='bg-background rounded-full p-2'
            activeOpacity={0.7}
          >
            <Ionicons name='pencil' size={16} color='#fff' />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className='px-6 mt-4 flex-row justify-between'>
          <View className='bg-surface rounded-3xl p-4 flex-1 mr-2 items-center'>
            <Ionicons name='cart' size={22} color='#1DB954' />
            <Text className='text-text-primary font-bold text-xl mt-2'>
              {itemCount}
            </Text>
            <Text className='text-text-secondary text-xs'>Cart Items</Text>
          </View>
          <View className='bg-surface rounded-3xl p-4 flex-1 mx-1 items-center'>
            <Ionicons name='heart' size={22} color='#FF6B6B' />
            <Text className='text-text-primary font-bold text-xl mt-2'>
              {wishListCount}
            </Text>
            <Text className='text-text-secondary text-xs'>Wishlist</Text>
          </View>
          <View className='bg-surface rounded-3xl p-4 flex-1 ml-2 items-center'>
            <Ionicons name='receipt' size={22} color='#FFC107' />
            <Text className='text-text-primary font-bold text-xl mt-2'>
              {orderCount}
            </Text>
            <Text className='text-text-secondary text-xs'>Orders</Text>
          </View>
        </View>

        {/* Menu */}
        <View className='mx-6 mt-6 bg-surface rounded-3xl overflow-hidden'>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              activeOpacity={0.7}
              className={`flex-row items-center px-5 py-4 ${
                idx !== menuItems.length - 1 ? 'border-b border-background-lighter' : ''
              }`}
            >
              <View
                className={`w-9 h-9 rounded-full items-center justify-center ${
                  item.danger ? 'bg-red-500/10' : 'bg-background'
                }`}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.danger ? '#FF6B6B' : '#fff'}
                />
              </View>
              <Text
                className={`flex-1 ml-4 font-semibold ${
                  item.danger ? 'text-red-400' : 'text-text-primary'
                }`}
              >
                {item.label}
              </Text>
              {!item.danger && (
                <Ionicons name='chevron-forward' size={18} color='#666' />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

export default ProfileScreen
