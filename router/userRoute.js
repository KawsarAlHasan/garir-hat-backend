const express = require("express");
const {
  getAllUsers,
  getSingleUser,
  userStatusUpdate,
  deleteUser,
} = require("../controllers/userController");

const router = express.Router();

// router.post("/signup", signUpUser);
// router.post("/login", userLogin);
// router.get("/me", verifyUser, getMeUser);
router.get("/all", getAllUsers);
router.get("/:id", getSingleUser);
// router.put("/update", verifyUser, updateUser);
// router.put(
//   "/update/profile",
//   uploadImage.single("profile_pic"),
//   verifyUser,
//   updateProfileUser
// );
router.put("/status/:id", userStatusUpdate);
// router.put("/password", verifyUser, updateUserPassword);
router.delete("/delete/:id", deleteUser);

module.exports = router;
