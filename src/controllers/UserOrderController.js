const Order = require("../models/UserOrderModel");
const Cart = require("../models/UserCartModel");
const Address = require("../models/UserAddressModel");

/**
 * CREATE ORDER
 * POST /order
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId, paymentMethod } = req.body;

    // 1. Get cart
    const cart = await Cart.findOne({ userId }).populate(
      "items.productId"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // 2. Get selected address
    const address = await Address.findOne({
      _id: addressId,
      userId,
    });

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Invalid address",
      });
    }

    // 3. Prepare order items (SNAPSHOT)
    const items = cart.items.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      image: item.productId.images?.[0],
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      price: item.priceAtTime,
      discount: item.discountAtTime || 0,
    }));

    // 4. Calculate pricing
    const subtotal = items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    const discount = items.reduce(
      (sum, i) => sum + i.discount * i.quantity,
      0
    );

    const shipping = subtotal > 2000 ? 0 : 100;

    // 5. Create order
    const order = await Order.create({
      userId,
      items,
      pricing: {
        subtotal,
        discount,
        shipping,
        total: subtotal - discount + shipping,
      },
      payment: {
        method: paymentMethod,
      },
      shippingAddress: {
        name: address.name,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      },
    });

    // 6. Clear cart
    await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalAmount: 0, totalDiscount: 0 }
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({
      success: false,
      message: "Order creation failed",
    });
  }
};

/**
 * GET ORDER BY ID
 * GET /order/:id
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

/**
 * GET USER ORDERS
 * GET /orders/my
 */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    console.error("Get my orders error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

/**
 * CANCEL ORDER
 * PATCH /order/:id/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.orderStatus === "SHIPPED" ||
      order.orderStatus === "DELIVERED"
    ) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled",
      });
    }

    order.orderStatus = "CANCELLED";
    order.cancelReason = reason;
    order.cancelledAt = new Date();

    if (order.payment.method === "ONLINE") {
      order.payment.status = "REFUNDED";
    }

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
};

/**
 * ADMIN – GET ALL ORDERS
 * GET /admin/orders
 */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    console.error("Admin orders error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

/**
 * ADMIN – UPDATE ORDER STATUS
 * PATCH /admin/order/:id/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};
