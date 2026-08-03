const db = require('./db');

function normalizeStatus(estado) {
    return estado === 1 || estado === '1' || estado === true || estado === 'Activo' || estado === 'Activa' ? 1 : 0;
}

function normalizeDateTime(value) {
    if (!value) {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    const fecha = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(fecha.getTime())) {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    const pad = (numero) => String(numero).padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
}

async function withTransaction(callback) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function adjustProductStock(connection, pkProducto, delta) {
    if (!pkProducto) return;

    const [productoRows] = await connection.query(
        'SELECT pk_producto, stock FROM productos WHERE pk_producto = ?',
        [pkProducto]
    );

    if (!productoRows.length) {
        throw new Error(`No existe el producto ${pkProducto}`);
    }

    const stockActual = Number(productoRows[0].stock || 0);
    const nuevoStock = stockActual + Number(delta || 0);

    if (nuevoStock < 0) {
        throw new Error('No hay suficiente stock para completar esta operación');
    }

    await connection.query(
        'UPDATE productos SET stock = ? WHERE pk_producto = ?',
        [nuevoStock, pkProducto]
    );
}

async function resolveProveedorId(connection, fkProveedor) {
    const proveedor = fkProveedor !== null && fkProveedor !== undefined && fkProveedor !== '' ? fkProveedor : '';

    if (proveedor) {
        return proveedor;
    }

    const [rows] = await connection.query(
        'SELECT pk_proveedor FROM proveedores WHERE estatus = 1 ORDER BY pk_proveedor ASC LIMIT 1'
    );

    if (rows[0]?.pk_proveedor) {
        return rows[0].pk_proveedor;
    }

    const [fallbackRows] = await connection.query(
        'SELECT pk_proveedor FROM proveedores ORDER BY pk_proveedor ASC LIMIT 1'
    );

    return fallbackRows[0]?.pk_proveedor ?? 1;
}

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

// ----------------- Proveedores -----------------
async function insertProveedor({ nombre_proveedor, empresas, RFC, telefono, correo, estatus = 1 }) {
    const priEmpresa = Array.isArray(empresas) && empresas.length > 0 ? empresas[0] : empresas
    const fk_empresa = await getOrCreateEmpresa(priEmpresa)
    const [result] = await db.query(
        'INSERT INTO proveedores (nombre_proveedor, fk_empresa, RFC, telefono, correo, estatus) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre_proveedor, fk_empresa || 1, RFC, telefono, correo, estatus]
    )

    return { insertId: result.insertId }
}

async function updateProveedor(pk_proveedor, { nombre_proveedor, empresas, RFC, telefono, correo, estatus = 1 }) {
    const priEmpresa = Array.isArray(empresas) && empresas.length > 0 ? empresas[0] : empresas
    const fk_empresa = await getOrCreateEmpresa(priEmpresa)
    await db.query(
        'UPDATE proveedores SET nombre_proveedor = ?, fk_empresa = ?, RFC = ?, telefono = ?, correo = ?, estatus = ? WHERE pk_proveedor = ?',
        [nombre_proveedor, fk_empresa || 1, RFC, telefono, correo, estatus, pk_proveedor]
    )

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
    const [rows] = await db.query('SELECT pk_producto, nombre_producto, fk_categoria, fk_unidad, precio_venta, costo_compra, stock, stock_minimo, estatus FROM productos');

    return rows;
}

async function insertarProducto({ nombre_producto, fk_categoria, fk_unidad, precio_venta, costo_compra, stock, stock_minimo, estatus = 1 }) {
    const [result] = await db.query(
        'INSERT INTO productos (nombre_producto, fk_categoria, fk_unidad, precio_venta, costo_compra, stock, stock_minimo, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nombre_producto, fk_categoria ?? null, fk_unidad ?? null, precio_venta ?? 0, costo_compra ?? 0, stock ?? 0, stock_minimo ?? 0, estatus]
    );

    return { insertId: result.insertId };
}

async function actualizarProducto(pk_producto, { nombre_producto, fk_categoria, fk_unidad, precio_venta, costo_compra, stock, stock_minimo, estatus = 1 }) {
    await db.query(
        'UPDATE productos SET nombre_producto = ?, fk_categoria = ?, fk_unidad = ?, precio_venta = ?, costo_compra = ?, stock = ?, stock_minimo = ?, estatus = ? WHERE pk_producto = ?',
        [nombre_producto, fk_categoria ?? null, fk_unidad ?? null, precio_venta ?? 0, costo_compra ?? 0, stock ?? 0, stock_minimo ?? 0, estatus, pk_producto]
    );

    return { ok: true };
}

async function cambiarEstadoProducto(pk_producto, estatus) {
    await db.query(
        'UPDATE productos SET estatus = ? WHERE pk_producto = ?',
        [estatus, pk_producto]
    );

    return { ok: true };
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
    const [rows] = await db.query(`
        SELECT
            e.pk_entrada_producto,
            e.fecha_compra,
            e.total,
            e.fk_producto,
            p.nombre_producto,
            e.cantidad,
            e.costo_unitario_compra,
            e.fk_proveedor,
            pr.nombre_proveedor AS proveedor,
            e.estatus
        FROM entradas_productos e
        LEFT JOIN productos p ON p.pk_producto = e.fk_producto
        LEFT JOIN proveedores pr ON pr.pk_proveedor = e.fk_proveedor
        ORDER BY e.fecha_compra DESC
    `);

    return rows;
}

async function insertEntrada({ fecha_compra, total, fk_producto, cantidad, costo_unitario_compra, fk_proveedor, estatus = 1 }) {
    const estado = normalizeStatus(estatus);

    return withTransaction(async (connection) => {
        const proveedorId = await resolveProveedorId(connection, fk_proveedor);
        const [result] = await connection.query(
            'INSERT INTO entradas_productos (fecha_compra, total, fk_producto, cantidad, costo_unitario_compra, fk_proveedor, estatus) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fecha_compra, total ?? 0, fk_producto ?? null, cantidad ?? 0, costo_unitario_compra ?? 0, proveedorId, estado]
        );

        if (estado === 1) {
            await adjustProductStock(connection, fk_producto, Number(cantidad || 0));
        }

        return { insertId: result.insertId };
    });
}

async function updateEntrada(pk_entrada_producto, { fecha_compra, total, fk_producto, cantidad, costo_unitario_compra, fk_proveedor, estatus = 1 }) {
    const estado = normalizeStatus(estatus);

    return withTransaction(async (connection) => {
        const [entradaRows] = await connection.query(
            'SELECT fk_producto, cantidad, estatus FROM entradas_productos WHERE pk_entrada_producto = ?',
            [pk_entrada_producto]
        );

        const entradaAnterior = entradaRows[0] || {};
        const estadoAnterior = normalizeStatus(entradaAnterior.estatus);
        const proveedorId = await resolveProveedorId(connection, fk_proveedor);

        if (estadoAnterior === 1 && entradaAnterior.fk_producto) {
            await adjustProductStock(connection, entradaAnterior.fk_producto, -Number(entradaAnterior.cantidad || 0));
        }

        await connection.query(
            'UPDATE entradas_productos SET fecha_compra = ?, total = ?, fk_producto = ?, cantidad = ?, costo_unitario_compra = ?, fk_proveedor = ?, estatus = ? WHERE pk_entrada_producto = ?',
            [fecha_compra, total ?? 0, fk_producto ?? null, cantidad ?? 0, costo_unitario_compra ?? 0, proveedorId, estado, pk_entrada_producto]
        );

        if (estado === 1 && fk_producto) {
            await adjustProductStock(connection, fk_producto, Number(cantidad || 0));
        }

        return { ok: true };
    });
}

async function cambiarEstadoEntrada(pk_entrada_producto, estatus) {
    const estado = normalizeStatus(estatus);

    return withTransaction(async (connection) => {
        const [entradaRows] = await connection.query(
            'SELECT fk_producto, cantidad, estatus FROM entradas_productos WHERE pk_entrada_producto = ?',
            [pk_entrada_producto]
        );

        const entrada = entradaRows[0] || {};
        const estadoAnterior = normalizeStatus(entrada.estatus);

        if (estadoAnterior === 1 && estado === 0 && entrada.fk_producto) {
            await adjustProductStock(connection, entrada.fk_producto, -Number(entrada.cantidad || 0));
        }

        if (estadoAnterior === 0 && estado === 1 && entrada.fk_producto) {
            await adjustProductStock(connection, entrada.fk_producto, Number(entrada.cantidad || 0));
        }

        await connection.query(
            'UPDATE entradas_productos SET estatus = ? WHERE pk_entrada_producto = ?',
            [estado, pk_entrada_producto]
        );

        return { ok: true };
    });
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
    const [rows] = await db.query(`
        SELECT
            v.pk_venta,
            v.fecha_venta,
            v.total_venta,
            v.fk_metodo_pago,
            mp.nombre_metodo_pago AS metodo_pago,
            v.estatus
        FROM ventas v
        LEFT JOIN metodos_pago mp ON mp.pk_metodo_pago = v.fk_metodo_pago
        ORDER BY v.fecha_venta DESC
    `);

    return rows;
}

async function resolveMetodoPago(connection, metodoPago) {
    if (metodoPago === null || metodoPago === undefined || metodoPago === '') {
        return null;
    }

    if (Number.isInteger(Number(metodoPago)) || /^\d+$/.test(String(metodoPago))) {
        return Number(metodoPago);
    }

    const [rows] = await connection.query(
        'SELECT pk_metodo_pago FROM metodos_pago WHERE nombre_metodo_pago = ? LIMIT 1',
        [String(metodoPago)]
    );

    return rows[0]?.pk_metodo_pago ?? null;
}

async function resolveServicio(connection, servicio) {
    if (servicio === null || servicio === undefined || servicio === '') {
        return null;
    }

    const servicioId = servicio?.servicioId ?? servicio?.pk_servicio ?? servicio?.id ?? servicio?.fk_servicio ?? servicio?.idServicio ?? servicio?.servicio_id;
    if (servicioId !== null && servicioId !== undefined && servicioId !== '') {
        const numericId = Number(servicioId);
        if (Number.isInteger(numericId)) {
            return numericId;
        }
    }

    const nombre = typeof servicio === 'string'
        ? servicio
        : (servicio?.nombre ?? servicio?.nombre_servicio ?? '');

    if (!nombre) {
        return null;
    }

    const [rows] = await connection.query(
        'SELECT pk_servicio FROM servicios WHERE nombre_servicio = ? LIMIT 1',
        [String(nombre)]
    );

    return rows[0]?.pk_servicio ?? null;
}

async function insertVenta({ fecha_venta, total_venta, fk_metodo_pago, estatus = 1, items = [], servicios = [] }) {
    const estado = normalizeStatus(estatus);
    const fechaVenta = normalizeDateTime(fecha_venta);

    return withTransaction(async (connection) => {
        const fkMetodoPago = await resolveMetodoPago(connection, fk_metodo_pago);
        const [result] = await connection.query(
            'INSERT INTO ventas (fecha_venta, total_venta, fk_metodo_pago, estatus) VALUES (?, ?, ?, ?)',
            [fechaVenta, total_venta ?? 0, fkMetodoPago ?? null, estado]
        );

        const fk_venta = result.insertId;

        if (Array.isArray(items)) {
            for (const item of items) {
                await connection.query(
                    'INSERT INTO detalle_venta (fk_venta, fk_producto, precio_unidad_prod, cantidad_unidad, fk_servicio, cantidad_servicio, precio_unidad_serv, subtotal, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [fk_venta, item.productoId ?? null, item.precioUnitario ?? 0, item.cantidad ?? 0, null, null, 0, item.subtotal ?? 0, 1]
                );

                if (estado === 1 && item.productoId) {
                    await adjustProductStock(connection, item.productoId, -Number(item.cantidad || 0));
                }
            }
        }

        if (Array.isArray(servicios)) {
            for (const servicio of servicios) {
                const fkServicio = await resolveServicio(connection, servicio);
                await connection.query(
                    'INSERT INTO detalle_venta (fk_venta, fk_producto, precio_unidad_prod, cantidad_unidad, fk_servicio, cantidad_servicio, precio_unidad_serv, subtotal, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [fk_venta, null, 0, 0, fkServicio ?? null, servicio.cantidad ?? 0, servicio.precioUnitario ?? 0, servicio.subtotal ?? 0, 1]
                );
            }
        }

        return { insertId: fk_venta };
    });
}

async function updateVenta(pk_venta, { fecha_venta, total_venta, fk_metodo_pago, estatus = 1, items = [], servicios = [] }) {
    const estado = normalizeStatus(estatus);
    const fechaVenta = normalizeDateTime(fecha_venta);

    return withTransaction(async (connection) => {
        const fkMetodoPago = await resolveMetodoPago(connection, fk_metodo_pago);
        const [ventaRows] = await connection.query('SELECT estatus FROM ventas WHERE pk_venta = ?', [pk_venta]);
        const estadoAnterior = normalizeStatus(ventaRows[0]?.estatus);

        if (estadoAnterior === 1) {
            const [detalleRows] = await connection.query('SELECT fk_producto, cantidad_unidad FROM detalle_venta WHERE fk_venta = ?', [pk_venta]);
            for (const detalle of detalleRows) {
                if (detalle.fk_producto) {
                    await adjustProductStock(connection, detalle.fk_producto, Number(detalle.cantidad_unidad || 0));
                }
            }
        }

        await connection.query(
            'UPDATE ventas SET fecha_venta = ?, total_venta = ?, fk_metodo_pago = ?, estatus = ? WHERE pk_venta = ?',
            [fechaVenta, total_venta ?? 0, fkMetodoPago ?? null, estado, pk_venta]
        );

        await connection.query('DELETE FROM detalle_venta WHERE fk_venta = ?', [pk_venta]);

        if (Array.isArray(items)) {
            for (const item of items) {
                await connection.query(
                    'INSERT INTO detalle_venta (fk_venta, fk_producto, precio_unidad_prod, cantidad_unidad, fk_servicio, cantidad_servicio, precio_unidad_serv, subtotal, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [pk_venta, item.productoId ?? null, item.precioUnitario ?? 0, item.cantidad ?? 0, null, null, 0, item.subtotal ?? 0, 1]
                );

                if (estado === 1 && item.productoId) {
                    await adjustProductStock(connection, item.productoId, -Number(item.cantidad || 0));
                }
            }
        }

        if (Array.isArray(servicios)) {
            for (const servicio of servicios) {
                const fkServicio = await resolveServicio(connection, servicio);
                await connection.query(
                    'INSERT INTO detalle_venta (fk_venta, fk_producto, precio_unidad_prod, cantidad_unidad, fk_servicio, cantidad_servicio, precio_unidad_serv, subtotal, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [pk_venta, null, 0, 0, fkServicio ?? null, servicio.cantidad ?? 0, servicio.precioUnitario ?? 0, servicio.subtotal ?? 0, 1]
                );
            }
        }

        return { ok: true };
    });
}

async function cambiarEstadoVenta(pk_venta, estatus) {
    const estado = normalizeStatus(estatus);

    return withTransaction(async (connection) => {
        const [ventaRows] = await connection.query('SELECT estatus FROM ventas WHERE pk_venta = ?', [pk_venta]);
        const estadoAnterior = normalizeStatus(ventaRows[0]?.estatus);

        if (estadoAnterior === 1 && estado === 0) {
            const [detalleRows] = await connection.query('SELECT fk_producto, cantidad_unidad FROM detalle_venta WHERE fk_venta = ?', [pk_venta]);
            for (const detalle of detalleRows) {
                if (detalle.fk_producto) {
                    await adjustProductStock(connection, detalle.fk_producto, Number(detalle.cantidad_unidad || 0));
                }
            }
        }

        if (estadoAnterior === 0 && estado === 1) {
            const [detalleRows] = await connection.query('SELECT fk_producto, cantidad_unidad FROM detalle_venta WHERE fk_venta = ?', [pk_venta]);
            for (const detalle of detalleRows) {
                if (detalle.fk_producto) {
                    await adjustProductStock(connection, detalle.fk_producto, -Number(detalle.cantidad_unidad || 0));
                }
            }
        }

        await connection.query(
            'UPDATE ventas SET estatus = ? WHERE pk_venta = ?',
            [estado, pk_venta]
        );

        return { ok: true };
    });
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
    const [rows] = await db.query(`
        SELECT
            d.pk_detalle_com,
            d.fk_venta,
            d.fk_producto,
            p.nombre_producto,
            d.precio_unidad_prod,
            d.cantidad_unidad,
            d.fk_servicio,
            s.nombre_servicio,
            d.cantidad_servicio,
            d.precio_unidad_serv,
            d.subtotal,
            d.estatus
        FROM detalle_venta d
        LEFT JOIN productos p ON p.pk_producto = d.fk_producto
        LEFT JOIN servicios s ON s.pk_servicio = d.fk_servicio
    `);

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
    insertEntrada,
    updateEntrada,
    cambiarEstadoEntrada,
    getMetodos,
    getProductos,
    insertarProducto,
    actualizarProducto,
    cambiarEstadoProducto,
    getProveedores,
    getServicios,
    getUnidades,
    getVentas,
    insertVenta,
    updateVenta,
    cambiarEstadoVenta,
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