require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const orderRoutes = require("./routes/orderRoutes");
const addressRoutes = require("./routes/addressRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const path = require("path");

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
  })
);

app.use(express.json({ limit: "9mb" }));
app.use("/uploads/images", express.static(path.resolve(__dirname, "uploads/images"), { fallthrough: false }));

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/uploads", uploadRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "FoodEase API is running",
  });
});

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from server/.env");
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === "replace-with-a-long-random-secret") {
      throw new Error("Set a unique JWT_SECRET with at least 32 characters in server/.env.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`FoodEase server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start FoodEase:", error);
    process.exit(1);
  }
}

startServer();
