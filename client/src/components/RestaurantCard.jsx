import "../css/RestaurantCard.css";

function RestaurantCard({ restaurant }) {
  return (
    <article className="restaurant-card">
      <div className="restaurant-image-container">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="restaurant-image"
        />

        <span className="restaurant-rating">
          {restaurant.rating}
        </span>
      </div>

      <div className="restaurant-card-info">
        <div>
          <h3>{restaurant.name}</h3>
          <p>{restaurant.cuisine}</p>
        </div>

        <div className="restaurant-meta">
          <span>{restaurant.deliveryTime}</span>
          <span>{restaurant.price}</span>
        </div>
      </div>
    </article>
  );
}

export default RestaurantCard;