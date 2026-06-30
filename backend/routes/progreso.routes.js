// Ruta para consultar el progreso del usuario
const router = require('express').Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(verifyToken);

// GET /api/progreso - Obtener el progreso del usuario autenticado
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM progreso WHERE id_usuario = ?',
      [req.user.id_usuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Registro de progreso no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener progreso:', error);
    res.status(500).json({ message: 'Error al obtener el progreso' });
  }
});

module.exports = router;
