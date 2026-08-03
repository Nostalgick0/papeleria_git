import { useEffect, useState } from "react"
import { Modal, Form, Input, Select, App, Spin } from "antd"
import axios from "axios"
import { BACKEND_URL } from "../Backend"

export default function ProveedorForm({ open, onClose, proveedorEditar, onSaved }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const editando = !!proveedorEditar
  const [empresasOptions, setEmpresasOptions] = useState([])
  const [loadingEmpresas, setLoadingEmpresas] = useState(false)

  useEffect(() => {
    async function fetchEmpresas() {
      setLoadingEmpresas(true)
      try {
        const res = await axios.get(`${BACKEND_URL}/obtenerEmpresas`)
        setEmpresasOptions(
          (res.data || []).map((item) => ({
            value: item.nombre_empresa,
            label: item.nombre_empresa,
          })),
        )
      } catch (error) {
        console.error("Error cargando empresas:", error)
        setEmpresasOptions([])
      } finally {
        setLoadingEmpresas(false)
      }
    }

    if (open) {
      if (proveedorEditar) {
        form.setFieldsValue({
          nombre: proveedorEditar.nombre,
          empresa: proveedorEditar.empresa,
          RFC: proveedorEditar.RFC,
          telefono: proveedorEditar.telefono,
          correo: proveedorEditar.correo,
        })
      } else {
        form.resetFields()
      }
      fetchEmpresas()
    }
  }, [open, proveedorEditar, form])

  async function onFinish(valores) {
    const datos = {
      nombre: valores.nombre,
      empresa: valores.empresa,
      RFC: valores.RFC,
      telefono: valores.telefono,
      correo: valores.correo || "",
      estado: proveedorEditar?.estado || "Activo",
    }

    setLoading(true)
    try {
      if (editando) {
        await axios.put(`http://localhost:5002/proveedores/${proveedorEditar.id}`, datos)
        message.success("Proveedor actualizado correctamente.")
      } else {
        await axios.post('http://localhost:5002/proveedores', datos)
        message.success("Proveedor registrado correctamente.")
      }
      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message
      message.error(serverMsg || (editando ? "Error actualizando el proveedor" : "Error registrando el proveedor"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={editando ? "Editar proveedor" : "Nuevo proveedor"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={editando ? "Guardar cambios" : "Registrar proveedor"}
      cancelText="Cancelar"
      destroyOnClose
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="nombre"
          label="Nombre del proveedor"
          rules={[{ required: true, message: "Ingresa el nombre del proveedor." }]}
        >
          <Input placeholder="Nombre completo" />
        </Form.Item>

        <Form.Item
          name="empresa"
          label="Empresa encargada"
          rules={[{ required: true, message: "Selecciona la empresa del proveedor." }]}
        >
          {loadingEmpresas ? (
            <Spin />
          ) : (
            <Select
              showSearch
              placeholder="Selecciona o busca una empresa registrada"
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label || "").toLowerCase().includes(input.toLowerCase())
              }
              options={empresasOptions}
            />
          )}
        </Form.Item>

        <Form.Item name="RFC" label="RFC" type="text"
          rules={[
            { required: true, message: "El RFC es obligatorio" },
            {
              pattern: /^[A-Z&Ñ]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/i,
              message: "Ingresa un formato de RFC válido"
            }
          ]}
        >
          <Input placeholder="RFC de empresa" maxLength={13} />
        </Form.Item>

        <Form.Item name="telefono" label="Teléfono" type="number"
          rules={[
            { required: true, message: "El numero es obligatorio" },
            {
              pattern: /^\d{10}$/,
              message: "Ingresa un número de teléfono válido (10 dígitos)"
            }
          ]}
        >
          <Input placeholder="Número de teléfono" maxLength={10} />
        </Form.Item>

        <Form.Item name="correo" label="Correo electrónico" type="email"
          rules={[
            { required: true, message: "El correo es obligatorio" },
            { type: "email", message: "Ingresa un correo electrónico válido" }
          ]}
        >
          <Input placeholder="correo@ejemplo.com" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
