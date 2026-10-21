const express = require('express');

const router = express.Router();

const {
    getCustomerOrder,
    createCustomerOrder,
    updateCustomerOrder,
    deleteCustomerOrder,
    getAllOrders 
  } = require('../controllers/customer_orders');

const { requireAdmin } = require("../middleware/auth");
const prisma = require("../utills/db");

async function requireOrderOwnerOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role === "admin") return next();
  try {
    const order = await prisma.customer_order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (req.user.email && order.email === req.user.email) return next();
    return res.status(403).json({ error: "Forbidden" });
  } catch (error) {
    return next(error);
  }
}

  router.route('/')
  .get(requireAdmin, getAllOrders)
  .post(createCustomerOrder);

  router.route('/:id')
  .get(requireOrderOwnerOrAdmin, getCustomerOrder)
  .put(requireAdmin, updateCustomerOrder)
  .delete(requireAdmin, deleteCustomerOrder); 


  module.exports = router;