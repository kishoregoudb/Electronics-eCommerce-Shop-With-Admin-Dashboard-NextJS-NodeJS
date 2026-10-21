const express = require("express");
const router = express.Router();
const {
  getAllMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
} = require("../controllers/merchant");

// Get all merchants
router.get("/", getAllMerchants);

// Get a specific merchant by ID
router.get("/:id", getMerchantById);

const { requireAdmin } = require("../middleware/auth");

// Create a new merchant
router.post("/", requireAdmin, createMerchant);

// Update a merchant
router.put("/:id", requireAdmin, updateMerchant);

// Delete a merchant
router.delete("/:id", requireAdmin, deleteMerchant);

module.exports = router;