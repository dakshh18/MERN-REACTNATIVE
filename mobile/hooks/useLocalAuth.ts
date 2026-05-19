import { useCallback, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import axios from 'axios'

// Local (email/password+OTP) auth state, kept independent from Clerk. The
// JWT and a minimal user snapshot live in SecureStore so the user remains
// signed in across app restarts.
//
// We intentionally don't combine Clerk + local auth into a single context —
// the OAuth (Clerk) flow already drives navigation via @clerk/clerk-expo's
// useAuth hook, and this hook just adds a parallel notion of "signed in via
// our own backend". Both can navigate to /(tabs) on success.

const TOKEN_KEY = 'localAuth.token'
const USER_KEY = 'localAuth.user'

const API_URL = process.env.EXPO_PUBLIC_API_URL

export type LocalUser = {
    id: string
    name: string
    email: string
    phoneNumber: string | null
    isOtpVerified: boolean
    authProvider: 'clerk' | 'local'
    imageUrl?: string
}

type StartResponse = { message: string; email: string }
type VerifyResponse = { message: string; token: string; user: LocalUser }

async function readUser(): Promise<LocalUser | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw) as LocalUser
    } catch {
        return null
    }
}

export function useLocalAuth() {
    const [token, setToken] = useState<string | null>(null)
    const [user, setUser] = useState<LocalUser | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        // Hydrate from SecureStore once on mount. Errors are non-fatal — we
        // just treat it as signed-out.
        ;(async () => {
            try {
                const [savedToken, savedUser] = await Promise.all([
                    SecureStore.getItemAsync(TOKEN_KEY),
                    readUser(),
                ])
                if (savedToken) setToken(savedToken)
                if (savedUser) setUser(savedUser)
            } finally {
                setIsLoaded(true)
            }
        })()
    }, [])

    const persist = useCallback(async (t: string, u: LocalUser) => {
        await SecureStore.setItemAsync(TOKEN_KEY, t)
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u))
        setToken(t)
        setUser(u)
    }, [])

    const signOut = useCallback(async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {})
        await SecureStore.deleteItemAsync(USER_KEY).catch(() => {})
        setToken(null)
        setUser(null)
    }, [])

    const registerStart = useCallback(
        async (input: { name: string; email: string; password: string; phoneNumber: string }) => {
            const res = await axios.post<StartResponse>(`${API_URL}/auth/register/start`, input)
            return res.data
        },
        []
    )

    const loginStart = useCallback(
        async (input: { email?: string; phoneNumber?: string; password: string }) => {
            const res = await axios.post<StartResponse>(`${API_URL}/auth/login/start`, input)
            return res.data
        },
        []
    )

    const verifyOtp = useCallback(
        async (input: {
            email?: string
            phoneNumber?: string
            otp: string
            purpose: 'register' | 'login'
        }) => {
            const path =
                input.purpose === 'register' ? '/auth/register/verify' : '/auth/login/verify'
            const res = await axios.post<VerifyResponse>(`${API_URL}${path}`, {
                email: input.email,
                phoneNumber: input.phoneNumber,
                otp: input.otp,
            })
            await persist(res.data.token, res.data.user)
            return res.data
        },
        [persist]
    )

    const resendOtp = useCallback(
        async (input: {
            email?: string
            phoneNumber?: string
            purpose: 'register' | 'login'
        }) => {
            const res = await axios.post(`${API_URL}/auth/otp/resend`, input)
            return res.data
        },
        []
    )

    return {
        isLoaded,
        token,
        user,
        isSignedIn: Boolean(token && user),
        registerStart,
        loginStart,
        verifyOtp,
        resendOtp,
        signOut,
    }
}
