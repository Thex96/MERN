import { useEffect, useState } from "react";
import "../css/FeaturedRestaurants.css";
import { Link } from "react-router-dom";
import RestaurantCard from "./RestaurantCard";
import api from "../api/axios";

function FeaturedRestaurants() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    let active = true;
    api.get("/restaurants/approved").then(({ data }) => {
      if (!active) return;
      setRestaurants((data.restaurants || []).slice(0, 3).map((record) => ({
        id: record._id,
        name: record.restaurantName,
        cuisine: record.cuisine,
        rating: "NEW",
        image: record.imageUrl,
      })));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <section className="featured-restaurants">
      <div className="featured-header">
        <div>
          <p className="section-label">FEATURED</p>

          <h2>
            The places
            <br />
            worth discovering.
          </h2>
        </div>

        <Link to="/restaurants" className="view-all-button">
          VIEW ALL RESTAURANTS
          <span>→</span>
        </Link>
      </div>

      <div className="restaurants-grid">
        {restaurants.map((restaurant) => (
          <Link to={`/restaurants/${restaurant.id}`} key={restaurant.id}>
            <RestaurantCard restaurant={restaurant} />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default FeaturedRestaurants;
