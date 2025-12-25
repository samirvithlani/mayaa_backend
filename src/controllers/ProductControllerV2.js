const Product = require("../models/ProductModelV2");
const ProductCategory = require("../models/ProductCategoryModel");
const cloudinary = require("../config/cloudinaryConfig");
const fs = require("fs/promises");

/* =====================================================
   CREATE PRODUCT (VARIANT-BASED)
===================================================== */
// const createProduct = async (req, res) => {
//   try {
//     // 1️⃣ Validate images
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one product image is required",
//       });
//     }

//     // 2️⃣ Parse JSON fields
//     try {
//       req.body.variants = JSON.parse(req.body.variants || "[]");
//       req.body.productTags = JSON.parse(req.body.productTags || "[]");
//       req.body.highlights = JSON.parse(req.body.highlights || "[]");
//       req.body.careInstructions = JSON.parse(
//         req.body.careInstructions || "[]"
//       );
//       req.body.seo = JSON.parse(req.body.seo || "{}");
//     } catch (err) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid JSON format",
//         error: err.message,
//       });
//     }

//     if (!req.body.variants || req.body.variants.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one variant is required",
//       });
//     }

//     // 3️⃣ Extract URL + KEY from S3
//     const images = req.files.map((file) => ({
//       url: file.location,
//       key: file.key,
//     }));

//     // 4️⃣ Assign images to FIRST variant
//     req.body.variants[0].images = images;

//     // 5️⃣ Create product
//     const product = await Product.create({
//       ...req.body,
//       status: "active",
//     });

//     res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       data: product,
//     });
//   } catch (error) {
//     console.error("Create product error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to create product",
//       error: error.message,
//     });
//   }
// };

const createProduct = async (req, res) => {
  try {
    // 1️⃣ Validate images
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    // 2️⃣ Parse JSON fields
    try {
      req.body.variants = JSON.parse(req.body.variants || "[]");
      req.body.productTags = JSON.parse(req.body.productTags || "[]");
      req.body.highlights = JSON.parse(req.body.highlights || "[]");
      req.body.careInstructions = JSON.parse(
        req.body.careInstructions || "[]"
      );
      req.body.seo = JSON.parse(req.body.seo || "{}");
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format",
        error: err.message,
      });
    }

    if (!req.body.variants || req.body.variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required",
      });
    }

    // 3️⃣ Extract URL + KEY from S3
    const images = req.files.map((file) => ({
      url: file.location,
      key: file.key,
    }));

    // 4️⃣ Assign images to FIRST variant
    req.body.variants[0].images = images;

    // 5️⃣ Create product
    const product = await Product.create({
      ...req.body,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};


/* =====================================================
   GET ALL PRODUCTS (FILTER + SORT + PAGINATION)
===================================================== */

const getAllProducts = async (req, res) => {
  try {
    let {
      search,
      category, // category ID
      categoryName, // category NAME (from Header)
      subCategory, // subcategory ID or name (based on your schema)
      minPrice,
      maxPrice,
      brand,
      gender,
      ageGroup,
      tags,
      status,
      isFeatured,
      isNew,
      isBestSeller,
      isTrending,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    let query = {};
    console.log("🔥 HIT getAllProducts");
    console.log("URL:", req.originalUrl);
    console.log("QUERY:", req.query);

    // =========================
    // 🔍 SEARCH
    // =========================
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { productTags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // =========================
    // 📦 CATEGORY (PRIORITY: NAME → ID)
    // =========================
    if (categoryName) {
      const cat = await ProductCategory.findOne({ name: categoryName }).select(
        "_id"
      );
      if (cat) {
        query.productCategoryId = cat._id;
      }
    } else if (category) {
      query.productCategoryId = category;
    }

    // =========================
    // 📦 SUBCATEGORY
    // =========================
    if (subCategory) {
      query.productSubCategoryId = subCategory;
    }

    // =========================
    // 💰 PRICE FILTER (CORRECT FOR VARIANTS → SIZES)
    // =========================
    if (minPrice || maxPrice) {
      query.variants = {
        $elemMatch: {
          sizes: {
            $elemMatch: {
              ...(minPrice && { price: { $gte: Number(minPrice) } }),
              ...(maxPrice && { price: { $lte: Number(maxPrice) } }),
            },
          },
        },
      };
    }

    // =========================
    // 👕 ATTRIBUTES
    // =========================
    if (brand) query.brand = { $regex: brand, $options: "i" };
    if (gender) query.gender = gender;
    if (ageGroup) query.ageGroup = ageGroup;

    // =========================
    // 🏷 TAGS
    // =========================
    if (tags) {
      query.productTags = { $in: tags.split(",") };
    }

    // =========================
    // 🚩 FLAGS
    // =========================
    const flags = { isFeatured, isNew, isBestSeller, isTrending };
    Object.entries(flags).forEach(([key, val]) => {
      if (val !== undefined) query[key] = val === "true";
    });

    // =========================
    // 📌 STATUS
    // =========================
    if (status) query.status = status;

    // =========================
    // 🔃 SORTING
    // =========================
    let sortOption = { createdAt: -1 };

    if (sort) {
      sortOption = {};
      sort.split(",").forEach((field) => {
        sortOption[field.startsWith("-") ? field.slice(1) : field] =
          field.startsWith("-") ? -1 : 1;
      });
    }

    // =========================
    // 📄 PAGINATION
    // =========================
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    // =========================
    // 📦 QUERY EXECUTION (OPTIMIZED)
    // =========================
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limit).lean(),

      Product.countDocuments(query),
    ]);

    // =========================
    // ✅ RESPONSE
    // =========================
    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    console.error("getAllProducts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

module.exports = { getAllProducts };

/* =====================================================
   GET PRODUCT BY ID
===================================================== */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

/* =====================================================
   GO LIVE (SINGLE & BULK)
===================================================== */
const goLiveSingleProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { status: "active" },
      { new: true }
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: "Product is live now" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const goLiveBulkProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Product IDs are required",
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { status: "active" } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} products are live now`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   UPDATE PRODUCT (SAFE FIELDS ONLY)
===================================================== */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // 🚫 Prevent dangerous updates
    delete req.body.variants;
    delete req.body.analytics;

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE VARIANT IMAGES
===================================================== */
const updateProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { color } = req.body;

    // 1️⃣ Validate images
    if (!req.files || !req.files.length) {
      return res.status(400).json({
        success: false,
        message: "Please upload images",
      });
    }

    // 2️⃣ Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 3️⃣ Find variant
    let variant;

    if (color) {
      variant = product.variants.find(
        (v) =>
          v.color?.name?.toLowerCase() === color.toLowerCase()
      );

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Variant color "${color}" not found`,
        });
      }
    } else {
      variant = product.variants[0];

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: "No variants found in product",
        });
      }
    }

    // 4️⃣ Images already uploaded to S3 by multer-s3
    const newImages = req.files.map((file) => ({
      url: file.location,
      key: file.key,
    }));

    // 5️⃣ Append images to variant
    variant.images.push(...newImages);

    // 6️⃣ Save product
    await product.save();

    res.status(200).json({
      success: true,
      message: "Variant images updated",
      images: variant.images,
      variant: {
        color: variant.color?.name,
        totalImages: variant.images.length,
      },
    });
  } catch (error) {
    console.error("Update product images error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update images",
      error: error.message,
    });
  }
};


/* =====================================================
   EXPORTS
===================================================== */
module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  goLiveSingleProduct,
  goLiveBulkProducts,
  updateProduct,
  updateProductImages,
};
