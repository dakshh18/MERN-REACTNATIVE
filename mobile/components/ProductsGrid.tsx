import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { Product } from '@/types';
import useWishList from '@/hooks/useWishList';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import useCart from '@/hooks/useCart';
import Toast from 'react-native-toast-message';

interface ProductGridProps {
  isLoading: boolean;
  isError: boolean;
  products: Product[];
}

const ProductsGrid = ({ products, isLoading, isError }: ProductGridProps) => {

  const { isInWishList, addToWishList, removeFromWishList } = useWishList();
  const { addToCart } = useCart();
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [pendingWishlistId, setPendingWishlistId] = useState<string | null>(null);

  const handleToggleWishlist = (productId: string) => {
    if (pendingWishlistId) return;
    setPendingWishlistId(productId);
    const alreadyIn = isInWishList(productId);
    const mutate = alreadyIn ? removeFromWishList : addToWishList;
    mutate(productId, {
      onSettled: () => setPendingWishlistId(null),
    } as any);
  };

  const handleAddToCart = (productId: string, productName: string) => {
    setPendingProductId(productId);
    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: 'Added to cart',
            text2: productName,
            position: 'top',
            visibilityTime: 2000,
          });
        },
        onError: (error: any) => {
          Toast.show({
            type: 'error',
            text1: 'Failed to add to cart',
            text2: error?.response?.data?.message || error?.response?.data?.error || 'Please try again',
            position: 'top',
            visibilityTime: 2500,
          });
        },
        onSettled: () => setPendingProductId(null),
      }
    );
  }

  const renderProduct = ({ item: product }: { item: Product }) => (
    <TouchableOpacity
      className='bg-surface rounded-3xl overflow-hidden mb-3'
      style={{ width: '48%' }}
      activeOpacity={0.8}
      onPress={() => router.push(`/product/${product._id}`)}

    >
      <View className="relative">
        <Image
          source={{ uri: product.images[0] }}
          className='w-full h-44 bg-background-lighter'
          resizeMode='cover'
        />
        <TouchableOpacity
          className=' absolute top-3 right-3 bg-black/30 backdrop-blur-xl p-2 rounded-full'
          activeOpacity={0.7}
          onPress={() => handleToggleWishlist(product._id)}
          disabled={pendingWishlistId === product._id}
        >
          {pendingWishlistId === product._id ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <Ionicons
              name={isInWishList(product._id) ? 'heart' : 'heart-outline'}
              size={18}
              color={isInWishList(product._id) ? '#FF6B6B' : '#FFFFFF'} />
          )}

        </TouchableOpacity>

      </View>

      <View className='p-3'>
        <Text className='text-text-secondary text-xs mb-1'>{product.category}</Text>
        <Text className='text-text-primary font-bold text-sm mb-2' numberOfLines={2}>
          {product.name}
        </Text>

        <View className='flex-row items-center mb-2'>
          <Ionicons name='star' size={12} color='#FFC107' />
          <Text className='text-text-primary text-xs font-semibold ml-1'>
            {product.averageRating.toFixed(1)}
          </Text>
          <Text className='text-text-secondary text-xs ml-1'>
            ({product.totalReviews})
          </Text>
        </View>
        <View className=' flex-row items-center justify-between'>

          <Text className=' text-primary font-bold text-lg'> ${product.price.toFixed(2)}</Text>
          <TouchableOpacity
            className='bg-primary rounded-full w-8 h-8 items-center justify-center'
            activeOpacity={0.7}
            onPress={() => handleAddToCart(product._id, product.name)}
            disabled={pendingProductId === product._id}
          >
            {
              pendingProductId === product._id ? (
                <ActivityIndicator size='small' color='#121212' />
              ) : (
                <Ionicons name='add' size={18} color='#121212' />
              )
            }

          </TouchableOpacity>
        </View>
      </View>




    </TouchableOpacity>

  )


  if (isLoading) {
    return (
      <View className='py-20 items-center justify-center'>
        <ActivityIndicator size='large' color='#00D9FF' />
        <Text className='text-text-secondary mt-4'>Loading products...</Text>
      </View>
    )
  }

  if (isError) {
    return (
      <View className='py-20 items-center justify-center'>
        <Ionicons name="alert-circle-outline" size={48} color={"#FF6B6B"} />
        <Text className='text-text-primary font-semibold mt-4'>Failed to load products</Text>
        <Text className='text-text-secondary text-sm mt-2'>Please try again later</Text>
      </View>
    )
  }



  return (
    //  agar jo apde .map method use karta to 100 items no api call ek sathe vagto , but flatlist is better for performance since 
    // it will only render the items that are visible on the screen
    <FlatList
      data={products}
      renderItem={renderProduct}
      keyExtractor={(item) => item._id}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={NoProductsFound}
      scrollEnabled={false}
      columnWrapperStyle = {{ justifyContent: 'space-between' }}
    />
  )
}

export default ProductsGrid

function NoProductsFound() {
  return (
    <View className='py-20 items-center justify-center'>
      <Ionicons name='search-outline' size={48} color={"#666"} />
      <Text className='text-text-primary font-semibold mt-4'>No products found</Text>
      <Text className='text-text-secondary text-sm mt-2'>Try searching for a different product</Text>
    </View>
  )
}