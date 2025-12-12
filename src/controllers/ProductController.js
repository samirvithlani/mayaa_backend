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
    let queryObj = {};
    let {
      search,
      category,
      subCategory,
      minPrice,
      maxPrice,
      brand,
      gender,
      ageGroup,
      tags,
      isFeatured,
      isNew,
      isBestSeller,
      isTopRated,
      isOnSale,
      isTrending,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    // ---------- TEXT SEARCH ----------
    if (search) {
      queryObj.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { productTags: { $regex: search, $options: "i" } },
      ];
    }

    // ---------- CATEGORY FILTER ----------
    if (category) queryObj.productCategoryId = category;
    if (subCategory) queryObj.productSubCategoryId = subCategory;

    // ---------- PRICE RANGE ----------
    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }

    // ---------- SIMPLE FIELDS ----------
    if (brand) queryObj.brand = { $regex: brand, $options: "i" };
    if (gender) queryObj.gender = gender;
    if (ageGroup) queryObj.ageGroup = ageGroup;

    // ---------- TAGS ----------
    if (tags) {
      queryObj.productTags = { $in: tags.split(",") };
    }

    // ---------- FLAGS (true/false fields) ----------
    const flagFields = {
      isFeatured,
      isNew,
      isBestSeller,
      isTopRated,
      isOnSale,
      isTrending,
    };

    Object.entries(flagFields).forEach(([key, value]) => {
      if (value !== undefined) {
        queryObj[key] = value === "true"; // convert to Boolean
      }
    });

    // ---------- SORT ----------
    let sortOption = {};
    if (sort) {
      // examples: sort = price, -price, createdAt, -rating.average
      const parts = sort.split(",");
      parts.forEach((field) => {
        if (field.startsWith("-")) {
          sortOption[field.substring(1)] = -1;
        } else {
          sortOption[field] = 1;
        }
      });
    } else {
      sortOption = { createdAt: -1 }; // default latest first
    }

    // ---------- PAGINATION ----------
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    // ---------- EXECUTE QUERY ----------
    const products = await Product.find(queryObj)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(queryObj);

    res.status(200).json({
      message: "Products fetched successfully",
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).where({});
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
