Archivos modificados

.env
Cambios en la configuración local de la base de datos.

index.js
Se incluyeron rutas de creación/actualización de proveedores.

query.js
Se cambió la consulta de proveedores para incluir el nombre de la empresa asociada.
Se añadieron helpers de empresas (getEmpresaByName, insertEmpresa, getOrCreateEmpresa).
Se añadió lógica de creación/actualización de proveedores con empresa asociada.

EntradaForm.jsx
Ajustes en el formulario de entrada para usar proveedores/empresas cargadas del backend.

ProductoForm.jsx
Cambios para cargar categorías activas desde el backend y usar select buscable.

VentaForm.jsx
Correcciones de import y en los selects de servicios/metodo de pago.

DataContext.jsx
Ajustes en el manejo de datos de empresas/categorías/proveedores.

mockData.js
Actualización de datos de prueba iniciales.

Catalogos.jsx
Cambios en el manejo de catálogos dinámicos, recarga de datos y acciones de guardar/activar.

Inventario.jsx
Ajustes para cargar categorías desde backend en el filtro de inventario.

Proveedores.jsx
Cambios en la lista de proveedores, columnas de tabla y apertura del modal de edición.


Archivos creados

CatalogoForm.jsx
Formulario/modal reutilizable para crear o editar elementos de catálogo.

ProveedorForm.jsx
Formulario/modal para crear o editar proveedores con selección de empresa.
