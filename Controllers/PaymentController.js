const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../Models/PaymentModel");
const Order = require("../Models/OrderModel");
const User = require("../Models/UserModel");
const sendEmail = require("../Utils/sendEmail");

// 🔑 Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ➕ Create Razorpay Order
exports.createOrder = async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // convert to paise
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("❌ Error creating Razorpay order:", error);
    res.status(500).json({ message: "Order creation failed" });
  }
};

// ✅ Verify Razorpay Payment & Save Order
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      amount,
      items,
      shippingAddress,
      paymentMode, // from frontend
    } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // ✅ Save Payment
    const payment = await Payment.create({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount,
      userId,
      status: "success",
      paymentMode: paymentMode || "Razorpay",
    });

    // ✅ Save Order
    const order = await Order.create({
      userId,
      items,
      amount,
      shippingAddress,
      paymentId: payment._id,
      status: "Processing",
      paymentMode: "Razorpay",
      paymentStatus: "Paid",
    });

    // 📧 Send Confirmation Email
    try {
      const user = await User.findById(userId);
      if (user && user.email) {
        const itemList = items
          .map(
            (item) => `
            <li>
              ${item.productId?.productname || "Product"} - Qty: ${
              item.quantity
            } - Price: ₹${item.price}
            </li>`
          )
          .join("");

        const emailContent = `
          <h3>Payment Successful 🎉</h3>
          <p>Hi ${user.name || "Customer"},</p>
          <p>Your payment has been verified and order placed successfully.</p>
          <ul>${itemList}</ul>
          <p><strong>Total:</strong> ₹${amount}</p>
          <p><strong>Payment Mode:</strong> Razorpay</p>
          <p><strong>Status:</strong> Paid</p>
        `;

        await sendEmail({
          to: user.email,
          subject: "Payment Successful - Order Confirmation",
          html: emailContent,
        });
      }
    } catch (emailErr) {
      console.warn("⚠️ Failed to send email:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Something went wrong on server" });
  }
};

// 🏷️ Create COD Order
exports.createCODOrder = async (req, res) => {
  const { userId, amount, items, shippingAddress } = req.body;

  console.log("COD Order Payload:", req.body);

  try {
    const order = new Order({
      userId,
      items,
      shippingAddress,
      amount,
      status: "Processing",
      paymentMode: "COD",
      paymentStatus: "Pending",
    });

    await order.save();

    // 📧 Send Confirmation Email
    try {
      const user = await User.findById(userId);
      if (user && user.email) {
        const itemList = items
          .map(
            (item) => `
            <li>
              ${item.productId?.productname || "Product"} - Qty: ${
              item.quantity
            } - Price: ₹${item.price}
            </li>`
          )
          .join("");

        const emailContent = `
          <h3>Order Confirmation</h3>
          <p>Hi ${user.name || "Customer"},</p>
          <p>Thank you for placing your order with us!</p>
          <ul>${itemList}</ul>
          <p><strong>Total:</strong> ₹${amount}</p>
          <p><strong>Payment Mode:</strong> Cash on Delivery (COD)</p>
          <p><strong>Status:</strong> Processing</p>
        `;

        await sendEmail({
          to: user.email,
          subject: "COD Order Confirmation",
          html: emailContent,
        });
      }
    } catch (emailErr) {
      console.warn("⚠️ Failed to send COD email:", emailErr.message);
    }

    res
      .status(200)
      .json({ success: true, message: "COD order placed", order });
  } catch (error) {
    console.error("❌ Failed to create COD order:", error);
    res
      .status(500)
      .json({ success: false, message: "Something went wrong on server" });
  }
};
