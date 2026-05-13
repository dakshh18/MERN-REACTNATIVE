import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/lib/api'
import { Order } from '@/types'

type ShippingAddressInput = {
  fullName: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  phoneNumber: string
}

const useOrders = () => {
  const api = useApi()
  const queryClient = useQueryClient()

  const { data: orders = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get<{ orders: Order[] }>('/orders')
      return data.orders ?? []
    },
  })

  const createOrderMutation = useMutation({
    mutationFn: async ({
      shippingAddress,
      paymentIntentId,
    }: {
      shippingAddress: ShippingAddressInput
      paymentIntentId?: string
    }) => {
      const { data } = await api.post<{ order: Order }>('/orders', {
        shippingAddress,
        paymentIntentId,
      })
      return data.order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  return {
    orders,
    orderCount: orders.length,
    isLoading,
    isError,
    refetch,
    createOrder: createOrderMutation.mutateAsync,
    isCreatingOrder: createOrderMutation.isPending,
  }
}

export default useOrders
