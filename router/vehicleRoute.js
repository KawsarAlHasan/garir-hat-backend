const express = require("express");
const uploadImage = require("../middleware/fileUploader");
const {
  createNewVehicle,
  deleteVehicle,
  getAllVehicles,
  getSingleVehicleWithId,
  getAllVehiclesForFlutter,
} = require("../controllers/vehicleController");

const verifyVendor = require("../middleware/verifyVendor");

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
router.get("/:id", getSingleVehicleWithId);
router.delete("/delete/:id", deleteVehicle);

module.exports = router;
