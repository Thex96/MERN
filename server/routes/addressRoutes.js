
const express = require("express");
const mongoose = require("mongoose");
const DeliveryAddress = require("../models/DeliveryAddress");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("customer"));

router.get("/", async (req, res) => {
  try {
    const addresses = await DeliveryAddress.find({
      customer: req.user._id,
    }).sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve delivery addresses.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      label,
      fullName,
      phone,
      addressLine,
      area,
      city,
      state,
      postalCode,
      isDefault,
    } = req.body;

    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !addressLine?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !postalCode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required delivery address details.",
      });
    }

    const addressCount = await DeliveryAddress.countDocuments({
      customer: req.user._id,
    });

    if (addressCount >= 20) {
      return res.status(400).json({
        success: false,
        message: "You can save up to 20 delivery addresses.",
      });
    }

    const shouldBeDefault = Boolean(isDefault) || addressCount === 0;

    if (shouldBeDefault) {
      await DeliveryAddress.updateMany(
        { customer: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    const address = await DeliveryAddress.create({
      customer: req.user._id,
      label,
      fullName,
      phone,
      addressLine,
      area,
      city,
      state,
      postalCode,
      isDefault: shouldBeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Delivery address saved successfully.",
      address,
    });
  } catch (error) {
    console.error("Create address error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Please check the delivery address details.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to save the delivery address.",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery address.",
      });
    }

    const address = await DeliveryAddress.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found.",
      });
    }

    const allowedFields = [
      "label",
      "fullName",
      "phone",
      "addressLine",
      "area",
      "city",
      "state",
      "postalCode",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        address[field] = req.body[field];
      }
    }

    if (req.body.isDefault === true) {
      await DeliveryAddress.updateMany(
        { customer: req.user._id, _id: { $ne: address._id } },
        { $set: { isDefault: false } }
      );

      address.isDefault = true;
    } else if (req.body.isDefault === false && address.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Choose another default address before removing this default.",
      });
    }

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Delivery address updated successfully.",
      address,
    });
  } catch (error) {
    console.error("Update address error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Please check the delivery address details.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update the delivery address.",
    });
  }
});

router.patch("/:id/default", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery address.",
      });
    }

    const address = await DeliveryAddress.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found.",
      });
    }

    await DeliveryAddress.updateMany(
      { customer: req.user._id },
      { $set: { isDefault: false } }
    );

    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default delivery address updated.",
      address,
    });
  } catch (error) {
    console.error("Set default address error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to set the default delivery address.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery address.",
      });
    }

    const address = await DeliveryAddress.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found.",
      });
    }

    const wasDefault = address.isDefault;

    await address.deleteOne();

    if (wasDefault) {
      const nextAddress = await DeliveryAddress.findOne({
        customer: req.user._id,
      }).sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Delivery address deleted successfully.",
    });
  } catch (error) {
    console.error("Delete address error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete the delivery address.",
    });
  }
});

module.exports = router;
