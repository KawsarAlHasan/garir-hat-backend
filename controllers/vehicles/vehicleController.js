const db = require("../../config/db");
const fs = require("fs");
const path = require("path");

// Create new vehicle
exports.createNewVehicle = async (req, res) => {
  try {
    const {
      make,
      model,
      year_of_manufacture,
      mileage,
      fuel_type,
      transmission,
      body_type,
      seating_capacity,
      doors,
      engine_capacity_cc,
      fuel_efficiency_kmpl,
      drive_type,
      color,
      interior_color,
      description,
      vehicle_condition,
      registration_number,
      registration_year,
      rtn,
      power,
      cabin_size,
      trunk_size,
      top_speed,
      vin_number,
      trim,
      division,
      district,
      upzila,
      city,
      discount_price,
      is_post_fb_req,
      features,
      prices,
    } = req.body;

    const postFacebook = is_post_fb_req == "true" ? 1 : 0;

    const yearOfManufacture = new Date(year_of_manufacture).getUTCFullYear();

    const parsedFeatures = features ? JSON.parse(features) : [];
    const parsedPrices = prices ? JSON.parse(prices) : [];

    const busn_id = req.decodedVendor.busn_id;

    // Ensure all required fields are present
    if (!make || !model || !prices) {
      return res.status(400).json({
        success: false,
        message: "Missing make, model, prices required fields",
      });
    }

    // Generate a unique vehicle code
    async function generateUniqueVehicleCode(length) {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

      function generateRandomCode(length) {
        let result = "";
        for (let i = 0; i < length; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return result;
      }

      let uniqueCode;
      let existing;

      do {
        uniqueCode = generateRandomCode(length);
        const [rows] = await db.query(
          "SELECT COUNT(*) AS count FROM vehicles WHERE vehicle_code = ?",
          [uniqueCode]
        );
        existing = rows[0];
      } while (existing.count > 0);

      return uniqueCode;
    }

    let thumbnailUrl = "";
    if (
      req.files &&
      req.files.thumbnail_image &&
      req.files.thumbnail_image.length > 0
    ) {
      thumbnailUrl = `https://api.garirhat.com/public/images/${req.files.thumbnail_image[0].filename}`;
    }

    // Generate unique vehicle code
    const vehicle_code = await generateUniqueVehicleCode(4);

    const query = `
      INSERT INTO vehicles (
        vehicle_code, busn_id, thumbnail_image, price, discount_price, make, model, year_of_manufacture, mileage, fuel_type,
        transmission, body_type, seating_capacity, doors, engine_capacity_cc,
        fuel_efficiency_kmpl, drive_type, color, 	interior_color, description, vehicle_condition,
        registration_number, registration_year, rtn, power, cabin_size, trunk_size,
        top_speed, vin_number, trim, division, district, upzila, city, is_post_fb_req
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let totalPrice = parsedPrices.reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0
    );

    const values = [
      vehicle_code,
      busn_id,
      thumbnailUrl,
      totalPrice,
      discount_price || 0,
      make,
      model,
      yearOfManufacture || "",
      mileage || "",
      fuel_type || "",
      transmission || "",
      body_type || "",
      seating_capacity || "",
      doors || "",
      engine_capacity_cc || "",
      fuel_efficiency_kmpl || "",
      drive_type || "",
      color || "",
      interior_color || "",
      description || "",
      vehicle_condition || "",
      registration_number || "",
      registration_year || "",
      rtn || "",
      power || "",
      cabin_size || "",
      trunk_size || "",
      top_speed || "",
      vin_number || "",
      trim || "",
      division || "",
      district || "",
      upzila || "",
      city || "",
      postFacebook,
    ];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to insert vehicle, please try again",
      });
    }

    const vehicle_id = result.insertId;

    const pricingQuery = `INSERT INTO vehicle_pricing (vehicle_id, reason, amount) VALUES ?`;
    const pricingValues = parsedPrices.map((p) => [
      vehicle_id,
      p.reason,
      p.amount,
    ]);

    await db.query(pricingQuery, [pricingValues]);

    if (req.files && req.files.images && req.files.images.length > 0) {
      const imageInsertQuery = `
        INSERT INTO vehicle_images (vehicle_id, image_url) VALUES ?
      `;

      const imageValues = req.files.images.map((file) => [
        vehicle_id,
        `https://api.garirhat.com/public/images/${file.filename}`,
      ]);

      await db.query(imageInsertQuery, [imageValues]);
    }

    if (Array.isArray(parsedFeatures) && parsedFeatures.length > 0) {
      const featureQuery =
        "INSERT INTO vehicle_features (vehicle_id, 	feature_id) VALUES ?";
      const featureValues = parsedFeatures.map((feature) => [
        vehicle_id,
        feature.id,
      ]);
      await db.query(featureQuery, [featureValues]);
    }

    return res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle_id: result.insertId,
      vehicle_code: vehicle_code,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all vehicle with filter Flutter
