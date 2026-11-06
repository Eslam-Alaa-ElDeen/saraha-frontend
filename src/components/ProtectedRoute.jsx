import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

// UX guard only. The backend enforces real access.
export default function ProtectedRoute() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
