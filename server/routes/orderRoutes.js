
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const DeliveryAddress = require("../models/DeliveryAddress");
const { protect, authorize } = require("../middleware/authMiddleware");
const geocodeAddress = require("../utils/geocodeAddress");

const router = express.Router();

function quoteDelivery(restaurant, address) {
  const restaurantCoordinates = restaurant.location?.coordinates;
  const addressCoordinates = address.location?.coordinates;
  if (!restaurantCoordinates || !addressCoordinates) return null;
  const radians = (degrees) => degrees * Math.PI / 180;
  const [restaurantLongitude, restaurantLatitude] = restaurantCoordinates;
  const [addressLongitude, addressLatitude] = addressCoordinates;
  const latitudeDifference = radians(addressLatitude - restaurantLatitude);
  const longitudeDifference = radians(addressLongitude - restaurantLongitude);
  const haversine = Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(restaurantLatitude)) * Math.cos(radians(addressLatitude)) *
    Math.sin(longitudeDifference / 2) ** 2;
  const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  const baseFee = Number(process.env.DELIVERY_BASE_FEE || 40);
  const feePerKm = Number(process.env.DELIVERY_FEE_PER_KM || 5);
  const configuredMaximum = Number(process.env.DELIVERY_MAX_DISTANCE_KM || 30);
  const maximumDistance = Number.isFinite(configuredMaximum) && configuredMaximum > 0 ? configuredMaximum : 30;
  const roundedDistance = Math.round(distanceKm * 10) / 10;
  if (distanceKm > maximumDistance) {
    return { distanceKm: roundedDistance, deliveryFee: null, available: false, maximumDistance };
  }
  const deliveryFee = Math.round((baseFee + distanceKm * feePerKm) * 100) / 100;
  return { distanceKm: roundedDistance, deliveryFee, available: true, maximumDistance };
}

async function ensureGeocoded(restaurant, address) {
  if (!restaurant.locationVerifiedAt || !restaurant.location?.coordinates?.length) {
    restaurant.location = await geocodeAddress(restaurant);
    restaurant.locationVerifiedAt = new Date();
    await restaurant.save();
  }

  if (!address.locationVerifiedAt || !address.location?.coordinates?.length) {
    address.location = await geocodeAddress(address);
    address.locationVerifiedAt = new Date();
    await address.save();
  }
}

function geocodingFailure(error) {
  return error.message?.startsWith("We couldn't find") ||
    error.message?.startsWith("Address lookup") ||
    error.message?.startsWith("Enter a complete");
}

router.use(protect);

router.post("/estimate", authorize("customer"), async (req, res) => {
  try {
    const { restaurantId, deliveryAddressId } = req.body || {};
    if (!mongoose.isValidObjectId(restaurantId) || !mongoose.isValidObjectId(deliveryAddressId)) {
      return res.status(400).json({ success: false, message: "Choose a valid restaurant and delivery address." });
    }
    const [restaurant, address] = await Promise.all([
      Restaurant.findOne({ _id: restaurantId, status: "approved" }).select("restaurantName address landmark city state postalCode location locationVerifiedAt"),
      DeliveryAddress.findOne({ _id: deliveryAddressId, customer: req.user._id }).select("addressLine area city state postalCode location locationVerifiedAt"),
    ]);
    if (!restaurant || !address) return res.status(404).json({ success: false, message: "Restaurant or delivery address was not found." });
    await ensureGeocoded(restaurant, address);
    const quote = quoteDelivery(restaurant, address);
    if (!quote) return res.status(400).json({ success: false, message: "Add map coordinates to the restaurant and delivery address to calculate delivery." });
    return res.status(200).json({
      success: true,
      ...quote,
      restaurant: {
        name: restaurant.restaurantName,
        address: restaurant.address,
        landmark: restaurant.landmark,
        city: restaurant.city,
        state: restaurant.state,
      },
      deliveryAddress: {
        addressLine: address.addressLine,
        area: address.area,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
      },
    });
  } catch (error) {
    console.error("Delivery estimate error:", error.message);
    return res.status(geocodingFailure(error) ? 422 : 500).json({ success: false, message: error.message || "Unable to calculate the delivery charge." });
  }
});

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

    await ensureGeocoded(restaurant, address);

    const deliveryQuote = quoteDelivery(restaurant, address);
    if (!deliveryQuote) {
      return res.status(400).json({ success: false, message: "Add map coordinates to the restaurant and delivery address to calculate delivery." });
    }
    if (!deliveryQuote.available) {
      return res.status(422).json({ success: false, message: `This address is outside this restaurant's delivery area of ${deliveryQuote.maximumDistance} km.` });
    }

    const normalizedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const name = typeof item?.name === "string" ? item.name.trim() : "";
      const quantity = Number(item?.quantity);
      const menuItem = restaurant.menu.id(item?.foodId);
      const price = Number(menuItem?.price);

      if (
        !menuItem ||
        !name ||
        name.length > 150 ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 100 ||
        !Number.isFinite(price) ||
        name !== menuItem.name ||
        price < 0 ||
        !Number.isSafeInteger(Math.round(price * 100))
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more order items contain invalid details.",
        });
      }

      const itemTotal = Math.round(price * 100) * quantity;
      subtotal += itemTotal;

      const normalizedItem = {
        name: menuItem.name,
        quantity,
        price: Math.round(price * 100) / 100,
        image: menuItem.imageUrl || restaurant.imageUrl,
      };

      if (
        item.foodId &&
        mongoose.isValidObjectId(item.foodId)
      ) {
        normalizedItem.foodId = item.foodId;
      }

      normalizedItems.push(normalizedItem);
    }

    subtotal = subtotal / 100;
    const totalAmount = Math.round((subtotal + deliveryQuote.deliveryFee) * 100) / 100;

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
      location: address.location,
    };

    const order = await Order.create({
      customer: req.user._id,
      restaurant: restaurant._id,
      items: normalizedItems,
      totalAmount,
      subtotal,
      deliveryFee: deliveryQuote.deliveryFee,
      distanceKm: deliveryQuote.distanceKm,
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

    return res.status(geocodingFailure(error) ? 422 : 500).json({
      success: false,
      message: error.message || "Unable to place your order right now.",
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
    const restaurantQuery = { owner: req.user._id, status: "approved" };
    if (req.query.restaurantId) {
      if (!mongoose.isValidObjectId(req.query.restaurantId)) {
        return res.status(400).json({ success: false, message: "Please select a valid restaurant." });
      }
      restaurantQuery._id = req.query.restaurantId;
    }
    const restaurant = await Restaurant.findOne({
      ...restaurantQuery,
    }).select("_id restaurantName");

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "No approved restaurant was found for your account.",
      });
    }

    const orders = await Order.find({
      restaurant: restaurant._id,
    })
      .populate("customer", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      restaurant,
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

router.patch("/:orderId/status", authorize("restaurant"), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body || {};
    const transitions = {
      placed: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["ready"],
      ready: ["out_for_delivery"],
      out_for_delivery: ["delivered"],
    };
    if (!mongoose.isValidObjectId(orderId) || !Object.values(transitions).flat().includes(orderStatus)) {
      return res.status(400).json({ success: false, message: "Choose a valid next order status." });
    }
    const order = await Order.findById(orderId).populate("restaurant", "owner");
    if (!order || String(order.restaurant.owner) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: "Order not found for your restaurant." });
    }
    if (!transitions[order.orderStatus]?.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: "This order cannot move to that status." });
    }
    order.orderStatus = orderStatus;
    await order.save();
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Update order status error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update the order." });
  }
});

module.exports = router;
