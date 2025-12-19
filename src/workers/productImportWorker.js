const { Worker } = require("bullmq");
const Product = require("../models/ProductModel");
const { Redis } = require("ioredis");
const mongoose = require("mongoose");
const dbConnection = require("../utils/Db");
dbConnection();

// Redis connection
const redis = new Redis("rediss://red-cujm3nt2ng1s73b92o1g:L7RB5dQeIHEPOURTniYt21LJscQBO2wO@oregon-keyvalue.render.com:6379", {
  maxRetriesPerRequest: null,
  tls: {},
});

const BATCH_SIZE = 100;

// Convert strings into ObjectId
function toObjectId(id) {
  if (!id) return null;

  id = id.toString().replace(/ObjectId\(['"](.+)['"]\)/, "$1");
  return new mongoose.Types.ObjectId(id);
}

function safeJSON(val, fallback) {
  try {
    return typeof val === "string" ? JSON.parse(val) : val;
  } catch {
    return fallback;
  }
}

function safeArray(val) {
  if (!val) return [];
  return typeof val === "string" ? val.split(",").map((x) => x.trim()) : val;
}

const worker = new Worker(
  "product-import-queue",
  async (job) => {
    const { rows } = job.data;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      for (const row of batch) {
        try {
          await Product.create({
            name: row.name,
            description: row.description,

            productCategoryId: toObjectId(row.productCategoryId),
            productSubCategoryId: toObjectId(row.productSubCategoryId),

            price: row.price,
            discountPercentage: row.discountPercentage || 0,
            brand: row.brand,
            material: row.material,
            fitType: row.fitType,
            weight: row.weight,
            dimensions: row.dimensions,
            ageGroup: row.ageGroup,
            gender: row.gender,

            colors: safeJSON(row.colors, []),
            sizes: safeJSON(row.sizes, []),

            productTags: safeArray(row.productTags),
            highlights: safeArray(row.highlights),
            careInstructions: safeArray(row.careInstructions),

            sku: row.sku,

            isFeatured: row.isFeatured || false,
            isNew: row.isNew || false,
            isBestSeller: row.isBestSeller || false,
            isTopRated: row.isTopRated || false,
            isOnSale: row.isOnSale || false,
            isTrending: row.isTrending || false,

            collection: row.collection,
            season: row.season,

            returnPolicy: {
              returnable: row.returnable ?? true,
              days: row.returnDays ?? 7,
            },

            deliveryInfo: {
              shippingCharge: row.shippingCharge || 0,
              estimatedDays: row.estimatedDays || 0,
            },

            metaTitle: row.metaTitle,
            metaDescription: row.metaDescription,
            metaKeywords: safeArray(row.metaKeywords),
            isLive:false
          });
        } catch (err) {
          console.log("Row import error:", err.message);
        }
      }

      await job.updateProgress(Math.min(((i + BATCH_SIZE) / rows.length) * 100, 100));
    }

    return { message: "Import completed", total: rows.length };
  },
  { connection: redis }
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed successfully.`));
worker.on("failed", (job, err) => console.log(`Job ${job.id} failed: ${err.message}`));
