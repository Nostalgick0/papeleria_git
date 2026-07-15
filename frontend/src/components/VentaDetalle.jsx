import { useState, useEffect } from "react"
import { Modal, Descriptions, Table, Tag, Typography, Divider, Spin } from "antd"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

const { Text } = Typography

//formatea un número como moneda en pesos mexicanos
function formatCurrency(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor)
}

//formatea una fecha a formato legible dd/mm/aaaa
function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-MX")
}

export default function VentaDetalle({ open, onClose, venta }) {
  const [detalle, setDetalle] = useState([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (open && venta) {
      cargarDetalle()
    }
  }, [open, venta])

  //trae los productos y servicios de esta venta desde el backend
  const cargarDetalle = async () => {
    setCargando(true)
    try {
      const response = await axios.get(
        `${BACKEND_URL}/obtenerDetalleVenta/${venta.pk_venta}`,
      )
      setDetalle(response.data)
    } catch (error) {
      setDetalle([])
    } finally {
      setCargando(false)
    }
  }

  if (!venta) return null

  //separa el detalle en filas de productos y filas de servicios
  const items = detalle.filter((d) => d.fk_producto)
  const servicios = detalle.filter((d) => d.fk_servicio)

  const columnasItems = [
    { title: "Producto", dataIndex: "nombre_producto", key: "nombre_producto" },
    {
      title: "Cantidad",
      dataIndex: "cantidad_unidad",
      key: "cantidad_unidad",
      align: "center",
    },
    {
      title: "Precio unit.",
      dataIndex: "precio_unidad_prod",
      key: "precio_unidad_prod",
      align: "right",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      align: "right",
      render: (v) => formatCurrency(v),
    },
  ]

  const columnasServicios = [
    { title: "Servicio", dataIndex: "nombre_servicio", key: "nombre_servicio" },
    {
      title: "Cantidad",
      dataIndex: "cantidad_servicio",
      key: "cantidad_servicio",
      align: "center",
    },
    {
      title: "Precio unit.",
      dataIndex: "precio_unidad_serv",
      key: "precio_unidad_serv",
      align: "right",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      align: "right",
      render: (v) => formatCurrency(v),
    },
  ]

  return (
    <Modal title="Detalle de venta" open={open} onCancel={onClose} footer={null} width={640}>
      <Spin spinning={cargando}>
        <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Fecha">{formatFecha(venta.fecha_venta)}</Descriptions.Item>
          <Descriptions.Item label="Método de pago">
            {venta.nombre_metodo_pago}
          </Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Tag color={venta.estatus === 1 ? "success" : "default"}>
              {venta.estatus === 1 ? "Activa" : "Deshabilitada"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <Text strong>Productos</Text>
        {items.length > 0 ? (
          <Table
            columns={columnasItems}
            dataSource={items}
            rowKey="pk_detalle_com"
            pagination={false}
            size="small"
            style={{ marginTop: 8 }}
          />
        ) : (
          <div style={{ margin: "8px 0" }}>
            <Text type="secondary">Sin productos</Text>
          </div>
        )}

        {servicios.length > 0 && (
          <>
            <Divider style={{ margin: "16px 0 8px" }} />
            <Text strong>Servicios</Text>
            <Table
              columns={columnasServicios}
              dataSource={servicios}
              rowKey="pk_detalle_com"
              pagination={false}
              size="small"
              style={{ marginTop: 8 }}
            />
          </>
        )}

        <Divider style={{ margin: "16px 0 8px" }} />
        <div style={{ textAlign: "right" }}>
          <Text strong style={{ fontSize: 18 }}>
            Total: {formatCurrency(venta.total_venta)}
          </Text>
        </div>
      </Spin>
    </Modal>
  )
}