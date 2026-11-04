import "../css/Footer.css";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Footer() {
  const { user } = useAuth();
  const dashboardPath = user?.role === "restaurant"
    ? "/restaurant-dashboard"
    : user?.role === "admin"
      ? "/adminpage"
      : "/dashboard";

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <h2>FOODEASE</h2>

          <p>
            Good food.
            <br />
            Great choices.
          </p>
        </div>

        <div className="footer-column">
          <h3>EXPLORE</h3>

          <Link to="/restaurants">Restaurants</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/">Popular dishes</Link>
        </div>

        <div className="footer-column">
          <h3>COMPANY</h3>

          <Link to="/about">About</Link>
          <span className="footer-unavailable" aria-disabled="true">Contact (unavailable)</span>
          <span className="footer-unavailable" aria-disabled="true">Careers (unavailable)</span>
          <Link to="/signup?intent=restaurant">Partner with us</Link>
        </div>

        <div className="footer-column">
          <h3>ACCOUNT</h3>

          <Link to="/login">Login</Link>
          <Link to="/signup">Sign Up</Link>
          <Link to={dashboardPath}>My Orders</Link>
          <Link to={dashboardPath}>Profile</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} FoodEase. All rights reserved.</p>

        <div className="footer-legal">
          <span className="footer-unavailable" aria-disabled="true">Privacy (unavailable)</span>
          <span className="footer-unavailable" aria-disabled="true">Terms (unavailable)</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
