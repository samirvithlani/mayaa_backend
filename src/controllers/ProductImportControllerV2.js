const XLSX = require("xlsx");
const productImportQueue = require("../queues/productImportQueue");
const fs = require("fs");

/**
 * START PRODUCT IMPORT (V2)
 * POST /api/product/import
 */
const startProductImport = async (req, res) => {
  try {
    // 1️⃣ Validate file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    // 2️⃣ Read Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "", // avoid undefined values
      raw: false,
    });

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Empty Excel file",
      });
    }

    // 3️⃣ Push job to queue
    const job = await productImportQueue.add("import-products", {
      rows,
    });

    // 4️⃣ Respond immediately
    return res.status(200).json({
      success: true,
      message: "Product import started",
      jobId: job.id,
      totalRows: rows.length,
    });
  } catch (error) {
    console.error("Product import error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start product import",
      error: error.message,
    });
  } finally {
    // 5️⃣ Cleanup uploaded file
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
};

module.exports = {
  startProductImport,
};
