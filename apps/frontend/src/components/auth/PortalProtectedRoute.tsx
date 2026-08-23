import { Navigate, Outlet } from 'react-router-dom';

export function PortalProtectedRoute() {
  const token = localStorage.getItem('veridia_patient_token');

  if (!token) {
    return <Navigate to="/portal/login" replace />;
  }

  return <Outlet />;
}
