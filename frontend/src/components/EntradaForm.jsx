import { useEffect, useState } from "react"
import { Modal, Form, Select, InputNumber, Input, App, Spin } from "antd"
import { useData } from "../context/DataContext"
import { formatCurrency } from "../utils/helpers"
import axios from "axios"

export default function EntradaForm({ open, onClose, entradaEditar }) {
  const { productos, agregarEntrada, editarEntrada } = useData()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const editando = !!entradaEditar

  const [proveedoresOptions, setProveedoresOptions] = useState([])
  const [loadingProveedores, setLoadingProveedores] = useState(false)

  useEffect(() => {
    if (open) {
      if (entradaEditar) {
        form.setFieldsValue({
          productoId: entradaEditar.productoId,
          cantidad: entradaEditar.cantidad,
          costoUnitario: entradaEditar.costoUnitario,
          // mantener compatibilidad: si existe proveedorId usarlo, si no usar proveedor
          proveedorId: entradaEditar.proveedorId || entradaEditar.proveedor,
        })
      } else {
        form.resetFields()
      }
      // cargar proveedores cada vez que se abre el modal
      fetchProveedores()
    }
  }, [open, entradaEditar, form])

  async function fetchProveedores() {
    setLoadingProveedores(true)
    try {
      const res = await axios.get("http://localhost:5002/obtenerProveedores")
      const opts = (res.data || [])
        .filter((p) => p.estatus === 1)
        .map((p) => ({
          value: String(p.pk_proveedor),
          label: `${p.nombre_proveedor} ${p.empresa ? `(${p.empresa})` : ""}`,
          raw: p,
        }))
      setProveedoresOptions(opts)
    } catch (e) {
      console.error("Error cargando proveedores:", e)
      setProveedoresOptions([])
    } finally {
      setLoadingProveedores(false)
    }
  }

  const productosActivos = productos.filter((p) => p.estado === "Activo")

  function onFinish(valores) {
    const prod = productos.find((p) => p.id === valores.productoId)
    const datos = {
      productoId: valores.productoId,
      nombreProducto: prod ? prod.nombre : "",
      cantidad: valores.cantidad,
      costoUnitario: valores.costoUnitario,
      proveedorId: valores.proveedorId || "",
      proveedorNombre:
        (proveedoresOptions.find((o) => o.value === String(valores.proveedorId)) ||
          {}).label || "",
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

        <Form.Item name="proveedorId" label="Proveedor">
          {loadingProveedores ? (
            <Spin />
          ) : (
            <Select
              showSearch
              placeholder="Buscar proveedor..."
              optionFilterProp="label"
              allowClear
              options={proveedoresOptions}
              filterOption={(input, option) =>
                (option?.label || "").toLowerCase().includes(input.toLowerCase())
              }
            />
          )}
        </Form.Item>
      </Form>
    </Modal>
  )
}
