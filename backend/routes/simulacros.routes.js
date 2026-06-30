// Rutas CRUD para simulacros del usuario
const router = require('express').Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(verifyToken);

// GET /api/simulacros - Obtener todos los simulacros del usuario ordenados por fecha descendente
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM simulacro WHERE id_usuario = ? ORDER BY fecha DESC',
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener simulacros:', error);
    res.status(500).json({ message: 'Error al obtener los simulacros' });
  }
});

// POST /api/simulacros - Crear un nuevo simulacro
router.post('/', async (req, res) => {
  try {
    const { fecha, puntaje, tiempo, correccion, archivo } = req.body;

    if (!fecha || puntaje === undefined) {
      return res.status(400).json({ message: 'La fecha y el puntaje son obligatorios' });
    }

    const [result] = await pool.query(
      'INSERT INTO simulacro (id_usuario, fecha, puntaje, tiempo, correccion, archivo) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id_usuario, fecha, puntaje, tiempo || null, correccion || null, archivo || null]
    );

    res.status(201).json({
      message: 'Simulacro registrado exitosamente',
      id_simulacro: result.insertId
    });
  } catch (error) {
    console.error('Error al crear simulacro:', error);
    res.status(500).json({ message: 'Error al registrar el simulacro' });
  }
});

// PUT /api/simulacros/:id - Actualizar un simulacro (verificando propiedad)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, puntaje, tiempo, correccion, archivo } = req.body;

    // Verificar que el simulacro pertenece al usuario
    const [simulacro] = await pool.query(
      'SELECT * FROM simulacro WHERE id_simulacro = ? AND id_usuario = ?',
      [id, req.user.id_usuario]
    );

    if (simulacro.length === 0) {
      return res.status(404).json({ message: 'Simulacro no encontrado' });
    }

    await pool.query(
      `UPDATE simulacro SET fecha = ?, puntaje = ?, tiempo = ?, correccion = ?, archivo = ?
       WHERE id_simulacro = ?`,
      [
        fecha || simulacro[0].fecha,
        puntaje !== undefined ? puntaje : simulacro[0].puntaje,
        tiempo !== undefined ? tiempo : simulacro[0].tiempo,
        correccion !== undefined ? correccion : simulacro[0].correccion,
        archivo !== undefined ? archivo : simulacro[0].archivo,
        id
      ]
    );

    res.json({ message: 'Simulacro actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar simulacro:', error);
    res.status(500).json({ message: 'Error al actualizar el simulacro' });
  }
});

// DELETE /api/simulacros/:id - Eliminar un simulacro (verificando propiedad)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el simulacro pertenece al usuario
    const [simulacro] = await pool.query(
      'SELECT * FROM simulacro WHERE id_simulacro = ? AND id_usuario = ?',
      [id, req.user.id_usuario]
    );

    if (simulacro.length === 0) {
      return res.status(404).json({ message: 'Simulacro no encontrado' });
    }

    await pool.query('DELETE FROM simulacro WHERE id_simulacro = ?', [id]);

    res.json({ message: 'Simulacro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar simulacro:', error);
    res.status(500).json({ message: 'Error al eliminar el simulacro' });
  }
});

module.exports = router;
