const XLSX = require("xlsx");
const productImportQueue = require("../queues/productImportQueue");
const fs = require("fs");

const startProductImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    const filePath = req.file.path;

    // Read Excel rows first (just parse, do NOT insert here)
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log(rows)

    // Push job to queue
    const job = await productImportQueue.add("import-products", {
      rows,
      filePath,
    });

    return res.status(200).json({
      message: "Product import started",
      jobId: job.id,
      totalRows: rows.length,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to queue import", error: error.message });
  }
};

module.exports = { startProductImport };
