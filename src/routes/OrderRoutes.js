const express = require("express");
const router = express.Router();

const orderController = require("../controllers/UserOrderController");

// middlewares
const authMiddlewre = require("../middlewares/AuthMiddlewre"); 


/**
 * USER ROUTES
 */

// Create order
router.post("/order", authMiddlewre("USER","ADMIN"), orderController.createOrder);

// Get order by ID (own order)
router.get("/order/:id", authMiddlewre("USER","ADMIN"), orderController.getOrderById);

// Cancel order (own order)
router.patch("/order/:id/cancel", authMiddlewre("USER","ADMIN"), orderController.cancelOrder);

// Get my orders
router.get("/orders/my", authMiddlewre("USER","ADMIN"), orderController.getMyOrders);

/**
 * ADMIN ROUTES
 */

// Get all orders
router.get(
  "/admin/orders",
  authMiddlewre("USER","ADMIN"),
  orderController.getAllOrders
);

// Update order status
router.patch(
  "/admin/order/:id/status",
  authMiddlewre("USER","ADMIN"),
  orderController.updateOrderStatus
);

module.exports = router;
