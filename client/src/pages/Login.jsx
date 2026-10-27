
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "../css/Login.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination =
    location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (submitting) {
      return;
    }

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      await login(email.trim().toLowerCase(), password);
      navigate(destination, { replace: true });
    } catch (error) {
      setError(error.message || "Unable to log in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="login-page">
        <section className="login-left">
          <div className="login-left-top">
            <span>FOODEASE</span>
            <span>01 / 02</span>
          </div>

          <div className="login-left-content">
            <p>WELCOME BACK</p>

            <h1>
              Good food,
              <br />
              good places,
              <br />
              <span>good memories.</span>
            </h1>
          </div>

          <div className="login-left-bottom">
            <span>FOOD / PEOPLE / PLACES</span>
            <span>EST. 2026</span>
          </div>
        </section>

        <section className="login-right">
          <div className="login-box">
            <div className="login-box-header">
              <div>
                <p>SIGN IN</p>
                <h2>Welcome back.</h2>
              </div>

              <span>01</span>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="email">EMAIL ADDRESS</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">PASSWORD</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="login-form-options">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                  />
                  <span>REMEMBER ME</span>
                </label>

                <button type="button">
                  FORGOT PASSWORD?
                </button>
              </div>

              {error && (
                <p className="login-error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="login-submit"
                type="submit"
                disabled={submitting}
              >
                <span>
                  {submitting ? "SIGNING IN..." : "SIGN IN"}
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="login-create">
              <div>
                <span>NEW TO FOODEASE?</span>
                <p>
                  Create your account and start
                  discovering.
                </p>
              </div>

              <Link to="/signup">
                CREATE ACCOUNT
                <span>↗</span>
              </Link>
            </div>
          </div>

          <div className="login-right-mark">
            DISCOVER SOMETHING WORTH EATING
          </div>
        </section>
      </main>
    </>
  );
}

export default Login;
