import { useCallback, useState } from 'react'
import { useStripe } from '@stripe/stripe-react-native'
import { useApi } from '@/lib/api'

type PaymentResult =
  | { ok: true; paymentIntentId: string }
  | { ok: false; canceled: boolean; message: string }

const usePayment = () => {
  const api = useApi()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const [isPaying, setIsPaying] = useState(false)

  const payForCart = useCallback(async (): Promise<PaymentResult> => {
    setIsPaying(true)
    try {
      const { data } = await api.post<{
        clientSecret: string
        paymentIntentId: string
        amount: number
      }>('/orders/create-payment-intent', {})

      const initResult = await initPaymentSheet({
        merchantDisplayName: 'Mern & React Native Shop',
        paymentIntentClientSecret: data.clientSecret,
        allowsDelayedPaymentMethods: false,
        returnURL: 'mernandreactnative://stripe-redirect',
      })

      if (initResult.error) {
        return {
          ok: false,
          canceled: false,
          message: initResult.error.message,
        }
      }

      const presentResult = await presentPaymentSheet()
      if (presentResult.error) {
        return {
          ok: false,
          canceled: presentResult.error.code === 'Canceled',
          message: presentResult.error.message,
        }
      }

      return { ok: true, paymentIntentId: data.paymentIntentId }
    } catch (err: any) {
      return {
        ok: false,
        canceled: false,
        message:
          err?.response?.data?.message ??
          err?.message ??
          'Payment setup failed',
      }
    } finally {
      setIsPaying(false)
    }
  }, [api, initPaymentSheet, presentPaymentSheet])

  return { payForCart, isPaying }
}

export default usePayment
