import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { useLocalAuth } from '@/hooks/useLocalAuth'

// Two parallel auth systems: Clerk (OAuth — Google/Apple) and our local
// email/password+OTP. If EITHER says the user is signed in, send them to
// the tabs. Both must finish loading before we make that decision so we
// don't briefly redirect a user that's about to be hydrated by the other.
export default function AuthRoutesLayout() {
  const { isSignedIn: clerkSignedIn, isLoaded: clerkLoaded } = useAuth()
  const { isSignedIn: localSignedIn, isLoaded: localLoaded } = useLocalAuth()

  if (!clerkLoaded || !localLoaded) return null

  if (clerkSignedIn || localSignedIn) {
    return <Redirect href={'/(tabs)'} />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
