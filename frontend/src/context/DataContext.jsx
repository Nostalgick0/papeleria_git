import { createContext, useContext, useEffect, useState } from "react"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

const DataContext = createContext(null)

function mapProductoBackend(item) {
  const estatus = item.estatus === 1 || item.estatus === "1" || item.estatus === true || item.estatus === "Activo" ? 1 : 0

  return {
    ...item,
    id: String(item.pk_producto ?? item.id ?? ""),
    pk_producto: item.pk_producto ?? item.id ?? null,
    nombre: item.nombre_producto ?? item.nombre ?? "",
    nombre_producto: item.nombre_producto ?? item.nombre ?? "",
    categoriaId: item.fk_categoria ?? item.categoriaId ?? null,
    categoria: item.fk_categoria ?? item.categoria ?? null,
    unidadId: item.fk_unidad ?? item.unidadId ?? null,
    unidad: item.fk_unidad ?? item.unidad ?? null,
    precioVenta: Number(item.precio_venta ?? item.precioVenta ?? 0),
    costoUltimaCompra: Number(item.costo_compra ?? item.costoUltimaCompra ?? 0),
    stockActual: Number(item.stock ?? item.stockActual ?? 0),
    stockMinimo: Number(item.stock_minimo ?? item.stockMinimo ?? 0),
    estado: estatus === 1 ? "Activo" : "Inactivo",
    estatus,
  }
}

function mapCategoriaBackend(item) {
  const estado = item.estatus === 1 || item.estatus === "1" ? "Activo" : "Inactivo"
  return {
    id: String(item.pk_categoria ?? item.id ?? ""),
    nombre: item.nombre_categoria ?? item.nombre ?? "",
    estado,
  }
}

function mapUnidadBackend(item) {
  const estado = item.estatus === 1 || item.estatus === "1" ? "Activo" : "Inactivo"
  return {
    id: String(item.pk_unidad ?? item.id ?? ""),
    nombre: item.nombre_unidad ?? item.nombre ?? "",
    estado,
  }
}

function mapProveedorBackend(item) {
  const estado = item.estatus === 1 || item.estatus === "1" ? "Activo" : "Inactivo"
  const empresasString = item.empresas || item.empresa || item.fk_empresa || ""
  const empresasArray = empresasString
    ? empresasString.split(",").map((valor) => valor.trim()).filter(Boolean)
    : []

  return {
    id: String(item.pk_proveedor ?? item.id ?? ""),
    nombre: item.nombre_proveedor ?? item.nombre ?? "",
    empresa: empresasString,
    empresas: empresasArray,
    RFC: item.RFC ?? "",
    telefono: item.telefono ?? "",
    correo: item.correo ?? "",
    estado,
  }
}

function mapEntradaBackend(item) {
  const estado = item.estatus === 1 || item.estatus === "1" ? "Activa" : "Deshabilitada"
  return {
    id: String(item.pk_entrada_producto ?? item.id ?? ""),
    productoId: String(item.fk_producto ?? item.productoId ?? ""),
    nombreProducto: item.nombre_producto ?? item.nombreProducto ?? "",
    cantidad: Number(item.cantidad ?? 0),
    costoUnitario: Number(item.costo_unitario_compra ?? item.costoUnitario ?? 0),
    proveedorId: item.fk_proveedor ?? item.proveedorId ?? "",
    proveedor: item.proveedor ?? item.proveedorNombre ?? "",
    fecha: item.fecha_compra ?? item.fecha ?? new Date().toISOString(),
    estado,
    total: Number(item.total ?? 0),
  }
}

