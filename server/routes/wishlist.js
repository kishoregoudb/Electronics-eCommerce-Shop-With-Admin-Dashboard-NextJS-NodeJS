const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getWishlist, addWishlistItem, removeWishlistItem } = require("../controllers/wishlist");

router.use(requireAuth);
router.get("/", getWishlist);
router.post("/", addWishlistItem);
router.delete("/:productId", removeWishlistItem);

module.exports = router;
