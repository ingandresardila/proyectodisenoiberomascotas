// src/app.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');

// Configurar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar sesiones
app.use(session({
    secret: 'mascotas_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware para datos de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para pasar datos del usuario a todas las vistas
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario;
    next();
});

// ========== BASE DE DATOS EN MEMORIA ==========
// AÑADE UN USUARIO DE PRUEBA PARA PODER INICIAR SESIÓN
let usuarios = [
    {
        id: 1,
        nombre: "Usuario Demo",
        email: "demo@mascotas.com",
        password: "123456",
        fechaRegistro: new Date().toISOString()
    }
];

let carrito = [];

// ========== RUTAS CORREGIDAS ==========

// 1. Página de login (ÚNICA DEFINICIÓN - NO DUPLICADAS)
app.get('/', (req, res) => {
    if (req.session.usuario) {
        return res.redirect('/products');
    }
    
    // Obtener mensajes de query string
    const success = req.query.success || null;
    const error = req.query.error || null;
    
    res.render('pages/login', {
        title: 'Iniciar Sesión - Mascotas L&C',
        page: 'login',
        error: error,
        success: success
    });
});

// 2. Procesar login (FUNCIONAL)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('📧 Intento de login:', { email, password });
    
    // Buscar usuario (incluye el usuario demo)
    const usuario = usuarios.find(u => u.email === email && u.password === password);
    
    if (usuario) {
        req.session.usuario = usuario;
        console.log(`✅ Usuario inició sesión: ${usuario.email}`);
        console.log(`👤 Nombre: ${usuario.nombre}`);
        res.redirect('/products'); // Redirige a productos
    } else {
        console.log(`❌ Login fallido para: ${email}`);
        console.log(`📋 Usuarios disponibles: ${usuarios.map(u => u.email).join(', ')}`);
        res.redirect('/?error=Correo+o+contraseña+incorrectos.+Prueba+con+demomascotas.com+y+123456');
    }
});

// 3. Página de registro
app.get('/register', (req, res) => {
    if (req.session.usuario) {
        return res.redirect('/products');
    }
    
    res.render('pages/register', {
        title: 'Registro - Mascotas L&C',
        page: 'register',
        error: null,
        success: null
    });
});

// 4. Procesar registro
app.post('/register', (req, res) => {
    const { nombre, email, password, confirmPassword } = req.body;
    
    console.log('📝 Intento de registro:', { nombre, email });
    
    // Validaciones
    if (password !== confirmPassword) {
        return res.render('pages/register', {
            title: 'Registro - Mascotas L&C',
            page: 'register',
            error: 'Las contraseñas no coinciden',
            success: null
        });
    }
    
    if (password.length < 6) {
        return res.render('pages/register', {
            title: 'Registro - Mascotas L&C',
            page: 'register',
            error: 'La contraseña debe tener al menos 6 caracteres',
            success: null
        });
    }
    
    const usuarioExistente = usuarios.find(u => u.email === email);
    if (usuarioExistente) {
        return res.render('pages/register', {
            title: 'Registro - Mascotas L&C',
            page: 'register',
            error: 'El correo ya está registrado',
            success: null
        });
    }
    
    // Crear usuario
    const nuevoUsuario = {
        id: Date.now(),
        nombre,
        email,
        password,
        fechaRegistro: new Date().toISOString()
    };
    
    usuarios.push(nuevoUsuario);
    console.log(`✅ Nuevo usuario registrado: ${email}`);
    console.log(`📋 Total usuarios: ${usuarios.length}`);
    
    // Mostrar mensaje de éxito
    res.render('pages/register', {
        title: 'Registro - Mascotas L&C',
        page: 'register',
        error: null,
        success: '¡Registro exitoso! Ahora puedes iniciar sesión con tus credenciales.'
    });
});

