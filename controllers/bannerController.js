const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// create new banner
exports.createBanner = async (req, res) => {
  try {
    const { title, link_url, sn_number, status } = req.body;

    const images = req.file;
    let image = "";
    if (images && images.path) {
      image = `https://api.garirhat.com/public/images/${images.filename}`;
    }

    const query =
      "INSERT INTO banner (title, link_url, sn_number, status, image) VALUES (?, ?, ?, ?, ?)";

    const values = [
      title || "",
      link_url || "",
      sn_number || 100,
      status || "active",
      image,
    ];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Banner, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Banner added successfully",
      bannerID: result.insertId,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all banner
exports.getAllBanner = async (req, res) => {
  try {
    const status = req.params.status;

    let query = "SELECT * FROM banner";
    let queryParams = [];

    let conditions = [];

    if (status === "active") {
      conditions.push("status = ?");
      queryParams.push("active");
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY sn_number ASC";

    const [data] = await db.execute(query, queryParams);

    res.status(200).json({
      success: true,
      message: "All Banner",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in Get All Banner",
      error: error.message,
    });
  }
};

// Get Single banner by ID
exports.getSingleBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await db.execute("SELECT * FROM banner WHERE id = ?", [id]);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Get Single Banner",
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching Banner",
      error: error.message,
    });
  }
};

// update banner
exports.bannerUpdate = async (req, res) => {
  try {
    const bannerID = req.params.id;

    const { title, link_url, sn_number, status } = req.body;

    const [data] = await db.query(`SELECT * FROM banner WHERE id=? `, [
      bannerID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No brand found",
      });
    }

    const images = req.file;
    let image = data[0].image;
    if (images && images.path) {
      const bannerImage = path.basename(data[0].image);
      const bannerImagePath = path.join(
        __dirname,
        "..",
        "public",
        "images",
        bannerImage
      );
      if (fs.existsSync(bannerImagePath)) {
        fs.unlinkSync(bannerImagePath);
      }

      image = `https://api.garirhat.com/public/images/${images.filename}`;
    }

    await db.query(
      `UPDATE banner SET title=?, link_url=?, sn_number=?, status=?, image=?  WHERE id =?`,
      [
        title || data[0].title,
        link_url || data[0].link_url,
        sn_number || data[0].sn_number,
        status || data[0].status,
        image,
        bannerID,
      ]
    );

    res.status(200).send({
      success: true,
      message: "Banner updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update Banner ",
      error: error.message,
    });
  }
};

// delete banner
exports.deletebanner = async (req, res) => {
  try {
    const bannerID = req.params.id;

    const [data] = await db.query(`SELECT * FROM banner WHERE id=?`, [
      bannerID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No banner found",
      });
    }

    const bannerImage = path.basename(data[0].image);
    const bannerImagePath = path.join(
      __dirname,
      "..",
      "public",
      "images",
      bannerImage
    );
    if (fs.existsSync(bannerImagePath)) {
      fs.unlinkSync(bannerImagePath);
    }

    await db.query(`DELETE FROM banner WHERE id=?`, [bannerID]);
    res.status(200).send({
      success: true,
      message: "Banner Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Banner",
      error: error.message,
    });
  }
};
