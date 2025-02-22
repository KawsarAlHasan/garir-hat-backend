const db = require("../config/db");
const { generateUserToken } = require("../config/userToken");
const firebaseAdmin = require("../config/firebase");

// verify user
exports.verifyToken = async (req, res) => {
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

    // Check if user already exists
    const [checkData] = await db.query(`SELECT * FROM users WHERE uid=?`, [
      uid,
    ]);

    if (checkData.length > 0) {
      const existingUser = checkData[0];
      const authToken = generateUserToken({ uid: existingUser.uid });

      res.status(200).json({
        success: true,
        message: "User already exists",
        token: authToken,
      });
    } else {
      await db.query(
        `INSERT INTO users (uid, name, email, profile_pic, sign_up_method) VALUES (?, ?, ?, ?, ?)`,
        [uid, name || "", email || "", picture || "", signUpMethod]
      );

      const authToken = generateUserToken({ uid: uid });

      res.status(200).json({
        success: true,
        message: "User registered",
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

// get all Users
exports.getAllUsers = async (req, res) => {
  try {
    let { page, limit, status } = req.query;

    // Default pagination values
    page = parseInt(page) || 1; // Default page is 1
    limit = parseInt(limit) || 20; // Default limit is 20
    const offset = (page - 1) * limit; // Calculate offset for pagination

    // Initialize SQL query and parameters array
    let sqlQuery = "SELECT * FROM users WHERE 1=1"; // 1=1 makes appending conditions easier
    const queryParams = [];

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
        message: "No users found",
        data: [],
      });
    }

    // Get total count of users for pagination info (with the same filters)
    let countQuery = "SELECT COUNT(*) as count FROM users WHERE 1=1";
    const countParams = [];

    // Add the same filters for total count query
    if (status) {
      countQuery += " AND status LIKE ?";
      countParams.push(`%${status}%`);
    }

    const [totalUsersCount] = await db.query(countQuery, countParams);
    const totalUsers = totalUsersCount[0].count;

    // Send response with users data and pagination info
    res.status(200).send({
      success: true,
      message: "All Users",
      totalUsers: totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      data: data,
    });
  } catch (error) {
    // Error handling
    res.status(500).send({
      success: false,
      message: "Error in Get All Users",
      error: error.message,
    });
  }
};

// get single user by id
exports.getSingleUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(201).send({
        success: false,
        message: "User ID is required in params",
      });
    }

    const [data] = await db.query(`SELECT * FROM users WHERE id=? `, [userId]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No user found",
      });
    }
    res.status(200).send({
      success: true,
      message: "Get Single User",
      data: data[0],
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting user",
      error: error.message,
    });
  }
};

// user status
exports.userStatusUpdate = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(201).send({
        success: false,
        message: "User ID is required in params",
      });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(201).send({
        success: false,
        message: "status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM users WHERE id=? `, [userId]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No user found",
      });
    }

    await db.query(`UPDATE users SET status=?  WHERE id =?`, [status, userId]);

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

// delete user
exports.deleteUser = async (req, res) => {
  try {
    const userID = req.params.id;

    const [data] = await db.query(`SELECT * FROM users WHERE id=? `, [userID]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No user found",
      });
    }
    await db.query(`DELETE FROM users WHERE id=?`, [userID]);
    res.status(200).send({
      success: true,
      message: "User Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete User",
      error: error.message,
    });
  }
};

// get me User
exports.getMeUser = async (req, res) => {
  try {
    const user = req.decodedUser;
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update user
exports.updateUser = async (req, res) => {
  try {
    const userPreData = req.decodedUser;

    // Extract data from the request body
    const { name, email, phone } = req.body;

    const images = req.file;
    let profile_pic = userPreData?.profile_pic;
    if (images && images.path) {
      profile_pic = `https://api.garirhat.com/public/images/${images.filename}`;
    }

    // Update the user data in the database
    const [data] = await db.query(
      `UPDATE users SET name=?, email=?, phone=?, profile_pic=? WHERE id = ?`,
      [
        name || userPreData.name,
        email || userPreData.email,
        phone || userPreData.phone,
        profile_pic,
        userPreData.id,
      ]
    );

    if (!data) {
      return res.status(500).send({
        success: false,
        message: "Error in updating user",
      });
    }

    res.status(200).send({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in updating user",
      error: error.message,
    });
  }
};
