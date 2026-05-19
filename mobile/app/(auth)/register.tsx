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

const RegisterScreen = () => {
    const { registerStart } = useLocalAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onSubmit = async () => {
        setError(null)
        if (name.trim().length < 2) return setError('Name must be at least 2 characters.')
        if (!email.includes('@')) return setError('Enter a valid email.')
        if (password.length < 8) return setError('Password must be at least 8 characters.')
        if (!/^[6-9]\d{9}$/.test(phone)) {
            return setError(
                'Enter a valid Indian mobile (10 digits, starts with 6/7/8/9).'
            )
        }
        setSubmitting(true)
        try {
            const res = await registerStart({
                name: name.trim(),
                email: email.trim(),
                password,
                phoneNumber: phone.trim(),
            })
            Toast.show({ type: 'success', text1: 'OTP sent', text2: res.message, topOffset: 60 })
            // Cast is harmless — the route exists in the (auth) group. Expo
            // Router's typed-routes file regenerates on `expo start`, after
            // which the cast is no longer needed.
            router.push({
                pathname: '/(auth)/verify-otp' as any,
                params: { email: res.email || email.trim(), purpose: 'register' },
            })
        } catch (err: any) {
            const msg =
                err?.response?.data?.errors?.[0]?.message ||
                err?.response?.data?.message ||
                'Could not create account. Try again.'
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
                            Create account
                        </Text>
                        <Text className='text-text-secondary text-sm mt-2'>
                            Sign up with email and your Indian mobile number. We&apos;ll send a
                            6-digit OTP to verify.
                        </Text>

                        <View className='mt-8 gap-3'>
                            <Field
                                label='Full name'
                                icon='person-outline'
                                value={name}
                                onChangeText={setName}
                                placeholder='Your name'
                                autoCapitalize='words'
                                textContentType='name'
                            />
                            <Field
                                label='Email'
                                icon='mail-outline'
                                value={email}
                                onChangeText={setEmail}
                                placeholder='you@example.com'
                                autoCapitalize='none'
                                keyboardType='email-address'
                                textContentType='emailAddress'
                            />
                            <Field
                                label='Password'
                                icon='lock-closed-outline'
                                value={password}
                                onChangeText={setPassword}
                                placeholder='Min 8 characters'
                                autoCapitalize='none'
                                secureTextEntry={!showPassword}
                                textContentType='newPassword'
                                rightSlot={
                                    <TouchableOpacity
                                        onPress={() => setShowPassword((s) => !s)}
                                        hitSlop={8}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color='#888'
                                        />
                                    </TouchableOpacity>
                                }
                            />
                            <Field
                                label='Phone (India)'
                                icon='call-outline'
                                value={phone}
                                onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
                                placeholder='9876543210'
                                keyboardType='number-pad'
                                maxLength={10}
                                prefix='+91'
                            />
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
                                    Create account
                                </Text>
                            )}
                        </TouchableOpacity>

                        <Text className='text-text-secondary text-sm text-center mt-6'>
                            Already have an account?{' '}
                            <Link href='/(auth)/login' className='text-primary font-semibold'>
                                Sign in
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

type FieldProps = {
    label: string
    icon: React.ComponentProps<typeof Ionicons>['name']
    value: string
    onChangeText: (v: string) => void
    placeholder?: string
    secureTextEntry?: boolean
    keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad'
    autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters'
    textContentType?: any
    maxLength?: number
    prefix?: string
    rightSlot?: React.ReactNode
}

const Field: React.FC<FieldProps> = ({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    textContentType,
    maxLength,
    prefix,
    rightSlot,
}) => (
    <View>
        <Text className='text-text-secondary text-xs ml-1 mb-1'>{label}</Text>
        <View className='flex-row items-center bg-surface rounded-2xl px-4 py-3'>
            <Ionicons name={icon} size={18} color='#888' />
            {prefix && (
                <Text className='ml-2 text-text-primary text-base'>{prefix}</Text>
            )}
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor='#666'
                className='flex-1 ml-2 text-text-primary text-base'
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                textContentType={textContentType}
                maxLength={maxLength}
            />
            {rightSlot}
        </View>
    </View>
)

export default RegisterScreen
