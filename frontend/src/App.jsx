import { ConfigProvider } from "antd"
import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { DataProvider } from "./context/DataContext"
import ProtectedRoute from "./routes/ProtectedRoute"
import MainLayout from "./layouts/MainLayout"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Ventas from "./pages/Ventas"
import EntradasMercancia from "./pages/EntradasMercancia"
import Inventario from "./pages/Inventario"
import Proveedores from "./pages/Proveedores"
import Catalogos from "./pages/Catalogos"



export default function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#3875F7" } }}>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/entradas" element={<EntradasMercancia />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/proveedores" element={<Proveedores />} />
              <Route path="/catalogos" element={<Catalogos />} />

            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            <Route path="#" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </ConfigProvider>
  )
}
