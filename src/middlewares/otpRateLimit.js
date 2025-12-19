// middlewares/otpRateLimit.js
const redis = require("../config/redis");

module.exports = async (req, res, next) => {
  const ip = req.ip;
  const key = `signup:rate:${ip}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 3600); // 1 hour
  }

  if (count > 5) {
    return res.status(429).json({
      message: "Too many OTP requests. Try after 1 hour.",
    });
  }

  next();
};
