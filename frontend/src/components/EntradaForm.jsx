import { useEffect } from "react"
import { Modal, Form, Select, InputNumber, Input, App } from "antd"
import { useData } from "../context/DataContext"
import { formatCurrency } from "../utils/helpers"

export default function EntradaForm({ open, onClose, entradaEditar }) {
  const { productos, agregarEntrada, editarEntrada } = useData()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const editando = !!entradaEditar

  useEffect(() => {
    if (open) {
      if (entradaEditar) {
        form.setFieldsValue({
          productoId: entradaEditar.productoId,
          cantidad: entradaEditar.cantidad,
          costoUnitario: entradaEditar.costoUnitario,
          proveedor: entradaEditar.proveedor,
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, entradaEditar, form])

  const productosActivos = productos.filter((p) => p.estado === "Activo")

  function onFinish(valores) {
    const prod = productos.find((p) => p.id === valores.productoId)
    const datos = {
      productoId: valores.productoId,
      nombreProducto: prod ? prod.nombre : "",
      cantidad: valores.cantidad,
      costoUnitario: valores.costoUnitario,
      proveedor: valores.proveedor || "",
    }

    if (editando) {
      editarEntrada(entradaEditar.id, datos)
      message.success("Entrada actualizada. Se ajustó el stock del producto.")
    } else {
      agregarEntrada(datos)
      message.success("Entrada registrada. Se sumó al stock del producto.")
    }
    onClose()
  }

  return (
    <Modal
      title={editando ? "Editar entrada de mercancía" : "Nueva entrada de mercancía"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={editando ? "Guardar cambios" : "Registrar entrada"}
      cancelText="Cancelar"
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="productoId"
          label="Producto"
          rules={[{ required: true, message: "Selecciona un producto" }]}
        >
          <Select
            showSearch
            placeholder="Buscar producto..."
            optionFilterProp="label"
            options={productosActivos.map((p) => ({
              value: p.id,
              label: `${p.nombre} (stock actual: ${p.stockActual})`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="cantidad"
          label="Cantidad recibida"
          rules={[{ required: true, message: "Ingresa la cantidad" }]}
        >
          <InputNumber min={1} style={{ width: "100%" }} placeholder="0" />
        </Form.Item>

        <Form.Item
          name="costoUnitario"
          label="Costo unitario de compra"
          extra="Este valor actualiza el costo de última compra del producto."
          rules={[{ required: true, message: "Ingresa el costo unitario" }]}
        >
          <InputNumber
            min={0}
            prefix="$"
            step={0.5}
            style={{ width: "100%" }}
            placeholder="0.00"
          />
        </Form.Item>

        <Form.Item name="proveedor" label="Proveedor">
          <Input placeholder="Nombre del proveedor" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
