import React from 'react'
import { Stack } from 'expo-router'

const AccountLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#121212' },
      }}
    />
  )
}

export default AccountLayout
