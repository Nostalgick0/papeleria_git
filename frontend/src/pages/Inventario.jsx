import { useState, useEffect, useMemo } from "react"
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Popconfirm,
  Tooltip,
  Input,
  Select,
  Row,
  Col,
  Grid,
  message,
} from "antd"
import {
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import axios from "axios"
import { BACKEND_URL } from "../Backend"
import ProductoForm from "../components/ProductoForm"

const { Title, Text } = Typography
const { useBreakpoint } = Grid

//formatea un número como moneda en pesos mexicanos
function formatCurrency(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor)
}

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [productoEditar, setProductoEditar] = useState(null)
  const [busqueda, setBusqueda] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState(null)
  const screens = useBreakpoint()

  useEffect(() => {
    cargarDatos()
  }, [])

  //trae productos y categorías desde el backend
  const cargarDatos = async () => {
    try {
      const [resProductos, resCategorias] = await Promise.all([
        axios.get(`${BACKEND_URL}/obtenerProductos`),
        axios.get(`${BACKEND_URL}/obtenerCategorias`),
      ])
      setProductos(resProductos.data)
      setCategorias(resCategorias.data)
    } catch (error) {
      message.error("Error al cargar el inventario")
    }
  }

  //activa o desactiva un producto y refresca la tabla
  const cambiarEstadoProducto = async (pk_producto, estatus) => {
    try {
      await axios.post(`${BACKEND_URL}/cambiarEstadoProducto`, {
        pk_producto,
        estatus,
      })
      message.success("Estado del producto actualizado correctamente")
      cargarDatos()
    } catch (error) {
      message.error("Error al actualizar el estado del producto")
    }
  }

  function nuevo() {
    setProductoEditar(null)
    setFormOpen(true)
  }

  function editar(producto) {
    setProductoEditar(producto)
    setFormOpen(true)
  }

  //mapa rápido de pk_categoria -> nombre_categoria para mostrarlo en la tabla
  const nombreCategoria = useMemo(() => {
    const m = {}
    categorias.forEach((c) => {
      m[c.pk_categoria] = c.nombre_categoria
    })
    return m
  }, [categorias])

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideNombre = p.nombre_producto
        .toLowerCase()
        .includes(busqueda.toLowerCase())
      const coincideCategoria = !filtroCategoria || p.fk_categoria === filtroCategoria
      return coincideNombre && coincideCategoria
    })
  }, [productos, busqueda, filtroCategoria])

  const columnas = [
    {
      title: "Producto",
      dataIndex: "nombre_producto",
      key: "nombre_producto",
      render: (nombre, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{nombre}</Text>
          {record.estatus === 1 &&
            Number(record.stock) < Number(record.stock_minimo) && (
              <Tag color="error" icon={<WarningOutlined />} style={{ marginTop: 4 }}>
                Stock bajo
              </Tag>
            )}
        </Space>
      ),
    },
    {
      title: "Categoría",
      dataIndex: "fk_categoria",
      key: "fk_categoria",
      responsive: ["sm"],
      render: (c) => <Tag>{nombreCategoria[c] || "Sin categoría"}</Tag>,
    },
    {
      title: "Precio venta",
      dataIndex: "precio_venta",
      key: "precio_venta",
      align: "right",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Costo compra",
      dataIndex: "costo_compra",
      key: "costo_compra",
      align: "right",
      responsive: ["md"],
      render: (v) => formatCurrency(v),
    },
    {
      title: "Stock",
      key: "stock",
      align: "center",
      render: (_, record) => {
        const bajo =
          record.estatus === 1 && Number(record.stock) < Number(record.stock_minimo)
        return (
          <Text type={bajo ? "danger" : undefined} strong={bajo}>
            {record.stock}
          </Text>
        )
      },
    },
    {
      title: "Stock mín.",
      dataIndex: "stock_minimo",
      key: "stock_minimo",
      align: "center",
      responsive: ["md"],
    },
    {
      title: "Estado",
      dataIndex: "estatus",
      key: "estatus",
      render: (e) => (
        <Tag color={e === 1 ? "success" : "default"}>{e === 1 ? "Activo" : "Inactivo"}</Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      fixed: "right",
      width: 110,
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => editar(record)}
            />
          </Tooltip>
          {record.estatus === 1 ? (
            <Popconfirm
              title="¿Desactivar este producto?"
              description="No se eliminará; se conservará el historial. Podrás reactivarlo después."
              okText="Sí, desactivar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => cambiarEstadoProducto(record.pk_producto, 0)}
            >
              <Tooltip title="Desactivar">
                <Button size="small" danger icon={<StopOutlined />} />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Tooltip title="Reactivar">
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => cambiarEstadoProducto(record.pk_producto, 1)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Inventario
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={nuevo}>
          Nuevo producto
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={14}>
            <Input.Search
              placeholder="Buscar por nombre..."
              allowClear
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={10}>
            <Select
              placeholder="Filtrar por categoría"
              allowClear
              style={{ width: "100%" }}
              value={filtroCategoria}
              onChange={setFiltroCategoria}
              options={categorias.map((c) => ({
                value: c.pk_categoria,
                label: c.nombre_categoria,
              }))}
            />
          </Col>
        </Row>
      </Card>

      <Card styles={{ body: { padding: screens.md ? 24 : 8 } }}>
        <Table
          columns={columnas}
          dataSource={productosFiltrados}
          rowKey="pk_producto"
          scroll={{ x: 760 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>

      <ProductoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        productoEditar={productoEditar}
        onGuardado={cargarDatos}
      />
    </div>
  )
}