import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import React, { useMemo, useState } from 'react'
import SafeScreen from '@/components/SafeScreen'
import CheckoutStepper from '@/components/CheckoutStepper'
import { router, useLocalSearchParams } from 'expo-router'
import useCart from '@/hooks/useCart'
import useAddresses from '@/hooks/useAddresses'
import useOrders from '@/hooks/useOrders'
import usePayment from '@/hooks/usePayment'
import Toast from 'react-native-toast-message'
import { Ionicons } from '@expo/vector-icons'
import ConfirmModal from '@/components/ConfirmModal'

const SHIPPING_FEE = 5

type PaymentMethod = 'card' | 'cod'

const ReviewScreen = () => {
  const { addressId } = useLocalSearchParams<{ addressId: string }>()
  const { items, subtotal, isLoading: cartLoading } = useCart()
  const { addresses, isLoading: addrLoading } = useAddresses()
  const { createOrder, isCreatingOrder } = useOrders()
  const { payForCart, isPaying } = usePayment()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [showCodConfirm, setShowCodConfirm] = useState(false)

  const address = useMemo(
    () => addresses.find((a) => a._id === addressId),
    [addresses, addressId]
  )

  const total = subtotal + (items.length > 0 ? SHIPPING_FEE : 0)
  const isBusy = isCreatingOrder || isPaying

  const shippingPayload = address
    ? {
        fullName: address.fullName,
        streetAddress: address.streetAddress,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        phoneNumber: address.phoneNumber,
      }
    : null

  const finalizeOrder = async (paymentIntentId?: string) => {
    if (!shippingPayload) return
    try {
      const order = await createOrder({
        shippingAddress: shippingPayload,
        paymentIntentId,
      })
      router.replace({
        pathname: '/checkout/success',
        params: { orderId: order._id, total: order.totalPrice.toString() },
      })
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Order failed',
        text2:
          err?.response?.data?.message ??
          err?.message ??
          'Something went wrong. Try again.',
        position: 'top',
        visibilityTime: 2800,
      })
    }
  }

  const handlePayWithCard = async () => {
    if (!address) return
    const result = await payForCart()
    if (!result.ok) {
      if (!result.canceled) {
        Toast.show({
          type: 'error',
          text1: 'Payment failed',
          text2: result.message,
          position: 'top',
          visibilityTime: 2800,
        })
      }
      return
    }
    await finalizeOrder(result.paymentIntentId)
  }

  const handleCodConfirm = async () => {
    setShowCodConfirm(false)
    await finalizeOrder()
  }

  const handlePlaceOrder = () => {
    if (!address || items.length === 0 || isBusy) return
    if (paymentMethod === 'card') {
      handlePayWithCard()
    } else {
      setShowCodConfirm(true)
    }
  }

  if (cartLoading || addrLoading) {
    return (
      <SafeScreen>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#00D9FF' />
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen>
      <CheckoutStepper title='Review Order' step={2} />

      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Address card */}
        <View className='flex-row items-center justify-between mb-2'>
          <Text className='text-text-primary text-base font-bold'>
            Shipping Address
          </Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text className='text-primary text-xs font-semibold'>Change</Text>
          </TouchableOpacity>
        </View>
        {address ? (
          <View className='bg-surface rounded-3xl p-4 mb-5'>
            <View className='flex-row items-center mb-1'>
              <Ionicons name='location' size={16} color='#1DB954' />
              <Text className='text-text-primary font-bold ml-2'>
                {address.label}
              </Text>
            </View>
            <Text className='text-text-primary text-sm mt-1'>
              {address.fullName}
            </Text>
            <Text className='text-text-secondary text-sm'>
              {address.streetAddress}, {address.city}, {address.state}{' '}
              {address.zipCode}
            </Text>
            <Text className='text-text-secondary text-sm'>
              {address.phoneNumber}
            </Text>
          </View>
        ) : (
          <View className='bg-surface rounded-3xl p-4 mb-5'>
            <Text className='text-text-secondary text-sm'>
              No address selected.
            </Text>
          </View>
        )}

        {/* Items */}
        <Text className='text-text-primary text-base font-bold mb-2'>
          Items ({items.length})
        </Text>
        {items.map((item) => (
          <View
            key={item._id}
            className='bg-surface rounded-3xl p-3 mb-2 flex-row items-center'
          >
            <Image
              source={{ uri: item.product.images[0] }}
              className='w-14 h-14 rounded-xl bg-background-lighter'
              resizeMode='cover'
            />
            <View className='flex-1 ml-3'>
              <Text
                className='text-text-primary font-semibold text-sm'
                numberOfLines={1}
              >
                {item.product.name}
              </Text>
              <Text className='text-text-secondary text-xs mt-0.5'>
                Qty {item.quantity} · ${item.product.price.toFixed(2)}
              </Text>
            </View>
            <Text className='text-primary font-bold'>
              ${(item.product.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Payment method picker */}
        <Text className='text-text-primary text-base font-bold mt-5 mb-2'>
          Payment Method
        </Text>
        <PaymentOption
          icon='card'
          color='#00D9FF'
          title='Pay with Card'
          subtitle='Visa, Mastercard, Google Pay, Apple Pay'
          selected={paymentMethod === 'card'}
          onPress={() => setPaymentMethod('card')}
        />
        <PaymentOption
          icon='cash-outline'
          color='#1DB954'
          title='Cash on Delivery'
          subtitle='Pay when you receive your order'
          selected={paymentMethod === 'cod'}
          onPress={() => setPaymentMethod('cod')}
        />

        {/* Totals */}
        <View className='bg-surface rounded-3xl p-4 mt-5'>
          <View className='flex-row justify-between mb-2'>
            <Text className='text-text-secondary'>Subtotal</Text>
            <Text className='text-text-primary font-semibold'>
              ${subtotal.toFixed(2)}
            </Text>
          </View>
          <View className='flex-row justify-between mb-3'>
            <Text className='text-text-secondary'>Shipping</Text>
            <Text className='text-text-primary font-semibold'>
              ${(items.length > 0 ? SHIPPING_FEE : 0).toFixed(2)}
            </Text>
          </View>
          <View className='h-px bg-background-lighter mb-3' />
          <View className='flex-row justify-between'>
            <Text className='text-text-primary text-lg font-bold'>Total</Text>
            <Text className='text-primary text-lg font-bold'>
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Place order bar */}
      <View
        className='absolute left-0 right-0 px-6 pb-8 pt-3 bg-background'
        style={{ bottom: 0 }}
      >
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={!address || items.length === 0 || isBusy}
          activeOpacity={0.85}
          className={`rounded-full py-4 items-center flex-row justify-center ${
            address && items.length > 0 && !isBusy ? 'bg-primary' : 'bg-surface'
          }`}
        >
          {isBusy ? (
            <ActivityIndicator color='#121212' />
          ) : (
            <Text
              className={`font-bold text-base ${
                address && items.length > 0
                  ? 'text-background'
                  : 'text-text-secondary'
              }`}
            >
              {paymentMethod === 'card'
                ? `Pay $${total.toFixed(2)}`
                : `Place Order · $${total.toFixed(2)}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={showCodConfirm}
        title='Place this order?'
        message={`Your order of $${total.toFixed(
          2
        )} will be sent for processing. Payment will be collected on delivery.`}
        confirmLabel='Place Order'
        cancelLabel='Cancel'
        variant='info'
        isLoading={isCreatingOrder}
        onConfirm={handleCodConfirm}
        onCancel={() => setShowCodConfirm(false)}
      />
    </SafeScreen>
  )
}

interface PaymentOptionProps {
  icon: React.ComponentProps<typeof Ionicons>['name']
  color: string
  title: string
  subtitle: string
  selected: boolean
  onPress: () => void
}

const PaymentOption: React.FC<PaymentOptionProps> = ({
  icon,
  color,
  title,
  subtitle,
  selected,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className={`bg-surface rounded-3xl p-4 mb-2 flex-row items-center ${
      selected ? 'border-2 border-primary' : ''
    }`}
  >
    <View
      className='w-10 h-10 rounded-full items-center justify-center'
      style={{ backgroundColor: `${color}22` }}
    >
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View className='flex-1 ml-3'>
      <Text className='text-text-primary font-semibold text-sm'>{title}</Text>
      <Text className='text-text-secondary text-xs mt-0.5'>{subtitle}</Text>
    </View>
    <View
      className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
        selected ? 'border-primary' : 'border-text-secondary'
      }`}
    >
      {selected && <View className='w-3 h-3 rounded-full bg-primary' />}
    </View>
  </TouchableOpacity>
)

export default ReviewScreen
