const admin = require("firebase-admin");
const path = require("path");

// load json safely
const serviceAccount = require(path.resolve(
  __dirname,
  "./firebase-admin.json"
));

// DEBUG (REMOVE AFTER FIX)
console.log("SERVICE ACCOUNT LOADED:", !!serviceAccount);

if (!serviceAccount) {
  throw new Error("Firebase service account JSON not found");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;