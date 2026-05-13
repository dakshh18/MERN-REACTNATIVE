import { Redirect } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

export default function UnmatchedRoute() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) return null

  // Redirect to appropriate route based on auth state
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)" />
}

