const express = require("express");
const {
  createRating,
  deleteRating,
  updateRating,
  getMyRating,
} = require("../controllers/ratingController");

const verifyUser = require("../middleware/verifyUser");

const router = express.Router();

router.get("/my", verifyUser, getMyRating);
router.post("/create", verifyUser, createRating);
router.put("/update/:id", verifyUser, updateRating);
router.delete("/delete/:id", verifyUser, deleteRating);

module.exports = router;
