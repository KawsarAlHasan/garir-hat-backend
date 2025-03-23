const express = require("express");
const upload = require("../middleware/videoUpload");
const {
  youtubeUrlPost,
  uploadVideo,
  getAllVideos,
  getSingleVideo,
  updateVideoStatus,
} = require("../controllers/videoController");

const router = express.Router();

router.post("/post", youtubeUrlPost);
router.post("/upload", upload.single("video"), uploadVideo);
router.get("/all", getAllVideos);
router.get("/:id", getSingleVideo);
router.put("/status/:id", updateVideoStatus);

module.exports = router;
