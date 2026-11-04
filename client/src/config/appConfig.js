export const appConfig = Object.freeze({
  name: import.meta.env.VITE_APP_NAME || "FoodEase",
  currency: import.meta.env.VITE_CURRENCY || "INR",
  locale: import.meta.env.VITE_LOCALE || "en-IN",
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export function formatCurrency(amount) {
  return new Intl.NumberFormat(appConfig.locale, {
    style: "currency",
    currency: appConfig.currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}
