// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require("./connectu2dworld-firebase-adminsdk-fbsvc-491ba0e120.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/auth/google", async (req, res) => {
  const { idToken } = req.body;
  
  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Authenticated User:", decodedToken);

    // Here you can create a user session, store user data in your database, etc.
    
    res.json({ message: "User authenticated successfully", user: decodedToken });
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
