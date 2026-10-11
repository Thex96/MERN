import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "../css/CustomerDashboard.css";

const orders = [
  {
    id: "#FE-1028",
    restaurant: "The Spice Room",
    items: "Chicken Biryani, Paneer Tikka",
    amount: "₹600",
    status: "DELIVERED",
    date: "08 OCT 2026",
  },
  {
    id: "#FE-1024",
    restaurant: "Casa Verde",
    items: "Margherita Pizza, Tiramisu",
    amount: "₹720",
    status: "DELIVERED",
    date: "04 OCT 2026",
  },
  {
    id: "#FE-1019",
    restaurant: "Madras Table",
    items: "Masala Dosa, Filter Coffee",
    amount: "₹280",
    status: "DELIVERED",
    date: "29 SEP 2026",
  },
];

function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />

      <main className="customer-dashboard">
        <section className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              YOUR FOODEASE
            </p>

            <h1>
              Welcome,
              <br />
              <span>
                {user?.username?.toUpperCase()}.
              </span>
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
            <strong>12</strong>
            <p>Total orders</p>
          </div>

          <div className="dashboard-stat">
            <span>FOODSAVER</span>
            <strong>04</strong>
            <p>Meals saved</p>
          </div>

          <div className="dashboard-stat">
            <span>SAVED</span>
            <strong>07</strong>
            <p>Restaurants</p>
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

              <span>VIEW ALL</span>
            </div>

            <div className="orders-list">
              {orders.map((order) => (
                <article
                  className="order-row"
                  key={order.id}
                >
                  <div className="order-number">
                    <span>{order.id}</span>
                    <small>{order.date}</small>
                  </div>

                  <div className="order-info">
                    <h3>{order.restaurant}</h3>
                    <p>{order.items}</p>
                  </div>

                  <div className="order-status">
                    <span>{order.status}</span>
                    <strong>{order.amount}</strong>
                  </div>

                  <button type="button">
                    VIEW
                    <span>↗</span>
                  </button>
                </article>
              ))}
            </div>
          </div>

          <aside className="dashboard-side">
            <div className="dashboard-profile">
              <p>02 / PROFILE</p>

              <div className="profile-initial">
                {user?.username?.charAt(0).toUpperCase()}
              </div>

              <h3>
                {user?.username?.toUpperCase()}
              </h3>

              <span>{user?.email}</span>

              <button type="button">
                EDIT PROFILE
                <span>→</span>
              </button>
            </div>

            <div className="dashboard-saver">
              <span>FOODSAVER</span>

              <h3>
                Less waste.
                <br />
                <em>More taste.</em>
              </h3>

              <p>
                Discover meals from restaurants at
                reduced prices while helping prevent
                good food from going to waste.
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