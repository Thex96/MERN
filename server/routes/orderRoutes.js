const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/customer", protect, authorize("customer"), async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
    })
      .populate("restaurant", "restaurantName cuisine")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Customer orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your orders.",
    });
  }
});

router.get(
  "/restaurant",
  protect,
  authorize("restaurant"),
  async (req, res) => {
    try {
      const restaurant = await Restaurant.findOne({
        owner: req.user._id,
        status: "approved",
      })
        .select("_id restaurantName")
        .lean();

      if (!restaurant) {
        return res.status(403).json({
          success: false,
          message: "You do not have an approved restaurant.",
        });
      }

      const orders = await Order.find({
        restaurant: restaurant._id,
        paymentStatus: "paid",
      })
        .populate("customer", "username")
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        restaurant,
        orders,
      });
    } catch (error) {
      console.error("Restaurant orders error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve restaurant orders.",
      });
    }
  }
);

module.exports = router;
