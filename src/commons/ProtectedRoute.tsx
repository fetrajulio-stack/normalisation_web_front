import { Navigate } from "react-router-dom";
import useAuth from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
