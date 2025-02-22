const db = require("../config/db");

// get all vehicles pricing reason for Admin
exports.getAllVehiclePricingReasonForAdmin = async (req, res) => {
  try {
    const [data] = await db.query(
      "SELECT * FROM vehicle_pricing_reason ORDER BY name ASC"
    );

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Price Reason found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "All Price Reason",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Price Reason",
      error: error.message,
    });
  }
};

// get all vehicles pricing reason for vendor
exports.getAllVehiclePricingReasonForVendor = async (req, res) => {
  try {
    const [data] = await db.query(
      "SELECT * FROM vehicle_pricing_reason WHERE status=? ORDER BY name ASC",
      ["active"]
    );

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Price Reason found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "All Price Reason",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Price Reason",
      error: error.message,
    });
  }
};

// create new vehicles pricing reason
exports.createVehiclePricingReason = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).send({
        success: false,
        message: "Please provide name required fields",
      });
    }

    // Chack Duplicate entry
    const [checkData] = await db.query(
      `SELECT * FROM vehicle_pricing_reason WHERE name=?`,
      [name]
    );

    if (checkData.length > 0) {
      return res.status(400).send({
        success: false,
        message:
          "This vehicle pricing reason already exists. Please use a different vehicle pricing reason.",
      });
    }

    const query =
      "INSERT INTO vehicle_pricing_reason (name, status) VALUES (?, ?)";

    const values = [name, status || "pending"];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert vehicle pricing reason, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "vehicle pricing reason added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update vehicles pricing reason
exports.vehiclePricingReasonUpdate = async (req, res) => {
  try {
    const id = req.params.id;

    const { name, status } = req.body;

    const [data] = await db.query(
      `SELECT * FROM vehicle_pricing_reason WHERE id=? `,
      [id]
    );
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No vehicle pricing reason found",
      });
    }

    await db.query(
      `UPDATE vehicle_pricing_reason SET name=?, status=? WHERE id =?`,
      [name || data[0].name, status || data[0].status, id]
    );

    res.status(200).send({
      success: true,
      message: "vehicle pricing reason updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update vehicle pricing reason ",
      error: error.message,
    });
  }
};

// delete vehicles pricing reason
exports.deleteVehiclePricingReason = async (req, res) => {
  try {
    const id = req.params.id;

    const [data] = await db.query(
      `SELECT * FROM vehicle_pricing_reason WHERE id=? `,
      [id]
    );
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No vehicle pricing reason found",
      });
    }
    await db.query(`DELETE FROM vehicle_pricing_reason WHERE id=?`, [id]);
    res.status(200).send({
      success: true,
      message: "vehicle pricing reason Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete vehicle pricing reason",
      error: error.message,
    });
  }
};
