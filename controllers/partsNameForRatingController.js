const db = require("../config/db");

// get all parts_name_for_rating
exports.getAllPartsNameForRating = async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM parts_name_for_rating");

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Data found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "All Parts Name For Rating",
      total: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Parts Name For Rating",
      error: error.message,
    });
  }
};

// create new parts name for rating
exports.createNewPartsNameForRating = async (req, res) => {
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
      `SELECT id FROM parts_name_for_rating WHERE name=?`,
      [name]
    );

    if (checkData.length > 0) {
      return res.status(400).send({
        success: false,
        message: "This name already exists. Please use a different name.",
      });
    }

    const [result] = await db.query(
      "INSERT INTO parts_name_for_rating (name) VALUES (?)",
      [name]
    );

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Name, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Name added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update parts name for rating
exports.updatePartsNameForRating = async (req, res) => {
  try {
    const id = req.params.id;

    const { name } = req.body;

    const [data] = await db.query(
      `SELECT * FROM parts_name_for_rating WHERE id=? `,
      [id]
    );
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Data found",
      });
    }

    await db.query(`UPDATE parts_name_for_rating SET name=? WHERE id =?`, [
      name || data[0].name,
      id,
    ]);

    res.status(200).send({
      success: true,
      message: "Part Name updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update Part Name ",
      error: error.message,
    });
  }
};

// delete parts_name_for_rating
exports.deletePartsNameForRating = async (req, res) => {
  try {
    const id = req.params.id;

    const [data] = await db.query(
      `SELECT id FROM parts_name_for_rating WHERE id=? `,
      [id]
    );
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No data found",
      });
    }

    await db.query(`DELETE FROM parts_name_for_rating WHERE id=?`, [id]);
    res.status(200).send({
      success: true,
      message: "Parts Name Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Parts Name",
      error: error.message,
    });
  }
};
