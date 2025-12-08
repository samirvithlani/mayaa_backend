const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true, // one cart per user
    },

    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        color: String,
        size: String,

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        // Price snapshot (important if price changes later)
        priceAtTime: Number,
        discountAtTime: Number,

        addedAt: { type: Date, default: Date.now },
      },
    ],

    // Cart totals (optional)
    totalAmount: Number,
    totalDiscount: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
