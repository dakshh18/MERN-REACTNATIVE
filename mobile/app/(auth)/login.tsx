import React, { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native'
import { router, Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { useLocalAuth } from '@/hooks/useLocalAuth'

// Accepts either an email or an Indian phone in the same field, with a quick
// regex sniff to decide which one the server should match. Keeps the UI
// uncluttered for users who don't remember which they registered with.
function classifyIdentifier(input: string): { email?: string; phoneNumber?: string } {
    const s = input.trim()
    if (s.includes('@')) return { email: s.toLowerCase() }
    return { phoneNumber: s }
}

const LoginScreen = () => {
    const { loginStart } = useLocalAuth()
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onSubmit = async () => {
        setError(null)
        if (!identifier.trim()) return setError('Enter your email or phone number.')
        if (!password) return setError('Enter your password.')

        setSubmitting(true)
        try {
            const { email, phoneNumber } = classifyIdentifier(identifier)
            const res = await loginStart({ email, phoneNumber, password })
            Toast.show({
                type: 'success',
                text1: 'OTP sent',
                text2: res.message,
                topOffset: 60,
            })
            // Cast is harmless — the route exists in the (auth) group. Expo
            // Router's typed-routes file regenerates on `expo start`, after
            // which the cast is no longer needed.
            router.push({
                pathname: '/(auth)/verify-otp' as any,
                params: {
                    email: res.email || email || '',
                    phoneNumber: !email ? phoneNumber || '' : '',
                    purpose: 'login',
                },
            })
        } catch (err: any) {
            const msg =
                err?.response?.data?.errors?.[0]?.message ||
                err?.response?.data?.message ||
                'Sign in failed. Try again.'
            setError(msg)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <View className='flex-1 bg-background'>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className='flex-1'
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps='handled'
                >
                    <View className='flex-1 px-6 pt-16 pb-10'>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className='w-10 h-10 rounded-full bg-surface items-center justify-center mb-6'
                            activeOpacity={0.7}
                        >
                            <Ionicons name='chevron-back' size={20} color='#fff' />
                        </TouchableOpacity>

                        <Text className='text-text-primary text-3xl font-bold tracking-tight'>
                            Welcome back
                        </Text>
                        <Text className='text-text-secondary text-sm mt-2'>
                            Sign in with email or phone. We&apos;ll text and email you a
                            6-digit OTP.
                        </Text>

                        <View className='mt-8 gap-3'>
                            <View>
                                <Text className='text-text-secondary text-xs ml-1 mb-1'>
                                    Email or phone
                                </Text>
                                <View className='flex-row items-center bg-surface rounded-2xl px-4 py-3'>
                                    <Ionicons name='person-outline' size={18} color='#888' />
                                    <TextInput
                                        value={identifier}
                                        onChangeText={setIdentifier}
                                        placeholder='you@example.com or 9876543210'
                                        placeholderTextColor='#666'
                                        className='flex-1 ml-2 text-text-primary text-base'
                                        autoCapitalize='none'
                                        keyboardType='email-address'
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className='text-text-secondary text-xs ml-1 mb-1'>
                                    Password
                                </Text>
                                <View className='flex-row items-center bg-surface rounded-2xl px-4 py-3'>
                                    <Ionicons name='lock-closed-outline' size={18} color='#888' />
                                    <TextInput
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder='Your password'
                                        placeholderTextColor='#666'
                                        className='flex-1 ml-2 text-text-primary text-base'
                                        secureTextEntry={!showPassword}
                                        autoCapitalize='none'
                                        textContentType='password'
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword((s) => !s)}
                                        hitSlop={8}
                                    >
                                        <Ionicons
                                            name={
                                                showPassword ? 'eye-off-outline' : 'eye-outline'
                                            }
                                            size={20}
                                            color='#888'
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {error && (
                            <Text className='text-red-400 text-sm mt-3'>{error}</Text>
                        )}

                        <TouchableOpacity
                            onPress={onSubmit}
                            disabled={submitting}
                            activeOpacity={0.8}
                            className='bg-primary rounded-full py-4 items-center mt-6'
                        >
                            {submitting ? (
                                <ActivityIndicator color='#121212' />
                            ) : (
                                <Text className='text-background font-bold text-base'>
                                    Send OTP
                                </Text>
                            )}
                        </TouchableOpacity>

                        <Text className='text-text-secondary text-sm text-center mt-6'>
                            No account yet?{' '}
                            <Link
                                href='/(auth)/register'
                                className='text-primary font-semibold'
                            >
                                Create one
                            </Link>
                        </Text>

                        <View className='flex-row items-center my-6'>
                            <View className='flex-1 h-px bg-background-lighter' />
                            <Text className='mx-3 text-text-tertiary text-xs'>or</Text>
                            <View className='flex-1 h-px bg-background-lighter' />
                        </View>

                        <TouchableOpacity
                            onPress={() => router.replace('/(auth)')}
                            className='items-center'
                        >
                            <Text className='text-text-secondary text-sm'>
                                Continue with{' '}
                                <Text className='text-text-primary font-semibold'>
                                    Google / Apple
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}

export default LoginScreen
