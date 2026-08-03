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
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons"
import axios from "axios"
import { BACKEND_URL } from "../Backend"
import ProveedorForm from "../components/ProveedorForm"

const { Title, Text } = Typography
const { useBreakpoint } = Grid

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [proveedorEditar, setProveedorEditar] = useState(null)
  const screens = useBreakpoint()

  useEffect(() => {
    cargarProveedores()
  }, [])

  //trae los proveedores desde el backend
  const cargarProveedores = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/obtenerProveedores`)
      setProveedores(response.data)
    } catch (error) {
      message.error("Error al cargar los proveedores")
    }
  }

  //activa o desactiva un proveedor y refresca la tabla
  const cambiarEstadoProveedor = async (pk_proveedor, estatus) => {
    try {
      await axios.post(`${BACKEND_URL}/cambiarEstadoProveedor`, {
        pk_proveedor,
        estatus,
      })
      message.success("Estado del proveedor actualizado correctamente")
      cargarProveedores()
    } catch (error) {
      message.error("Error al actualizar el estado del proveedor")
    }
  }

  function nuevoProveedor() {
    setProveedorEditar(null)
    setFormOpen(true)
  }

  function editarProveedorModal(proveedor) {
    setProveedorEditar(proveedor)
    setFormOpen(true)
  }

  const columnas = [
    {
      title: "Nombre",
      dataIndex: "nombre_proveedor",
      key: "nombre_proveedor",
      render: (valor) => <Text strong>{valor}</Text>,
    },
    {
      title: "Empresa",
      dataIndex: "nombre_empresa",
      key: "nombre_empresa",
      responsive: ["sm"],
      render: (valor) => valor || <Text type="secondary">—</Text>,
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
      dataIndex: "estatus",
      key: "estatus",
      align: "center",
      render: (estatus) => (
        <Tag color={estatus === 1 ? "success" : "default"}>
          {estatus === 1 ? "Activo" : "Inactivo"}
        </Tag>
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
              onClick={() => editarProveedorModal(record)}
            />
          </Tooltip>
          {record.estatus === 1 ? (
            <Popconfirm
              title="¿Desactivar este proveedor?"
              okText="Sí, desactivar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => cambiarEstadoProveedor(record.pk_proveedor, 0)}
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
                onClick={() => cambiarEstadoProveedor(record.pk_proveedor, 1)}
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
          Proveedores
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={nuevoProveedor}>
          Nuevo proveedor
        </Button>
      </div>

      <Card styles={{ body: { padding: screens.md ? 24 : 8 } }}>
        <Table
          columns={columnas}
          dataSource={proveedores}
          rowKey="pk_proveedor"
          scroll={{ x: 900 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>

      <ProveedorForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        proveedorEditar={proveedorEditar}
        onGuardado={cargarProveedores}
      />
    </div>
  )
}