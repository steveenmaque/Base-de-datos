// Rutas para sesiones de estudio del usuario
const router = require('express').Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(verifyToken);

// GET /api/sesiones - Obtener todas las sesiones del usuario con nombres de tema y curso
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT se.*, t.nombre AS tema_nombre, c.nombre AS curso_nombre
       FROM sesion se
       JOIN tema t ON t.id_tema = se.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE se.id_usuario = ?
       ORDER BY se.id_sesion DESC`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    res.status(500).json({ message: 'Error al obtener las sesiones de estudio' });
  }
});

// POST /api/sesiones - Crear una nueva sesion de estudio
router.post('/', async (req, res) => {
  try {
    const { id_tema, tiempo_hora, tiempo_minuto, tiempo_segundo, nivel_comprension } = req.body;

    if (!id_tema || nivel_comprension === undefined) {
      return res.status(400).json({ message: 'El tema y el nivel de comprension son obligatorios' });
    }

    const [result] = await pool.query(
      `INSERT INTO sesion (id_usuario, id_tema, tiempo_hora, tiempo_minuto, tiempo_segundo, nivel_comprension)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id_usuario,
        id_tema,
        tiempo_hora || 0,
        tiempo_minuto || 0,
        tiempo_segundo || 0,
        nivel_comprension
      ]
    );

    res.status(201).json({
      message: 'Sesion de estudio registrada exitosamente',
      id_sesion: result.insertId
    });
  } catch (error) {
    console.error('Error al crear sesion:', error);
    res.status(500).json({ message: 'Error al registrar la sesion de estudio' });
  }
});

// DELETE /api/sesiones/:id - Eliminar una sesion (verificando propiedad)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la sesion pertenece al usuario
    const [sesion] = await pool.query(
      'SELECT * FROM sesion WHERE id_sesion = ? AND id_usuario = ?',
      [id, req.user.id_usuario]
    );

    if (sesion.length === 0) {
      return res.status(404).json({ message: 'Sesion no encontrada' });
    }

    await pool.query('DELETE FROM sesion WHERE id_sesion = ?', [id]);

    res.json({ message: 'Sesion eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar sesion:', error);
    res.status(500).json({ message: 'Error al eliminar la sesion' });
  }
});

module.exports = router;
