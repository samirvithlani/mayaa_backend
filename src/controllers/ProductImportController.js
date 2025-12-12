const XLSX = require("xlsx");
const productImportQueue = require("../queues/productImportQueue");
const fs = require("fs");
const ProductCategory = require("../models/ProductCategoryModel");
const ProductSubCategory = require("../models/ProductSubCategoryModel");

// Convert category/subcategory names to ObjectIds
async function resolveIds(row) {
  const category = await ProductCategory.findOne({ name: row.category.trim() });
  if (!category)
    throw new Error(`Category not found: ${row.category}`);

  const sub = await ProductSubCategory.findOne({
    name: row.subCategory.trim(),
    productCategoryId: category._id,
  });

  if (!sub)
    throw new Error(
      `SubCategory "${row.subCategory}" not found for category "${row.category}"`
    );

  row.productCategoryId = category._id.toString();
  row.productSubCategoryId = sub._id.toString();

  delete row.category;
  delete row.subCategory;

  return row;
}

const startProductImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    let rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      return res.status(400).json({ message: "Empty Excel file" });
    }

    // Map category + subCategory
    const resolvedRows = [];
    for (const row of rows) {
      resolvedRows.push(await resolveIds(row));
    }

    const job = await productImportQueue.add("import-products", {
      rows: resolvedRows,
    });

    return res.status(200).json({
      message: "Product import started",
      jobId: job.id,
      totalRows: resolvedRows.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  } finally {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
  }
};

module.exports = { startProductImport };
