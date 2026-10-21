const express = require('express');

const router = express.Router();

const {
    createOrderProduct,
     updateProductOrder,
      deleteProductOrder,
       getProductOrder,
       getAllProductOrders
  } = require('../controllers/customer_order_product');

// Deprecated. Checkout writes line items in POST /api/orders.
// Reads and changes require an admin. Creating a line stays open for older clients.
const { requireAdmin } = require("../middleware/auth");

  router.route('/')
  .get(requireAdmin, getAllProductOrders)
  .post(createOrderProduct);

  router.route('/:id')
  .get(requireAdmin, getProductOrder)
  .put(requireAdmin, updateProductOrder)
  .delete(requireAdmin, deleteProductOrder); 


  module.exports = router;