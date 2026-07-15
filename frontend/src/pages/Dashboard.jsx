import { useState, useMemo } from "react"
import { Row, Col, Card, Statistic, Segmented, Table, Progress, Typography, Empty, Tag } from "antd"
import {
  DollarOutlined,
  RiseOutlined,
  ShoppingOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import { useData } from "../context/DataContext"
import { formatCurrency, dentroDelPeriodo } from "../utils/helpers"

const { Title, Text } = Typography

const opcionesPeriodo = [
  { label: "Hoy", value: "hoy" },
  { label: "Esta semana", value: "semana" },
  { label: "Este mes", value: "mes" },
]

export default function Dashboard() {
  const { ventas, productos } = useData()
  const [periodo, setPeriodo] = useState("mes")

  // Mapa rápido de costo por producto
  const costoPorProducto = useMemo(() => {
    const m = {}
    productos.forEach((p) => {
      m[p.id] = p.costoUltimaCompra
    })
    return m
  }, [productos])

  const { ingresos, ganancias, numVentas, ranking } = useMemo(() => {
    const ventasPeriodo = ventas.filter(
      (v) => v.estado === "Activa" && dentroDelPeriodo(v.fecha, periodo),
    )

    let ingresosTot = 0
    let gananciasTot = 0
    const conteoProductos = {}

    ventasPeriodo.forEach((venta) => {
      ingresosTot += venta.total

      // Ganancia por productos: (precioVenta - costoUltimaCompra) * cantidad
      venta.items.forEach((item) => {
        const costo = costoPorProducto[item.productoId] ?? 0
        gananciasTot += (item.precioUnitario - costo) * item.cantidad

        if (!conteoProductos[item.productoId]) {
          conteoProductos[item.productoId] = {
            nombre: item.nombre,
            cantidad: 0,
            ingreso: 0,
          }
        }
        conteoProductos[item.productoId].cantidad += item.cantidad
        conteoProductos[item.productoId].ingreso += item.subtotal
      })

      // Ganancia por servicios: todo el subtotal es ganancia
      ;(venta.servicios || []).forEach((srv) => {
        gananciasTot += srv.subtotal
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
  }, [ventas, periodo, costoPorProducto])

  const maxCantidad = ranking.length > 0 ? ranking[0].cantidad : 0

  const stockBajo = productos.filter(
    (p) => p.estado === "Activo" && p.stockActual < p.stockMinimo,
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
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <Text>{p.nombre}</Text>
                  <Tag color="error">
                    {p.stockActual} / {p.stockMinimo}
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
