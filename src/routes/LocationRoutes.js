const express = require("express");
const router = express.Router();

const {
  getStates,
  addState,
  bulkAddStates,
  getCitiesByState,
  addCity,
  bulkAddCities,
} = require("../controllers/LocationController");

const auth = require("../middlewares/AuthMiddlewre");
const roleBasedAuth = require("../middlewares/AuthMiddlewre");

/* ===== PUBLIC ===== */
router.get("/states", getStates);
router.get("/cities", getCitiesByState);

/* ===== ADMIN ONLY ===== */
router.post("/states", auth("ADMIN", "USER"), addState);
router.post("/states/bulk", bulkAddStates);

router.post("/cities", auth("ADMIN", "USER"), addCity);
router.post("/cities/bulk", bulkAddCities);

module.exports = router;
