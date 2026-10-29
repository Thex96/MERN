
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "../css/Signup.css";

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isRestaurantIntent = searchParams.get("intent") === "restaurant";

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    const { username, email, password, confirmPassword } = formData;

    if (!username.trim() || username.trim().length > 16) {
      setError("Username must contain between 1 and 16 characters.");
      return;
    }

    if (password.length < 6 || password.length > 72) {
      setError("Password must contain between 6 and 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signup({
        username: username.trim(),
        email: email.trim(),
        password,
        role: isRestaurantIntent ? "restaurant" : "customer",
      });

      navigate(
        isRestaurantIntent ? "/restaurant-dashboard" : "/dashboard",
        { replace: true }
      );
    } catch (err) {
      setError(
        err.message || "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="signup-page">
        <section className="signup-left">
          <div className="signup-left-top">
            <span>FOODEASE</span>
            <span>
              {isRestaurantIntent
                ? "RESTAURANT PARTNERS"
                : "MEMBER REGISTRATION"}
            </span>
          </div>

          <div className="signup-left-content">
            <p>
              {isRestaurantIntent
                ? "FOR RESTAURANT OWNERS"
                : "WELCOME TO FOODEASE"}
            </p>

            <h1>
              {isRestaurantIntent ? (
                <>
                  Your kitchen.
                  <br />
                  <span>Your business.</span>
                </>
              ) : (
                <>
                  Good food.
                  <br />
                  <span>Good company.</span>
                </>
              )}
            </h1>
          </div>

          <div className="signup-left-bottom">
            <span>FOOD / PEOPLE / PLACES</span>
            <span>EST. FOODEASE</span>
          </div>
        </section>

        <section className="signup-right">
          <div className="signup-box">
            <div className="signup-box-header">
              <div>
                <p>
                  {isRestaurantIntent
                    ? "PARTNER REGISTRATION"
                    : "YOUR FOODEASE ACCOUNT"}
                </p>
                <h2>
                  {isRestaurantIntent
                    ? "Join as a partner."
                    : "Create account."}
                </h2>
              </div>
              <span>01 / 01</span>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="signup-field">
                <label htmlFor="username">USERNAME</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  maxLength={16}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="signup-field">
                <label htmlFor="email">EMAIL ADDRESS</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={254}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="signup-row">
                <div className="signup-field">
                  <label htmlFor="password">PASSWORD</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="signup-field">
                  <label htmlFor="confirmPassword">
                    CONFIRM PASSWORD
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="signup-error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="signup-submit"
                type="submit"
                disabled={loading}
              >
                <span>
                  {loading
                    ? "CREATING ACCOUNT..."
                    : isRestaurantIntent
                      ? "CREATE PARTNER ACCOUNT"
                      : "CREATE ACCOUNT"}
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </form>

            {isRestaurantIntent && (
              <p className="signup-error signup-partner-note">
                Restaurant applications require admin approval. Creating an
                account does not automatically approve your restaurant.
              </p>
            )}

            <div className="signup-account-options">
              <div className="signup-option">
                <span>ALREADY A MEMBER?</span>
                <p>Welcome back to FoodEase.</p>
                <Link to="/login">
                  LOG IN <span aria-hidden="true">↗</span>
                </Link>
              </div>

              {!isRestaurantIntent && (
                <div className="signup-option signup-option-partner">
                  <span>FOR RESTAURANT OWNERS</span>
                  <p>Become a FoodEase partner.</p>
                  <Link to="/signup?intent=restaurant">
                    REGISTER AS A PARTNER <span aria-hidden="true">→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <span className="signup-right-mark">
            FOOD / PEOPLE / PLACES
          </span>
        </section>
      </main>
    </>
  );
}

export default Signup;
