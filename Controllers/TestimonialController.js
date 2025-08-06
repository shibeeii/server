import TestimonialModel from "../Models/TestimonialModel.js";

export const AddNewTestiminal = async (req, res) => {
  try {
    let { name, text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    // Default name
    if (!name || name.trim() === "") {
      name = "Anonymous";
    }

    // Create testimonial (img will default if not given)
    const testimonial = new TestimonialModel({
      name,
      text
    });

    await testimonial.save();

    res.status(201).json({ message: "Testimonial added successfully", testimonial });
  } catch (error) {
    console.error("Error adding testimonial:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const GetAllTestimonial = async (req, res) => {
  try {
    const testimonials = await TestimonialModel.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ message: "Server error" });
  }
};
