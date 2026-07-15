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
import { PlusOutlined, EditOutlined, StopOutlined } from "@ant-design/icons"
import { useData } from "../context/DataContext"
import { formatCurrency, formatFecha } from "../utils/helpers"
import EntradaForm from "../components/EntradaForm"

const { Title } = Typography
const { useBreakpoint } = Grid

export default function EntradasMercancia() {
  const { entradas, deshabilitarEntrada } = useData()
  const [formOpen, setFormOpen] = useState(false)
  const [entradaEditar, setEntradaEditar] = useState(null)
  const screens = useBreakpoint()

  function nueva() {
    setEntradaEditar(null)
    setFormOpen(true)
  }

  function editar(entrada) {
    setEntradaEditar(entrada)
    setFormOpen(true)
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
      title: "Producto",
      dataIndex: "nombreProducto",
      key: "producto",
      render: (n) => <strong>{n}</strong>,
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      align: "center",
    },
    {
      title: "Costo unit.",
      dataIndex: "costoUnitario",
      key: "costo",
      align: "right",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Proveedor",
      dataIndex: "proveedor",
      key: "proveedor",
      responsive: ["md"],
      render: (p) => p || <Typography.Text type="secondary">—</Typography.Text>,
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
      width: 110,
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              size="small"
              icon={<EditOutlined />}
              disabled={record.estado === "Deshabilitada"}
              onClick={() => editar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Deshabilitar esta entrada?"
            description="Se restará del stock la cantidad que había sumado."
            okText="Sí, deshabilitar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            disabled={record.estado === "Deshabilitada"}
            onConfirm={() => deshabilitarEntrada(record.id)}
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
          Entradas de Mercancía
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={nueva}>
          Nueva entrada
        </Button>
      </div>

      <Card styles={{ body: { padding: screens.md ? 24 : 8 } }}>
        <Table
          columns={columnas}
          dataSource={entradas}
          rowKey="id"
          scroll={{ x: 760 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>

      <EntradaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        entradaEditar={entradaEditar}
      />
    </div>
  )
}
