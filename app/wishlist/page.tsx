import React from "react";
import { WishlistModule } from "@/components/modules/wishlist";
import SectionTitle from "@/components/SectionTitle";

export default function WishlistPage() {
  return (
    <div className="bg-white">
      <SectionTitle title="Wishlist" path="Home | Wishlist" />
      <WishlistModule />
    </div>
  );
}
