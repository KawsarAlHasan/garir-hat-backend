const express = require("express");
const uploadImage = require("../middleware/fileUploader");
const {
  getAllVehiclesModelForAdmin,
  getAllModelsForVendor,
  createNewVehiclesModel,
  modelStatusUpdate,
  deleteModel,
  modelUpdate,
} = require("../controllers/vehiclesModelController");

const verifyVendor = require("../middleware/verifyVendor");

const router = express.Router();

router.get("/all", getAllVehiclesModelForAdmin);
router.get("/", getAllModelsForVendor);
router.post("/create", uploadImage.single("image"), createNewVehiclesModel);
router.put("/update/:id", uploadImage.single("image"), modelUpdate);
router.put("/status/:id", modelStatusUpdate);
router.delete("/delete/:id", deleteModel);

module.exports = router;
