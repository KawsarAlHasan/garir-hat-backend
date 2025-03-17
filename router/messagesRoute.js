const express = require("express");

const router = express.Router();
const {
  getMessage,
  usersListForMessage,
  singleUserMessage,
} = require("../controllers/messagesController");

router.get("/", getMessage);
router.get("/sender/:receiver_id", usersListForMessage);
router.get("/single", singleUserMessage);

module.exports = router;
