const db = require("../../config/db");
const { generateVendorToken } = require("../../config/vendorToken");
const firebaseAdmin = require("../../config/firebase");

// get all Vendors (Only Owners)
exports.getAllVendors = async (req, res) => {
  try {
    let { page, limit, status } = req.query;

    // Default pagination values
    page = parseInt(page) || 1; // Default page is 1
    limit = parseInt(limit) || 20; // Default limit is 20
    const offset = (page - 1) * limit; // Calculate offset for pagination

    // Initialize SQL query and parameters array
    let sqlQuery = "SELECT * FROM vendors WHERE role = ?"; // Default role = 'Owner'
    const queryParams = ["Owner"];

    // Add filters for status if provided
    if (status) {
      sqlQuery += " AND status LIKE ?";
      queryParams.push(`%${status}%`); // Using LIKE for partial match
    }

    // Add pagination to the query
    sqlQuery += " LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    // Execute the query with filters and pagination
    const [data] = await db.query(sqlQuery, queryParams);

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No vendors found",
        data: [],
      });
    }

    // Get total count of vendors for pagination info (with the same filters)
    let countQuery = "SELECT COUNT(*) as count FROM vendors WHERE role = ?";
    const countParams = ["Owner"];

    // Add the same filters for total count query
    if (status) {
      countQuery += " AND status LIKE ?";
      countParams.push(`%${status}%`);
    }

    const [totalVendorsCount] = await db.query(countQuery, countParams);
    const totalVendors = totalVendorsCount[0].count;

    // Send response with vendors data and pagination info
    res.status(200).send({
      success: true,
      message: "All Vendors (Owners)",
      totalVendors: totalVendors,
      currentPage: page,
      totalPages: Math.ceil(totalVendors / limit),
      data: data,
    });
  } catch (error) {
    // Error handling
    res.status(500).send({
      success: false,
      message: "Error in Get All Vendors",
      error: error.message,
    });
  }
};

// verify vendor
exports.verifyVendorToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(201).send({
      success: false,
      message: "token is required in body",
    });
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    const { uid, name, email, picture, firebase } = decodedToken;

    // Extract sign-in provider
    const signUpMethod = firebase?.sign_in_provider || "unknown";

    // Check if vendor already exists
    const [checkData] = await db.query(`SELECT * FROM vendors WHERE uid=?`, [
      uid,
    ]);

    const [checkManeger] = await db.query(
      `SELECT * FROM vendors WHERE email=? AND role=?`,
      [email, "Manager"]
    );

    if (checkData.length > 0) {
      const existingVendor = checkData[0];
      const authToken = generateVendorToken({ uid: existingVendor.uid });

      res.status(200).json({
        success: true,
        message: "Vendor already exists",
        token: authToken,
      });
    } else if (checkManeger.length > 0) {
      await db.query(`UPDATE vendors SET uid=? WHERE email = ?`, [uid, email]);
      await db.query(
        `UPDATE vendors_employees SET profile_picture=? WHERE email = ?`,
        [picture || "", email]
      );

      const authToken = generateVendorToken({ uid: uid });

      res.status(200).json({
        success: true,
        message: "Manager Login Successfully",
        token: authToken,
      });
    } else {
      const [businessData] = await db.query(
        "SELECT busn_id FROM vendor_busn_info ORDER BY id DESC LIMIT 1"
      );
      const lastBusnId = businessData[0].busn_id;
      const numericPart = parseInt(lastBusnId.substring(1), 10) + 1;
      const busn_id = `v${numericPart}`;

      await db.query(
        `INSERT INTO vendors (uid, busn_id, name, email, sign_up_method) VALUES (?, ?, ?, ?, ?)`,
        [uid, busn_id, name || "", email || "", signUpMethod]
      );

      await db.query(
        `INSERT INTO vendor_busn_info (busn_id, name, profile_picture) VALUES (?, ?, ?)`,
        [busn_id, name || "", picture || ""]
      );

      const authToken = generateVendorToken({ uid: uid });

      res.status(200).json({
        success: true,
        message: "Vendor registered",
        token: authToken,
      });
    }
  } catch (error) {
    return res.status(401).send({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
};

// get single vendor by id
exports.getSingleVendor = async (req, res) => {
  try {
    const { busn_id } = req.params;

    const [data] = await db.query(
      `SELECT v.id,
      v.busn_id,
      v.role,
      v.email,
      vbi.name,
      vbi.phone,
      vbi.emergency_phone,
      vbi.about,
      vbi.company_name,
      vbi.business_lisence,
      vbi.profile_picture,
      vbi.banner,
      vbi.nid_card_front,
      vbi.nid_card_back,
      vbi.is_active,
      vbi.status,
      vbi.verify_status
      FROM vendors v
      LEFT JOIN vendor_busn_info vbi ON v.busn_id = vbi.busn_id
      WHERE v.busn_id=? `,
      [busn_id]
    );

    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No vendor found",
      });
    }
    res.status(200).send({
      success: true,
      message: "Get Single vendor",
      data: data[0],
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting vendor",
      error: error.message,
    });
  }
};

