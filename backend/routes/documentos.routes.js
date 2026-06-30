// Rutas CRUD para documentos asociados a temas
const router = require('express').Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(verifyToken);

// GET /api/documentos/tema/:id_tema - Obtener documentos de un tema
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
      'SELECT * FROM documento WHERE id_tema = ?',
      [id_tema]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ message: 'Error al obtener los documentos' });
  }
});

// POST /api/documentos - Crear un nuevo documento
router.post('/', async (req, res) => {
  try {
    const { id_tema, temario, separata, resumen, guia } = req.body;

    if (!id_tema) {
      return res.status(400).json({ message: 'El tema es obligatorio' });
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
      'INSERT INTO documento (id_tema, temario, separata, resumen, guia) VALUES (?, ?, ?, ?, ?)',
      [id_tema, temario || null, separata || null, resumen || null, guia || null]
    );

    res.status(201).json({
      message: 'Documento creado exitosamente',
      id_documento: result.insertId
    });
  } catch (error) {
    console.error('Error al crear documento:', error);
    res.status(500).json({ message: 'Error al crear el documento' });
  }
});

// PUT /api/documentos/:id - Actualizar un documento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { temario, separata, resumen, guia } = req.body;

    // Verificar que el documento pertenece a un tema del usuario
    const [doc] = await pool.query(
      `SELECT d.* FROM documento d
       JOIN tema t ON t.id_tema = d.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE d.id_documento = ? AND c.id_usuario = ?`,
      [id, req.user.id_usuario]
    );

    if (doc.length === 0) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    await pool.query(
      'UPDATE documento SET temario = ?, separata = ?, resumen = ?, guia = ? WHERE id_documento = ?',
      [
        temario !== undefined ? temario : doc[0].temario,
        separata !== undefined ? separata : doc[0].separata,
        resumen !== undefined ? resumen : doc[0].resumen,
        guia !== undefined ? guia : doc[0].guia,
        id
      ]
    );

    res.json({ message: 'Documento actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    res.status(500).json({ message: 'Error al actualizar el documento' });
  }
});

// DELETE /api/documentos/:id - Eliminar un documento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el documento pertenece a un tema del usuario
    const [doc] = await pool.query(
      `SELECT d.* FROM documento d
       JOIN tema t ON t.id_tema = d.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE d.id_documento = ? AND c.id_usuario = ?`,
      [id, req.user.id_usuario]
    );

    if (doc.length === 0) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    await pool.query('DELETE FROM documento WHERE id_documento = ?', [id]);

    res.json({ message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ message: 'Error al eliminar el documento' });
  }
});

module.exports = router;
