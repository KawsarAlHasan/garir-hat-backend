const db = require("../config/db");

// create Interested vehicle
exports.createInterestedVehicle = async (req, res) => {
  try {
    const { vehicle_id, vendor_id, user_name, phone, email, message } =
      req.body;

    if (!vehicle_id || !vendor_id || !user_name) {
      return res.status(400).send({
        success: false,
        message:
          "Please provide vehicle_id, vendor_id, user_name required fields",
      });
    }

    const query =
      "INSERT INTO interested_vehicle (vehicle_id, vendor_id, user_name, phone, email, message) VALUES (?, ?, ?, ?, ?, ?)";

    const values = [
      vehicle_id,
      vendor_id,
      user_name,
      phone || "",
      email || "",
      message,
    ];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Interested vehicle, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interested vehicle added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get Interested vehicle
exports.getInterestedVehicle = async (req, res) => {
  try {
    const { vehicle_id, vendor_id } = req.query;

    let query = "SELECT * FROM interested_vehicle WHERE 1=1";
    let values = [];

    if (vehicle_id) {
      query += " AND vehicle_id = ?";
      values.push(vehicle_id);
    }

    if (vendor_id) {
      query += " AND vendor_id = ?";
      values.push(vendor_id);
    }

    const [data] = await db.query(query, values);

    if (data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Data Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Get Interested vehicle",
      data: data,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
