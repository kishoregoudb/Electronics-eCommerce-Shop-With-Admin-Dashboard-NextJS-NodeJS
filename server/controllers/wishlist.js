const prisma = require("../utills/db");
const { asyncHandler, AppError } = require("../utills/errorHandler");

const productSelect = {
  id: true,
  title: true,
  price: true,
  mainImage: true,
  slug: true,
  inStock: true,
};

const getWishlist = asyncHandler(async (req, res) => {
  const items = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    include: { product: { select: productSelect } },
  });
  res.status(200).json(items);
});

const addWishlistItem = asyncHandler(async (req, res) => {
  const productId = req.body && typeof req.body.productId === "string" ? req.body.productId : "";
  if (!productId) {
    throw new AppError("productId is required", 400);
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const existing = await prisma.wishlist.findFirst({
    where: { userId: req.user.id, productId },
  });
  if (existing) {
    return res.status(200).json(existing);
  }

  const created = await prisma.wishlist.create({
    data: { userId: req.user.id, productId },
  });
  return res.status(201).json(created);
});

const removeWishlistItem = asyncHandler(async (req, res) => {
  await prisma.wishlist.deleteMany({
    where: { userId: req.user.id, productId: req.params.productId },
  });
  return res.status(204).send();
});

module.exports = { getWishlist, addWishlistItem, removeWishlistItem };
