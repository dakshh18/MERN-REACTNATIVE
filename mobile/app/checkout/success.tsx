import { View, Text, TouchableOpacity, Animated } from 'react-native'
import React, { useEffect, useRef } from 'react'
import SafeScreen from '@/components/SafeScreen'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'

const SuccessScreen = () => {
  const { orderId, total } = useLocalSearchParams<{ orderId: string; total: string }>()
  const scale = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 12,
      stiffness: 180,
      mass: 0.9,
      useNativeDriver: true,
    }).start()
  }, [scale])

  return (
    <SafeScreen>
      <View className='flex-1 items-center justify-center px-8'>
        <Animated.View
          style={{ transform: [{ scale }] }}
          className='w-28 h-28 rounded-full bg-primary/20 items-center justify-center mb-6'
        >
          <View className='w-20 h-20 rounded-full bg-primary items-center justify-center'>
            <Ionicons name='checkmark' size={48} color='#121212' />
          </View>
        </Animated.View>

        <Text className='text-text-primary text-3xl font-bold text-center'>
          Order Placed!
        </Text>
        <Text className='text-text-secondary text-base mt-2 text-center'>
          Thanks for your purchase. We&apos;ll let you know once it ships.
        </Text>

        <View className='bg-surface rounded-3xl p-5 mt-8 w-full'>
          <View className='flex-row justify-between items-center mb-3'>
            <Text className='text-text-secondary'>Order ID</Text>
            <Text className='text-text-primary font-semibold text-xs'>
              {orderId?.slice(-10).toUpperCase()}
            </Text>
          </View>
          <View className='h-px bg-background-lighter mb-3' />
          <View className='flex-row justify-between items-center'>
            <Text className='text-text-secondary'>Total</Text>
            <Text className='text-primary font-bold text-lg'>
              ${Number(total ?? 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View className='w-full mt-8 gap-3'>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
            className='bg-primary rounded-full py-4 items-center'
          >
            <Text className='text-background font-bold'>Continue Shopping</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/profile')}
            activeOpacity={0.7}
            className='bg-surface rounded-full py-4 items-center'
          >
            <Text className='text-text-primary font-bold'>View My Orders</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeScreen>
  )
}

export default SuccessScreen
