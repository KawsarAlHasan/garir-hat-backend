const express = require("express");
const {
  getAllVendors,
  verifyVendorToken,
  getSingleVendor,
  deleteVendor,
  vendorStatusUpdate,
  getMeVendor,
  updateVendor,
  vendorVerifyStatusUpdate,
  updateNIDCardVendor,
  updateVendorBanner,
} = require("../controllers/vendorController");
const verifyVendor = require("../middleware/verifyVendor");

const uploadImage = require("../middleware/fileUploader");

const router = express.Router();

router.get("/all", getAllVendors);
router.get("/me", verifyVendor, getMeVendor);
router.post("/verify-token", verifyVendorToken);
router.get("/:id", getSingleVendor);
router.put(
  "/update",
  uploadImage.single("profile_picture"),
  verifyVendor,
  updateVendor
);
router.put(
  "/banner",
  uploadImage.single("banner"),
  verifyVendor,
  updateVendorBanner
);
router.put(
  "/nid",
  uploadImage.fields([
    { name: "nid_card_front", maxCount: 1 },
    { name: "nid_card_back", maxCount: 1 },
  ]),
  verifyVendor,
  updateNIDCardVendor
);
router.put("/status/:id", vendorStatusUpdate);
router.put("/verify-status/:id", vendorVerifyStatusUpdate);
router.delete("/delete/:id", deleteVendor);

module.exports = router;
