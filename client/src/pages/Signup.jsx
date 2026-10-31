import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "../css/Signup.css";

const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,72}$/;

const PASSWORD_MESSAGE =
  "Use 8–72 characters, including an uppercase letter, a lowercase letter, a number, and a symbol.";

function Signup() {
  const {
    requestSignupCode,
    verifySignupCode,
    completeSignup,
  } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRestaurantIntent = searchParams.get("intent") === "restaurant";
  const role = isRestaurantIntent ? "restaurant" : "customer";

  const [step, setStep] = useState("details");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(event) {
    event.preventDefault();
    if (loading) return;

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || cleanUsername.length > 16) {
      setError("Username must contain between 1 and 16 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await requestSignupCode({
        username: cleanUsername,
        email: cleanEmail,
        role,
      });
      setUsername(cleanUsername);
      setEmail(cleanEmail);
      setStep("code");
      setMessage(`We sent a verification code to ${cleanEmail}.`);
    } catch (requestError) {
      setError(requestError.message || "Could not send the code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const verifiedToken = await verifySignupCode({ email, code });
      setSignupToken(verifiedToken);
      setStep("password");
      setMessage("Email verified. Choose a password for your account.");
    } catch (requestError) {
      setError(requestError.message || "Could not verify the code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAccount(event) {
    event.preventDefault();
    if (loading) return;

    if (!PASSWORD_RULE.test(password)) {
      setError(PASSWORD_MESSAGE);
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await completeSignup(signupToken, password);
      navigate(
        isRestaurantIntent ? "/restaurant-dashboard" : "/dashboard",
        { replace: true }
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  const heading =
    step === "details"
      ? isRestaurantIntent
        ? "Join as a partner."
        : "Create account."
      : step === "code"
        ? "Check your email."
        : "Choose a password.";

  return (
    <>
      <Navbar />

      <main className="signup-page">
        <section className="signup-left">
          <div className="signup-left-top">
            <span>FOODEASE</span>
            <span>{isRestaurantIntent ? "RESTAURANT PARTNERS" : "MEMBER REGISTRATION"}</span>
          </div>

          <div className="signup-left-content">
            <p>{isRestaurantIntent ? "FOR RESTAURANT OWNERS" : "WELCOME TO FOODEASE"}</p>
            <h1>
              {isRestaurantIntent ? (
                <>Your kitchen.<br /><span>Your business.</span></>
              ) : (
                <>Good food.<br /><span>Good company.</span></>
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
                <p>{isRestaurantIntent ? "PARTNER REGISTRATION" : "YOUR FOODEASE ACCOUNT"}</p>
                <h2>{heading}</h2>
              </div>
              <span>{step === "details" ? "01" : step === "code" ? "02" : "03"} / 03</span>
            </div>

            {step === "details" && (
              <form className="signup-form" onSubmit={handleSendCode}>
                <div className="signup-field">
                  <label htmlFor="username">USERNAME</label>
                  <input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    maxLength={16}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="signup-field">
                  <label htmlFor="email">EMAIL ADDRESS</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    maxLength={254}
                    autoComplete="email"
                    required
                  />
                </div>

                <button className="signup-submit" type="submit" disabled={loading}>
                  <span>{loading ? "SENDING CODE..." : "SEND VERIFICATION CODE"}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            )}

            {step === "code" && (
              <form className="signup-form" onSubmit={handleVerifyCode}>
                <p>A six-digit code was sent to {email}. It expires in 10 minutes.</p>
                <div className="signup-field">
                  <label htmlFor="code">EMAIL VERIFICATION CODE</label>
                  <input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                <button className="signup-submit" type="submit" disabled={loading}>
                  <span>{loading ? "VERIFYING..." : "VERIFY EMAIL"}</span>
                  <span aria-hidden="true">→</span>
                </button>

                <button
                  className="signup-back-button"
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep("details");
                    setCode("");
                    setError("");
                    setMessage("");
                  }}
                >
                  CHANGE EMAIL
                </button>
              </form>
            )}

            {step === "password" && (
              <form className="signup-form" onSubmit={handleCreateAccount}>
                <p>{PASSWORD_MESSAGE}</p>

                <div className="signup-field">
                  <label htmlFor="password">PASSWORD</label>
                  <input
                    id="password"
                    type="password"
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <div className="signup-field">
                  <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>

                <button className="signup-submit" type="submit" disabled={loading}>
                  <span>{loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            )}

            {error && <p className="signup-error" role="alert">{error}</p>}
            {message && <p className="signup-message" role="status">{message}</p>}

            {isRestaurantIntent && (
              <p className="signup-error signup-partner-note">
                Restaurant applications require admin approval. Creating an account does not automatically approve your restaurant.
              </p>
            )}

            <div className="signup-account-options">
              <div className="signup-option">
                <span>ALREADY A MEMBER?</span>
                <p>Welcome back to FoodEase.</p>
                <Link to="/login">LOG IN <span aria-hidden="true">↗</span></Link>
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

          <span className="signup-right-mark">FOOD / PEOPLE / PLACES</span>
        </section>
      </main>
    </>
  );
}

export default Signup;