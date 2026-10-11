import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import "../css/Restaurant.css";

import spiceroomImage from "../assets/images/spiceroom.jpg";
import casaverdeImage from "../assets/images/casaverde.jpg";
import madrastableImage from "../assets/images/madrastable.jpg";
import bayleafImage from "../assets/images/bayleaf.jpg";
import southernspiceImage from "../assets/images/southernspice.jpg";
import heritagekitchenImage from "../assets/images/heritagekitchen.jpg";
import chickentikkaImage from "../assets/images/chickentikka.jpg";
import paneertikkaImage from "../assets/images/paneertikka.jpg";
import chickenbiryaniImage from "../assets/images/chickenbiryani.jpg";
import butterchickenImage from "../assets/images/butterchicken.jpg";
import gulabjamunImage from "../assets/images/gulabjamun.jpg";
import kulfiImage from "../assets/images/kulfi.jpg";

const restaurants = {
  "the-spice-room": {
    id: "the-spice-room",
    name: "The Spice Room",
    cuisine: "Contemporary Indian Cuisine",
    rating: "4.8",
    deliveryTime: "25–30 MIN",
    price: "₹₹",
    city: "Coimbatore",
    image: spiceroomImage,
    description:
      "A contemporary Indian kitchen bringing familiar flavours together with a modern approach.",
    categories: [
      {
        name: "STARTERS",
        items: [
          {
            name: "Chicken Tikka",
            description:
              "Charcoal grilled chicken marinated with aromatic Indian spices.",
            price: "₹320",
            image: chickentikkaImage,
          },
          {
            name: "Paneer Tikka",
            description:
              "Charred paneer with peppers, onions and a house spice blend.",
            price: "₹280",
            image: paneertikkaImage,
          },
        ],
      },
      {
        name: "MAIN COURSE",
        items: [
          {
            name: "Chicken Biryani",
            description:
              "Slow cooked basmati rice layered with spiced chicken and herbs.",
            price: "₹320",
            image: chickenbiryaniImage,
          },
          {
            name: "Butter Chicken",
            description:
              "Tender chicken in a rich tomato and butter based gravy.",
            price: "₹360",
            image: butterchickenImage,
          },
        ],
      },
      {
        name: "DESSERTS",
        items: [
          {
            name: "Gulab Jamun",
            description:
              "Warm milk dumplings finished with a light sugar syrup.",
            price: "₹160",
            image: gulabjamunImage,
          },
          {
            name: "Kulfi",
            description:
              "Traditional Indian frozen dessert with cardamom and pistachio.",
            price: "₹180",
            image: kulfiImage,
          },
        ],
      },
    ],
  },

  "casa-verde": {
    id: "casa-verde",
    name: "Casa Verde",
    cuisine: "Modern Italian",
    rating: "4.7",
    deliveryTime: "30–35 MIN",
    price: "₹₹₹",
    city: "Coimbatore",
    image: casaverdeImage,
    description:
      "Modern Italian dining with handmade pasta, wood-fired favourites and seasonal ingredients.",
    categories: [],
  },

  "madras-table": {
    id: "madras-table",
    name: "Madras Table",
    cuisine: "South Indian",
    rating: "4.9",
    deliveryTime: "20–25 MIN",
    price: "₹₹",
    city: "Chennai",
    image: madrastableImage,
    description:
      "Classic South Indian flavours presented with a contemporary dining experience.",
    categories: [],
  },

  bayleaf: {
    id: "bayleaf",
    name: "Bayleaf",
    cuisine: "Contemporary Indian",
    rating: "4.8",
    deliveryTime: "25–30 MIN",
    price: "₹₹₹",
    city: "Chennai",
    image: bayleafImage,
    description:
      "Contemporary Indian cuisine built around seasonal ingredients and bold flavours.",
    categories: [],
  },

  "southern-spice": {
    id: "southern-spice",
    name: "Southern Spice",
    cuisine: "Tamil Cuisine",
    rating: "4.7",
    deliveryTime: "25–30 MIN",
    price: "₹₹",
    city: "Madurai",
    image: southernspiceImage,
    description:
      "Authentic Tamil flavours inspired by traditional home-style cooking.",
    categories: [],
  },

  "heritage-kitchen": {
    id: "heritage-kitchen",
    name: "Heritage Kitchen",
    cuisine: "South Indian",
    rating: "4.8",
    deliveryTime: "20–25 MIN",
    price: "₹₹",
    city: "Madurai",
    image: heritagekitchenImage,
    description:
      "A celebration of South Indian culinary heritage and traditional recipes.",
    categories: [],
  },
};

function Restaurant() {
  const { restaurantId } = useParams();
  const { addToCart, cartItems } = useCart();

  const restaurant = restaurants[restaurantId];

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
              <span>{restaurant.deliveryTime}</span>
              <span>{restaurant.price}</span>
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
                            <span>{item.price}</span>

                            <button
                              type="button"
                              onClick={() =>
                                handleAdd(item)
                              }
                            >
                              {quantity > 0
                                ? `ADDED ${quantity}`
                                : "ADD +"}
                            </button>
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