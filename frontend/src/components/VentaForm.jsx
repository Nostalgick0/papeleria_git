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
  message,
} from "antd"
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

const { Title, Text } = Typography

//formatea un número como moneda en pesos mexicanos
function formatCurrency(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor)
}

export default function VentaForm({ open, onClose, ventaEditar, onGuardado }) {
  const [productos, setProductos] = useState([])
  const [servicios, setServicios] = useState([])
  const [metodos, setMetodos] = useState([])

  const [items, setItems] = useState([])
  const [serviciosAgregados, setServiciosAgregados] = useState([])
  //cantidades que tenía originalmente la venta al abrir el formulario,
  //se usan para "devolver" ese stock mientras se edita
  const [cantidadesOriginales, setCantidadesOriginales] = useState({})
  const [metodoPago, setMetodoPago] = useState(null)
  const [productoSel, setProductoSel] = useState(null)
  const [servicioSel, setServicioSel] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const editando = !!ventaEditar

  useEffect(() => {
    if (open) {
      cargarCatalogos()
    }
  }, [open])

  //trae productos, servicios y métodos de pago disponibles
  const cargarCatalogos = async () => {
    try {
      const [resProductos, resServicios, resMetodos] = await Promise.all([
        axios.get(`${BACKEND_URL}/obtenerProductos`),
        axios.get(`${BACKEND_URL}/obtenerServicios`),
        axios.get(`${BACKEND_URL}/obtenerMetodos`),
      ])
      setProductos(resProductos.data)
      setServicios(resServicios.data)
      setMetodos(resMetodos.data)
    } catch (error) {
      message.error("Error al cargar los catálogos")
    }
  }

  // Inicializar / resetear el formulario cuando se abre
  useEffect(() => {
    if (open) {
      if (ventaEditar) {
        cargarDetalleVenta()
        setMetodoPago(ventaEditar.fk_metodo_pago)
      } else {
        setItems([])
        setServiciosAgregados([])
        setCantidadesOriginales({})
        setMetodoPago(null)
      }
      setProductoSel(null)
      setServicioSel(null)
    }
  }, [open, ventaEditar])

  //trae los productos/servicios que ya tiene la venta que se está editando
  const cargarDetalleVenta = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/obtenerDetalleVenta/${ventaEditar.pk_venta}`,
      )
      const detalle = response.data

      const itemsCargados = detalle
        .filter((d) => d.fk_producto)
        .map((d) => ({
          fk_producto: d.fk_producto,
          nombre_producto: d.nombre_producto,
          cantidad_unidad: Number(d.cantidad_unidad),
          precio_unidad_prod: Number(d.precio_unidad_prod),
          subtotal: Number(d.subtotal),
        }))
      setItems(itemsCargados)

      setServiciosAgregados(
        detalle
          .filter((d) => d.fk_servicio)
          .map((d) => ({
            fk_servicio: d.fk_servicio,
            nombre_servicio: d.nombre_servicio,
            cantidad_servicio: Number(d.cantidad_servicio),
            precio_unidad_serv: Number(d.precio_unidad_serv),
            subtotal: Number(d.subtotal),
          })),
      )

      const originales = {}
      itemsCargados.forEach((i) => {
        originales[i.fk_producto] = i.cantidad_unidad
      })
      setCantidadesOriginales(originales)
    } catch (error) {
      message.error("Error al cargar el detalle de la venta")
    }
  }

  const productosActivos = productos.filter((p) => p.estatus === 1)

  // Stock efectivo disponible para cada producto.
  // Si estamos editando una venta activa, las cantidades que ya tenía la venta
  // se "devuelven" al stock disponible para la edición.
  const stockEfectivo = useMemo(() => {
    const mapa = {}
    productos.forEach((p) => {
      const devuelto =
        editando && ventaEditar.estatus === 1
          ? cantidadesOriginales[p.pk_producto] || 0
          : 0
      mapa[p.pk_producto] = Number(p.stock) + devuelto
    })
    return mapa
  }, [productos, editando, ventaEditar, cantidadesOriginales])

  function agregarItem() {
    if (!productoSel) return
    if (items.some((i) => i.fk_producto === productoSel)) {
      message.warning("Ese producto ya está en la venta. Ajusta la cantidad.")
      return
    }
    const prod = productos.find((p) => p.pk_producto === productoSel)
    if (!prod) return
    setItems((prev) => [
      ...prev,
      {
        fk_producto: prod.pk_producto,
        nombre_producto: prod.nombre_producto,
        cantidad_unidad: 1,
        precio_unidad_prod: Number(prod.precio_venta),
        subtotal: Number(prod.precio_venta),
      },
    ])
    setProductoSel(null)
  }

  function cambiarCantidad(fk_producto, cantidad) {
    setItems((prev) =>
      prev.map((i) =>
        i.fk_producto === fk_producto
          ? {
              ...i,
              cantidad_unidad: cantidad || 0,
              subtotal: (cantidad || 0) * i.precio_unidad_prod,
            }
          : i,
      ),
    )
  }

  function quitarItem(fk_producto) {
    setItems((prev) => prev.filter((i) => i.fk_producto !== fk_producto))
  }

  function agregarServicio() {
    if (!servicioSel) return
    if (serviciosAgregados.some((s) => s.fk_servicio === servicioSel)) {
      message.warning("Ese servicio ya fue agregado.")
      return
    }
    const serv = servicios.find((s) => s.pk_servicio === servicioSel)
    if (!serv) return
    setServiciosAgregados((prev) => [
      ...prev,
      {
        fk_servicio: serv.pk_servicio,
        nombre_servicio: serv.nombre_servicio,
        cantidad_servicio: 1,
        precio_unidad_serv: Number(serv.precio_servicio),
        subtotal: Number(serv.precio_servicio),
      },
    ])
    setServicioSel(null)
  }

  function cambiarServicio(fk_servicio, campo, valor) {
    setServiciosAgregados((prev) =>
      prev.map((s) => {
        if (s.fk_servicio !== fk_servicio) return s
        const actualizado = { ...s, [campo]: valor || 0 }
        actualizado.subtotal = actualizado.cantidad_servicio * actualizado.precio_unidad_serv
        return actualizado
      }),
    )
  }

  function quitarServicio(fk_servicio) {
    setServiciosAgregados((prev) => prev.filter((s) => s.fk_servicio !== fk_servicio))
  }

  const total = useMemo(() => {
    const totalItems = items.reduce((acc, i) => acc + Number(i.subtotal), 0)
    const totalServicios = serviciosAgregados.reduce((acc, s) => acc + Number(s.subtotal), 0)
    return totalItems + totalServicios
  }, [items, serviciosAgregados])

  // Validación: alguna cantidad supera el stock disponible
  const itemsConError = items.filter(
    (i) => i.cantidad_unidad > (stockEfectivo[i.fk_producto] ?? 0),
  )
  const hayError = itemsConError.length > 0

  async function guardar() {
    if (items.length === 0 && serviciosAgregados.length === 0) {
      message.error("Agrega al menos un producto o servicio.")
      return
    }
    if (!metodoPago) {
      message.error("Selecciona un método de pago.")
      return
    }
    if (hayError) {
      message.error("Hay productos cuya cantidad supera el stock disponible.")
      return
    }

    const datos = {
      fecha_venta: editando
        ? new Date(ventaEditar.fecha_venta).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      total_venta: total,
      fk_metodo_pago: metodoPago,
      items: items.map((i) => ({
        fk_producto: i.fk_producto,
        precio_unidad_prod: i.precio_unidad_prod,
        cantidad_unidad: i.cantidad_unidad,
        subtotal: i.subtotal,
      })),
      servicios: serviciosAgregados.map((s) => ({
        fk_servicio: s.fk_servicio,
        cantidad_servicio: s.cantidad_servicio,
        precio_unidad_serv: s.precio_unidad_serv,
        subtotal: s.subtotal,
      })),
    }

    setGuardando(true)
    try {
      if (editando) {
        await axios.post(`${BACKEND_URL}/actualizarVenta`, {
          pk_venta: ventaEditar.pk_venta,
          ...datos,
        })
        message.success("Venta actualizada correctamente.")
      } else {
        await axios.post(`${BACKEND_URL}/insertarVenta`, datos)
        message.success("Venta registrada correctamente.")
      }
      onGuardado?.()
      onClose()
    } catch (error) {
      message.error("Error al guardar la venta")
    } finally {
      setGuardando(false)
    }
  }

  const columnasItems = [
    { title: "Producto", dataIndex: "nombre_producto", key: "nombre_producto" },
    {
      title: "Precio",
      dataIndex: "precio_unidad_prod",
      key: "precio",
      width: 90,
      render: (v) => formatCurrency(v),
    },
    {
      title: "Cantidad",
      key: "cantidad",
      width: 130,
      render: (_, record) => {
        const disponible = stockEfectivo[record.fk_producto] ?? 0
        const excede = record.cantidad_unidad > disponible
        return (
          <div>
            <InputNumber
              min={1}
              value={record.cantidad_unidad}
              status={excede ? "error" : ""}
              onChange={(val) => cambiarCantidad(record.fk_producto, val)}
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
          onClick={() => quitarItem(record.fk_producto)}
          aria-label="Quitar producto"
        />
      ),
    },
  ]

  const columnasServicios = [
    { title: "Servicio", dataIndex: "nombre_servicio", key: "nombre_servicio" },
    {
      title: "Cantidad",
      key: "cantidad",
      width: 110,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.cantidad_servicio}
          onChange={(val) => cambiarServicio(record.fk_servicio, "cantidad_servicio", val)}
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
          value={record.precio_unidad_serv}
          onChange={(val) =>
            cambiarServicio(record.fk_servicio, "precio_unidad_serv", val)
          }
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
          onClick={() => quitarServicio(record.fk_servicio)}
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
            <Button
              type="primary"
              onClick={guardar}
              disabled={hayError}
              loading={guardando}
            >
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
            value: p.pk_producto,
            label: `${p.nombre_producto} — ${formatCurrency(p.precio_venta)} (stock: ${p.stock})`,
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
          rowKey="fk_producto"
          pagination={false}
          size="small"
          scroll={{ x: 520 }}
        />
      )}

      <Divider />

      <Title level={5}>Servicios adicionales</Title>
      <Space.Compact style={{ width: "100%", marginBottom: 12 }}>
        <Select
          placeholder="Selecciona un servicio..."
          value={servicioSel}
          onChange={setServicioSel}
          style={{ width: "100%" }}
          options={servicios.map((s) => ({
            value: s.pk_servicio,
            label: s.nombre_servicio,
          }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={agregarServicio}>
          Agregar
        </Button>
      </Space.Compact>

      {serviciosAgregados.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin servicios" />
      ) : (
        <Table
          columns={columnasServicios}
          dataSource={serviciosAgregados}
          rowKey="fk_servicio"
          pagination={false}
          size="small"
          scroll={{ x: 480 }}
        />
      )}

      <Divider />

      <Title level={5}>Método de pago</Title>
      <Select
        placeholder="Selecciona un método de pago..."
        value={metodoPago}
        onChange={setMetodoPago}
        style={{ width: 240 }}
        options={metodos.map((m) => ({
          value: m.pk_metodo_pago,
          label: m.nombre_metodo_pago,
        }))}
      />
    </Drawer>
  )
}