const { Worker } = require("bullmq");
//const redis = require("../config/redis");
const Product = require("../models/ProductModel");
const { Redis } = require("ioredis");
const dbConnection = require("../utils/Db");
dbConnection();
const redis = new Redis(
  "rediss://red-cujm3nt2ng1s73b92o1g:L7RB5dQeIHEPOURTniYt21LJscQBO2wO@oregon-keyvalue.render.com:6379",
  {
    maxRetriesPerRequest: null,
  }
);
const BATCH_SIZE = 100;

function safeJSON(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
function safeArray(val) {
  if (!val) return [];
  if (typeof val === "string") return val.split(",").map((v) => v.trim());
  return val;
}

const worker = new Worker(
  "product-import-queue",
  async (job) => {
    const { rows } = job.data;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (row) => {
          try {
            await Product.create({
              name: row.name,
              description: row.description,
              productCategoryId: row.productCategoryId,
              productSubCategoryId: row.productSubCategoryId,
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

              // ❌ images removed

              sku: row.sku,

              // Status booleans
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
            });
          } catch (err) {
            console.log("Row import error:", err.message);
          }
        })
      );

      await job.updateProgress(
        Math.min(((i + BATCH_SIZE) / rows.length) * 100, 100)
      );
    }

    return { message: "Import completed", total: rows.length };
  },
  { connection: redis }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed: ${err.message}`);
});
