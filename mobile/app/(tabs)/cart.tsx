import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import React, { useState } from 'react'
import SafeScreen from '@/components/SafeScreen'
import useCart from '@/hooks/useCart'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { CartItem } from '@/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import ConfirmModal from '@/components/ConfirmModal'

const TAB_BAR_HEIGHT = 50

const CartScreen = () => {
  const insets = useSafeAreaInsets()
  const {
    items,
    itemCount,
    subtotal,
    isLoading,
    isError,
    refetch,
    updateQuantity,
    isUpdatingQuantity,
    removeFromCart,
    isRemovingFromCart,
    clearCart,
    isClearingCart,
  } = useCart()

  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const SHIPPING_FEE = items.length > 0 ? 5 : 0
  const total = subtotal + SHIPPING_FEE
  // floating pill nav: bottom = insets.bottom, height = 50 + insets.bottom → clears at 50 + 2*insets.bottom + small gap
  const tabBarSpace = TAB_BAR_HEIGHT + insets.bottom * 2 + 12

  const handleIncrement = (item: CartItem) => {
    if (item.quantity >= item.product.stock) {
      Toast.show({
        type: 'error',
        text1: 'Out of stock',
        text2: `Only ${item.product.stock} available`,
        position: 'top',
        visibilityTime: 2000,
      })
      return
    }
    updateQuantity({ productId: item.product._id, quantity: item.quantity + 1 })
  }

  const handleDecrement = (item: CartItem) => {
    if (item.quantity <= 1) {
      setRemoveTarget(item)
      return
    }
    updateQuantity({ productId: item.product._id, quantity: item.quantity - 1 })
  }

  const confirmRemove = () => {
    if (!removeTarget) return
    const target = removeTarget
    removeFromCart(target.product._id, {
      onSuccess: () => {
        setRemoveTarget(null)
        Toast.show({
          type: 'success',
          text1: 'Removed from cart',
          text2: target.product.name,
          position: 'top',
          visibilityTime: 1800,
        })
      },
      onError: () => {
        setRemoveTarget(null)
        Toast.show({
          type: 'error',
          text1: 'Could not remove item',
          position: 'top',
          visibilityTime: 1800,
        })
      },
    })
  }

  const confirmClearCart = () => {
    clearCart(undefined, {
      onSuccess: () => {
        setShowClearConfirm(false)
        Toast.show({
          type: 'success',
          text1: 'Cart cleared',
          position: 'top',
          visibilityTime: 1500,
        })
      },
      onError: () => {
        setShowClearConfirm(false)
        Toast.show({
          type: 'error',
          text1: 'Could not clear cart',
          position: 'top',
          visibilityTime: 1800,
        })
      },
    })
  }

  if (isLoading) {
    return (
      <SafeScreen>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#00D9FF' />
          <Text className='text-text-secondary mt-4'>Loading your cart...</Text>
        </View>
      </SafeScreen>
    )
  }

  if (isError) {
    return (
      <SafeScreen>
        <View className='flex-1 items-center justify-center px-6'>
          <Ionicons name='alert-circle-outline' size={48} color='#FF6B6B' />
          <Text className='text-text-primary font-semibold mt-4'>Failed to load cart</Text>
          <Text className='text-text-secondary text-sm mt-2 text-center'>
            Check your connection and try again.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className='bg-primary rounded-full px-6 py-3 mt-6'
            activeOpacity={0.8}
          >
            <Text className='text-background font-bold'>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    )
  }

  return (
    <SafeScreen>
      {/* Header */}
      <View className='px-6 pb-4 pt-6 flex-row items-center justify-between'>
        <View>
          <Text className='text-text-primary text-3xl font-bold tracking-tighter'>Cart</Text>
          <Text className='text-text-secondary text-sm mt-1 ml-2'>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowClearConfirm(true)}
            className='bg-surface/50 p-3 rounded-full'
            activeOpacity={0.6}
            disabled={isClearingCart}
          >
            {isClearingCart ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <Ionicons name='trash-outline' size={20} color='#FF6B6B' />
            )}
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View className='flex-1 items-center justify-center px-6'>
          <Ionicons name='cart-outline' size={64} color='#666' />
          <Text className='text-text-primary font-semibold text-lg mt-4'>
            Your cart is empty
          </Text>
          <Text className='text-text-secondary text-sm mt-2 text-center'>
            Start shopping to add items to your cart.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            className='bg-primary rounded-full px-6 py-3 mt-6'
            activeOpacity={0.8}
          >
            <Text className='text-background font-bold'>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            className='flex-1'
            contentContainerStyle={{
              paddingBottom: 240 + tabBarSpace,
              paddingHorizontal: 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <View
                key={item._id}
                className='bg-surface rounded-3xl p-3 mb-3 flex-row'
              >
                <TouchableOpacity
                  onPress={() => router.push(`/product/${item.product._id}`)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: item.product.images[0] }}
                    className='w-24 h-24 rounded-2xl bg-background-lighter'
                    resizeMode='cover'
                  />
                </TouchableOpacity>

                <View className='flex-1 ml-3 justify-between'>
                  <View className='flex-row items-start justify-between'>
                    <View className='flex-1 mr-2'>
                      <Text className='text-text-secondary text-xs mb-1'>
                        {item.product.category}
                      </Text>
                      <Text
                        className='text-text-primary font-bold text-sm'
                        numberOfLines={2}
                      >
                        {item.product.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setRemoveTarget(item)}
                      disabled={isRemovingFromCart}
                      hitSlop={8}
                    >
                      <Ionicons name='close' size={20} color='#666' />
                    </TouchableOpacity>
                  </View>

                  <View className='flex-row items-center justify-between mt-2'>
                    <Text className='text-primary font-bold text-lg'>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </Text>

                    <View className='flex-row items-center bg-background rounded-full'>
                      <TouchableOpacity
                        onPress={() => handleDecrement(item)}
                        disabled={isUpdatingQuantity || isRemovingFromCart}
                        className='w-8 h-8 items-center justify-center'
                        activeOpacity={0.7}
                      >
                        <Ionicons name='remove' size={16} color='#fff' />
                      </TouchableOpacity>
                      <Text className='text-text-primary font-bold w-6 text-center'>
                        {item.quantity}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleIncrement(item)}
                        disabled={isUpdatingQuantity}
                        className='w-8 h-8 items-center justify-center'
                        activeOpacity={0.7}
                      >
                        <Ionicons name='add' size={16} color='#fff' />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Summary + checkout */}
          <View
            className='absolute left-0 right-0 bg-surface rounded-t-3xl px-6 pt-5 pb-5'
            style={{
              bottom: tabBarSpace,
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: -4 },
              elevation: 12,
            }}
          >
            <View className='flex-row justify-between mb-2'>
              <Text className='text-text-secondary'>Subtotal</Text>
              <Text className='text-text-primary font-semibold'>
                ${subtotal.toFixed(2)}
              </Text>
            </View>
            <View className='flex-row justify-between mb-3'>
              <Text className='text-text-secondary'>Shipping</Text>
              <Text className='text-text-primary font-semibold'>
                ${SHIPPING_FEE.toFixed(2)}
              </Text>
            </View>
            <View className='h-px bg-background-lighter mb-3' />
            <View className='flex-row justify-between mb-5'>
              <Text className='text-text-primary text-lg font-bold'>Total</Text>
              <Text className='text-primary text-lg font-bold'>
                ${total.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              className='bg-primary rounded-full py-4 items-center'
              activeOpacity={0.8}
              onPress={() => router.push('/checkout/address')}
            >
              <Text className='text-background font-bold text-base'>
                Checkout · ${total.toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ConfirmModal
        visible={!!removeTarget}
        title='Remove item?'
        message={
          removeTarget
            ? `${removeTarget.product.name} will be removed from your cart.`
            : undefined
        }
        confirmLabel='Remove'
        variant='danger'
        isLoading={isRemovingFromCart}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />

      <ConfirmModal
        visible={showClearConfirm}
        title='Clear your cart?'
        message='This will remove all items from your cart. This cannot be undone.'
        confirmLabel='Clear all'
        variant='danger'
        isLoading={isClearingCart}
        onConfirm={confirmClearCart}
        onCancel={() => setShowClearConfirm(false)}
      />
    </SafeScreen>
  )
}

export default CartScreen
