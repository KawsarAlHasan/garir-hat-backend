const express = require("express");
const uploadImage = require("../../middleware/fileUploader");

const verifyVendor = require("../../middleware/verifyVendor");
const {
  getAllVehiclesBrandWithModel,
  getAllVehiclesBrandForAdmin,
  createNewVehiclesBrand,
  brandUpdate,
  getAllBrandsForVendor,
  brandStatusUpdate,
  deleteBrand,
} = require("../../controllers/vehicles/vehicleBrandController");

const router = express.Router();

router.get("/with-model", getAllVehiclesBrandWithModel);
router.get("/all", getAllVehiclesBrandForAdmin);
router.get("/", getAllBrandsForVendor);
router.post("/create", uploadImage.single("image"), createNewVehiclesBrand);
router.put("/update/:id", uploadImage.single("image"), brandUpdate);
router.put("/status/:id", brandStatusUpdate);
router.delete("/delete/:id", deleteBrand);

module.exports = router;
