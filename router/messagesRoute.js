const express = require("express");

const router = express.Router();
const verifyUser = require("../middleware/verifyUser");
const verifyVendor = require("../middleware/verifyVendor");
const {
  sendMessage,
  getMessage,
  sendMessage2,
  usersListForMessage,
  isUserOnline,
} = require("../controllers/messagesController");

router.post("/send-message", sendMessage);
router.get("/get-messages", getMessage);
router.post("/send-message2", sendMessage2);
router.get("/", getMessage);
router.get("/sender/:receiver_id", usersListForMessage);
router.get("/online/:sender_id", isUserOnline);

module.exports = router;
