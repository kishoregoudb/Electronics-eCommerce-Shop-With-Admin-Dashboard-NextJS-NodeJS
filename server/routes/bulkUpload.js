const express = require("express");
const router = express.Router();

const {
  uploadCsvAndCreateBatch,
  listBatches,
  getBatchDetail,
  updateBatchItems,
  deleteBatch,
} = require("../controllers/bulkUpload");

const { requireAdmin } = require("../middleware/auth");

router.route("/")
  .post(requireAdmin, uploadCsvAndCreateBatch)
  .get(requireAdmin, listBatches);

router.route("/:batchId")
  .get(requireAdmin, getBatchDetail)
  .put(requireAdmin, updateBatchItems)
  .delete(requireAdmin, deleteBatch);

module.exports = router;
