const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  text: { type: String, required: true },
  img: { 
    type: String, 
    default: "https://static.vecteezy.com/system/resources/previews/027/245/504/non_2x/male-3d-avatar-free-png.png" 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Testimonial", testimonialSchema);
