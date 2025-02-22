const express = require("express");

const uploadImage = require("../middleware/fileUploader");

const {
  getDivisionsWithDistrictsAndUpzilas,
  getDivisionsWithDistricts,
  getDivisions,
  getDistrictsWithUpzilas,
  updateDivision,
} = require("../controllers/locationController");

const router = express.Router();

router.get("/division_districts_upazilas", getDivisionsWithDistrictsAndUpzilas);
router.get("/division_districts", getDivisionsWithDistricts);
router.get("/division", getDivisions);
router.get("/districts_upazilas/:id", getDistrictsWithUpzilas);
router.put("/division/:id", uploadImage.single("image"), updateDivision);

module.exports = router;
