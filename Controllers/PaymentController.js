const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../Models/PaymentModel");
const Order = require("../Models/OrderModel");
const User = require("../Models/UserModel");
const sendEmail = require("../Utils/sendEmail");


// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET, // make sure this matches your .env
});

// ➕ Create Order
exports.createOrder = async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // amount in paise
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
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    amount,
    items,
    shippingAddress,
  } = req.body;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature === razorpay_signature) {
    try {
      // Save payment
      const payment = new Payment({
        userId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount,
      });
      await payment.save();

      // Create order
      const order = new Order({
        userId,
        items,
        shippingAddress,
        amount,
        status: "Processing",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
      await order.save();

      // 💌 Fetch user info and send email
      const user = await User.findById(userId);
      if (user) {
        const emailHTML = `
          <h2>Hi ${user.name},</h2>
          <p>Thank you for your purchase! Your order <strong>#${order._id}</strong> has been successfully placed.</p>
          <p><strong>Amount:</strong> ₹${amount}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <br>
          <p>We'll notify you once it's shipped.</p>
          <p>– E-Shop Team</p>
        `;

        await sendEmail(user.email, "Order Confirmation - E-Shop", emailHTML);
      }

      res.status(200).json({ success: true, message: "Payment verified, order created & email sent" });
    } catch (error) {
      console.error("Error saving payment/order or sending email:", error);
      res.status(500).json({ success: false, message: "Payment successful, but an error occurred" });
    }
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" });
  }
};