exports.getAllVehiclesForFlutter = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      start_price,
      end_price,
      start_year_of_manufacture,
      end_year_of_manufacture,
      start_mileage,
      end_mileage,
      start_discount_price,
      end_discount_price,
      sort = "id",
      order = "ASC",
      ...filters
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let baseQuery = "FROM vehicles WHERE 1=1";
    let params = [];

    // price
    if (start_price) {
      baseQuery += " AND price >= ?";
      params.push(parseFloat(start_price));
    }
    if (end_price) {
      baseQuery += " AND price <= ?";
      params.push(parseFloat(end_price));
    }

    // year_of_manufacture
    if (start_year_of_manufacture) {
      baseQuery += " AND year_of_manufacture >= ?";
      params.push(parseFloat(start_year_of_manufacture));
    }
    if (end_year_of_manufacture) {
      baseQuery += " AND year_of_manufacture <= ?";
      params.push(parseFloat(end_year_of_manufacture));
    }

    // mileage
    if (start_mileage) {
      baseQuery += " AND mileage >= ?";
      params.push(parseFloat(start_mileage));
    }
    if (end_mileage) {
      baseQuery += " AND mileage <= ?";
      params.push(parseFloat(end_mileage));
    }

    // mileage
    if (start_discount_price) {
      baseQuery += " AND discount_price >= ?";
      params.push(parseFloat(start_discount_price));
    }
    if (end_discount_price) {
      baseQuery += " AND discount_price <= ?";
      params.push(parseFloat(end_discount_price));
    }

    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        if (Array.isArray(filters[key])) {
          const placeholders = filters[key].map(() => "?").join(",");
          baseQuery += ` AND ${key} IN (${placeholders})`;
          params.push(...filters[key]);
        } else {
          baseQuery += ` AND ${key} = ?`;
          params.push(filters[key]);
        }
      }
    });

    // Allowlist (safe fields for sorting)
    const allowedSortFields = [
      "id",
      "price",
      "make",
      "model",
      "year_of_manufacture",
      "mileage",
    ];
    const sortField = allowedSortFields.includes(sort) ? sort : "id";

    // Validate order (ASC or DESC)
    const orderType = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

    // count totaal vehicle
    const countQuery = `SELECT COUNT(*) AS total ${baseQuery}`;
    const [[{ total: totalVehicles }]] = await db.query(countQuery, params);

    if (totalVehicles === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No vehicles found", data: [] });
    }

    const vehicleQuery = `SELECT id, vehicle_code, busn_id, thumbnail_image, price, discount_price, make, model, year_of_manufacture, mileage, fuel_type, transmission, body_type, vehicle_condition, division, district, upzila, city, trim, created_at ${baseQuery} ORDER BY ${sortField} ${orderType} LIMIT ? OFFSET ?`;
    const vehicleParams = [...params, parseInt(limit), offset];
    const [vehicles] = await db.query(vehicleQuery, vehicleParams);

    for (const singleVehicle of vehicles) {
      const modelName = singleVehicle.model;

      const [model] = await db.query(
        "SELECT id, total_rating, average_rating FROM vehicles_model WHERE model_name=?",
        [modelName]
      );

      if (model.length > 0) {
        singleVehicle.model_total_rating = model[0].total_rating;
        singleVehicle.model_average_rating = model[0].average_rating;
      } else {
        singleVehicle.model_total_rating = 0;
        singleVehicle.model_average_rating = 0;
      }
    }

    res.status(200).json({
      success: true,
      message: "All vehicles",
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalVehicles / parseInt(limit)),
      totalVehicles,
      data: vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in Get All Vehicles",
      error: error.message,
    });
  }
};

