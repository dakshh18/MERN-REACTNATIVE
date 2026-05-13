import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ToastConfig } from 'react-native-toast-message'

type Variant = 'success' | 'error' | 'info'

const VARIANT_STYLES: Record<
  Variant,
  { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string }
> = {
  success: { icon: 'checkmark-circle', color: '#1DB954', bg: '#1DB95420' },
  error: { icon: 'alert-circle', color: '#FF6B6B', bg: '#FF6B6B20' },
  info: { icon: 'information-circle', color: '#00D9FF', bg: '#00D9FF20' },
}

const BaseToast = ({
  variant,
  text1,
  text2,
}: {
  variant: Variant
  text1?: string
  text2?: string
}) => {
  const { icon, color, bg } = VARIANT_STYLES[variant]
  return (
    <View
      className='mx-4 flex-row items-center bg-surface rounded-2xl px-4 py-3'
      style={{
        borderLeftWidth: 4,
        borderLeftColor: color,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <View
        className='w-9 h-9 rounded-full items-center justify-center mr-3'
        style={{ backgroundColor: bg }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View className='flex-1'>
        {text1 ? (
          <Text className='text-text-primary font-bold text-sm' numberOfLines={1}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text className='text-text-secondary text-xs mt-0.5' numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <BaseToast variant='success' text1={text1} text2={text2} />
  ),
  error: ({ text1, text2 }) => (
    <BaseToast variant='error' text1={text1} text2={text2} />
  ),
  info: ({ text1, text2 }) => (
    <BaseToast variant='info' text1={text1} text2={text2} />
  ),
}
