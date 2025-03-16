const firebaseAdmin = require("../config/firebase");
const firebaseDatabase = firebaseAdmin.database();

const db = require("../config/db");
const io = require("../config/socket");

exports.sendMessage2 = async (req, res) => {
  try {
    const { sender_id, receiver_id, vehicle_id, message } = req.body;

    if (!sender_id || !receiver_id || !vehicle_id || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // মেসেজ MySQL ডাটাবেজে সংরক্ষণ করা
    const [result] = await db.query(
      "INSERT INTO messages (sender_id, receiver_id, vehicle_id, message) VALUES (?, ?, ?, ?)",
      [sender_id, receiver_id, vehicle_id, message]
    );

    const messageId = result.insertId;

    const newMessage = {
      id: messageId,
      sender_id,
      receiver_id,
      message,
      timestamp: new Date().toISOString(),
    };

    // Socket.io ব্যবহার করে রিসিভারকে মেসেজ পাঠানো
    io.getIo().to(receiver_id).emit("newMessage", newMessage);

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: newMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getMessage2 = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.query;
    if (!sender_id || !receiver_id) {
      return res.status(400).json({
        success: false,
        message: "Sender ID and Receiver ID required",
      });
    }

    // ডাটাবেজ থেকে মেসেজ ফেচ করা
    const [messages] = await db.query(
      "SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC LIMIT 10",
      [sender_id, receiver_id, receiver_id, sender_id]
    );

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, vehicle_id, message } = req.body;

    if (!sender_id || !receiver_id || !vehicle_id || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Store message in MySQL
    const [result] = await db.query(
      "INSERT INTO messages (sender_id, receiver_id, vehicle_id, message) VALUES (?, ?, ?, ?)",
      [sender_id, receiver_id, vehicle_id, message]
    );

    const messageId = result.insertId;

    // Firebase message update (Real-time update)
    const newMessage = {
      id: messageId,
      sender_id,
      receiver_id,
      message,
      timestamp: new Date().toISOString(),
    };

    const chatPath = `chats/${sender_id}_${receiver_id}/messages`;

    await firebaseDatabase.ref(chatPath).push(newMessage);

    res.status(201).json({
      success: true,
      message: "Message sent",
      data: newMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.query;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({
        success: false,
        message: "Sender ID and Receiver ID required",
      });
    }

    const [messages] = await db.query(
      "SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC",
      [sender_id, receiver_id, receiver_id, sender_id]
    );

    res.status(200).json({
      success: true,
      messages: "Get messages",
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.usersListForMessage = async (req, res) => {
  try {
    const { receiver_id } = req.params;

    // Fetch sender_id & vehicle_id with vehicle details
    const [messages] = await db.execute(
      `SELECT DISTINCT m.sender_id, m.vehicle_id, v.make, v.model, v.vehicle_code, v.thumbnail_image, v.trim, v.year_of_manufacture
       FROM messages m
       LEFT JOIN vehicles v ON m.vehicle_id = v.id
       WHERE m.receiver_id = ?
       ORDER BY m.id DESC`,
      [receiver_id]
    );

    const usersMap = {};
    const vendorsMap = {};

    messages.forEach((row) => {
      const senderId = row.sender_id;
      const vehicle = row.vehicle_id
        ? {
            id: row.vehicle_id,
            make: row.make,
            model: row.model,
            year_of_manufacture: row.year_of_manufacture,
            vehicle_code: row.vehicle_code,
            thumbnail_image: row.thumbnail_image,
            trim: row.trim,
          }
        : null;

      if (senderId.startsWith("u")) {
        const userId = senderId.replace("u", "");
        if (!usersMap[userId]) {
          usersMap[userId] = { id: userId, vehicles: [] };
        }
        if (vehicle) usersMap[userId].vehicles.push(vehicle);
      } else if (senderId.startsWith("v")) {
        const vendorId = senderId.replace("v", "");
        if (!vendorsMap[vendorId]) {
          vendorsMap[vendorId] = { id: vendorId, vehicles: [] };
        }
        if (vehicle) vendorsMap[vendorId].vehicles.push(vehicle);
      }
    });

    // Fetch user details
    const userQueries = Object.keys(usersMap).map(async (id) => {
      const [user] = await db.execute(
        "SELECT id, name, profile_pic, is_active FROM users WHERE id = ?",
        [id]
      );
      return user.length > 0
        ? { ...user[0], vehicles: usersMap[id].vehicles }
        : null;
    });

    // Fetch vendor details
    const vendorQueries = Object.keys(vendorsMap).map(async (id) => {
      const [vendor] = await db.execute(
        "SELECT id, name, profile_picture, is_active FROM vendors WHERE id = ?",
        [id]
      );
      return vendor.length > 0
        ? { ...vendor[0], vehicles: vendorsMap[id].vehicles }
        : null;
    });

    // Resolve all queries
    const usersInfo = await Promise.all(userQueries);
    const vendorsInfo = await Promise.all(vendorQueries);

    const filteredUsers = usersInfo.filter((user) => user !== null);
    const filteredVendors = vendorsInfo.filter((vendor) => vendor !== null);

    res.status(200).json({
      success: true,
      message: "Sender user, vendor, and associated vehicle details retrieved",
      users: filteredUsers,
      vendors: filteredVendors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.isUserOnline = async (req, res) => {
  try {
    const { sender_id } = req.params;

    const uID = sender_id.slice(1);
    const type = sender_id.charAt(0);

    if (type === "u") {
      const [user] = await db.execute("SELECT * FROM users WHERE id = ?", [
        uID,
      ]);

      res.status(200).json({
        success: true,
        message: "Sender user & vendor details retrieved",
        type: "user",
        data: user,
      });
    } else if (type === "v") {
      const [vendor] = await db.execute("SELECT * FROM vendors WHERE id = ?", [
        uID,
      ]);

      res.status(200).json({
        success: true,
        message: "Sender user & vendor details retrieved",
        type: "vendor",
        data: vendor,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
