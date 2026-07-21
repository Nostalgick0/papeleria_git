import { useEffect, useMemo, useState } from "react"
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Input,
  Grid,
  Spin,
} from "antd"
import {
  FolderOutlined,
  ToolOutlined,
  PrinterOutlined,
  CreditCardOutlined,
  HomeOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  StopOutlined,
} from "@ant-design/icons"
import axios from "axios"
import { BACKEND_URL } from "../Backend"
import CatalogoForm from "../components/CatalogoForm"
import { App } from "antd"

const { Title, Text } = Typography
const { useBreakpoint } = Grid

const sections = [
  {
    key: "categorias",
    title: "Categorías",
    subtitle: "Define el catálogo de categorías para los productos",
    listEndpoint: "obtenerCategorias",
    endpoint: "categorias",
    icon: <FolderOutlined />,
    label: "Nombre de la categoría",
    placeholder: "Ej. Escritura",
    singular: "categoría",
    hasPrice: false,
  },
  {
    key: "unidades",
    title: "Unidades de venta",
    subtitle: "Agrega las unidades disponibles para los productos",
    listEndpoint: "obtenerUnidades",
    endpoint: "unidades",
    icon: <ToolOutlined />,
    label: "Nombre de la unidad",
    placeholder: "Ej. Paquete",
    singular: "unidad",
    hasPrice: false,
  },
  {
    key: "servicios",
    title: "Servicios adicionales",
    subtitle: "Configura los servicios que el negocio puede vender",
    listEndpoint: "obtenerServicios",
    endpoint: "servicios",
    icon: <PrinterOutlined />,
    label: "Nombre del servicio",
    placeholder: "Ej. Fotocopiado",
    singular: "servicio",
    hasPrice: false,
  },
  {
    key: "metodos",
    title: "Métodos de pago",
    subtitle: "Define los medios de pago aceptados",
    listEndpoint: "obtenerMetodos",
    endpoint: "metodos",
    icon: <CreditCardOutlined />,
    label: "Nombre del método de pago",
    placeholder: "Ej. Efectivo",
    singular: "método de pago",
    hasPrice: false,
  },
  {
    key: "empresas",
    title: "Empresas de proveedores",
    subtitle: "Registra las empresas proveedoras asociadas",
    listEndpoint: "obtenerEmpresas",
    endpoint: "empresas",
    icon: <HomeOutlined />,
    label: "Nombre de la empresa",
    placeholder: "Ej. Tony",
    singular: "empresa",
    hasPrice: false,
  },
]

function mapApiItem(sectionKey, item) {
  const estado = item.estatus === 1 || item.estatus === "1" ? "Activo" : "Inactivo"

  switch (sectionKey) {
    case "categorias":
      return {
        id: String(item.pk_categoria),
        nombre: item.nombre_categoria,
        estado,
      }
    case "unidades":
      return {
        id: String(item.pk_unidad),
        nombre: item.nombre_unidad,
        estado,
      }
    case "servicios":
      return {
        id: String(item.pk_servicio),
        nombre: item.nombre_servicio,
        estado,
      }
    case "metodos":
      return {
        id: String(item.pk_metodo_pago),
        nombre: item.nombre_metodo_pago,
        estado,
      }
    case "empresas":
      return {
        id: String(item.pk_empresa),
        nombre: item.nombre_empresa,
        estado,
      }
    default:
      return { id: String(item.id || item.pk_categoria), nombre: item.nombre, estado }
  }
}

