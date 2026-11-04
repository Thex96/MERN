import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import "../css/Restaurant.css";
import api from "../api/axios";
import { formatCurrency } from "../config/appConfig";
import { useAuth } from "../context/useAuth";

function Restaurant() {
  const { restaurantId } = useParams();
  const { addToCart, cartItems } = useCart();
  const { user } = useAuth();
  const [approvedRestaurant, setApprovedRestaurant] = useState(null);
  const [loadedRestaurantId, setLoadedRestaurantId] = useState("");
  const restaurant = approvedRestaurant?.id === restaurantId ? approvedRestaurant : null;
  const lookupDone = loadedRestaurantId === restaurantId;

  useEffect(() => {
    let active = true;
    api.get("/restaurants/approved").then(({ data }) => {
      const record = (data.restaurants || []).find((item) => item._id === restaurantId);
      if (active && record) {
        const categories = [...new Set((record.menu || []).map((item) => item.category || "MENU"))].map((name) => ({
          name: name.toUpperCase(),
          items: record.menu.filter((item) => (item.category || "MENU") === name).map((item) => ({ ...item, price: Number(item.price), image: item.imageUrl || record.imageUrl })),
        }));
        setApprovedRestaurant({
          id: record._id, name: record.restaurantName, cuisine: record.cuisine,
          rating: "NEW",
          city: record.city || record.state || "FOODEASE", image: record.imageUrl,
          description: record.description, categories, approvedRecord: true,
        });
      }
    }).catch(() => {}).finally(() => { if (active) setLoadedRestaurantId(restaurantId); });
    return () => { active = false; };
  }, [restaurantId]);

  if (!restaurant && !lookupDone) {
    return <><Navbar /><main className="restaurant-not-found"><p>LOADING RESTAURANT</p></main></>;
  }

  if (!restaurant) {
    return (
      <>
        <Navbar />

        <main className="restaurant-not-found">
          <p>RESTAURANT NOT FOUND</p>

          <h1>
            We couldn't find
            <br />
            that restaurant.
          </h1>

          <Link to="/restaurants">
            ← BACK TO RESTAURANTS
          </Link>
        </main>
      </>
    );
  }

  function handleAdd(item) {
    addToCart(item, restaurant);
  }

  function getItemQuantity(item) {
    const cartItem = cartItems.find(
      (cartItem) =>
        cartItem.name === item.name &&
        cartItem.restaurantId === restaurant.id
    );

    return cartItem ? cartItem.quantity : 0;
  }

  return (
    <>
      <Navbar />

      <main className="restaurant-page">
        <div className="restaurant-back">
          <Link to="/restaurants">
            ← BACK TO RESTAURANTS
          </Link>
        </div>

        <section className="restaurant-hero">
          <div className="restaurant-hero-image">
            <img
              src={restaurant.image}
              alt={restaurant.name}
            />
          </div>

          <div className="restaurant-hero-content">
            <p className="restaurant-label">
              {restaurant.city.toUpperCase()}
            </p>

            <h1>{restaurant.name}</h1>

            <p className="restaurant-cuisine">
              {restaurant.cuisine}
            </p>

            <p className="restaurant-description">
              {restaurant.description}
            </p>

            <div className="restaurant-details">
              <span>{restaurant.rating}</span>
              <span>{restaurant.city}</span>
            </div>
          </div>
        </section>

        <section className="restaurant-menu">
          <div className="restaurant-menu-heading">
            <p>MENU</p>

            <h2>
              Something worth
              <br />
              coming back for.
            </h2>
          </div>

          {restaurant.categories.length > 0 ? (
            restaurant.categories.map((category) => (
              <section
                className="restaurant-category"
                key={category.name}
              >
                <div className="restaurant-category-title">
                  <h3>{category.name}</h3>
                </div>

                <div className="restaurant-food-list">
                  {category.items.map((item) => {
                    const quantity = getItemQuantity(item);

                    return (
                      <article
                        className="restaurant-food-item"
                        key={item.name}
                      >
                        <div className="restaurant-food-image">
                          <img
                            src={item.image}
                            alt={item.name}
                          />
                        </div>

                        <div className="restaurant-food-content">
                          <div>
                            <h4>{item.name}</h4>

                            <p>{item.description}</p>
                          </div>

                          <div className="restaurant-food-action">
                            <span>{formatCurrency(item.price)}</span>

                            {user?.role === "customer" ? (
                              <button type="button" onClick={() => handleAdd(item)}>
                                {quantity > 0 ? `ADDED ${quantity}` : "ADD +"}
                              </button>
                            ) : (
                              <Link to="/login">SIGN IN TO ORDER</Link>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          ) : (
            <div className="restaurant-menu-empty">
              <h3>Menu coming soon.</h3>

              <p>
                We're preparing the menu for this restaurant.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default Restaurant;
