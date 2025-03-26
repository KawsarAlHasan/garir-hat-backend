const db = require("../../config/db");

// get All model
exports.getAllModel = async (req, res) => {
  try {
    const [data] = await db.query(
      `SELECT m.*,
      b.id AS brand_id,
      b.image AS brand_image,
      b.brand_name
      FROM vehicles_model m
      LEFT JOIN vehicles_brand b ON m.brand_id = b.id
      ORDER BY RAND() 
      LIMIT 15`
    );

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Vehicles Model found",
      });
    }

    res.status(200).send({
      success: true,
      message: "All Vehicles Model",
      totalModel: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Vehicles Model",
      error: error.message,
    });
  }
};

// get single model
exports.getSingleModel = async (req, res) => {
  try {
    const id = req.params.id;

    const [data] = await db.query(
      `SELECT m.*,
      b.id AS brand_id,
      b.image AS brand_image,
      b.brand_name
      FROM vehicles_model m
      LEFT JOIN vehicles_brand b ON m.brand_id = b.id
      WHERE m.id=?`,
      [id]
    );

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Vehicles Model found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Single Vehicles Model",
      data: data[0],
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get Single Vehicles Model",
      error: error.message,
    });
  }
};

// get all vehicles_model for Admin
exports.getAllVehiclesModelForAdmin = async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide brand_id required in params",
      });
    }

    const [brandData] = await db.query(
      "SELECT * FROM vehicles_brand WHERE id=?",
      [brand_id]
    );

    const [data] = await db.query(
      "SELECT * FROM vehicles_model WHERE brand_id=? ORDER BY model_name ASC",
      [brand_id]
    );

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Vehicles Model found",
        data: [],
      });
    }

    const result = {
      ...brandData[0],
      model: data,
    };

    res.status(200).send({
      success: true,
      message: "All Vehicles Model",
      data: result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Vehicles Model",
      error: error.message,
    });
  }
};

// get all Model for Vendor
exports.getAllModelsForVendor = async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide brand_id required in params",
      });
    }

    const [brandData] = await db.query(
      "SELECT * FROM vehicles_brand WHERE id=?",
      [brand_id]
    );

    const [data] = await db.query(
      "SELECT * FROM vehicles_model WHERE brand_id=? AND status=? ORDER BY model_name ASC",
      [brand_id, "active"]
    );

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Vehicles Model found",
        data: [],
      });
    }

    const result = {
      ...brandData[0],
      model: data,
    };

    res.status(200).send({
      success: true,
      message: "All Vehicles Model",
      data: result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Vehicles Model",
      error: error.message,
    });
  }
};

// create new Model
exports.createNewVehiclesModel = async (req, res) => {
  try {
    const { brand_id, model_name, status } = req.body;

    if (!brand_id || !model_name) {
      return res.status(400).send({
        success: false,
        message: "Please provide brand_id & model_name required fields",
      });
    }

    // Chack Duplicate entry
    const [checkData] = await db.query(
      `SELECT * FROM vehicles_model WHERE brand_id=? AND model_name=?`,
      [brand_id, model_name]
    );

    if (checkData.length > 0) {
      return res.status(400).send({
        success: false,
        message: "This Model already exists. Please use a different Model.",
      });
    }

    const query =
      "INSERT INTO vehicles_model (brand_id, model_name, status) VALUES (?, ?, ?)";

    const values = [brand_id, model_name, status || "pending"];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Model, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Model added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update Model
exports.modelUpdate = async (req, res) => {
  try {
    const modelID = req.params.id;

    const { model_name } = req.body;

    const [data] = await db.query(`SELECT * FROM vehicles_model WHERE id=? `, [
      modelID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Model found",
      });
    }

    await db.query(`UPDATE vehicles_model SET model_name=?  WHERE id =?`, [
      model_name || data[0].model_name,
      modelID,
    ]);

    res.status(200).send({
      success: true,
      message: "Model updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update Model ",
      error: error.message,
    });
  }
};

// Model status
exports.modelStatusUpdate = async (req, res) => {
  try {
    const modelID = req.params.id;

    const { status } = req.body;
    if (!status) {
      return res.status(201).send({
        success: false,
        message: "status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM vehicles_model WHERE id=? `, [
      modelID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Model found",
      });
    }

    await db.query(`UPDATE vehicles_model SET status=?  WHERE id =?`, [
      status,
      modelID,
    ]);

    res.status(200).send({
      success: true,
      message: "status updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update status ",
      error: error.message,
    });
  }
};

// delete vehicles_model
exports.deleteModel = async (req, res) => {
  try {
    const modelID = req.params.id;

    const [data] = await db.query(`SELECT * FROM vehicles_model WHERE id=? `, [
      modelID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Model found",
      });
    }
    await db.query(`DELETE FROM vehicles_model WHERE id=?`, [modelID]);
    res.status(200).send({
      success: true,
      message: "Model Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Model",
      error: error.message,
    });
  }
};
