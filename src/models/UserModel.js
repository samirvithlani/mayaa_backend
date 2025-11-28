const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },

  // Main email
  email: {
    type: String,
    unique: true,
    sparse: true, // allows null when using google/apple only
  },

  // For normal login
  password: {
    type: String,
    select: false, // prevents returning password in APIs
  },

  contactNo:{
    type:String,
    unique:true,
    sparse:true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },

  
  appleId: {
    type: String,
    unique: true,
    sparse: true,
  },

   otp: {
    code: String,
    expiresAt: Date,
    purpose: String // e.g. 'verify', 'reset'
  },

  // Optional: track last login
  lastLoginAt: Date,
  avatar: String,
  roleId:{
    type:Schema.Types.ObjectId,
    ref:"Role"
  }

  
});
module.exports = mongoose.model("User", userSchema);
