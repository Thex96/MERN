
const express = require("express");
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

router.post("/", authorize("restaurant"), async (req, res) => {
  try {
    const {
      restaurantName,
      ownerName,
      email,
      phone,
      cuisine,
      address,
      description,
      openingTime,
      closingTime,
    } = req.body || {};

    const requiredFields = {
      restaurantName,
      ownerName,
      email,
      phone,
      cuisine,
      address,
      openingTime,
      closingTime,
    };

    const missingField = Object.values(requiredFields).some(
      (value) => typeof value !== "string" || !value.trim()
    );

    if (missingField) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields.",
      });
    }

    const clean = {
      restaurantName: restaurantName.trim(),
      ownerName: ownerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      cuisine: cuisine.trim(),
      address: address.trim(),
      description: typeof description === "string" ? description.trim() : "",
      openingTime: openingTime.trim(),
      closingTime: closingTime.trim(),
    };

    if (
      clean.restaurantName.length > 100 ||
      clean.ownerName.length > 100 ||
      clean.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email) ||
      clean.phone.length > 20 ||
      clean.cuisine.length > 50 ||
      clean.address.length > 500 ||
      clean.description.length > 500 ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(clean.openingTime) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(clean.closingTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please check the length and format of your details.",
      });
    }

    const restaurant = await Restaurant.create({
      ...clean,
      owner: req.user._id,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Restaurant application submitted for review.",
      restaurant: {
        id: restaurant._id,
        restaurantName: restaurant.restaurantName,
        status: restaurant.status,
        createdAt: restaurant.createdAt,
      },
    });
  } catch (error) {
    console.error("Restaurant application error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit your application. Please try again.",
    });
  }
});

router.get("/mine", authorize("restaurant"), async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user._id })
      .select(
        "restaurantName cuisine address status rejectionReason reviewedAt createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      restaurants,
    });
  } catch (error) {
    console.error("Restaurant application lookup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your restaurant applications.",
    });
  }
});

router.get("/admin/applications", authorize("admin"), async (req, res) => {
  try {
    const filter = {};
    if (["pending", "approved", "rejected"].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    const restaurants = await Restaurant.find(filter)
      .populate("owner", "username email")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, restaurants });
  } catch (error) {
    console.error("Admin application lookup error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load restaurant applications." });
  }
});

router.patch("/admin/applications/:restaurantId/review", authorize("admin"), async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status, rejectionReason = "" } = req.body || {};
    if (!mongoose.isValidObjectId(restaurantId)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant application." });
    }
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Choose approve or reject." });
    }
    if (typeof rejectionReason !== "string" || rejectionReason.length > 500) {
      return res.status(400).json({ success: false, message: "Review notes must be 500 characters or fewer." });
    }
    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { status, rejectionReason: status === "rejected" ? rejectionReason.trim() : "", reviewedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("owner", "username email");
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant application not found." });
    }
    return res.status(200).json({ success: true, restaurant });
  } catch (error) {
    console.error("Admin application review error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update this application." });
  }
});

module.exports = router;
