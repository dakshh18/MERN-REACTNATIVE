import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native'
import React, { useState } from 'react'
import SafeScreen from '@/components/SafeScreen'
import ScreenHeader from '@/components/ScreenHeader'
import useWishList from '@/hooks/useWishList'
import useCart from '@/hooks/useCart'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { Product } from '@/types'

const WishlistScreen = () => {
  const { wishlist, isLoading, isError, removeFromWishList } = useWishList()
  const { addToCart } = useCart()
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [pendingCartId, setPendingCartId] = useState<string | null>(null)

  const handleRemove = (product: Product) => {
    setPendingRemoveId(product._id)
    removeFromWishList(product._id, {
      onSuccess: () =>
        Toast.show({
          type: 'success',
          text1: 'Removed from wishlist',
          text2: product.name,
          position: 'top',
          visibilityTime: 1600,
        }),
      onError: () =>
        Toast.show({
          type: 'error',
          text1: 'Could not remove',
          position: 'top',
        }),
      onSettled: () => setPendingRemoveId(null),
    } as any)
  }

  const handleAddToCart = (product: Product) => {
    setPendingCartId(product._id)
    addToCart(
      { productId: product._id, quantity: 1 },
      {
        onSuccess: () =>
          Toast.show({
            type: 'success',
            text1: 'Added to cart',
            text2: product.name,
            position: 'top',
            visibilityTime: 1600,
          }),
        onError: (err: any) =>
          Toast.show({
            type: 'error',
            text1: 'Could not add to cart',
            text2: err?.response?.data?.message ?? 'Try again',
            position: 'top',
          }),
        onSettled: () => setPendingCartId(null),
      }
    )
  }

  return (
    <SafeScreen>
      <ScreenHeader
        title='My Wishlist'
        subtitle={`${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'} saved`}
      />

      {isLoading ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#00D9FF' />
        </View>
      ) : isError ? (
        <View className='flex-1 items-center justify-center px-6'>
          <Ionicons name='alert-circle-outline' size={48} color='#FF6B6B' />
          <Text className='text-text-primary font-semibold mt-4'>
            Failed to load wishlist
          </Text>
        </View>
      ) : wishlist.length === 0 ? (
        <View className='flex-1 items-center justify-center px-6'>
          <Ionicons name='heart-outline' size={64} color='#666' />
          <Text className='text-text-primary font-semibold mt-4 text-lg'>
            Your wishlist is empty
          </Text>
          <Text className='text-text-secondary text-sm mt-2 text-center'>
            Tap the heart on any product to save it here.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            className='bg-primary rounded-full px-6 py-3 mt-6'
            activeOpacity={0.85}
          >
            <Text className='text-background font-bold'>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className='flex-1'
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className='flex-row flex-wrap justify-between'>
            {wishlist.map((product) => (
              <TouchableOpacity
                key={product._id}
                onPress={() => router.push(`/product/${product._id}`)}
                activeOpacity={0.85}
                className='bg-surface rounded-3xl overflow-hidden mb-3'
                style={{ width: '48%' }}
              >
                <View className='relative'>
                  <Image
                    source={{ uri: product.images[0] }}
                    className='w-full h-44 bg-background-lighter'
                    resizeMode='cover'
                  />
                  <TouchableOpacity
                    onPress={() => handleRemove(product)}
                    disabled={pendingRemoveId === product._id}
                    activeOpacity={0.7}
                    className='absolute top-3 right-3 bg-black/40 p-2 rounded-full'
                  >
                    {pendingRemoveId === product._id ? (
                      <ActivityIndicator size='small' color='#FF6B6B' />
                    ) : (
                      <Ionicons name='heart' size={18} color='#FF6B6B' />
                    )}
                  </TouchableOpacity>
                </View>

                <View className='p-3'>
                  <Text className='text-text-secondary text-xs mb-1'>
                    {product.category}
                  </Text>
                  <Text
                    className='text-text-primary font-bold text-sm mb-2'
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>

                  <View className='flex-row items-center justify-between'>
                    <Text className='text-primary font-bold text-lg'>
                      ${product.price.toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleAddToCart(product)}
                      disabled={pendingCartId === product._id}
                      activeOpacity={0.7}
                      className='bg-primary rounded-full w-8 h-8 items-center justify-center'
                    >
                      {pendingCartId === product._id ? (
                        <ActivityIndicator size='small' color='#121212' />
                      ) : (
                        <Ionicons name='cart' size={16} color='#121212' />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeScreen>
  )
}

export default WishlistScreen
