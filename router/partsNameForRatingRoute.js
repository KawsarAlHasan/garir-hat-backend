const express = require("express");

const {
  getAllPartsNameForRating,
  createNewPartsNameForRating,
  updatePartsNameForRating,
  deletePartsNameForRating,
} = require("../controllers/partsNameForRatingController");

const router = express.Router();

router.get("/all", getAllPartsNameForRating);
router.post("/create", createNewPartsNameForRating);
router.put("/update/:id", updatePartsNameForRating);

router.delete("/delete/:id", deletePartsNameForRating);

module.exports = router;
