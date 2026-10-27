
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../css/CustomerDashboard.css";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(date) {
  if (!date) return "DATE UNAVAILABLE";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "DATE UNAVAILABLE";
  }

  return parsedDate
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchOrders() {
      setLoadingOrders(true);
      setOrderError("");

      try {
        const response = await api.get("/orders/customer");

        if (active) {
          setOrders(
            Array.isArray(response.data.orders)
              ? response.data.orders
              : []
          );
        }
      } catch (error) {
        if (active) {
          setOrderError(
            error.response?.data?.message ||
              "Unable to load your orders. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoadingOrders(false);
        }
      }
    }

    fetchOrders();

    return () => {
      active = false;
    };
  }, []);

  const mealsCount = orders.reduce(
    (total, order) =>
      total +
      (order.items || []).reduce(
        (itemTotal, item) => itemTotal + (Number(item.quantity) || 0),
        0
      ),
    0
  );

  const restaurantCount = new Set(
    orders
      .map((order) => order.restaurant?._id || order.restaurant)
      .filter(Boolean)
      .map(String)
  ).size;

  return (
    <>
      <Navbar />

      <main className="customer-dashboard">
        <section className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">YOUR FOODEASE</p>

            <h1>
              Welcome,
              <br />
              <span>{user?.username?.toUpperCase() || "CUSTOMER"}.</span>
            </h1>
          </div>

          <div className="dashboard-header-meta">
            <span>ACCOUNT / 01</span>
            <span>EST. 2026</span>
          </div>
        </section>

        <section className="dashboard-overview">
          <div className="dashboard-stat">
            <span>ORDERS</span>
            <strong>{loadingOrders ? "—" : orders.length}</strong>
            <p>Total orders</p>
          </div>

          <div className="dashboard-stat">
            <span>MEALS ORDERED</span>
            <strong>{loadingOrders ? "—" : mealsCount}</strong>
            <p>Items across your orders</p>
          </div>

          <div className="dashboard-stat">
            <span>RESTAURANTS</span>
            <strong>{loadingOrders ? "—" : restaurantCount}</strong>
            <p>Restaurants ordered from</p>
          </div>

          <div className="dashboard-stat dashboard-stat-action">
            <Link to="/restaurants">
              FIND SOMETHING
              <span>→</span>
            </Link>
          </div>
        </section>

        <section className="dashboard-content">
          <div className="dashboard-orders">
            <div className="dashboard-section-heading">
              <div>
                <p>01 / ACTIVITY</p>
                <h2>Recent orders.</h2>
              </div>
              <span>{orders.length} ORDERS</span>
            </div>

            {loadingOrders ? (
              <div className="orders-list">
                <p>Loading your orders...</p>
              </div>
            ) : orderError ? (
              <div className="orders-list">
                <p role="alert">{orderError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  RETRY
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="orders-list">
                <p>You haven't placed any orders yet.</p>
                <Link to="/restaurants">EXPLORE RESTAURANTS</Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <article className="order-row" key={order._id}>
                    <div className="order-number">
                      <span>
                        #{String(order._id).slice(-8).toUpperCase()}
                      </span>
                      <small>{formatDate(order.createdAt)}</small>
                    </div>

                    <div className="order-info">
                      <h3>
                        {order.restaurant?.restaurantName ||
                          "Restaurant"}
                      </h3>
                      <p>
                        {(order.items || [])
                          .map(
                            (item) =>
                              `${item.name} × ${item.quantity}`
                          )
                          .join(", ")}
                      </p>
                    </div>

                    <div className="order-status">
                      <span>
                        {(order.orderStatus || "placed")
                          .replaceAll("_", " ")
                          .toUpperCase()}
                      </span>
                      <strong>{formatCurrency(order.totalAmount)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="dashboard-side">
            <div className="dashboard-profile">
              <p>02 / PROFILE</p>

              <div className="profile-initial">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>

              <h3>{user?.username?.toUpperCase() || "CUSTOMER"}</h3>
              <span>{user?.email || ""}</span>
            </div>

            <div className="dashboard-saver">
              <span>FOODSAVER</span>

              <h3>
                Less waste.
                <br />
                <em>More taste.</em>
              </h3>

              <p>
                Discover meals from restaurants at reduced prices
                while helping prevent good food from going to waste.
              </p>

              <Link to="/restaurants">
                EXPLORE FOODSAVER
                <span>→</span>
              </Link>
            </div>
          </aside>
        </section>

        <section className="dashboard-footer">
          <span>FOOD / PEOPLE / PLACES</span>

          <Link to="/restaurants">
            CONTINUE DISCOVERING
            <span>→</span>
          </Link>
        </section>
      </main>
    </>
  );
}

export default CustomerDashboard;
