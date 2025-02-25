const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

// updated code testing on github

app.use(express.json());

const globalCorsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(globalCorsOptions));
app.options("*", cors(globalCorsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use("/public", express.static(path.join(__dirname, "public")));

// auth
app.use("/api/v1/user", require("./router/userRoute"));
app.use("/api/v1/vendor", require("./router/vendorRoute"));

// products
app.use("/api/v1/vehicle", require("./router/vehicleRoute"));
app.use("/api/v1/feature", require("./router/featureRoute"));
app.use("/api/v1/feature-category", require("./router/featureCategoryRoute"));
app.use("/api/v1/brand", require("./router/vehicleBrandRoute"));
app.use("/api/v1/model", require("./router/vehiclesModelRoute"));
app.use("/api/v1/price-reason", require("./router/vehiclePricingReasonRoute"));

// others
app.use("/api/v1/location", require("./router/locationRoute"));

app.use("/api/v1/interest", require("./router/interestedVehicleRouter"));

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
