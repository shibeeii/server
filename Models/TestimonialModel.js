import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  text: { type: String, required: true },
  img: { 
    type: String, 
    default: "https://cdn-icons-png.flaticon.com/512/2333/2333291.png" // Cartoon avatar
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Testimonial", testimonialSchema);
