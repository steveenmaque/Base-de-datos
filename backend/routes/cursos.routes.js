// Rutas CRUD para cursos del usuario autenticado
const router = require('express').Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(verifyToken);

// GET /api/cursos - Obtener todos los cursos del usuario
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM curso WHERE id_usuario = ?',
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    res.status(500).json({ message: 'Error al obtener los cursos' });
  }
});

// POST /api/cursos - Crear un nuevo curso
router.post('/', async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del curso es obligatorio' });
    }

    const [result] = await pool.query(
      'INSERT INTO curso (id_usuario, nombre) VALUES (?, ?)',
      [req.user.id_usuario, nombre]
    );

    res.status(201).json({
      message: 'Curso creado exitosamente',
      id_curso: result.insertId,
      nombre
    });
  } catch (error) {
    console.error('Error al crear curso:', error);
    res.status(500).json({ message: 'Error al crear el curso' });
  }
});

// PUT /api/cursos/:id - Actualizar un curso (verificando propiedad)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    // Verificar que el curso pertenece al usuario
    const [curso] = await pool.query(
      'SELECT * FROM curso WHERE id_curso = ? AND id_usuario = ?',
      [id, req.user.id_usuario]
    );

    if (curso.length === 0) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    await pool.query(
      'UPDATE curso SET nombre = ? WHERE id_curso = ?',
      [nombre, id]
    );

    res.json({ message: 'Curso actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    res.status(500).json({ message: 'Error al actualizar el curso' });
  }
});

// DELETE /api/cursos/:id - Eliminar un curso (verificando propiedad)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el curso pertenece al usuario
    const [curso] = await pool.query(
      'SELECT * FROM curso WHERE id_curso = ? AND id_usuario = ?',
      [id, req.user.id_usuario]
    );

    if (curso.length === 0) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    await pool.query('DELETE FROM curso WHERE id_curso = ?', [id]);

    res.json({ message: 'Curso eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    res.status(500).json({ message: 'Error al eliminar el curso' });
  }
});

module.exports = router;
