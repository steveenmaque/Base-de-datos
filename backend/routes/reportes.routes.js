// Rutas de reportes y consultas analiticas - Implementacion de las 17 consultas del documento
const router = require('express').Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Todas las rutas requieren autenticacion
router.use(verifyToken);

// 10.1 - GET /api/reportes/avance-por-curso
// Porcentaje de avance por curso basado en temas dominados
router.get('/avance-por-curso', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.nombre AS curso, COUNT(t.id_tema) AS total_temas,
              SUM(t.estado = 'Dominado') AS temas_dominados,
              ROUND(SUM(t.estado = 'Dominado') * 100 / COUNT(t.id_tema), 2) AS porcentaje_avance
       FROM curso c JOIN tema t ON t.id_curso = c.id_curso
       WHERE c.id_usuario = ? GROUP BY c.id_curso, c.nombre`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte avance por curso:', error);
    res.status(500).json({ message: 'Error al obtener el avance por curso' });
  }
});

// 10.2 - GET /api/reportes/temas-pendientes
// Temas que no estan dominados, ordenados por prioridad de estado
router.get('/temas-pendientes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.nombre AS curso, t.nombre AS tema, t.estado
       FROM tema t JOIN curso c ON c.id_curso = t.id_curso
       WHERE c.id_usuario = ? AND t.estado IN ('No iniciado', 'En proceso', 'Reforzar')
       ORDER BY c.nombre, FIELD(t.estado, 'Reforzar', 'En proceso', 'No iniciado')`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte temas pendientes:', error);
    res.status(500).json({ message: 'Error al obtener los temas pendientes' });
  }
});

// 10.3 - GET /api/reportes/conteo-temas
// Conteo de temas agrupados por estado
router.get('/conteo-temas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.estado, COUNT(*) AS cantidad
       FROM tema t JOIN curso c ON c.id_curso = t.id_curso
       WHERE c.id_usuario = ? GROUP BY t.estado ORDER BY cantidad DESC`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte conteo de temas:', error);
    res.status(500).json({ message: 'Error al obtener el conteo de temas' });
  }
});

// 10.4 - GET /api/reportes/cursos-completos
// Cursos donde todos los temas estan en estado 'Dominado'
router.get('/cursos-completos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.nombre AS curso FROM curso c
       JOIN tema t ON t.id_curso = c.id_curso
       WHERE c.id_usuario = ? GROUP BY c.id_curso, c.nombre
       HAVING SUM(t.estado <> 'Dominado') = 0`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte cursos completos:', error);
    res.status(500).json({ message: 'Error al obtener los cursos completos' });
  }
});

// 10.5 - GET /api/reportes/evolucion-simulacros
// Evolucion cronologica de puntajes de simulacros
router.get('/evolucion-simulacros', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT fecha, puntaje, tiempo FROM simulacro
       WHERE id_usuario = ? ORDER BY fecha ASC`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte evolucion de simulacros:', error);
    res.status(500).json({ message: 'Error al obtener la evolucion de simulacros' });
  }
});

// 10.6 - GET /api/reportes/estadisticas-simulacros
// Estadisticas generales: total, promedio, mejor y peor puntaje
router.get('/estadisticas-simulacros', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.nombre, COUNT(s.id_simulacro) AS total_simulacros,
              ROUND(AVG(s.puntaje), 2) AS promedio,
              MAX(s.puntaje) AS mejor_puntaje, MIN(s.puntaje) AS peor_puntaje
       FROM usuario u LEFT JOIN simulacro s ON s.id_usuario = u.id_usuario
       WHERE u.id_usuario = ? GROUP BY u.id_usuario, u.nombre`,
      [req.user.id_usuario]
    );
    res.json(rows[0] || {});
  } catch (error) {
    console.error('Error en reporte estadisticas de simulacros:', error);
    res.status(500).json({ message: 'Error al obtener las estadisticas de simulacros' });
  }
});

// 10.7 - GET /api/reportes/simulacros-recientes
// Simulacros de los ultimos 30 dias
router.get('/simulacros-recientes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT fecha, puntaje FROM simulacro
       WHERE id_usuario = ? AND fecha >= CURDATE() - INTERVAL 30 DAY
       ORDER BY fecha DESC`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte simulacros recientes:', error);
    res.status(500).json({ message: 'Error al obtener los simulacros recientes' });
  }
});

// 10.8 - GET /api/reportes/mejor-simulacro
// El simulacro con el puntaje mas alto del usuario
router.get('/mejor-simulacro', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id_usuario, s.fecha, s.puntaje FROM simulacro s
       WHERE s.id_usuario = ? AND s.puntaje = (
         SELECT MAX(s2.puntaje) FROM simulacro s2 WHERE s2.id_usuario = s.id_usuario)`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte mejor simulacro:', error);
    res.status(500).json({ message: 'Error al obtener el mejor simulacro' });
  }
});