// get all vehicle brand name
exports.getAllMakeNameForSingleVendor = async (req, res) => {
  try {
    const { busn_id } = req.params;
    const [vehicles] = await db.execute(
      "SELECT make FROM vehicles WHERE busn_id=? GROUP BY make",
      [busn_id]
    );

    res.status(200).json({
      success: true,
      message: "All vehicles",
      data: vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in Get All Vehicles",
      error: error.message,
    });
  }
};

// get all vehicle with filter Web
exports.getAllVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      start_price,
      end_price,
      start_year_of_manufacture,
      end_year_of_manufacture,
      start_mileage,
      end_mileage,
      start_discount_price,
      end_discount_price,
      sort = "id",
      order = "ASC",
      ...filters
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let baseQuery = "FROM vehicles WHERE 1=1";
    let params = [];

    // price
    if (start_price) {
      baseQuery += " AND price >= ?";
      params.push(parseFloat(start_price));
    }
    if (end_price) {
      baseQuery += " AND price <= ?";
      params.push(parseFloat(end_price));
    }

    // year_of_manufacture
    if (start_year_of_manufacture) {
      baseQuery += " AND year_of_manufacture >= ?";
      params.push(parseFloat(start_year_of_manufacture));
    }
    if (end_year_of_manufacture) {
      baseQuery += " AND year_of_manufacture <= ?";
      params.push(parseFloat(end_year_of_manufacture));
    }

    // mileage
    if (start_mileage) {
      baseQuery += " AND mileage >= ?";
      params.push(parseFloat(start_mileage));
    }
    if (end_mileage) {
      baseQuery += " AND mileage <= ?";
      params.push(parseFloat(end_mileage));
    }

    // mileage
    if (start_discount_price) {
      baseQuery += " AND discount_price >= ?";
      params.push(parseFloat(start_discount_price));
    }
    if (end_discount_price) {
      baseQuery += " AND discount_price <= ?";
      params.push(parseFloat(end_discount_price));
    }

    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        if (Array.isArray(filters[key])) {
          const placeholders = filters[key].map(() => "?").join(",");
          baseQuery += ` AND ${key} IN (${placeholders})`;
          params.push(...filters[key]);
        } else {
          baseQuery += ` AND ${key} = ?`;
          params.push(filters[key]);
        }
      }
    });

    // Allowlist (safe fields for sorting)
    const allowedSortFields = [
      "id",
      "price",
      "make",
      "model",
      "year_of_manufacture",
      "mileage",
    ];
    const sortField = allowedSortFields.includes(sort) ? sort : "id";

    // Validate order (ASC or DESC)
    const orderType = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

    // count totaal vehicle
    const countQuery = `SELECT COUNT(*) AS total ${baseQuery}`;
    const [[{ total: totalVehicles }]] = await db.query(countQuery, params);

    if (totalVehicles === 0) {
      return res.status(201).json({
        success: false,
        message: "No vehicles found",
        data: [],
      });
    }

    // Fetch vehicles with sorting
    const vehicleQuery = `SELECT id, vehicle_code, busn_id, thumbnail_image, price, discount_price, make, model, year_of_manufacture, mileage, fuel_type, transmission, division, district, upzila, city, trim ${baseQuery} ORDER BY ${sortField} ${orderType} LIMIT ? OFFSET ?`;
    const vehicleParams = [...params, parseInt(limit), offset];
    const [vehicles] = await db.query(vehicleQuery, vehicleParams);

    res.status(200).json({
      success: true,
      message: "All vehicles",
      pagination: {
        total: totalVehicles,
        page: parseInt(page),
        limit: limit,
        totalPages: Math.ceil(totalVehicles / parseInt(limit)),
      },
      data: vehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in Get All Vehicles",
      error: error.message,
    });
  }
};

