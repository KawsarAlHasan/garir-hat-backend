// code:
// exports.getSingleVehicleWithId = async (req, res) => {
//     try {
//       const { id } = req.params;

//       const vehicleQuery = "SELECT * FROM vehicles WHERE id = ?";
//       const [vehicles] = await db.query(vehicleQuery, [id]);

//       res.status(200).json({
//         success: true,
//         message: "Get Single Vehicle",
//         data: vehicle,
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: "Error in fetching vehicle",
//         error: error.message,
//       });
//     }
//   };

// need result:
// {
//     "id": 1,
//     "name": "BMW",
//     "price": 30000,
//     "features":  [
//         {
//             "id": 1,
//             "name": "Others",
//             "feature": [
//                 {"id": 10, "feature_name": "All-Wheel Drive (AWD)",},
//                 {"id": 18, "feature_name": "Augmented Reality Head-Up Display (AR-HUD)",},
//                 {"id": 19, "feature_name": "Auto Hold Function",}
//             ]
//         },
//         {
//             "id": 2,
//             "name": "Comfort & Convenience",
//             "feature": [
//                 {"id": 2, "feature_name": "4-Zone Climate Control",},
//                 {"id": 5, "feature_name": "Adjustable Seats",}
//             ]
//         },
//         {
//             "id": 3,
//             "name": "Interior",
//             "feature": [
//                 {"id": 6, "feature_name": "Adjustable Steering Wheel",}
//             ]
//         }
//     ]
// }

exports.getSingleVehicleWithId = async (req, res) => {
  try {
    const { id } = req.params;

    // Query to get vehicle details
    const vehicleQuery = "SELECT * FROM vehicles WHERE id = ?";
    const [vehicles] = await db.query(vehicleQuery, [id]);

    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const vehicle = vehicles[0];

    // Query to get vehicle features with categories
    const featureQuery = `
            SELECT 
                fc.id as category_id, 
                fc.name as category_name, 
                f.id as feature_id, 
                f.feature_name 
            FROM vehicle_features vf
            LEFT JOIN features f ON vf.feature_id = f.id
            LEFT JOIN feature_category fc ON f.category_id = fc.id
            WHERE vf.vehicle_id = ?
        `;

    const [features] = await db.query(featureQuery, [id]);

    // Organizing features by category
    const featureMap = {};

    features.forEach((row) => {
      if (!featureMap[row.category_id]) {
        featureMap[row.category_id] = {
          id: row.category_id,
          name: row.category_name,
          feature: [],
        };
      }
      featureMap[row.category_id].feature.push({
        id: row.feature_id,
        feature_name: row.feature_name,
      });
    });

    // Convert featureMap object to an array
    const formattedFeatures = Object.values(featureMap);

    res.status(200).json({
      success: true,
      message: "Get Single Vehicle",
      data: {
        id: vehicle.id,
        name: vehicle.name,
        price: vehicle.price,
        features: formattedFeatures,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching vehicle",
      error: error.message,
    });
  }
};
