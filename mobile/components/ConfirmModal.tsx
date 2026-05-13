import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native'
import React, { useEffect, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'

type Variant = 'danger' | 'warning' | 'info'

interface ConfirmModalProps {
  visible: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: Variant
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const VARIANT: Record<
  Variant,
  { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string }
> = {
  danger: { icon: 'trash', color: '#FF6B6B', bg: '#FF6B6B22' },
  warning: { icon: 'alert', color: '#FFC107', bg: '#FFC10722' },
  info: { icon: 'information', color: '#00D9FF', bg: '#00D9FF22' },
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const fade = useRef(new Animated.Value(0)).current
  const slide = useRef(new Animated.Value(40)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          damping: 18,
          stiffness: 160,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      fade.setValue(0)
      slide.setValue(40)
    }
  }, [visible, fade, slide])

  const v = VARIANT[variant]

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Animated.View style={{ flex: 1, opacity: fade }}>
        <TouchableWithoutFeedback onPress={isLoading ? undefined : onCancel}>
          <BlurView
            intensity={30}
            tint='dark'
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.55)',
              justifyContent: 'center',
              paddingHorizontal: 24,
            }}
          >
            <TouchableWithoutFeedback>
              <Animated.View
                className='bg-surface rounded-3xl p-6'
                style={{
                  transform: [{ translateY: slide }],
                  shadowColor: '#000',
                  shadowOpacity: 0.4,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 16,
                }}
              >
                <View
                  className='self-center w-16 h-16 rounded-full items-center justify-center mb-4'
                  style={{ backgroundColor: v.bg }}
                >
                  <Ionicons name={v.icon} size={28} color={v.color} />
                </View>
                <Text className='text-text-primary text-center font-bold text-xl'>
                  {title}
                </Text>
                {message ? (
                  <Text className='text-text-secondary text-center text-sm mt-2 leading-5'>
                    {message}
                  </Text>
                ) : null}

                <View className='flex-row gap-3 mt-6'>
                  <TouchableOpacity
                    onPress={onCancel}
                    disabled={isLoading}
                    activeOpacity={0.7}
                    className='flex-1 bg-background rounded-full py-3.5 items-center'
                  >
                    <Text className='text-text-primary font-bold'>{cancelLabel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onConfirm}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    className='flex-1 rounded-full py-3.5 items-center'
                    style={{ backgroundColor: v.color }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color='#fff' size='small' />
                    ) : (
                      <Text className='text-white font-bold'>{confirmLabel}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </BlurView>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  )
}

export default ConfirmModal
