function setting(name, fallback = 0) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function localDateParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function isWithinPeakWindow(time, windows) {
  return windows.some((window) => {
    const [start, end] = window.split("-").map((part) => part.trim());
    if (!/^\d{2}:\d{2}$/.test(start || "") || !/^\d{2}:\d{2}$/.test(end || "")) {
      return false;
    }

    if (start <= end) return time >= start && time < end;
    return time >= start || time < end;
  });
}

function calculateDeliveryFee({ distanceKm, activeCityOrders, now = new Date() }) {
  const baseFee = setting("DELIVERY_BASE_FEE", 40);
  const feePerKm = setting("DELIVERY_FEE_PER_KM", 5);
  const distanceFee = roundMoney(distanceKm * feePerKm);
  const timezone = process.env.DELIVERY_TIMEZONE || "Asia/Kolkata";
  const local = localDateParts(now, timezone);
  const localTime = `${local.hour}:${local.minute}`;
  const peakWindows = (process.env.DELIVERY_PEAK_WINDOWS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const peakSurcharge = isWithinPeakWindow(localTime, peakWindows)
    ? setting("DELIVERY_PEAK_SURCHARGE", 0)
    : 0;
  const demandThreshold = setting("DELIVERY_DEMAND_THRESHOLD", 5);
  const demandSurchargePerOrder = setting("DELIVERY_DEMAND_SURCHARGE_PER_ORDER", 0);
  const demandSurcharge = activeCityOrders >= demandThreshold
    ? (activeCityOrders - demandThreshold + 1) * demandSurchargePerOrder
    : 0;
  const seasonalMonths = (process.env.DELIVERY_SEASONAL_MONTHS || "")
    .split(",")
    .map((month) => Number(month.trim()))
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12);
  const seasonalSurcharge = seasonalMonths.includes(Number(local.month))
    ? setting("DELIVERY_SEASONAL_SURCHARGE", 0)
    : 0;
  const trafficSurcharge = setting("DELIVERY_TRAFFIC_SURCHARGE", 0);
  const weatherSurcharge = setting("DELIVERY_WEATHER_SURCHARGE", 0);
  const surchargeCap = setting("DELIVERY_SURCHARGE_CAP", 50);
  const totalSurcharges = Math.min(
    surchargeCap,
    peakSurcharge + demandSurcharge + seasonalSurcharge + trafficSurcharge + weatherSurcharge
  );
  const cappedSurchargeRatio =
    peakSurcharge + demandSurcharge + seasonalSurcharge + trafficSurcharge + weatherSurcharge > surchargeCap
      ? surchargeCap /
        (peakSurcharge + demandSurcharge + seasonalSurcharge + trafficSurcharge + weatherSurcharge)
      : 1;
  const feeBreakdown = {
    baseFee: roundMoney(baseFee),
    distanceFee,
    peakSurcharge: roundMoney(peakSurcharge * cappedSurchargeRatio),
    demandSurcharge: roundMoney(demandSurcharge * cappedSurchargeRatio),
    seasonalSurcharge: roundMoney(seasonalSurcharge * cappedSurchargeRatio),
    trafficSurcharge: roundMoney(trafficSurcharge * cappedSurchargeRatio),
    weatherSurcharge: roundMoney(weatherSurcharge * cappedSurchargeRatio),
  };

  return {
    feeBreakdown,
    deliveryFee: roundMoney(baseFee + distanceFee + totalSurcharges),
    localTime,
    localMonth: Number(local.month),
  };
}

module.exports = { calculateDeliveryFee, roundMoney };
