const express = require("express");
const {
  getMyWishList,
  addedAndRemoveWishList,
  deleteWishList,
  deleteMyAllWishList,
} = require("../controllers/wishlistController");

const router = express.Router();

router.get("/my", getMyWishList);
router.post("/", addedAndRemoveWishList);
router.delete("/delete/:id", deleteWishList);
router.delete("/my/:id", deleteMyAllWishList);

module.exports = router;
