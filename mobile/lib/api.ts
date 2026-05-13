import axios from 'axios'
import { useAuth } from '@clerk/clerk-expo'
import { useEffect } from 'react'

const API_URL = "http://192.168.1.7:3000/api"

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },

})

export const useApi = () => {
    const { getToken } = useAuth()

    useEffect(() => {
        const interceptor = api.interceptors.request.use(async (config) => {
            const token = await getToken()
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