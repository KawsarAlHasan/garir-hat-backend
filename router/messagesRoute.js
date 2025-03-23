const express = require("express");

const router = express.Router();
const {
  getMessage,
  usersListForMessage,
  singleUserMessage,
  messageRead,
} = require("../controllers/messagesController");

router.get("/", getMessage);
router.get("/sender/:receiver_id", usersListForMessage);
router.get("/single", singleUserMessage);
router.put("/read-message", messageRead);

module.exports = router;
