const db = require("../config/db");

// create rating
exports.createRating = async (req, res) => {
  try {
    const { vehicle_id, title, experience, rating } = req.body;
    const user_id = req.decodedUser.id;

    if (!vehicle_id || !rating) {
      return res.status(400).send({
        success: false,
        message: "Please provide vehicle_id & rating required fields",
      });
    }

    const [result] = await db.query(
      "INSERT INTO rating (user_id, vehicle_id, title, experience, rating) VALUES (?, ?, ?, ?, ?)",
      [user_id, vehicle_id, title || "", experience || "", rating]
    );

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert rating, please try again",
      });
    }

    // total and avarage rating
    const [vehicles] = await db.query(
      "SELECT average_rating, total_rating FROM vehicles WHERE id=?",
      [vehicle_id]
    );

    const { average_rating, total_rating } = vehicles[0];

    const score = average_rating * total_rating;
    const totalScore = score + rating;
    const totalRating = total_rating + 1;
    const averageRating = totalScore / totalRating;

    await db.query(
      `UPDATE vehicles SET average_rating=?, total_rating=? WHERE id=?`,
      [averageRating, totalRating, vehicle_id]
    );

    return res.status(200).json({
      success: true,
      message: "Rating added successfully",
      ratingID: result.insertId,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get my rating
exports.getMyRating = async (req, res) => {
  try {
    const user_id = req.decodedUser.id;

    const [data] = await db.query(
      `SELECT 
          v.id AS vehicle_id,
        v.vehicle_code, 
        v.vendor_id, 
        v.thumbnail_image, 
        v.price, 
        v.discount_price, 
        v.make, 
        v.model, 
        v.year_of_manufacture, 
        v.mileage, 
        v.fuel_type, 
        v.transmission, 
        v.division, 
        v.district, 
        v.upzila, 
        v.city,
          r.id AS rating_id, r.user_id, r.vehicle_id, r.title, r.experience, r.rating, r.is_edit, r.created_at, r.updated_at
         FROM rating r
         LEFT JOIN vehicles v ON r.vehicle_id = v.id
         WHERE r.user_id=?`,
      [user_id]
    );

    if (!data || data.length === 0) {
      return res.status(400).send({
        success: true,
        message: "No Data found",
        data: [],
      });
    }

    const formattedData = data.map((item) => ({
      id: item.vehicle_id,
      vehicle_code: item.vehicle_code,
      vendor_id: item.vendor_id,
      thumbnail_image: item.thumbnail_image,
      price: item.price,
      discount_price: item.discount_price,
      make: item.make,
      model: item.model,
      year_of_manufacture: item.year_of_manufacture,
      mileage: item.mileage,
      fuel_type: item.fuel_type,
      transmission: item.transmission,
      division: item.division,
      district: item.district,
      upzila: item.upzila,
      city: item.city,
      my_rating: {
        id: item.rating_id,
        user_id: item.user_id,
        vehicle_id: item.vehicle_id,
        title: item.title,
        experience: item.experience,
        rating: item.rating,
        is_edit: item.is_edit,
        created_at: item.created_at,
        updated_at: item.updated_at,
      },
    }));

    res.status(200).send({
      success: true,
      message: "Get My Rating",
      total: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get My Rating",
      error: error.message,
    });
  }
};

// update rating
exports.updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, experience, rating } = req.body;
    const user_id = req.decodedUser.id;

    const [existingRating] = await db.query(
      "SELECT * FROM rating WHERE id=? AND user_id=?",
      [id, user_id]
    );

    if (!existingRating || existingRating.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Rating not found or unauthorized",
      });
    }

    const oldRating = existingRating[0].rating;
    const newRating = rating ? rating : existingRating[0].rating;
    const vehicle_id = existingRating[0].vehicle_id;

    const [vehicles] = await db.query(
      "SELECT average_rating, total_rating FROM vehicles WHERE id=?",
      [vehicle_id]
    );

    if (!vehicles || vehicles.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Vehicle not found",
      });
    }

    const { average_rating, total_rating } = vehicles[0];

    const score = average_rating * total_rating;
    const newTotalScore = score - oldRating + newRating;
    const averageRating = newTotalScore / total_rating;

    await db.query(
      "UPDATE rating SET title=?, experience=?, rating=?, is_edit=? WHERE id=?",
      [
        title || existingRating[0].title,
        experience || existingRating[0].experience,
        rating,
        1,
        id,
      ]
    );

    await db.query("UPDATE vehicles SET average_rating=? WHERE id=?", [
      averageRating,
      vehicle_id,
    ]);

    return res.status(200).json({
      success: true,
      message: "Rating updated successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error updating rating",
      error: error.message,
    });
  }
};

// delete rating
exports.deleteRating = async (req, res) => {
  try {
    const id = req.params.id;
    const user_id = req.decodedUser.id;

    // total and avarage rating
    const [data] = await db.query(
      "SELECT * FROM rating WHERE id=? AND user_id=?",
      [id, user_id]
    );

    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No data found",
      });
    }

    // total and avarage rating
    const [vehicles] = await db.query(
      "SELECT average_rating, total_rating FROM vehicles WHERE id=?",
      [data[0].vehicle_id]
    );

    const { average_rating, total_rating } = vehicles[0];

    const score = average_rating * total_rating;
    const totalScore = score - data[0].rating;
    const totalRating = total_rating - 1;
    const averageRating = totalScore / totalRating;

    await db.query(
      `UPDATE vehicles SET average_rating=?, total_rating=? WHERE id=?`,
      [averageRating, totalRating, data[0].vehicle_id]
    );

    await db.query(`DELETE FROM rating WHERE id=?`, [id]);
    res.status(200).send({
      success: true,
      message: "Rating Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Rating",
      error: error.message,
    });
  }
};
