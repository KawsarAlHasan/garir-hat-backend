const express = require("express");
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

const router = express.Router();

router.get("/:name", getSettings);
router.put("/:name", updateSettings);

module.exports = router;
