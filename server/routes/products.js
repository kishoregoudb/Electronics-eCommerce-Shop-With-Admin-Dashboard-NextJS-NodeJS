const express = require("express");

const router = express.Router();
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductById,
} = require("../controllers/products");

const { requireAdmin } = require("../middleware/auth");

router.route("/").get(getAllProducts).post(requireAdmin, createProduct);


router
  .route("/:id")
  .get(getProductById)
  .put(requireAdmin, updateProduct)
  .delete(requireAdmin, deleteProduct);

module.exports = router;
