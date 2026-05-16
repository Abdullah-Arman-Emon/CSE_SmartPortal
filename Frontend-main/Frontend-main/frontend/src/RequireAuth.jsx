import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext"; // adjust path accordingly

const RequireAuth = ({ children, allowedRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  if (!user || !user.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}-dashboard`} replace />;
  }

  return children;
};

export default RequireAuth;
