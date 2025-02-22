const express = require("express");
const {
  getAllFeaturesForAdmin,
  getAllFeaturesForVendor,
  createNewFeature,
  deleteFeature,
  featureStatusUpdate,
  featureUpdate,
} = require("../controllers/featureController");

const router = express.Router();

router.get("/all", getAllFeaturesForAdmin);
router.get("/", getAllFeaturesForVendor);
router.post("/create", createNewFeature);
router.put("/update/:id", featureUpdate);
router.put("/status/:id", featureStatusUpdate);
router.delete("/delete/:id", deleteFeature);

module.exports = router;
