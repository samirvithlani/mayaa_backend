const { Redis } = require("ioredis");

const redis = new Redis(
  //"rediss://red-cujm3nt2ng1s73b92o1g:L7RB5dQeIHEPOURTniYt21LJscQBO2wO@oregon-keyvalue.render.com:6379",
  "clustercfg.maayakids-test.voarvu.aps1.cache.amazonaws.com:6379"
  )

module.exports = redis;
