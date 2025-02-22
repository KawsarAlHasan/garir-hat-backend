const express = require("express");
const {
  getAllUsers,
  getSingleUser,
  userStatusUpdate,
  deleteUser,
  verifyToken,
  getMeUser,
  updateUser,
} = require("../controllers/userController");
const verifyUser = require("../middleware/verifyUser");
const uploadImage = require("../middleware/fileUploader");

const router = express.Router();

router.post("/verify-token", verifyToken);
router.get("/me", verifyUser, getMeUser);
router.get("/all", getAllUsers);
router.get("/:id", getSingleUser);
router.put(
  "/update",
  uploadImage.single("profile_pic"),
  verifyUser,
  updateUser
);
router.put("/status/:id", userStatusUpdate);
router.delete("/delete/:id", deleteUser);

module.exports = router;
