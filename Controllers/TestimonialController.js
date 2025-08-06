import TestimonialModel from "../Models/TestimonialModel.js";

// Add a new testimonial
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

// Delete testimonial
export const DeleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTestimonial = await TestimonialModel.findByIdAndDelete(id);

    if (!deletedTestimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    res.json({ message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({ message: "Server error" });
  }
};
