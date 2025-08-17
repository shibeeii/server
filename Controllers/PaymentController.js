const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../Models/PaymentModel");
const Order = require("../Models/OrderModel");
const User = require("../Models/UserModel");
const sendEmail = require("../Utils/sendEmail");

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ➕ Create Order
exports.createOrder = async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Order creation failed" });
  }
};

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
      paymentMode, // <-- add this from frontend
    } = req.body;

    // Generate signature for validation
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // ✅ Save Payment
    const payment = await Payment.create({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount,
      userId,
      status: "success", // enum allows "success" | "failed"
      paymentMode: paymentMode || "UPI", // fallback if not provided
    });

    // ✅ Save Order (if you’re linking with Order model)
    const order = await Order.create({
      userId,
      items,
      amount,
      shippingAddress,
      paymentId: payment._id,
      status: "Confirmed",
    });

    res.json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    res.status(500).json({ success: false, message: "Something went wrong on server" });
  }
};





exports.createCODOrder = async (req, res) => {
  const { userId, amount, items, shippingAddress } = req.body;

  console.log("COD Order Payload:", req.body); // debug

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

    // Send confirmation email
    try {
      const user = await User.findById(userId);
      if (user && user.email) {
        // Compose email content
        const itemList = items.map(
          (item) => `
          <li>
            ${item.productId?.productname || "Product"} - Quantity: ${item.quantity} - Price: ₹${item.price}
          </li>`
        ).join("");

        const emailContent = `
          <h3>Order Confirmation</h3>
          <p>Hi ${user.name || "Customer"},</p>
          <p>Thank you for placing your order with us! Here are your order details:</p>
          <ul>
            ${itemList}
          </ul>
          <p><strong>Total Amount:</strong> ₹${amount}</p>
          <p><strong>Payment Mode:</strong> Cash on Delivery (COD)</p>
          <p><strong>Shipping Address:</strong></p>
          <p>
            ${shippingAddress.fullName}<br />
            ${shippingAddress.addressLine}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}<br />
            Phone: ${shippingAddress.phone}
          </p>
          <p>Your order status is currently <strong>Processing</strong>. We will update you once your order is shipped.</p>
          <p>Thank you for shopping with us!</p>
        `;

        await sendEmail({
          to: user.email,
          subject: "Order Confirmation - Your COD Order",
          html: emailContent,
        });
      }
    } catch (emailErr) {
      console.warn("Failed to send COD email:", emailErr.message);
    }

    res.status(200).json({ success: true, message: "COD order placed", order });
  } catch (error) {
    console.error("Failed to create COD order:", error);
    res.status(500).json({ success: false, message: "Something went wrong on server" });
  }
};

