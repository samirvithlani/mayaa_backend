const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        name: String,           // snapshot
        image: String,          // snapshot
        color: String,
        size: String,

        quantity: {
          type: Number,
          required: true,
        },

        price: Number,          // price at order time
        discount: Number,       // discount at order time
      },
    ],

    pricing: {
      subtotal: Number,
      discount: Number,
      shipping: Number,
      total: Number,
    },

    payment: {
      method: {
        type: String,
        enum: ["COD", "ONLINE"],
        required: true,
      },
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
        default: "PENDING",
      },
      transactionId: String,
    },

    orderStatus: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PLACED",
    },

    shippingAddress: {
      name: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
    },

    cancelledAt: Date,
    cancelReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
