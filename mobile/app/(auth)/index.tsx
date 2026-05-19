import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { router } from 'expo-router'
import useSocialAuth from '../../hooks/useSocialAuth'

const AuthScreen = () => {
    const { handleSocialAuth, loadingStrategy } = useSocialAuth()
    return (
        <View className='flex-1 items-center justify-center bg-white px-8'>
            {/* image  */}
            <Image
                source={require("../../assets/images/auth-image.png")}
                className='size-96'
                resizeMode='contain'
            />
            {/* buttons */}
            <View className='gap-2 mt-3 w-full'>
                <TouchableOpacity
                    onPress={() => handleSocialAuth("oauth_google")}
                    disabled={loadingStrategy === "oauth_google"}
                    className='flex-row items-center justify-center bg-white border
                     border-gray-300 rounded-full px-4 py-2'
                     style={{
                        shadowOffset : { width: 0, height: 1 },
                        shadowOpacity : 0.1,
                        shadowRadius : 2,
                        elevation : 2,//for android
                     }}
                >
                    {
                        loadingStrategy === "oauth_google" ?
                            (<ActivityIndicator size='small' color='#4285f4' />) :
                            (<>
                                <View className='flex-row items-center justify-center ' >
                                    <Image
                                        source={require("../../assets/images/google.png")}
                                        className='size-10 mr-3'
                                        resizeMode='contain'
                                    />
                                    <Text className='text-base font-medium text-gray-700'>Continue with Google</Text>
                                </View>
                            </>)
                    }
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleSocialAuth("oauth_apple")}
                    disabled={loadingStrategy === "oauth_apple"}
                    className='flex-row items-center justify-center bg-white border
                     border-gray-300 rounded-full px-4 py-3'
                     style={{
                        shadowOffset : { width: 0, height: 1 },
                        shadowOpacity : 0.1,
                        shadowRadius : 2,
                        elevation : 2,//for android
                     }}
                >
                    {
                        loadingStrategy === "oauth_apple" ?
                            (<ActivityIndicator size='small' color='#4285f4' />) :
                            (<>
                                <View className='flex-row items-center justify-center ' >
                                    <Image
                                        source={require("../../assets/images/apple.png")}
                                        className='size-8 mr-3'
                                        resizeMode='contain'
                                    />
                                    <Text className='text-base font-medium text-gray-700'>Continue with Apple</Text>
                                </View>
                            </>)
                    }
                </TouchableOpacity>

                {/* "or" divider */}
                <View className='flex-row items-center my-3'>
                    <View className='flex-1 h-px bg-gray-200' />
                    <Text className='mx-3 text-gray-400 text-xs'>or</Text>
                    <View className='flex-1 h-px bg-gray-200' />
                </View>

                {/* Email/password login + register */}
                <TouchableOpacity
                    onPress={() => router.push('/(auth)/login')}
                    className='items-center justify-center bg-primary rounded-full px-4 py-3'
                >
                    <Text className='text-base font-semibold text-white'>
                        Sign in with email
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => router.push('/(auth)/register')}
                    className='items-center justify-center bg-white border border-gray-300 rounded-full px-4 py-3'
                >
                    <Text className='text-base font-medium text-gray-700'>
                        Create a new account
                    </Text>
                </TouchableOpacity>
            </View>

            {/* terms and conditions */}
            <Text className='text-center text-gray-500 text-xs mt-6 leading-6 px-2 ' >
                By continuing, you agree to our <Text className='text-blue-500'>Terms of Service</Text> and <Text className='text-blue-500'>Privacy Policy</Text>

            </Text>
        </View>
    )
}

export default AuthScreen
