import { useState } from "react"
import { Form, Input, Button, Card, Typography, Alert, App } from "antd"
import { UserOutlined, LockOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

const { Title } = Typography

export default function Login() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

  const onFinish = async (valores) => {
    setCargando(true)
    setError("")

    try {
      const response = await axios.post(`${BACKEND_URL}/login`, {
        nombre_usuario: valores.usuario,
        password: valores.contrasena
      })

      // Guarda al usuario para saber que ya inició sesión
      localStorage.setItem("usuario", JSON.stringify(response.data.usuario))

      message.success("¡Bienvenido de nuevo!")
      navigate("/dashboard")
    } catch (error) {
      setError(error.response?.data?.mensaje || "Error al iniciar sesión")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #203e7f 0%, #3875F7 100%)",
        padding: 16,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 400, boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 4, color: "#3875F7" }}>
            Papelería Aracely
          </Title>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setError("")}
          />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
          <Form.Item
            name="usuario"
            label="Usuario"
            rules={[{ required: true, message: "Ingresa tu usuario" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Usuario" autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="contrasena"
            label="Contraseña"
            rules={[{ required: true, message: "Ingresa tu contraseña" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="contraseña"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block loading={cargando}>
              Iniciar sesión
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}