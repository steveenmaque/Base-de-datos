// Rutas CRUD para horarios del usuario
const router = require('express').Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(verifyToken);

// GET /api/horarios - Obtener todos los horarios del usuario ordenados por dia y hora
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM horario WHERE id_usuario = ?
       ORDER BY FIELD(dia, 'Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'), hora`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ message: 'Error al obtener los horarios' });
  }
});

// POST /api/horarios - Crear un nuevo horario
router.post('/', async (req, res) => {
  try {
    const { dia, hora } = req.body;

    if (!dia || !hora) {
      return res.status(400).json({ message: 'El dia y la hora son obligatorios' });
    }

    const [result] = await pool.query(
      'INSERT INTO horario (id_usuario, dia, hora) VALUES (?, ?, ?)',
      [req.user.id_usuario, dia, hora]
    );

    res.status(201).json({
      message: 'Horario creado exitosamente',
      id_horario: result.insertId
    });
  } catch (error) {
    console.error('Error al crear horario:', error);
    res.status(500).json({ message: 'Error al crear el horario' });
  }
});

// PUT /api/horarios/:id - Actualizar un horario (verificando propiedad)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dia, hora } = req.body;

    // Verificar que el horario pertenece al usuario
    const [horario] = await pool.query(
      'SELECT * FROM horario WHERE id_horario = ? AND id_usuario = ?',
      [id, req.user.id_usuario]
    );

    if (horario.length === 0) {
      return res.status(404).json({ message: 'Horario no encontrado' });
    }

    await pool.query(
      'UPDATE horario SET dia = ?, hora = ? WHERE id_horario = ?',
      [dia || horario[0].dia, hora || horario[0].hora, id]
    );

    res.json({ message: 'Horario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    res.status(500).json({ message: 'Error al actualizar el horario' });
  }
});

// DELETE /api/horarios/:id - Eliminar un horario (verificando propiedad)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el horario pertenece al usuario
    const [horario] = await pool.query(
      'SELECT * FROM horario WHERE id_horario = ? AND id_usuario = ?',
      [id, req.user.id_usuario]
    );

    if (horario.length === 0) {
      return res.status(404).json({ message: 'Horario no encontrado' });
    }

    await pool.query('DELETE FROM horario WHERE id_horario = ?', [id]);

    res.json({ message: 'Horario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).json({ message: 'Error al eliminar el horario' });
  }
});

module.exports = router;
