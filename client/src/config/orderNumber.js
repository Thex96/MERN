export function getOrderNumber(order) {
  if (order?.orderNumber) return order.orderNumber;

  const date = new Date(order?.createdAt);
  const datePart = Number.isNaN(date.getTime())
    ? "ORDER"
    : `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const idPart = String(order?._id || "").slice(-4).toUpperCase();

  return idPart ? `FE-${datePart}-${idPart}` : `FE-${datePart}`;
}
