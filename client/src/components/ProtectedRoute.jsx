import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (role && user.role !== role) {
    const destination = user.role === "admin"
      ? "/adminpage"
      : user.role === "restaurant"
        ? "/restaurant-dashboard"
        : "/dashboard";
    return <Navigate to={destination} replace />;
  }

  return children;
}

export default ProtectedRoute;
