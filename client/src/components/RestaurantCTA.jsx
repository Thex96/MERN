
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/RestaurantCTA.css";

function RestaurantCTA() {
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleBecomePartner() {
    if (user) {
      navigate("/restaurant-dashboard");
    } else {
      navigate("/signup?intent=restaurant");
    }
  }

  return (
    <section className="restaurant-cta">
      <div className="restaurant-cta-content">
        <p className="section-label">FOR RESTAURANTS</p>

        <h2>
          Your food.
          <br />
          Our platform.
        </h2>

        <p className="restaurant-cta-description">
          Bring your restaurant to FoodEase, reach new customers,
          manage orders, understand your business, and grow with
          powerful tools built for modern restaurants.
        </p>

        <button
          type="button"
          className="restaurant-cta-button"
          onClick={handleBecomePartner}
        >
          BECOME A PARTNER
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="restaurant-cta-side">
        <span>FOODEASE</span>
        <p>BUILT FOR RESTAURANTS</p>
      </div>
    </section>
  );
}

export default RestaurantCTA;
