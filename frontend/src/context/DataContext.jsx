import { createContext, useContext, useState, useEffect } from "react"
import {
  productosIniciales,
  ventasIniciales,
  entradasIniciales,
  categoriasIniciales,
  subcategoriasIniciales,
  proveedoresIniciales,
} from "../data/mockData"
import { generarId, unidadesBaseEntrada } from "../utils/helpers"

const DataContext = createContext(null)

const STORAGE_KEY = "aracely_data_v2"

function cargarEstadoInicial() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (guardado) {
      const parsed = JSON.parse(guardado)
      return {
        productos: parsed.productos || productosIniciales,
        ventas: parsed.ventas || ventasIniciales,
        entradas: parsed.entradas || entradasIniciales,
        categorias: parsed.categorias || categoriasIniciales,
        subcategorias: parsed.subcategorias || subcategoriasIniciales,
        proveedores: parsed.proveedores || proveedoresIniciales,
      }
    }
  } catch (e) {
    console.log("[v0] Error cargando datos:", e.message)
  }
  return {
    productos: productosIniciales,
    ventas: ventasIniciales,
    entradas: entradasIniciales,
    categorias: categoriasIniciales,
    subcategorias: subcategoriasIniciales,
    proveedores: proveedoresIniciales,
  }
}

export function DataProvider({ children }) {
  const inicial = cargarEstadoInicial()
  const [productos, setProductos] = useState(inicial.productos)
  const [ventas, setVentas] = useState(inicial.ventas)
  const [entradas, setEntradas] = useState(inicial.entradas)
  const [categorias, setCategorias] = useState(inicial.categorias)
  const [subcategorias, setSubcategorias] = useState(inicial.subcategorias)
  const [proveedores, setProveedores] = useState(inicial.proveedores)

  // Persistir en localStorage en cada cambio
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        productos,
        ventas,
        entradas,
        categorias,
        subcategorias,
        proveedores,
      }),
    )
  }, [productos, ventas, entradas, categorias, subcategorias, proveedores])

  // ---------- Helpers internos de stock (siempre en unidad base, entero) ----------
  function ajustarStock(productoId, delta) {
    setProductos((prev) =>
      prev.map((p) =>
        p.id === productoId
          ? { ...p, stockActual: Math.max(0, Math.round(p.stockActual + delta)) }
          : p,
      ),
    )
  }

  // ============ PRODUCTOS ============
  function agregarProducto(datos) {
    const nuevo = { ...datos, id: generarId("p"), estado: "Activo" }
    setProductos((prev) => [...prev, nuevo])
    return nuevo
  }

  function editarProducto(id, datos) {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...datos } : p)),
    )
  }

  function cambiarEstadoProducto(id, estado) {
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)))
  }

  // ============ PROVEEDORES ============
  function agregarProveedor(datos) {
    const nuevo = {
      ...datos,
      id: generarId("pr"),
      estado: datos.estado || "Activo",
    }
    setProveedores((prev) => [...prev, nuevo])
    return nuevo
  }

  function editarProveedor(id, datos) {
    setProveedores((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...datos } : p)),
    )
  }

  function cambiarEstadoProveedor(id, estado) {
    if (estado === "Inactivo") {
      const tieneEntradas = entradas.some(
        (e) => e.proveedorId === id && e.estado === "Activa",
      )
      if (tieneEntradas) {
        return {
          ok: false,
          mensaje:
            "No se puede inactivar: el proveedor tiene entradas de mercancía activas asociadas.",
        }
      }
    }
    setProveedores((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado } : p)),
    )
    return { ok: true }
  }

  // ============ CATEGORÍAS ============
  function agregarCategoria(datos) {
    const nueva = { ...datos, id: generarId("c"), estado: datos.estado || "Activo" }
    setCategorias((prev) => [...prev, nueva])
    return nueva
  }

  function editarCategoria(id, datos) {
    setCategorias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...datos } : c)),
    )
  }

  function cambiarEstadoCategoria(id, estado) {
    if (estado === "Inactivo") {
      const tieneSubs = subcategorias.some(
        (s) => s.categoriaId === id && s.estado === "Activo",
      )
      const tieneProductos = productos.some(
        (p) => p.categoriaId === id && p.estado === "Activo",
      )
      if (tieneSubs || tieneProductos) {
        return {
          ok: false,
          mensaje:
            "No se puede inactivar: la categoría tiene subcategorías o productos activos asociados.",
        }
      }
    }
    setCategorias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado } : c)),
    )
    return { ok: true }
  }

  // ============ SUBCATEGORÍAS ============
  function agregarSubcategoria(datos) {
    const nueva = { ...datos, id: generarId("s"), estado: datos.estado || "Activo" }
    setSubcategorias((prev) => [...prev, nueva])
    return nueva
  }

  function editarSubcategoria(id, datos) {
    setSubcategorias((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...datos } : s)),
    )
  }

  function cambiarEstadoSubcategoria(id, estado) {
    if (estado === "Inactivo") {
      const tieneProductos = productos.some(
        (p) => p.subcategoriaId === id && p.estado === "Activo",
      )
      if (tieneProductos) {
        return {
          ok: false,
          mensaje:
            "No se puede inactivar: la subcategoría tiene productos activos asociados.",
        }
      }
    }
    setSubcategorias((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado } : s)),
    )
    return { ok: true }
  }

  // ============ VENTAS ============
  // El stock se descuenta usando item.unidadesBase (siempre en unidad base).
  function agregarVenta(datos) {
    const nueva = {
      ...datos,
      id: generarId("v"),
      fecha: new Date().toISOString(),
      estado: "Activa",
    }
    datos.items.forEach((item) => {
      ajustarStock(item.productoId, -(item.unidadesBase ?? item.cantidad))
    })
    setVentas((prev) => [nueva, ...prev])
    return nueva
  }

  function editarVenta(id, nuevosDatos) {
    const ventaAnterior = ventas.find((v) => v.id === id)
    if (!ventaAnterior) return

    if (ventaAnterior.estado === "Activa") {
      const anterior = {}
      ventaAnterior.items.forEach((it) => {
        anterior[it.productoId] =
          (anterior[it.productoId] || 0) + (it.unidadesBase ?? it.cantidad)
      })
      const nuevo = {}
      nuevosDatos.items.forEach((it) => {
        nuevo[it.productoId] =
          (nuevo[it.productoId] || 0) + (it.unidadesBase ?? it.cantidad)
      })
      const ids = new Set([...Object.keys(anterior), ...Object.keys(nuevo)])
      ids.forEach((pid) => {
        const diff = (anterior[pid] || 0) - (nuevo[pid] || 0)
        if (diff !== 0) ajustarStock(pid, diff)
      })
    }

    setVentas((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...nuevosDatos } : v)),
    )
  }

  function deshabilitarVenta(id) {
    const venta = ventas.find((v) => v.id === id)
    if (!venta || venta.estado === "Deshabilitada") return
    venta.items.forEach((item) => {
      ajustarStock(item.productoId, item.unidadesBase ?? item.cantidad)
    })
    setVentas((prev) =>
      prev.map((v) => (v.id === id ? { ...v, estado: "Deshabilitada" } : v)),
    )
  }

  // ============ ENTRADAS DE MERCANCÍA ============
  // Las entradas para fraccionables se reciben en paquetes; al stock se suma en unidad base.
  function agregarEntrada(datos) {
    const prod = productos.find((p) => p.id === datos.productoId)
    const unidadesBase = unidadesBaseEntrada(prod, datos.cantidad)
    const nueva = {
      ...datos,
      unidadesBase,
      id: generarId("e"),
      fecha: new Date().toISOString(),
      estado: "Activa",
    }
    ajustarStock(datos.productoId, unidadesBase)
    editarProducto(datos.productoId, { costoUltimaCompra: datos.costoUnitario })
    setEntradas((prev) => [nueva, ...prev])
    return nueva
  }

  function editarEntrada(id, nuevosDatos) {
    const anterior = entradas.find((e) => e.id === id)
    if (!anterior) return

    const prodNuevo = productos.find((p) => p.id === nuevosDatos.productoId)
    const unidadesBaseNueva = unidadesBaseEntrada(prodNuevo, nuevosDatos.cantidad)

    if (anterior.estado === "Activa") {
      if (anterior.productoId !== nuevosDatos.productoId) {
        ajustarStock(anterior.productoId, -(anterior.unidadesBase ?? anterior.cantidad))
        ajustarStock(nuevosDatos.productoId, unidadesBaseNueva)
      } else {
        const diff = unidadesBaseNueva - (anterior.unidadesBase ?? anterior.cantidad)
        if (diff !== 0) ajustarStock(anterior.productoId, diff)
      }
      editarProducto(nuevosDatos.productoId, {
        costoUltimaCompra: nuevosDatos.costoUnitario,
      })
    }

    setEntradas((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...nuevosDatos, unidadesBase: unidadesBaseNueva } : e,
      ),
    )
  }

  function deshabilitarEntrada(id) {
    const entrada = entradas.find((e) => e.id === id)
    if (!entrada || entrada.estado === "Deshabilitada") return
    ajustarStock(entrada.productoId, -(entrada.unidadesBase ?? entrada.cantidad))
    setEntradas((prev) =>
      prev.map((e) => (e.id === id ? { ...e, estado: "Deshabilitada" } : e)),
    )
  }

  const value = {
    productos,
    ventas,
    entradas,
    categorias,
    subcategorias,
    proveedores,
    // productos
    agregarProducto,
    editarProducto,
    cambiarEstadoProducto,
    // proveedores
    agregarProveedor,
    editarProveedor,
    cambiarEstadoProveedor,
    // categorias
    agregarCategoria,
    editarCategoria,
    cambiarEstadoCategoria,
    // subcategorias
    agregarSubcategoria,
    editarSubcategoria,
    cambiarEstadoSubcategoria,
    // ventas
    agregarVenta,
    editarVenta,
    deshabilitarVenta,
    // entradas
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
