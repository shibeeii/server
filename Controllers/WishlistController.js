const Wishlist = require("../Models/WishlistModel");


// ADD to Wishlist
exports.addToWishlist = async (req, res) => {
  const { userId, productId } = req.body;

  try {
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId,
        items: [{ productId }],
      });
    } else {
      const exists = wishlist.items.some((item) =>
        item.productId.toString() === productId
      );

      if (!exists) {
        wishlist.items.push({ productId });
      }
    }

    await wishlist.save();
    res.status(200).json({ success: true, message: "Added to wishlist" });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET Wishlist with populated product info
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.params.userId }).populate("items.productId");

    if (!wishlist || wishlist.items.length === 0) {
      return res.status(200).json({ items: [] });
    }

    res.status(200).json({ items: wishlist.items });
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// REMOVE item from Wishlist
exports.removeFromWishlist = async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } },
      { new: true }
    ).populate("items.productId");

    res.status(200).json({ items: wishlist?.items || [] });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// CLEAR Wishlist
exports.clearWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ userId: req.params.userId });
    res.status(200).json({ message: "Wishlist cleared" });
  } catch (err) {
    console.error("Error clearing wishlist:", err);
    res.status(500).json({ error: "Server error" });
  }
};
