const { Queue } = require("bullmq");
const { Redis } = require("ioredis");

const redis = new Redis("clustercfg.maayakids-test.voarvu.aps1.cache.amazonaws.com:6379", { tls: {} });

const productImportQueue = new Queue("product-import-queue", {
  connection: redis,
});

module.exports = productImportQueue;
