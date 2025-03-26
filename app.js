const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const socket = require("./config/socket");
const http = require("http");
const db = require("./config/db");

const server = http.createServer(app);

const io = socket.init(server);

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
app.use("/api/v1/vendor", require("./router/vendors/vendorRoute"));
app.use(
  "/api/v1/vendor-employees",
  require("./router/vendors/vendorsEmployeesRoute")
);

// products
app.use("/api/v1/vehicle", require("./router/vehicles/vehicleRoute"));
app.use("/api/v1/feature", require("./router/featureRoute"));
app.use("/api/v1/feature-category", require("./router/featureCategoryRoute"));
app.use("/api/v1/brand", require("./router/vehicles/vehicleBrandRoute"));
app.use("/api/v1/model", require("./router/vehicles/vehiclesModelRoute"));
app.use("/api/v1/price-reason", require("./router/vehiclePricingReasonRoute"));

// product rating
app.use(
  "/api/v1/partsNameForRating",
  require("./router/partsNameForRatingRoute")
);
app.use("/api/v1/rating", require("./router/ratingRoute"));

// message
app.use("/api/v1/message", require("./router/messagesRoute"));

// others
app.use("/api/v1/location", require("./router/locationRoute"));
app.use("/api/v1/video", require("./router/videoRouter"));

app.use("/api/v1/interest", require("./router/interestedVehicleRouter"));
app.use("/api/v1/wishlist", require("./router/wishlistRoute"));

app.use("/api/v1/socail-media", require("./router/socailMediaPostRoute"));

// settings
app.use("/api/v1/banner", require("./router/bannerRoute"));
app.use("/api/v1/settings", require("./router/settingRoute"));

app.get("/test", async (req, res) => {
  try {
    const [businessData] = await db.query(
      "SELECT busn_id FROM vendor_busn_info ORDER BY id DESC LIMIT 1"
    );

    const lastBusnId = businessData[0].busn_id;
    const numericPart = parseInt(lastBusnId.substring(1), 10) + 1;
    const busn_id = `v${numericPart}`;

    res.send({
      message: "Test",
      busn_id,
      data: businessData,
    });
  } catch (error) {
    res.send({
      error: error.message,
    });
  }
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

module.exports = { app, server };
