const express = require("express");

const {
  createInterestedVehicle,
  getInterestedVehicle,
} = require("../controllers/interestedVehicleController");

const router = express.Router();

router.post("/post", createInterestedVehicle);
router.get("/get", getInterestedVehicle);

module.exports = router;
