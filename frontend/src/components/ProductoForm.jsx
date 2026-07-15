import { useEffect } from "react"
import { Modal, Form, Input, InputNumber, Select, Row, Col, App } from "antd"
import { useData } from "../context/DataContext"

export default function ProductoForm({ open, onClose, productoEditar }) {
  const { categorias, agregarProducto, editarProducto, agregarCategoria } =
    useData()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const editando = !!productoEditar

  useEffect(() => {
    if (open) {
      if (productoEditar) {
        form.setFieldsValue({ ...productoEditar })
      } else {
        form.resetFields()
        form.setFieldsValue({ stockActual: 0, stockMinimo: 5 })
      }
    }
  }, [open, productoEditar, form])

  function onFinish(valores) {
    // Si la categoría es nueva, registrarla
    if (valores.categoria && !categorias.includes(valores.categoria)) {
      agregarCategoria(valores.categoria)
    }

    const datos = {
      nombre: valores.nombre,
      categoria: valores.categoria,
      precioVenta: valores.precioVenta,
      costoUltimaCompra: valores.costoUltimaCompra,
      stockActual: valores.stockActual,
      stockMinimo: valores.stockMinimo,
    }

    if (editando) {
      editarProducto(productoEditar.id, datos)
      message.success("Producto actualizado correctamente.")
    } else {
      agregarProducto(datos)
      message.success("Producto agregado al catálogo.")
    }
    onClose()
  }

  return (
    <Modal
      title={editando ? "Editar producto" : "Nuevo producto"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={editando ? "Guardar cambios" : "Agregar producto"}
      cancelText="Cancelar"
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="nombre"
          label="Nombre del producto"
          rules={[{ required: true, message: "Ingresa el nombre" }]}
        >
          <Input placeholder="Ej. Cuaderno profesional 100 hojas" />
        </Form.Item>

        <Form.Item
          name="categoria"
          label="Categoría"
          rules={[{ required: true, message: "Selecciona o escribe una categoría" }]}
        >
          <Select
            showSearch
            mode="tags"
            maxCount={1}
            placeholder="Selecciona o escribe una nueva"
            options={categorias.map((c) => ({ value: c, label: c }))}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="precioVenta"
              label="Precio de venta"
              rules={[{ required: true, message: "Ingresa el precio" }]}
            >
              <InputNumber min={0} prefix="$" step={0.5} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="costoUltimaCompra"
              label="Costo de última compra"
              rules={[{ required: true, message: "Ingresa el costo" }]}
            >
              <InputNumber min={0} prefix="$" step={0.5} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="stockActual"
              label="Stock actual"
              rules={[{ required: true, message: "Ingresa el stock" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="stockMinimo"
              label="Stock mínimo"
              rules={[{ required: true, message: "Ingresa el stock mínimo" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
