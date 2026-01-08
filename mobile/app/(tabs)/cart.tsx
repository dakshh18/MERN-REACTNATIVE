import { View, Text } from 'react-native'
import React from 'react'
import SafeScreen from '@/components/SafeScreen'

const CartScreen = () => {
  return (
    <SafeScreen>
      <Text className='text-text-primary'>cart</Text>
    </SafeScreen>
  )
}

export default CartScreen