const DEFAULT_ROUTING_URL = "https://router.project-osrm.org/route/v1/driving";

async function getRoadDistance(origin, destination) {
  if (
    !Array.isArray(origin) ||
    !Array.isArray(destination) ||
    origin.length !== 2 ||
    destination.length !== 2 ||
    [...origin, ...destination].some((coordinate) => !Number.isFinite(Number(coordinate)))
  ) {
    throw new Error("Valid restaurant and delivery coordinates are required.");
  }

  const [originLongitude, originLatitude] = origin.map(Number);
  const [destinationLongitude, destinationLatitude] = destination.map(Number);
  const routingUrl = (process.env.ROUTING_URL || DEFAULT_ROUTING_URL).replace(/\/+$/, "");
  const url = `${routingUrl}/${originLongitude},${originLatitude};${destinationLongitude},${destinationLatitude}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${url}?overview=false&alternatives=false&steps=false`, {
      headers: {
        Accept: "application/json",
        "User-Agent": process.env.ROUTING_USER_AGENT || "FoodEase/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Road route lookup is temporarily unavailable.");
    }

    const result = await response.json();
    const route = result?.routes?.[0];
    const distanceKm = Number(route?.distance) / 1000;
    const durationMinutes = Number(route?.duration) / 60;

    if (
      result?.code !== "Ok" ||
      !Number.isFinite(distanceKm) ||
      distanceKm <= 0 ||
      !Number.isFinite(durationMinutes) ||
      durationMinutes <= 0
    ) {
      throw new Error("No driving route was found for these locations.");
    }

    return { distanceKm, durationMinutes };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Road route lookup took too long. Please try again.");
    }
    if (!error.message?.toLowerCase().includes("route")) {
      throw new Error("Road route lookup is temporarily unavailable.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = getRoadDistance;
