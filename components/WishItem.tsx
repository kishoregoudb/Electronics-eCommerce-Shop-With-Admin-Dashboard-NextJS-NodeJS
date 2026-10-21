// *********************
// Role of the component: One saved product on the wishlist page
// Name of the component: WishItem.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.1
// Component call: <WishItem id title price image slug stockAvailabillity />
// Input parameters: ProductInWishlist fields
// Output: A table row with image, name, stock and remove
// *********************

"use client";

import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import apiClient from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import toast from "react-hot-toast";

const WishItem = ({
  id,
  title,
  image,
  slug,
  stockAvailabillity,
}: ProductInWishlist) => {
  const { removeFromWishlist } = useWishlistStore();

  const remove = async () => {
    const response = await apiClient.delete(`/api/wishlist/${id}`);
    if (!response.ok && response.status !== 204) {
      toast.error("Could not remove this item");
      return;
    }
    removeFromWishlist(id);
  };

  return (
    <tr>
      <td></td>
      <td>
        <Image
          src={image ? `/${image}` : "/product_placeholder.jpg"}
          width={80}
          height={80}
          alt={title}
          className="w-20 h-auto mx-auto"
        />
      </td>
      <td>
        <Link href={`/product/${slug}`} className="text-black">
          {title}
        </Link>
      </td>
      <td className="text-black">{stockAvailabillity === 1 ? "In stock" : "Out of stock"}</td>
      <td>
        <button type="button" className="btn btn-sm" onClick={remove}>
          Remove
        </button>
      </td>
    </tr>
  );
};

export default WishItem;
