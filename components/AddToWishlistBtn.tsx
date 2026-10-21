// *********************
// Role of the component: Heart toggle that saves a product for the signed-in shopper
// Name of the component: AddToWishlistBtn.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.1
// Component call: <AddToWishlistBtn product={product} />
// Input parameters: { product: ProductInWishlist }
// Output: Button that adds or removes the product
// *********************

"use client";

import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import apiClient from "@/lib/api";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";

const AddToWishlistBtn = ({ product }: { product: ProductInWishlist }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const saved = wishlist.some((item) => item.id === product.id);

  const toggle = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (saved) {
      const response = await apiClient.delete(`/api/wishlist/${product.id}`);
      if (!response.ok && response.status !== 204) {
        toast.error("Could not update your wishlist");
        return;
      }
      removeFromWishlist(product.id);
      return;
    }

    const response = await apiClient.post("/api/wishlist", { productId: product.id });
    if (!response.ok) {
      toast.error("Could not save this product");
      return;
    }
    addToWishlist(product);
  };

  return (
    <button type="button" className="btn btn-outline" onClick={toggle}>
      {saved ? "Remove from wishlist" : "Add to wishlist"}
    </button>
  );
};

export default AddToWishlistBtn;
