const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String }, // ✅ not required for Google login
  image: { type: String }, // optional profile picture
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
