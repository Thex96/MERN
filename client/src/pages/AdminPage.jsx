import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../css/Admin.css";

function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [saving, setSaving] = useState(false);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/restaurants/admin/applications?status=${filter}`);
      setApplications(Array.isArray(response.data.restaurants) ? response.data.restaurants : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) loadApplications(); });
    return () => { active = false; };
  }, [loadApplications]);

  async function reviewApplication(id, status) {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/restaurants/admin/applications/${id}/review`, {
        status,
        rejectionReason: status === "rejected" ? rejectionReason : "",
      });
      setApplications((current) => current.filter((application) => application._id !== id));
      setReviewingId("");
      setRejectionReason("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update this application.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/accessadmin", { replace: true });
  }

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div><p>FOODEASE / PRIVATE ACCESS</p><h1>ADMIN<span>.</span></h1></div>
        <div className="admin-page-account"><span>{user?.email}</span><button type="button" onClick={handleLogout}>LOG OUT</button></div>
      </header>
      <section className="admin-review-section">
        <div className="admin-review-heading">
          <div><p>RESTAURANT PARTNERS</p><h2>Applications.</h2></div>
          <label>VIEW
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="pending">PENDING</option>
              <option value="approved">APPROVED</option>
              <option value="rejected">REJECTED</option>
            </select>
          </label>
        </div>
        {error && <p className="admin-page-error" role="alert">{error}</p>}
        {loading ? <p className="admin-empty">Loading applications...</p> : applications.length === 0 ? (
          <p className="admin-empty">No {filter} applications.</p>
        ) : (
          <div className="admin-application-list">
            {applications.map((application) => (
              <article className="admin-application" key={application._id}>
                <div className="admin-application-heading">
                  <div><h3>{application.restaurantName}</h3><p>{application.cuisine} · {application.status.toUpperCase()}</p></div>
                  <small>{new Date(application.createdAt).toLocaleDateString("en-IN")}</small>
                </div>
                <div className="admin-application-details">
                  <p><strong>OWNER</strong> {application.ownerName} ({application.owner?.username || "Manager"})</p>
                  <p><strong>CONTACT</strong> {application.email} · {application.phone}</p>
                  <p><strong>ADDRESS</strong> {application.address}</p>
                  {application.description && <p><strong>ABOUT</strong> {application.description}</p>}
                  <p><strong>HOURS</strong> {application.openingTime} – {application.closingTime}</p>
                  {application.rejectionReason && <p><strong>REVIEW NOTE</strong> {application.rejectionReason}</p>}
                </div>
                {filter === "pending" && (
                  <div className="admin-application-actions">
                    {reviewingId === application._id ? (
                      <div className="admin-rejection-form">
                        <label htmlFor={`reason-${application._id}`}>REASON (OPTIONAL)</label>
                        <textarea id={`reason-${application._id}`} maxLength={500} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
                        <button type="button" disabled={saving} onClick={() => reviewApplication(application._id, "rejected")}>CONFIRM REJECTION</button>
                        <button type="button" onClick={() => { setReviewingId(""); setRejectionReason(""); }}>CANCEL</button>
                      </div>
                    ) : (
                      <>
                        <button type="button" disabled={saving} onClick={() => reviewApplication(application._id, "approved")}>APPROVE</button>
                        <button type="button" disabled={saving} onClick={() => { setReviewingId(application._id); setRejectionReason(""); }}>REJECT</button>
                      </>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      <footer className="admin-page-footer">FOOD / PEOPLE / PLACES</footer>
    </main>
  );
}

export default AdminPage;
