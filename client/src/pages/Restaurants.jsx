import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/Restaurants.css";
import api from "../api/axios";

import spiceroomImage from "../assets/images/spiceroom.jpg";
import casaverdeImage from "../assets/images/casaverde.jpg";
import madrastableImage from "../assets/images/madrastable.jpg";
import bayleafImage from "../assets/images/bayleaf.jpg";
import southernspiceImage from "../assets/images/southernspice.jpg";
import heritagekitchenImage from "../assets/images/heritagekitchen.jpg";

const locations = [
  {
    city: "Coimbatore",
    state: "Tamil Nadu",
  },
  {
    city: "Chennai",
    state: "Tamil Nadu",
  },
  {
    city: "Madurai",
    state: "Tamil Nadu",
  },
];

const restaurants = [
  {
    id: "the-spice-room",
    name: "The Spice Room",
    cuisine: "Contemporary Indian",
    rating: "4.8",
    deliveryTime: "25–30 MIN",
    price: "₹₹",
    city: "Coimbatore",
    image: spiceroomImage,
  },
  {
    id: "casa-verde",
    name: "Casa Verde",
    cuisine: "Modern Italian",
    rating: "4.7",
    deliveryTime: "30–35 MIN",
    price: "₹₹₹",
    city: "Coimbatore",
    image: casaverdeImage,
  },
  {
    id: "madras-table",
    name: "Madras Table",
    cuisine: "South Indian",
    rating: "4.9",
    deliveryTime: "20–25 MIN",
    price: "₹₹",
    city: "Chennai",
    image: madrastableImage,
  },
  {
    id: "bayleaf",
    name: "Bayleaf",
    cuisine: "Contemporary Indian",
    rating: "4.8",
    deliveryTime: "25–30 MIN",
    price: "₹₹₹",
    city: "Chennai",
    image: bayleafImage,
  },
  {
    id: "southern-spice",
    name: "Southern Spice",
    cuisine: "Tamil Cuisine",
    rating: "4.7",
    deliveryTime: "25–30 MIN",
    price: "₹₹",
    city: "Madurai",
    image: southernspiceImage,
  },
  {
    id: "heritage-kitchen",
    name: "Heritage Kitchen",
    cuisine: "South Indian",
    rating: "4.8",
    deliveryTime: "20–25 MIN",
    price: "₹₹",
    city: "Madurai",
    image: heritagekitchenImage,
  },
];

function Restaurants() {
  const [selectedLocation, setSelectedLocation] = useState(
    locations[0]
  );

  const [locationOpen, setLocationOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [approved, setApproved] = useState([]);

  useEffect(() => {
    api.get("/restaurants/approved").then(({ data }) => setApproved(data.restaurants || [])).catch(() => {});
  }, []);

  const availableLocations = useMemo(() => {
    const combined = [...locations, ...approved.map((r) => ({ city: r.city, state: r.state }))];
    return combined.filter((loc, index, all) => loc.city && all.findIndex((other) => other.city === loc.city && other.state === loc.state) === index);
  }, [approved]);

  const filteredLocations = availableLocations.filter((location) =>
    `${location.city} ${location.state}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const approvedForLocation = approved.filter((r) => r.city === selectedLocation.city).map((r) => ({
    id: r._id, name: r.restaurantName, cuisine: r.cuisine, rating: "NEW",
    deliveryTime: r.deliveryTime, price: r.priceRange, city: r.city,
    image: r.imageUrl, approvedRecord: true,
  }));
  const filteredRestaurants = [...restaurants.filter(
    (restaurant) =>
      restaurant.city === selectedLocation.city
  ), ...approvedForLocation];

  function selectLocation(location) {
    setSelectedLocation(location);
    setLocationOpen(false);
    setSearch("");
  }

  return (
    <>
      <Navbar />

      <main className="restaurants-page">
        <section className="location-picker-section">
          <div className="location-picker">
            <button
              className="location-button"
              onClick={() =>
                setLocationOpen(!locationOpen)
              }
            >
              <span>
                {selectedLocation.city},{" "}
                {selectedLocation.state}
              </span>

              <span className="location-arrow">
                {locationOpen ? "↑" : "↓"}
              </span>
            </button>

            {locationOpen && (
              <div className="location-dropdown">
                <p>SELECT LOCATION</p>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search city"
                  autoFocus
                />

                <div className="location-options">
                  {filteredLocations.map((location) => (
                    <button
                      key={location.city}
                      onClick={() =>
                        selectLocation(location)
                      }
                    >
                      <span>{location.city}</span>
                      <small>{location.state}</small>
                    </button>
                  ))}

                  {filteredLocations.length === 0 && (
                    <div className="no-location">
                      No locations found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="restaurants-heading">
          <div>
            <p className="restaurants-label">
              DISCOVER
            </p>

            <h1>
              Places worth discovering in:
              <br />
              <span>{selectedLocation.city}</span>
            </h1>
          </div>

          <span className="restaurant-count">
            {filteredRestaurants.length} RESTAURANTS
          </span>
        </section>

        <section className="restaurants-results">
          {filteredRestaurants.length > 0 ? (
            <div className="restaurants-page-grid">
              {filteredRestaurants.map((restaurant) => (
                <Link
                  to={`/restaurants/${restaurant.id}`}
                  className="restaurants-page-card"
                  key={restaurant.id}
                >
                  <div className="restaurants-page-image">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                    />

                    <span>{restaurant.rating}</span>
                  </div>

                  <div className="restaurants-page-info">
                    <div>
                      <h2>{restaurant.name}</h2>
                      <p>{restaurant.cuisine}</p>
                    </div>

                    <div className="restaurants-page-meta">
                      <span>
                        {restaurant.deliveryTime}
                      </span>

                      <span>
                        {restaurant.price}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="no-restaurants">
              <h2>
                No restaurants available yet.
              </h2>

              <p>
                We're expanding FoodEase to{" "}
                {selectedLocation.city}.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default Restaurants;
