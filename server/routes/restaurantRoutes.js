
const express = require("express");
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const { protect, authorize } = require("../middleware/authMiddleware");
const { sendEmail } = require("../services/emailNotifications");
const geocodeAddress = require("../utils/geocodeAddress");

const router = express.Router();

const BUSINESS_TYPES = [
  "proprietorship",
  "partnership",
  "llp",
  "private_limited",
  "public_limited",
  "trust_society",
  "other",
];

const FSSAI_TYPES = [
  "registration",
  "state_license",
  "central_license",
];

const GST_STATUSES = [
  "registered",
  "not_registered",
  "not_applicable",
];


function isHttpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function optionalString(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function cleanCompliance(value = {}) {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};

  return {
    fssaiNumber: optionalString(source.fssaiNumber, 14),
    fssaiType: optionalString(source.fssaiType, 30),
    fssaiValidUntil: source.fssaiValidUntil
      ? new Date(source.fssaiValidUntil)
      : null,
    gstStatus: optionalString(source.gstStatus, 30),
    gstin: optionalString(source.gstin, 15).toUpperCase(),
    shopLicenseNumber: optionalString(source.shopLicenseNumber, 100),
  };
}

function cleanLocation(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "object" || !Array.isArray(value.coordinates)) {
    return null;
  }

  const coordinates = value.coordinates.map(Number);

  if (
    coordinates.length !== 2 ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1]) ||
    coordinates[0] < -180 ||
    coordinates[0] > 180 ||
    coordinates[1] < -90 ||
    coordinates[1] > 90
  ) {
    return null;
  }

  return {
    type: "Point",
    coordinates,
  };
}

function isFutureOrToday(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryDate = new Date(date);
  expiryDate.setHours(0, 0, 0, 0);

  return expiryDate >= today;
}

function historyEntry({
  action,
  status,
  changedBy,
  note = "",
  version = 1,
}) {
  return {
    action,
    status,
    changedBy,
    note: optionalString(note, 500),
    changedAt: new Date(),
    version,
  };
}

function sendValidationError(res, message) {
  return res.status(400).json({
    success: false,
    message,
  });
}

