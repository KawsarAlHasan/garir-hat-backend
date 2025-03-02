const express = require("express");
const {
  getAllVehiclesModelForAdmin,
  getAllModelsForVendor,
  createNewVehiclesModel,
  modelStatusUpdate,
  deleteModel,
  modelUpdate,
  getSingleModel,
  getAllModel,
} = require("../controllers/vehiclesModelController");

const verifyVendor = require("../middleware/verifyVendor");

const router = express.Router();

router.get("/all", getAllVehiclesModelForAdmin);
router.get("/", getAllModelsForVendor);
router.get("/with-brand", getAllModel);
router.get("/:id", getSingleModel);
router.post("/create", createNewVehiclesModel);
router.put("/update/:id", modelUpdate);
router.put("/status/:id", modelStatusUpdate);
router.delete("/delete/:id", deleteModel);

module.exports = router;
