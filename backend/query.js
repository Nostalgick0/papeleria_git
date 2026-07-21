const db = require('./db');

//°---------------------------------°
//|                                 |  
//|                                 |  
//|              Login              |
//|                                 | 
//|                                 |
//°---------------------------------°

async function login(nombre_usuario, password) {
    // Busca el usuario por su nombre de usuario
    const [rows] = await db.query(
        'SELECT pk_usuario, nombre_usuario, password, rol, estatus FROM usuarios WHERE nombre_usuario = ?',
        [nombre_usuario]
    );

    // Si no se encontró ningún usuario con ese nombre de usuario
    if (rows.length === 0) {
        throw new Error('Usuario no encontrado');
    }

    const usuario = rows[0];

    // Verifica que el usuario esté activo
    if (usuario.estatus !== 1) {
        throw new Error('Usuario inactivo');
    }

    // Compara la contraseña ingresada directamente con la de la bd
    if (password !== usuario.password) {
        throw new Error('Contraseña incorrecta');
    }

    // No regreses la contraseña al frontend
    delete usuario.password;

    return usuario;
}

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            UNIDADES             |
//|                                 | 
//|                                 |
//°---------------------------------°

async function getUnidades() {
    const [rows] = await db.query('SELECT pk_unidad, nombre_unidad, estatus FROM unidades');

    return rows;
}

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            SERVICIOS            |
//|                                 | 
//|                                 |
//°---------------------------------°

async function getServicios() {
    const [rows] = await db.query('SELECT pk_servicio, nombre_servicio, precio_servicio, estatus FROM servicios');

    return rows;
}

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            CATEGORÍAS           |
//|                                 | 
//|                                 |
//°---------------------------------°

async function getCategorias() {
    const [rows] = await db.query('SELECT pk_categoria, nombre_categoria, estatus FROM categorias');

    return rows;
}

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            EMPRESAS             |
//|                                 | 
//|                                 |
//°---------------------------------°

async function getEmpresas() {
    const [rows] = await db.query('SELECT pk_empresa, nombre_empresa, estatus FROM empresas');

    return rows;
}

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|           PROVEEDORES           |
//|                                 | 
//|                                 |
//°---------------------------------°

async function getProveedores() {
    const [rows] = await db.query(
        `SELECT p.pk_proveedor, p.nombre_proveedor, e.nombre_empresa AS empresa, p.RFC, p.telefono, p.correo, p.estatus
         FROM proveedores p
         LEFT JOIN empresas e ON p.fk_empresa = e.pk_empresa`
    );

    return rows;
}

// ----------------- Empresas -----------------
async function getEmpresaByName(nombre) {
    const [rows] = await db.query('SELECT pk_empresa, nombre_empresa FROM empresas WHERE nombre_empresa = ?', [nombre]);
    return rows[0];
}

async function insertEmpresa(nombre) {
    const [result] = await db.query('INSERT INTO empresas (nombre_empresa, estatus) VALUES (?, 1)', [nombre]);
    return result.insertId;
}

async function getOrCreateEmpresa(nombre) {
    if (!nombre) return null
    const existe = await getEmpresaByName(nombre)
    if (existe) return existe.pk_empresa
    const id = await insertEmpresa(nombre)
    return id
}

async function setProveedorEmpresas(pk_proveedor, empresaNombres = []) {
    await db.query('DELETE FROM proveedor_empresas WHERE fk_proveedor = ?', [pk_proveedor])
    if (!Array.isArray(empresaNombres) || empresaNombres.length === 0) {
        return
    }

    const empresaIds = []
    for (const nombre of empresaNombres) {
        if (!nombre || !nombre.trim()) continue
        const fk_empresa = await getOrCreateEmpresa(nombre.trim())
        if (fk_empresa) empresaIds.push(fk_empresa)
    }

    if (empresaIds.length > 0) {
        const values = empresaIds.map((fk_empresa) => [pk_proveedor, fk_empresa])
        await db.query(
            'INSERT INTO proveedor_empresas (fk_proveedor, fk_empresa) VALUES ?',
            [values],
        )
    }
}

// ----------------- Proveedores -----------------
async function insertProveedor({ nombre_proveedor, empresas, RFC, telefono, correo, estatus = 1 }) {
    const firstEmpresa = Array.isArray(empresas) && empresas.length > 0 ? empresas[0] : empresas
    const fk_empresa = await getOrCreateEmpresa(firstEmpresa)
    const [result] = await db.query(
        'INSERT INTO proveedores (nombre_proveedor, fk_empresa, RFC, telefono, correo, estatus) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre_proveedor, fk_empresa || 1, RFC, telefono, correo, estatus]
    )

    await setProveedorEmpresas(result.insertId, empresas)
    return { insertId: result.insertId }
}

async function updateProveedor(pk_proveedor, { nombre_proveedor, empresas, RFC, telefono, correo, estatus = 1 }) {
    const firstEmpresa = Array.isArray(empresas) && empresas.length > 0 ? empresas[0] : empresas
    const fk_empresa = await getOrCreateEmpresa(firstEmpresa)
    await db.query(
        'UPDATE proveedores SET nombre_proveedor = ?, fk_empresa = ?, RFC = ?, telefono = ?, correo = ?, estatus = ? WHERE pk_proveedor = ?',
        [nombre_proveedor, fk_empresa || 1, RFC, telefono, correo, estatus, pk_proveedor]
    )

    await setProveedorEmpresas(pk_proveedor, empresas)
    return { ok: true }
}

