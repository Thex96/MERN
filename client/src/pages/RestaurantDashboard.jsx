import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import RestaurantRegistration from "./RestaurantRegistration";
import api from "../api/axios";
import "../css/RestaurantDashboard.css";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

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

  return (
    <>
      <Navbar />
      <main className="restaurant-dashboard">
        <header className="restaurant-dashboard-header">
          <div>
            <p className="restaurant-dashboard-eyebrow">FOODEASE / RESTAURANT MANAGER</p>
            <h1>{user?.username || "Manager"}<span>.</span></h1>
            <p className="restaurant-dashboard-intro">Manage restaurant applications and approved locations.</p>
          </div>
          <Link to="/restaurant-registration" className="restaurant-registration-link">SUBMIT A RESTAURANT <span>→</span></Link>
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
                <div><p>01 / PARTNER APPLICATIONS</p><h2>Your restaurants.</h2></div>
                <button type="button" className="manager-add-button" onClick={() => setShowApplicationForm((show) => !show)}>
                  {showApplicationForm ? "CLOSE FORM" : "+ ADD RESTAURANT"}
                </button>
              </div>

              {restaurants.length === 0 ? (
                <p className="manager-empty">No restaurant application yet. Submit your first restaurant below.</p>
              ) : restaurants.some((restaurant) => restaurant.status === "approved") && (
                <div className="manager-approved-carousel" aria-label="Approved restaurants">
                  {restaurants.filter((restaurant) => restaurant.status === "approved").map((restaurant) => (
                    <button type="button" className={`manager-approved-card${selectedRestaurant?._id === restaurant._id ? " is-selected" : ""}`} key={restaurant._id} onClick={() => { setOrders([]); setSelectedId(restaurant._id); }}>
                      {restaurant.imageUrl && <img src={restaurant.imageUrl} alt="" />}
                      <span className="manager-approved-status">APPROVED</span>
                      <strong>{restaurant.restaurantName}</strong>
                      <small>{[restaurant.cuisine, restaurant.city].filter(Boolean).join(" · ")}</small>
                    </button>
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
                      </div>
                      <span className={`manager-status manager-status-${restaurant.status}`}>{restaurant.status.toUpperCase()}</span>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {(showApplicationForm || restaurants.length === 0) && (
              <section className="manager-application-form">
                <RestaurantRegistration embedded onSubmitted={loadRestaurants} />
              </section>
            )}

            {approvedRestaurants.length > 0 && (
              <section className="manager-tools">
                <div className="restaurant-dashboard-section-heading">
                  <div><p>02 / APPROVED RESTAURANT TOOLS</p><h2>Restaurant management.</h2></div>
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
                      <article><span>PAID ORDERS</span><strong>{orders.length}</strong><p>Confirmed payments</p></article>
                      <article><span>ACTIVE ORDERS</span><strong>{activeOrders}</strong><p>Orders not yet completed</p></article>
                      <article><span>DELIVERED</span><strong>{deliveredOrders}</strong><p>Successfully delivered</p></article>
                      <article><span>PAID ORDER VALUE</span><strong>{formatCurrency(totalRevenue)}</strong><p>Total returned paid orders</p></article>
                    </section>
                    <section className="restaurant-dashboard-orders">
                      <div className="restaurant-dashboard-section-heading"><div><p>ORDER MANAGEMENT</p><h2>Incoming orders.</h2></div><span>{orders.length} PAID ORDERS</span></div>
                      {orders.length === 0 ? <div className="manager-empty">No paid orders yet. Orders for this approved restaurant will appear here.</div> : (
                        <div className="restaurant-dashboard-order-list">
                          {orders.map((order) => (
                            <article className="restaurant-dashboard-order" key={order._id}>
                              <div><span>ORDER #{String(order._id).slice(-8).toUpperCase()}</span><small>{formatDate(order.createdAt)}</small></div>
                              <div><span>CUSTOMER</span><strong>{order.customer?.username || "Customer"}</strong></div>
                              <div><span>ITEMS</span><p>{(order.items || []).map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p></div>
                              <div><span>PAID TOTAL</span><strong>{formatCurrency(order.totalAmount)}</strong><small>{(order.orderStatus || "placed").replaceAll("_", " ").toUpperCase()}</small></div>
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
