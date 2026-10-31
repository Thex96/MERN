
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../css/RestaurantRegistration.css";

function RestaurantRegistration({ embedded = false, onSubmitted }) {
  const { user } = useAuth();
  const MainContainer = embedded ? "section" : "main";

  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    cuisine: "",
    address: "",
    description: "",
    openingTime: "",
    closingTime: "",
    city: "",
    state: "",
    imageUrl: "",
    deliveryTime: "30–40 MIN",
    priceRange: "₹₹",
  });
  const [menu, setMenu] = useState([{ category: "", name: "", description: "", price: "", imageUrl: "" }]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/restaurants", {
        ...formData,
        menu: menu.filter((item) => item.name.trim()).map((item) => ({ ...item, price: Number(item.price) })),
      });

      setSuccess(
        "Your restaurant application has been submitted successfully. It is now awaiting admin approval."
      );
      onSubmitted?.(response.data.restaurant);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to FoodEase. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {!embedded && <Navbar />}

      <MainContainer className="restaurant-registration">
        <header className="restaurant-registration-header">
          <p className="restaurant-registration-eyebrow">
            FOODEASE / RESTAURANT PARTNERS
          </p>

          <h1>
            Bring your kitchen
            <br />
            <span>to the table.</span>
          </h1>

          <p className="restaurant-registration-intro">
            Introduce your restaurant to FoodEase. Submit your details
            for review and take the first step towards becoming a partner.
          </p>
        </header>

        <form
          className="restaurant-registration-form"
          onSubmit={handleSubmit}
        >
          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">
              01 / RESTAURANT DETAILS
            </p>

            <div className="restaurant-registration-grid">
              <label>
                RESTAURANT NAME *
                <input
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  placeholder="Your restaurant name"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                CUISINE *
                <select
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select cuisine</option>
                  <option value="Indian">Indian</option>
                  <option value="South Indian">South Indian</option>
                  <option value="North Indian">North Indian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Italian">Italian</option>
                  <option value="Continental">Continental</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="restaurant-registration-full">
                RESTAURANT ADDRESS *
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, area, city, state, postal code"
                  rows={3}
                  maxLength={500}
                  required
                />
              </label>

              <label>
                CITY *
                <input name="city" value={formData.city} onChange={handleChange} placeholder="Coimbatore" maxLength={80} required />
              </label>
              <label>
                STATE *
                <input name="state" value={formData.state} onChange={handleChange} placeholder="Tamil Nadu" maxLength={80} required />
              </label>
              <label className="restaurant-registration-full">
                RESTAURANT IMAGE URL *
                <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/restaurant.jpg" maxLength={2048} required />
              </label>
              <label>
                DELIVERY ESTIMATE *
                <input name="deliveryTime" value={formData.deliveryTime} onChange={handleChange} placeholder="30–40 MIN" maxLength={40} required />
              </label>
              <label>
                PRICE RANGE *
                <select name="priceRange" value={formData.priceRange} onChange={handleChange} required>
                  <option value="₹">₹ · Budget</option><option value="₹₹">₹₹ · Moderate</option>
                  <option value="₹₹₹">₹₹₹ · Premium</option><option value="₹₹₹₹">₹₹₹₹ · Fine dining</option>
                </select>
              </label>

              <label className="restaurant-registration-full">
                ABOUT YOUR RESTAURANT
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your food and restaurant"
                  rows={4}
                  maxLength={500}
                />
              </label>
            </div>
          </div>

          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">02 / MENU ITEMS</p>
            <div className="restaurant-registration-grid">
              {menu.map((item, index) => (
                <div className="restaurant-menu-form-item restaurant-registration-full" key={index}>
                  <div className="restaurant-registration-grid">
                    {["category", "name", "description", "price", "imageUrl"].map((field) => (
                      <label key={field} className={field === "description" || field === "imageUrl" ? "restaurant-registration-full" : ""}>
                        {({ category: "CATEGORY *", name: "ITEM NAME *", description: "ITEM DESCRIPTION", price: "PRICE (₹) *", imageUrl: "ITEM IMAGE URL" })[field]}
                        <input
                          type={field === "price" ? "number" : field === "imageUrl" ? "url" : "text"}
                          min={field === "price" ? "0" : undefined} step={field === "price" ? "0.01" : undefined}
                          required={field === "category" || field === "name" || field === "price"}
                          value={item[field]} placeholder={field === "imageUrl" ? "https://example.com/dish.jpg" : ""}
                          onChange={(event) => setMenu((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: event.target.value } : row))}
                        />
                      </label>
                    ))}
                  </div>
                  {menu.length > 1 && <button type="button" className="restaurant-menu-remove" onClick={() => setMenu((current) => current.filter((_, rowIndex) => rowIndex !== index))}>REMOVE ITEM</button>}
                </div>
              ))}
              <button type="button" className="restaurant-menu-add" onClick={() => setMenu((current) => [...current, { category: "", name: "", description: "", price: "", imageUrl: "" }])}>+ ADD MENU ITEM</button>
            </div>
          </div>

          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">
              03 / OWNER DETAILS
            </p>

            <div className="restaurant-registration-grid">
              <label>
                OWNER NAME *
                <input
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Full name"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                CONTACT EMAIL *
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  maxLength={254}
                  required
                />
              </label>

              <label>
                PHONE NUMBER *
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Contact number"
                  maxLength={20}
                  required
                />
              </label>
            </div>
          </div>

          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">
              04 / OPERATING HOURS
            </p>

            <div className="restaurant-registration-grid">
              <label>
                OPENING TIME *
                <input
                  type="time"
                  name="openingTime"
                  value={formData.openingTime}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                CLOSING TIME *
                <input
                  type="time"
                  name="closingTime"
                  value={formData.closingTime}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
          </div>

          <div className="restaurant-registration-submit">
            {error && (
              <p role="alert" aria-live="polite">
                {error}
              </p>
            )}

            {success && (
              <p role="status" aria-live="polite">
                {success}
              </p>
            )}

            {!success && !error && (
              <p>
                Your application will be reviewed by the FoodEase
                admin team. You cannot manage a live restaurant
                until approval.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || Boolean(success)}
            >
              {submitting
                ? "SUBMITTING APPLICATION..."
                : success
                  ? "APPLICATION SUBMITTED"
                  : "SUBMIT APPLICATION"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>

        <footer className="restaurant-registration-footer">
          <span>FOOD / PEOPLE / PLACES</span>
          {embedded ? (
            <span>{user?.username}</span>
          ) : (
            <Link to="/restaurant-dashboard">
              BACK TO DASHBOARD <span>↗</span>
            </Link>
          )}
        </footer>
      </MainContainer>
    </>
  );
}

export default RestaurantRegistration;