// Get Single Vehicle by ID
exports.getSingleVehicleWithId = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicleQuery = "SELECT * FROM vehicles WHERE id = ?";
    const [vehicles] = await db.query(vehicleQuery, [id]);

    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    let vehicle = vehicles[0];

    // images
    const [images] = await db.query(
      "SELECT image_url FROM vehicle_images WHERE vehicle_id = ?",
      [vehicle.id]
    );
    vehicle.images = [
      vehicle.thumbnail_image,
      ...images.map((img) => img.image_url),
    ];

    // feature
    const [featureCategory] = await db.execute(
      "SELECT * FROM feature_category"
    );

    // Get features for the specific vehicle
    const featureQuery = `
              SELECT
                  f.id AS feature_id,
                  f.feature_name,
                  f.category_id
              FROM vehicle_features vf
              JOIN features f ON vf.feature_id = f.id
              WHERE vf.vehicle_id = ?;
          `;

    const [features] = await db.query(featureQuery, [id]);

    // Map features to their respective categories
    for (const category of featureCategory) {
      category.feature = features
        .filter((f) => f.category_id === category.id)
        .map((f) => ({
          id: f.feature_id,
          feature_name: f.feature_name,
        }));
    }

    // Assign features to the vehicle
    vehicle.features = featureCategory;

    // price
    const [pricing] = await db.query(
      "SELECT * FROM vehicle_pricing WHERE vehicle_id = ?",
      [vehicle.id]
    );
    vehicle.pricing = pricing.map((f) => f);

    // rating
    const [model] = await db.query(
      "SELECT id, total_rating, average_rating FROM vehicles_model WHERE model_name=?",
      [vehicle.model]
    );

    if (model.length > 0) {
      const [rating] = await db.query(
        `
    SELECT r.*,
     u.name,
     u.profile_pic
    FROM rating r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.model_id=?
    `,
        [model[0].id]
      );
      vehicle.model_total_rating = model[0].total_rating;
      vehicle.model_average_rating = model[0].average_rating;
      vehicle.ratings = rating;
    } else {
      vehicle.model_total_rating = 0;
      vehicle.model_average_rating = 0;
      vehicle.ratings = [];
    }

    res.status(200).json({
      success: true,
      message: "Get Single Vehicle",
      data: vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching vehicle",
      error: error.message,
    });
  }
};

