const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const db = require("../config/db");
dotenv.config();

module.exports = async (req, res, next) => {
  try {
    const token = req.headers?.authorization?.split(" ")?.[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "You are not logged in",
      });
    }

    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      const vendorID = decoded.uid;

      const [result] = await db.query(`SELECT * FROM vendors WHERE uid=?`, [
        vendorID,
      ]);
      const vendor = result[0];
      if (!vendor) {
        return res.status(404).json({
          error: "Vendor not found. Please Login Again",
        });
      }
      req.decodedVendor = vendor;
      next();
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      message: "Invalid Token",
      error: error.message,
    });
  }
};