function formatDateTime(value = new Date()) {
  const fecha = value instanceof Date ? value : new Date(value)
  const pad = (numero) => String(numero).padStart(2, "0")
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`
}

function mapVentaBackend(item, detalle = [], productosMap = new Map()) {
  const estado = item.estatus === 1 || item.estatus === "1" ? "Activa" : "Deshabilitada"
  const detalleVenta = (detalle || []).filter((registro) => String(registro.fk_venta) === String(item.pk_venta ?? item.id))

  const items = detalleVenta
    .filter((registro) => registro.fk_producto)
    .map((registro) => {
      const producto = productosMap.get(String(registro.fk_producto))
      return {
        productoId: String(registro.fk_producto),
        nombre: producto?.nombre || producto?.nombre_producto || "",
        cantidad: Number(registro.cantidad_unidad || 0),
        precioUnitario: Number(registro.precio_unidad_prod || 0),
        subtotal: Number(registro.subtotal || 0),
      }
    })

  const servicios = detalleVenta
    .filter((registro) => registro.fk_servicio)
    .map((registro) => ({
      servicioId: registro.fk_servicio ? String(registro.fk_servicio) : null,
      nombre: registro.nombre_servicio || registro.fk_servicio || "",
      cantidad: Number(registro.cantidad_servicio || 0),
      precioUnitario: Number(registro.precio_unidad_serv || 0),
      subtotal: Number(registro.subtotal || 0),
    }))

  return {
    id: String(item.pk_venta ?? item.id ?? ""),
    fecha: item.fecha_venta ?? item.fecha ?? new Date().toISOString(),
    total: Number(item.total_venta ?? item.total ?? 0),
    metodoPago: item.metodo_pago ?? item.nombre_metodo_pago ?? item.metodoPago ?? item.fk_metodo_pago ?? "",
    estado,
    items,
    servicios,
  }
}

export function DataProvider({ children }) {
  const [productos, setProductos] = useState([])
  const [ventas, setVentas] = useState([])
  const [entradas, setEntradas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [subcategorias, setSubcategorias] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(false)

  async function cargarDatos() {
    setLoading(true)
    try {
      const [resProductos, resCategorias, resUnidades, resProveedores, resEntradas, resVentas, resDetalle] = await Promise.all([
        axios.get(`${BACKEND_URL}/obtenerProductos`),
        axios.get(`${BACKEND_URL}/obtenerCategorias`),
        axios.get(`${BACKEND_URL}/obtenerUnidades`),
        axios.get(`${BACKEND_URL}/obtenerProveedores`),
        axios.get(`${BACKEND_URL}/obtenerEntradas`),
        axios.get(`${BACKEND_URL}/obtenerVentas`),
        axios.get(`${BACKEND_URL}/obtenerDetalle`),
      ])

      const productosMapeados = (resProductos.data || []).map(mapProductoBackend)
      const categoriasMapeadas = (resCategorias.data || []).map(mapCategoriaBackend)
      const unidadesMapeadas = (resUnidades.data || []).map(mapUnidadBackend)
      const proveedoresMapeados = (resProveedores.data || []).map(mapProveedorBackend)
      const entradasMapeadas = (resEntradas.data || []).map(mapEntradaBackend)
      const productosPorId = new Map(productosMapeados.map((producto) => [String(producto.id), producto]))
      const ventasMapeadas = (resVentas.data || []).map((venta) => mapVentaBackend(venta, resDetalle.data || [], productosPorId))

      setProductos(productosMapeados)
      setCategorias(categoriasMapeadas)
      setSubcategorias([])
      setProveedores(proveedoresMapeados)
      setEntradas(entradasMapeadas)
      setVentas(ventasMapeadas)
    } catch (error) {
      console.error("Error cargando datos dinámicos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  async function agregarProducto(datos) {
    const payload = {
      nombre_producto: datos.nombre || datos.nombre_producto || "",
      fk_categoria: datos.categoriaId ?? datos.fk_categoria ?? null,
      fk_unidad: datos.unidadId ?? datos.fk_unidad ?? null,
      precio_venta: Number(datos.precioVenta ?? datos.precio_venta ?? 0),
      costo_compra: Number(datos.costoUltimaCompra ?? datos.costo_compra ?? 0),
      stock: Number(datos.stockActual ?? datos.stock ?? 0),
      stock_minimo: Number(datos.stockMinimo ?? datos.stock_minimo ?? 0),
      estatus: 1,
    }

    try {
      await axios.post(`${BACKEND_URL}/insertarProducto`, payload)
      await cargarDatos()
    } catch (error) {
      console.error("Error al crear producto:", error)
      throw error
    }
  }

  async function editarProducto(id, datos) {
    try {
      await axios.post(`${BACKEND_URL}/actualizarProducto`, { pk_producto: id, ...datos })
      await cargarDatos()
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      throw error
    }
  }

  async function cambiarEstadoProducto(id, estado) {
    try {
      await axios.post(`${BACKEND_URL}/cambiarEstadoProducto`, { pk_producto: id, estatus: estado })
      await cargarDatos()
    } catch (error) {
      console.error("Error al cambiar estado del producto:", error)
      throw error
    }
  }

  async function agregarProveedor(datos) {
    const payload = {
      nombre: datos.nombre || "",
      empresa: datos.empresa || "",
      RFC: datos.RFC || "",
      telefono: datos.telefono || "",
      correo: datos.correo || "",
      estado: datos.estado || "Activo",
    }

    try {
      const res = await axios.post(`${BACKEND_URL}/proveedores`, payload)
      const nuevo = mapProveedorBackend({
        pk_proveedor: res.data?.id,
        nombre_proveedor: payload.nombre,
        empresa: payload.empresa,
        RFC: payload.RFC,
        telefono: payload.telefono,
        correo: payload.correo,
        estatus: payload.estado === "Activo" ? 1 : 0,
      })
      setProveedores((prev) => [...prev, nuevo])
      return nuevo
    } catch (error) {
      console.error("Error al crear proveedor:", error)
      throw error
    }
  }

  async function editarProveedor(id, datos) {
    try {
      await axios.put(`${BACKEND_URL}/proveedores/${id}`, {
        nombre: datos.nombre || "",
        empresa: datos.empresa || "",
        RFC: datos.RFC || "",
        telefono: datos.telefono || "",
        correo: datos.correo || "",
        estado: datos.estado || "Activo",
      })
      await cargarDatos()
    } catch (error) {
      console.error("Error al actualizar proveedor:", error)
      throw error
    }
  }

  async function cambiarEstadoProveedor(id, estado) {
    try {
      await axios.put(`${BACKEND_URL}/proveedores/${id}`, {
        nombre: "",
        empresa: "",
        RFC: "",
        telefono: "",
        correo: "",
        estado,
      })
      await cargarDatos()
      return { ok: true }
    } catch (error) {
      console.error("Error al cambiar estado del proveedor:", error)
      return { ok: false, mensaje: error.message }
    }
  }

  function agregarCategoria(datos) {
    const nueva = { ...datos, id: String(Date.now()), estado: datos.estado || "Activo" }
    setCategorias((prev) => [...prev, nueva])
    return nueva
  }

  function editarCategoria(id, datos) {
    setCategorias((prev) => prev.map((item) => (item.id === id ? { ...item, ...datos } : item)))
  }

  function cambiarEstadoCategoria(id, estado) {
    setCategorias((prev) => prev.map((item) => (item.id === id ? { ...item, estado } : item)))
    return { ok: true }
  }

  function agregarSubcategoria(datos) {
    const nueva = { ...datos, id: String(Date.now()), estado: datos.estado || "Activo" }
    setSubcategorias((prev) => [...prev, nueva])
    return nueva
  }

  function editarSubcategoria(id, datos) {
    setSubcategorias((prev) => prev.map((item) => (item.id === id ? { ...item, ...datos } : item)))
  }

  function cambiarEstadoSubcategoria(id, estado) {
    setSubcategorias((prev) => prev.map((item) => (item.id === id ? { ...item, estado } : item)))
    return { ok: true }
  }

  async function agregarVenta(datos) {
    try {
      await axios.post(`${BACKEND_URL}/ventas`, {
        items: datos.items || [],
        servicios: datos.servicios || [],
        metodoPago: datos.metodoPago || "",
        total: Number(datos.total || 0),
        fecha: formatDateTime(),
        estado: "Activa",
      })
      await cargarDatos()
    } catch (error) {
      console.error("Error al crear venta:", error)
      throw error
    }
  }

  async function editarVenta(id, nuevosDatos) {
    try {
      await axios.put(`${BACKEND_URL}/ventas/${id}`, {
        items: nuevosDatos.items || [],
        servicios: nuevosDatos.servicios || [],
        metodoPago: nuevosDatos.metodoPago || "",
        total: Number(nuevosDatos.total || 0),
        fecha: nuevosDatos.fecha ? formatDateTime(nuevosDatos.fecha) : formatDateTime(),
        estado: nuevosDatos.estado || "Activa",
      })
      await cargarDatos()
    } catch (error) {
      console.error("Error al actualizar venta:", error)
      throw error
    }
  }

  async function deshabilitarVenta(id) {
    try {
      await axios.patch(`${BACKEND_URL}/ventas/${id}/estado`, { estado: "Deshabilitada" })
      await cargarDatos()
    } catch (error) {
      console.error("Error al deshabilitar venta:", error)
      throw error
    }
  }

  function actualizarStockProducto(productoId, delta) {
    if (!productoId) return
    setProductos((prev) =>
      prev.map((producto) => {
        if (String(producto.id) !== String(productoId)) return producto
        const stockActual = Number(producto.stockActual ?? producto.stock ?? 0)
        const nuevoStock = Math.max(0, stockActual + Number(delta || 0))
        return {
          ...producto,
          stockActual: nuevoStock,
          stock: nuevoStock,
        }
      }),
    )
  }

  async function agregarEntrada(datos) {
    try {
      await axios.post(`${BACKEND_URL}/entradas`, {
        productoId: datos.productoId,
        cantidad: Number(datos.cantidad || 0),
        costoUnitario: Number(datos.costoUnitario || 0),
        proveedorId: datos.proveedorId || null,
        fecha: datos.fecha ? formatDateTime(datos.fecha) : formatDateTime(),
        total: Number(datos.cantidad || 0) * Number(datos.costoUnitario || 0),
        estado: "Activa",
      })

      if (datos.productoId) {
        actualizarStockProducto(datos.productoId, Number(datos.cantidad || 0))
      }

      await cargarDatos()
    } catch (error) {
      console.error("Error al crear entrada:", error)
      throw error
    }
  }

  async function editarEntrada(id, nuevosDatos) {
    try {
      const entradaAnterior = entradas.find((entrada) => String(entrada.id) === String(id))
      const estadoActivo = entradaAnterior?.estado === "Activa"
      const productoAnterior = entradaAnterior?.productoId
      const cantidadAnterior = Number(entradaAnterior?.cantidad || 0)

      await axios.put(`${BACKEND_URL}/entradas/${id}`, {
        productoId: nuevosDatos.productoId,
        cantidad: Number(nuevosDatos.cantidad || 0),
        costoUnitario: Number(nuevosDatos.costoUnitario || 0),
        proveedorId: nuevosDatos.proveedorId || null,
        fecha: nuevosDatos.fecha ? formatDateTime(nuevosDatos.fecha) : formatDateTime(),
        total: Number(nuevosDatos.cantidad || 0) * Number(nuevosDatos.costoUnitario || 0),
        estado: nuevosDatos.estado || "Activa",
      })

      if (estadoActivo && productoAnterior) {
        actualizarStockProducto(productoAnterior, -cantidadAnterior)
      }

      if (nuevosDatos.productoId && (nuevosDatos.estado === undefined || nuevosDatos.estado === "Activa" || nuevosDatos.estado === "Activo" || nuevosDatos.estado === 1)) {
        actualizarStockProducto(nuevosDatos.productoId, Number(nuevosDatos.cantidad || 0))
      }

      await cargarDatos()
    } catch (error) {
      console.error("Error al actualizar entrada:", error)
      throw error
    }
  }

  async function deshabilitarEntrada(id) {
    try {
      const entradaAnterior = entradas.find((entrada) => String(entrada.id) === String(id))
      const estadoActivo = entradaAnterior?.estado === "Activa"
      const productoAnterior = entradaAnterior?.productoId
      const cantidadAnterior = Number(entradaAnterior?.cantidad || 0)

      await axios.patch(`${BACKEND_URL}/entradas/${id}/estado`, { estado: "Deshabilitada" })

      if (estadoActivo && productoAnterior) {
        actualizarStockProducto(productoAnterior, -cantidadAnterior)
      }

      await cargarDatos()
    } catch (error) {
      console.error("Error al deshabilitar entrada:", error)
      throw error
    }
  }

  const value = {
    productos,
    ventas,
    entradas,
    categorias,
    subcategorias,
    proveedores,
    loading,
    cargarDatos,
    agregarProducto,
    editarProducto,
    cambiarEstadoProducto,
    agregarProveedor,
    editarProveedor,
    cambiarEstadoProveedor,
    agregarCategoria,
    editarCategoria,
    cambiarEstadoCategoria,
    agregarSubcategoria,
    editarSubcategoria,
    cambiarEstadoSubcategoria,
    agregarVenta,
    editarVenta,
    deshabilitarVenta,
    agregarEntrada,
    editarEntrada,
    deshabilitarEntrada,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData debe usarse dentro de DataProvider")
  return ctx
}
