
const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    cuisine: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    city: { type: String, trim: true, maxlength: 80, default: "" },
    state: { type: String, trim: true, maxlength: 80, default: "" },
    imageUrl: { type: String, trim: true, maxlength: 2048, default: "" },
    deliveryTime: { type: String, trim: true, maxlength: 40, default: "30–40 MIN" },
    priceRange: { type: String, enum: ["₹", "₹₹", "₹₹₹", "₹₹₹₹"], default: "₹₹" },
    menu: [{
      category: { type: String, trim: true, maxlength: 80 },
      name: { type: String, trim: true, maxlength: 100 },
      description: { type: String, trim: true, maxlength: 300, default: "" },
      price: { type: Number, min: 0 },
      imageUrl: { type: String, trim: true, maxlength: 2048, default: "" },
    }],

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    openingTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    closingTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
