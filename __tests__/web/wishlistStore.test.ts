import { useWishlistStore } from "@/app/_zustand/wishlistStore";

const product = {
  id: "p1",
  title: "Radio",
  price: 20,
  image: "radio.jpg",
  slug: "radio",
  stockAvailabillity: 1,
};

describe("wishlistStore", () => {
  beforeEach(() => {
    useWishlistStore.setState({ wishlist: [], wishQuantity: 0 });
  });

  it("counts a newly added product", () => {
    useWishlistStore.getState().addToWishlist(product);
    expect(useWishlistStore.getState().wishQuantity).toBe(1);
    expect(useWishlistStore.getState().wishlist).toHaveLength(1);
  });

  it("counts after a product is removed", () => {
    useWishlistStore.getState().setWishlist([product, { ...product, id: "p2" }]);
    useWishlistStore.getState().removeFromWishlist("p1");
    expect(useWishlistStore.getState().wishQuantity).toBe(1);
  });

  it("does not add the same product twice", () => {
    useWishlistStore.getState().addToWishlist(product);
    useWishlistStore.getState().addToWishlist(product);
    expect(useWishlistStore.getState().wishlist).toHaveLength(1);
    expect(useWishlistStore.getState().wishQuantity).toBe(1);
  });
});
