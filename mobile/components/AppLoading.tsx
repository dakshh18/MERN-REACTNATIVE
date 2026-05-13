import { View, Text, Image, Animated, Easing } from 'react-native'
import React, { useEffect, useRef } from 'react'

const AppLoading: React.FC = () => {
  const pulse = useRef(new Animated.Value(0)).current
  const rotate = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start()

    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()
  }, [pulse, rotate])

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  })
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.55],
  })
  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  })
  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View className='flex-1 bg-background items-center justify-center'>
      <View className='items-center justify-center' style={{ width: 200, height: 200 }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: '#1DB954',
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          }}
        />

        <Animated.View
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            transform: [{ rotate: spin }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 84,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#00D9FF',
            }}
          />
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ scale }],
            shadowColor: '#1DB954',
            shadowOpacity: 0.5,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
            elevation: 12,
          }}
        >
          <Image
            source={require('../assets/images/auth-image.png')}
            style={{ width: 120, height: 120, borderRadius: 28 }}
            resizeMode='contain'
          />
        </Animated.View>
      </View>

      <Text className='text-text-primary text-2xl font-bold mt-8 tracking-tight'>
        Mern Shop
      </Text>
      <Text className='text-text-secondary text-sm mt-1'>
        Getting things ready…
      </Text>
    </View>
  )
}

export default AppLoading
