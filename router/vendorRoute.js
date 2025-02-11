const express = require("express");
const { getAllVendors } = require("../controllers/vendorController");

const router = express.Router();

router.get("/all", getAllVendors);
// router.get("/:id", getSingleUser);
// router.put("/status/:id", userStatusUpdate);
// router.delete("/delete/:id", deleteUser);

module.exports = router;
