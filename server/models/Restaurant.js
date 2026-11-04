const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: [
        "fssai_certificate",
        "gst_certificate",
        "pan_card",
        "shop_license",
        "premises_proof",
        "cancelled_cheque",
        "menu",
        "other",
      ],
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    originalName: {
      type: String,
      trim: true,
      maxlength: 255,
      default: "",
    },
    mimeType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    sizeBytes: {
      type: Number,
      min: 0,
      default: 0,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const submissionHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "created",
        "submitted",
        "edited",
        "resubmitted",
        "approved",
        "rejected",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      min: 1,
      default: 1,
    },
  },
  { _id: true }
);

const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator(value) {
          return (
            Array.isArray(value) &&
            value.length === 2 &&
            Number.isFinite(value[0]) &&
            Number.isFinite(value[1]) &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90
          );
        },
        message:
          "Location must contain valid [longitude, latitude] coordinates.",
      },
    },
  },
  { _id: false }
);

const restaurantSchema = new mongoose.Schema(
  {
    // Restaurant identity and public-facing information.
    restaurantName: {
      type: String,
      trim: true,
      maxlength: 100,
      validate: { validator(value) { return Boolean(value && value.trim().length >= 2); }, message: "Restaurant name must contain at least 2 characters." },
    },
    legalBusinessName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    businessType: {
      type: String,
      enum: [
        "proprietorship",
        "partnership",
        "llp",
        "private_limited",
        "public_limited",
        "trust_society",
        "other",
        "",
      ],
      default: "",
      validate: {
        validator(value) {
          return Boolean(value);
        },
        message: "Business type is required.",
      },
    },
    businessRegistrationNumber: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    // The authenticated restaurant-manager account owns this application.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Restaurant owner account is required."],
      index: true,
    },
    ownerName: {
      type: String,
      trim: true,
      maxlength: 100,
      validate: { validator(value) { return Boolean(value && value.trim().length >= 2); }, message: "Owner name must contain at least 2 characters." },
    },
    contactDesignation: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      validate: { validator(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || ""); }, message: "Please provide a valid email address." },
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      validate: { validator(value) { return /^\+?[0-9\s()-]{7,20}$/.test(value || ""); }, message: "Please provide a valid contact phone number." },
    },

    cuisine: {
      type: String,
      trim: true,
      maxlength: 50,
      validate: { validator(value) { return Boolean(value); }, message: "Cuisine is required." },
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
      validate: { validator(value) { return Boolean(value && value.trim().length >= 5); }, message: "Please provide a complete restaurant address." },
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 12,
      default: "",
      validate: {
        validator(value) {
          return !value || /^[0-9]{6}$/.test(value);
        },
        message: "Please provide a valid 6-digit Indian PIN code.",
      },
    },
    city: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    location: {
      type: geoPointSchema,
      default: undefined,
    },
    locationVerifiedAt: {
      type: Date,
      default: null,
    },

    imageUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: "",
    },
    gallery: [
      {
        type: String,
        trim: true,
        maxlength: 2048,
      },
    ],
    menu: {
      type: [
        {
          category: {
            type: String,
            trim: true,
            maxlength: 80,
          },
          name: {
            type: String,
            trim: true,
            maxlength: 100,
          },
          description: {
            type: String,
            trim: true,
            maxlength: 300,
            default: "",
          },
          price: {
            type: Number,
            min: [0, "Menu item price cannot be negative."],
          },
          imageUrl: {
            type: String,
            trim: true,
            maxlength: 2048,
            default: "",
          },
        },
      ],
      default: [],
      validate: {
        validator(items) {

          if (!Array.isArray(items) || items.length === 0) {
            return false;
          }

          return items.every(
            (item) =>
              item.name &&
              item.name.trim().length > 0 &&
              item.category &&
              item.category.trim().length > 0 &&
              Number.isFinite(item.price) &&
              item.price > 0
          );
        },
        message:
          "At least one complete menu item is required. Each item must have a name, category, and price greater than zero.",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // Operating hours use 24-hour HH:mm format.
    openingTime: {
      type: String,
      validate: { validator(value) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || ""); }, message: "Opening time must use HH:mm format." },
    },
    closingTime: {
      type: String,
      validate: { validator(value) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || ""); }, message: "Closing time must use HH:mm format." },
    },

    // Compliance information.
    compliance: {
      fssaiNumber: {
        type: String,
        trim: true,
        maxlength: 14,
        default: "",
        match: [
          /^$|^\d{14}$/,
          "FSSAI number must contain exactly 14 digits.",
        ],
        validate: {
          validator(value) {
            return /^\d{14}$/.test(value || "");
          },
          message: "A valid 14-digit FSSAI number is required.",
        },
      },
      fssaiType: {
        type: String,
        enum: ["", "registration", "state_license", "central_license"],
        default: "",
        validate: {
          validator(value) {
            return Boolean(value);
          },
          message: "FSSAI licence type is required.",
        },
      },
      fssaiValidUntil: {
        type: Date,
        default: null,
        validate: {
          validator(value) {

            return (
              value instanceof Date &&
              !Number.isNaN(value.getTime()) &&
              value >= new Date(new Date().setHours(0, 0, 0, 0))
            );
          },
          message:
            "A valid FSSAI licence expiry date that is not in the past is required.",
        },
      },
      gstStatus: {
        type: String,
        enum: ["", "registered", "not_registered", "not_applicable"],
        default: "",
        validate: {
          validator(value) {
            return Boolean(value);
          },
          message: "Please select a GST registration status.",
        },
      },
      gstin: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 15,
        default: "",
        match: [
          /^$|^[0-9A-Z]{15}$/,
          "GSTIN must contain exactly 15 alphanumeric characters.",
        ],
        validate: {
          validator(value) {
            if (this.compliance?.gstStatus === "registered") {
              return /^[0-9A-Z]{15}$/.test(value || "");
            }

            return !value || /^[0-9A-Z]{15}$/.test(value);
          },
          message:
            "A valid 15-character GSTIN is required when GST status is registered.",
        },
      },
      shopLicenseNumber: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
      },
    },

    // Private document metadata. Actual files will be stored separately.
    documents: {
      type: [documentSchema],
      default: [],
      select: false,
    },

    // Application status and review information.
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
    submittedAt: {
      type: Date,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    applicationVersion: {
      type: Number,
      min: 1,
      default: 1,
    },
    submissionHistory: {
      type: [submissionHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

restaurantSchema.index({ owner: 1, status: 1, createdAt: -1 });
restaurantSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Restaurant", restaurantSchema);
