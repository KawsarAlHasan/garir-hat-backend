const express = require("express");
const app = express();
const path = require("path");
const firebaseAdmin = require("./config/firebase");

app.use(express.json());

// Static Files
app.use("/public", express.static(path.join(__dirname, "public")));

// auth
app.use("/api/v1/user", require("./router/userRoute"));
app.use("/api/v1/vendor", require("./router/vendorRoute"));

// products
app.use("/api/v1/feature", require("./router/featureRoute"));
app.use("/api/v1/feature-category", require("./router/featureCategoryRoute"));
app.use("/api/v1/brand", require("./router/vehicleBrandRoute"));
app.use("/api/v1/model", require("./router/vehiclesModelRoute"));

app.post("/verify-otp", (req, res) => {
  const { sessionCookie, otp } = req.body;

  firebaseAdmin
    .auth()
    .verifySessionCookie(sessionCookie)
    .then((decodedClaims) => {
      return firebaseAdmin.auth().verifyPhoneNumber(decodedClaims.uid, otp);
    })
    .then((userRecord) => {
      const { uid, phoneNumber } = userRecord;
      console.log(uid, phoneNumber);
      // const query = 'INSERT INTO users (uid, phoneNumber) VALUES (?, ?)';
      // db.query(query, [uid, phoneNumber], (err, result) => {
      //   if (err) throw err;
      //   res.status(200).send({ message: 'User registered successfully', uid });
      // });
    })
    .catch((error) => {
      res.status(500).send({ error: error.message });
    });
});

// Default Route
app.get("/", (req, res) => {
  res.status(200).send("Garir Hat server is working");
});

// 404 Not Found Middleware
app.use("*", (req, res, next) => {
  res.status(404).json({
    error: "You have hit the wrong route",
  });
});

module.exports = app;
