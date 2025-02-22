const jwt = require("jsonwebtoken");
exports.generateUserToken = (userInfo) => {
  const payload = {
    uid: userInfo.uid,
  };
  const userToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: "365 days",
  });

  return userToken;
};
