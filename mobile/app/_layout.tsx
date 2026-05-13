import { Stack } from "expo-router";
import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import Toast from 'react-native-toast-message'
import { toastConfig } from '@/lib/toastConfig'
import { StripeProvider } from '@stripe/stripe-react-native'

const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

const queryClient = new QueryClient();
export default function RootLayout() {


  return (
    <ClerkProvider tokenCache={tokenCache} >
      <StripeProvider publishableKey={STRIPE_PK} merchantIdentifier="merchant.mern-react-native">
        <QueryClientProvider client={queryClient}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
          <Toast config={toastConfig} topOffset={60} />
        </QueryClientProvider>
      </StripeProvider>
    </ClerkProvider>
  );
}
