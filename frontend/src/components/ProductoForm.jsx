import { useEffect, useState } from "react"
import { Modal, Form, Input, InputNumber, Select, Row, Col, App } from "antd"
import { useData } from "../context/DataContext"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

export default function ProductoForm({ open, onClose, productoEditar }) {
  const { agregarProducto, editarProducto } = useData()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [categoriasOptions, setCategoriasOptions] = useState([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  const editando = !!productoEditar

  useEffect(() => {
    async function fetchCategorias() {
      setLoadingCategorias(true)
      try {
        const res = await axios.get(`${BACKEND_URL}/obtenerCategorias`)
        setCategoriasOptions(
          (res.data || [])
            .filter((c) => c.estatus === 1)
            .map((c) => ({ value: c.nombre_categoria, label: c.nombre_categoria }))
        )
      } catch (error) {
        console.error("Error cargando categorías:", error)
        setCategoriasOptions([])
      } finally {
        setLoadingCategorias(false)
      }
    }

    if (open) {
      fetchCategorias()
      if (productoEditar) {
        form.setFieldsValue({ ...productoEditar })
      } else {
        form.resetFields()
        form.setFieldsValue({ stockActual: 0, stockMinimo: 5 })
      }
    }
  }, [open, productoEditar, form])

  function onFinish(valores) {
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
          rules={[{ required: true, message: "Selecciona una categoría" }]}
        >
          <Select
            showSearch
            placeholder="Selecciona una categoría registrada"
            loading={loadingCategorias}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label || "").toLowerCase().includes(input.toLowerCase())
            }
            options={categoriasOptions}
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
