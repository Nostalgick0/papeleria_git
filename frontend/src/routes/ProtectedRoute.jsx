import { Navigate, useLocation } from "react-router-dom"

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const usuario = localStorage.getItem("usuario")

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}