import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

const CREDENCIAL = { usuario: "admin", contrasena: "admin123" }
const STORAGE_KEY = "aracely_auth"

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY)
      if (guardado) {
        setUsuario(JSON.parse(guardado))
      }
    } catch (e) {
      console.log("[v0] Error leyendo sesión:", e.message)
    }
    setCargando(false)
  }, [])

  function login(usuarioInput, contrasenaInput) {
    if (
      usuarioInput === CREDENCIAL.usuario &&
      contrasenaInput === CREDENCIAL.contrasena
    ) {
      const datosUsuario = { nombre: "Administrador", usuario: usuarioInput }
      setUsuario(datosUsuario)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(datosUsuario))
      return { ok: true }
    }
    return { ok: false, mensaje: "Usuario o contraseña incorrectos." }
  }

  function logout() {
    setUsuario(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return ctx
}
