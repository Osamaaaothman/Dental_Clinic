import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

function ProtectedRoute({ requireClinic = false }) {
  const token = useAuthStore((state) => state.token);
  const selectedClinic = useAuthStore((state) => state.selectedClinic);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireClinic && !selectedClinic) {
    return <Navigate to="/select-clinic" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
