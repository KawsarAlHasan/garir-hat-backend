const express = require("express");

const verifyVendor = require("../../middleware/verifyVendor");

const uploadImage = require("../../middleware/fileUploader");
const {
  getAllVendorEmployees,
  createNewVendorEmployee,
} = require("../../controllers/vendors/vendorsEmployeesController");

const router = express.Router();

router.get("/all", getAllVendorEmployees);
router.post(
  "/create",
  uploadImage.single("nid_or_birth_image"),
  verifyVendor,
  createNewVendorEmployee
);

module.exports = router;
