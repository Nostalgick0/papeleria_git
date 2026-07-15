const express = require('express');

const cors = require('cors');

require('dotenv').config();

const query = require('./query');

const app = express();

const PORT = 5002;

app.use(cors());

app.use(express.json());

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

app.post('/insertarUnidad', async (req, res) => {
    try {
        //Son los datos que manda el backend en formato json (nombre, apellidos y correo)
        const { nombre_unidad } = req.body

        //se llama la consulta y se mandan los parámetros
        await query.insertUnidad(nombre_unidad);

        //mensaje
        res.json({ mensaje: 'Unidad insertada correctamente' });
    } catch (error) {
        //si ocurre un error, muestra esto
        res.status(500).json({ error: 'Error al insertar la unidad' });
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

app.post('/insertarVenta', async (req, res) => {
    try {
        const { fecha_venta, total_venta, fk_metodo_pago, items, servicios } = req.body;
        const resultado = await query.insertVenta(fecha_venta, total_venta, fk_metodo_pago, items, servicios);
        res.json({ mensaje: 'Venta registrada correctamente', ...resultado });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar la venta' });
    }
});

app.get('/obtenerVentas', async (req, res) => {
    try {
        const ventas = await query.getVentas();
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las ventas' });
    }
});

app.post('/actualizarVenta', async (req, res) => {
    try {
        const { pk_venta, fecha_venta, total_venta, fk_metodo_pago, items, servicios } = req.body;
        await query.actualizarVenta(pk_venta, fecha_venta, total_venta, fk_metodo_pago, items, servicios);
        res.json({ mensaje: 'Venta actualizada correctamente' });
    } catch (error) {
        console.error(error); //temporal, para ver el error real
        res.status(500).json({ error: 'Error al actualizar la venta' });
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


app.get('/obtenerDetalleVenta/:pk_venta', async (req, res) => {
    try {
        const { pk_venta } = req.params;
        const detalle = await query.getDetalle(pk_venta);
        res.json(detalle);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el detalle de la venta' });
    }
});

//---------------------------------------------------------------------------------------------------

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});