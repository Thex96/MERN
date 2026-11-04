
import { Link } from "react-router-dom";
import "../css/RestaurantCTA.css";

function RestaurantCTA() {
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

        <Link to="/signup?intent=restaurant" className="restaurant-cta-button">
          BECOME A PARTNER
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="restaurant-cta-side">
        <span>FOODEASE</span>
        <p>BUILT FOR RESTAURANTS</p>
      </div>
    </section>
  );
}

export default RestaurantCTA;
