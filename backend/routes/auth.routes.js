// Rutas de autenticacion: registro e inicio de sesion
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// POST /api/auth/register - Registrar un nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { nombre, correo, contrasena, carrera } = req.body;

    if (!nombre || !correo || !contrasena || !carrera) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Verificar si el correo ya esta registrado
    const [existing] = await pool.query('SELECT id_usuario FROM usuario WHERE correo = ?', [correo]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'El correo ya esta registrado' });
    }

    // Encriptar la contrasena
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    // Insertar el nuevo usuario
    const [result] = await pool.query(
      'INSERT INTO usuario (nombre, correo, contrasena, carrera) VALUES (?, ?, ?, ?)',
      [nombre, correo, hashedPassword, carrera]
    );

    const userId = result.insertId;

    // Crear registro de progreso inicial con 0%
    await pool.query(
      'INSERT INTO progreso (id_usuario, porcentaje_av) VALUES (?, 0)',
      [userId]
    );

    // Generar token JWT
    const token = jwt.sign(
      { id_usuario: userId, nombre, correo },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: { id_usuario: userId, nombre, correo, carrera }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor al registrar usuario' });
  }
});

// POST /api/auth/login - Iniciar sesion
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ message: 'Correo y contrasena son obligatorios' });
    }

    // Buscar el usuario por correo
    const [rows] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const user = rows[0];

    // Verificar la contrasena
    const validPassword = await bcrypt.compare(contrasena, user.contrasena);

    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id_usuario: user.id_usuario, nombre: user.nombre, correo: user.correo },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Inicio de sesion exitoso',
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor al iniciar sesion' });
  }
});

module.exports = router;
