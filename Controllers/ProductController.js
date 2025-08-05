const Products = require("../Models/ProductModel");


exports.Addproducts = async(req,res)=>{

  const {productname, category,description,price,offer,image}=req.body
  // creating product
  const products= await Products.create({
      productname,
      category,
      description,
      price,
      offer,
      image
  });

  // respond with the product
  res.json({products:products})
}

exports.getAllProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const offset = parseInt(req.query.offset) || 0;
    const category = req.query.category;

    const filter = {};
    if (category) {
      filter.category = category; // Or regex if partial match
    }

    const products = await Products.find(filter)
      .skip(offset)
      .limit(limit);

    const total = await Products.countDocuments(filter);

    res.json({ products, total });
  } catch (err) {
    console.error("Error in getAllProducts:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};



// single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving product", error: err });
  }
};
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Products.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateProduct= async(req,res)=>{
  const productId = req.params.id

  // get the data from the reqbdoy

  const {productname, category,description,price,offer,image}=req.body

  // find and update 

      await Products.findByIdAndUpdate(productId,{
     productname,
     category,
     description,
     price,
     offer,
     image
  });

  // find updated by id
  const products = await Products.findById(productId);
  // respond with it

  res.json({products})
}

exports.Pagination = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const offset = parseInt(req.query.offset) || 0;
    const category = req.query.category;

    const filter = {};
    if (category) {
      filter.category = { $regex: new RegExp(category, "i") }; // Case-insensitive
    }

    const products = await Products.find(filter)
      .skip(offset)
      .limit(limit);

    const total = await Products.countDocuments(filter);

res.json({ products, total });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
