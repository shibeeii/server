import TestimonialModel from "../Models/TestimonialModel.js";

// Add a new testimonial
export const AddNewTestimonial = async (req, res) => {
  try {
    const { name, text } = req.body;

    if (!name || !text) {
      return res.status(400).json({ message: "Name and text are required" });
    }

    const testimonial = new TestimonialModel({ name, text });
    await testimonial.save();

    res.status(201).json({
      message: "Testimonial added successfully",
      testimonial,
    });
  } catch (error) {
    console.error("Error adding testimonial:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all testimonials
export const GetAllTestimonial = async (req, res) => {
  try {
    const testimonials = await TestimonialModel.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ message: "Server error" });
  }
};
