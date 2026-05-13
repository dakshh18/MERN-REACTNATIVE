import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/lib/api'
import { Address } from '@/types'

export type AddressInput = {
  label: string
  fullName: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  phoneNumber: string
  isDefault?: boolean
}

const useAddresses = () => {
  const api = useApi()
  const queryClient = useQueryClient()

  const { data: addresses = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await api.get<{ addresses: Address[] }>('/user/addresses')
      return data.addresses ?? []
    },
  })

  const addAddressMutation = useMutation({
    mutationFn: async (input: AddressInput) => {
      const { data } = await api.post<{ address: Address[] }>('/user/addresses', input)
      return data.address
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AddressInput> }) => {
      const { data } = await api.put<{ address: Address[] }>(`/user/addresses/${id}`, input)
      return data.address
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ addresses: Address[] }>(`/user/addresses/${id}`)
      return data.addresses
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })

  return {
    addresses,
    isLoading,
    isError,
    refetch,
    addAddress: addAddressMutation.mutate,
    isAddingAddress: addAddressMutation.isPending,
    updateAddress: updateAddressMutation.mutate,
    isUpdatingAddress: updateAddressMutation.isPending,
    deleteAddress: deleteAddressMutation.mutate,
    isDeletingAddress: deleteAddressMutation.isPending,
  }
}

export default useAddresses
