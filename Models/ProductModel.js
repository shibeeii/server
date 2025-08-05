const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
    productname: {
        type: String,
        required: true,
      },
      category:{
        type:String,
        required:true,
      },
      description:{
        type:String,
        required:true,
      },
      price:{
        type:Number,
        required:true,
      },
       offer:{
        type:Number,
      },
      image:{
        type:String,
        required:true,
      }

})

const Products = mongoose.model("products",ProductSchema)
module.exports = Products