const jwt = require("jsonwebtoken");
exports.generateVendorToken = (vendorInfo) => {
  const payload = {
    uid: vendorInfo.uid,
  };
  const vendorToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: "365 days",
  });

  return vendorToken;
};
