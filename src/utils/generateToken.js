// utils/generateToken.js
const jwt = require("jsonwebtoken");

function sign(payload, expiresIn) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

exports.generateAccessToken = (user) => {
  return sign({ id: user._id }, process.env.JWT_ACCESS_EXPIRES || "15m");
};

exports.generateRefreshToken = (user) => {
  // long-lived token (we will also store it server-side)
  return sign({ id: user._id }, process.env.JWT_REFRESH_EXPIRES || "30d");
};
