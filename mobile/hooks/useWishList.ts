import { useMutation , useQuery  , useQueryClient} from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Product } from "@/types";  


const useWishList = () => {
    const api = useApi();
    const queryClient = useQueryClient();

    const { data: wishlist, isLoading, isError } = useQuery({
        queryKey: ["wishlist"],
        queryFn: async () => {
            const { data } = await api.get<{ wishlist : Product[]}>("/user/wishlist");
            return data.wishlist;
        }
    });

    const addToWishListMutation = useMutation({
        mutationFn: async (productId: string) => {
            const { data } = await api.post<{ wishlist : string[]}>("/user/wishlist", { productId });
            return data.wishlist;
        },
        onSuccess : () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),

    })

    const removeFromWishListMutation = useMutation({
        mutationFn: async (productId: string) => {
            const { data } = await api.delete<{ wishlist : string[]}>(`/user/wishlist/${productId}`);
            return data.wishlist;
        },
        onSuccess : () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
    })

    const isInWishList = (productId: string) => {
        return wishlist?.some((product) => product._id === productId) ?? false;
    }

    const toggleWishList = (productId: string) => {
        if (isInWishList(productId)) {
            removeFromWishListMutation.mutate(productId);
        } else {
            addToWishListMutation.mutate(productId);
        }
    }

  return {
    wishlist : wishlist || [],
    isLoading,
    isError,
    wishListCount : wishlist?.length || 0,
    isInWishList,
    toggleWishList,
    addToWishList : addToWishListMutation.mutate,
    removeFromWishList : removeFromWishListMutation.mutate,
    isAddingToWishList : addToWishListMutation.isPending,
    isRemovingFromWishList : removeFromWishListMutation.isPending,
  }
}

export default useWishList