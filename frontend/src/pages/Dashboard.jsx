import { useState, useEffect, useMemo } from "react"
import { Row, Col, Card, Statistic, Segmented, Table, Progress, Typography, Empty, Tag } from "antd"
import {
  DollarOutlined,
  RiseOutlined,
  ShoppingOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

const { Title, Text } = Typography

const opcionesPeriodo = [
  { label: "Hoy", value: "hoy" },
  { label: "Esta semana", value: "semana" },
  { label: "Este mes", value: "mes" },
]

//formatea un número como moneda en pesos mexicanos
function formatCurrency(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor)
}

//revisa si una fecha cae dentro del periodo seleccionado (hoy, semana, mes)
function dentroDelPeriodo(fecha, periodo) {
  const fechaVenta = new Date(fecha)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const fechaSinHora = new Date(fechaVenta)
  fechaSinHora.setHours(0, 0, 0, 0)

  if (periodo === "hoy") {
    return fechaSinHora.getTime() === hoy.getTime()
  }

  if (periodo === "semana") {
    const inicioSemana = new Date(hoy)
    inicioSemana.setDate(hoy.getDate() - hoy.getDay())
    return fechaSinHora.getTime() >= inicioSemana.getTime()
  }

  if (periodo === "mes") {
    return (
      fechaVenta.getFullYear() === hoy.getFullYear() &&
      fechaVenta.getMonth() === hoy.getMonth()
    )
  }

  return true
}

export default function Dashboard() {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [detalle, setDetalle] = useState([])
  const [periodo, setPeriodo] = useState("mes")

  useEffect(() => {
    cargarDatos()
  }, [])

  //trae ventas, productos y el detalle de todas las ventas desde el backend
  const cargarDatos = async () => {
    try {
      const [resVentas, resProductos, resDetalle] = await Promise.all([
        axios.get(`${BACKEND_URL}/obtenerVentas`),
        axios.get(`${BACKEND_URL}/obtenerProductos`),
        axios.get(`${BACKEND_URL}/obtenerTodoDetalle`),
      ])
      setVentas(resVentas.data)
      setProductos(resProductos.data)
      setDetalle(resDetalle.data)
    } catch (error) {
      // si falla la carga, el dashboard simplemente se queda vacío
    }
  }

  // Mapa rápido de costo por producto
  const costoPorProducto = useMemo(() => {
    const m = {}
    productos.forEach((p) => {
      m[p.pk_producto] = Number(p.costo_compra)
    })
    return m
  }, [productos])

  const { ingresos, ganancias, numVentas, ranking } = useMemo(() => {
    const ventasPeriodo = ventas.filter(
      (v) => v.estatus === 1 && dentroDelPeriodo(v.fecha_venta, periodo),
    )

    let ingresosTot = 0
    let gananciasTot = 0
    const conteoProductos = {}

    ventasPeriodo.forEach((venta) => {
      ingresosTot += Number(venta.total_venta)

      const itemsVenta = detalle.filter(
        (d) => d.fk_venta === venta.pk_venta && d.fk_producto,
      )
      const serviciosVenta = detalle.filter(
        (d) => d.fk_venta === venta.pk_venta && d.fk_servicio,
      )

      // Ganancia por productos: (precioVenta - costoUltimaCompra) * cantidad
      itemsVenta.forEach((item) => {
        const costo = costoPorProducto[item.fk_producto] ?? 0
        const precio = Number(item.precio_unidad_prod)
        const cantidad = Number(item.cantidad_unidad)
        gananciasTot += (precio - costo) * cantidad

        if (!conteoProductos[item.fk_producto]) {
          conteoProductos[item.fk_producto] = {
            nombre: item.nombre_producto,
            cantidad: 0,
            ingreso: 0,
          }
        }
        conteoProductos[item.fk_producto].cantidad += cantidad
        conteoProductos[item.fk_producto].ingreso += Number(item.subtotal)
      })

      // Ganancia por servicios: todo el subtotal es ganancia
      serviciosVenta.forEach((srv) => {
        gananciasTot += Number(srv.subtotal)
      })
    })

    const rankingArr = Object.entries(conteoProductos)
      .map(([id, datos]) => ({ key: id, ...datos }))
      .sort((a, b) => b.cantidad - a.cantidad)

    return {
      ingresos: ingresosTot,
      ganancias: gananciasTot,
      numVentas: ventasPeriodo.length,
      ranking: rankingArr,
    }
  }, [ventas, detalle, periodo, costoPorProducto])

  const maxCantidad = ranking.length > 0 ? ranking[0].cantidad : 0

  const stockBajo = productos.filter(
    (p) => p.estatus === 1 && Number(p.stock) < Number(p.stock_minimo),
  )

  const columnas = [
    {
      title: "Producto",
      dataIndex: "nombre",
      key: "nombre",
      render: (texto) => <Text strong>{texto}</Text>,
    },
    {
      title: "Cantidad vendida",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 130,
      align: "center",
      render: (cant) => <Tag color="#3875F7">{cant}</Tag>,
    },
    {
      title: "Proporción",
      key: "proporcion",
      render: (_, record) => (
        <Progress
          percent={maxCantidad ? Math.round((record.cantidad / maxCantidad) * 100) : 0}
          strokeColor="#3875F7"
          size="small"
        />
      ),
    },
    {
      title: "Ingreso",
      dataIndex: "ingreso",
      key: "ingreso",
      width: 120,
      align: "right",
      render: (val) => formatCurrency(val),
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
          Dashboard
        </Title>
        <Segmented
          options={opcionesPeriodo}
          value={periodo}
          onChange={setPeriodo}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Ganancias totales"
              value={ganancias}
              precision={2}
              prefix={<RiseOutlined style={{ color: "#389e0d" }} />}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: "#389e0d" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Ingresos totales"
              value={ingresos}
              precision={2}
              prefix={<DollarOutlined style={{ color: "#c0392b" }} />}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: "#c0392b" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Número de ventas"
              value={numVentas}
              prefix={<ShoppingOutlined style={{ color: "#1677ff" }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Productos más vendidos">
            {ranking.length === 0 ? (
              <Empty description="No hay ventas en este periodo" />
            ) : (
              <Table
                columns={columnas}
                dataSource={ranking}
                pagination={false}
                size="middle"
                scroll={{ x: 500 }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                <WarningOutlined style={{ color: "#cf1322", marginRight: 8 }} />
                Productos con stock bajo
              </span>
            }
          >
            {stockBajo.length === 0 ? (
              <Empty description="Todo el inventario está en orden" />
            ) : (
              stockBajo.map((p) => (
                <div
                  key={p.pk_producto}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <Text>{p.nombre_producto}</Text>
                  <Tag color="error">
                    {p.stock} / {p.stock_minimo}
                  </Tag>
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}