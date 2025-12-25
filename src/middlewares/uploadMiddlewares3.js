const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");

const s3 = require("../utils/s3");
const config = require("../config/config");

const upload = multer({
  storage: multerS3({
    s3,
    bucket: config.AWS_S3_BUCKET_NAME,

    // 🔓 make public (same behavior as Cloudinary URLs)
    //acl: "public-read",

    // auto detect content-type
    contentType: multerS3.AUTO_CONTENT_TYPE,

    // file path inside bucket
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const fileName = `products/${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${ext}`;

      cb(null, fileName);
    },
  }),

  // ⛔ max 5MB per file
  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  // ✅ same filter logic you already use
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error("Only images or PDFs are allowed"));
    }
  },
});

module.exports = upload; // ✅ same export style
