const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
items: [
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ["Pending", "Delivered", "Returned", "Cancelled"], default: "Pending" },
    returnReason: { type: String },   // ✅ only reason
  },
],

  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine: String,
    city: String,
    state: String,
    pincode: String,
  },
  amount: { type: Number, required: true },
  paymentMode: {
    type: String,
    enum: ["Razorpay", "COD", "Other"],
    default: "Razorpay",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },
 status: {
  type: String,
  enum: ["Processing", "Shipped", "Delivered", "Returned", "Cancelled"],
  default: "Processing",
},
  paymentId: String,
  orderId: String,
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
