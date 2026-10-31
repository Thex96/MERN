import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/Admin.css";

function AdminAccess() {
  const { user, adminLogin, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user?.role === "admin") return <Navigate to="/adminpage" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await adminLogin(password);
      navigate("/adminpage", { replace: true });
    } catch (loginError) {
      setError(loginError.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-access-page">
      <form className="admin-access-card" onSubmit={handleSubmit}>
        <p className="admin-access-title">ADMIN</p>
        <label className="admin-access-box">
          <span className="visually-hidden">Admin password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => { setPassword(event.target.value); setError(""); }}
            placeholder="ENTER PASSWORD"
            autoComplete="off"
            autoFocus
            required
          />
          <button type="submit" disabled={submitting} aria-label="Sign in as admin">
            {submitting ? "…" : "→"}
          </button>
        </label>
        {error && <p className="admin-access-error" role="alert">{error}</p>}
      </form>
    </main>
  );
}

export default AdminAccess;
