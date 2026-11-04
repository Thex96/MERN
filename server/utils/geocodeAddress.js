let geocoderQueue = Promise.resolve();
let nextRequestAt = 0;

async function acquireGeocoderTurn() {
  let release;
  const previous = geocoderQueue;
  geocoderQueue = new Promise((resolve) => {
    release = resolve;
  });
  await previous;
  const waitMs = Math.max(0, nextRequestAt - Date.now());
  if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
  nextRequestAt = Date.now() + 1100;
  return release;
}

function buildAddressQuery(address) {
  return [
    address.addressLine,
    address.landmark,
    address.area,
    address.city,
    address.state,
    address.postalCode,
    address.country || "India",
  ]
    .filter((part) => typeof part === "string" && part.trim())
    .map((part) => part.trim())
    .join(", ");
}

async function geocodeAddress(address) {
  const query = buildAddressQuery(address);
  if (!query) throw new Error("Enter a complete address to find its map location.");

  const endpoint = process.env.GEOCODER_URL || "https://nominatim.openstreetmap.org/search";
  const url = new URL(endpoint);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const release = await acquireGeocoderTurn();

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": process.env.GEOCODER_USER_AGENT || "FoodEase/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error("Address lookup is temporarily unavailable.");

    const results = await response.json();
    const longitude = Number(results?.[0]?.lon);
    const latitude = Number(results?.[0]?.lat);

    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new Error("We couldn't find that address. Check the street, city, state, and postal code.");
    }

    return { type: "Point", coordinates: [longitude, latitude] };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Address lookup took too long. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    release();
  }
}

module.exports = geocodeAddress;
