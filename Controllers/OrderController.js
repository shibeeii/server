const Order = require("../Models/OrderModel");
const sendEmail = require("../Utils/sendEmail");
const User = require("../Models/UserModel");

// 📌 Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate({
        path: "items.productId",
        model: "products",
        select: "productname price image",
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// 📌 Create order
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, shippingAddress, amount, paymentMode, paymentId, orderId } = req.body;

    const newOrder = new Order({
      userId,
      items,
      shippingAddress,
      amount,
      paymentMode: paymentMode || "Razorpay",
      paymentId,
      orderId
    });

    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
};

// 📌 Update order status
exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;

    // ✅ If whole order delivered → mark all items as delivered
    if (status === "Delivered") {
      order.items.forEach(item => {
        item.status = "Delivered";
      });
    }

    await order.save();
    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

// 📌 Get orders by user
exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId || userId.length !== 24) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const orders = await Order.find({ userId })
      .populate({
        path: "items.productId",
        model: "products",
      })
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ message: "Failed to fetch user orders", error: err.message });
  }
};

// 📌 Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ message: "Delivered orders cannot be cancelled" });
    }

    order.status = "Cancelled";
    await order.save();

    res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    console.error("Error cancelling order:", err);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

// 📌 Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
};

// 📌 Return entire order
exports.returnOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }

    // ✅ Update order + all items
    order.status = "Returned";
    order.items.forEach(item => {
      item.status = "Returned";
    });

    await order.save();

    // 📧 Send email
    const user = await User.findById(order.userId);
    if (user) {
      const emailHTML = `
        <h2>Hi ${user.name},</h2>
        <p>Your return request for order <strong>#${order._id}</strong> has been successfully received.</p>
        <p>Our team will review your return and get back to you soon.</p>
        <p>Thank you for shopping with Q-Mart.</p>
      `;
      const plainText = `Hi ${user.name},\n\nYour return request for order #${order._id} has been successfully received.\n\nThank you for shopping with Q-Mart.`;

      await sendEmail(user.email, "Return Request Received - Q-Mart", plainText, emailHTML);
    }

    res.json({ message: "Order returned successfully", order });
  } catch (error) {
    console.error("Error returning order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Return single order item
exports.returnOrderItem = async (req, res) => {
  const { orderId, itemId } = req.params;
  const { reason } = req.body;

  try {
    let order = await Order.findById(orderId).populate("items.productId", "productname image price");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Order item not found" });

    if (item.status !== "Delivered") {
      return res.status(400).json({ message: "Only delivered items can be returned" });
    }

    // ✅ Update item with reason
    item.status = "Returned";
    item.returnReason = reason || "Not specified";

    if (order.items.every(i => i.status === "Returned")) {
      order.status = "Returned";
    }

    await order.save();

    // 📧 Send email
    const user = await User.findById(order.userId);
    if (user) {
      const emailHTML = `
        <h2>Hi ${user.name},</h2>
        <p>Your return request for item <strong>${item.productId.productname}</strong> (Order #${order._id}) has been successfully received.</p>
        <p>Reason: ${item.returnReason}</p>
        <p>Our team will review your return and get back to you soon.</p>
        <p>Thank you for shopping with Q-Mart.</p>
      `;
      const plainText = `Hi ${user.name},\n\nYour return request for item ${item.productId.productname} (Order #${order._id}) has been successfully received.\nReason: ${item.returnReason}\n\nThank you for shopping with Q-Mart.`;

      await sendEmail(user.email, "Return Request Received - Q-Mart", plainText, emailHTML);
    }

    // 🔑 Re-fetch with population
    order = await Order.findById(orderId)
      .populate("userId", "name email")
      .populate({
        path: "items.productId",
        model: "products",
        select: "productname price image",
      });

    res.json({ message: "Order item returned successfully", order });
  } catch (error) {
    console.error("Error returning order item:", error);
    res.status(500).json({ message: "Server error" });
  }
};
