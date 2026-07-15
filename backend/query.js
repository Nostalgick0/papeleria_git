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

async function insertUnidad(nombre_unidad) {
    const [rows] = await db.query(
        'INSERT INTO unidades (nombre_unidad, estatus) \
        VALUES (?, 1)', [nombre_unidad]
    );
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
    const [rows] = await db.query('SELECT pk_producto, nombre_producto, fk_categoria, fk_unidad, precio_venta, costo_compra, stock, stock_minimo, estatus FROM productos');

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
    const [rows] = await db.query(
        'SELECT v.pk_venta, v.fecha_venta, v.total_venta, v.fk_metodo_pago, v.estatus, m.nombre_metodo_pago \
        FROM ventas v \
        JOIN metodos_pago m ON v.fk_metodo_pago = m.pk_metodo_pago'
    );

    return rows;
}

async function insertVenta(fecha_venta, total_venta, fk_metodo_pago, items, servicios) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [ventaResult] = await connection.query(
            'INSERT INTO ventas (fecha_venta, total_venta, fk_metodo_pago, estatus) VALUES (?, ?, ?, 1)',
            [fecha_venta, total_venta, fk_metodo_pago]
        );
        const pk_venta = ventaResult.insertId;

        for (const item of items) {
            await connection.query(
                'INSERT INTO detalle_venta (fk_venta, fk_producto, precio_unidad_prod, cantidad_unidad, subtotal, estatus) \
                VALUES (?, ?, ?, ?, ?, 1)',
                [pk_venta, item.fk_producto, item.precio_unidad_prod, item.cantidad_unidad, item.subtotal]
            );
            //se descuenta el stock del producto vendido
            await connection.query(
                'UPDATE productos SET stock = stock - ? WHERE pk_producto = ?',
                [item.cantidad_unidad, item.fk_producto]
            );
        }

        for (const servicio of servicios) {
            await connection.query(
                'INSERT INTO detalle_venta (fk_venta, fk_servicio, cantidad_servicio, precio_unidad_serv, subtotal, estatus) \
                VALUES (?, ?, ?, ?, ?, 1)',
                [pk_venta, servicio.fk_servicio, servicio.cantidad_servicio, servicio.precio_unidad_serv, servicio.subtotal]
            );
        }

        //si todo salió bien, se aplican los cambios de forma definitiva
        await connection.commit();
        return { pk_venta };
    } catch (error) {
        //si algo falla, se deshace todo lo que se alcanzó a hacer en esta transacción
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function actualizarVenta(pk_venta, fecha_venta, total_venta, fk_metodo_pago, items, servicios) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        //se restaura el stock de los productos que tenía la venta antes de modificarla
        const [detalleAnterior] = await connection.query(
            'SELECT fk_producto, cantidad_unidad FROM detalle_venta WHERE fk_venta = ? AND fk_producto IS NOT NULL',
            [pk_venta]
        );
        for (const d of detalleAnterior) {
            await connection.query(
                'UPDATE productos SET stock = stock + ? WHERE pk_producto = ?',
                [d.cantidad_unidad, d.fk_producto]
            );
        }

        //se elimina el detalle anterior para reemplazarlo por el nuevo
        await connection.query('DELETE FROM detalle_venta WHERE fk_venta = ?', [pk_venta]);

        await connection.query(
            'UPDATE ventas SET fecha_venta = ?, total_venta = ?, fk_metodo_pago = ? WHERE pk_venta = ?',
            [fecha_venta, total_venta, fk_metodo_pago, pk_venta]
        );

        for (const item of items) {
            await connection.query(
                'INSERT INTO detalle_venta (fk_venta, fk_producto, precio_unidad_prod, cantidad_unidad, subtotal, estatus) \
                VALUES (?, ?, ?, ?, ?, 1)',
                [pk_venta, item.fk_producto, item.precio_unidad_prod, item.cantidad_unidad, item.subtotal]
            );
            await connection.query(
                'UPDATE productos SET stock = stock - ? WHERE pk_producto = ?',
                [item.cantidad_unidad, item.fk_producto]
            );
        }

        for (const servicio of servicios) {
            await connection.query(
                'INSERT INTO detalle_venta (fk_venta, fk_servicio, cantidad_servicio, precio_unidad_serv, subtotal, estatus) \
                VALUES (?, ?, ?, ?, ?, 1)',
                [pk_venta, servicio.fk_servicio, servicio.cantidad_servicio, servicio.precio_unidad_serv, servicio.subtotal]
            );
        }

        //si todo salió bien, se aplican los cambios de forma definitiva
        await connection.commit();
    } catch (error) {
        //si algo falla, se deshace todo (incluyendo el DELETE), así no se pierde el detalle
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function deshabilitarVenta(pk_venta) {
    //se restaura el stock de los productos de esta venta antes de deshabilitarla
    const [detalle] = await db.query(
        'SELECT fk_producto, cantidad_unidad FROM detalle_venta WHERE fk_venta = ? AND fk_producto IS NOT NULL',
        [pk_venta]
    );
    for (const d of detalle) {
        await db.query(
            'UPDATE productos SET stock = stock + ? WHERE pk_producto = ?',
            [d.cantidad_unidad, d.fk_producto]
        );
    }

    const [rows] = await db.query(
        'UPDATE ventas SET estatus = 0 WHERE pk_venta = ?',
        [pk_venta]
    );

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

async function getDetalle(fk_venta) {
    const [rows] = await db.query(
        'SELECT d.pk_detalle_com, d.fk_venta, \
                d.fk_producto, p.nombre_producto, d.precio_unidad_prod, d.cantidad_unidad, \
                d.fk_servicio, s.nombre_servicio, d.cantidad_servicio, d.precio_unidad_serv, \
                d.subtotal, d.estatus \
        FROM detalle_venta d \
        LEFT JOIN productos p ON d.fk_producto = p.pk_producto \
        LEFT JOIN servicios s ON d.fk_servicio = s.pk_servicio \
        WHERE d.fk_venta = ?',
        [fk_venta]
    );

    return rows;
}

//---------------------------------------------------------------------------------------------------

//exportamos las funciones para poder utilizarlas
module.exports = {
    login,
    actualizarVenta,
    deshabilitarVenta,
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
    insertUnidad,
    insertVenta
};