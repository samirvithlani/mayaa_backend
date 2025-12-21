const mongoose = require("mongoose");
const Order = require("../models/UserOrderModel");
const Cart = require("../models/UserCartModel");
const Address = require("../models/UserAddressModel");
const Product = require("../models/ProductModelV2");

/**
 * CREATE ORDER
 * POST /order
 */
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { addressId, paymentMethod } = req.body;

    if (!addressId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Address and payment method required",
      });
    }

    // 1️⃣ Get cart
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // 2️⃣ Get address (India only)
    const address = await Address.findOne({
      _id: addressId,
      userId,
    }).session(session);

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Invalid address",
      });
    }

    // 3️⃣ Prepare ORDER ITEMS (snapshot + validation)
    const items = [];

    for (const item of cart.items) {
      if (typeof item.priceAtTime !== "number" || item.priceAtTime <= 0) {
        throw new Error("Invalid cart pricing data");
      }

      items.push({
        productId: item.productId, // ✅ already ObjectId
        name: item.name, // ✅ snapshot from cart
        image: item.image, // ✅ snapshot from cart
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: item.priceAtTime,
        discount: item.discountAtTime || 0,
      });

      // 4️⃣ Reduce STOCK (variant + size)
      const stockUpdate = await Product.updateOne(
        {
           _id: item.productId, // ✅ CORRECT
          "variants.color.name": item.color,
          "variants.sizes.size": item.size,
          "variants.sizes.stock": { $gte: item.quantity },
        },
        {
          $inc: {
            "variants.$[v].sizes.$[s].stock": -item.quantity,
          },
        },
        {
          arrayFilters: [
            { "v.color.name": item.color },
            { "s.size": item.size },
          ],
          session,
        }
      );

      if (stockUpdate.modifiedCount === 0) {
        throw new Error(
          `Insufficient stock for ${item.productId.name} (${item.color} / ${item.size})`
        );
      }
    }

    // 5️⃣ Calculate pricing
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const discount = items.reduce((sum, i) => sum + i.discount * i.quantity, 0);

    const shipping = subtotal > 2000 ? 0 : 100;

    // 6️⃣ Create ORDER
    const order = await Order.create(
      [
        {
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
            status: paymentMethod === "COD" ? "PAID" : "PENDING",
          },
          orderStatus: "PLACED",
          shippingAddress: {
            name: address.name,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          },
        },
      ],
      { session }
    );

    // 7️⃣ Clear cart
    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Create order error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Order creation failed",
    });
  }
};

/**
 * GET ORDER BY ID (USER)
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

    res.json({ success: true, data: order });
  } catch (err) {
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

    res.json({ success: true, data: orders });
  } catch (err) {
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

    if (["SHIPPED", "DELIVERED"].includes(order.orderStatus)) {
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

    res.json({ success: true, data: orders });
  } catch (err) {
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

    const allowed = [
      "PLACED",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

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

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};
