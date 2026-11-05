
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const DeliveryAddress = require("../models/DeliveryAddress");
const { protect, authorize } = require("../middleware/authMiddleware");
const geocodeAddress = require("../utils/geocodeAddress");
const getRoadDistance = require("../utils/getRoadDistance");
const { calculateDeliveryFee, roundMoney } = require("../utils/deliveryPricing");

const router = express.Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function quoteDelivery(restaurant, address) {
  const restaurantCoordinates = restaurant.location?.coordinates;
  const addressCoordinates = address.location?.coordinates;
  if (!restaurantCoordinates || !addressCoordinates) return null;
  const route = await getRoadDistance(restaurantCoordinates, addressCoordinates);
  const configuredMaximum = Number(process.env.DELIVERY_MAX_DISTANCE_KM || 30);
  const maximumDistance = Number.isFinite(configuredMaximum) && configuredMaximum > 0 ? configuredMaximum : 30;
  const distanceKm = Math.round(route.distanceKm * 10) / 10;

  if (route.distanceKm > maximumDistance) {
    return {
      distanceKm,
      routeDurationMinutes: Math.ceil(route.durationMinutes),
      deliveryFee: null,
      available: false,
      maximumDistance,
    };
  }

  const demandWindowMinutes = Number(process.env.DELIVERY_DEMAND_WINDOW_MINUTES || 60);
  const demandStart = new Date(Date.now() - Math.max(1, demandWindowMinutes) * 60 * 1000);
  const cityPattern = new RegExp(`^${escapeRegex(String(address.city || "").trim())}$`, "i");
  const activeCityOrders = await Order.countDocuments({
    "deliveryAddress.city": cityPattern,
    orderStatus: { $in: ["placed", "confirmed", "preparing", "ready", "out_for_delivery"] },
    createdAt: { $gte: demandStart },
  });
  const pricing = calculateDeliveryFee({
    distanceKm: route.distanceKm,
    activeCityOrders,
  });

  return {
    distanceKm,
    routeDurationMinutes: Math.ceil(route.durationMinutes),
    deliveryFee: pricing.deliveryFee,
    feeBreakdown: pricing.feeBreakdown,
    activeCityOrders,
    available: true,
    maximumDistance,
  };
}

function signDeliveryQuote(quote, restaurant, address, customerId) {
  if (!quote.available) return quote;

  const payload = {
    type: "delivery_quote",
    customerId: String(customerId),
    restaurantId: String(restaurant._id),
    deliveryAddressId: String(address._id),
    restaurantCoordinates: restaurant.location.coordinates,
    addressCoordinates: address.location.coordinates,
    distanceKm: quote.distanceKm,
    routeDurationMinutes: quote.routeDurationMinutes,
    deliveryFee: quote.deliveryFee,
    feeBreakdown: quote.feeBreakdown,
    activeCityOrders: quote.activeCityOrders,
  };

  return {
    ...quote,
    quoteToken: jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" }),
  };
}

function verifyDeliveryQuote(token, restaurant, address, customerId) {
  if (typeof token !== "string" || !token) {
    throw new Error("Refresh the delivery estimate before placing your order.");
  }

  let quote;
  try {
    quote = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new Error("Your delivery estimate expired. Refresh it and try again.");
  }

  const sameCoordinates = (first, second) =>
    Array.isArray(first) &&
    Array.isArray(second) &&
    first.length === 2 &&
    second.length === 2 &&
    first.every((coordinate, index) => Number(coordinate) === Number(second[index]));

  if (
    quote.type !== "delivery_quote" ||
    quote.customerId !== String(customerId) ||
    quote.restaurantId !== String(restaurant._id) ||
    quote.deliveryAddressId !== String(address._id) ||
    !sameCoordinates(quote.restaurantCoordinates, restaurant.location?.coordinates) ||
    !sameCoordinates(quote.addressCoordinates, address.location?.coordinates)
  ) {
    throw new Error("Delivery details changed. Refresh the delivery estimate and try again.");
  }

  return {
    distanceKm: Number(quote.distanceKm),
    routeDurationMinutes: Number(quote.routeDurationMinutes),
    deliveryFee: roundMoney(Number(quote.deliveryFee)),
    feeBreakdown: quote.feeBreakdown,
    activeCityOrders: Number(quote.activeCityOrders) || 0,
    available: true,
    maximumDistance: Number(process.env.DELIVERY_MAX_DISTANCE_KM || 30),
  };
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

function routingFailure(error) {
  return error.message?.toLowerCase().includes("route");
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
    const quote = await quoteDelivery(restaurant, address);
    if (!quote) return res.status(400).json({ success: false, message: "Add map coordinates to the restaurant and delivery address to calculate delivery." });
    return res.status(200).json({
      success: true,
      ...signDeliveryQuote(quote, restaurant, address, req.user._id),
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
    const status = geocodingFailure(error) ? 422 : routingFailure(error) ? 503 : 500;
    return res.status(status).json({ success: false, message: error.message || "Unable to calculate the delivery charge." });
  }
});

router.post("/", authorize("customer"), async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddressId, paymentMethod, deliveryQuoteToken } = req.body;

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

    let deliveryQuote;
    try {
      deliveryQuote = verifyDeliveryQuote(
        deliveryQuoteToken,
        restaurant,
        address,
        req.user._id
      );
    } catch (error) {
      return res.status(409).json({ success: false, message: error.message });
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
      routeDurationMinutes: deliveryQuote.routeDurationMinutes,
      deliveryFeeBreakdown: deliveryQuote.feeBreakdown,
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

    const status = geocodingFailure(error) ? 422 : routingFailure(error) ? 503 : 500;
    return res.status(status).json({
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
