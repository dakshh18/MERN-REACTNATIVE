import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import SafeScreen from '@/components/SafeScreen'
import ScreenHeader from '@/components/ScreenHeader'
import { Ionicons } from '@expo/vector-icons'

const PaymentMethodsScreen = () => {
  return (
    <SafeScreen>
      <ScreenHeader title='Payment Methods' />

      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current method card */}
        <View className='bg-surface rounded-3xl p-5 mb-3'>
          <View className='flex-row items-center justify-between mb-2'>
            <Text className='text-text-secondary text-xs uppercase tracking-wider'>
              Active at checkout
            </Text>
            <View className='bg-primary/20 px-2 py-0.5 rounded-full'>
              <Text className='text-primary text-xs font-semibold'>Live</Text>
            </View>
          </View>
          <View className='flex-row items-center'>
            <View className='w-12 h-12 rounded-full bg-background items-center justify-center'>
              <Ionicons name='card' size={22} color='#00D9FF' />
            </View>
            <View className='flex-1 ml-3'>
              <Text className='text-text-primary font-bold'>Pay with Card</Text>
              <Text className='text-text-secondary text-xs mt-0.5'>
                Powered by Stripe · Tokenized & PCI compliant
              </Text>
            </View>
          </View>
        </View>

        <View className='bg-surface rounded-3xl p-5 mb-3'>
          <View className='flex-row items-center'>
            <View className='w-12 h-12 rounded-full bg-background items-center justify-center'>
              <Ionicons name='cash-outline' size={22} color='#1DB954' />
            </View>
            <View className='flex-1 ml-3'>
              <Text className='text-text-primary font-bold'>
                Cash on Delivery
              </Text>
              <Text className='text-text-secondary text-xs mt-0.5'>
                Available at checkout for eligible orders
              </Text>
            </View>
          </View>
        </View>

        {/* Saved cards (coming soon) */}
        <Text className='text-text-primary text-base font-bold mt-5 mb-2'>
          Saved Cards
        </Text>
        <View className='bg-surface rounded-3xl p-6 items-center'>
          <View className='w-14 h-14 rounded-full bg-background items-center justify-center mb-3'>
            <Ionicons name='lock-closed' size={22} color='#00D9FF' />
          </View>
          <Text className='text-text-primary font-bold text-base'>
            Save cards for one-tap checkout
          </Text>
          <Text className='text-text-secondary text-sm mt-2 text-center px-4'>
            We're working on letting you securely save cards with Stripe so you
            don't have to enter them each time.
          </Text>
          <View className='bg-primary/10 px-3 py-1.5 rounded-full mt-4'>
            <Text className='text-primary text-xs font-semibold'>
              Coming Soon
            </Text>
          </View>
        </View>

        {/* Wallets row */}
        <Text className='text-text-primary text-base font-bold mt-5 mb-2'>
          Other Payment Options
        </Text>
        <View className='bg-surface rounded-3xl p-4'>
          <PaymentRow icon='logo-google' label='Google Pay' status='Coming soon' />
          <Divider />
          <PaymentRow icon='logo-apple' label='Apple Pay' status='Coming soon' />
          <Divider />
          <PaymentRow icon='wallet-outline' label='Wallet Credit' status='Coming soon' />
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

const Divider = () => <View className='h-px bg-background-lighter my-2' />

interface PaymentRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  status: string
}

const PaymentRow: React.FC<PaymentRowProps> = ({ icon, label, status }) => (
  <View className='flex-row items-center py-2'>
    <View className='w-10 h-10 rounded-full bg-background items-center justify-center'>
      <Ionicons name={icon} size={20} color='#fff' />
    </View>
    <Text className='flex-1 ml-3 text-text-primary font-semibold'>{label}</Text>
    <Text className='text-text-secondary text-xs'>{status}</Text>
  </View>
)

export default PaymentMethodsScreen
