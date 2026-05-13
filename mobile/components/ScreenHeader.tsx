import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  rightAction?: {
    icon: React.ComponentProps<typeof Ionicons>['name']
    onPress: () => void
    color?: string
  }
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, rightAction }) => (
  <View className='px-6 pt-6 pb-4 flex-row items-center justify-between'>
    <View className='flex-row items-center flex-1'>
      <TouchableOpacity
        onPress={() => router.back()}
        className='bg-surface w-10 h-10 rounded-full items-center justify-center mr-3'
        activeOpacity={0.7}
      >
        <Ionicons name='chevron-back' size={20} color='#fff' />
      </TouchableOpacity>
      <View className='flex-1'>
        <Text
          className='text-text-primary text-2xl font-bold tracking-tight'
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className='text-text-secondary text-xs mt-0.5' numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    {rightAction && (
      <TouchableOpacity
        onPress={rightAction.onPress}
        className='bg-surface w-10 h-10 rounded-full items-center justify-center'
        activeOpacity={0.7}
      >
        <Ionicons
          name={rightAction.icon}
          size={18}
          color={rightAction.color ?? '#fff'}
        />
      </TouchableOpacity>
    )}
  </View>
)

export default ScreenHeader
