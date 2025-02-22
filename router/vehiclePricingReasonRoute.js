const express = require("express");
const {
  getAllVehiclePricingReasonForAdmin,
  getAllVehiclePricingReasonForVendor,
  createVehiclePricingReason,
  vehiclePricingReasonUpdate,
  deleteVehiclePricingReason,
} = require("../controllers/vehiclePricingReasonController");

const verifyVendor = require("../middleware/verifyVendor");

const router = express.Router();

router.get("/all", getAllVehiclePricingReasonForAdmin);
router.get("/", getAllVehiclePricingReasonForVendor);
router.post("/create", createVehiclePricingReason);
router.put("/update/:id", vehiclePricingReasonUpdate);
router.delete("/delete/:id", deleteVehiclePricingReason);

module.exports = router;
