const Address = require("../models/UserAddressModel");
const State = require("../models/StateModel");
const City = require("../models/CityModel");

const validateCityState = async (state, city) => {
  const stateExists = await State.exists({ name: state });
  if (!stateExists) return false;

  const cityExists = await City.exists({
    name: city,
    stateName: state,
  });

  return !!cityExists;
};


/**
 * ADD ADDRESS
 * POST /address
 */
exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const isValid = await validateCityState(
      req.body.state,
      req.body.city
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid state or city",
      });
    }

    if (req.body.isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    const address = await Address.create({
      userId,
      ...req.body,
      country: req.body.country || "India",
      type: req.body.type || "HOME",
    });

    res.status(201).json({
      success: true,
      message: "Address added",
      data: address,
    });
  } catch (err) {
    console.error("Add address error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add address",
    });
  }
};


/**
 * GET ALL USER ADDRESSES
 * GET /address
 */
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await Address.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      data: addresses,
    });
  } catch (err) {
    console.error("Get address error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
    });
  }
};

/**
 * UPDATE ADDRESS
 * PUT /address/:id
 */
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    if (req.body.state && req.body.city) {
      const isValid = await validateCityState(
        req.body.state,
        req.body.city
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid state or city",
        });
      }
    }

    if (req.body.isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    const address = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      req.body,
      { new: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.json({
      success: true,
      message: "Address updated",
      data: address,
    });
  } catch (err) {
    console.error("Update address error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  }
};


/**
 * DELETE ADDRESS
 * DELETE /address/:id
 */
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const deleted = await Address.findOneAndDelete({
      _id: addressId,
      userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.json({
      success: true,
      message: "Address deleted",
    });
  } catch (err) {
    console.error("Delete address error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });
  }
};
