import { useState } from "react"
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
} from "antd"
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  StopOutlined,
} from "@ant-design/icons"
import { useData } from "../context/DataContext"
import { formatCurrency, formatFecha } from "../utils/helpers"
import VentaForm from "../components/VentaForm"
import VentaDetalle from "../components/VentaDetalle"

const { Title } = Typography
const { useBreakpoint } = Grid

export default function Ventas() {
  const { ventas, deshabilitarVenta } = useData()
  const [formOpen, setFormOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [ventaEditar, setVentaEditar] = useState(null)
  const [ventaDetalle, setVentaDetalle] = useState(null)
  const screens = useBreakpoint()

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
      dataIndex: "fecha",
      key: "fecha",
      render: (f) => formatFecha(f),
      sorter: (a, b) => new Date(b.fecha) - new Date(a.fecha),
      defaultSortOrder: "ascend",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (v) => <strong>{formatCurrency(v)}</strong>,
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: "Método de pago",
      dataIndex: "metodoPago",
      key: "metodoPago",
      responsive: ["sm"],
      render: (m) => <Tag color={m === "Efectivo" ? "green" : "blue"}>{m}</Tag>,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (e) => (
        <Tag color={e === "Activa" ? "success" : "default"}>{e}</Tag>
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
              disabled={record.estado === "Deshabilitada"}
              onClick={() => editar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Deshabilitar esta venta?"
            description="Se restaurará el stock de los productos vendidos."
            okText="Sí, deshabilitar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            disabled={record.estado === "Deshabilitada"}
            onConfirm={() => deshabilitarVenta(record.id)}
          >
            <Tooltip title="Deshabilitar">
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                disabled={record.estado === "Deshabilitada"}
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
          rowKey="id"
          scroll={{ x: 700 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>

      <VentaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        ventaEditar={ventaEditar}
      />
      <VentaDetalle
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        venta={ventaDetalle}
      />
    </div>
  )
}
