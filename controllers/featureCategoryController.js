const db = require("../config/db");

// get all Feature Category
exports.getAllFeaturesCategory = async (req, res) => {
  try {
    const [data] = await db.query(`SELECT * FROM feature_category`);

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Feature category found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "All Feature category category",
      totalFeatureCategory: data.length,
      data: data,
    });
  } catch (error) {
    // Error handling
    res.status(500).send({
      success: false,
      message: "Error in Get All Features Category",
      error: error.message,
    });
  }
};

// create new feture category
exports.createNewFeatureCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).send({
        success: false,
        message: "Please provide name required fields",
      });
    }

    // Chack Duplicate entry
    const [checkData] = await db.query(
      `SELECT * FROM feature_category WHERE name=?`,
      [name]
    );

    if (checkData.length > 0) {
      return res.status(400).send({
        success: false,
        message: "This name already exists. Please use a different name.",
      });
    }

    const query = "INSERT INTO feature_category (name) VALUES (?)";

    const values = [name];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert feature category, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feature category added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update features category
exports.featureUpdateCategory = async (req, res) => {
  try {
    const featureID = req.params.id;

    const { name } = req.body;
    if (!name) {
      return res.status(201).send({
        success: false,
        message: "name is requied in body",
      });
    }

    const [data] = await db.query(
      `SELECT * FROM feature_category WHERE id=? `,
      [featureID]
    );
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No name found",
      });
    }

    await db.query(`UPDATE feature_category SET name=?  WHERE id =?`, [
      name,
      featureID,
    ]);

    res.status(200).send({
      success: true,
      message: "feature category updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update feature category",
      error: error.message,
    });
  }
};

// delete feature category
exports.deleteFeatureCategory = async (req, res) => {
  try {
    const featureID = req.params.id;

    const [data] = await db.query(
      `SELECT * FROM feature_category WHERE id=? `,
      [featureID]
    );
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No feature category found",
      });
    }
    await db.query(`DELETE FROM feature_category WHERE id=?`, [featureID]);
    res.status(200).send({
      success: true,
      message: "Feature category Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Feature category",
      error: error.message,
    });
  }
};
