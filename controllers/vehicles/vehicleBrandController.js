const db = require("../../config/db");

// get all vehicles_brand with model
exports.getAllVehiclesBrandWithModel = async (req, res) => {
  try {
    const { status } = req.query;
    let query = "SELECT id, brand_name FROM vehicles_brand";
    let queryParams = [];

    let conditions = [];

    if (status === "active") {
      conditions.push("status = ?");
      queryParams.push("active");
    }

    conditions.push("is_others = ?");
    queryParams.push(0);

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY brand_name ASC";

    const [brands] = await db.query(query, queryParams);

    if (!brands || brands.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Vehicles Brand found",
        data: [],
      });
    }

    for (const brand of brands) {
      const brandID = brand.id;

      let modelQuery =
        "SELECT id, model_name, average_rating, total_rating FROM vehicles_model WHERE brand_id = ?";
      let modelParams = [brandID];

      if (status === "active") {
        modelQuery += " AND status = ?";
        modelParams.push("active");
      }

      modelQuery += " ORDER BY model_name ASC";

      const [models] = await db.query(modelQuery, modelParams);
      brand.models = models;
    }

    // othersBrands
    let queryOthers = "SELECT id, brand_name FROM vehicles_brand";
    let queryParamsOthers = [];

    let conditionsOthers = [];

    if (status === "active") {
      conditionsOthers.push("status = ?");
      queryParamsOthers.push("active");
    }

    conditionsOthers.push("is_others = ?");
    queryParamsOthers.push(1);

    if (conditionsOthers.length > 0) {
      queryOthers += " WHERE " + conditionsOthers.join(" AND ");
    }

    queryOthers += " ORDER BY brand_name ASC";

    const [othersBrands] = await db.query(queryOthers, queryParamsOthers);

    for (const brand of othersBrands) {
      const brandID = brand.id;

      let modelQuery =
        "SELECT id, model_name, average_rating, total_rating FROM vehicles_model WHERE brand_id = ?";
      let modelParams = [brandID];

      if (status === "active") {
        modelQuery += " AND status = ?";
        modelParams.push("active");
      }

      modelQuery += " ORDER BY model_name ASC";

      const [models] = await db.query(modelQuery, modelParams);
      brand.models = models;
    }

    res.status(200).send({
      success: true,
      message: "All Vehicles Brand",
      totalVehicle: brands.length,
      data: brands,
      othersBrands: othersBrands,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Vehicles Brand",
      error: error.message,
    });
  }
};

// get all vehicles_brand for Admin
exports.getAllVehiclesBrandForAdmin = async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM vehicles_brand");

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Vehicles Brand found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "All Vehicles Brand",
      totalVehicle: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Vehicles Brand",
      error: error.message,
    });
  }
};

// get all Brand for Vendor
exports.getAllBrandsForVendor = async (req, res) => {
  try {
    const [data] = await db.query(
      "SELECT id, brand_name, image FROM vehicles_brand WHERE status =? AND is_others=?",
      ["active", 0]
    );

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Brand found",
        data: [],
      });
    }

    const [others] = await db.query(
      "SELECT id, brand_name, image FROM vehicles_brand WHERE status =? AND is_others=?",
      ["active", 1]
    );

    res.status(200).send({
      success: true,
      message: "All Brand",
      totalBrand: data.length,
      data: data,
      others: others,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All brand",
      error: error.message,
    });
  }
};

// create new brand
exports.createNewVehiclesBrand = async (req, res) => {
  try {
    const { brand_name, status } = req.body;

    if (!brand_name) {
      return res.status(400).send({
        success: false,
        message: "Please provide brand_name required fields",
      });
    }

    // Chack Duplicate entry
    const [checkData] = await db.query(
      `SELECT * FROM vehicles_brand WHERE brand_name=?`,
      [brand_name]
    );

    if (checkData.length > 0) {
      return res.status(400).send({
        success: false,
        message: "This brand already exists. Please use a different brand.",
      });
    }

    const images = req.file;
    let image = "";
    if (images && images.path) {
      image = `https://api.garirhat.com/public/images/${images.filename}`;
    }

    const query =
      "INSERT INTO vehicles_brand (brand_name, image, status) VALUES (?, ?, ?)";

    const values = [brand_name, image, status || "pending"];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Brand, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Brand added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update brand
exports.brandUpdate = async (req, res) => {
  try {
    const brandID = req.params.id;

    const { brand_name } = req.body;

    const [data] = await db.query(`SELECT * FROM vehicles_brand WHERE id=? `, [
      brandID,
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
      image = `https://api.garirhat.com/public/images/${images.filename}`;
    }

    await db.query(
      `UPDATE vehicles_brand SET brand_name=?, image=?  WHERE id =?`,
      [brand_name || data[0].brand_name, image, brandID]
    );

    res.status(200).send({
      success: true,
      message: "brand updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update brand ",
      error: error.message,
    });
  }
};

// brand status
exports.brandStatusUpdate = async (req, res) => {
  try {
    const brandID = req.params.id;

    const { status } = req.body;
    if (!status) {
      return res.status(201).send({
        success: false,
        message: "status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM vehicles_brand WHERE id=? `, [
      brandID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No brand found",
      });
    }

    await db.query(`UPDATE vehicles_brand SET status=?  WHERE id =?`, [
      status,
      brandID,
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

// delete vehicles_brand
exports.deleteBrand = async (req, res) => {
  try {
    const brandID = req.params.id;

    const [data] = await db.query(`SELECT * FROM vehicles_brand WHERE id=? `, [
      brandID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No brand found",
      });
    }
    await db.query(`DELETE FROM vehicles_model WHERE brand_id=?`, [brandID]);

    await db.query(`DELETE FROM vehicles_brand WHERE id=?`, [brandID]);
    res.status(200).send({
      success: true,
      message: "Brand Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Brand",
      error: error.message,
    });
  }
};
