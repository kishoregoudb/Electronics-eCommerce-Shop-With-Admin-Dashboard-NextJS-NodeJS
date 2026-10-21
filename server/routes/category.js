const express = require("express");

const router = express.Router();

const {
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
} = require("../controllers/category");

const { requireAdmin } = require("../middleware/auth");

router.route("/").get(getAllCategories).post(requireAdmin, createCategory);

router
  .route("/:id")
  .get(getCategory)
  .put(requireAdmin, updateCategory)
  .delete(requireAdmin, deleteCategory);

module.exports = router;
