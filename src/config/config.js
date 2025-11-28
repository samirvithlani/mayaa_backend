console.log("Config loading...");

const dotenv = require("dotenv");
const path = require("path");

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(__dirname, envFile) });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  HOST: process.env.HOST || "localhost",
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_URL || "mongodb+srv://samir:samir@cluster0.key63fx.mongodb.net/mayya-development",
  VERIFY: process.env.VERIFY_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ||"dmzvebhyl",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "233715149788265",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ||"8aBUpEX0x-rxr0KgQjJwrLExrP0",
};
