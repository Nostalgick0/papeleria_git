// Utilidades generales

export function formatCurrency(valor) {
  const num = Number(valor) || 0
  return num.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function generarId(prefijo) {
  return `${prefijo}${Date.now()}${Math.floor(Math.random() * 1000)}`
}

// Formatea un número entero con separador de miles
export function formatEntero(valor) {
  return (Number(valor) || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })
}

// Pluraliza una unidad de forma simple (agrega "s" cuando corresponde)
export function pluralizar(palabra, cantidad) {
  if (!palabra) return ""
  if (cantidad === 1) return palabra
  return /s$/i.test(palabra) ? palabra : `${palabra}s`
}

// Cuántos paquetes completos representa un stock dado
export function paquetesCompletos(producto) {
  if (
    producto?.tipoProducto !== "fraccionable" ||
    !producto.unidadesPorPaquete
  ) {
    return 0
  }
  return Math.floor((producto.stockActual || 0) / producto.unidadesPorPaquete)
}

// Texto descriptivo del stock de un producto.
// Simple:       "24 Piezas"
// Fraccionable: "1,500 Hojas · 3 Resmas completas"
export function formatStockTexto(producto) {
  if (!producto) return "-"
  const base = producto.unidadBase || "Pieza"
  const stock = producto.stockActual || 0
  if (producto.tipoProducto === "fraccionable" && producto.unidadesPorPaquete) {
    const paquetes = paquetesCompletos(producto)
    return `${formatEntero(stock)} ${pluralizar(base, stock)} · ${paquetes} ${pluralizar(
      producto.unidadPaquete,
      paquetes,
    )} ${paquetes === 1 ? "completa" : "completas"}`
  }
  return `${formatEntero(stock)} ${pluralizar(base, stock)}`
}

// Disponibilidad para el formulario de venta (mismo texto, pasando un stock base explícito)
export function formatDisponibilidad(producto, stockBase) {
  if (!producto) return "-"
  const base = producto.unidadBase || "Pieza"
  const stock = stockBase ?? producto.stockActual ?? 0
  if (producto.tipoProducto === "fraccionable" && producto.unidadesPorPaquete) {
    const paquetes = Math.floor(stock / producto.unidadesPorPaquete)
    return `${formatEntero(stock)} ${pluralizar(base, stock)} · ${paquetes} ${pluralizar(
      producto.unidadPaquete,
      paquetes,
    )} ${paquetes === 1 ? "completa" : "completas"}`
  }
  return `${formatEntero(stock)} ${pluralizar(base, stock)}`
}

// Unidades base que consume una entrada según el tipo de producto
export function unidadesBaseEntrada(producto, cantidad) {
  const q = Number(cantidad) || 0
  if (producto?.tipoProducto === "fraccionable" && producto.unidadesPorPaquete) {
    return q * producto.unidadesPorPaquete
  }
  return q
}

// Determina si una fecha (ISO string) cae dentro del periodo indicado
export function dentroDelPeriodo(fechaISO, periodo) {
  const fecha = new Date(fechaISO)
  const ahora = new Date()

  if (periodo === "hoy") {
    return (
      fecha.getFullYear() === ahora.getFullYear() &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getDate() === ahora.getDate()
    )
  }

  if (periodo === "semana") {
    // Inicio de la semana (lunes)
    const inicio = new Date(ahora)
    const dia = (inicio.getDay() + 6) % 7 // lunes = 0
    inicio.setDate(inicio.getDate() - dia)
    inicio.setHours(0, 0, 0, 0)
    return fecha >= inicio && fecha <= ahora
  }

  if (periodo === "mes") {
    return (
      fecha.getFullYear() === ahora.getFullYear() &&
      fecha.getMonth() === ahora.getMonth()
    )
  }

  return true
}

export function formatFecha(fechaISO) {
  const fecha = new Date(fechaISO)
  return fecha.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
