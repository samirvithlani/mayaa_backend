const { Queue } = require("bullmq");
const { Redis } = require("ioredis");

const redis = new Redis("rediss://red-cujm3nt2ng1s73b92o1g:L7RB5dQeIHEPOURTniYt21LJscQBO2wO@oregon-keyvalue.render.com:6379", { tls: {} });

const productImportQueue = new Queue("product-import-queue", {
  connection: redis,
});

module.exports = productImportQueue;
