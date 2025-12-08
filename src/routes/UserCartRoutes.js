const express = require("express");
const router = express.Router();
const cartController = require("../controllers/UserCartController");

router.post("/create", cartController.createCart);
router.get("/:userId", cartController.getCartByUserId);
router.post("/add", cartController.addProductToCart);
router.put("/update", cartController.updateCartItem);
router.delete("/remove", cartController.removeCartItem);
router.delete("/clear", cartController.clearCart);

module.exports = router;
