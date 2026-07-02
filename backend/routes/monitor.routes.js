// Ruta de monitoreo en vivo: devuelve el estado actual de todas las tablas
// del usuario autenticado. Sirve para la demostracion en vivo de como cambia
// la base de datos cada vez que se agrega o elimina informacion.
const router = require('express').Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Requiere autenticacion: solo se muestran los datos del usuario logueado
router.use(verifyToken);

// GET /api/monitor - Estado completo de la base de datos para el usuario actual
router.get('/', async (req, res) => {
  const uid = req.user.id_usuario;
  try {
    // Cada tabla se consulta filtrando por el usuario del token.
    // tema, documento y flashcard no tienen id_usuario, por eso se unen
    // con curso para llegar hasta el dueno.
    const [usuario] = await pool.query(
      'SELECT id_usuario, nombre, correo, carrera FROM usuario WHERE id_usuario = ?', [uid]);
    const [progreso] = await pool.query(
      'SELECT * FROM progreso WHERE id_usuario = ?', [uid]);
    const [curso] = await pool.query(
      'SELECT * FROM curso WHERE id_usuario = ? ORDER BY id_curso', [uid]);
    const [tema] = await pool.query(
      `SELECT t.* FROM tema t
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE c.id_usuario = ? ORDER BY t.id_tema`, [uid]);
    const [simulacro] = await pool.query(
      'SELECT * FROM simulacro WHERE id_usuario = ? ORDER BY id_simulacro', [uid]);
    const [horario] = await pool.query(
      'SELECT * FROM horario WHERE id_usuario = ? ORDER BY id_horario', [uid]);
    const [meta] = await pool.query(
      'SELECT * FROM meta WHERE id_usuario = ? ORDER BY id_meta', [uid]);
    const [sesion] = await pool.query(
      'SELECT * FROM sesion WHERE id_usuario = ? ORDER BY id_sesion', [uid]);
    const [documento] = await pool.query(
      `SELECT d.* FROM documento d
       JOIN tema t ON t.id_tema = d.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE c.id_usuario = ? ORDER BY d.id_documento`, [uid]);
    const [flashcard] = await pool.query(
      `SELECT f.* FROM flashcard f
       JOIN tema t ON t.id_tema = f.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE c.id_usuario = ? ORDER BY f.id_flashcard`, [uid]);

    res.json({
      timestamp: new Date().toISOString(),
      usuario: usuario[0] || null,
      progreso: progreso[0] || null,
      tablas: { curso, tema, simulacro, horario, meta, sesion, documento, flashcard }
    });
  } catch (error) {
    console.error('Error en monitor:', error);
    res.status(500).json({ message: 'Error al obtener el estado de la base de datos' });
  }
});

module.exports = router;