// 5. Página de productos (requiere login) - CORREGIDO
app.get('/products', (req, res) => {
    console.log('🔍 Intentando acceder a /products');
    console.log('👤 Sesión actual:', req.session.usuario ? 'Usuario: ' + req.session.usuario.email : 'No hay sesión');
    
    if (!req.session.usuario) {
        console.log('❌ Usuario no autenticado, redirigiendo a login');
        return res.redirect('/?error=Debes+iniciar+sesión+para+acceder+a+los+productos');
    }
    
    console.log(`✅ Acceso permitido para: ${req.session.usuario.email}`);
    
    const productos = [
        { 
            id: 1, 
            nombre: "Felix Surtido Precio Especial x 8 Sobres", 
            precio: 20462, 
            categoria: "Alimento", 
            tipo: "Gatos",
            descripcion: "Alimento húmedo para gatos adultos, variedad de sabores",
            imagen: "/images/productos/gato1.jpg"
        },
        { 
            id: 2, 
            nombre: "Hills Prescription Diet Gatos Digestive Care i/d Lata 5.5 Oz", 
            precio: 16133, 
            categoria: "Alimento", 
            tipo: "Gatos",
            descripcion: "Alimento veterinario para problemas digestivos",
            imagen: "/images/productos/gato2.jpg"
        },
        { 
            id: 3, 
            nombre: "Royal Canin Mini Adult para Perros Pequeños", 
            precio: 45200, 
            categoria: "Alimento", 
            tipo: "Perros",
            descripcion: "Alimento seco para perros pequeños adultos",
            imagen: "/images/productos/perro1.jpg"
        },
        { 
            id: 4, 
            nombre: "Cama Ortopédica para Perros Grandes", 
            precio: 89900, 
            categoria: "Accesorios", 
            tipo: "Perros",
            descripcion: "Cama ortopédica con memory foam, tamaño grande",
            imagen: "/images/productos/perro2.jpg"
        },
        { 
            id: 5, 
            nombre: "Juguete Interactivo para Gatos con Hierba Gatera", 
            precio: 25400, 
            categoria: "Juguetes", 
            tipo: "Gatos",
            descripcion: "Juguete con compartimento para hierba gatera",
            imagen: "/images/productos/gato3.jpg"
        },
        { 
            id: 6, 
            nombre: "Correa Retráctil para Perros 5m", 
            precio: 38500, 
            categoria: "Accesorios", 
            tipo: "Perros",
            descripcion: "Correa retráctil de 5 metros, resistente al agua",
            imagen: "/images/productos/perro3.jpg"
        },
        { 
            id: 7, 
            nombre: "Arena Aglomerante para Gatos 10kg", 
            precio: 42300, 
            categoria: "Higiene", 
            tipo: "Gatos",
            descripcion: "Arena aglomerante con control de olores",
            imagen: "/images/productos/gato4.jpg"
        },
        { 
            id: 8, 
            nombre: "Shampoo Antipulgas para Perros 500ml", 
            precio: 28700, 
            categoria: "Higiene", 
            tipo: "Perros",
            descripcion: "Shampoo antipulgas y garrapatas, pH balanceado",
            imagen: "/images/productos/perro4.jpg"
        },
        { 
            id: 9, 
            nombre: "Transportadora para Mascotas Tamaño Mediano", 
            precio: 75600, 
            categoria: "Accesorios", 
            tipo: "Ambos",
            descripcion: "Transportadora ventilada, fácil de limpiar",
            imagen: "/images/productos/ambos1.jpg"
        },
        { 
            id: 10, 
            nombre: "Comedero Automático para Mascotas", 
            precio: 112000, 
            categoria: "Accesorios", 
            tipo: "Ambos",
            descripcion: "Comedero automático programable, 4 comidas diarias",
            imagen: "/images/productos/ambos2.jpg"
        }
    ];
    
    res.render('pages/products', {
        title: 'Productos - Mascotas L&C',
        page: 'products',
        productos: productos,
        usuario: req.session.usuario
    });
});

// 6. Agregar al carrito (API mejorada)
app.post('/agregar-carrito', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ 
            success: false, 
            error: 'No autenticado' 
        });
    }
    
    const { productoId, cantidad } = req.body;
    
    // Inicializar carrito en sesión si no existe
    if (!req.session.carrito) {
        req.session.carrito = [];
    }
    
    req.session.carrito.push({ 
        productoId, 
        cantidad: cantidad || 1, 
        usuarioId: req.session.usuario.id,
        fecha: new Date().toISOString()
    });
    
    res.json({ 
        success: true, 
        message: 'Producto agregado al carrito',
        totalItems: req.session.carrito.length
    });
});

// 7. Ver carrito
app.get('/carrito', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    
    res.render('pages/checkout', {
        title: 'Carrito - Mascotas L&C',
        page: 'checkout',
        carrito: req.session.carrito || []
    });
});

// 8. Página de pago
app.get('/payment', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    
    res.render('pages/payment', {
        title: 'Pago - Mascotas L&C',
        page: 'payment',
        carrito: req.session.carrito || [],
        usuario: req.session.usuario
    });
});

// 9. Logout (mejorado)
app.get('/logout', (req, res) => {
    const usuarioEmail = req.session.usuario ? req.session.usuario.email : 'Desconocido';
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Error al cerrar sesión:', err);
        } else {
            console.log(`✅ Sesión cerrada para: ${usuarioEmail}`);
        }
        res.redirect('/');
    });
});

// 10. Ruta para desarrollo (ver datos)
app.get('/debug', (req, res) => {
    console.log('📊 Estado del servidor:');
    console.log('👥 Usuarios:', usuarios.map(u => ({ email: u.email, nombre: u.email })));
    console.log('🔐 Sesión actual:', req.session);
    console.log('🛒 Carrito:', req.session.carrito || []);
    
    res.json({
        status: 'OK',
        usuarios: usuarios.map(u => ({ ...u, password: '***' })),
        totalUsuarios: usuarios.length,
        sesion: req.session,
        carrito: req.session.carrito || []
    });
});

// 11. Ruta para limpiar datos (solo desarrollo)
app.get('/reset', (req, res) => {
    // Restablecer usuario demo
    usuarios = [
        {
            id: 1,
            nombre: "Usuario Demo",
            email: "demo@mascotas.com",
            password: "123456",
            fechaRegistro: new Date().toISOString()
        }
    ];
    
    req.session.destroy(() => {
        res.redirect('/?success=Datos+restablecidos.+Usa+demomascotas.com+y+123456');
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 SERVICIO MASCOTAS L&C - TIENDA ONLINE');
    console.log('='.repeat(60));
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📁 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`👥 Usuario demo: demo@mascotas.com / 123456`);
    console.log('='.repeat(60));
    console.log('📝 RUTAS DISPONIBLES:');
    console.log('   GET  /              - Login');
    console.log('   POST /login         - Iniciar sesión');
    console.log('   GET  /register      - Registro');
    console.log('   POST /register      - Crear cuenta');
    console.log('   GET  /products      - Catálogo (10 productos)');
    console.log('   POST /agregar-carrito - Agregar producto');
    console.log('   GET  /carrito       - Ver carrito');
    console.log('   GET  /payment       - Pago');
    console.log('   GET  /logout        - Cerrar sesión');
    console.log('   GET  /debug         - Ver datos (desarrollo)');
    console.log('   GET  /reset         - Restablecer datos');
    console.log('='.repeat(60));
});