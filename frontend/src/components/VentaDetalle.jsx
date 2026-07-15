import { Modal, Descriptions, Table, Tag, Typography, Divider } from "antd"
import { formatCurrency, formatFecha } from "../utils/helpers"

const { Text } = Typography

export default function VentaDetalle({ open, onClose, venta }) {
  if (!venta) return null

  const columnasItems = [
    { title: "Producto", dataIndex: "nombre", key: "nombre" },
    { title: "Cantidad", dataIndex: "cantidad", key: "cantidad", align: "center" },
    {
      title: "Precio unit.",
      dataIndex: "precioUnitario",
      key: "precio",
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
      <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Fecha">{formatFecha(venta.fecha)}</Descriptions.Item>
        <Descriptions.Item label="Método de pago">{venta.metodoPago}</Descriptions.Item>
        <Descriptions.Item label="Estado">
          <Tag color={venta.estado === "Activa" ? "success" : "default"}>{venta.estado}</Tag>
        </Descriptions.Item>
      </Descriptions>

      <Text strong>Productos</Text>
      {venta.items.length > 0 ? (
        <Table
          columns={columnasItems}
          dataSource={venta.items}
          rowKey="productoId"
          pagination={false}
          size="small"
          style={{ marginTop: 8 }}
        />
      ) : (
        <div style={{ margin: "8px 0" }}>
          <Text type="secondary">Sin productos</Text>
        </div>
      )}

      {venta.servicios && venta.servicios.length > 0 && (
        <>
          <Divider style={{ margin: "16px 0 8px" }} />
          <Text strong>Servicios</Text>
          <Table
            columns={[
              { title: "Servicio", dataIndex: "nombre", key: "nombre" },
              { title: "Cantidad", dataIndex: "cantidad", key: "cantidad", align: "center" },
              {
                title: "Precio unit.",
                dataIndex: "precioUnitario",
                key: "precio",
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
            ]}
            dataSource={venta.servicios}
            rowKey="nombre"
            pagination={false}
            size="small"
            style={{ marginTop: 8 }}
          />
        </>
      )}

      <Divider style={{ margin: "16px 0 8px" }} />
      <div style={{ textAlign: "right" }}>
        <Text strong style={{ fontSize: 18 }}>
          Total: {formatCurrency(venta.total)}
        </Text>
      </div>
    </Modal>
  )
}