// update vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const busn_id = req.decodedVendor.busn_id;

    const {
      make,
      model,
      year_of_manufacture,
      mileage,
      fuel_type,
      transmission,
      body_type,
      seating_capacity,
      doors,
      engine_capacity_cc,
      fuel_efficiency_kmpl,
      drive_type,
      color,
      interior_color,
      description,
      vehicle_condition,
      registration_number,
      registration_year,
      rtn,
      power,
      cabin_size,
      trunk_size,
      top_speed,
      vin_number,
      trim,
      division,
      district,
      upzila,
      city,
      discount_price,
      features,
      prices,
    } = req.body;

    const [preVehicles] = await db.query(
      "SELECT * FROM vehicles WHERE id = ? AND busn_id=?",
      [id, busn_id]
    );

    if (preVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
        data: [],
      });
    }

    let vehicle = preVehicles[0];

    let thumbnailUrl = vehicle.thumbnail_image;
    if (
      req.files &&
      req.files.thumbnail_image &&
      req.files.thumbnail_image.length > 0
    ) {
      const thumbnailImage = path.basename(vehicle.thumbnail_image);
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
      thumbnailUrl = `https://api.garirhat.com/public/images/${req.files.thumbnail_image[0].filename}`;
    }

    let totalPrice = prices.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    // Update the vehicles data in the database
    await db.query(
      `UPDATE vehicles SET thumbnail_image=?, price=?, discount_price=?, make=?, model=?, year_of_manufacture=?, mileage=?, fuel_type=?, transmission=?, body_type=?, seating_capacity=?, doors=?, engine_capacity_cc=?, fuel_efficiency_kmpl=?, drive_type=?, color=?, interior_color?, description=?, vehicle_condition=?, registration_number=?, registration_year=?, rtn=?, power=?, cabin_size=?, trunk_size=?, top_speed=?, vin_number=?, trim=?, division=?, district=?, upzila=?, city=? WHERE id = ?`,
      [
        thumbnailUrl,
        totalPrice || vehicle.price,
        discount_price || vehicle.discount_price,
        make || vehicle.make,
        model || vehicle.model,
        year_of_manufacture || vehicle.year_of_manufacture,
        mileage || vehicle.mileage,
        fuel_type || vehicle.fuel_type,
        transmission || vehicle.transmission,
        body_type || vehicle.body_type,
        seating_capacity || vehicle.seating_capacity,
        doors || vehicle.doors,
        engine_capacity_cc || vehicle.engine_capacity_cc,
        fuel_efficiency_kmpl || vehicle.fuel_efficiency_kmpl,
        drive_type || vehicle.drive_type,
        color || vehicle.color,
        interior_color || vehicle.interior_color,
        description || vehicle.description,
        vehicle_condition || vehicle.vehicle_condition,
        registration_number || vehicle.registration_number,
        registration_year || vehicle.registration_year,
        rtn || vehicle.rtn,
        power || vehicle.power,
        cabin_size || vehicle.cabin_size,
        trunk_size || vehicle.trunk_size,
        top_speed || vehicle.top_speed,
        vin_number || vehicle.vin_number,
        trim || vehicle.trim,
        division || vehicle.division,
        district || vehicle.district,
        upzila || vehicle.upzila,
        city || vehicle.city,
        id,
      ]
    );

    await db.query(`DELETE FROM vehicle_pricing WHERE vehicle_id=?`, [id]);

    const pricingQuery = `INSERT INTO vehicle_pricing (vehicle_id, reason, amount) VALUES ?`;
    const pricingValues = prices.map((p) => [id, p.reason, p.amount]);

    await db.query(pricingQuery, [pricingValues]);

    if (req.files && req.files.images && req.files.images.length > 0) {
      const [images] = await db.query(
        `SELECT image_url FROM vehicle_images WHERE vehicle_id=?`,
        [id]
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

      await db.query(`DELETE FROM vehicle_images WHERE vehicle_id=?`, [id]);

      const imageInsertQuery = `
        INSERT INTO vehicle_images (vehicle_id, image_url) VALUES ?
      `;

      const imageValues = req.files.images.map((file) => [
        id,
        `https://api.garirhat.com/public/images/${file.filename}`,
      ]);

      await db.query(imageInsertQuery, [imageValues]);
    }

    if (features && features.length > 0) {
      await db.query(`DELETE FROM vehicle_features WHERE vehicle_id=?`, [id]);

      const featureQuery =
        "INSERT INTO vehicle_features (vehicle_id, 	feature_id) VALUES ?";
      const featureValues = parsedFeatures.map((feature) => [id, feature.id]);
      await db.query(featureQuery, [featureValues]);
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle Updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update vehicle status
exports.updateVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    // const vendor_id = req.decodedVendor.id;

    const { status } = req.body;

    // const [preVehicles] = await db.query(
    //   "SELECT * FROM vehicles WHERE id = ? AND vendor_id=?",
    //   [id, vendor_id]
    // );
    const [preVehicles] = await db.query(
      "SELECT * FROM vehicles WHERE id = ?",
      [id]
    );

    if (preVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
        data: [],
      });
    }

    let vehicle = preVehicles[0];

    // Update the vehicles data in the database
    await db.query(`UPDATE vehicles SET status=? WHERE id = ?`, [
      status || vehicle.status,
      id,
    ]);

    return res.status(200).json({
      success: true,
      message: "Vehicle Status Updated successfully",
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
