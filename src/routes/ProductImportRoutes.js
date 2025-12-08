const express = require("express");
const router = express.Router();

const excelUpload = require("../middlewares/excelUpload");
const { startProductImport } = require("../controllers/ProductImportController");
const { getJobStatus } = require("../controllers/JobStatusController");

// Upload Excel + Start Background Job
router.post(
  "/products/import-excel",
  excelUpload.single("file"),
  startProductImport
);

// Check Job Status
router.get("/products/import-status/:jobId", getJobStatus);

module.exports = router;
