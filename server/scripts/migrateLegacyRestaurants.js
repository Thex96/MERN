require("dotenv").config();

const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");

const legacyFilter = {
  $or: [
    { status: "draft" },
    { deliveryTime: { $exists: true } },
    { priceRange: { $exists: true } },
    { "submissionHistory.status": "draft" },
    { "submissionHistory.action": "saved_draft" },
  ],
};

const migration = [
  {
    $set: {
      status: { $cond: [{ $eq: ["$status", "draft"] }, "rejected", "$status"] },
      rejectionReason: {
        $cond: [
          { $eq: ["$status", "draft"] },
          "Please complete your restaurant details and resubmit this application.",
          "$rejectionReason",
        ],
      },
      submissionHistory: {
        $map: {
          input: { $ifNull: ["$submissionHistory", []] },
          as: "entry",
          in: {
            $mergeObjects: [
              "$$entry",
              {
                status: { $cond: [{ $eq: ["$$entry.status", "draft"] }, "pending", "$$entry.status"] },
                action: { $cond: [{ $eq: ["$$entry.action", "saved_draft"] }, "submitted", "$$entry.action"] },
                note: { $cond: [{ $eq: ["$$entry.action", "saved_draft"] }, "Legacy incomplete draft converted to an application.", "$$entry.note"] },
              },
            ],
          },
        },
      },
    },
  },
  { $unset: ["deliveryTime", "priceRange"] },
];

async function migrateLegacyRestaurants() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const result = await Restaurant.collection.updateMany(legacyFilter, migration);
  console.log(`Legacy restaurant migration complete. Modified ${result.modifiedCount} restaurant records.`);
  await mongoose.disconnect();
}

migrateLegacyRestaurants().catch(async (error) => {
  console.error("Legacy restaurant migration failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
