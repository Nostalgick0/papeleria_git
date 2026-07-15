import { useState, useEffect } from "react"
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Popconfirm,
  Tooltip,
  Grid,
  message,
} from "antd"
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  StopOutlined,
} from "@ant-design/icons"
import axios from "axios"
import { BACKEND_URL } from "../Backend"
import VentaForm from "../components/VentaForm"
import VentaDetalle from "../components/VentaDetalle"

const { Title } = Typography
const { useBreakpoint } = Grid

//formatea un número como moneda en pesos mexicanos
function formatCurrency(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor)
}

//formatea una fecha a formato legible dd/mm/aaaa
function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-MX")
}

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [ventaEditar, setVentaEditar] = useState(null)
  const [ventaDetalle, setVentaDetalle] = useState(null)
  const screens = useBreakpoint()

  useEffect(() => {
    cargarVentas()
  }, [])

  //trae las ventas desde el backend
  const cargarVentas = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/obtenerVentas`)
      setVentas(response.data)
    } catch (error) {
      message.error("Error al cargar las ventas")
    }
  }

  //deshabilita una venta en el backend y refresca la tabla
  const deshabilitarVenta = async (id) => {
    try {
      await axios.post(`${BACKEND_URL}/deshabilitarVenta`, { id })
      message.success("Venta deshabilitada correctamente")
      cargarVentas()
    } catch (error) {
      message.error("Error al deshabilitar la venta")
    }
  }

  function nuevaVenta() {
    setVentaEditar(null)
    setFormOpen(true)
  }

  function editar(venta) {
    setVentaEditar(venta)
    setFormOpen(true)
  }

  function verDetalle(venta) {
    setVentaDetalle(venta)
    setDetalleOpen(true)
  }

  const columnas = [
    {
      title: "Fecha",
      dataIndex: "fecha_venta",
      key: "fecha_venta",
      render: (f) => formatFecha(f),
      sorter: (a, b) => new Date(b.fecha_venta) - new Date(a.fecha_venta),
      defaultSortOrder: "ascend",
    },
    {
      title: "Total",
      dataIndex: "total_venta",
      key: "total_venta",
      align: "right",
      render: (v) => <strong>{formatCurrency(v)}</strong>,
      sorter: (a, b) => a.total_venta - b.total_venta,
    },
    {
      title: "Método de pago",
      dataIndex: "nombre_metodo_pago",
      key: "nombre_metodo_pago",
      responsive: ["sm"],
      render: (m) => <Tag color={m === "Efectivo" ? "green" : "blue"}>{m}</Tag>,
    },
    {
      title: "Estado",
      dataIndex: "estatus",
      key: "estatus",
      render: (e) => (
        <Tag color={e === 1 ? "success" : "default"}>
          {e === 1 ? "Activa" : "Deshabilitada"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalle">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => verDetalle(record)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              size="small"
              icon={<EditOutlined />}
              disabled={record.estatus !== 1}
              onClick={() => editar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Deshabilitar esta venta?"
            description="Se restaurará el stock de los productos vendidos."
            okText="Sí, deshabilitar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            disabled={record.estatus !== 1}
            onConfirm={() => deshabilitarVenta(record.pk_venta)}
          >
            <Tooltip title="Deshabilitar">
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                disabled={record.estatus !== 1}
              />
            </Tooltip>
          </Popconfirm>
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
          Ventas
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={nuevaVenta}>
          Nueva venta
        </Button>
      </div>

      <Card styles={{ body: { padding: screens.md ? 24 : 8 } }}>
        <Table
          columns={columnas}
          dataSource={ventas}
          rowKey="pk_venta"
          scroll={{ x: 700 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>

      <VentaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        ventaEditar={ventaEditar}
        onGuardado={cargarVentas}
      />
      <VentaDetalle
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        venta={ventaDetalle}
      />
    </div>
  )
}