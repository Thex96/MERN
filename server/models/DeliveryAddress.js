
const mongoose = require("mongoose");

const deliveryAddressSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
      match: [/^\+?[0-9\s()-]{7,20}$/, "Enter a valid phone number."],
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    area: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 12,
      match: [/^\d{6}$/, "Enter a valid 6-digit PIN code."],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator(value) {
            return value === undefined || (value.length === 2 && value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90);
          },
          message: "Location coordinates are invalid.",
        },
      },
    },
    locationVerifiedAt: {
      type: Date,
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

deliveryAddressSchema.index({ customer: 1, createdAt: -1 });
deliveryAddressSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("DeliveryAddress", deliveryAddressSchema);
