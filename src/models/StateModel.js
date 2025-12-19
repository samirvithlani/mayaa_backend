const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String }, // GJ, MH, KA
  countryCode: { type: String, default: "IN" },
}, { timestamps: true });

module.exports = mongoose.model("State", stateSchema);
