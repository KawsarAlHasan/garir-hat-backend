const express = require("express");
const {
  postToFacebook,
  sherePost,
} = require("../controllers/socailMediaPostController");

const router = express.Router();

router.post("/post/:id", postToFacebook);
router.post("/share/:id", sherePost);

module.exports = router;
