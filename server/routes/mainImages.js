const express = require("express");
const router = express.Router();
const { uploadMainImage } = require("../controllers/mainImages");

const { requireAdmin } = require("../middleware/auth");

router.route("/").post(requireAdmin, uploadMainImage);

module.exports = router;
