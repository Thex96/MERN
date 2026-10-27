import "../css/PopularDishes.css";

import chickenbiryaniImage from "../assets/images/chickenbiryani.jpg";
import trufflepastaImage from "../assets/images/trufflepasta.jpg";
import cheeseburgerImage from "../assets/images/cheeseburger.jpg";

const dishes = [
  {
    name: "Chicken Biryani",
    description: "Slow-cooked basmati rice, tender chicken and aromatic spices.",
    price: "₹320",
    category: "SIGNATURE",
    image: chickenbiryaniImage,
  },
  {
    name: "Truffle Pasta",
    description: "Fresh pasta finished with parmesan and black truffle.",
    price: "₹420",
    category: "CHEF'S PICK",
    image: trufflepastaImage,
  },
  {
    name: "Classic Cheeseburger",
    description: "Chargrilled beef, aged cheddar and house-made sauce.",
    price: "₹280",
    category: "POPULAR",
    image: cheeseburgerImage,
  },
];

function PopularDishes() {
  return (
    <section className="popular-dishes">
      <div className="popular-header">
        <div>
          <p className="section-label">POPULAR RIGHT NOW</p>

          <h2>
            Dishes people
            <br />
            keep coming back for.
          </h2>
        </div>

        <p className="popular-intro">
          From timeless classics to dishes worth discovering,
          these are some of FoodEase's most loved choices.
        </p>
      </div>

      <div className="dishes-list">
        {dishes.map((dish, index) => (
          <article className="dish-item" key={dish.name}>
            <div className="dish-number">
              0{index + 1}
            </div>

            <div className="dish-image-container">
              <img
                src={dish.image}
                alt={dish.name}
                className="dish-image"
              />
            </div>

            <div className="dish-details">
              <p className="dish-category">{dish.category}</p>

              <h3>{dish.name}</h3>

              <p className="dish-description">
                {dish.description}
              </p>

              <div className="dish-bottom">
                <span className="dish-price">{dish.price}</span>

                <button className="dish-add">
                  ADD <span>+</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PopularDishes;