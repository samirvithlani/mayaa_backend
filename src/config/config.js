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
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ||"dhye5fli7",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "149447439981939",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ||"GAkVvR0PpdI4UQ-uyYunj8fE8dU",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION ,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME 
};
