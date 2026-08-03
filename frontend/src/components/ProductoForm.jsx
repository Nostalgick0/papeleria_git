import { useEffect, useState } from "react"
import { Modal, Form, Input, InputNumber, Select, Row, Col, message } from "antd"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

export default function ProductoForm({ open, onClose, productoEditar, onGuardado }) {
  const [form] = Form.useForm()
  const [categoriasOptions, setCategoriasOptions] = useState([])
  const [unidadesOptions, setUnidadesOptions] = useState([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [loadingUnidades, setLoadingUnidades] = useState(false)

  const editando = !!productoEditar

  useEffect(() => {
    async function fetchCatalogos() {
      setLoadingCategorias(true)
      setLoadingUnidades(true)
      try {
        const [resCategorias, resUnidades] = await Promise.all([
          axios.get(`${BACKEND_URL}/obtenerCategorias`),
          axios.get(`${BACKEND_URL}/obtenerUnidades`),
        ])

        setCategoriasOptions(
          (resCategorias.data || [])
            .filter((c) => c.estatus === 1)
            .map((c) => ({ value: c.pk_categoria, label: c.nombre_categoria })),
        )

        setUnidadesOptions(
          (resUnidades.data || [])
            .filter((u) => u.estatus === 1)
            .map((u) => ({ value: u.pk_unidad, label: u.nombre_unidad })),
        )
      } catch (error) {
        console.error("Error cargando catálogos:", error)
        setCategoriasOptions([])
        setUnidadesOptions([])
      } finally {
        setLoadingCategorias(false)
        setLoadingUnidades(false)
      }
    }

    if (open) {
      fetchCatalogos()
      if (productoEditar) {
        form.setFieldsValue({
          nombre_producto: productoEditar.nombre_producto || "",
          fk_categoria: productoEditar.fk_categoria ?? undefined,
          fk_unidad: productoEditar.fk_unidad ?? undefined,
          precio_venta: productoEditar.precio_venta ?? 0,
          costo_compra: productoEditar.costo_compra ?? 0,
          stock: productoEditar.stock ?? 0,
          stock_minimo: productoEditar.stock_minimo ?? 5,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ stock: 0, stock_minimo: 5, precio_venta: 0, costo_compra: 0 })
      }
    }
  }, [open, productoEditar, form])

  async function onFinish(valores) {
    const datos = {
      nombre_producto: valores.nombre_producto,
      fk_categoria: valores.fk_categoria,
      fk_unidad: valores.fk_unidad,
      precio_venta: valores.precio_venta,
      costo_compra: valores.costo_compra,
      stock: valores.stock,
      stock_minimo: valores.stock_minimo,
      estatus: 1,
    }

    try {
      if (editando) {
        await axios.post(`${BACKEND_URL}/actualizarProducto`, {
          pk_producto: productoEditar.pk_producto,
          ...datos,
        })
        message.success("Producto actualizado correctamente.")
      } else {
        await axios.post(`${BACKEND_URL}/insertarProducto`, datos)
        message.success("Producto agregado al catálogo.")
      }

      onGuardado?.()
      onClose()
    } catch (error) {
      console.error("Error guardando producto:", error)
      message.error("No se pudo guardar el producto")
    }
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
        <Form.Item name="nombre_producto" label="Nombre del producto" rules={[{ required: true, message: "Ingresa el nombre" }]}>
          <Input placeholder="Ej. Cuaderno profesional 100 hojas" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="fk_categoria" label="Categoría" rules={[{ required: true, message: "Selecciona una categoría" }]}>
              <Select
                showSearch
                placeholder="Selecciona una categoría registrada"
                loading={loadingCategorias}
                optionFilterProp="label"
                filterOption={(input, option) => (option?.label || "").toLowerCase().includes(input.toLowerCase())}
                options={categoriasOptions}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="fk_unidad" label="Unidad" rules={[{ required: true, message: "Selecciona una unidad" }]}>
              <Select
                showSearch
                placeholder="Selecciona una unidad"
                loading={loadingUnidades}
                optionFilterProp="label"
                filterOption={(input, option) => (option?.label || "").toLowerCase().includes(input.toLowerCase())}
                options={unidadesOptions}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="precio_venta" label="Precio de venta" rules={[{ required: true, message: "Ingresa el precio" }]}>
              <InputNumber min={0} prefix="$" step={0.5} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="costo_compra" label="Costo de última compra" rules={[{ required: true, message: "Ingresa el costo" }]}>
              <InputNumber min={0} prefix="$" step={0.5} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="stock" label="Stock actual" rules={[{ required: true, message: "Ingresa el stock" }]}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="stock_minimo" label="Stock mínimo" rules={[{ required: true, message: "Ingresa el stock mínimo" }]}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
