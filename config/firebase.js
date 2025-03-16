const firebaseAdmin = require("firebase-admin");

const serviceAccount = require("../serviceAccountKey.json");

if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "https://garir-hat-default-rtdb.firebaseio.com/",
  });
}

module.exports = firebaseAdmin;
