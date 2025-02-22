const db = require("../config/db");

// get all divisions with district and upzilas
exports.getDivisionsWithDistrictsAndUpzilas = async (req, res) => {
  try {
    const [divisions] = await db.query(`SELECT * FROM divisions`);

    if (!divisions || divisions.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Division found",
        data: [],
      });
    }

    for (const division of divisions) {
      const divisionID = division.id;
      const [districts] = await db.query(
        `SELECT * FROM districts WHERE division_id=?`,
        [divisionID]
      );

      for (const district of districts) {
        const districtID = district.id;
        const [upazilas] = await db.query(
          `SELECT * FROM upazilas WHERE district_id=?`,
          [districtID]
        );

        district.upazilas = upazilas;
      }

      division.districts = districts;
    }

    res.status(200).send({
      success: true,
      message: "All Division with district and upzilas",
      data: divisions,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Division with district and upzilas",
      error: error.message,
    });
  }
};

// get all divisions with district
exports.getDivisionsWithDistricts = async (req, res) => {
  try {
    const [divisions] = await db.query(`SELECT * FROM divisions`);

    if (!divisions || divisions.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Division found",
        data: [],
      });
    }

    for (const division of divisions) {
      const divisionID = division.id;
      const [districts] = await db.query(
        `SELECT * FROM districts WHERE division_id=?`,
        [divisionID]
      );

      division.districts = districts;
    }

    res.status(200).send({
      success: true,
      message: "All Division with districts",
      data: divisions,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Division with districts",
      error: error.message,
    });
  }
};

// get all divisions
exports.getDivisions = async (req, res) => {
  try {
    const [divisions] = await db.query(`SELECT * FROM divisions`);

    if (!divisions || divisions.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Division found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "All Division",
      data: divisions,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Division",
      error: error.message,
    });
  }
};

// get all district with upzilas
exports.getDistrictsWithUpzilas = async (req, res) => {
  try {
    const districtID = req.params.id;
    const [districts] = await db.query(`SELECT * FROM districts WHERE id=?`, [
      districtID,
    ]);

    if (!districts || districts.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No districts found",
        data: [],
      });
    }

    for (const district of districts) {
      const districtID = district.id;
      const [upazilas] = await db.query(
        `SELECT * FROM upazilas WHERE district_id=?`,
        [districtID]
      );

      district.upazilas = upazilas;
    }

    res.status(200).send({
      success: true,
      message: "All district with upzilas",
      data: districts,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All district with upzilas",
      error: error.message,
    });
  }
};

// update division
exports.updateDivision = async (req, res) => {
  try {
    const divisionID = req.params.id;

    const images = req.file;
    let image = "";
    if (images && images.path) {
      image = `https://api.garirhat.com/public/images/${images.filename}`;
    }

    const [data] = await db.query(`SELECT * FROM divisions WHERE id=? `, [
      divisionID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No division found",
      });
    }

    await db.query(`UPDATE divisions SET logo=?  WHERE id =?`, [
      image || data[0].logo,
      divisionID,
    ]);

    res.status(200).send({
      success: true,
      message: "Division updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update Division ",
      error: error.message,
    });
  }
};