function validateAndCleanApplication(body = {}, ownerId) {
  const {
    restaurantName,
    ownerName,
    email,
    phone,
    cuisine,
    address,
    openingTime,
    closingTime,
    city,
    state,
    imageUrl,
    menu,
  } = body;

  const requiredFields = {
    restaurantName,
    ownerName,
    email,
    phone,
    cuisine,
    address,
    openingTime,
    closingTime,
    city,
    state,
    imageUrl,
  };

  const missingField = Object.values(requiredFields).some(
    (value) => typeof value !== "string" || !value.trim()
  );

  if (missingField) {
    return {
      error: "Please complete all required restaurant and contact fields.",
    };
  }

  if (
    !body.compliance ||
    typeof body.compliance !== "object" ||
    Array.isArray(body.compliance)
  ) {
    return {
      error: "Please provide the required food safety and GST information.",
    };
  }

  const clean = {
    restaurantName: restaurantName.trim(),
    legalBusinessName: optionalString(body.legalBusinessName, 150),
    businessType: optionalString(body.businessType, 30),
    businessRegistrationNumber: optionalString(
      body.businessRegistrationNumber,
      100
    ),

    ownerName: ownerName.trim(),
    contactDesignation: optionalString(body.contactDesignation, 80),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),

    cuisine: cuisine.trim(),
    address: address.trim(),
    landmark: optionalString(body.landmark, 150),
    postalCode: optionalString(body.postalCode, 12),
    city: city.trim(),
    state: state.trim(),

    description: optionalString(body.description, 500),
    openingTime: openingTime.trim(),
    closingTime: closingTime.trim(),

    imageUrl: imageUrl.trim(),
    gallery: Array.isArray(body.gallery)
      ? body.gallery.slice(0, 12).map((item) => optionalString(item, 2048))
      : [],
    documents: Array.isArray(body.documents)
      ? body.documents.slice(0, 20).map((item) => ({
          documentType: optionalString(item.documentType, 40),
          storageKey: optionalString(item.storageKey, 500),
          originalName: optionalString(item.originalName, 255),
          mimeType: optionalString(item.mimeType, 100),
          sizeBytes: Number(item.sizeBytes) || 0,
        }))
      : [],

    compliance: cleanCompliance(body.compliance),
    location: cleanLocation(body.location),

    menu: Array.isArray(menu)
      ? menu.slice(0, 100).map((item) => {
          const menuItem =
            item && typeof item === "object" && !Array.isArray(item)
              ? item
              : {};

          return {
            category: optionalString(menuItem.category, 80),
            name: optionalString(menuItem.name, 100),
            description: optionalString(menuItem.description, 300),
            price: Number(menuItem.price),
            imageUrl: optionalString(menuItem.imageUrl, 2048),
          };
        })
      : [],
  };

  const compliance = clean.compliance;

  if (!BUSINESS_TYPES.includes(clean.businessType)) {
    return {
      error: "Please select a valid business type.",
    };
  }

  if (!/^\d{14}$/.test(compliance.fssaiNumber)) {
    return {
      error: "FSSAI number must contain exactly 14 digits.",
    };
  }

  if (!FSSAI_TYPES.includes(compliance.fssaiType)) {
    return {
      error: "Please select a valid FSSAI licence type.",
    };
  }

  if (!isFutureOrToday(compliance.fssaiValidUntil)) {
    return {
      error: "Please provide a valid FSSAI expiry date that is not in the past.",
    };
  }

  if (!GST_STATUSES.includes(compliance.gstStatus)) {
    return {
      error: "Please select a valid GST registration status.",
    };
  }

  if (
    compliance.gstStatus === "registered" &&
    !/^[0-9A-Z]{15}$/.test(compliance.gstin)
  ) {
    return {
      error: "A valid 15-character GSTIN is required when GST status is registered.",
    };
  }

  if (
    compliance.gstin &&
    !/^[0-9A-Z]{15}$/.test(compliance.gstin)
  ) {
    return {
      error: "GSTIN must contain exactly 15 alphanumeric characters.",
    };
  }

  if (
    clean.restaurantName.length < 2 ||
    clean.restaurantName.length > 100 ||
    clean.ownerName.length < 2 ||
    clean.ownerName.length > 100 ||
    clean.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email) ||
    clean.phone.length > 20 ||
    !/^\+?[0-9\s()-]{7,20}$/.test(clean.phone) ||
    clean.cuisine.length > 50 ||
    clean.address.length < 5 ||
    clean.address.length > 500 ||
    clean.description.length > 500 ||
    clean.city.length > 80 ||
    clean.state.length > 80 ||
    clean.landmark.length > 150 ||
    clean.postalCode.length > 12 ||
    (clean.postalCode && !/^\d{6}$/.test(clean.postalCode)) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(clean.openingTime) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(clean.closingTime) ||
    clean.imageUrl.length > 2048 ||
    !isHttpUrl(clean.imageUrl) ||
    clean.gallery.some((url) => url && !isHttpUrl(url)) ||
    (body.location !== undefined && clean.location === null)
  ) {
    return {
      error: "Please check the length and format of your restaurant details.",
    };
  }

  const documentTypes = ["fssai_certificate", "gst_certificate", "pan_card", "shop_license", "premises_proof", "cancelled_cheque", "menu", "other"];
  const documentPrefix = `documents/${ownerId}/`;
  const invalidDocument = clean.documents.some((document) =>
    !documentTypes.includes(document.documentType) ||
    !document.storageKey.startsWith(documentPrefix) ||
    !/^[a-f0-9-]+\.(pdf|jpg|png|webp)$/i.test(document.storageKey.slice(documentPrefix.length)) ||
    !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(document.mimeType) ||
    document.sizeBytes <= 0 || document.sizeBytes > Number(process.env.UPLOAD_MAX_BYTES || 6000000)
  );
  if (invalidDocument) return { error: "One or more supporting documents are invalid. Upload them again." };

  if (!clean.menu.length) {
    return {
      error: "Please add at least one menu item.",
    };
  }

  const invalidMenuItem = clean.menu.some(
    (item) =>
      !item.name ||
      !item.category ||
      !Number.isFinite(item.price) ||
      item.price <= 0 ||
      item.category.length > 80 ||
      item.name.length > 100 ||
      item.description.length > 300 ||
      item.imageUrl.length > 2048 ||
      (item.imageUrl && !isHttpUrl(item.imageUrl))
  );

  if (invalidMenuItem) {
    return {
      error:
        "Each menu item must have a name, category, and price greater than zero. Please also check the image URLs.",
    };
  }

  return { clean };
}

// Public storefront data. Private manager, compliance, document and review
// information must never be exposed through this endpoint.
router.get("/approved", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ status: "approved" })
      .select(
        "restaurantName cuisine address landmark postalCode city state location description imageUrl gallery menu status createdAt"
      )
      .sort({ reviewedAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      restaurants,
    });
  } catch (error) {
    console.error("Public restaurant lookup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load restaurants.",
    });
  }
});

router.use(protect);

