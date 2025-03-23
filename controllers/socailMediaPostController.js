const db = require("../config/db");
require("dotenv").config();
const axios = require("axios");

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.PAGE_ID;

exports.postToFacebook = async (req, res) => {
  try {
    const { id } = req.params;

    const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [
      id,
    ]);

    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const { make, model, trim, year_of_manufacture, thumbnail_image } =
      vehicles[0];

    const message = `${year_of_manufacture} ${make} ${model} ${trim}, See more details: https://dev.garirhat.com/car-details/${id}`;

    const url = `https://graph.facebook.com/v19.0/${PAGE_ID}/photos`;
    const response = await axios.post(url, {
      url: thumbnail_image,
      message: message,
      access_token: PAGE_ACCESS_TOKEN,
    });

    await db.query(`UPDATE vehicles SET is_post_fb=? WHERE id = ?`, [1, id]);

    res.status(200).send({
      success: true,
      message: "Gari Post On Facebook Successfully",
      post_id: response.data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error occurred while posting to Facebook",
      error: error.response ? error.response.data : error.message,
    });
  }
};

exports.sherePost = async (req, res) => {
  try {
    const { id } = req.params;

    const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [
      id,
    ]);

    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const { make, model, trim, year_of_manufacture, thumbnail_image } =
      vehicles[0];

    // dynamic html render
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta property="og:title" content="${make} ${model} ${trim} (${year_of_manufacture})" />
        <meta property="og:description" content="Checkout this amazing ${make} ${model} from ${year_of_manufacture}!" />
        <meta property="og:image" content="${thumbnail_image}" />
        <meta property="og:url" content="https://dev.garirhat.com/share/${id}" />
        <meta property="og:type" content="website" />
        <meta http-equiv="refresh" content="0;url=https://dev.garirhat.com/car-details/${id}" />
        <title>${make} ${model} Share</title>
      </head>
      <body>
        <p>Redirecting...</p>
      </body>
      </html>
    `;

    res.status(200).send(html);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
