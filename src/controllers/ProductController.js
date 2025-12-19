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
      isLive:true,
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
      isLive
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
      isLive
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

const goLiveSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndUpdate(
      productId,
      { isLive: true },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product is live now"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const goLiveBulkProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs required"
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { isLive: true } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} products are live now`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



/**
 * UPDATE PRODUCT (EXCEPT IMAGES)
 * PUT /api/product/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // ❌ Remove images from update if sent
    if (req.body.images) {
      delete req.body.images;
    }

    // ❌ Prevent SKU overwrite if needed (optional)
    // delete req.body.sku;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: req.body, // partial update
      },
      {
        new: true,       // return updated doc
        runValidators: true,
      }
    )
      .populate("productCategoryId", "name")
      .populate("productSubCategoryId", "name");

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};


const updateProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image",
      });
    }

    if (req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 5 images at a time",
      });
    }

    // 2️⃣ Check product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 3️⃣ Upload to Cloudinary
    const uploadedImages = await Promise.all(
      req.files.map((file) =>
        cloudinary.uploader.upload(file.path, {
          folder: "maaya-products",
          timeout: 60000,
        })
      )
    );

    const imageUrls = uploadedImages.map((img) => img.secure_url);

    // 4️⃣ Append images (NOT replacing)
    product.images.push(...imageUrls);

    await product.save();

    // 5️⃣ Cleanup local files
    await Promise.all(
      req.files.map((file) => fs.unlink(file.path).catch(() => {}))
    );

    return res.status(200).json({
      success: true,
      message: "Product images uploaded successfully",
      images: product.images,
    });

  } catch (error) {
    console.error("Image upload error:", error);

    // Cleanup if error
    if (req.files) {
      await Promise.all(
        req.files.map((file) => fs.unlink(file.path).catch(() => {}))
      );
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload images",
      error: error.message,
    });
  }
};


module.exports = { createProduct,getAllProducts,getProductById,goLiveBulkProducts,goLiveSingleProduct,updateProduct,updateProductImages };
