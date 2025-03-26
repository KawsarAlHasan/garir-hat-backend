const db = require("../config/db");

// get WishList
exports.getMyWishList = async (req, res) => {
  try {
    const { user_id } = req.query;

    const [data] = await db.query(
      `SELECT 
        w.id AS wishlist_id, 
        v.id AS vehicle_id, 
        v.vehicle_code, 
        v.busn_id, 
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
        v.city
       FROM wishlist w
       LEFT JOIN vehicles v ON w.vehicle_id = v.id
       WHERE w.user_id = ?`,
      [user_id]
    );

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Wish List Vehicle found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "Wish List Vehicle",
      totalFeature: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get Wish List Vehicle",
      error: error.message,
    });
  }
};

// added AND remove WishList
exports.addedAndRemoveWishList = async (req, res) => {
  try {
    const { user_id, vehicle_id } = req.body;

    if (!user_id || !vehicle_id) {
      return res.status(400).send({
        success: false,
        message: "Please user_id, vehicle_id required fields",
      });
    }

    // Chack Duplicate entry
    const [checkData] = await db.query(
      `SELECT * FROM wishlist WHERE user_id=? AND vehicle_id=?`,
      [user_id, vehicle_id]
    );

    if (checkData.length > 0) {
      const wishListID = checkData[0].id;
      await db.query(`DELETE FROM wishlist WHERE id=?`, [wishListID]);
      res.status(200).send({
        success: true,
        message: "Vehicle Deleted Successfully in my wishlist",
      });
    } else {
      const query = "INSERT INTO wishlist (user_id, vehicle_id) VALUES (?, ?)";
      const values = [user_id, vehicle_id];
      const [result] = await db.query(query, values);

      if (result.affectedRows === 0) {
        return res.status(500).send({
          success: false,
          message: "Failed to insert vehicle in wishlist, please try again",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Vehicle added successfully in wishlist",
      });
    }
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// delete WishList
exports.deleteWishList = async (req, res) => {
  try {
    const wishListID = req.params.id;

    const [data] = await db.query(`SELECT id FROM wishlist WHERE id=? `, [
      wishListID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No data found",
      });
    }
    await db.query(`DELETE FROM wishlist WHERE id=?`, [wishListID]);
    res.status(200).send({
      success: true,
      message: "Vehicle Deleted Successfully in my wishlist",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Vehicle in my wishlist",
      error: error.message,
    });
  }
};

// delete my all WishList
exports.deleteMyAllWishList = async (req, res) => {
  try {
    const user_id = req.params.id;

    const [data] = await db.query(`SELECT id FROM wishlist WHERE user_id=? `, [
      user_id,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No data found",
      });
    }
    await db.query(`DELETE FROM wishlist WHERE user_id=?`, [user_id]);
    res.status(200).send({
      success: true,
      message: "All Vehicle Deleted Successfully in my wishlist",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Vehicle in my wishlist",
      error: error.message,
    });
  }
};
