const express = require('express');

const cors = require('cors');

require('dotenv').config();

const query = require('./query');

const app = express();

const PORT = 5002;

function normalizeDateTime(value) {
    if (!value) {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
        return value;
    }

    const fecha = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(fecha.getTime())) {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    const pad = (numero) => String(numero).padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
}

app.use(cors());

app.use(express.json());

// Middleware para loguear todas las peticiones entrantes (método y ruta)
app.use((req, res, next) => {
    try {
        console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    } catch (e) {
        // no bloquear en caso de error de logging
    }
    next();
});

//°---------------------------------°
//|                                 |  
//|                                 |  
//|              Login              |
//|                                 | 
//|                                 |
//°---------------------------------°

app.post('/login', async (req, res) => {
    const { nombre_usuario, password } = req.body;

    try {
        //query.login es la función que tenemos en querys.js
        const usuario = await query.login(nombre_usuario, password);
        res.json({ success: true, usuario });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

app.post('/insertarUsuario', async (req, res) => {
    try {
        //Son los datos que manda el backend en formato json (nombre, apellidos y correo)
        const { nombre, apellidos, correo } = req.body

        //se llama la consulta y se mandan los parámetros
        await query.insertUsuario(nombre, apellidos, correo);

        //mensaje
        res.json({ mensaje: 'Usuario insertado correctamente' });
    } catch (error) {
        //si ocurre un error, muestra esto
        res.status(500).json({ error: 'Error al insertar el usuario' });
    }
})

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            UNIDADES             |
//|                                 | 
//|                                 |
//°---------------------------------°

app.get('/obtenerUnidades', async (req, res) => {
    try {
        const unidades = await query.getUnidades();
        res.json(unidades);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las unidades' });
    }
});

app.post('/insertarProducto', async (req, res) => {
    try {
        const producto = await query.insertarProducto(req.body);
        res.json({ mensaje: 'Producto insertado correctamente', producto });
    } catch (error) {
        res.status(500).json({ error: 'Error al insertar el producto' });
    }
});

app.post('/actualizarProducto', async (req, res) => {
    try {
        const { pk_producto, ...datos } = req.body;
        await query.actualizarProducto(pk_producto, datos);
        res.json({ mensaje: 'Producto actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

app.post('/cambiarEstadoProducto', async (req, res) => {
    try {
        const { pk_producto, estatus } = req.body;
        await query.cambiarEstadoProducto(pk_producto, estatus);
        res.json({ mensaje: 'Estado del producto actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el estado del producto' });
    }
});

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            SERVICIOS            |
//|                                 | 
//|                                 |
//°---------------------------------°

app.get('/obtenerServicios', async (req, res) => {
    try {
        const servicios = await query.getServicios();
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los servicios' });
    }
});

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            CATEGORÍAS           |
//|                                 | 
//|                                 |
//°---------------------------------°

app.get('/obtenerCategorias', async (req, res) => {
    try {
        const categorias = await query.getCategorias();
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las categorías' });
    }
});

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            EMPRESAS             |
//|                                 | 
//|                                 |
//°---------------------------------°

app.get('/obtenerEmpresas', async (req, res) => {
    try {
        const empresas = await query.getEmpresas();
        res.json(empresas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las empresas' });
    }
});

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|           PROVEEDORES           |
//|                                 | 
//|                                 |
//°---------------------------------°

app.get('/obtenerProveedores', async (req, res) => {
    try {
        const proveedores = await query.getProveedores();
        res.json(proveedores);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los proveedores' });
    }
});

// debug route to list registered routes
app.get('/_routes', (req, res) => {
    const routes = [];
    if (app._router) {
        app._router.stack.forEach((middleware) => {
            if (middleware.route) {
                const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
                routes.push({ methods, path: middleware.route.path });
            }
        });
    }
    res.json(routes);
});

// Crear nuevo proveedor
app.post('/proveedores', async (req, res) => {
    try {
        const { nombre, empresa, RFC, telefono, correo } = req.body
        const result = await query.insertProveedor({ nombre_proveedor: nombre, empresa, RFC, telefono, correo })
        res.json({ ok: true, id: result.insertId })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al crear el proveedor' })
    }
})

// Actualizar proveedor
app.put('/proveedores/:id', async (req, res) => {
    try {
        const id = req.params.id
        const { nombre, empresa, RFC, telefono, correo, estado } = req.body
        await query.updateProveedor(id, { nombre_proveedor: nombre, empresa, RFC, telefono, correo, estatus: estado === 'Activo' ? 1 : 0 })
        res.json({ ok: true })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al actualizar el proveedor' })
    }
})

// Cambiar estado (opcional)
app.patch('/proveedores/:id/estado', async (req, res) => {
    try {
        const id = req.params.id
        const { estado } = req.body
        await query.updateProveedor(id, { nombre_proveedor: req.body.nombre || '', empresa: req.body.empresa || '', RFC: req.body.RFC || '', telefono: req.body.telefono || '', correo: req.body.correo || '', estatus: estado === 'Activo' ? 1 : 0 })
        res.json({ ok: true })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al cambiar el estado del proveedor' })
    }
})

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            CATEGORÍAS           |
//|                                 | 
//|                                 |
//°---------------------------------°

app.post('/categorias', async (req, res) => {
    try {
        const { nombre, estado } = req.body
        const result = await query.insertCategoria({ nombre_categoria: nombre, estatus: estado === 'Activo' ? 1 : 0 })
        res.json({ ok: true, id: result.insertId })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al crear la categoría' })
    }
})

app.put('/categorias/:id', async (req, res) => {
    try {
        const id = req.params.id
        const { nombre, estado } = req.body
        await query.updateCategoria(id, { nombre_categoria: nombre, estatus: estado === 'Activo' ? 1 : 0 })
        res.json({ ok: true })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al actualizar la categoría' })
    }
})

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            SERVICIOS            |
//|                                 | 
//|                                 |
//°---------------------------------°

app.post('/servicios', async (req, res) => {
    try {
        const { nombre, precio, estado } = req.body
        const result = await query.insertServicio({ nombre_servicio: nombre, precio_servicio: precio, estatus: estado === 'Activo' ? 1 : 0 })
        res.json({ ok: true, id: result.insertId })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al crear el servicio' })
    }
})

app.put('/servicios/:id', async (req, res) => {
    try {
        const id = req.params.id
        const { nombre, precio, estado } = req.body
        await query.updateServicio(id, { nombre_servicio: nombre, precio_servicio: precio, estatus: estado === 'Activo' ? 1 : 0 })
        res.json({ ok: true })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al actualizar el servicio' })
    }
})

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            EMPRESAS             |
//|                                 | 
//|                                 |
//°---------------------------------°

app.post('/empresas', async (req, res) => {
    try {
        const { nombre, estado } = req.body
        const result = await query.insertEmpresa(nombre)
        res.json({ ok: true, id: result.insertId })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al crear la empresa' })
    }
})

app.put('/empresas/:id', async (req, res) => {
    try {
        const id = req.params.id
        const { nombre, estado } = req.body
        await query.updateEmpresa(id, { nombre_empresa: nombre, estatus: estado === 'Activo' ? 1 : 0 })
        res.json({ ok: true })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al actualizar la empresa' })
    }
})

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|           METODOS_P            |
//|                                 | 
//|                                 |
//°---------------------------------°

app.post('/metodos', async (req, res) => {
    try {
        const { nombre, estado } = req.body
        const result = await query.insertMetodo({ nombre_metodo_pago: nombre, estatus: estado === 'Activo' ? 1 : 0 })
        res.json({ ok: true, id: result.insertId })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al crear el método de pago' })
    }
})

app.put('/metodos/:id', async (req, res) => {
    try {
        const id = req.params.id
        const { nombre, estado } = req.body
        await query.updateMetodo(id, { nombre_metodo_pago: nombre, estatus: estado === 'Activo' ? 1 : 0 })
        res.json({ ok: true })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al actualizar el método de pago' })
    }
})

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            UNIDADES             |
//|                                 | 
//|                                 |
//°---------------------------------°

app.post('/unidades', async (req, res) => {
    try {
        const { nombre, estado } = req.body
        const result = await query.insertUnidad({ nombre_unidad: nombre, estatus: estado === 'Activo' ? 1 : 0 })
        res.json({ ok: true, id: result.insertId })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al crear la unidad' })
    }
})

app.put('/unidades/:id', async (req, res) => {
    try {
        const id = req.params.id
        const { nombre, estado } = req.body
        await query.updateUnidad(id, { nombre_unidad: nombre, estatus: estado === 'Activo' ? 1 : 0 })
        res.json({ ok: true })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al actualizar la unidad' })
    }
})

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            PRODUCTOS            |
//|                                 | 
//|                                 |
//°---------------------------------°

app.get('/obtenerProductos', async (req, res) => {
    try {
        const productos = await query.getProductos();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
});

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            ENTRADAS             |
//|                                 | 
//|                                 |
//°---------------------------------°

app.get('/obtenerEntradas', async (req, res) => {
    try {
        const entradas = await query.getEntradas();
        res.json(entradas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las entradas de producto' });
    }
});

app.post('/entradas', async (req, res) => {
    try {
        const { productoId, cantidad, costoUnitario, proveedorId, fecha, total, estado } = req.body;
        const result = await query.insertEntrada({
            fecha_compra: normalizeDateTime(fecha),
            total: total ?? Number(cantidad || 0) * Number(costoUnitario || 0),
            fk_producto: productoId,
            cantidad,
            costo_unitario_compra: costoUnitario,
            fk_proveedor: proveedorId || null,
            estatus: estado === 'Activo' || estado === 'Activa' || estado === 1 ? 1 : 0,
        });
        res.json({ ok: true, id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar la entrada' });
    }
});

app.put('/entradas/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { productoId, cantidad, costoUnitario, proveedorId, fecha, total, estado } = req.body;
        await query.updateEntrada(id, {
            fecha_compra: normalizeDateTime(fecha),
            total: total ?? Number(cantidad || 0) * Number(costoUnitario || 0),
            fk_producto: productoId,
            cantidad,
            costo_unitario_compra: costoUnitario,
            fk_proveedor: proveedorId || null,
            estatus: estado === 'Activo' || estado === 'Activa' || estado === 1 ? 1 : 0,
        });
        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar la entrada' });
    }
});

app.patch('/entradas/:id/estado', async (req, res) => {
    try {
        const id = req.params.id;
        const { estado } = req.body;
        await query.cambiarEstadoEntrada(id, estado === 'Activo' || estado === 'Activa' || estado === 1 ? 1 : 0);
        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cambiar el estado de la entrada' });
    }
});

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|            METODOS_P            |
//|                                 | 
//|                                 |
//°---------------------------------°

app.get('/obtenerMetodos', async (req, res) => {
    try {
        const metodos = await query.getMetodos();
        res.json(metodos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los métodos de pago' });
    }
});

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|             VENTAS              |
//|                                 | 
//|                                 |
//°---------------------------------°

app.get('/obtenerVentas', async (req, res) => {
    try {
        const ventas = await query.getVentas();
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las ventas' });
    }
});

app.post('/ventas', async (req, res) => {
    try {
        const { items = [], servicios = [], metodoPago, total, fecha, estado } = req.body;
        const fkMetodoPago = req.body.fk_metodo_pago ?? metodoPago ?? null;
        const result = await query.insertVenta({
            fecha_venta: normalizeDateTime(fecha),
            total_venta: total ?? 0,
            fk_metodo_pago: fkMetodoPago,
            estatus: estado === 'Activa' || estado === 'Activo' || estado === 1 ? 1 : 0,
            items,
            servicios,
        });
        res.json({ ok: true, id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar la venta' });
    }
});

app.put('/ventas/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { items = [], servicios = [], metodoPago, total, fecha, estado } = req.body;
        const fkMetodoPago = req.body.fk_metodo_pago ?? metodoPago ?? null;
        await query.updateVenta(id, {
            fecha_venta: normalizeDateTime(fecha),
            total_venta: total ?? 0,
            fk_metodo_pago: fkMetodoPago,
            estatus: estado === 'Activa' || estado === 'Activo' || estado === 1 ? 1 : 0,
            items,
            servicios,
        });
        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar la venta' });
    }
});

app.patch('/ventas/:id/estado', async (req, res) => {
    try {
        const id = req.params.id;
        const { estado } = req.body;
        await query.cambiarEstadoVenta(id, estado === 'Activa' || estado === 'Activo' || estado === 1 ? 1 : 0);
        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cambiar el estado de la venta' });
    }
});

//---------------------------------------------------------------------------------------------------

//°---------------------------------°
//|                                 |  
//|                                 |  
//|           D_VENTAS              |
//|                                 | 
//|                                 |
//°---------------------------------°


app.get('/obtenerDetalle', async (req, res) => {
    try {
        const detalle = await query.getDetalle();
        res.json(detalle);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los detalles de la venta' });
    }

});

//---------------------------------------------------------------------------------------------------

// List registered routes for debugging
if (app._router) {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            // routes registered directly on the app
            const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
            routes.push(`${methods} ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
            // router middleware
            middleware.handle.stack.forEach(function(handler) {
                if (handler.route) {
                    const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
                    routes.push(`${methods} ${handler.route.path}`);
                }
            });
        }
    });
    console.log('Registered routes:\n' + routes.join('\n'))
}

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});