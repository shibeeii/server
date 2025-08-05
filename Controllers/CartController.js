const Cart = require("../Models/CartModel");
const Product = require("../Models/ProductModel");

// Add or update cart item
exports.addToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    let cart = await Cart.findOne({ userId });

    if (cart) {
      const existingItem = cart.items.find(item => item.productId.equals(productId));

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ productId, quantity, price: product.price });
      }

      await cart.save();
      return res.json(cart);
    }

    const newCart = await Cart.create({
      userId,
      items: [{ productId, quantity, price: product.price }],
    });

    res.status(201).json(newCart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
// getcart
exports.getCart = async (req, res) => {
  const { userId } = req.params;
  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) return res.json({ items: [], total: 0 });

    const total = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    res.json({ items: cart.items, total }); // ✅ Flatten response
  } catch (err) {
    res.status(500).json({ error: "Error fetching cart" });
  }
};


// Update quantity
exports.updateItemQuantity = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = cart.items.find(item => item.productId.equals(productId));
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to update quantity" });
  }
};

// Remove item
exports.removeItem = async (req, res) => {
  const { userId, productId } = req.body;
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } },
      { new: true }
    );
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item" });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  const { userId } = req.params;
  try {
    await Cart.findOneAndUpdate({ userId }, { items: [] });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
};
