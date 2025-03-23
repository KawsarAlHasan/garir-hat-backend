const multer = require("multer");

const upload = multer({ dest: "public/videos/" });

module.exports = upload;
