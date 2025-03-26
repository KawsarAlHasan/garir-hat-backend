const express = require("express");
const uploadImage = require("../../middleware/fileUploader");
const verifyVendor = require("../../middleware/verifyVendor");
const {
  createNewVehicle,
  deleteVehicle,
  getAllVehicles,
  getSingleVehicleWithId,
  getAllVehiclesForFlutter,
  updateVehicleStatus,
  getAllMakeNameForSingleVendor,
} = require("../../controllers/vehicles/vehicleController");

const router = express.Router();

router.post(
  "/create",
  uploadImage.fields([
    { name: "thumbnail_image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  verifyVendor,
  createNewVehicle
);
router.get("/all", getAllVehiclesForFlutter);
router.get("/web", getAllVehicles);
router.get("/vendor/:busn_id", getAllMakeNameForSingleVendor);

router.get("/:id", getSingleVehicleWithId);

router.put("/status/:id", verifyVendor, updateVehicleStatus);

router.delete("/delete/:id", deleteVehicle);

module.exports = router;
