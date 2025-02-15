const db = require("../config/db");

// get all Feature for Admin
exports.getAllFeaturesForAdmin = async (req, res) => {
  try {
    const [data] = await db.query(`SELECT 
      f.*,
      fc.name AS category_name
      FROM features f
      LEFT JOIN feature_category fc ON f.category_id
      `);

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Feature found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "All Feature",
      totalFeature: data.length,
      data: data,
    });
  } catch (error) {
    // Error handling
    res.status(500).send({
      success: false,
      message: "Error in Get All Features",
      error: error.message,
    });
  }
};

// get all Feature for Vendor
exports.getAllFeaturesForVendor = async (req, res) => {
  try {
    const [data] = await db.query(
      `SELECT 
      f.id,
      f.feature_name,
      f.category_id,
      fc.name AS category_name
      FROM features f
      LEFT JOIN feature_category fc ON f.category_id
      WHERE f.status =?
      `,
      ["active"]
    );

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Feature found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "All Feature",
      totalFeature: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Features",
      error: error.message,
    });
  }
};

// create new feture
exports.createNewFeature = async (req, res) => {
  try {
    const { feature_name, status, category_id } = req.body;

    if (!feature_name) {
      return res.status(400).send({
        success: false,
        message: "Please provide feature_name required fields",
      });
    }

    // Chack Duplicate entry
    const [checkData] = await db.query(
      `SELECT * FROM features WHERE feature_name=?`,
      [feature_name]
    );

    if (checkData.length > 0) {
      return res.status(400).send({
        success: false,
        message: "This feature already exists. Please use a different feature.",
      });
    }

    const query =
      "INSERT INTO features (feature_name, status, category_id) VALUES (?, ?, ?)";

    const values = [feature_name, status || "pending", category_id || 0];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert feature, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feature added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update features
exports.featureUpdate = async (req, res) => {
  try {
    const featureID = req.params.id;

    const { feature_name, category_id } = req.body;
    if (!feature_name) {
      return res.status(201).send({
        success: false,
        message: "feature_name is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM features WHERE id=? `, [
      featureID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No feature found",
      });
    }

    await db.query(
      `UPDATE features SET feature_name=?, category_id=?  WHERE id =?`,
      [
        feature_name || data[0].feature_name,
        category_id || data[0].category_id,
        featureID,
      ]
    );

    res.status(200).send({
      success: true,
      message: "feature_name updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update feature_name ",
      error: error.message,
    });
  }
};

// feature status
exports.featureStatusUpdate = async (req, res) => {
  try {
    const featureID = req.params.id;

    const { status } = req.body;
    if (!status) {
      return res.status(201).send({
        success: false,
        message: "status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM features WHERE id=? `, [
      featureID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No feature found",
      });
    }

    await db.query(`UPDATE features SET status=?  WHERE id =?`, [
      status,
      featureID,
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

// delete feature
exports.deleteFeature = async (req, res) => {
  try {
    const featureID = req.params.id;

    const [data] = await db.query(`SELECT * FROM features WHERE id=? `, [
      featureID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No feature found",
      });
    }
    await db.query(`DELETE FROM features WHERE id=?`, [featureID]);
    res.status(200).send({
      success: true,
      message: "Feature Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Feature",
      error: error.message,
    });
  }
};
