const { Queue } = require("bullmq");
const redis = require("../config/redis");

const productImportQueue = new Queue("product-import-queue", {
  connection: redis,
});

module.exports = productImportQueue;
