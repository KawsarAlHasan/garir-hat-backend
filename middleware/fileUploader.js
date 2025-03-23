const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "public/images",
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now().toString(36).substr(-5) +
      Math.random().toString(36).substr(2, 3);

    const cleanFileName = file.originalname.replace(/\s+/g, "");
    cb(null, uniqueSuffix + "_" + cleanFileName);
  },
});

const uploadImage = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const supportedImage = /png|jpg|gif|svg|jpeg/;
    const extension = path.extname(file.originalname);

    if (supportedImage.test(extension)) {
      cb(null, true);
    } else {
      cb(new Error("Must be png/jpg/jpeg/svg/gif image"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

module.exports = uploadImage;
