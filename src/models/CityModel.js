const mongoose = require("mongoose");

const citySchema = new mongoose.Schema({
  name: { type: String, required: true },
  stateName: { type: String, required: true },
  stateCode: { type: String },
  countryCode: { type: String, default: "IN" },
}, { timestamps: true });

module.exports = mongoose.model("City", citySchema);
