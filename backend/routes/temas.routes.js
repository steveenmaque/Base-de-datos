// Rutas CRUD para temas asociados a cursos del usuario
const router = require('express').Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(verifyToken);

// GET /api/temas/curso/:id_curso - Obtener todos los temas de un curso (verificando propiedad)
router.get('/curso/:id_curso', async (req, res) => {
  try {
    const { id_curso } = req.params;

    // Verificar que el curso pertenece al usuario
    const [curso] = await pool.query(
      'SELECT * FROM curso WHERE id_curso = ? AND id_usuario = ?',
      [id_curso, req.user.id_usuario]
    );

    if (curso.length === 0) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM tema WHERE id_curso = ?',
      [id_curso]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener temas:', error);
    res.status(500).json({ message: 'Error al obtener los temas' });
  }
});

// POST /api/temas - Crear un nuevo tema
router.post('/', async (req, res) => {
  try {
    const { id_curso, nombre, estado } = req.body;

    if (!id_curso || !nombre) {
      return res.status(400).json({ message: 'El curso y el nombre del tema son obligatorios' });
    }

    // Verificar que el curso pertenece al usuario
    const [curso] = await pool.query(
      'SELECT * FROM curso WHERE id_curso = ? AND id_usuario = ?',
      [id_curso, req.user.id_usuario]
    );

    if (curso.length === 0) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const [result] = await pool.query(
      'INSERT INTO tema (id_curso, nombre, estado) VALUES (?, ?, ?)',
      [id_curso, nombre, estado || 'No iniciado']
    );

    res.status(201).json({
      message: 'Tema creado exitosamente',
      id_tema: result.insertId,
      nombre,
      estado: estado || 'No iniciado'
    });
  } catch (error) {
    console.error('Error al crear tema:', error);
    res.status(500).json({ message: 'Error al crear el tema' });
  }
});

// PUT /api/temas/:id - Actualizar un tema (estado y/o nombre)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, estado } = req.body;

    // Verificar que el tema pertenece a un curso del usuario
    const [tema] = await pool.query(
      `SELECT t.* FROM tema t
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE t.id_tema = ? AND c.id_usuario = ?`,
      [id, req.user.id_usuario]
    );

    if (tema.length === 0) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    const updatedName = nombre || tema[0].nombre;
    const updatedState = estado || tema[0].estado;

    await pool.query(
      'UPDATE tema SET nombre = ?, estado = ? WHERE id_tema = ?',
      [updatedName, updatedState, id]
    );

    res.json({ message: 'Tema actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar tema:', error);
    res.status(500).json({ message: 'Error al actualizar el tema' });
  }
});

// DELETE /api/temas/:id - Eliminar un tema
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el tema pertenece a un curso del usuario
    const [tema] = await pool.query(
      `SELECT t.* FROM tema t
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE t.id_tema = ? AND c.id_usuario = ?`,
      [id, req.user.id_usuario]
    );

    if (tema.length === 0) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    await pool.query('DELETE FROM tema WHERE id_tema = ?', [id]);

    res.json({ message: 'Tema eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar tema:', error);
    res.status(500).json({ message: 'Error al eliminar el tema' });
  }
});

module.exports = router;
