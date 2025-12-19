const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const defaultFields = require("../plugins/defaultFields");
mongoose.plugin(defaultFields);
const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },

    productSubCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "ProductSubCategory",
      required: true,
    },
    productCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "ProductCategory",
      required: true,
    },

    price: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },

    brand: { type: String, required: true },

    // COLOR VARIANTS
    colors: [
      {
        name: String,
        hexCode: String,
        
      },
    ],

    // SIZE VARIANTS
    sizes: [
      {
        size: String, // S M L XL
        stock: Number,
        sku: String,
      },
    ],

    // Basic attributes
    material: { type: String, required: true },
    fitType: {
      type: String,
      enum: ["Slim", "Regular", "Relaxed", "Oversized"],
    },

    weight: Number,
    dimensions: String,

    ageGroup: { type: String, required: true },
    gender: { type: String, required: true },

    productTags: [String],
    highlights: [String],
    careInstructions: [String],

    // Images
    images: { type: [String], required: true },

    sku: { type: String, required: true },

    // Ratings
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    // Flags
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    isFeatured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isTopRated: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },

    // Collection & season
    collection: String,
    season: String,

    // Return / replace policy
    returnPolicy: {
      returnable: { type: Boolean, default: true },
      days: { type: Number, default: 7 },
    },

    // Delivery info
    deliveryInfo: {
      estimatedDays: Number,
      shippingCharge: Number,
    },

    // SEO
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],

    // Videos
    

    lowStockAlert: { type: Number, default: 5 },
    isLive:{
      type:Boolean
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
