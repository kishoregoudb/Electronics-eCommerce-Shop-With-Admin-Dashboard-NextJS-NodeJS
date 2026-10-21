const express = require('express');

const router = express.Router();

const {
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getAllUsers, 
    getUserByEmail
  } = require('../controllers/users');

const { requireAdmin, requireSelfOrAdmin, requireSelfEmailOrAdmin } = require("../middleware/auth");

  router.route('/')
  .get(requireAdmin, getAllUsers)
  .post(requireAdmin, createUser);

  router.route('/email/:email')
  .get(requireSelfEmailOrAdmin, getUserByEmail);

  router.route('/:id')
  .get(requireSelfOrAdmin("id"), getUser)
  .put(requireSelfOrAdmin("id"), updateUser)
  .delete(requireSelfOrAdmin("id"), deleteUser);


  module.exports = router;