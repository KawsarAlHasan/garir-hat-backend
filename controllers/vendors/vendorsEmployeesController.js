const db = require("../../config/db");

// get all vendor's employees
exports.getAllVendorEmployees = async (req, res) => {
  try {
    const status = req.params.status;

    const [data] = await db.execute("SELECT * FROM vendors_employees");

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

// create New Employee
exports.createNewVendorEmployee = async (req, res) => {
  try {
    const {
      employee_position,
      name,
      date_of_birth,
      gender,
      permanent_address,
      current_address,
      mobile_number,
      email,
      blood_type,
      designation,
      department,
      salary,
      job_type,
    } = req.body;

    const busn_id = req.decodedVendor.busn_id;

    let vendor_id = 0;
    if (employee_position == "Manager") {
      const vendorTableQueary = `INSERT INTO vendors (busn_id, role, name, email, phone) VALUES (?, ?, ?, ?, ?)`;
      const vendorTableValues = [
        busn_id,
        employee_position,
        name,
        email,
        mobile_number || "",
      ];
      const [result] = await db.query(vendorTableQueary, vendorTableValues);
      vendor_id = result.insertId;
    }

    const images = req.file;
    let image = "";
    if (images && images.path) {
      image = `https://api.garirhat.com/public/images/${images.filename}`;
    }

    const query =
      "INSERT INTO vendors_employees (busn_id, vendor_id, employee_position, name, date_of_birth, gender, permanent_address, current_address, mobile_number, email, blood_type, nid_card_or_birth_certificate, designation, department, salary, job_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    const values = [
      busn_id,
      vendor_id,
      employee_position,
      name,
      date_of_birth,
      gender,
      permanent_address,
      current_address,
      mobile_number,
      email,
      blood_type,
      image,
      designation,
      department,
      salary,
      job_type,
    ];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Employee, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
