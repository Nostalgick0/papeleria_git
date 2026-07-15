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
    const [rows] = await db.query('SELECT pk_proveedor, nombre_proveedor, fk_empresa, RFC, telefono, correo, estatus from proveedores');

    return rows;
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
};