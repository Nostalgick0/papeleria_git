import { useState, useMemo, useEffect } from "react"
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
} from "antd"
import {
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import { useData } from "../context/DataContext"
import { formatCurrency } from "../utils/helpers"
import ProductoForm from "../components/ProductoForm"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function Inventario() {
  const { productos, cambiarEstadoProducto } = useData()
  const [categoriasOptions, setCategoriasOptions] = useState([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [productoEditar, setProductoEditar] = useState(null)
  const [busqueda, setBusqueda] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState(null)
  const screens = useBreakpoint()

  function nuevo() {
    setProductoEditar(null)
    setFormOpen(true)
  }

  function editar(producto) {
    setProductoEditar(producto)
    setFormOpen(true)
  }

  useEffect(() => {
    async function fetchCategorias() {
      setLoadingCategorias(true)
      try {
        const res = await axios.get(`${BACKEND_URL}/obtenerCategorias`)
        setCategoriasOptions(
          (res.data || [])
            .filter((c) => c.estatus === 1)
            .map((c) => ({ value: c.nombre_categoria, label: c.nombre_categoria })),
        )
      } catch (error) {
        console.error("Error cargando categorías:", error)
        setCategoriasOptions([])
      } finally {
        setLoadingCategorias(false)
      }
    }

    fetchCategorias()
  }, [])

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideNombre = p.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase())
      const coincideCategoria = !filtroCategoria || p.categoria === filtroCategoria
      return coincideNombre && coincideCategoria
    })
  }, [productos, busqueda, filtroCategoria])

  const columnas = [
    {
      title: "Producto",
      dataIndex: "nombre",
      key: "nombre",
      render: (nombre, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{nombre}</Text>
          {record.estado === "Activo" &&
            record.stockActual < record.stockMinimo && (
              <Tag color="error" icon={<WarningOutlined />} style={{ marginTop: 4 }}>
                Stock bajo
              </Tag>
            )}
        </Space>
      ),
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
      key: "categoria",
      responsive: ["sm"],
      render: (c) => <Tag>{c}</Tag>,
    },
    {
      title: "Precio venta",
      dataIndex: "precioVenta",
      key: "precioVenta",
      align: "right",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Costo compra",
      dataIndex: "costoUltimaCompra",
      key: "costo",
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
          record.estado === "Activo" && record.stockActual < record.stockMinimo
        return (
          <Text type={bajo ? "danger" : undefined} strong={bajo}>
            {record.stockActual}
          </Text>
        )
      },
    },
    {
      title: "Stock mín.",
      dataIndex: "stockMinimo",
      key: "stockMinimo",
      align: "center",
      responsive: ["md"],
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (e) => (
        <Tag color={e === "Activo" ? "success" : "default"}>{e}</Tag>
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
          {record.estado === "Activo" ? (
            <Popconfirm
              title="¿Desactivar este producto?"
              description="No se eliminará; se conservará el historial. Podrás reactivarlo después."
              okText="Sí, desactivar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => cambiarEstadoProducto(record.id, "Inactivo")}
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
                onClick={() => cambiarEstadoProducto(record.id, "Activo")}
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
              loading={loadingCategorias}
              options={categoriasOptions}
            />
          </Col>
        </Row>
      </Card>

      <Card styles={{ body: { padding: screens.md ? 24 : 8 } }}>
        <Table
          columns={columnas}
          dataSource={productosFiltrados}
          rowKey="id"
          scroll={{ x: 760 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>

      <ProductoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        productoEditar={productoEditar}
      />
    </div>
  )
}
