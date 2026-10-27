
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
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

  if (Number.isNaN(parsedDate.getTime())) {
    return "DATE UNAVAILABLE";
  }

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
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchOrders() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/orders/restaurant");

        if (!active) return;

        setRestaurant(response.data.restaurant || null);
        setOrders(
          Array.isArray(response.data.orders)
            ? response.data.orders
            : []
        );
      } catch (requestError) {
        if (!active) return;

        setError(
          requestError.response?.data?.message ||
            "Unable to load restaurant orders."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchOrders();

    return () => {
      active = false;
    };
  }, []);

  const totalRevenue = orders.reduce(
    (total, order) => total + (Number(order.totalAmount) || 0),
    0
  );

  const activeOrders = orders.filter(
    (order) =>
      !["delivered", "cancelled"].includes(order.orderStatus)
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.orderStatus === "delivered"
  ).length;

  return (
    <>
      <Navbar />

      <main className="restaurant-dashboard">
        <header className="restaurant-dashboard-header">
          <div>
            <p className="restaurant-dashboard-eyebrow">
              FOODEASE / RESTAURANT MANAGEMENT
            </p>

            <h1>
              {restaurant?.restaurantName ||
                user?.username ||
                "Restaurant"}
              <span>.</span>
            </h1>

            <p className="restaurant-dashboard-subtitle">
              Orders and performance overview
            </p>
          </div>

          <Link to="/profile" className="restaurant-dashboard-profile-link">
            ACCOUNT DETAILS
          </Link>
        </header>

        {loading ? (
          <section className="restaurant-dashboard-message">
            Loading your restaurant orders...
          </section>
        ) : error ? (
          <section className="restaurant-dashboard-message" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              TRY AGAIN
            </button>
          </section>
        ) : (
          <>
            <section className="restaurant-dashboard-stats">
              <article className="restaurant-dashboard-stat">
                <span>PAID ORDERS</span>
                <strong>{orders.length}</strong>
                <p>Orders with confirmed payment</p>
              </article>

              <article className="restaurant-dashboard-stat">
                <span>ACTIVE ORDERS</span>
                <strong>{activeOrders}</strong>
                <p>Orders not yet completed</p>
              </article>

              <article className="restaurant-dashboard-stat">
                <span>DELIVERED</span>
                <strong>{deliveredOrders}</strong>
                <p>Successfully delivered orders</p>
              </article>

              <article className="restaurant-dashboard-stat">
                <span>PAID ORDER VALUE</span>
                <strong>{formatCurrency(totalRevenue)}</strong>
                <p>Total value of returned paid orders</p>
              </article>
            </section>

            <section className="restaurant-dashboard-orders">
              <div className="restaurant-dashboard-section-heading">
                <div>
                  <p>01 / ORDER MANAGEMENT</p>
                  <h2>Incoming orders.</h2>
                </div>

                <span>{orders.length} PAID ORDERS</span>
              </div>

              {orders.length === 0 ? (
                <div className="restaurant-dashboard-empty">
                  <h3>No paid orders yet.</h3>
                  <p>
                    Paid orders for your approved restaurant will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="restaurant-dashboard-order-list">
                  {orders.map((order) => (
                    <article
                      className="restaurant-dashboard-order"
                      key={order._id}
                    >
                      <div className="restaurant-order-reference">
                        <span>
                          ORDER #{String(order._id).slice(-8).toUpperCase()}
                        </span>
                        <small>{formatDate(order.createdAt)}</small>
                      </div>

                      <div className="restaurant-order-customer">
                        <span>CUSTOMER</span>
                        <strong>
                          {order.customer?.username || "Customer"}
                        </strong>
                      </div>

                      <div className="restaurant-order-items">
                        <span>ITEMS</span>
                        <p>
                          {(order.items || [])
                            .map(
                              (item) =>
                                `${item.name} × ${item.quantity}`
                            )
                            .join(", ")}
                        </p>
                      </div>

                      <div className="restaurant-order-total">
                        <span>PAID TOTAL</span>
                        <strong>{formatCurrency(order.totalAmount)}</strong>
                        <small>
                          {(order.orderStatus || "placed")
                            .replaceAll("_", " ")
                            .toUpperCase()}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <footer className="restaurant-dashboard-footer">
          <span>FOODEASE / RESTAURANT PORTAL</span>
          <Link to="/">VIEW STOREFRONT</Link>
        </footer>
      </main>
    </>
  );
}

export default RestaurantDashboard;
