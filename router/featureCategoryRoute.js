const express = require("express");
const {
  getAllFeaturesCategory,
  createNewFeatureCategory,
  featureUpdateCategory,
  deleteFeatureCategory,
} = require("../controllers/featureCategoryController");

const router = express.Router();

router.get("/all", getAllFeaturesCategory);
router.post("/create", createNewFeatureCategory);
router.put("/update/:id", featureUpdateCategory);
router.delete("/delete/:id", deleteFeatureCategory);

module.exports = router;
