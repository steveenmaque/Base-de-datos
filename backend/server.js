// Punto de entrada principal del servidor PrepaTrack
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Servir archivos estaticos del frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Montaje de rutas de la API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/cursos', require('./routes/cursos.routes'));
app.use('/api/temas', require('./routes/temas.routes'));
app.use('/api/simulacros', require('./routes/simulacros.routes'));
app.use('/api/horarios', require('./routes/horarios.routes'));
app.use('/api/metas', require('./routes/metas.routes'));
app.use('/api/sesiones', require('./routes/sesiones.routes'));
app.use('/api/documentos', require('./routes/documentos.routes'));
app.use('/api/flashcards', require('./routes/flashcards.routes'));
app.use('/api/progreso', require('./routes/progreso.routes'));
app.use('/api/reportes', require('./routes/reportes.routes'));
app.use('/api/monitor', require('./routes/monitor.routes'));

// Endpoint de verificacion de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor PrepaTrack funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta catch-all para enrutamiento SPA - sirve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor PrepaTrack corriendo en el puerto ${PORT}`);
});
