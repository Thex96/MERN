import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";
import RestaurantRegistration from "./RestaurantRegistration";
import api from "../api/axios";
import { formatCurrency } from "../config/appConfig";
import { getOrderNumber } from "../config/orderNumber";
import "../css/RestaurantDashboard.css";

function formatDate(date) {
  if (!date) return "DATE UNAVAILABLE";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "DATE UNAVAILABLE";
  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [error, setError] = useState("");
  const [ordersError, setOrdersError] = useState("");

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/restaurants/mine");
      const savedRestaurants = Array.isArray(response.data.restaurants)
        ? response.data.restaurants
        : [];
      setRestaurants(savedRestaurants);
      if (!savedRestaurants.some((restaurant) => restaurant.status === "approved")) {
        setOrders([]);
      }
      setSelectedId((current) =>
        savedRestaurants.some((restaurant) => restaurant._id === current)
          ? current
          : savedRestaurants.find((restaurant) => restaurant.status === "approved")?._id || ""
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load your restaurant applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadRestaurants();
    });
    return () => { active = false; };
  }, [loadRestaurants]);

  const approvedRestaurants = useMemo(
    () => restaurants.filter((restaurant) => restaurant.status === "approved"),
    [restaurants]
  );
  const selectedRestaurant = approvedRestaurants.find((restaurant) => restaurant._id === selectedId)
    || approvedRestaurants[0]
    || null;
  const selectedRestaurantId = selectedRestaurant?._id || "";

  useEffect(() => {
    if (!selectedRestaurantId) return undefined;
    let active = true;
    async function loadOrders() {
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const response = await api.get(`/orders/restaurant?restaurantId=${selectedRestaurantId}`);
        if (active) setOrders(Array.isArray(response.data.orders) ? response.data.orders : []);
      } catch (requestError) {
        if (active) setOrdersError(requestError.response?.data?.message || "Unable to load restaurant orders.");
      } finally {
        if (active) setOrdersLoading(false);
      }
    }
    loadOrders();
    return () => { active = false; };
  }, [selectedRestaurantId]);

  const totalRevenue = orders.reduce((total, order) => total + (Number(order.totalAmount) || 0), 0);
  const activeOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.orderStatus)).length;
  const deliveredOrders = orders.filter((order) => order.orderStatus === "delivered").length;
  const nextOrderStatus = {
    placed: "confirmed",
    confirmed: "preparing",
    preparing: "ready",
    ready: "out_for_delivery",
    out_for_delivery: "delivered",
  };

  async function updateOrderStatus(order, orderStatus) {
    setOrdersError("");
    try {
      const response = await api.patch(`/orders/${order._id}/status`, { orderStatus });
      setOrders((current) => current.map((item) => item._id === order._id ? { ...item, orderStatus: response.data.order.orderStatus } : item));
    } catch (requestError) {
      setOrdersError(requestError.response?.data?.message || "Unable to update the order.");
    }
  }

  function openApplication(application = null) {
    setEditingApplication(application);
    setShowApplicationForm(true);
  }

  async function handleApplicationSubmitted() {
    setEditingApplication(null);
    setShowApplicationForm(false);
    await loadRestaurants();
  }

  return (
    <>
      <Navbar />
      <main className="restaurant-dashboard">
        <header className="restaurant-dashboard-header">
          <div>
            <p className="restaurant-dashboard-eyebrow">FOODEASE / RESTAURANT MANAGER</p>
            <h1>{user?.username || "Manager"}</h1>
            <p className="restaurant-dashboard-intro">Manage restaurant applications and approved locations.</p>
          </div>
          <button
            type="button"
            className="restaurant-registration-link"
            onClick={() => showApplicationForm
              ? (setShowApplicationForm(false), setEditingApplication(null))
              : openApplication()}
          >
            {showApplicationForm ? "CLOSE FORM" : "SUBMIT A RESTAURANT"}
            <span aria-hidden="true">{showApplicationForm ? "×" : "→"}</span>
          </button>
        </header>

        {loading ? (
          <section className="restaurant-dashboard-message">Loading your restaurant applications...</section>
        ) : error ? (
          <section className="restaurant-dashboard-message" role="alert">
            <p>{error}</p><button type="button" onClick={loadRestaurants}>TRY AGAIN</button>
          </section>
        ) : (
          <>
            <section className="manager-applications">
              <div className="restaurant-dashboard-section-heading">
                <div><p>PARTNER APPLICATIONS</p><h2>Your restaurants.</h2></div>
              </div>

              {restaurants.length === 0 ? (
                <p className="manager-empty">No restaurant application yet. Use Submit a Restaurant above to begin.</p>
              ) : restaurants.some((restaurant) => restaurant.status === "approved") && (
                  <div className="manager-approved-carousel" aria-label="Approved restaurants">
                  {restaurants.filter((restaurant) => restaurant.status === "approved").map((restaurant) => (
                    <div className="manager-approved-card-wrap" key={restaurant._id}>
                    <button type="button" className={`manager-approved-card${selectedRestaurant?._id === restaurant._id ? " is-selected" : ""}`} onClick={() => { setOrders([]); setSelectedId(restaurant._id); }}>
                      {restaurant.imageUrl && <img src={restaurant.imageUrl} alt="" />}
                      <span className="manager-approved-status">APPROVED</span>
                      <strong>{restaurant.restaurantName}</strong>
                      <small>{[restaurant.cuisine, restaurant.city].filter(Boolean).join(" · ")}</small>
                    </button>
                    <button type="button" className="manager-edit-button" onClick={() => openApplication(restaurant)}>EDIT RESTAURANT</button>
                    </div>
                  ))}
                </div>
              )}
              {restaurants.some((restaurant) => restaurant.status !== "approved") && (
                <div className="manager-application-list">
                  {restaurants.filter((restaurant) => restaurant.status !== "approved").map((restaurant) => (
                    <article className="manager-application-card" key={restaurant._id}>
                      <div>
                        <h3>{restaurant.restaurantName}</h3>
                        <p>{[restaurant.cuisine, restaurant.address].filter(Boolean).join(" · ")}</p>
                        {restaurant.rejectionReason && <p className="manager-rejection">Review note: {restaurant.rejectionReason}</p>}
                        {restaurant.submissionHistory?.length > 0 && <p>Last update: {new Date(restaurant.submissionHistory.at(-1).changedAt).toLocaleDateString("en-IN")}</p>}
                      </div>
                      <span className={`manager-status manager-status-${restaurant.status}`}>{restaurant.status.toUpperCase()}</span>
                      {restaurant.status === "rejected" && <button type="button" className="manager-edit-button" onClick={() => openApplication(restaurant)}>EDIT AND RESUBMIT</button>}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {showApplicationForm && (
              <section className="manager-application-form">
                <RestaurantRegistration key={editingApplication?._id || "new-application"} embedded applicationToEdit={editingApplication} onSubmitted={handleApplicationSubmitted} />
              </section>
            )}

            {approvedRestaurants.length > 0 && (
              <section className="manager-tools">
                <div className="restaurant-dashboard-section-heading">
                  <div><p>APPROVED RESTAURANT TOOLS</p><h2>Restaurant management.</h2></div>
                  {approvedRestaurants.length > 1 && (
                    <label className="manager-restaurant-select">SELECT RESTAURANT
                      <select value={selectedRestaurant?._id || ""} onChange={(event) => { setOrders([]); setSelectedId(event.target.value); }}>
                        {approvedRestaurants.map((restaurant) => <option key={restaurant._id} value={restaurant._id}>{restaurant.restaurantName}</option>)}
                      </select>
                    </label>
                  )}
                </div>
                {ordersLoading ? <p className="manager-empty">Loading orders...</p> : ordersError ? (
                  <p className="manager-empty" role="alert">{ordersError}</p>
                ) : (
                  <>
                    <section className="restaurant-dashboard-stats">
                      <article><span>ORDERS</span><strong>{orders.length}</strong><p>All customer orders</p></article>
                      <article><span>ACTIVE ORDERS</span><strong>{activeOrders}</strong><p>Orders not yet completed</p></article>
                      <article><span>DELIVERED</span><strong>{deliveredOrders}</strong><p>Successfully delivered</p></article>
                      <article><span>ORDER VALUE</span><strong>{formatCurrency(totalRevenue)}</strong><p>Value including delivery charges</p></article>
                    </section>
                    <section className="restaurant-dashboard-orders">
                      <div className="restaurant-dashboard-section-heading"><div><p>ORDER MANAGEMENT</p><h2>Incoming orders.</h2></div><span>{orders.length} ORDERS</span></div>
                      {orders.length === 0 ? <div className="manager-empty">No orders yet. Orders for this approved restaurant will appear here.</div> : (
                        <div className="restaurant-dashboard-order-list">
                          {orders.map((order) => (
                            <article className="restaurant-dashboard-order" key={order._id}>
                              <div><span>ORDER {getOrderNumber(order)}</span><small>{formatDate(order.createdAt)}</small></div>
                              <div><span>CUSTOMER</span><strong>{order.customer?.username || "Customer"}</strong></div>
                              <div><span>ITEMS</span><p>{(order.items || []).map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p></div>
                              <div><span>ORDER TOTAL</span><strong>{formatCurrency(order.totalAmount)}</strong><small>{(order.orderStatus || "placed").replaceAll("_", " ").toUpperCase()}</small></div>
                              {nextOrderStatus[order.orderStatus] && <button type="button" onClick={() => updateOrderStatus(order, nextOrderStatus[order.orderStatus])}>MARK {nextOrderStatus[order.orderStatus].replaceAll("_", " ").toUpperCase()}</button>}
                              {order.orderStatus === "placed" && <button type="button" onClick={() => updateOrderStatus(order, "cancelled")}>CANCEL ORDER</button>}
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )}
              </section>
            )}
          </>
        )}
        <footer className="restaurant-dashboard-footer"><span>FOODEASE / RESTAURANT PORTAL</span><Link to="/">VIEW STOREFRONT</Link></footer>
      </main>
    </>
  );
}

export default RestaurantDashboard;
