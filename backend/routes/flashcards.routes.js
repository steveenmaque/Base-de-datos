// Rutas CRUD para flashcards asociadas a temas
const router = require('express').Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(verifyToken);

// GET /api/flashcards/tema/:id_tema - Obtener flashcards de un tema
router.get('/tema/:id_tema', async (req, res) => {
  try {
    const { id_tema } = req.params;

    // Verificar que el tema pertenece a un curso del usuario
    const [tema] = await pool.query(
      `SELECT t.* FROM tema t
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE t.id_tema = ? AND c.id_usuario = ?`,
      [id_tema, req.user.id_usuario]
    );

    if (tema.length === 0) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM flashcard WHERE id_tema = ?',
      [id_tema]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener flashcards:', error);
    res.status(500).json({ message: 'Error al obtener las flashcards' });
  }
});

// POST /api/flashcards - Crear una nueva flashcard
router.post('/', async (req, res) => {
  try {
    const { id_tema, pregunta, respuesta } = req.body;

    if (!id_tema || !pregunta || !respuesta) {
      return res.status(400).json({ message: 'El tema, la pregunta y la respuesta son obligatorios' });
    }

    // Verificar que el tema pertenece a un curso del usuario
    const [tema] = await pool.query(
      `SELECT t.* FROM tema t
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE t.id_tema = ? AND c.id_usuario = ?`,
      [id_tema, req.user.id_usuario]
    );

    if (tema.length === 0) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    const [result] = await pool.query(
      'INSERT INTO flashcard (id_tema, pregunta, respuesta) VALUES (?, ?, ?)',
      [id_tema, pregunta, respuesta]
    );

    res.status(201).json({
      message: 'Flashcard creada exitosamente',
      id_flashcard: result.insertId
    });
  } catch (error) {
    console.error('Error al crear flashcard:', error);
    res.status(500).json({ message: 'Error al crear la flashcard' });
  }
});

// PUT /api/flashcards/:id - Actualizar una flashcard
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pregunta, respuesta } = req.body;

    // Verificar que la flashcard pertenece a un tema del usuario
    const [fc] = await pool.query(
      `SELECT f.* FROM flashcard f
       JOIN tema t ON t.id_tema = f.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE f.id_flashcard = ? AND c.id_usuario = ?`,
      [id, req.user.id_usuario]
    );

    if (fc.length === 0) {
      return res.status(404).json({ message: 'Flashcard no encontrada' });
    }

    await pool.query(
      'UPDATE flashcard SET pregunta = ?, respuesta = ? WHERE id_flashcard = ?',
      [pregunta || fc[0].pregunta, respuesta || fc[0].respuesta, id]
    );

    res.json({ message: 'Flashcard actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar flashcard:', error);
    res.status(500).json({ message: 'Error al actualizar la flashcard' });
  }
});

// DELETE /api/flashcards/:id - Eliminar una flashcard
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la flashcard pertenece a un tema del usuario
    const [fc] = await pool.query(
      `SELECT f.* FROM flashcard f
       JOIN tema t ON t.id_tema = f.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE f.id_flashcard = ? AND c.id_usuario = ?`,
      [id, req.user.id_usuario]
    );

    if (fc.length === 0) {
      return res.status(404).json({ message: 'Flashcard no encontrada' });
    }

    await pool.query('DELETE FROM flashcard WHERE id_flashcard = ?', [id]);

    res.json({ message: 'Flashcard eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar flashcard:', error);
    res.status(500).json({ message: 'Error al eliminar la flashcard' });
  }
});

module.exports = router;
