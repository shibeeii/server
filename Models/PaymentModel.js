const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  paymentId: {
    type: String,
    required: true,
  },
  signature: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["success", "failed"],
    default: "success",
  },
  paymentMode: {
    type: String,
    enum: ["Credit Card", "Debit Card", "UPI", "Net Banking", "Cash on Delivery", "Wallet", "Other"],
    default: "UPI", // You can change the default if needed
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;