// Restaurant managers submit applications under their authenticated account.
router.post("/", authorize("restaurant"), async (req, res) => {
  try {
    const { clean, error: validationError } =
      validateAndCleanApplication(req.body || {}, req.user._id);

    if (validationError) {
      return sendValidationError(res, validationError);
    }

    clean.location = await geocodeAddress(clean);
    clean.locationVerifiedAt = new Date();

    const restaurant = await Restaurant.create({
      ...clean,
      owner: req.user._id,
      status: "pending",
      submittedAt: new Date(),
      applicationVersion: 1,
      submissionHistory: [
        historyEntry({
          action: "submitted",
          status: "pending",
          changedBy: req.user._id,
          note: "Initial restaurant application submitted.",
          version: 1,
        }),
      ],
    });

    await sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL,
      subject: "New FoodEase restaurant application",
      text: `${restaurant.restaurantName} was submitted by ${restaurant.ownerName} (${restaurant.email}) and is waiting for review.`,
    });

    return res.status(201).json({
      success: true,
      message: "Restaurant application submitted for review.",
      restaurant: {
        id: restaurant._id,
        restaurantName: restaurant.restaurantName,
        status: restaurant.status,
        submittedAt: restaurant.submittedAt,
        createdAt: restaurant.createdAt,
      },
    });
  } catch (error) {
    console.error("Restaurant application error:", error);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      const validationMessage =
        error.name === "ValidationError"
          ? Object.values(error.errors)
              .map((item) => item.message)
              .join(" ")
          : error.message;

      return sendValidationError(
        res,
        validationMessage || "Please check your submitted details."
      );
    }

    return res.status(error.message?.startsWith("We couldn't find") || error.message?.startsWith("Address lookup") || error.message?.startsWith("Enter a complete") ? 422 : 500).json({
      success: false,
      message: error.message || "Unable to submit your application. Please try again.",
    });
  }
});

router.patch("/:restaurantId", authorize("restaurant"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.restaurantId)) return res.status(400).json({ success: false, message: "Invalid restaurant." });
    const restaurant = await Restaurant.findOne({ _id: req.params.restaurantId, owner: req.user._id, status: "approved" }).select("+documents");
    if (!restaurant) return res.status(404).json({ success: false, message: "Approved restaurant not found." });
    const body = req.body || {};
    if (!Array.isArray(body.menu) || body.menu.length === 0 || body.menu.length > 100) return sendValidationError(res, "Add at least one menu item.");
    const menu = body.menu.map((item) => ({
      category: optionalString(item?.category, 80),
      name: optionalString(item?.name, 100),
      description: optionalString(item?.description, 300),
      price: Number(item?.price),
      imageUrl: optionalString(item?.imageUrl, 2048),
    }));
    if (menu.some((item) => !item.category || !item.name || !Number.isFinite(item.price) || item.price <= 0 || (item.imageUrl && !isHttpUrl(item.imageUrl)))) return sendValidationError(res, "Check each menu item name, category, price, and image.");
    restaurant.menu = menu;
    if (body.description !== undefined) restaurant.description = optionalString(body.description, 500);
    if (body.imageUrl !== undefined && isHttpUrl(body.imageUrl)) restaurant.imageUrl = optionalString(body.imageUrl, 2048);
    if (body.openingTime !== undefined && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.openingTime)) restaurant.openingTime = body.openingTime;
    if (body.closingTime !== undefined && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.closingTime)) restaurant.closingTime = body.closingTime;
    restaurant.applicationVersion = (restaurant.applicationVersion || 1) + 1;
    restaurant.submissionHistory.push(historyEntry({ action: "edited", status: "approved", changedBy: req.user._id, note: "Approved menu and operating details updated.", version: restaurant.applicationVersion }));
    await restaurant.save();
    return res.status(200).json({ success: true, restaurant });
  } catch (error) {
    console.error("Update approved restaurant error:", error.message);
    return res.status(400).json({ success: false, message: "Unable to update this restaurant. Check the entered details." });
  }
});

