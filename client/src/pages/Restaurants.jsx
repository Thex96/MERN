import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/Restaurants.css";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";

function Restaurants() {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState({ city: "", state: "" });

  const [locationOpen, setLocationOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [approved, setApproved] = useState([]);
  const [deliveryCoordinates, setDeliveryCoordinates] = useState(null);

  useEffect(() => {
    api.get("/restaurants/approved").then(({ data }) => {
      const records = Array.isArray(data.restaurants) ? data.restaurants : [];
      setApproved(records);
      setSelectedLocation((current) => current.city || !records.length ? current : { city: records[0].city || "", state: records[0].state || "" });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.role !== "customer") return;
    api.get("/addresses").then(({ data }) => {
      const savedAddresses = Array.isArray(data.addresses) ? data.addresses : [];
      const address = savedAddresses.find((item) => item.isDefault) || savedAddresses[0];
      const coordinates = address?.location?.coordinates;
      if (address?.city) setSelectedLocation({ city: address.city, state: address.state });
      if (coordinates?.length === 2) {
        setDeliveryCoordinates(coordinates);
      }
    }).catch(() => {});
  }, [user?.role]);

  const availableLocations = useMemo(() => {
    const locations = approved.map((restaurant) => ({ city: restaurant.city, state: restaurant.state }));
    return locations.filter((loc, index, all) => loc.city && all.findIndex((other) => other.city.toLowerCase() === loc.city.toLowerCase() && other.state === loc.state) === index);
  }, [approved]);

  const filteredLocations = availableLocations.filter((location) =>
    `${location.city} ${location.state}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const distanceBetween = (coordinates) => {
    if (!deliveryCoordinates || coordinates?.length !== 2) return null;
    const radians = (degrees) => degrees * Math.PI / 180;
    const [fromLongitude, fromLatitude] = deliveryCoordinates;
    const [toLongitude, toLatitude] = coordinates;
    const latitudeDifference = radians(toLatitude - fromLatitude);
    const longitudeDifference = radians(toLongitude - fromLongitude);
    const value = Math.sin(latitudeDifference / 2) ** 2 + Math.cos(radians(fromLatitude)) * Math.cos(radians(toLatitude)) * Math.sin(longitudeDifference / 2) ** 2;
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)) * 10) / 10;
  };
  const approvedForLocation = approved.filter((r) =>
    !selectedLocation.city || (
      r.city?.toLowerCase() === selectedLocation.city.toLowerCase() &&
      (r.state || "").toLowerCase() === (selectedLocation.state || "").toLowerCase()
    )
  ).map((r) => ({
    id: r._id, name: r.restaurantName, cuisine: r.cuisine, rating: "NEW", city: r.city,
    image: r.imageUrl, approvedRecord: true, distanceKm: distanceBetween(r.location?.coordinates),
  })).sort((left, right) => (left.distanceKm ?? Number.MAX_SAFE_INTEGER) - (right.distanceKm ?? Number.MAX_SAFE_INTEGER));
  const filteredRestaurants = approvedForLocation;

  function selectLocation(location) {
    setSelectedLocation(location);
    setDeliveryCoordinates(null);
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
                {selectedLocation.city || "SELECT A CITY"}
              </span>

              <span className="location-arrow" aria-hidden="true">⌄</span>
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
                      key={`${location.city}-${location.state}`}
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
              {selectedLocation.city ? "Places worth discovering in:" : "Approved restaurants"}
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
                      <span>{restaurant.city}</span>
                      {restaurant.distanceKm !== null && restaurant.distanceKm !== undefined && <span>{restaurant.distanceKm} KM AWAY</span>}
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
