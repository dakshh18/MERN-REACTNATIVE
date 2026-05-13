import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

interface CheckoutStepperProps {
  title: string
  step: 1 | 2 | 3
}

const STEPS = ['Address', 'Review', 'Done']

const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ title, step }) => {
  return (
    <View className='px-6 pt-6 pb-4'>
      <View className='flex-row items-center mb-5'>
        <TouchableOpacity
          onPress={() => router.back()}
          className='bg-surface w-10 h-10 rounded-full items-center justify-center mr-3'
          activeOpacity={0.7}
        >
          <Ionicons name='chevron-back' size={20} color='#fff' />
        </TouchableOpacity>
        <Text className='text-text-primary text-2xl font-bold tracking-tight'>
          {title}
        </Text>
      </View>

      <View className='flex-row items-center'>
        {STEPS.map((label, idx) => {
          const stepNum = idx + 1
          const isActive = stepNum === step
          const isDone = stepNum < step
          return (
            <React.Fragment key={label}>
              <View className='items-center'>
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isActive
                      ? 'bg-primary'
                      : isDone
                      ? 'bg-primary/30'
                      : 'bg-surface'
                  }`}
                >
                  {isDone ? (
                    <Ionicons name='checkmark' size={16} color='#1DB954' />
                  ) : (
                    <Text
                      className={`font-bold text-xs ${
                        isActive ? 'text-background' : 'text-text-secondary'
                      }`}
                    >
                      {stepNum}
                    </Text>
                  )}
                </View>
                <Text
                  className={`text-xs mt-1 ${
                    isActive
                      ? 'text-text-primary font-semibold'
                      : 'text-text-secondary'
                  }`}
                >
                  {label}
                </Text>
              </View>
              {idx < STEPS.length - 1 && (
                <View
                  className={`flex-1 h-0.5 mx-2 mb-5 ${
                    stepNum < step ? 'bg-primary/40' : 'bg-surface'
                  }`}
                />
              )}
            </React.Fragment>
          )
        })}
      </View>
    </View>
  )
}

export default CheckoutStepper
