const State = require("../models/StateModel");
const City = require("../models/CityModel");

/* ===================== STATES ===================== */

// GET all states (PUBLIC)
exports.getStates = async (req, res) => {
  try {
    const states = await State.find().sort({ name: 1 });
    res.json({ success: true, data: states });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch states" });
  }
};

// ADD single state (ADMIN)
exports.addState = async (req, res) => {
  try {
    const state = await State.create(req.body);
    res.status(201).json({ success: true, data: state });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// BULK insert states (ADMIN)
exports.bulkAddStates = async (req, res) => {
  try {
    const states = await State.insertMany(req.body, { ordered: false });
    res.status(201).json({ success: true, count: states.length });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ===================== CITIES ===================== */

// GET cities by state (PUBLIC)
exports.getCitiesByState = async (req, res) => {
  try {
    const { state } = req.query;
    if (!state)
      return res.status(400).json({ success: false, message: "State required" });

    const cities = await City.find({ stateName: state }).sort({ name: 1 });
    res.json({ success: true, data: cities });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch cities" });
  }
};

// ADD single city (ADMIN)
exports.addCity = async (req, res) => {
  try {
    const city = await City.create(req.body);
    res.status(201).json({ success: true, data: city });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// BULK insert cities (ADMIN)
exports.bulkAddCities = async (req, res) => {
  try {
    const cities = await City.insertMany(req.body, { ordered: false });
    res.status(201).json({ success: true, count: cities.length });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
