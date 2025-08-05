// import mongoose
const mongoose = require('mongoose')

connectionString = process.env.DATABASE

mongoose.connect(connectionString).then((res)=>{
    console.log("Mongo DB connected Successfully");
    
}).catch((err)=>{
    console.log(`failed due to ${err}`);
    
})