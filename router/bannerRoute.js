const express = require("express");
const uploadImage = require("../middleware/fileUploader");
const {
  getAllBanner,
  getSingleBannerById,
  createBanner,
  deletebanner,
  bannerUpdate,
} = require("../controllers/bannerController");

const router = express.Router();

router.get("/single/:id", getSingleBannerById);
router.get("/:status", getAllBanner);
router.post("/create", uploadImage.single("image"), createBanner);
router.put("/update/:id", uploadImage.single("image"), bannerUpdate);
router.delete("/delete/:id", deletebanner);

module.exports = router;
