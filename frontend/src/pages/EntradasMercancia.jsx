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
import { PlusOutlined, EditOutlined, StopOutlined } from "@ant-design/icons"
import axios from "axios"
import { BACKEND_URL } from "../Backend"
import EntradaForm from "../components/EntradaForm"

const { Title } = Typography
const { useBreakpoint } = Grid

//formatea un número como moneda en pesos mexicanos
function formatCurrency(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(valor))
}

//formatea una fecha a formato legible dd/mm/aaaa
function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-MX")
}

export default function EntradasMercancia() {
  const [entradas, setEntradas] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [entradaEditar, setEntradaEditar] = useState(null)
  const screens = useBreakpoint()

  useEffect(() => {
    cargarEntradas()
  }, [])

  //trae las entradas de mercancía desde el backend
  const cargarEntradas = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/obtenerEntradas`)
      setEntradas(response.data)
    } catch (error) {
      message.error("Error al cargar las entradas de mercancía")
    }
  }

  //deshabilita una entrada en el backend y refresca la tabla
  const deshabilitarEntrada = async (id) => {
    try {
      await axios.post(`${BACKEND_URL}/deshabilitarEntrada`, { id })
      message.success("Entrada deshabilitada correctamente")
      cargarEntradas()
    } catch (error) {
      message.error("Error al deshabilitar la entrada")
    }
  }

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
      dataIndex: "fecha_compra",
      key: "fecha_compra",
      render: (f) => formatFecha(f),
      sorter: (a, b) => new Date(b.fecha_compra) - new Date(a.fecha_compra),
      defaultSortOrder: "ascend",
    },
    {
      title: "Producto",
      dataIndex: "nombre_producto",
      key: "nombre_producto",
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
      dataIndex: "costo_unitario_compra",
      key: "costo_unitario_compra",
      align: "right",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Proveedor",
      dataIndex: "nombre_proveedor",
      key: "nombre_proveedor",
      responsive: ["md"],
      render: (p) => p || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "Estado",
      dataIndex: "estatus",
      key: "estatus",
      render: (e) => (
        <Tag color={e === 1 ? "success" : "default"}>{e === 1 ? "Activa" : "Deshabilitada"}</Tag>
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
              disabled={record.estatus !== 1}
              onClick={() => editar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Deshabilitar esta entrada?"
            description="Se restará del stock la cantidad que había sumado."
            okText="Sí, deshabilitar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            disabled={record.estatus !== 1}
            onConfirm={() => deshabilitarEntrada(record.pk_entrada_producto)}
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
          rowKey="pk_entrada_producto"
          scroll={{ x: 760 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>

      <EntradaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        entradaEditar={entradaEditar}
        onGuardado={cargarEntradas}
      />
    </div>
  )
}