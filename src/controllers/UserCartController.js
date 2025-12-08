const Cart = require("../models/UserCartModel");
const Product = require("../models/ProductModel");

// -------------------------------------------
// CREATE CART for user (called first time only)
// -------------------------------------------
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

// -------------------------------------------
// GET CART BY USER ID
// -------------------------------------------
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

// -------------------------------------------
// ADD PRODUCT TO CART
// -------------------------------------------
exports.addProductToCart = async (req, res) => {
  try {
    const { userId, productId, color, size, quantity } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // VALIDATE VARIANT - SIZE STOCK
    const sizeVariant = product.sizes.find((s) => s.size === size);
    if (!sizeVariant) {
      return res.status(400).json({ message: "Invalid size variant" });
    }
    if (sizeVariant.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // CHECK IF ITEM ALREADY IN CART WITH SAME VARIANT
    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId &&
        item.color === color &&
        item.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        color,
        size,
        quantity,
        priceAtTime: product.price,
        discountAtTime: product.discountPercentage,
      });
    }

    await cart.save();

    return res.status(200).json({
      message: "Product added to cart",
      cart,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------
// UPDATE CART ITEM (quantity, color, size)
// -------------------------------------------
exports.updateCartItem = async (req, res) => {
  try {
    const { userId, itemId, quantity, color, size } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // UPDATE QUANTITY
    if (quantity !== undefined) {
      if (quantity <= 0) {
        item.remove(); // delete item automatically
      } else {
        item.quantity = quantity;
      }
    }

    // UPDATE COLOR OR SIZE
    if (color) item.color = color;
    if (size) item.size = size;

    await cart.save();

    return res.status(200).json({
      message: "Cart item updated",
      cart,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------
// REMOVE PRODUCT FROM CART
// -------------------------------------------
exports.removeCartItem = async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.remove();
    await cart.save();

    return res.status(200).json({
      message: "Item removed",
      cart,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------
// CLEAR CART
// -------------------------------------------
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