// vendor status
exports.vendorStatusUpdate = async (req, res) => {
  try {
    const vendorId = req.params.id;
    if (!vendorId) {
      return res.status(201).send({
        success: false,
        message: "vendor ID is required in params",
      });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(201).send({
        success: false,
        message: "status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM vendors WHERE id=? `, [
      vendorId,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No vendor found",
      });
    }

    await db.query(`UPDATE vendors SET status=?  WHERE id =?`, [
      status,
      vendorId,
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

// delete vendor
exports.deleteVendor = async (req, res) => {
  try {
    const vendorID = req.params.id;

    const [data] = await db.query(`SELECT * FROM vendors WHERE id=? `, [
      vendorID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No vendor found",
      });
    }
    await db.query(`DELETE FROM vendors WHERE id=?`, [vendorID]);
    res.status(200).send({
      success: true,
      message: "vendor Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete vendor",
      error: error.message,
    });
  }
};

// get me vendor
exports.getMeVendor = async (req, res) => {
  try {
    const vendor = req.decodedVendor;
    res.status(200).json(vendor);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get my profile vendor
exports.getMyProfileVendor = async (req, res) => {
  try {
    const vendor = req.decodedVendor;

    let data = {};
    if (vendor.role == "Owner") {
      const [vendorData] = await db.query(
        `SELECT 
          v.id,
          v.busn_id,
          v.role,
          v.uid,
          v.email,
          v.sign_up_method,
          vbi.name,
          vbi.phone,
          vbi.emergency_phone,
          vbi.about,
          vbi.company_name,
          vbi.business_lisence,
          vbi.profile_picture,
          vbi.banner,
          vbi.nid_card_front,
          vbi.nid_card_back,
          vbi.is_active,
          vbi.status,
          vbi.verify_status
        FROM vendors v
        LEFT JOIN vendor_busn_info vbi ON v.busn_id = vbi.busn_id
        WHERE v.id=? `,
        [vendor.id]
      );

      data = vendorData[0];
    } else {
      const [employeeData] = await db.query(
        `SELECT 
          vem.id,
          vem.vendor_id,
          v.busn_id,
          v.role,
          v.uid,
          v.sign_up_method,
          v.is_active,
          vem.employee_position,
          vem.name,
          vem.profile_picture,
          vem.date_of_birth,
          vem.gender,
          vem.permanent_address,
          vem.current_address,
          vem.mobile_number,
          vem.email,
          vem.blood_type,
          vem.nid_card_or_birth_certificate,
          vem.designation,
          vem.department,
          vem.salary,
          vem.job_type
        FROM vendors v
        LEFT JOIN vendors_employees vem ON v.email = vem.email
        WHERE v.id=? `,
        [vendor.id]
      );

      data = employeeData[0];
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update vendor
exports.updateVendor = async (req, res) => {
  try {
    const vendorPreData = req.decodedVendor;

    // Extract data from the request body
    const {
      name,
      email,
      phone,
      emergency_phone,
      about,
      company_name,
      business_lisence,
    } = req.body;

    const images = req.file;
    let profile_picture = vendorPreData?.profile_picture;
    if (images && images.path) {
      profile_picture = `https://api.garirhat.com/public/images/${images.filename}`;
    }

    // Update the vendor data in the database
    const [data] = await db.query(
      `UPDATE vendors SET name=?, email=?, phone=?, emergency_phone=?, about=?, company_name=?, business_lisence=?, profile_picture=? WHERE id = ?`,
      [
        name || vendorPreData.name,
        email || vendorPreData.email,
        phone || vendorPreData.phone,
        emergency_phone || vendorPreData.emergency_phone,
        about || vendorPreData.about,
        company_name || vendorPreData.company_name,
        business_lisence || vendorPreData.business_lisence,
        profile_picture,
        vendorPreData.id,
      ]
    );

    if (!data) {
      return res.status(500).send({
        success: false,
        message: "Error in updating Vendor",
      });
    }

    res.status(200).send({
      success: true,
      message: "Vendor updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in updating Vendor",
      error: error.message,
    });
  }
};

// update vendor banner
exports.updateVendorBanner = async (req, res) => {
  try {
    const vendorPreData = req.decodedVendor;

    const images = req.file;
    let banner = vendorPreData?.banner;
    if (images && images.path) {
      banner = `https://api.garirhat.com/public/images/${images.filename}`;
    }

    // Update the vendor data in the database
    const [data] = await db.query(`UPDATE vendors SET banner=? WHERE id = ?`, [
      banner,
      vendorPreData.id,
    ]);

    res.status(200).send({
      success: true,
      message: "Vendor banner updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in updating Vendor banner",
      error: error.message,
    });
  }
};

// update nid card for vendor
exports.updateNIDCardVendor = async (req, res) => {
  try {
    const vendorPreData = req.decodedVendor;

    const messages = {
      verified: "Your NID card has already been submitted and verified.",
      rejected:
        "You cannot submit your NID card again, as it has been rejected.",
      pending: "Your NID card has already been submitted and is under review.",
      under_review:
        "Your NID card has already been submitted and is under review.",
    };

    if (messages[vendorPreData.verify_status]) {
      return res.status(400).send({
        success: false,
        message: messages[vendorPreData.verify_status],
      });
    }

    const images = req.files;

    let nid_card_front = vendorPreData?.nid_card_front;
    let nid_card_back = vendorPreData?.nid_card_back;

    if (images?.nid_card_front?.length > 0) {
      nid_card_front = `https://api.garirhat.com/public/images/${images["nid_card_front"][0].filename}`;
    }

    if (images?.nid_card_back?.length > 0) {
      nid_card_back = `https://api.garirhat.com/public/images/${images["nid_card_back"][0].filename}`;
    }

    // Update the vendor data in the database
    const [result] = await db.query(
      `UPDATE vendors SET nid_card_front=?, nid_card_back=? WHERE id = ?`,
      [nid_card_front, nid_card_back, vendorPreData.id]
    );

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Error in NIC Card updating Vendor",
      });
    }

    res.status(200).send({
      success: true,
      message: "Vendor NIC Card updated successfully",
      data: {
        nid_card_front,
        nid_card_back,
      },
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in NIC Card updating Vendor",
      error: error.message,
    });
  }
};

// vendor verify status
exports.vendorVerifyStatusUpdate = async (req, res) => {
  try {
    const vendorId = req.params.id;
    if (!vendorId) {
      return res.status(201).send({
        success: false,
        message: "vendor ID is required in params",
      });
    }

    const { verify_status } = req.body;
    if (!verify_status) {
      return res.status(201).send({
        success: false,
        message: "verify_status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM vendors WHERE id=? `, [
      vendorId,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No vendor found",
      });
    }

    await db.query(`UPDATE vendors SET verify_status=?  WHERE id =?`, [
      verify_status,
      vendorId,
    ]);

    res.status(200).send({
      success: true,
      message: "verify status updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update verify status ",
      error: error.message,
    });
  }
};