// 10.9 - GET /api/reportes/documentos-por-curso
// Documentos organizados por curso y tema
router.get('/documentos-por-curso', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.nombre AS curso, t.nombre AS tema,
              d.temario, d.separata, d.resumen, d.guia
       FROM documento d JOIN tema t ON t.id_tema = d.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE c.id_usuario = ? ORDER BY c.nombre, t.nombre`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte documentos por curso:', error);
    res.status(500).json({ message: 'Error al obtener los documentos por curso' });
  }
});

// 10.10 - GET /api/reportes/flashcards-por-tema
// Conteo de flashcards por tema
router.get('/flashcards-por-tema', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.id_tema, t.nombre AS tema, COUNT(f.id_flashcard) AS total_flashcards
       FROM tema t LEFT JOIN flashcard f ON f.id_tema = t.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE c.id_usuario = ?
       GROUP BY t.id_tema, t.nombre ORDER BY total_flashcards DESC`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte flashcards por tema:', error);
    res.status(500).json({ message: 'Error al obtener las flashcards por tema' });
  }
});

// 10.12 - GET /api/reportes/tiempo-estudio-curso
// Tiempo total de estudio acumulado por curso
router.get('/tiempo-estudio-curso', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.nombre AS curso,
              SEC_TO_TIME(SUM(se.tiempo_hora * 3600 + se.tiempo_minuto * 60 + se.tiempo_segundo)) AS tiempo_total
       FROM sesion se JOIN tema t ON t.id_tema = se.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE se.id_usuario = ? GROUP BY c.id_curso, c.nombre`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte tiempo de estudio por curso:', error);
    res.status(500).json({ message: 'Error al obtener el tiempo de estudio por curso' });
  }
});

// 10.13 - GET /api/reportes/comprension-por-tema
// Promedio de comprension por tema, ordenado ascendente
router.get('/comprension-por-tema', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.nombre AS tema,
              ROUND(AVG(se.nivel_comprension), 2) AS comprension_promedio
       FROM sesion se JOIN tema t ON t.id_tema = se.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE se.id_usuario = ?
       GROUP BY t.id_tema, t.nombre ORDER BY comprension_promedio ASC`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte comprension por tema:', error);
    res.status(500).json({ message: 'Error al obtener la comprension por tema' });
  }
});

// 10.14 - GET /api/reportes/temas-baja-comprension
// Temas con comprension promedio menor a 3
router.get('/temas-baja-comprension', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.nombre AS tema,
              ROUND(AVG(se.nivel_comprension), 2) AS comprension_promedio
       FROM sesion se JOIN tema t ON t.id_tema = se.id_tema
       JOIN curso c ON c.id_curso = t.id_curso
       WHERE se.id_usuario = ?
       GROUP BY t.id_tema, t.nombre
       HAVING AVG(se.nivel_comprension) < 3
       ORDER BY comprension_promedio ASC`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte temas con baja comprension:', error);
    res.status(500).json({ message: 'Error al obtener los temas con baja comprension' });
  }
});

// 10.15 - GET /api/reportes/cumplimiento-metas
// Conteo de metas agrupadas por estado
router.get('/cumplimiento-metas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.nombre, m.estado, COUNT(*) AS cantidad
       FROM meta m JOIN usuario u ON u.id_usuario = m.id_usuario
       WHERE u.id_usuario = ?
       GROUP BY u.id_usuario, u.nombre, m.estado
       ORDER BY u.nombre, m.estado`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte cumplimiento de metas:', error);
    res.status(500).json({ message: 'Error al obtener el cumplimiento de metas' });
  }
});

// 10.16 - GET /api/reportes/horario-semanal
// Horario semanal del usuario ordenado por dia de la semana y hora
router.get('/horario-semanal', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT dia, hora FROM horario WHERE id_usuario = ?
       ORDER BY FIELD(dia, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'), hora`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte horario semanal:', error);
    res.status(500).json({ message: 'Error al obtener el horario semanal' });
  }
});

// 10.17 - GET /api/reportes/progreso-global
// Progreso global de todos los usuarios (ranking)
router.get('/progreso-global', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.nombre, p.porcentaje_av AS porcentaje_avance
       FROM usuario u JOIN progreso p ON p.id_usuario = u.id_usuario
       ORDER BY p.porcentaje_av DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte progreso global:', error);
    res.status(500).json({ message: 'Error al obtener el progreso global' });
  }
});

// Consulta adicional - GET /api/reportes/rendimiento
// Usa la vista vista_rendimiento para obtener datos consolidados del usuario
router.get('/rendimiento', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM vista_rendimiento WHERE id_usuario = ?',
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en reporte de rendimiento:', error);
    res.status(500).json({ message: 'Error al obtener el reporte de rendimiento' });
  }
});

module.exports = router;
