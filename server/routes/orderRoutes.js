
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const DeliveryAddress = require("../models/DeliveryAddress");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", authorize("customer"), async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddressId, paymentMethod } = req.body;

    if (
      !mongoose.isValidObjectId(restaurantId) ||
      !mongoose.isValidObjectId(deliveryAddressId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid restaurant and delivery address.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your order must contain at least one item.",
      });
    }

    if (!["cod", "upi", "card"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid payment method.",
      });
    }

    if (paymentMethod !== "cod") {
      return res.status(400).json({
        success: false,
        message:
          "Online payments are not available yet. Please choose Cash on Delivery.",
      });
    }

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      status: "approved",
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "This restaurant is unavailable for ordering.",
      });
    }

    const address = await DeliveryAddress.findOne({
      _id: deliveryAddressId,
      customer: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "The selected delivery address was not found.",
      });
    }

    const normalizedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (
        !name ||
        name.length > 150 ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 100 ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isSafeInteger(Math.round(price * 100))
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more order items contain invalid details.",
        });
      }

      const itemTotal = Math.round(price * 100) * quantity;
      totalAmount += itemTotal;

      const normalizedItem = {
        name,
        quantity,
        price: Math.round(price * 100) / 100,
        image: typeof item.image === "string" ? item.image : "",
      };

      if (
        item.foodId &&
        mongoose.isValidObjectId(item.foodId)
      ) {
        normalizedItem.foodId = item.foodId;
      }

      normalizedItems.push(normalizedItem);
    }

    totalAmount = totalAmount / 100;

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "The order total is invalid.",
      });
    }

    const deliveryAddressSnapshot = {
      addressId: address._id,
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      addressLine: address.addressLine,
      area: address.area,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    };

    const order = await Order.create({
      customer: req.user._id,
      restaurant: restaurant._id,
      items: normalizedItems,
      totalAmount,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "placed",
      deliveryAddress: deliveryAddressSnapshot,
    });

    return res.status(201).json({
      success: true,
      message: "Your order has been placed successfully.",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to place your order right now.",
    });
  }
});

router.get("/customer", authorize("customer"), async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
    })
      .populate("restaurant", "restaurantName cuisine")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Fetch customer orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your orders.",
    });
  }
});

router.get("/restaurant", authorize("restaurant"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      owner: req.user._id,
      status: "approved",
    }).select("_id");

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "No approved restaurant was found for your account.",
      });
    }

    const orders = await Order.find({
      restaurant: restaurant._id,
      paymentStatus: "paid",
    })
      .populate("customer", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Fetch restaurant orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch restaurant orders.",
    });
  }
});

module.exports = router;
