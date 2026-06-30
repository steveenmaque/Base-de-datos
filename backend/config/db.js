// Configuracion de la conexion a la base de datos MySQL
const mysql = require('mysql2/promise');

// Se crea un pool de conexiones para manejar multiples solicitudes
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar la conexion al iniciar
pool.getConnection()
  .then(connection => {
    console.log('Conexion a la base de datos establecida correctamente');
    connection.release();
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err.message);
  });

module.exports = pool;
