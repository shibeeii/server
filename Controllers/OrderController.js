const Order = require("../Models/OrderModel");
const sendEmail = require("../Utils/sendEmail");
const User = require("../Models/UserModel");


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

exports.createOrder = async (req, res) => {
  try {
    const { userId, items, shippingAddress, amount, paymentMode, paymentId, orderId } = req.body;

    const newOrder = new Order({
      userId,
      items,
      shippingAddress,
      amount,
      paymentMode: paymentMode || "Razorpay", // ✅ Defaults if not provided
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

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order status updated", order: updatedOrder });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

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



exports.returnOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "Delivered") {
      order.status = "Returned";
      await order.save();

      // Send return confirmation email
      try {
        const user = await User.findById(order.userId);
        if (user) {
          const emailHTML = `
            <h2>Hi ${user.name},</h2>
            <p>Your return request for order <strong>#${order._id}</strong> has been successfully received.</p>
            <p>Our team will review your return and get back to you soon.</p>
            <p>Thank you for shopping with Q-Mart.</p>
          `;
          const plainText = `
Hi ${user.name},

Your return request for order #${order._id} has been successfully received.

Our team will review your return and get back to you soon.

Thank you for shopping with Q-Mart.
          `;

          await sendEmail(user.email, "Return Request Received - Q-Mart", plainText, emailHTML);
        }
      } catch (emailError) {
        console.warn("Failed to send return confirmation email:", emailError.message);
      }

      return res.json({ message: "Order returned successfully", order });
    } else {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }
  } catch (error) {
    console.error("Error returning order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.returnOrderItem = async (req, res) => {
  const { orderId, itemId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Find the item in the order
    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Order item not found" });

    // Only allow return if item status is Delivered (or a similar check)
    if (item.status !== "Delivered") {
      return res.status(400).json({ message: "Only delivered items can be returned" });
    }

    // Update item status to Returned
    item.status = "Returned";

    await order.save();

    // Optional: Send email notification about this returned item
    try {
      const user = await User.findById(order.userId);
      if (user) {
        const emailHTML = `
          <h2>Hi ${user.name},</h2>
          <p>Your return request for product <strong>${item.productId.productname || "an item"}</strong> in order <strong>#${order._id}</strong> has been received.</p>
          <p>We will process your return shortly.</p>
          <p>Thank you for shopping with Q-Mart.</p>
        `;
        const plainText = `
Hi ${user.name},

Your return request for product ${item.productId.productname || "an item"} in order #${order._id} has been received.

We will process your return shortly.

Thank you for shopping with Q-Mart.
        `;

        await sendEmail(user.email, "Return Request Received - Q-Mart", plainText, emailHTML);
      }
    } catch (emailError) {
      console.warn("Failed to send return confirmation email:", emailError.message);
    }

    res.json({ message: "Order item returned successfully", order });
  } catch (error) {
    console.error("Error returning order item:", error);
    res.status(500).json({ message: "Server error" });
  }
};
