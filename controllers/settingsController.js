const db = require("../config/db");

// get settings
exports.getSettings = async (req, res) => {
  try {
    const settingsName = req.params.name;

    const [data] = await db.execute("SELECT * FROM settings WHERE name=?", [
      settingsName,
    ]);

    if (!data || data.length === 0) {
      return res.status(400).send({
        success: true,
        message: "No Data found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: `Get ${settingsName}`,
      data: data[0],
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update Settings
exports.updateSettings = async (req, res) => {
  try {
    const settingsName = req.params.name;

    const { content } = req.body;

    if (!content) {
      return res.status(400).send({
        success: false,
        message: "Please provide content required fields",
      });
    }

    const [preData] = await db.execute(
      "SELECT name FROM settings WHERE name=?",
      [settingsName]
    );

    if (!preData || preData.length === 0) {
      return res.status(400).send({
        success: true,
        message: "No Data found",
      });
    }

    await db.query(`UPDATE settings SET content=? WHERE name=?`, [
      content,
      settingsName,
    ]);

    return res.status(200).json({
      success: true,
      message: `${settingsName} updated successfully`,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
