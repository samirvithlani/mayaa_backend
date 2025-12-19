const express = require("express");
const router = express.Router();

const {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} = require("../controllers/UserAddressController");

const auth = require("../middlewares/AuthMiddlewre"); // your auth middleware

// ADD ADDRESS
router.post("/", auth("ADMIN","USER"), addAddress);

// GET ALL USER ADDRESSES
router.get("/", auth("ADMIN","USER"), getAddresses);

// UPDATE ADDRESS
router.put("/:id", auth("ADMIN","USER"), updateAddress);

// DELETE ADDRESS
router.delete("/:id", auth("ADMIN","USER"), deleteAddress);

module.exports = router;
