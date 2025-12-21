// const { Worker } = require("bullmq");
// const Product = require("../models/ProductModelV2"); // IMPORTANT
// const mongoose = require("mongoose");
// const { Redis } = require("ioredis");
// const dbConnection = require("../utils/Db");

// dbConnection();

// // Redis connection
// const redis = new Redis(
//   "rediss://red-cujm3nt2ng1s73b92o1g:L7RB5dQeIHEPOURTniYt21LJscQBO2wO@oregon-keyvalue.render.com:6379",
//   {
//     maxRetriesPerRequest: null,
//     tls: {},
//   }
// );

// // ---------- HELPERS ----------
// function toObjectId(id) {
//   if (!id) return null;
//   return new mongoose.Types.ObjectId(id.toString());
// }

// function safeBool(val) {
//   return val === true || val === "TRUE" || val === "true";
// }

// function safeArrayFromCells(...cells) {
//   return cells.filter(Boolean).map((v) => v.toString().trim());
// }

// function safeArrayFromCSV(val) {
//   if (!val) return [];
//   return val.split(",").map((v) => v.trim());
// }

// // ---------- WORKER ----------
// const worker = new Worker(
//   "product-import-queue",
//   async (job) => {
//     const { rows } = job.data;

//     /**
//      * STEP 1️⃣
//      * Group rows by product (name + slug)
//      */
//     const productMap = {};

//     for (const row of rows) {
//       const productKey = `${row.product_name}__${row.seo_slug}`;

//       if (!productMap[productKey]) {
//         productMap[productKey] = {
//           name: row.product_name,
//           description: row.description,
//           brand: row.brand,

//           productCategoryId: toObjectId(row.category_id),
//           productSubCategoryId: toObjectId(row.subcategory_id),

//           material: row.material,
//           fitType: row.fit_type || undefined,
//           gender: row.gender,
//           ageGroup: row.age_group || undefined,

//           highlights: safeArrayFromCells(row.highlight_1, row.highlight_2),
//           careInstructions: safeArrayFromCells(row.care_1, row.care_2),
//           productTags: safeArrayFromCells(row.tag_1, row.tag_2),

//           seo: {
//             slug: row.seo_slug,
//           },

//           isFeatured: safeBool(row.is_featured),
//           isNew: safeBool(row.is_new),
//           isBestSeller: safeBool(row.is_best_seller),
//           isTrending: safeBool(row.is_trending),

//           status: "active",

//           variants: {}, // temp map
//         };
//       }

//       /**
//        * STEP 2️⃣
//        * Handle color variant
//        */
//       const product = productMap[productKey];
//       const colorKey = row.color_name.toLowerCase();

//       if (!product.variants[colorKey]) {
//         product.variants[colorKey] = {
//           color: {
//             name: row.color_name,
//             hexCode: row.color_hex,
//           },
//           images: safeArrayFromCSV(row.image_urls),
//           sizes: [],
//         };
//       }

//       /**
//        * STEP 3️⃣
//        * Push size inside variant
//        */
//       product.variants[colorKey].sizes.push({
//         size: row.size,
//         sku: row.sku,
//         price: Number(row.price),
//         stock: Number(row.stock),
//       });
//     }

//     /**
//      * STEP 4️⃣
//      * Insert products into DB
//      */
//     let successCount = 0;
//     let failed = [];

//     for (const key of Object.keys(productMap)) {
//       try {
//         const productData = productMap[key];
//         productData.variants = Object.values(productData.variants);

//         await Product.create(productData);
//         successCount++;
//       } catch (err) {
//         console.error("❌ Product import failed:", err.message);
//         failed.push({ productKey: key, error: err.message });
//       }
//     }

//     return {
//       message: "Import completed",
//       totalProducts: Object.keys(productMap).length,
//       successCount,
//       failedCount: failed.length,
//       failed,
//     };
//   },
//   { connection: redis }
// );

// // ---------- EVENTS ----------
// worker.on("completed", (job) => {
//   console.log(`✅ Job ${job.id} completed`, job.returnvalue);
// });

// worker.on("failed", (job, err) => {
//   console.error(`❌ Job ${job.id} failed`, err.message);
// });

// module.exports = worker;


const express = require("express");
const { Worker } = require("bullmq");
const Product = require("../models/ProductModelV2");
const mongoose = require("mongoose");
const { Redis } = require("ioredis");
const dbConnection = require("../utils/Db");

// ---------------- DB ----------------
if (mongoose.connection.readyState === 0) {
  dbConnection();
}

// ---------------- REDIS ----------------
const redis = new Redis(
  "rediss://red-cujm3nt2ng1s73b92o1g:L7RB5dQeIHEPOURTniYt21LJscQBO2wO@oregon-keyvalue.render.com:6379",
  {
    maxRetriesPerRequest: null,
    tls: {},
  }
);

// ---------- HELPERS ----------
function toObjectId(id) {
  if (!id) return null;
  return new mongoose.Types.ObjectId(id.toString());
}

function safeBool(val) {
  return val === true || val === "TRUE" || val === "true";
}

function safeArrayFromCells(...cells) {
  return cells.filter(Boolean).map((v) => v.toString().trim());
}

function safeArrayFromCSV(val) {
  if (!val) return [];
  return val.split(",").map((v) => v.trim());
}

// ---------------- WORKER ----------------
const worker = new Worker(
  "product-import-queue",
  async (job) => {
    const { rows } = job.data;

    const productMap = {};

    for (const row of rows) {
      const productKey = `${row.product_name}__${row.seo_slug}`;

      if (!productMap[productKey]) {
        productMap[productKey] = {
          name: row.product_name,
          description: row.description,
          brand: row.brand,
          productCategoryId: toObjectId(row.category_id),
          productSubCategoryId: toObjectId(row.subcategory_id),
          material: row.material,
          fitType: row.fit_type || undefined,
          gender: row.gender,
          ageGroup: row.age_group || undefined,
          highlights: safeArrayFromCells(row.highlight_1, row.highlight_2),
          careInstructions: safeArrayFromCells(row.care_1, row.care_2),
          productTags: safeArrayFromCells(row.tag_1, row.tag_2),
          seo: { slug: row.seo_slug },
          isFeatured: safeBool(row.is_featured),
          isNew: safeBool(row.is_new),
          isBestSeller: safeBool(row.is_best_seller),
          isTrending: safeBool(row.is_trending),
          status: "active",
          variants: {},
        };
      }

      const product = productMap[productKey];
      const colorKey = row.color_name.toLowerCase();

      if (!product.variants[colorKey]) {
        product.variants[colorKey] = {
          color: { name: row.color_name, hexCode: row.color_hex },
          images: safeArrayFromCSV(row.image_urls),
          sizes: [],
        };
      }

      product.variants[colorKey].sizes.push({
        size: row.size,
        sku: row.sku,
        price: Number(row.price),
        stock: Number(row.stock),
      });
    }

    let successCount = 0;
    let failed = [];

    for (const key of Object.keys(productMap)) {
      try {
        const productData = productMap[key];
        productData.variants = Object.values(productData.variants);
        await Product.create(productData);
        successCount++;
      } catch (err) {
        failed.push({ productKey: key, error: err.message });
      }
    }

    return {
      totalProducts: Object.keys(productMap).length,
      successCount,
      failedCount: failed.length,
      failed,
    };
  },
  { connection: redis }
);

// ---------------- WORKER EVENTS ----------------
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed`, err.message);
});

// ---------------- DUMMY WEB SERVER ----------------
const app = express();

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "product-import-worker",
    worker: "running",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web service running on port ${PORT}`);
});
