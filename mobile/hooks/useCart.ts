import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Cart } from "@/types";

const useCart = () => {
    const api = useApi();
    const queryClient = useQueryClient();

    const { data: cart, isLoading, isError, refetch } = useQuery({
        queryKey: ["cart"],
        queryFn: async () => {
            const { data } = await api.get<{ cart: Cart }>("/cart");
            return data.cart;
        },
    });

    const addToCartMutation = useMutation({
        mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
            const { data } = await api.post<{ cart: Cart }>("/cart", { productId, quantity });
            return data.cart;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    });

    const updateQuantityMutation = useMutation({
        mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
            const { data } = await api.put<{ cart: Cart }>(`/cart/${productId}`, { quantity });
            return data.cart;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    });

    const removeFromCartMutation = useMutation({
        mutationFn: async (productId: string) => {
            const { data } = await api.delete<{ cart: Cart }>(`/cart/${productId}`);
            return data.cart;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    });

    const clearCartMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.delete<{ cart: Cart }>("/cart");
            return data.cart;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    });

    const items = cart?.items ?? [];
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
        (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
        0
    );

    return {
        cart,
        items,
        itemCount,
        subtotal,
        isLoading,
        isError,
        refetch,
        addToCart: addToCartMutation.mutate,
        isAddingToCart: addToCartMutation.isPending,
        updateQuantity: updateQuantityMutation.mutate,
        isUpdatingQuantity: updateQuantityMutation.isPending,
        removeFromCart: removeFromCartMutation.mutate,
        isRemovingFromCart: removeFromCartMutation.isPending,
        clearCart: clearCartMutation.mutate,
        isClearingCart: clearCartMutation.isPending,
    };
};

export default useCart;
