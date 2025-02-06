const express = require("express");
const app = express();

app.use(express.json());

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
