const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { protect, authorize } = require("../middleware/authMiddleware");
const Restaurant = require("../models/Restaurant");

const router = express.Router();
const uploadRoot = path.resolve(__dirname, "../uploads");
const imageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);
const documentTypes = new Map([...imageTypes, ["application/pdf", ".pdf"]]);
const maxBytes = Number(process.env.UPLOAD_MAX_BYTES || 6000000);

async function uploadImageToCloudinary({ ownerId, kind, mimeType, contents, name }) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary image storage is not configured.");
  }

  const publicId = `foodease/${ownerId}/${kind}/${crypto.randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureBase = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto
    .createHash("sha1")
    .update(signatureBase)
    .digest("hex");

  const form = new FormData();
  form.append(
    "file",
    new Blob([contents], { type: mimeType }),
    path.basename(name || `upload${imageTypes.get(mimeType)}`)
  );
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("public_id", publicId);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    {
      method: "POST",
      body: form,
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.secure_url) {
    console.error(
      "Cloudinary image upload failed:",
      result.error?.message || response.status
    );
    throw new Error("Cloudinary could not save this image.");
  }

  return {
    publicId: result.public_id,
    url: result.secure_url,
  };
}

router.get("/documents/:documentId", protect, async (req, res) => {
  try {
    const filter = { "documents._id": req.params.documentId };

    if (req.user.role === "restaurant") {
      filter.owner = req.user._id;
    } else if (req.user.role !== "admin") {
      return res.sendStatus(403);
    }

    const restaurant = await Restaurant.findOne(filter).select("+documents");
    const document = restaurant?.documents.id(req.params.documentId);

    if (
      !document ||
      !new RegExp(
        `^documents/${restaurant.owner}/[a-f0-9-]+\\.(pdf|jpg|png|webp)$`,
        "i"
      ).test(document.storageKey)
    ) {
      return res.sendStatus(404);
    }

    const filePath = path.resolve(uploadRoot, document.storageKey);

    if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) {
      return res.sendStatus(404);
    }

    return res.sendFile(filePath, {
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Document retrieval error:", error.message);
    return res.sendStatus(500);
  }
});

router.use(protect, authorize("restaurant"));

router.post("/", async (req, res) => {
  try {
    const { kind, name, mimeType, data } = req.body || {};

    if (!["document", "restaurant_image", "menu_image"].includes(kind)) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid upload type.",
      });
    }

    const allowedTypes = kind === "document" ? documentTypes : imageTypes;
    const extension = allowedTypes.get(mimeType);
    const match =
      typeof data === "string" &&
      data.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);

    if (!extension || !match || match[1] !== mimeType) {
      return res.status(400).json({
        success: false,
        message: "Choose a supported image or document file.",
      });
    }

    const contents = Buffer.from(match[2], "base64");

    if (!contents.length || contents.length > maxBytes) {
      return res.status(400).json({
        success: false,
        message: `Files must be smaller than ${Math.floor(
          maxBytes / 1000000
        )} MB.`,
      });
    }

    const signatures = {
      "image/jpeg":
        contents[0] === 0xff &&
        contents[1] === 0xd8 &&
        contents[2] === 0xff,
      "image/png": contents
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      "image/webp":
        contents.toString("ascii", 0, 4) === "RIFF" &&
        contents.toString("ascii", 8, 12) === "WEBP",
      "application/pdf": contents.toString("ascii", 0, 5) === "%PDF-",
    };

    if (!signatures[mimeType]) {
      return res.status(400).json({
        success: false,
        message: "The selected file does not match its file type.",
      });
    }

    const id = crypto.randomUUID();
    const originalName =
      typeof name === "string" ? path.basename(name).slice(0, 255) : "upload";

    if (kind === "restaurant_image" || kind === "menu_image") {
      const uploadedImage = await uploadImageToCloudinary({
        ownerId: req.user._id.toString(),
        kind,
        mimeType,
        contents,
        name: originalName,
      });

      return res.status(201).json({
        success: true,
        file: {
          id,
          kind,
          storageKey: uploadedImage.publicId,
          url: uploadedImage.url,
          originalName,
          mimeType,
          sizeBytes: contents.length,
        },
      });
    }

    const storageKey = `documents/${req.user._id}/${id}${extension}`;
    const target = path.join(uploadRoot, storageKey);

    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(target, contents, { flag: "wx" });

    return res.status(201).json({
      success: true,
      file: {
        id,
        kind,
        storageKey,
        url: "",
        originalName,
        mimeType,
        sizeBytes: contents.length,
      },
    });
  } catch (error) {
    console.error("File upload error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to save this file.",
    });
  }
});

module.exports = router;