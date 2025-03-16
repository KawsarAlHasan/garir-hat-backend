const db = require("../config/db");

// create rating
exports.createRating = async (req, res) => {
  try {
    const { model_id, title, experience, rating, parts_rating } = req.body;
    const user_id = req.decodedUser.id;

    // const parsedPartsRating = parts_rating ? JSON.parse(parts_rating) : [];
    const parsedPartsRating = parts_rating ? parts_rating : [];

    if (!model_id || !rating) {
      return res.status(400).send({
        success: false,
        message: "Please provide model_id & rating required fields",
      });
    }

    const [result] = await db.query(
      "INSERT INTO rating (user_id, model_id, title, experience, rating) VALUES (?, ?, ?, ?, ?)",
      [user_id, model_id, title || "", experience || "", rating]
    );

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert rating, please try again",
      });
    }

    if (Array.isArray(parsedPartsRating) && parsedPartsRating.length > 0) {
      const partsNameQuery =
        "INSERT INTO parts_name_rating (rating_id, parts_name_id, rating) VALUES ?";
      const partsNameValues = parsedPartsRating.map((partName) => [
        result.insertId,
        partName.parts_name_id,
        partName.parts_name_rating,
      ]);
      await db.query(partsNameQuery, [partsNameValues]);
    }

    // total and avarage rating
    const [vehiclesModel] = await db.query(
      "SELECT average_rating, total_rating FROM vehicles_model WHERE id=?",
      [model_id]
    );

    const { average_rating, total_rating } = vehiclesModel[0];

    const score = parseFloat(average_rating) * parseFloat(total_rating);
    const totalScore = score + parseFloat(rating);
    const totalRating = parseFloat(total_rating) + 1;
    const averageRating = totalScore / totalRating;

    await db.query(
      `UPDATE vehicles_model SET average_rating=?, total_rating=? WHERE id=?`,
      [averageRating, totalRating, model_id]
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
          vm.id AS model_id,
        vm.brand_id, 
        vm.model_name, 
        vm.total_rating, 
        vm.average_rating, 
          r.id AS rating_id, r.user_id, r.model_id, r.title, r.experience, r.rating, r.is_edit, r.created_at, r.updated_at
         FROM rating r
         LEFT JOIN vehicles_model vm ON r.model_id = vm.id
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
      id: item.model_id,
      brand_id: item.brand_id,
      model_name: item.model_name,
      total_rating: item.total_rating,
      average_rating: item.average_rating,
      status: item.status,
      my_rating: {
        id: item.rating_id,
        user_id: item.user_id,
        model_id: item.model_id,
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
    const { title, experience, rating, parts_rating } = req.body;
    const user_id = req.decodedUser.id;

    // const parsedPartsRating = parts_rating ? JSON.parse(parts_rating) : [];
    const parsedPartsRating = parts_rating ? parts_rating : [];

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
    const model_id = existingRating[0].model_id;

    const [vehiclesModel] = await db.query(
      "SELECT average_rating, total_rating FROM vehicles_model WHERE id=?",
      [model_id]
    );

    if (!vehiclesModel || vehiclesModel.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Vehicle not found",
      });
    }

    const { average_rating, total_rating } = vehiclesModel[0];

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

    if (Array.isArray(parsedPartsRating) && parsedPartsRating.length > 0) {
      await db.query(`DELETE FROM parts_name_rating WHERE rating_id=?`, [id]);

      const partsNameQuery =
        "INSERT INTO parts_name_rating (rating_id, parts_name_id, rating) VALUES ?";
      const partsNameValues = parsedPartsRating.map((partName) => [
        id,
        partName.parts_name_id,
        partName.parts_name_rating,
      ]);
      await db.query(partsNameQuery, [partsNameValues]);
    }

    await db.query("UPDATE vehicles_model SET average_rating=? WHERE id=?", [
      averageRating,
      model_id,
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
    const [vehiclesModel] = await db.query(
      "SELECT average_rating, total_rating FROM vehicles_model WHERE id=?",
      [data[0].model_id]
    );

    const { average_rating, total_rating } = vehiclesModel[0];

    const score = average_rating * total_rating;
    const totalScore = score - data[0].rating;
    const totalRating = total_rating - 1;
    const averageRating = totalScore / totalRating;

    await db.query(
      `UPDATE vehicles_model SET average_rating=?, total_rating=? WHERE id=?`,
      [averageRating, totalRating, data[0].model_id]
    );

    await db.query(`DELETE FROM parts_name_rating WHERE rating_id=?`, [id]);
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
