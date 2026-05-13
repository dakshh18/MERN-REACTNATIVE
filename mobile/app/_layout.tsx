import { Stack } from "expo-router";
import "../global.css";
import React, { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import Toast from 'react-native-toast-message'
import { toastConfig } from '@/lib/toastConfig'
import { StripeProvider } from '@stripe/stripe-react-native'
import * as SplashScreen from 'expo-splash-screen'
import AppLoading from '@/components/AppLoading'

SplashScreen.preventAutoHideAsync().catch(() => {})

const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} >
      <StripeProvider publishableKey={STRIPE_PK} merchantIdentifier="merchant.mern-react-native">
        <QueryClientProvider client={queryClient}>
          <AppGate>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </AppGate>
          <Toast config={toastConfig} topOffset={60} />
        </QueryClientProvider>
      </StripeProvider>
    </ClerkProvider>
  );
}

// Hides the native splash once Clerk has resolved auth, and shows a branded
// loading screen until then so users never see a white flash.
function AppGate({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth()
  const [splashHidden, setSplashHidden] = useState(false)

  useEffect(() => {
    if (isLoaded && !splashHidden) {
      SplashScreen.hideAsync()
        .catch(() => {})
        .finally(() => setSplashHidden(true))
    }
  }, [isLoaded, splashHidden])

  if (!isLoaded) {
    return <AppLoading />
  }

  return <>{children}</>
}
