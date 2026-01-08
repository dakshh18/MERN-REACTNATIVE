import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native'
import React, { useState } from 'react'
import SafeScreen from '@/components/SafeScreen'
import { Ionicons } from '@expo/vector-icons'
import ProductsGrid from '@/components/ProductsGrid'

const ShopScreen = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')

    const CATEGORIES = [
        { name: "All", icon: "grid-outline" as const },
        { name: "Electronics", image: require("@/assets/images/electronics.png") },
        { name: "Fashion", image: require("@/assets/images/fashion.png") },
        { name: "Sports", image: require("@/assets/images/sports.png") },
        { name: "Books", image: require("@/assets/images/books.png") },
    ];
    return (
        <SafeScreen>
            <ScrollView
                className='flex-1'
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header component */}
                <View className='px-6 pb-4 pt-6' >
                    <View className='flex-row items-center justify-between mb-6'>
                        <View>
                            <Text className='text-text-primary text-3xl font-bold tracking-tighter'> Shop</Text>
                            <Text className='text-text-secondary text-sm mt-1 ml-2'>Browse our All products</Text>

                        </View>

                        <TouchableOpacity
                            className='bg-surface/50 p-3 rounded-full'
                            activeOpacity={0.5}
                        >
                            <Ionicons name='options-outline' size={22} color='#fff' />

                        </TouchableOpacity>

                    </View>

                    {/* SEARCH BAR VIEW */}
                    <View className='bg-surface flex-row items-center px-5 py-2 rounded-2xl'>
                        <Ionicons name='search' size={22} color='#666' />
                        <TextInput
                            placeholder='Search for products'
                            placeholderTextColor='#666'
                            className='flex-1 ml-3 text-base text-text-primary'
                            value={searchQuery}
                            onChangeText={setSearchQuery}

                        />
                    </View>
                </View>
                {/* CATEGORY FILTERS VIEW */}
                <View className="mb-6 px-6">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12 }} // spacing between items
                    >
                        {CATEGORIES.map(category => {
                            const isSelected = selectedCategory === category.name;

                            return (
                                <TouchableOpacity
                                    key={category.name}
                                    onPress={() => setSelectedCategory(category.name)}
                                    className={`rounded-2xl w-20 h-20 items-center justify-center
                                       ${isSelected ? 'bg-primary' : 'bg-surface'}
                                      `}
                                >
                                    {category.icon ? (
                                        <Ionicons
                                            name={category.icon}
                                            size={30}
                                            color={isSelected ? '#121212' : '#fff'}
                                        />
                                    ) : (
                                        <Image
                                            source={category.image}
                                            className="w-12 h-12"
                                            resizeMode="contain"
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>


                {/* PRODUCTS LIST VIEW */}
                <View className='px-6 mb-6'>
                    <View className='flex-row items-center justify-between mb-4'>
                        <Text className='text-text-primary text-lg  font-bold'>Products </Text>
                        <Text className='text-text-secondary text-lg  font-bold'> 10 Items </Text>
                    </View>

                    {/* Product Grid */}
                    <ProductsGrid />

                </View>
            </ScrollView>
        </SafeScreen>
    )
}

export default ShopScreen