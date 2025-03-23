exports.usersListForMessage = async (req, res) => {
  try {
    const { receiver_id } = req.params;

    // Fetch sender_id with their latest message details
    const [messages] = await db.execute(
      `SELECT m.sender_id, m.vehicle_id, v.make, v.model, v.vehicle_code, 
              v.thumbnail_image, v.trim, v.year_of_manufacture, 
              m.created_at
       FROM messages m
       LEFT JOIN vehicles v ON m.vehicle_id = v.id
       WHERE m.id IN (
           SELECT MAX(id) FROM messages 
           WHERE receiver_id = ? 
           GROUP BY sender_id
       )
       ORDER BY m.created_at DESC`,
      [receiver_id]
    );

    const usersMap = {};
    const vendorsMap = {};
    const senderIds = new Set();

    messages.forEach((row) => {
      const senderId = row.sender_id;
      senderIds.add(senderId);
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
          usersMap[userId] = {
            id: userId,
            vehicles: [],
            unread_count: 0,
            last_message_time: row.created_at,
          };
        }
        if (vehicle) usersMap[userId].vehicles.push(vehicle);
      } else if (senderId.startsWith("v")) {
        const vendorId = senderId.replace("v", "");
        if (!vendorsMap[vendorId]) {
          vendorsMap[vendorId] = {
            id: vendorId,
            vehicles: [],
            unread_count: 0,
            last_message_time: row.created_at,
          };
        }
        if (vehicle) vendorsMap[vendorId].vehicles.push(vehicle);
      }
    });

    // Fetch unread message count for each sender
    const unreadCounts = await db.execute(
      `SELECT sender_id, COUNT(*) as unread_count
       FROM messages
       WHERE receiver_id = ? AND is_read = 0
       GROUP BY sender_id`,
      [receiver_id]
    );

    // Map unread counts to users/vendors
    unreadCounts[0].forEach(({ sender_id, unread_count }) => {
      if (sender_id.startsWith("u")) {
        const userId = sender_id.replace("u", "");
        if (usersMap[userId]) {
          usersMap[userId].unread_count = unread_count;
        }
      } else if (sender_id.startsWith("v")) {
        const vendorId = sender_id.replace("v", "");
        if (vendorsMap[vendorId]) {
          vendorsMap[vendorId].unread_count = unread_count;
        }
      }
    });

    // Fetch user details
    const userQueries = Object.keys(usersMap).map(async (id) => {
      const [user] = await db.execute(
        "SELECT id, name, profile_pic, is_active FROM users WHERE id = ?",
        [id]
      );
      return user.length > 0
        ? {
            ...user[0],
            unread_count: usersMap[id].unread_count,
            vehicles: usersMap[id].vehicles,
            last_message_time: usersMap[id].last_message_time,
          }
        : null;
    });

    // Fetch vendor details
    const vendorQueries = Object.keys(vendorsMap).map(async (id) => {
      const [vendor] = await db.execute(
        "SELECT id, name, profile_picture, is_active FROM vendors WHERE id = ?",
        [id]
      );
      return vendor.length > 0
        ? {
            ...vendor[0],
            unread_count: vendorsMap[id].unread_count,
            vehicles: vendorsMap[id].vehicles,
            last_message_time: vendorsMap[id].last_message_time,
          }
        : null;
    });

    // Resolve all queries
    const usersInfo = await Promise.all(userQueries);
    const vendorsInfo = await Promise.all(vendorQueries);

    const filteredUsers = usersInfo.filter((user) => user !== null);
    const filteredVendors = vendorsInfo.filter((vendor) => vendor !== null);

    // Final sorting based on last message time (latest first)
    const sortedUsers = filteredUsers.sort(
      (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
    );
    const sortedVendors = filteredVendors.sort(
      (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
    );

    res.status(200).json({
      success: true,
      message: "Sender user, vendor, and associated vehicle details retrieved",
      users: sortedUsers,
      vendors: sortedVendors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client,
});

app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const response = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: "Uploaded via React App",
          description: "This is an auto-uploaded video",
        },
        status: {
          privacyStatus: "public",
        },
      },
      media: {
        body: fs.createReadStream(filePath),
      },
    });

    fs.unlinkSync(filePath); // Temporary file delete

    const videoId = response.data.id;
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    res.json({ embedUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload video" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
