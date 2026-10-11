import "../css/Categories.css";

import indianImage from "../assets/images/indian.jpg";
import italianImage from "../assets/images/italian.jpg";
import asianImage from "../assets/images/asian.jpg";
import burgerImage from "../assets/images/burger.jpg";
import dessertImage from "../assets/images/dessert.jpg";
import beverageImage from "../assets/images/beverage.jpg";

const categories = [
  {
    name: "Indian",
    image: indianImage,
  },
  {
    name: "Italian",
    image: italianImage,
  },
  {
    name: "Asian",
    image: asianImage,
  },
  {
    name: "Burgers",
    image: burgerImage,
  },
  {
    name: "Desserts",
    image: dessertImage,
  },
  {
    name: "Beverages",
    image: beverageImage,
  },
];

function Categories() {
  return (
    <section className="categories">
      <div className="categories-header">
        <p className="section-label">EXPLORE BY TASTE</p>

        <h2>
          Find your
          <br />
          next craving.
        </h2>
      </div>

      <div className="categories-list">
        {categories.map((category, index) => (
          <div className="category-item" key={category.name}>
            <div className="category-number">
              0{index + 1}
            </div>

            <div className="category-image-container">
              <img
                src={category.image}
                alt={category.name}
                className="category-image"
              />
            </div>

            <div className="category-info">
              <h3>{category.name}</h3>
              <span>EXPLORE →</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Categories;