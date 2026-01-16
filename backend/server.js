// BACKEND - server.js
// Solo lógica del servidor, rutas y base de datos

const express = require('express');
const path = require('path');
const app = express();

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend'))); // Servir archivos estáticos del frontend

// RUTAS PARA LAS PÁGINAS HTML

// Ruta raíz - Página principal
app.get('/', (req, res) => {
    res.redirect('/invitacion');
});

// Página principal
app.get('/invitacion', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Nuestra Historia
app.get('/nuestraHistoria', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/romanticismo.html'));
});

// Confirmar Asistencia
app.get('/fotos', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/asistencia.html'));
});

// Ubicación / Mapa
app.get('/ubicacion', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/ubicacion.html'));
});

// Regalos
app.get('/regalos', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/regalos.html'));
});

// // API - RUTAS PARA DATOS

// // Ruta para registrar asistencia (POST)
// app.post('/api/asistencia', async (req, res) => {
//     try {
//         const { nombre, email, asistencia, mensaje } = req.body;

//         // Validaciones
//         if (!nombre || !email || !asistencia) {
//             return res.status(400).json({
//                 message: 'Faltan campos requeridos'
//             });
//         }

//         // Guardar en base de datos MySQL
//         try {
//             const sql = 'INSERT INTO asistencia (nombre, email, asistencia, mensaje) VALUES (?, ?, ?, ?)';
//             const [result] = await pool.execute(sql, [nombre, email, asistencia, mensaje || null]);
//             console.log('Asistencia registrada en BD:', { id: result.insertId, nombre, email, asistencia });
//         } catch (dbErr) {
//             console.error('Error guardando en BD:', dbErr);
//             return res.status(500).json({ message: 'Error guardando en base de datos' });
//         }

//         // Responder al cliente
//         res.status(200).json({
//             message: 'Asistencia registrada correctamente',
//             data: { nombre, email, asistencia }
//         });

//     } catch (error) {
//         console.error('Error en /api/asistencia:', error);
//         res.status(500).json({
//             message: 'Error interno del servidor'
//         });
//     }
// });

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});