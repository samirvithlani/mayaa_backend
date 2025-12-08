const Product = require("../models/ProductModel");
const upload = require("../middlewares/uploadMiddleware");
const cloudinary = require("../config/cloudinaryConfig");
// ✅ FIX for ProductController.js
const fs = require("fs/promises");

const createProduct = async (req, res) => {
  try {
    // 1. File validation
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Validation Error",
        error: "At least one product image is required.",
      });
    }

    // 2. Parse JSON fields from FormData
    try {
      req.body.colors = JSON.parse(req.body.colors || "[]");
      req.body.sizes = JSON.parse(req.body.sizes || "[]");

      req.body.productTags = JSON.parse(req.body.productTags || "[]");
      req.body.highlights = JSON.parse(req.body.highlights || "[]");
      req.body.careInstructions = JSON.parse(req.body.careInstructions || "[]");
      req.body.metaKeywords = JSON.parse(req.body.metaKeywords || "[]");

      req.body.returnPolicy = JSON.parse(req.body.returnPolicy || "{}");
      req.body.deliveryInfo = JSON.parse(req.body.deliveryInfo || "{}");
    } catch (jsonErr) {
      return res.status(400).json({
        message: "Invalid JSON format",
        error: jsonErr.message,
      });
    }

    // 3. Upload images to Cloudinary
    const imagePaths = req.files.map((file) => file.path);
    const uploadedImages = await Promise.all(
      imagePaths.map((path) =>
        cloudinary.uploader.upload(path, {
          folder: "maaya-products",
          timeout: 60000,
        })
      )
    );

    // 4. Create product
    const product = await Product.create({
      ...req.body,
      images: uploadedImages.map((img) => img.secure_url),
    });

    // 5. Cleanup local files
    await Promise.all(imagePaths.map((path) => fs.unlink(path)));

    res.status(201).json({
      message: "Product created successfully",
      data: product,
    });

  } catch (error) {
    console.error("Error creating product:", error);

    // Cleanup local images on error
    if (req.files) {
      await Promise.all(
        req.files.map((file) => fs.unlink(file.path).catch(() => {}))
      );
    }

    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res
      .status(200)
      .json({ message: "Products fetched successfully", data: products });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).where({
      status: "active",
    });
    res
      .status(200)
      .json({ message: "Product fetched successfully", data: product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
};

module.exports = { createProduct,getAllProducts,getProductById };
