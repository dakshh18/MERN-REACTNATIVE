import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import React, { useMemo, useState } from 'react'
import SafeScreen from '@/components/SafeScreen'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import useProducts from '@/hooks/useProducts'
import useCart from '@/hooks/useCart'
import useWishList from '@/hooks/useWishList'
import Toast from 'react-native-toast-message'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type StockState = 'out' | 'low' | 'in'
const stockColors: Record<StockState, { bg: string; fg: string }> = {
  out: { bg: 'rgba(244, 67, 54, 0.18)', fg: '#F44336' },
  low: { bg: 'rgba(255, 193, 7, 0.18)', fg: '#FFC107' },
  in: { bg: 'rgba(29, 185, 84, 0.18)', fg: '#1DB954' },
}

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: products, isLoading } = useProducts()
  const { addToCart, isAddingToCart } = useCart()
  const {
    isInWishList,
    addToWishList,
    removeFromWishList,
    isAddingToWishList,
    isRemovingFromWishList,
  } = useWishList()

  const product = useMemo(
    () => products?.find((p) => p._id === id),
    [products, id]
  )

  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const onHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    if (idx !== activeImage) setActiveImage(idx)
  }

  if (isLoading) {
    return (
      <SafeScreen>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#00D9FF' />
        </View>
      </SafeScreen>
    )
  }

  if (!product) {
    return (
      <SafeScreen>
        <View className='flex-1 items-center justify-center px-6'>
          <Ionicons name='alert-circle-outline' size={48} color='#FF6B6B' />
          <Text className='text-text-primary font-semibold mt-4'>
            Product not found
          </Text>
          <Text className='text-text-secondary text-sm mt-2 text-center'>
            It may have been removed or the link is broken.
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

  const inWishlist = isInWishList(product._id)
  const wishlistPending = isAddingToWishList || isRemovingFromWishList
  const outOfStock = product.stock <= 0
  const lowStock = product.stock > 0 && product.stock <= 5
  const stockState: StockState = outOfStock ? 'out' : lowStock ? 'low' : 'in'
  const stockLabel = outOfStock
    ? 'Out of stock'
    : lowStock
      ? `Only ${product.stock} left`
      : 'In stock'
  const total = product.price * quantity

  const changeQty = (delta: number) => {
    setQuantity((q) => {
      const next = q + delta
      if (next < 1) return 1
      if (next > product.stock) return product.stock
      return next
    })
  }

  const onAddToCart = () => {
    if (outOfStock || isAddingToCart) return
    addToCart(
      { productId: product._id, quantity },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: `${quantity} × ${product.name} added to cart`,
            position: 'top',
            visibilityTime: 2000,
          })
        },
        onError: (error: any) => {
          Toast.show({
            type: 'error',
            text1: 'Could not add to cart',
            text2:
              error?.response?.data?.message ??
              error?.response?.data?.error ??
              'Please try again',
            position: 'top',
            visibilityTime: 2500,
          })
        },
      }
    )
  }

  const onToggleWishlist = () => {
    if (wishlistPending) return
    if (inWishlist) {
      removeFromWishList(product._id)
    } else {
      addToWishList(product._id)
    }
  }

  return (
    <SafeScreen>
      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image carousel */}
        <View className='relative'>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onHeroScroll}
            scrollEventThrottle={16}
          >
            {product.images.map((uri, idx) => (
              <Image
                key={`${product._id}-img-${idx}`}
                source={{ uri }}
                style={{ width: SCREEN_WIDTH, height: 360 }}
                resizeMode='cover'
              />
            ))}
          </ScrollView>

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className='absolute top-4 left-4 w-10 h-10 rounded-full items-center justify-center'
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            activeOpacity={0.7}
          >
            <Ionicons name='chevron-back' size={22} color='#fff' />
          </TouchableOpacity>

          {/* Wishlist button */}
          <TouchableOpacity
            onPress={onToggleWishlist}
            disabled={wishlistPending}
            className='absolute top-4 right-4 w-10 h-10 rounded-full items-center justify-center'
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            activeOpacity={0.7}
          >
            {wishlistPending ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <Ionicons
                name={inWishlist ? 'heart' : 'heart-outline'}
                size={20}
                color={inWishlist ? '#FF6B6B' : '#fff'}
              />
            )}
          </TouchableOpacity>

          {/* Pagination dots — only when there's more than one image */}
          {product.images.length > 1 && (
            <View className='absolute bottom-3 w-full flex-row items-center justify-center'>
              {product.images.map((_, idx) => (
                <View
                  key={`dot-${idx}`}
                  className='mx-1 h-1.5 rounded-full'
                  style={{
                    width: idx === activeImage ? 22 : 6,
                    backgroundColor:
                      idx === activeImage ? '#1DB954' : 'rgba(255,255,255,0.6)',
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Body */}
        <View className='px-6 pt-5'>
          {/* Category + stock pills */}
          <View className='flex-row items-center mb-3'>
            <View className='bg-surface px-3 py-1 rounded-full'>
              <Text className='text-text-secondary text-xs font-semibold'>
                {product.category}
              </Text>
            </View>
            <View
              className='ml-2 px-3 py-1 rounded-full'
              style={{ backgroundColor: stockColors[stockState].bg }}
            >
              <Text
                className='text-xs font-semibold'
                style={{ color: stockColors[stockState].fg }}
              >
                {stockLabel}
              </Text>
            </View>
          </View>

          {/* Name */}
          <Text className='text-text-primary text-2xl font-bold mb-2'>
            {product.name}
          </Text>

          {/* Rating + price */}
          <View className='flex-row items-center justify-between mb-5'>
            <View className='flex-row items-center'>
              <Ionicons name='star' size={16} color='#FFC107' />
              <Text className='text-text-primary text-sm font-semibold ml-1'>
                {product.averageRating.toFixed(1)}
              </Text>
              <Text className='text-text-secondary text-sm ml-1'>
                ({product.totalReviews}{' '}
                {product.totalReviews === 1 ? 'review' : 'reviews'})
              </Text>
            </View>
            <Text className='text-primary text-2xl font-bold'>
              ${product.price.toFixed(2)}
            </Text>
          </View>

          {/* Description */}
          <Text className='text-text-primary font-bold text-base mb-2'>
            About this product
          </Text>
          <Text className='text-text-secondary text-sm leading-5 mb-5'>
            {product.description}
          </Text>

          {/* Quantity selector (hidden when out of stock) */}
          {!outOfStock && (
            <View className='bg-surface rounded-3xl p-4 flex-row items-center justify-between'>
              <Text className='text-text-primary font-semibold'>Quantity</Text>
              <View className='flex-row items-center'>
                <TouchableOpacity
                  onPress={() => changeQty(-1)}
                  disabled={quantity <= 1}
                  activeOpacity={0.7}
                  className='w-9 h-9 rounded-full items-center justify-center'
                  style={{
                    backgroundColor: quantity <= 1 ? '#181818' : '#3E3E3E',
                  }}
                >
                  <Ionicons
                    name='remove'
                    size={18}
                    color={quantity <= 1 ? '#444' : '#fff'}
                  />
                </TouchableOpacity>
                <Text
                  className='text-text-primary font-bold text-lg mx-5 text-center'
                  style={{ minWidth: 24 }}
                >
                  {quantity}
                </Text>
                <TouchableOpacity
                  onPress={() => changeQty(1)}
                  disabled={quantity >= product.stock}
                  activeOpacity={0.7}
                  className='w-9 h-9 rounded-full items-center justify-center'
                  style={{
                    backgroundColor:
                      quantity >= product.stock ? '#181818' : '#3E3E3E',
                  }}
                >
                  <Ionicons
                    name='add'
                    size={18}
                    color={quantity >= product.stock ? '#444' : '#fff'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View
        className='absolute left-0 right-0 px-6 pb-8 pt-3 bg-background'
        style={{ bottom: 0 }}
      >
        <TouchableOpacity
          onPress={onAddToCart}
          disabled={outOfStock || isAddingToCart}
          activeOpacity={0.85}
          className={`rounded-full py-4 flex-row items-center justify-center ${
            outOfStock ? 'bg-surface' : 'bg-primary'
          }`}
        >
          {isAddingToCart ? (
            <ActivityIndicator color='#121212' />
          ) : outOfStock ? (
            <Text className='text-text-secondary font-bold'>Out of Stock</Text>
          ) : (
            <>
              <Ionicons name='bag-add' size={18} color='#121212' />
              <Text className='text-background font-bold text-base ml-2'>
                Add to Cart &middot; ${total.toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeScreen>
  )
}

export default ProductDetailScreen
