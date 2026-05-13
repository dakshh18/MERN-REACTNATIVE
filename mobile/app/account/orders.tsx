import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native'
import React from 'react'
import SafeScreen from '@/components/SafeScreen'
import ScreenHeader from '@/components/ScreenHeader'
import useOrders from '@/hooks/useOrders'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Order, OrderItem } from '@/types'

const STATUS_STYLES: Record<
  Order['status'],
  { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  pending: {
    label: 'Pending',
    color: '#FFC107',
    bg: '#FFC10722',
    icon: 'time-outline',
  },
  shipped: {
    label: 'Shipped',
    color: '#00D9FF',
    bg: '#00D9FF22',
    icon: 'cube-outline',
  },
  delivered: {
    label: 'Delivered',
    color: '#1DB954',
    bg: '#1DB95422',
    icon: 'checkmark-circle-outline',
  },
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

const OrdersScreen = () => {
  const { orders, isLoading, isError, refetch } = useOrders()

  return (
    <SafeScreen>
      <ScreenHeader title='My Orders' subtitle={`${orders.length} orders`} />

      {isLoading ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#00D9FF' />
        </View>
      ) : isError ? (
        <View className='flex-1 items-center justify-center px-6'>
          <Ionicons name='alert-circle-outline' size={48} color='#FF6B6B' />
          <Text className='text-text-primary font-semibold mt-4'>
            Failed to load orders
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className='bg-primary rounded-full px-6 py-3 mt-6'
            activeOpacity={0.85}
          >
            <Text className='text-background font-bold'>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View className='flex-1 items-center justify-center px-6'>
          <Ionicons name='receipt-outline' size={56} color='#666' />
          <Text className='text-text-primary font-semibold mt-4 text-lg'>
            No orders yet
          </Text>
          <Text className='text-text-secondary text-sm mt-2 text-center'>
            Your purchases will appear here.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            className='bg-primary rounded-full px-6 py-3 mt-6'
            activeOpacity={0.85}
          >
            <Text className='text-background font-bold'>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className='flex-1'
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {orders.map((order) => {
            const status = STATUS_STYLES[order.status]
            const preview = order.orderItems.slice(0, 3)
            const remaining = order.orderItems.length - preview.length

            return (
              <TouchableOpacity
                key={order._id}
                onPress={() => router.push(`/account/orders/${order._id}`)}
                activeOpacity={0.85}
                className='bg-surface rounded-3xl p-4 mb-3'
              >
                <View className='flex-row items-center justify-between mb-3'>
                  <View>
                    <Text className='text-text-secondary text-xs'>
                      Order #{order._id.slice(-8).toUpperCase()}
                    </Text>
                    <Text className='text-text-primary font-semibold text-sm mt-0.5'>
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>
                  <View
                    className='flex-row items-center px-3 py-1 rounded-full'
                    style={{ backgroundColor: status.bg }}
                  >
                    <Ionicons name={status.icon} size={12} color={status.color} />
                    <Text
                      className='text-xs font-semibold ml-1'
                      style={{ color: status.color }}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>

                <View className='flex-row items-center mb-3'>
                  {preview.map((item, idx) => {
                    const img = itemImage(item)
                    return (
                      <View
                        key={item._id}
                        className='bg-background-lighter rounded-xl overflow-hidden'
                        style={{
                          width: 48,
                          height: 48,
                          marginLeft: idx === 0 ? 0 : -8,
                          borderWidth: 2,
                          borderColor: '#1E1E1E',
                        }}
                      >
                        {img ? (
                          <Image
                            source={{ uri: img }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode='cover'
                          />
                        ) : null}
                      </View>
                    )
                  })}
                  {remaining > 0 && (
                    <View
                      className='bg-background rounded-xl items-center justify-center'
                      style={{
                        width: 48,
                        height: 48,
                        marginLeft: -8,
                        borderWidth: 2,
                        borderColor: '#1E1E1E',
                      }}
                    >
                      <Text className='text-text-primary text-xs font-bold'>
                        +{remaining}
                      </Text>
                    </View>
                  )}
                </View>

                <View className='flex-row items-center justify-between'>
                  <Text className='text-text-secondary text-xs'>
                    {order.orderItems.length}{' '}
                    {order.orderItems.length === 1 ? 'item' : 'items'}
                  </Text>
                  <Text className='text-primary font-bold text-base'>
                    ${order.totalPrice.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}
    </SafeScreen>
  )
}

export default OrdersScreen
