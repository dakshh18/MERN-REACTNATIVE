import axios from 'axios'
import { useAuth } from '@clerk/clerk-expo'
import { useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'

// Loaded from mobile/.env via Expo at build time. Set EXPO_PUBLIC_API_URL
// to (for example) "https://daksh-mern-shop.duckdns.org/api" for prod,
// or "http://<your-LAN-ip>:3000/api" when running the backend locally.
const API_URL = process.env.EXPO_PUBLIC_API_URL

if (!API_URL) {
    throw new Error(
        'EXPO_PUBLIC_API_URL is not set. Add it to mobile/.env and restart `npm start`.'
    )
}

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },

})

// Mirrors the key used by useLocalAuth. Kept private to this module so we
// don't accidentally couple components to SecureStore directly.
const LOCAL_TOKEN_KEY = 'localAuth.token'

export const useApi = () => {
    const { getToken } = useAuth()

    useEffect(() => {
        const interceptor = api.interceptors.request.use(async (config) => {
            // Prefer Clerk's session token (existing OAuth users). Fall back to
            // our local JWT (email/password+OTP users). Both endpoints accept
            // either — see backend middlewares/auth.middleware.js.
            let token: string | null = null
            try {
                token = await getToken()
            } catch {
                token = null
            }
            if (!token) {
                token = await SecureStore.getItemAsync(LOCAL_TOKEN_KEY).catch(() => null)
            }
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        })

        // clean up : remove interceptor when component unmounts
        return () => {
            api.interceptors.request.eject(interceptor)
        }

    }, [getToken])

    return api

}

// on every single request , we would like have an auth token in the headers so
// that our backend knows that the request is coming from a authenticated user
