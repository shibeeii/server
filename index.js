// import express
const express = require('express')


// import cors
const cors = require('cors')

// IMPORT .env
require('dotenv').config()


// import connect
require('./connection')



// create server
const commerce = express()


const AddController = require('./Controllers/ProductController')
const AddressController = require('./Controllers/AddressController')
const CartController = require('./Controllers/CartController')
const AuthController = require('./Controllers/UserController')
const WishlistController = require('./Controllers/WishlistController')
const PaymentController = require('./Controllers/PaymentController');
const OrderController = require("./Controllers/OrderController");
const TestimonialController = require('./Controllers/TestimonialController');




// using cors
commerce.use(cors())

// parse the data - middleware - which have the ability to parse the data
commerce.use(express.json())

// add product

commerce.post("/products",AddController.Addproducts)

//get products
commerce.get('/products', AddController.getAllProducts);
// get top products
commerce.get("/products/top", AddController.getTopProducts);

// view single by id
commerce.get('/products/:id', AddController.getProductById);

commerce.delete('/products/:id', AddController.deleteProduct);
// update
commerce.put('/products/:id', AddController.updateProduct);




// cart
commerce.post("/cart/add", CartController.addToCart);
commerce.get("/cart/:userId", CartController.getCart);
commerce.put("/cart/update", CartController.updateItemQuantity);
commerce.delete("/cart/remove", CartController.removeItem);
commerce.delete("/cart/clear/:userId", CartController.clearCart);


// Authentication
commerce.post('/register',AuthController.register)
commerce.post('/login',AuthController.login)
commerce.post('/google-login', AuthController.googleLogin); 



// Address

commerce.post('/address/add', AddressController.AddAddress);
commerce.put('/address/edit/:userId/:addressId', AddressController.EditAddress);
commerce.delete('/address/delete/:userId/:addressId', AddressController.DeleteAddress);
commerce.get('/address/:userId', AddressController.GetAllAddress);

// whishlist
commerce.post('/wishlist/add', WishlistController.addToWishlist);
commerce.get('/wishlist/:userId', WishlistController.getWishlist);
commerce.delete('/wishlist/remove', WishlistController.removeFromWishlist);
commerce.delete('/wishlist/clear/:userId', WishlistController.clearWishlist);

// Razorpay Payment
commerce.post("/api/payment/create-order", PaymentController.createOrder);
commerce.post("/api/payment/verify", PaymentController.verifyPayment);
commerce.post("/api/payment/cod", PaymentController.createCODOrder);


commerce.post("/orders", OrderController.createOrder);
commerce.get("/orders", OrderController.getAllOrders);
commerce.put("/orders/:orderId/status", OrderController.updateOrderStatus);
commerce.get("/orders/user/:userId", OrderController.getOrdersByUser);
commerce.put("/orders/:orderId/cancel", OrderController.cancelOrder);
commerce.delete("/orders/:orderId", OrderController.deleteOrder);


// testimonials
commerce.post('/testimonials', TestimonialController.AddNewTestiminal);
commerce.get('/testimonials', TestimonialController.GetAllTestimonial);
commerce.delete("/testimonials/:id", TestimonialController.DeleteTestimonial);



// port
const PORT = process.env.PORT || 7000;

//listen
commerce.listen(PORT,()=>{
    console.log(`server running successfully at port number ${PORT}`);
    
})
