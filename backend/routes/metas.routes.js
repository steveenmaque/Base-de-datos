// Rutas CRUD para metas del usuario
const router = require('express').Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(verifyToken);

// GET /api/metas - Obtener todas las metas del usuario
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM meta WHERE id_usuario = ?',
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener metas:', error);
    res.status(500).json({ message: 'Error al obtener las metas' });
  }
});

// POST /api/metas - Crear una nueva meta
router.post('/', async (req, res) => {
  try {
    const { objetivo, estado } = req.body;

    if (!objetivo) {
      return res.status(400).json({ message: 'El objetivo de la meta es obligatorio' });
    }

    const [result] = await pool.query(
      'INSERT INTO meta (id_usuario, objetivo, estado) VALUES (?, ?, ?)',
      [req.user.id_usuario, objetivo, estado || 'Pendiente']
    );

    res.status(201).json({
      message: 'Meta creada exitosamente',
      id_meta: result.insertId
    });
  } catch (error) {
    console.error('Error al crear meta:', error);
    res.status(500).json({ message: 'Error al crear la meta' });
  }
});

// PUT /api/metas/:id - Actualizar una meta (estado y/o objetivo)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { objetivo, estado } = req.body;

    // Verificar que la meta pertenece al usuario
    const [meta] = await pool.query(
      'SELECT * FROM meta WHERE id_meta = ? AND id_usuario = ?',
      [id, req.user.id_usuario]
    );

    if (meta.length === 0) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    await pool.query(
      'UPDATE meta SET objetivo = ?, estado = ? WHERE id_meta = ?',
      [objetivo || meta[0].objetivo, estado || meta[0].estado, id]
    );

    res.json({ message: 'Meta actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar meta:', error);
    res.status(500).json({ message: 'Error al actualizar la meta' });
  }
});

// DELETE /api/metas/:id - Eliminar una meta (verificando propiedad)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la meta pertenece al usuario
    const [meta] = await pool.query(
      'SELECT * FROM meta WHERE id_meta = ? AND id_usuario = ?',
      [id, req.user.id_usuario]
    );

    if (meta.length === 0) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    await pool.query('DELETE FROM meta WHERE id_meta = ?', [id]);

    res.json({ message: 'Meta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar meta:', error);
    res.status(500).json({ message: 'Error al eliminar la meta' });
  }
});

module.exports = router;
