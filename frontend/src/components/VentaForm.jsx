import { useState, useEffect, useMemo } from "react"
import {
  Drawer,
  Select,
  Button,
  InputNumber,
  Table,
  Typography,
  Divider,
  Space,
  Empty,
  App,
  Form,
} from "antd"
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useData } from "../context/DataContext"
import { formatCurrency } from "../utils/helpers"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

const { Title, Text } = Typography

export default function VentaForm({ open, onClose, ventaEditar }) {
  const { productos, agregarVenta, editarVenta } = useData()
  const { message } = App.useApp()

  const [items, setItems] = useState([])
  const [servicios, setServicios] = useState([])
  const [metodoPago, setMetodoPago] = useState("")
  const [productoSel, setProductoSel] = useState(null)
  const [servicioSel, setServicioSel] = useState(null)
  const [serviciosOptions, setServiciosOptions] = useState([])
  const [loadingServicios, setLoadingServicios] = useState(false)
  const [metodosOptions, setMetodosOptions] = useState([])
  const [loadingMetodos, setLoadingMetodos] = useState(false)

  const editando = !!ventaEditar

  // Inicializar / resetear el formulario cuando se abre
  useEffect(() => {
    if (open) {
      if (ventaEditar) {
        setItems(ventaEditar.items.map((i) => ({ ...i })))
        setServicios((ventaEditar.servicios || []).map((s) => ({ ...s })))
        setMetodoPago(ventaEditar.metodoPago)
      } else {
        setItems([])
        setServicios([])
        setMetodoPago("")
      }
      setProductoSel(null)
      setServicioSel(null)
    }
  }, [open, ventaEditar])

  const productosActivos = productos.filter((p) => p.estado === "Activo")

  // Stock efectivo disponible para cada producto.
  // Si estamos editando una venta activa, las cantidades ya incluidas en la venta
  // se "devuelven" al stock disponible para la edición.
  const stockEfectivo = useMemo(() => {
    const mapa = {}
    productos.forEach((p) => {
      mapa[p.id] = p.stockActual
    })
    if (editando && ventaEditar.estado === "Activa") {
      ventaEditar.items.forEach((it) => {
        mapa[it.productoId] = (mapa[it.productoId] || 0) + it.cantidad
      })
    }
    return mapa
  }, [productos, editando, ventaEditar])

  function agregarItem() {
    if (!productoSel) return
    if (items.some((i) => i.productoId === productoSel)) {
      message.warning("Ese producto ya está en la venta. Ajusta la cantidad.")
      return
    }
    const prod = productos.find((p) => p.id === productoSel)
    if (!prod) return
    setItems((prev) => [
      ...prev,
      {
        productoId: prod.id,
        nombre: prod.nombre,
        cantidad: 1,
        precioUnitario: prod.precioVenta,
        subtotal: prod.precioVenta,
      },
    ])
    setProductoSel(null)
  }

  function cambiarCantidad(productoId, cantidad) {
    setItems((prev) =>
      prev.map((i) =>
        i.productoId === productoId
          ? { ...i, cantidad: cantidad || 0, subtotal: (cantidad || 0) * i.precioUnitario }
          : i,
      ),
    )
  }

  function quitarItem(productoId) {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  function agregarServicio() {
    if (!servicioSel) return
    if (servicios.some((s) => s.nombre === servicioSel)) {
      message.warning("Ese servicio ya fue agregado.")
      return
    }
    setServicios((prev) => [
      ...prev,
      { nombre: servicioSel, cantidad: 1, precioUnitario: 0, subtotal: 0 },
    ])
    setServicioSel(null)
  }

  function cambiarServicio(nombre, campo, valor) {
    setServicios((prev) =>
      prev.map((s) => {
        if (s.nombre !== nombre) return s
        const actualizado = { ...s, [campo]: valor || 0 }
        actualizado.subtotal = actualizado.cantidad * actualizado.precioUnitario
        return actualizado
      }),
    )
  }

  function quitarServicio(nombre) {
    setServicios((prev) => prev.filter((s) => s.nombre !== nombre))
  }

  const total = useMemo(() => {
    const totalItems = items.reduce((acc, i) => acc + i.subtotal, 0)
    const totalServicios = servicios.reduce((acc, s) => acc + s.subtotal, 0)
    return totalItems + totalServicios
  }, [items, servicios])

  useEffect(() => {
    async function fetchServicios() {
      setLoadingServicios(true)
      try {
        const res = await axios.get(`${BACKEND_URL}/obtenerServicios`)
        setServiciosOptions(
          (res.data || [])
            .filter((s) => s.estatus === 1)
            .map((s) => ({
              value: s.nombre_servicio,
              label: s.nombre_servicio,
            })),
        )
      } catch (error) {
        console.error("Error cargando servicios:", error)
        setServiciosOptions([])
      } finally {
        setLoadingServicios(false)
      }
    }

    async function fetchMetodos() {
      setLoadingMetodos(true)
      try {
        const res = await axios.get(`${BACKEND_URL}/obtenerMetodos`)
        setMetodosOptions(
          (res.data || [])
            .filter((m) => m.estatus === 1)
            .map((m) => ({
              value: m.nombre_metodo_pago,
              label: m.nombre_metodo_pago,
            })),
        )
      } catch (error) {
        console.error("Error cargando métodos de pago:", error)
        setMetodosOptions([])
      } finally {
        setLoadingMetodos(false)
      }
    }

    if (open) {
      fetchServicios()
      fetchMetodos()
    }
  }, [open])

  // Validación: alguna cantidad supera el stock disponible
  const itemsConError = items.filter(
    (i) => i.cantidad > (stockEfectivo[i.productoId] ?? 0),
  )
  const hayError = itemsConError.length > 0

  function guardar() {
    if (items.length === 0 && servicios.length === 0) {
      message.error("Agrega al menos un producto o servicio.")
      return
    }
    if (hayError) {
      message.error("Hay productos cuya cantidad supera el stock disponible.")
      return
    }
    const datos = {
      items: items.map((i) => ({ ...i })),
      servicios: servicios.map((s) => ({ ...s })),
      metodoPago,
      total,
    }

    if (editando) {
      editarVenta(ventaEditar.id, datos)
      message.success("Venta actualizada correctamente.")
    } else {
      agregarVenta(datos)
      message.success("Venta registrada correctamente.")
    }
    onClose()
  }

  const columnasItems = [
    { title: "Producto", dataIndex: "nombre", key: "nombre" },
    {
      title: "Precio",
      dataIndex: "precioUnitario",
      key: "precio",
      width: 90,
      render: (v) => formatCurrency(v),
    },
    {
      title: "Cantidad",
      key: "cantidad",
      width: 130,
      render: (_, record) => {
        const disponible = stockEfectivo[record.productoId] ?? 0
        const excede = record.cantidad > disponible
        return (
          <div>
            <InputNumber
              min={1}
              value={record.cantidad}
              status={excede ? "error" : ""}
              onChange={(val) => cambiarCantidad(record.productoId, val)}
              style={{ width: "100%" }}
            />
            <Text type={excede ? "danger" : "secondary"} style={{ fontSize: 11 }}>
              {excede ? `Máx: ${disponible}` : `Stock: ${disponible}`}
            </Text>
          </div>
        )
      },
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      width: 100,
      align: "right",
      render: (v) => formatCurrency(v),
    },
    {
      title: "",
      key: "accion",
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => quitarItem(record.productoId)}
          aria-label="Quitar producto"
        />
      ),
    },
  ]

  const columnasServicios = [
    { title: "Servicio", dataIndex: "nombre", key: "nombre" },
    {
      title: "Cantidad",
      key: "cantidad",
      width: 110,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.cantidad}
          onChange={(val) => cambiarServicio(record.nombre, "cantidad", val)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Precio unit.",
      key: "precio",
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={0}
          prefix="$"
          value={record.precioUnitario}
          onChange={(val) => cambiarServicio(record.nombre, "precioUnitario", val)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      width: 100,
      align: "right",
      render: (v) => formatCurrency(v),
    },
    {
      title: "",
      key: "accion",
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => quitarServicio(record.nombre)}
          aria-label="Quitar servicio"
        />
      ),
    },
  ]

  return (
    <Drawer
      title={editando ? "Editar venta" : "Nueva venta"}
      open={open}
      onClose={onClose}
      width={720}
      styles={{ body: { paddingBottom: 80 } }}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            Total: {formatCurrency(total)}
          </Title>
          <Space>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="primary" onClick={guardar} disabled={hayError}>
              {editando ? "Guardar cambios" : "Registrar venta"}
            </Button>
          </Space>
        </div>
      }
    >
      <Title level={5}>Productos</Title>
      <Space.Compact style={{ width: "100%", marginBottom: 12 }}>
        <Select
          showSearch
          placeholder="Buscar producto..."
          value={productoSel}
          onChange={setProductoSel}
          style={{ width: "100%" }}
          optionFilterProp="label"
          options={productosActivos.map((p) => ({
            value: p.id,
            label: `${p.nombre} — ${formatCurrency(p.precioVenta)} (stock: ${p.stockActual})`,
          }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={agregarItem}>
          Agregar
        </Button>
      </Space.Compact>

      {items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin productos" />
      ) : (
        <Table
          columns={columnasItems}
          dataSource={items}
          rowKey="productoId"
          pagination={false}
          size="small"
          scroll={{ x: 520 }}
        />
      )}

      <Divider />

      <Title level={5}>Servicios adicionales</Title>
      <Space.Compact style={{ width: "100%", marginBottom: 12 }}>
        <Select
          showSearch
          placeholder="Buscar servicio registrado..."
          value={servicioSel}
          onChange={setServicioSel}
          style={{ width: "100%" }}
          loading={loadingServicios}
          optionFilterProp="label"
          filterOption={(input, option) =>
            (option?.label || "").toLowerCase().includes(input.toLowerCase())
          }
          options={serviciosOptions}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={agregarServicio}>
          Agregar
        </Button>
      </Space.Compact>

      {servicios.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin servicios" />
      ) : (
        <Table
          columns={columnasServicios}
          dataSource={servicios}
          rowKey="nombre"
          pagination={false}
          size="small"
          scroll={{ x: 480 }}
        />
      )}

      <Divider />

      <Title level={5}>Método de pago</Title>
      <Form.Item
        label="Método de pago"
        style={{ marginBottom: 0 }}
      >
        <Select
          showSearch
          placeholder="Selecciona un método de pago"
          value={metodoPago}
          onChange={setMetodoPago}
          loading={loadingMetodos}
          optionFilterProp="label"
          filterOption={(input, option) =>
            (option?.label || "").toLowerCase().includes(input.toLowerCase())
          }
          options={metodosOptions}
        />
      </Form.Item>
    </Drawer>
  )
}
