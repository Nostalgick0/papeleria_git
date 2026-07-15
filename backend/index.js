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

app.get('/obtenerVentas', async (req, res) => {
    try {
        const ventas = await query.getVentas();
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las ventas' });
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

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});