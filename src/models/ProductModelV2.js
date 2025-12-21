const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const defaultFields = require("../plugins/defaultFields");

mongoose.plugin(defaultFields);

/* =========================
   VARIANT SIZE SCHEMA
========================= */
const variantSizeSchema = new Schema(
  {
    size: {
      type: String, // S M L XL
      required: true,
      uppercase: true,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
    },

    price: {
      type: Number, // final price for this variant
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

/* =========================
   VARIANT (COLOR) SCHEMA
========================= */
const variantSchema = new Schema(
  {
    color: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      hexCode: {
        type: String,
        required: true,
        uppercase: true,
      },
    },

    images: {
      type: [String], // color-specific images
      required: true,
    },

    sizes: {
      type: [variantSizeSchema],
      required: true,
      validate: [(v) => v.length > 0, "At least one size required"],
    },
  },
  { _id: false }
);

/* =========================
   PRODUCT SCHEMA
========================= */
const productSchema = new Schema(
  {
    /* ---------- BASIC INFO ---------- */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      
      trim: true,
    },

    /* ---------- CATEGORY ---------- */
    productCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "ProductCategory",
      required: true,
      index: true,
    },

    productSubCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "ProductSubCategory",
      required: true,
      index: true,
    },

    /* ---------- VARIANTS ---------- */
    variants: {
      type: [variantSchema],
      required: true,
      validate: [(v) => v.length > 0, "At least one variant required"],
    },

    /* ---------- ATTRIBUTES ---------- */
    material: {
      type: String,
      required: true,
    },

    fitType: {
      type: String,
      enum: ["Slim", "Regular", "Relaxed", "Oversized"],
    },

    ageGroup: {
      type: String,
      enum: ["Kids", "Adults"],
      
    },

    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex", "Kids"],
      required: true,
    },

    /* ---------- CONTENT ---------- */
    highlights: [String],
    careInstructions: [String],
    productTags: [String],

    /* ---------- RATING ---------- */
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    /* ---------- STATUS ---------- */
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
      index: true,
    },

    /* ---------- FLAGS ---------- */
    isFeatured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },

    /* ---------- SEO ---------- */
    seo: {
      slug: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
    },

    /* ---------- ANALYTICS ---------- */
    analytics: {
      views: { type: Number, default: 0 },
      sold: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

/* ---------- TEXT SEARCH ---------- */
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  productTags: "text",
});

module.exports = mongoose.model("Productv2", productSchema);
