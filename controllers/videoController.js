const db = require("../config/db");
const youtube = require("../config/googleAuth");
const fs = require("fs");

// youtube Url post
exports.youtubeUrlPost = async (req, res) => {
  try {
    const { user, make, model, year, trim, videoUrl } = req.body;

    if (!user || !make || !model || !videoUrl) {
      return res.status(201).send({
        success: false,
        message: "user, make, model, videoUrl is requied in body",
      });
    }

    let videoId = "";
    if (videoUrl.includes("youtube.com/watch")) {
      const urlParams = new URL(videoUrl);
      videoId = urlParams.searchParams.get("v");
    } else if (videoUrl.includes("youtu.be/")) {
      videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
    }

    if (!videoId) {
      return res.status(200).send({
        success: true,
        message: "Invalid YouTube URL",
      });
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    const query =
      "INSERT INTO youtube_videos (user, make, model, year, trim, embedUrl) VALUES (?, ?, ?, ?, ?, ?)";
    user, make, model, videoUrl;
    const values = [user, make, model, year || 0, trim || "", embedUrl];

    const [result] = await db.query(query, values);

    res.status(200).send({
      success: true,
      message: "youtube Url post ",
      url: embedUrl,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// upload video
exports.uploadVideo = async (req, res) => {
  try {
    const filePath = req.file.path;

    const { title, description, tags, privacyStatus } = req.body;

    const response = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: title || "Default Title",
          description: description || "No description provided",
          tags: tags ? tags.split(",") : [],
          categoryId: "22", //
        },
        status: {
          privacyStatus: privacyStatus || "public",
        },
      },
      media: {
        body: fs.createReadStream(filePath),
      },
    });

    fs.unlinkSync(filePath);

    const videoId = response.data.id;
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    res.status(200).json({
      success: true,
      message: "Video Upload successfully",
      url: embedUrl,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all Videos with pagination, filtering, and search
exports.getAllVideos = async (req, res) => {
  try {
    const { page = 1, limit = 20, make, model, year, trim, status } = req.query;

    // Calculate the offset for pagination
    const offset = (page - 1) * limit;

    // Build the base SQL query
    let query = "SELECT * FROM youtube_videos";
    let conditions = [];
    let queryParams = [];

    if (make) {
      conditions.push("make = ?");
      queryParams.push(make);
    }

    if (model) {
      conditions.push("model = ?");
      queryParams.push(model);
    }

    if (year) {
      conditions.push("year = ?");
      queryParams.push(year);
    }

    if (trim) {
      conditions.push("trim = ?");
      queryParams.push(trim);
    }

    if (status) {
      conditions.push("status = ?");
      queryParams.push(status);
    }

    // Add conditions to the query if any
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // Add ordering and pagination
    query += " ORDER BY id DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    // Execute the query
    const [videos] = await db.query(query, queryParams);

    // Get the total count of videos (without pagination)
    let countQuery = "SELECT COUNT(*) as total FROM youtube_videos";
    if (conditions.length > 0) {
      countQuery += " WHERE " + conditions.join(" AND ");
    }
    const [countResult] = await db.query(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;

    // Send response with the structured order data
    res.status(200).send({
      success: true,
      message: "Get all videos",
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: videos,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All videos",
      error: error.message,
    });
  }
};

// Get Single Vehicle by ID
exports.getSingleVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await db.query("SELECT * FROM youtube_videos WHERE id = ?", [
      id,
    ]);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Get Single Video",
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching Video",
      error: error.message,
    });
  }
};

// update Video status
exports.updateVideoStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { status } = req.body;

    const [data] = await db.query(
      "SELECT id, status FROM youtube_videos WHERE id = ?",
      [id]
    );

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
        data: [],
      });
    }

    // Update the Videos data in the database
    await db.query(`UPDATE youtube_videos SET status=? WHERE id = ?`, [
      status || data[0].status,
      id,
    ]);

    return res.status(200).json({
      success: true,
      message: "Video Status Updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// delete vehicles
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicleID = req.params.id;

    const [data] = await db.query(`SELECT * FROM vehicles WHERE id=?`, [
      vehicleID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No vehicle found",
      });
    }

    const thumbnailImage = path.basename(data[0].thumbnail_image);
    const thumbnailImagePath = path.join(
      __dirname,
      "..",
      "public",
      "images",
      thumbnailImage
    );
    if (fs.existsSync(thumbnailImagePath)) {
      fs.unlinkSync(thumbnailImagePath);
    }

    const [images] = await db.query(
      `SELECT image_url FROM vehicle_images WHERE vehicle_id=?`,
      [vehicleID]
    );

    images.forEach((img) => {
      if (!img.image_url) return;
      const imageFileName = path.basename(img.image_url);
      const imagePath = path.join(
        __dirname,
        "..",
        "public",
        "images",
        imageFileName
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    await db.query(`DELETE FROM vehicle_images WHERE vehicle_id=?`, [
      vehicleID,
    ]);
    await db.query(`DELETE FROM vehicle_features WHERE vehicle_id=?`, [
      vehicleID,
    ]);
    await db.query(`DELETE FROM vehicle_pricing WHERE vehicle_id=?`, [
      vehicleID,
    ]);

    await db.query(`DELETE FROM vehicles WHERE id=?`, [vehicleID]);
    res.status(200).send({
      success: true,
      message: "Vehicle Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Vehicle",
      error: error.message,
    });
  }
};
