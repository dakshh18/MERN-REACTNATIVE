import React, { useEffect, useRef, useState } from 'react'
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
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { useLocalAuth } from '@/hooks/useLocalAuth'

// Resend cooldown matches the backend default (AUTH_OTP_RESEND_COOLDOWN_SECONDS=60).
// We track it client-side so the button only re-enables after a minute.
const RESEND_COOLDOWN_SECONDS = 60

const VerifyOtpScreen = () => {
    const params = useLocalSearchParams<{
        email?: string
        phoneNumber?: string
        purpose?: string
    }>()
    const purpose = (params.purpose === 'login' ? 'login' : 'register') as
        | 'login'
        | 'register'
    const { verifyOtp, resendOtp } = useLocalAuth()

    const [otp, setOtp] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS)
    const inputRef = useRef<TextInput | null>(null)

    useEffect(() => {
        // Focus the OTP field on mount so the user can type immediately.
        const t = setTimeout(() => inputRef.current?.focus(), 200)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        if (secondsLeft <= 0) return
        const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
        return () => clearInterval(id)
    }, [secondsLeft])

    const onVerify = async () => {
        setError(null)
        if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit OTP.')
        setSubmitting(true)
        try {
            await verifyOtp({
                email: params.email || undefined,
                phoneNumber: params.phoneNumber || undefined,
                otp,
                purpose,
            })
            Toast.show({
                type: 'success',
                text1: purpose === 'register' ? 'Account verified' : 'Signed in',
                topOffset: 60,
            })
            router.replace('/(tabs)')
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                'Could not verify. Check the code and try again.'
            setError(msg)
        } finally {
            setSubmitting(false)
        }
    }

    const onResend = async () => {
        if (secondsLeft > 0 || resending) return
        setResending(true)
        setError(null)
        try {
            await resendOtp({
                email: params.email || undefined,
                phoneNumber: params.phoneNumber || undefined,
                purpose,
            })
            Toast.show({
                type: 'success',
                text1: 'OTP re-sent',
                text2: 'Check your email and phone.',
                topOffset: 60,
            })
            setSecondsLeft(RESEND_COOLDOWN_SECONDS)
        } catch (err: any) {
            const data = err?.response?.data
            if (data?.secondsLeft) setSecondsLeft(Number(data.secondsLeft))
            setError(data?.message || 'Could not resend OTP.')
        } finally {
            setResending(false)
        }
    }

    const displayTarget =
        params.email || params.phoneNumber || 'your email and phone'

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
                            Enter OTP
                        </Text>
                        <Text className='text-text-secondary text-sm mt-2'>
                            We sent a 6-digit code to your email and phone number.
                        </Text>
                        <Text className='text-text-secondary text-xs mt-1'>{displayTarget}</Text>

                        <View className='mt-8'>
                            <TextInput
                                ref={inputRef}
                                value={otp}
                                onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))}
                                placeholder='••••••'
                                placeholderTextColor='#444'
                                keyboardType='number-pad'
                                maxLength={6}
                                className='bg-surface text-text-primary text-3xl tracking-[12px] text-center font-bold rounded-2xl py-5 px-4'
                                style={{ letterSpacing: 12 }}
                            />
                        </View>

                        {error && (
                            <Text className='text-red-400 text-sm mt-3'>{error}</Text>
                        )}

                        <TouchableOpacity
                            onPress={onVerify}
                            disabled={submitting || otp.length !== 6}
                            activeOpacity={0.8}
                            className={`rounded-full py-4 items-center mt-6 ${
                                otp.length !== 6 ? 'bg-surface-light' : 'bg-primary'
                            }`}
                        >
                            {submitting ? (
                                <ActivityIndicator color='#121212' />
                            ) : (
                                <Text
                                    className={`font-bold text-base ${
                                        otp.length !== 6
                                            ? 'text-text-tertiary'
                                            : 'text-background'
                                    }`}
                                >
                                    Verify & continue
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View className='flex-row items-center justify-center mt-6'>
                            <Text className='text-text-secondary text-sm'>
                                Didn&apos;t get it?{' '}
                            </Text>
                            <TouchableOpacity
                                onPress={onResend}
                                disabled={secondsLeft > 0 || resending}
                                hitSlop={8}
                            >
                                <Text
                                    className={`text-sm font-semibold ${
                                        secondsLeft > 0
                                            ? 'text-text-tertiary'
                                            : 'text-primary'
                                    }`}
                                >
                                    {secondsLeft > 0
                                        ? `Resend in ${secondsLeft}s`
                                        : resending
                                          ? 'Sending…'
                                          : 'Resend OTP'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            className='items-center mt-4'
                        >
                            <Text className='text-text-tertiary text-xs'>Edit details</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}

export default VerifyOtpScreen