function Catalogos() {
  const { message } = App.useApp()
  const [activeSection, setActiveSection] = useState(null)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [itemEditar, setItemEditar] = useState(null)
  const [search, setSearch] = useState("")
  const screens = useBreakpoint()

  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    setLoading(true)
    try {
      const results = await Promise.all(
        sections.map((section) => axios.get(`${BACKEND_URL}/${section.listEndpoint}`)),
      )
      const normalized = {}
      sections.forEach((section, index) => {
        normalized[section.key] = (results[index].data || []).map((item) =>
          mapApiItem(section.key, item),
        )
      })
      setData(normalized)
    } catch (error) {
      console.error("Error cargando catálogos:", error)
    } finally {
      setLoading(false)
    }
  }

  function openSection(key) {
    console.log("Abrir sección:", key)
    setActiveSection(key)
    setSearch("")
    setItemEditar(null)
  }

  function closeSection() {
    setActiveSection(null)
    setFormOpen(false)
    setItemEditar(null)
  }

  const sectionMeta = sections.find((section) => section.key === activeSection)
  const rawItems = sectionMeta ? data[activeSection] || [] : []

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rawItems
    return rawItems.filter((item) =>
      [item.nombre, item.estado, item.precio?.toString() || ""].some((value) =>
        String(value).toLowerCase().includes(q),
      ),
    )
  }, [rawItems, search])

  async function onSaved() {
    await fetchAllData()
    setFormOpen(false)
    setItemEditar(null)
  }

  async function handleToggleEstado(record) {
    if (!sectionMeta) return
    const payload = {
      nombre: record.nombre,
      estado: record.estado === "Activo" ? "Inactivo" : "Activo",
    }
    if (sectionMeta.hasPrice) payload.precio = record.precio ?? 0

    try {
      setLoading(true)
      console.log("Toggle estado ->", sectionMeta.endpoint, record.id, payload)
      const res = await axios.put(`${BACKEND_URL}/${sectionMeta.endpoint}/${record.id}`, payload)
      console.log(res.data)
      message.success("Estado actualizado")
      await fetchAllData()
    } catch (error) {
      console.error(error)
      message.error(error?.response?.data?.error || error.message || "Error actualizando estado")
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: sectionMeta?.label || "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      render: (text) => <Text strong>{text}</Text>,
    },
    ...(sectionMeta?.hasPrice
      ? [
          {
            title: "Precio",
            dataIndex: "precio",
            key: "precio",
            align: "right",
            render: (value) => <Text>{value != null ? `$ ${Number(value).toFixed(2)}` : "-"}</Text>,
          },
        ]
      : []),
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
      width: 160,
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setItemEditar(record)
                setFormOpen(true)
              }}
            />
          </Tooltip>
          <Popconfirm
            title={
              record.estado === "Activo"
                ? `¿Inactivar esta ${sectionMeta?.singular}?`
                : `¿Activar esta ${sectionMeta?.singular}?`
            }
            okText="Sí"
            cancelText="Cancelar"
            onConfirm={() => handleToggleEstado(record)}
          >
            <Tooltip title={record.estado === "Activo" ? "Inactivar" : "Activar"}>
              <Button
                size="small"
                danger={record.estado === "Activo"}
                icon={<StopOutlined />}
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
          Catálogos
        </Title>
        {sectionMeta && (
          <Button icon={<ArrowLeftOutlined />} onClick={closeSection}>
            Volver a catálogos
          </Button>
        )}
      </div>

      {!activeSection ? (
        <Row gutter={[16, 16]}>
          {sections.map((section) => (
            <Col xs={24} sm={12} md={8} lg={8} key={section.key}>
              <Card hoverable onClick={() => openSection(section.key)}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 180,
                    gap: 12,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 32, color: "#3875F7" }}>{section.icon}</div>
                  <Title level={5} style={{ margin: 0 }}>
                    {section.title}
                  </Title>
                  <Text type="secondary">{section.subtitle}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  {sectionMeta.title}
                </Title>
                <Text type="secondary">{sectionMeta.subtitle}</Text>
              </div>

              <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
                Nuevo {sectionMeta.singular}
              </Button>
            </div>
          </Card>

          <Card>
            <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Input.Search
                placeholder={`Buscar ${sectionMeta.title.toLowerCase()}`}
                allowClear
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{ minWidth: 260, flex: 1 }}
              />
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                <Spin />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={filteredItems}
                rowKey="id"
                pagination={{ pageSize: 8, showSizeChanger: false }}
                scroll={{ x: true }}
              />
            )}
          </Card>
        </>
      )}

      <CatalogoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        itemEditar={itemEditar}
        onSaved={onSaved}
        sectionMeta={sectionMeta || sections[0]}
      />
    </div>
  )
}

export default Catalogos