import { useMemo, useState, useEffect } from "react"
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
  Grid,
  App,
} from "antd"
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from "@ant-design/icons"
import axios from "axios"
import ProveedorForm from "../components/ProveedorForm"

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    fetchProveedores()
  }, [])

  async function fetchProveedores() {
    setLoading(true)
    try {
      const res = await axios.get("http://localhost:5002/obtenerProveedores")
      // map backend fields to frontend shape
      const data = (res.data || []).map((p) => {
        const empresasString = p.empresas || p.empresa || p.fk_empresa || ""
        const empresasArray = empresasString
          ? empresasString.split(",").map((item) => item.trim()).filter(Boolean)
          : []

        return {
          id: String(p.pk_proveedor),
          nombre: p.nombre_proveedor,
          empresa: empresasString,
          empresas: empresasArray,
          RFC: p.RFC,
          telefono: p.telefono,
          correo: p.correo,
          estado: p.estatus === 1 || p.estatus === '1' ? 'Activo' : 'Inactivo',
        }
      })
      setProveedores(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  const [formOpen, setFormOpen] = useState(false)
  const [proveedorEditar, setProveedorEditar] = useState(null)
  const [busqueda, setBusqueda] = useState("")
  const screens = useBreakpoint()
  const { message } = App.useApp()

  const proveedoresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return proveedores
    return proveedores.filter((p) => {
      return [p.nombre, p.empresa, p.RFC, p.telefono, p.correo]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    })
  }, [busqueda, proveedores])

  function nuevoProveedor() {
    setProveedorEditar(null)
    setFormOpen(true)
  }

  function editarProveedorModal(proveedor) {
    setProveedorEditar(proveedor)
    setFormOpen(true)
  }

  function inactivarProveedor(proveedor) {
    // Enviar directamente el estado como "Inactivo"
    axios.put(`http://localhost:5002/proveedores/${proveedor.id}`, {...proveedor, estado: "Inactivo" 
    })
      .then(() => {
        message.success("Proveedor inactivado correctamente.")
        fetchProveedores()
      })
      .catch((err) => {
        console.error(err)
        const serverMsg = err?.response?.data?.error || err?.response?.data?.message
        message.error(serverMsg || "Error inactivando el proveedor")
      })
  }

  const columnas = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      render: (valor) => <Text strong>{valor}</Text>,
    },
    {
      title: "Empresa",
      dataIndex: "empresa",
      key: "empresa",
      responsive: ["sm"],
    },
    {
      title: "RFC",
      dataIndex: "RFC",
      key: "RFC",
      responsive: ["md"],
    },
    {
      title: "Número de teléfono",
      dataIndex: "telefono",
      key: "telefono",
      responsive: ["lg"],
    },
    {
      title: "Correo electrónico",
      dataIndex: "correo",
      key: "correo",
      responsive: ["lg"],
      render: (valor) => valor || <Text type="secondary">—</Text>,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      align: "center",
      render: (estado) => (
        <Tag color={estado === "Activo" ? "success" : "default"}>{estado}</Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      fixed: "right",
      width: 150,
      render: (_, record) => {
        const esInactivo = record.estado === "Inactivo";

        return (
          <Space>
            <Tooltip title="Editar">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => editarProveedorModal(record)}
              />
            </Tooltip>

            <Tooltip title={esInactivo ? "Proveedor inactivado" : "Inactivar"}>
              <Popconfirm
                title="¿Inactivar este proveedor?"
                okText="Sí, inactivar"
                cancelText="Cancelar"
                onConfirm={() => inactivarProveedor(record)}
                disabled={esInactivo} // Evita que se abra la confirmación si ya está inactivo
              >
                <Button
                  size="small"
                  danger
                  disabled={esInactivo} // Deshabilita el botón visualmente y bloquea clics
                  icon={<StopOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
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
          Proveedores
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={nuevoProveedor}>
          Nuevo proveedor
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Buscar proveedor por nombre, empresa, RFC o correo"
          allowClear
          enterButton
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </Card>

      <Card>
        <Table
          columns={columnas}
          dataSource={proveedoresFiltrados}
          rowKey="id"
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 900 }}
          bordered
        />
      </Card>

      <ProveedorForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        proveedorEditar={proveedorEditar}
        onSaved={() => {
          setFormOpen(false)
          fetchProveedores()
        }}
      />
    </div>
  )
}