// ----------------- Categorías -----------------
async function insertCategoria({ nombre_categoria, estatus = 1 }) {
    const [result] = await db.query(
        'INSERT INTO categorias (nombre_categoria, estatus) VALUES (?, ?)',
        [nombre_categoria, estatus]
    )
    return { insertId: result.insertId }
}

async function updateCategoria(pk_categoria, { nombre_categoria, estatus = 1 }) {
    await db.query(
        'UPDATE categorias SET nombre_categoria = ?, estatus = ? WHERE pk_categoria = ?',
        [nombre_categoria, estatus, pk_categoria]
    )
    return { ok: true }
}

// ----------------- Servicios -----------------
async function insertServicio({ nombre_servicio, precio_servicio = 0, estatus = 1 }) {
    const [result] = await db.query(
        'INSERT INTO servicios (nombre_servicio, precio_servicio, estatus) VALUES (?, ?, ?)',
        [nombre_servicio, precio_servicio, estatus]
    )
    return { insertId: result.insertId }
}

async function updateServicio(pk_servicio, { nombre_servicio, precio_servicio = 0, estatus = 1 }) {
    await db.query(
        'UPDATE servicios SET nombre_servicio = ?, precio_servicio = ?, estatus = ? WHERE pk_servicio = ?',
        [nombre_servicio, precio_servicio, estatus, pk_servicio]
    )
    return { ok: true }
}

// ----------------- Empresas -----------------
async function updateEmpresa(pk_empresa, { nombre_empresa, estatus = 1 }) {
    await db.query(
        'UPDATE empresas SET nombre_empresa = ?, estatus = ? WHERE pk_empresa = ?',
        [nombre_empresa, estatus, pk_empresa]
    )
    return { ok: true }
}

// ----------------- Métodos de pago -----------------
async function insertMetodo({ nombre_metodo_pago, estatus = 1 }) {
    const [result] = await db.query(
        'INSERT INTO metodos_pago (nombre_metodo_pago, estatus) VALUES (?, ?)',
        [nombre_metodo_pago, estatus]
    )
    return { insertId: result.insertId }
}

async function updateMetodo(pk_metodo_pago, { nombre_metodo_pago, estatus = 1 }) {
    await db.query(
        'UPDATE metodos_pago SET nombre_metodo_pago = ?, estatus = ? WHERE pk_metodo_pago = ?',
        [nombre_metodo_pago, estatus, pk_metodo_pago]
    )
    return { ok: true }
}

// ----------------- Unidades -----------------
async function insertUnidad({ nombre_unidad, estatus = 1 }) {
    const [result] = await db.query(
        'INSERT INTO unidades (nombre_unidad, estatus) VALUES (?, ?)',
        [nombre_unidad, estatus]
    )
    return { insertId: result.insertId }
}

async function updateUnidad(pk_unidad, { nombre_unidad, estatus = 1 }) {
    await db.query(
        'UPDATE unidades SET nombre_unidad = ?, estatus = ? WHERE pk_unidad = ?',
        [nombre_unidad, estatus, pk_unidad]
    )
    return { ok: true }
}

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            PRODUCTOS            |
//|                                 | 
//|                                 |
//°---------------------------------°

async function getProductos() {
    const [rows] = await db.query('SELECT pk_producto, fk_categoria, fk_unidad, precio_venta, costo_compra, stock, stock_minimo, estatus FROM productos');

    return rows;
}

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            ENTRADAS             |
//|                                 | 
//|                                 |
//°---------------------------------°

async function getEntradas() {
    const [rows] = await db.query('SELECT pk_entrada_producto, fecha_compra, total, fk_producto, cantidad, costo_unitario_compra, fk_proveedor, estatus from entradas_productos');

    return rows;
}

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            METODOS_P            |
//|                                 | 
//|                                 |
//°---------------------------------°

async function getMetodos() {
    const [rows] = await db.query('SELECT pk_metodo_pago, nombre_metodo_pago, estatus FROM metodos_pago');

    return rows;
}

async function getUnidades() {
    const [rows] = await db.query('SELECT pk_unidad, nombre_unidad, estatus FROM unidades');

    return rows;
}

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|             VENTAS              |
//|                                 | 
//|                                 |
//°---------------------------------°

async function getVentas() {
    const [rows] = await db.query('SELECT pk_venta, fecha_venta, total_venta, fk_metodo_pago, estatus FROM ventas');

    return rows;
}

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|           D_VENTAS              |
//|                                 | 
//|                                 |
//°---------------------------------°

async function getDetalle() {
    const [rows] = await db.query('SELECT pk_detalle_com, fk_venta, fk_producto, precio_unidad_prod, cantidad_unidad, fk_servicio, cantidad_servicio, precio_unidad_serv, subtotal, estatus FROM detalle_venta');

    return rows;
}

//---------------------------------------------------------------------------------------------------

//exportamos las funciones para poder utilizarlas
module.exports = {
    login,
    getCategorias,
    getDetalle,
    getEmpresas,
    getEntradas,
    getMetodos,
    getProductos,
    getProveedores,
    getServicios,
    getUnidades,
    getVentas,
    insertProveedor,
    updateProveedor,
    insertCategoria,
    updateCategoria,
    insertServicio,
    updateServicio,
    insertEmpresa,
    updateEmpresa,
    insertMetodo,
    updateMetodo,
    insertUnidad,
    updateUnidad,
    getOrCreateEmpresa,
};