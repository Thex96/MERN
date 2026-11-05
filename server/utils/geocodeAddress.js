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

async function reverseGeocodeCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    throw new Error("Choose a valid location on your device.");
  }

  const endpoint = process.env.GEOCODER_URL || "https://nominatim.openstreetmap.org/search";
  const url = new URL(endpoint);
  url.pathname = url.pathname.replace(/\/search\/?$/, "/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const release = await acquireGeocoderTurn();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": process.env.GEOCODER_USER_AGENT || "FoodEase/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error("Nearby address lookup is temporarily unavailable.");

    const result = await response.json();
    if (!result?.address) throw new Error("No address details were found near this location.");

    const address = result.address;
    const area =
      address.neighbourhood ||
      address.suburb ||
      address.village ||
      address.hamlet ||
      address.town ||
      "";
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.city_district ||
      address.county ||
      "";
    const postalMatch = String(address.postcode || "").match(/\b\d{6}\b/);

    return {
      addressLine: [address.house_number, address.road].filter(Boolean).join(" ") || area || result.name || "",
      area,
      city,
      state: address.state || "",
      postalCode: postalMatch?.[0] || "",
      location: { type: "Point", coordinates: [lon, lat] },
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Nearby address lookup took too long. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    release();
  }
}

geocodeAddress.reverse = reverseGeocodeCoordinates;

module.exports = geocodeAddress;
