import "../css/FeaturedRestaurants.css";
import RestaurantCard from "./RestaurantCard";

import spiceroomImage from "../assets/images/spiceroom.jpg";
import casaverdeImage from "../assets/images/casaverde.jpg";
import emberhouseImage from "../assets/images/emberhouse.jpg";

const restaurants = [
  {
    name: "The Spice Room",
    cuisine: "Contemporary Indian",
    rating: "4.8",
    deliveryTime: "25–30 MIN",
    price: "₹₹",
    image: spiceroomImage,
  },
  {
    name: "Casa Verde",
    cuisine: "Modern Italian",
    rating: "4.7",
    deliveryTime: "30–35 MIN",
    price: "₹₹₹",
    image: casaverdeImage,
  },
  {
    name: "Ember House",
    cuisine: "Asian Fusion",
    rating: "4.9",
    deliveryTime: "20–25 MIN",
    price: "₹₹₹",
    image: emberhouseImage,
  },
];

function FeaturedRestaurants() {
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

        <button className="view-all-button">
          VIEW ALL RESTAURANTS
          <span>→</span>
        </button>
      </div>

      <div className="restaurants-grid">
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.name}
            restaurant={restaurant}
          />
        ))}
      </div>
    </section>
  );
}

export default FeaturedRestaurants;