
import "../css/RestaurantDashboard.css";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function RestaurantDashboard() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />

      <main className="restaurant-dashboard">
        <section className="restaurant-dashboard-header">
          <div>
            <p className="restaurant-dashboard-eyebrow">
              RESTAURANT MANAGEMENT / OVERVIEW
            </p>

            <h1>
              Your kitchen,
              <br />
              <span>your business.</span>
            </h1>

            <p className="restaurant-dashboard-intro">
              Welcome, {user?.username || "Restaurant owner"}.
              Manage your restaurant, menu, and incoming orders
              from one place.
            </p>
          </div>

          <div className="restaurant-dashboard-meta">
            <span>FOODEASE / PARTNER</span>
            <span>APPLICATION STATUS</span>
            <strong>NOT SUBMITTED</strong>
          </div>
        </section>

        <section className="restaurant-dashboard-stats">
          <article>
            <span>TOTAL ORDERS</span>
            <strong>—</strong>
            <p>Awaiting live data</p>
          </article>

          <article>
            <span>REVENUE</span>
            <strong>—</strong>
            <p>Awaiting live data</p>
          </article>

          <article>
            <span>MENU ITEMS</span>
            <strong>—</strong>
            <p>Awaiting live data</p>
          </article>

          <article>
            <span>RESTAURANT STATUS</span>
            <strong>Not active</strong>
            <p>Approval required</p>
          </article>
        </section>

        <section className="restaurant-dashboard-content">
          <div className="restaurant-dashboard-main">
            <div className="restaurant-dashboard-section-heading">
              <div>
                <p>01 / GET STARTED</p>
                <h2>Build your presence.</h2>
              </div>
            </div>

            <div className="restaurant-dashboard-task">
              <span>01</span>
              <div>
                <h3>Register your restaurant</h3>
                <p>
                  Add your restaurant name, address, cuisine,
                  opening hours, and contact details.
                </p>
              </div>
              <span className="restaurant-task-status">
                NOT STARTED
              </span>
            </div>

            <div className="restaurant-dashboard-task">
              <span>02</span>
              <div>
                <h3>Submit for approval</h3>
                <p>
                  Send your restaurant details to the FoodEase
                  admin team for review.
                </p>
              </div>
              <span className="restaurant-task-status">
                NOT STARTED
              </span>
            </div>

            <div className="restaurant-dashboard-task">
              <span>03</span>
              <div>
                <h3>Prepare your menu</h3>
                <p>
                  Organise your dishes, descriptions, prices,
                  and availability.
                </p>
              </div>
              <span className="restaurant-task-status">
                LOCKED
              </span>
            </div>
          </div>

          <aside className="restaurant-dashboard-side">
            <p>02 / YOUR NEXT STEP</p>

            <h2>
              From your
              <br />
              kitchen to
              <br />
              <em>their table.</em>
            </h2>

            <p>
              Start by registering your restaurant. Once your
              application is approved, you can prepare your
              menu and manage orders through FoodEase.
            </p>

            <Link
              to="/restaurant-registration"
              className="restaurant-registration-link"
            >
              RESTAURANT REGISTRATION
              <span aria-hidden="true">→</span>
            </Link>

            <small>
              Submit your restaurant details for admin approval.
            </small>
          </aside>
        </section>

        <footer className="restaurant-dashboard-footer">
          <span>FOOD / PEOPLE / PLACES</span>
          <Link to="/">
            BACK TO FOODEASE <span>↗</span>
          </Link>
        </footer>
      </main>
    </>
  );
}

export default RestaurantDashboard;