router.patch(
  "/:restaurantId/resubmit",
  authorize("restaurant"),
  async (req, res) => {
    try {
      const { restaurantId } = req.params;

      if (!mongoose.isValidObjectId(restaurantId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid restaurant application.",
        });
      }

      const restaurant = await Restaurant.findOne({
        _id: restaurantId,
        owner: req.user._id,
      });

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant application not found.",
        });
      }

      if (restaurant.status !== "rejected") {
        return res.status(400).json({
          success: false,
          message: "Only rejected applications can be submitted again.",
        });
      }

      const { clean, error: validationError } =
        validateAndCleanApplication(req.body || {}, req.user._id);

      if (validationError) {
        return sendValidationError(res, validationError);
      }

      clean.location = await geocodeAddress(clean);
      clean.locationVerifiedAt = new Date();

      if (req.body.gallery === undefined) {
        delete clean.gallery;
      }
      if (req.body.documents === undefined) {
        delete clean.documents;
      }

      restaurant.set(clean);

      restaurant.status = "pending";
      restaurant.rejectionReason = "";
      restaurant.reviewedAt = null;
      restaurant.reviewedBy = null;
      restaurant.submittedAt = new Date();

      restaurant.applicationVersion =
        (restaurant.applicationVersion || 1) + 1;

      if (!Array.isArray(restaurant.submissionHistory)) {
        restaurant.submissionHistory = [];
      }

      restaurant.submissionHistory.push(
        historyEntry({
          action: "resubmitted",
          status: "pending",
          changedBy: req.user._id,
          note: "Corrected restaurant application resubmitted for review.",
          version: restaurant.applicationVersion,
        })
      );

      await restaurant.save();

      await sendEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: "FoodEase restaurant application resubmitted",
        text: `${restaurant.restaurantName} was resubmitted by ${restaurant.ownerName} and is waiting for review.`,
      });

      return res.status(200).json({
        success: true,
        message: "Restaurant application submitted for review.",
        restaurant,
      });
    } catch (error) {
      console.error("Restaurant application resubmission error:", error);

      if (
        error.name === "ValidationError" ||
        error.name === "CastError"
      ) {
        const validationMessage =
          error.name === "ValidationError"
            ? Object.values(error.errors)
                .map((item) => item.message)
                .join(" ")
            : error.message;

        return sendValidationError(
          res,
          validationMessage || "Please check your submitted details."
        );
      }

      return res.status(error.message?.startsWith("We couldn't find") || error.message?.startsWith("Address lookup") || error.message?.startsWith("Enter a complete") ? 422 : 500).json({
        success: false,
        message: error.message || "Unable to resubmit your application. Please try again.",
      });
    }
  }
);

// Retrieve applications belonging only to the logged-in restaurant manager.
router.get("/mine", authorize("restaurant"), async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      owner: req.user._id,
    })
      .select(
        "restaurantName legalBusinessName businessType businessRegistrationNumber cuisine address landmark postalCode city state location description imageUrl gallery menu compliance status rejectionReason submittedAt reviewedAt reviewedBy submissionHistory applicationVersion createdAt updatedAt +documents"
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

// Admin application listing.
router.get("/admin/applications", authorize("admin"), async (req, res) => {
  try {
    const filter = {};

    if (
      ["pending", "approved", "rejected"].includes(
        req.query.status
      )
    ) {
      filter.status = req.query.status;
    }

    const restaurants = await Restaurant.find(filter)
      .populate("owner", "username email")
      .populate("reviewedBy", "username email")
      .select("+documents")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      restaurants,
    });
  } catch (error) {
    console.error("Admin application lookup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load restaurant applications.",
    });
  }
});

// Admin approval or rejection.
router.patch(
  "/admin/applications/:restaurantId/review",
  authorize("admin"),
  async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { status, rejectionReason = "" } = req.body || {};

      if (!mongoose.isValidObjectId(restaurantId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid restaurant application.",
        });
      }

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Choose approve or reject.",
        });
      }

      if (
        typeof rejectionReason !== "string" ||
        rejectionReason.length > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "Review notes must be 500 characters or fewer.",
        });
      }

      if (status === "rejected" && !rejectionReason.trim()) {
        return res.status(400).json({
          success: false,
          message: "Please provide a reason when rejecting an application.",
        });
      }

      const restaurant = await Restaurant.findById(restaurantId);

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant application not found.",
        });
      }

      restaurant.status = status;
      restaurant.rejectionReason =
        status === "rejected" ? rejectionReason.trim() : "";
      restaurant.reviewedAt = new Date();
      restaurant.reviewedBy = req.user._id;

      restaurant.submissionHistory.push(
        historyEntry({
          action: status,
          status,
          changedBy: req.user._id,
          note:
            status === "rejected"
              ? restaurant.rejectionReason
              : "Application approved.",
          version: restaurant.applicationVersion || 1,
        })
      );

      await restaurant.save();

      await restaurant.populate("owner", "username email");
      await restaurant.populate("reviewedBy", "username email");

      await sendEmail({
        to: restaurant.email,
        subject: status === "approved" ? "Your FoodEase restaurant is approved" : "Update to your FoodEase restaurant application",
        text: status === "approved"
          ? `${restaurant.restaurantName} has been approved and is now available on FoodEase.`
          : `${restaurant.restaurantName} was not approved. Review reason: ${restaurant.rejectionReason}`,
      });

      return res.status(200).json({
        success: true,
        restaurant,
      });
    } catch (error) {
      console.error("Admin application review error:", error);

      if (error.name === "ValidationError") {
        const validationMessage = Object.values(error.errors)
          .map((item) => item.message)
          .join(" ");

        return sendValidationError(
          res,
          validationMessage || "The application contains invalid details."
        );
      }

      return res.status(500).json({
        success: false,
        message: "Unable to update this application.",
      });
    }
  }
);

module.exports = router;
