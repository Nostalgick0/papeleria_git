import { useState } from "react"
import { Layout, Menu, Button, Drawer, Grid, Dropdown, Badge, Typography, Space } from "antd"
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ShopOutlined,
  AppstoreOutlined,
  TruckOutlined,
  MenuOutlined,
  LogoutOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import { useNavigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useData } from "../context/DataContext"

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid
const { Text } = Typography

const menuItems = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/ventas", icon: <ShoppingCartOutlined />, label: "Ventas" },
  { key: "/entradas", icon: <InboxOutlined />, label: "Entradas de Mercancía" },
  { key: "/inventario", icon: <ShopOutlined />, label: "Inventario" },
  { key: "/proveedores", icon: <TruckOutlined />, label: "Proveedores" },
  { key: "/catalogos", icon: <AppstoreOutlined />, label: "Catálogos" },]

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario, logout } = useAuth()
  const { productos } = useData()
  const screens = useBreakpoint()

  const esMovil = !screens.md

  const stockBajo = productos.filter(
    (p) => p.estado === "Activo" && p.stockActual < p.stockMinimo,
  ).length

  function irA(key) {
    navigate(key)
    setDrawerOpen(false)
  }

  function handleLogout() {
    logout()
    navigate("/login")
  }

  const logo = (
    <div
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: collapsed && !esMovil ? 16 : 18,
        padding: "0 12px",
        textAlign: "center",
        lineHeight: 1.2,
      }}
    >
      {collapsed && !esMovil ? "PA" : "Papelería Aracely"}
    </div>
  )

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={(e) => irA(e.key)}
      style={{ borderRight: 0, background: "transparent" }}
    />
  )

  const userMenu = {
    items: [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Cerrar sesión",
        danger: true,
        onClick: handleLogout,
      },
    ],
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!esMovil && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{ background: "#0b2350" }}
          theme="dark"
        >
          {logo}
          {menu}
        </Sider>
      )}

      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0, background: "#0b2350" }, header: { display: "none" } }}
        width={250}
      >
        <div style={{ background: "#0b2350", minHeight: "100%" }}>
          {logo}
          {menu}
        </div>
      </Drawer>

      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Space>
            {esMovil && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                aria-label="Abrir menú"
              />
            )}
            <Badge count={stockBajo} size="small" offset={[4, 0]}>
              <Space size={4} style={{ color: stockBajo > 0 ? "#cf1322" : "#999" }}>
                <WarningOutlined />
                <Text style={{ color: stockBajo > 0 ? "#cf1322" : "#999" }}>
                  {stockBajo > 0 ? `${stockBajo} con stock bajo` : "Stock al día"}
                </Text>
              </Space>
            </Badge>
          </Space>

          <Dropdown menu={userMenu} trigger={["click"]}>
            <Button type="text" style={{ height: "auto", padding: "4px 8px" }}>
              <Space>
                <UserOutlined />
                <span>{usuario?.nombre || "Administrador"}</span>
              </Space>
            </Button>
          </Dropdown>
        </Header>

        <Content style={{ margin: esMovil ? 12 : 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
