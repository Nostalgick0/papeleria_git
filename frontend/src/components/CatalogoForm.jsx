import { useEffect, useState } from "react"
import { Modal, Form, Input, InputNumber, App } from "antd"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

export default function CatalogoForm({
  open,
  onClose,
  itemEditar,
  onSaved,
  sectionMeta,
}) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const editando = !!itemEditar

  useEffect(() => {
    if (!open) return
    if (editando && itemEditar) {
      const valores = {
        nombre: itemEditar.nombre,
      }
      if (sectionMeta.hasPrice) valores.precio = itemEditar.precio
      form.setFieldsValue(valores)
    } else {
      form.resetFields()
    }
  }, [open, editando, itemEditar, form, sectionMeta.hasPrice])

  async function onFinish(values) {
    if (!values.nombre || !values.nombre.trim()) {
      return
    }

    const datos = {
      nombre: values.nombre.trim(),
      estado: itemEditar?.estado || "Activo",
    }
    if (sectionMeta.hasPrice) {
      datos.precio = values.precio ?? 0
    }

    setLoading(true)
    try {
      console.log("CatalogoForm submit ->", sectionMeta.endpoint, datos, editando ? `PUT ${BACKEND_URL}/${sectionMeta.endpoint}/${itemEditar?.id}` : `POST ${BACKEND_URL}/${sectionMeta.endpoint}`)
      if (editando) {
        await axios.put(
          `${BACKEND_URL}/${sectionMeta.endpoint}/${itemEditar.id}`,
          datos,
        )
        message.success(`${sectionMeta.title.slice(0, -1)} actualizada correctamente.`)
      } else {
        await axios.post(`${BACKEND_URL}/${sectionMeta.endpoint}`, datos)
        message.success(`${sectionMeta.title.slice(0, -1)} registrada correctamente.`)
      }
      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message
      const detail = serverMsg || err?.message || (editando ? "Error actualizando el registro" : "Error registrando el registro")
      message.error(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={editando ? `Editar ${sectionMeta.title.slice(0, -1)}` : `Nueva ${sectionMeta.title.slice(0, -1)}`}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={editando ? "Guardar cambios" : "Registrar"}
      cancelText="Cancelar"
      destroyOnClose
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="nombre"
          label={sectionMeta.label}
          rules={[{ required: true, message: `Ingresa ${sectionMeta.label.toLowerCase()}.` }]}
        >
          <Input placeholder={sectionMeta.placeholder} />
        </Form.Item>

        {sectionMeta.hasPrice && (
          <Form.Item
            name="precio"
            label="Precio"
            rules={[
              { required: true, message: "Ingresa el precio del servicio." },
              { type: "number", min: 0, message: "El precio debe ser mayor o igual a 0." },
            ]}
          >
            <InputNumber
              controls={false}
              style={{ width: "100%" }}
              min={0}
              step={0.01}
              placeholder="0.00"
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
