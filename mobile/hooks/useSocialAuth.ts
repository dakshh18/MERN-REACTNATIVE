import { useSSO } from '@clerk/clerk-expo'
import { useState } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'


function useSocialAuth() {

    const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null)
    const { startSSOFlow } = useSSO()
    const router = useRouter()

    const handleSocialAuth = async (strategy: "oauth_google" | "oauth_apple") => {
        setLoadingStrategy(strategy)
        try {
            const { createdSessionId, setActive } = await startSSOFlow({ strategy })
            if(createdSessionId && setActive){
                await setActive({ session: createdSessionId })
                // Navigate to tabs after successful authentication
                // Use replace to avoid back navigation to auth screen
                router.replace('/(tabs)')
            }
        } catch (error) {
            console.error("Error in handleSocialAuth:", error)
            const provider = strategy === "oauth_google" ? "Google" : "Apple";
            Alert.alert("Error",`Failed to sign in with ${provider}. Please try again.`)
        } finally {
            setLoadingStrategy(null)
        }

    }


    return {

        handleSocialAuth,
        loadingStrategy,
    }
}

export default useSocialAuth