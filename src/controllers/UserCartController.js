const Cart = require("../models/UserCartModel");
const Product = require("../models/ProductModelV2");

/* =====================================================
   CREATE CART (UNCHANGED – SAFE)
===================================================== */
exports.createCart = async (req, res) => {
  try {
    const { userId } = req.body;

    let existing = await Cart.findOne({ userId });
    if (existing) {
      return res.status(200).json({
        message: "Cart already exists",
        cart: existing,
      });
    }

    const newCart = await Cart.create({
      userId,
      items: [],
    });

    return res.status(201).json({
      message: "Cart created",
      cart: newCart,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* =====================================================
   GET CART BY USER
===================================================== */
exports.getCartByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    return res.status(200).json(cart);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* =====================================================
   ADD PRODUCT TO CART (FULLY FIXED FOR V2)
===================================================== */
exports.addProductToCart = async (req, res) => {
  try {
    const { userId, productId, color, size, quantity } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 🔹 Find color variant
    const variant = product.variants.find(
      (v) => v.color.name === color
    );
    if (!variant) {
      return res.status(400).json({ message: "Color not found" });
    }

    // 🔹 Find size
    const sizeVariant = variant.sizes.find(
      (s) => s.size === size
    );
    if (!sizeVariant) {
      return res.status(400).json({ message: "Size not found" });
    }

    if (sizeVariant.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // 🔹 CHECK EXISTING ITEM
    const existingItem = cart.items.find(
      (i) =>
        i.productId.toString() === productId &&
        i.color === color &&
        i.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
    cart.items.push({
  productId,

  // 🔥 ADD THESE TWO LINES
  name: product.name,
  image: variant.images?.[0] || product.images?.[0],

  color,
  size,
  quantity,
  priceAtTime: sizeVariant.price,
  discountAtTime: 0,
});

    }

    await cart.save();

    return res.status(200).json({
      message: "Product added to cart",
      cart,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};


/* =====================================================
   UPDATE CART ITEM (ONLY QUANTITY – SAFE)
===================================================== */
exports.updateCartItem = async (req, res) => {
  try {
    const { userId, itemId, quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Only quantity update allowed
    if (quantity <= 0) {
      item.remove();
    } else {
      item.quantity = quantity;
    }

    await cart.save();

    return res.status(200).json({
      message: "Cart item updated",
      cart,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* =====================================================
   REMOVE ITEM FROM CART
===================================================== */
exports.removeCartItem = async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (i) => i._id.toString() !== itemId.toString()
    );

    await cart.save();

    return res.status(200).json({
      message: "Item removed",
      cart,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* =====================================================
   CLEAR CART
===================================================== */
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      message: "Cart cleared",
      cart,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
