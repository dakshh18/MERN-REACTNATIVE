import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import React, { useMemo } from 'react'
import SafeScreen from '@/components/SafeScreen'
import ScreenHeader from '@/components/ScreenHeader'
import useOrders from '@/hooks/useOrders'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Order, OrderItem } from '@/types'

const STATUS_STAGES: { key: Order['status']; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'pending', label: 'Order Placed', icon: 'receipt' },
  { key: 'shipped', label: 'Shipped', icon: 'cube' },
  { key: 'delivered', label: 'Delivered', icon: 'home' },
]

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

const itemImage = (item: OrderItem): string => {
  if (item.image) return item.image
  if (typeof item.product === 'object' && item.product?.images?.[0]) {
    return item.product.images[0]
  }
  return ''
}

const OrderDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { orders, isLoading } = useOrders()

  const order = useMemo(() => orders.find((o) => o._id === id), [orders, id])

  if (isLoading) {
    return (
      <SafeScreen>
        <ScreenHeader title='Order' />
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#00D9FF' />
        </View>
      </SafeScreen>
    )
  }

  if (!order) {
    return (
      <SafeScreen>
        <ScreenHeader title='Order' />
        <View className='flex-1 items-center justify-center px-6'>
          <Ionicons name='alert-circle-outline' size={48} color='#FF6B6B' />
          <Text className='text-text-primary font-semibold mt-4'>
            Order not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className='bg-primary rounded-full px-6 py-3 mt-6'
            activeOpacity={0.85}
          >
            <Text className='text-background font-bold'>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    )
  }

  const currentStageIdx = STATUS_STAGES.findIndex((s) => s.key === order.status)
  const itemsSubtotal = order.orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const shipping = Math.max(order.totalPrice - itemsSubtotal, 0)
  const paymentLabel =
    order.paymentResult?.id === 'cod' ? 'Cash on Delivery' : 'Card'
  const paymentStatus = order.paymentResult?.status ?? 'pending'

  return (
    <SafeScreen>
      <ScreenHeader
        title={`Order #${order._id.slice(-8).toUpperCase()}`}
        subtitle={formatDate(order.createdAt)}
      />

      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status timeline */}
        <View className='bg-surface rounded-3xl p-5 mb-4'>
          <Text className='text-text-primary font-bold text-sm mb-4'>
            Order Status
          </Text>
          <View className='flex-row items-start'>
            {STATUS_STAGES.map((stage, idx) => {
              const isActive = idx === currentStageIdx
              const isDone = idx < currentStageIdx
              const isFuture = idx > currentStageIdx
              return (
                <React.Fragment key={stage.key}>
                  <View className='items-center' style={{ width: 70 }}>
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        isActive
                          ? 'bg-primary'
                          : isDone
                          ? 'bg-primary/30'
                          : 'bg-background'
                      }`}
                    >
                      <Ionicons
                        name={stage.icon}
                        size={18}
                        color={
                          isActive ? '#121212' : isDone ? '#1DB954' : '#666'
                        }
                      />
                    </View>
                    <Text
                      className={`text-xs mt-2 text-center ${
                        isFuture
                          ? 'text-text-secondary'
                          : 'text-text-primary font-semibold'
                      }`}
                    >
                      {stage.label}
                    </Text>
                  </View>
                  {idx < STATUS_STAGES.length - 1 && (
                    <View
                      className={`flex-1 h-0.5 ${
                        idx < currentStageIdx ? 'bg-primary/40' : 'bg-background'
                      }`}
                      style={{ marginTop: 20 }}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </View>

          {(order.shippedAt || order.deliveredAt) && (
            <View className='mt-4 pt-4 border-t border-background-lighter'>
              {order.shippedAt && (
                <Text className='text-text-secondary text-xs'>
                  Shipped on {formatDate(order.shippedAt)}
                </Text>
              )}
              {order.deliveredAt && (
                <Text className='text-text-secondary text-xs mt-1'>
                  Delivered on {formatDate(order.deliveredAt)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Items */}
        <Text className='text-text-primary text-base font-bold mb-2'>
          Items ({order.orderItems.length})
        </Text>
        {order.orderItems.map((item) => {
          const img = itemImage(item)
          return (
            <View
              key={item._id}
              className='bg-surface rounded-3xl p-3 mb-2 flex-row items-center'
            >
              <View className='w-14 h-14 rounded-xl overflow-hidden bg-background-lighter'>
                {img ? (
                  <Image
                    source={{ uri: img }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode='cover'
                  />
                ) : null}
              </View>
              <View className='flex-1 ml-3'>
                <Text
                  className='text-text-primary font-semibold text-sm'
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text className='text-text-secondary text-xs mt-0.5'>
                  Qty {item.quantity} · ${item.price.toFixed(2)}
                </Text>
              </View>
              <Text className='text-primary font-bold'>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          )
        })}

        {/* Shipping address */}
        <Text className='text-text-primary text-base font-bold mt-5 mb-2'>
          Shipping Address
        </Text>
        <View className='bg-surface rounded-3xl p-4'>
          <Text className='text-text-primary font-semibold'>
            {order.shippingAddress.fullName}
          </Text>
          <Text className='text-text-secondary text-sm mt-1'>
            {order.shippingAddress.streetAddress}, {order.shippingAddress.city},{' '}
            {order.shippingAddress.state} {order.shippingAddress.zipCode}
          </Text>
          <Text className='text-text-secondary text-sm'>
            {order.shippingAddress.phoneNumber}
          </Text>
        </View>

        {/* Payment */}
        <Text className='text-text-primary text-base font-bold mt-5 mb-2'>
          Payment
        </Text>
        <View className='bg-surface rounded-3xl p-4 flex-row items-center'>
          <View className='w-10 h-10 rounded-full bg-background items-center justify-center'>
            <Ionicons
              name={paymentLabel === 'Card' ? 'card' : 'cash-outline'}
              size={20}
              color={paymentLabel === 'Card' ? '#00D9FF' : '#1DB954'}
            />
          </View>
          <View className='flex-1 ml-3'>
            <Text className='text-text-primary font-semibold text-sm'>
              {paymentLabel}
            </Text>
            <Text className='text-text-secondary text-xs mt-0.5 capitalize'>
              {paymentStatus}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <View className='bg-surface rounded-3xl p-4 mt-5'>
          <View className='flex-row justify-between mb-2'>
            <Text className='text-text-secondary'>Items Subtotal</Text>
            <Text className='text-text-primary font-semibold'>
              ${itemsSubtotal.toFixed(2)}
            </Text>
          </View>
          <View className='flex-row justify-between mb-3'>
            <Text className='text-text-secondary'>Shipping</Text>
            <Text className='text-text-primary font-semibold'>
              ${shipping.toFixed(2)}
            </Text>
          </View>
          <View className='h-px bg-background-lighter mb-3' />
          <View className='flex-row justify-between'>
            <Text className='text-text-primary text-lg font-bold'>Total</Text>
            <Text className='text-primary text-lg font-bold'>
              ${order.totalPrice.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

export default OrderDetailScreen
