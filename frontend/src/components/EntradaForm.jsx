import { useEffect, useState } from "react"
import { Modal, Form, Select, InputNumber, Input, App, Spin } from "antd"
import { useData } from "../context/DataContext"
import { formatCurrency } from "../utils/helpers"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

export default function EntradaForm({ open, onClose, entradaEditar }) {
  const { productos, agregarEntrada, editarEntrada } = useData()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const editando = !!entradaEditar

  const [proveedoresOptions, setProveedoresOptions] = useState([])
  const [loadingProveedores, setLoadingProveedores] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (entradaEditar) {
        form.setFieldsValue({
          productoId: entradaEditar.productoId,
          cantidad: entradaEditar.cantidad,
          costoUnitario: entradaEditar.costoUnitario,
          proveedorId: entradaEditar.proveedorId || entradaEditar.proveedor || undefined,
        })
      } else {
        form.resetFields()
      }
      fetchProveedores()
    }
  }, [open, entradaEditar, form])

  useEffect(() => {
    if (!open || !entradaEditar || proveedoresOptions.length === 0) return

    const proveedorInicial = entradaEditar.proveedorId || entradaEditar.proveedor || ""
    if (!proveedorInicial) return

    const opcion = proveedoresOptions.find((o) => String(o.value) === String(proveedorInicial)) ||
      proveedoresOptions.find((o) =>
        String(o.label).toLowerCase().includes(String(proveedorInicial).toLowerCase()) ||
        String(o.raw?.nombre_proveedor || "").toLowerCase().includes(String(proveedorInicial).toLowerCase()),
      )

    if (opcion && String(form.getFieldValue("proveedorId") || "") !== String(opcion.value)) {
      form.setFieldsValue({ proveedorId: opcion.value })
    }
  }, [open, entradaEditar, proveedoresOptions, form])

  async function fetchProveedores() {
    setLoadingProveedores(true)
    try {
      const res = await axios.get(`${BACKEND_URL}/obtenerProveedores`)
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

  async function onFinish(valores) {
    setSubmitting(true)
    try {
      const proveedorIdNormalizado = (() => {
        const valor = valores.proveedorId
        if (valor === undefined || valor === null || valor === "") return ""

        const texto = String(valor).trim()
        if (!texto) return ""

        const opcionExacta = proveedoresOptions.find((o) => String(o.value) === texto)
        if (opcionExacta) return String(opcionExacta.value)

        const opcionPorNombre = proveedoresOptions.find((o) =>
          String(o.label).toLowerCase().includes(texto.toLowerCase()) ||
          String(o.raw?.nombre_proveedor || "").toLowerCase().includes(texto.toLowerCase()),
        )

        return opcionPorNombre ? String(opcionPorNombre.value) : ""
      })()

      const prod = productos.find((p) => String(p.id) === String(valores.productoId))
      const proveedorSeleccionado = proveedoresOptions.find((o) => String(o.value) === String(proveedorIdNormalizado))

      const datos = {
        productoId: String(valores.productoId || ""),
        nombreProducto: prod ? prod.nombre : "",
        cantidad: Number(valores.cantidad || 0),
        costoUnitario: Number(valores.costoUnitario || 0),
        proveedorId: proveedorIdNormalizado,
        proveedorNombre: proveedorSeleccionado?.label || "",
      }

      if (editando) {
        await editarEntrada(entradaEditar.id, datos)
        message.success("Entrada actualizada. Se ajustó el stock del producto.")
      } else {
        await agregarEntrada(datos)
        message.success("Entrada registrada. Se sumó al stock del producto.")
      }
      onClose()
    } catch (error) {
      console.error("Error al guardar entrada:", error)
      message.error("No se pudo guardar la entrada. Intenta nuevamente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={editando ? "Editar entrada de mercancía" : "Nueva entrada de mercancía"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={editando ? "Guardar cambios" : "Registrar entrada"}
      cancelText="Cancelar"
      confirmLoading={submitting}
      okButtonProps={{ loading: submitting }}
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
