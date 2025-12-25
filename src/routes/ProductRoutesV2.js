const router = require("express").Router();
const productController = require("../controllers/ProductControllerV2");
//const upload = require("../middlewares/uploadMiddleware");
const upload = require("../middlewares/uploadMiddlewares3");
router.post("/", upload.array("images", 5), productController.createProduct);
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.put("/:productId/go-live", productController.goLiveSingleProduct);
router.put("/updateProduct/:id", productController.updateProduct);
router.put("/go-live", productController.goLiveBulkProducts);
router.put(
  "/product/:id/images",
  upload.array("images", 5),
  productController.updateProductImages
);

module.exports = router;
