# PrepaTrack — Mapa de la Base de Datos al Backend y Frontend

Este documento recorre **cada bloque de código de la base de datos** (tablas, la vista
y el trigger) y muestra **cómo se conecta** con el backend (Node.js + Express + MySQL)
y con el frontend (HTML + JavaScript modular).

> La idea es leer cada sección de arriba hacia abajo: primero el SQL, luego la ruta del
> servidor que ejecuta ese SQL, y por último el módulo del navegador que llama a esa ruta.

---

## 1. Arquitectura general (cómo viaja un dato)

```
┌──────────────┐   fetch('/api/...')    ┌──────────────────┐   pool.query(SQL)   ┌──────────────┐
│   FRONTEND   │ ─────────────────────► │      BACKEND     │ ──────────────────► │   MySQL DB   │
│ (navegador)  │   JSON + JWT en header │  Express routes  │   consultas con ?   │  prepatrack  │
│  js/*.js     │ ◄───────────────────── │  routes/*.js     │ ◄────────────────── │  schema.sql  │
└──────────────┘     respuesta JSON     └──────────────────┘     filas (rows)    └──────────────┘
```

Las tres capas y sus archivos:

| Capa         | Tecnología                       | Archivos clave                                   |
|--------------|----------------------------------|--------------------------------------------------|
| Base de datos| MySQL 8 (InnoDB, utf8mb4)        | `database/schema.sql`, `database/seed.sql`       |
| Backend      | Node.js, Express, mysql2, JWT    | `backend/server.js`, `backend/config/db.js`, `backend/routes/*.js` |
| Frontend     | HTML + CSS + JS (patrón módulo)  | `frontend/index.html`, `frontend/js/*.js`        |

### 1.1 La conexión física a la base de datos

El backend abre **un único pool de conexiones** que todas las rutas reutilizan:

```js
// backend/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,   // -> prepatrack
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

Cada archivo de rutas hace `const pool = require('../config/db')` y ejecuta sus
consultas con `pool.query('SQL con ?', [valores])`. El uso de `?` (consultas
parametrizadas) evita inyección SQL.

### 1.2 El servidor monta cada tabla como un grupo de rutas

```js
// backend/server.js
app.use('/api/auth',       require('./routes/auth.routes'));        // tabla usuario + progreso
app.use('/api/cursos',     require('./routes/cursos.routes'));      // tabla curso
app.use('/api/temas',      require('./routes/temas.routes'));       // tabla tema
app.use('/api/simulacros', require('./routes/simulacros.routes'));  // tabla simulacro
app.use('/api/horarios',   require('./routes/horarios.routes'));    // tabla horario
app.use('/api/metas',      require('./routes/metas.routes'));       // tabla meta
app.use('/api/sesiones',   require('./routes/sesiones.routes'));    // tabla sesion
app.use('/api/documentos', require('./routes/documentos.routes'));  // tabla documento
app.use('/api/flashcards', require('./routes/flashcards.routes'));  // tabla flashcard
app.use('/api/progreso',   require('./routes/progreso.routes'));    // tabla progreso
app.use('/api/reportes',   require('./routes/reportes.routes'));    // vista + consultas
app.use(express.static(path.join(__dirname, '..', 'frontend')));    // sirve el frontend
```

### 1.3 El cliente HTTP del frontend

Todos los módulos del navegador hablan con el backend a través de un único helper.
Él adjunta automáticamente el token JWT en cada petición:

```js
// frontend/js/api.js
async function request(method, path, body) {
    var headers = { 'Content-Type': 'application/json' };
    var token = getToken();                          // localStorage 'prepatrack_token'
    if (token) headers['Authorization'] = 'Bearer ' + token;   // <-- autenticación

    var response = await fetch('/api' + path, { method, headers, body: JSON.stringify(body) });
    var data = await response.json();
    if (!response.ok) {
        if (response.status === 401) { removeToken(); window.location.reload(); }
        throw new Error(data.message);
    }
    return data;
}
// Expone: Api.get, Api.post, Api.put, Api.del
```

### 1.4 El candado de seguridad (JWT)

Casi todas las rutas (excepto registro y login) pasan por este middleware, que lee el
token del header `Authorization` y deja el id del usuario disponible en `req.user`:

```js
// backend/middleware/auth.js
const verifyToken = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Acceso no autorizado' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);  // { id_usuario, nombre, correo }
    next();
  } catch {
    return res.status(401).json({ message: 'Acceso no autorizado' });
  }
};
```

> **Patrón clave:** en cada ruta protegida se usa `req.user.id_usuario` dentro del `WHERE`
> de la consulta SQL. Así un usuario **solo ve y modifica sus propios datos**.

---

## 2. Tabla `usuario` (+ `progreso`) → Autenticación

### Base de datos
```sql
-- database/schema.sql
CREATE TABLE usuario (
    id_usuario  INT          AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(255) NOT NULL,
    correo      VARCHAR(255) NOT NULL UNIQUE,   -- no se puede repetir
    contrasena  VARCHAR(255) NOT NULL,          -- guarda el HASH, no el texto
    carrera     VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE progreso (
    id_progreso    INT          AUTO_INCREMENT PRIMARY KEY,
    id_usuario     INT          NOT NULL,
    porcentaje_av  DECIMAL(5,2) NOT NULL DEFAULT 0,
    CONSTRAINT uq_progreso_usuario UNIQUE (id_usuario),
    CONSTRAINT fk_progreso_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_porcentaje CHECK (porcentaje_av BETWEEN 0 AND 100)
) ENGINE=InnoDB;
```

### Backend — `routes/auth.routes.js`
El registro inserta en `usuario`, **cifra la contraseña** y de inmediato crea la fila de
`progreso` asociada:

```js
// POST /api/auth/register
const hashedPassword = await bcrypt.hash(contrasena, await bcrypt.genSalt(10));

const [result] = await pool.query(
  'INSERT INTO usuario (nombre, correo, contrasena, carrera) VALUES (?, ?, ?, ?)',
  [nombre, correo, hashedPassword, carrera]
);
const userId = result.insertId;

await pool.query('INSERT INTO progreso (id_usuario, porcentaje_av) VALUES (?, 0)', [userId]);

const token = jwt.sign({ id_usuario: userId, nombre, correo }, process.env.JWT_SECRET, { expiresIn: '24h' });
res.status(201).json({ token, user: { id_usuario: userId, nombre, correo, carrera } });
```

El login busca por `correo` y compara el hash:

```js
// POST /api/auth/login
const [rows] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
const validPassword = await bcrypt.compare(contrasena, rows[0].contrasena);
// si es válido -> devuelve un nuevo token JWT
```

### Frontend — `js/auth.js`
```js
// Login
var data = await Api.post('/auth/login', { correo, contrasena });
Api.setToken(data.token);   // se guarda en localStorage
Api.setUser(data.user);
App.showApp();              // entra al panel principal
```

**Flujo completo:** formulario en `index.html` → `AuthModule.login()` → `Api.post('/auth/login')`
→ `auth.routes.js` consulta tabla `usuario` → devuelve JWT → el token viaja en cada petición
posterior gracias a `api.js`.

---

## 3. Tabla `curso` → Cursos

### Base de datos
```sql
CREATE TABLE curso (
    id_curso    INT          AUTO_INCREMENT PRIMARY KEY,
    id_usuario  INT          NOT NULL,
    nombre      VARCHAR(255) NOT NULL,
    CONSTRAINT fk_curso_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE   -- borra cursos si se borra el usuario
) ENGINE=InnoDB;
```

### Backend — `routes/cursos.routes.js`
`router.use(verifyToken)` protege todo el archivo. El `id_usuario` siempre sale del token:

```js
// GET /api/cursos  -> solo los cursos del usuario logueado
const [rows] = await pool.query('SELECT * FROM curso WHERE id_usuario = ?', [req.user.id_usuario]);

// POST /api/cursos -> el dueño es el usuario del token
await pool.query('INSERT INTO curso (id_usuario, nombre) VALUES (?, ?)', [req.user.id_usuario, nombre]);

// PUT / DELETE -> primero verifican propiedad antes de tocar la fila
const [curso] = await pool.query('SELECT * FROM curso WHERE id_curso = ? AND id_usuario = ?', [id, req.user.id_usuario]);
if (curso.length === 0) return res.status(404).json({ message: 'Curso no encontrado' });
```

### Frontend — `js/cursos.js`
```js
cursosCache = await Api.get('/cursos');                 // listar
await Api.post('/cursos', { nombre: nombre });          // crear
await Api.put('/cursos/' + id, { nombre: nombre });     // editar
await Api.del('/cursos/' + id);                         // eliminar
```

Cada acción vuelve a llamar `render()` para refrescar las tarjetas de curso en pantalla.

---

## 4. Tabla `tema` → Temas (con el trigger de progreso)

### Base de datos
```sql
CREATE TABLE tema (
    id_tema  INT          AUTO_INCREMENT PRIMARY KEY,
    id_curso INT          NOT NULL,
    nombre   VARCHAR(255) NOT NULL,
    estado   VARCHAR(20)  NOT NULL DEFAULT 'No iniciado',
    CONSTRAINT fk_tema_curso FOREIGN KEY (id_curso) REFERENCES curso (id_curso) ON DELETE CASCADE,
    CONSTRAINT chk_estado_tema CHECK (
        estado IN ('No iniciado', 'En proceso', 'Estudiado', 'Reforzar', 'Dominado')
    )
) ENGINE=InnoDB;
```

> El `CHECK` de la base de datos y las opciones del `<select>` del frontend usan
> **exactamente los mismos 5 estados**. Esa es la conexión entre ambas capas.

### Backend — `routes/temas.routes.js`
Como `tema` no tiene `id_usuario`, la verificación de propiedad se hace con un **JOIN a
`curso`** para confirmar que el tema pertenece al usuario del token:

```js
// GET /api/temas/curso/:id_curso  (verifica que el curso sea del usuario)
const [rows] = await pool.query('SELECT * FROM tema WHERE id_curso = ?', [id_curso]);

// PUT /api/temas/:id  (cambiar nombre/estado)
const [tema] = await pool.query(
  `SELECT t.* FROM tema t
   JOIN curso c ON c.id_curso = t.id_curso
   WHERE t.id_tema = ? AND c.id_usuario = ?`,
  [id, req.user.id_usuario]
);
await pool.query('UPDATE tema SET nombre = ?, estado = ? WHERE id_tema = ?', [updatedName, updatedState, id]);
```

### Frontend — `js/cursos.js`
El cambio de estado se hace con un `<select>` que dispara una petición `PUT`:

```js
async function updateTemaEstado(idTema, estado) {
    await Api.put('/temas/' + idTema, { estado: estado });   // dispara el trigger en la BD
    render();
}
```

### El TRIGGER que conecta `tema` con `progreso`
Cuando el `UPDATE` anterior cambia el estado de un tema, **MySQL ejecuta automáticamente**
este trigger, que recalcula el porcentaje del usuario sin que el backend tenga que pedirlo:

```sql
CREATE TRIGGER trg_actualiza_progreso
AFTER UPDATE ON tema
FOR EACH ROW
BEGIN
    DECLARE v_usuario INT;
    SELECT id_usuario INTO v_usuario FROM curso WHERE id_curso = NEW.id_curso;

    UPDATE progreso
    SET porcentaje_av = (
        SELECT ROUND(SUM(t.estado = 'Dominado') * 100 / COUNT(t.id_tema), 2)
        FROM tema t JOIN curso c ON c.id_curso = t.id_curso
        WHERE c.id_usuario = v_usuario
    )
    WHERE id_usuario = v_usuario;
END
```

**Cadena completa:** usuario cambia el `<select>` → `Api.put('/temas/:id')` →
`UPDATE tema ...` → **trigger** → `UPDATE progreso` → el dashboard (`/api/progreso`)
mostrará el nuevo porcentaje en la siguiente carga.

---

## 5. Tabla `simulacro` → Simulacros

### Base de datos
```sql
CREATE TABLE simulacro (
    id_simulacro INT          AUTO_INCREMENT PRIMARY KEY,
    id_usuario   INT          NOT NULL,
    fecha        DATE         NOT NULL,
    puntaje      INT          NOT NULL,
    tiempo       TIME         NULL,
    correccion   VARCHAR(255) NULL,
    archivo      VARCHAR(255) NULL,
    CONSTRAINT fk_simulacro_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### Backend → Frontend
- Rutas: `routes/simulacros.routes.js` (`/api/simulacros`) — CRUD filtrado por `req.user.id_usuario`.
- Módulo: `js/simulacros.js` usa `Api.get/post/del('/simulacros')`.
- Esta tabla también alimenta varios reportes (puntaje promedio, mejor simulacro, evolución).

---

## 6. Tabla `horario` → Horarios

### Base de datos
```sql
CREATE TABLE horario (
    id_horario INT         AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT         NOT NULL,
    dia        VARCHAR(20) NOT NULL,
    hora       TIME        NOT NULL,
    CONSTRAINT fk_horario_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### Backend → Frontend
- Rutas: `routes/horarios.routes.js` (`/api/horarios`).
- Módulo: `js/horarios.js` (`Api.get/post/del('/horarios')`).
- El reporte `10.16` ordena los bloques por día de la semana usando `FIELD(dia, 'Lunes', ...)`.

---

## 7. Tabla `meta` → Metas

### Base de datos
```sql
CREATE TABLE meta (
    id_meta    INT          AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT          NOT NULL,
    objetivo   VARCHAR(255) NOT NULL,
    estado     VARCHAR(20)  NOT NULL DEFAULT 'Pendiente',
    CONSTRAINT fk_meta_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_estado_meta CHECK (estado IN ('Pendiente', 'En proceso', 'Cumplida'))
) ENGINE=InnoDB;
```

### Backend → Frontend
- Rutas: `routes/metas.routes.js` (`/api/metas`).
- Módulo: `js/metas.js`. Los 3 estados del `CHECK` se reflejan en los badges del frontend
  (`getBadgeClass` en `js/app.js`).

---

## 8. Tabla `sesion` → Sesiones de estudio

### Base de datos
```sql
CREATE TABLE sesion (
    id_sesion         INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario        INT NOT NULL,
    id_tema           INT NOT NULL,
    tiempo_hora       INT NOT NULL DEFAULT 0,
    tiempo_minuto     INT NOT NULL DEFAULT 0,
    tiempo_segundo    INT NOT NULL DEFAULT 0,
    nivel_comprension INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_sesion_tema    FOREIGN KEY (id_tema)    REFERENCES tema (id_tema)       ON DELETE CASCADE,
    CONSTRAINT chk_nivel_comprension CHECK (nivel_comprension BETWEEN 1 AND 5)
) ENGINE=InnoDB;
```

### Backend — `routes/sesiones.routes.js`
La consulta de listado hace **doble JOIN** (`sesion → tema → curso`) para devolver nombres
legibles, no solo IDs:

```js
// GET /api/sesiones
const [rows] = await pool.query(
  `SELECT se.*, t.nombre AS tema_nombre, c.nombre AS curso_nombre
   FROM sesion se
   JOIN tema  t ON t.id_tema  = se.id_tema
   JOIN curso c ON c.id_curso = t.id_curso
   WHERE se.id_usuario = ?
   ORDER BY se.id_sesion DESC`,
  [req.user.id_usuario]
);
```

### Frontend — `js/sesiones.js`
- `Api.get('/sesiones')` para listar, `Api.post('/sesiones', {...})` para registrar.
- El tiempo y el `nivel_comprension` (1 a 5) alimentan los reportes `10.12`, `10.13` y `10.14`.

---

## 9. Tabla `documento` → Documentos

### Base de datos
```sql
CREATE TABLE documento (
    id_documento INT          AUTO_INCREMENT PRIMARY KEY,
    id_tema      INT          NOT NULL,
    temario      VARCHAR(255) NULL,
    separata     VARCHAR(255) NULL,
    resumen      VARCHAR(255) NULL,
    guia         VARCHAR(255) NULL,
    CONSTRAINT fk_documento_tema FOREIGN KEY (id_tema) REFERENCES tema (id_tema) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### Backend → Frontend
- Rutas: `routes/documentos.routes.js` (`/api/documentos`) — verifica propiedad vía JOIN `tema → curso`.
- Módulo: `js/documentos.js`.
- El reporte `10.9` organiza los documentos por curso y tema.

---

## 10. Tabla `flashcard` → Flashcards

### Base de datos
```sql
CREATE TABLE flashcard (
    id_flashcard INT  AUTO_INCREMENT PRIMARY KEY,
    id_tema      INT  NOT NULL,
    pregunta     TEXT NOT NULL,
    respuesta    TEXT NOT NULL,
    CONSTRAINT fk_flashcard_tema FOREIGN KEY (id_tema) REFERENCES tema (id_tema) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### Backend → Frontend
- Rutas: `routes/flashcards.routes.js` (`/api/flashcards`).
- Módulo: `js/flashcards.js`.
- El reporte `10.10` cuenta cuántas flashcards tiene cada tema.

---

## 11. Tabla `progreso` → Dashboard

Ya creada junto a `usuario` (sección 2). Su valor **no se escribe a mano**: lo mantiene
el trigger `trg_actualiza_progreso` (sección 4).

### Backend → Frontend
- Rutas: `routes/progreso.routes.js` (`/api/progreso`) devuelve el `porcentaje_av` del usuario.
- Módulo: `js/dashboard.js` lo muestra como barra/indicador de avance global.

---

## 12. La VISTA `vista_rendimiento` y los REPORTES

### Base de datos — la vista
```sql
CREATE OR REPLACE VIEW vista_rendimiento AS
SELECT  u.id_usuario, u.nombre, c.nombre AS curso,
        COUNT(t.id_tema)              AS total_temas,
        SUM(t.estado = 'Dominado')    AS dominados
FROM    usuario u
JOIN    curso  c ON c.id_usuario = u.id_usuario
JOIN    tema   t ON t.id_curso  = c.id_curso
GROUP BY u.id_usuario, u.nombre, c.id_curso, c.nombre;
```

### Backend — `routes/reportes.routes.js`
Este archivo concentra **17 consultas analíticas**. Casi todas se filtran por
`req.user.id_usuario`. Ejemplos:

```js
// 10.1 Avance por curso (cálculo en vivo, sin trigger)
`SELECT c.nombre AS curso, COUNT(t.id_tema) AS total_temas,
        SUM(t.estado = 'Dominado') AS temas_dominados,
        ROUND(SUM(t.estado = 'Dominado') * 100 / COUNT(t.id_tema), 2) AS porcentaje_avance
 FROM curso c JOIN tema t ON t.id_curso = c.id_curso
 WHERE c.id_usuario = ? GROUP BY c.id_curso, c.nombre`

// La vista se consulta como si fuera una tabla normal:
'SELECT * FROM vista_rendimiento WHERE id_usuario = ?'
```

| Endpoint                              | Qué responde                          | Tablas/Vista       |
|---------------------------------------|---------------------------------------|--------------------|
| `/reportes/avance-por-curso`          | % dominado por curso                   | curso, tema        |
| `/reportes/temas-pendientes`          | temas no dominados por prioridad       | tema, curso        |
| `/reportes/conteo-temas`              | temas agrupados por estado             | tema, curso        |
| `/reportes/cursos-completos`          | cursos 100% dominados                  | curso, tema        |
| `/reportes/evolucion-simulacros`      | puntajes en el tiempo                  | simulacro          |
| `/reportes/estadisticas-simulacros`   | total/promedio/mejor/peor              | usuario, simulacro |
| `/reportes/simulacros-recientes`      | últimos 30 días                        | simulacro          |
| `/reportes/mejor-simulacro`           | puntaje máximo                         | simulacro          |
| `/reportes/documentos-por-curso`      | documentos por curso/tema              | documento, tema, curso |
| `/reportes/flashcards-por-tema`       | flashcards por tema                    | flashcard, tema, curso |
| `/reportes/tiempo-estudio-curso`      | tiempo acumulado por curso             | sesion, tema, curso|
| `/reportes/comprension-por-tema`      | comprensión promedio                   | sesion, tema, curso|
| `/reportes/temas-baja-comprension`    | comprensión < 3                        | sesion, tema, curso|
| `/reportes/cumplimiento-metas`        | metas por estado                       | meta, usuario      |
| `/reportes/horario-semanal`           | bloques ordenados por día              | horario            |
| `/reportes/progreso-global`           | ranking de todos los usuarios          | usuario, progreso  |
| `/reportes/rendimiento`               | datos consolidados                     | **vista_rendimiento** |

### Frontend — `js/reportes.js`
Pide **todos los reportes en paralelo** y los pinta en tarjetas:

```js
var results = await Promise.allSettled([
    Api.get('/reportes/avance-por-curso'),
    Api.get('/reportes/temas-pendientes'),
    Api.get('/reportes/cursos-completos'),
    Api.get('/reportes/estadisticas-simulacros'),
    // ... resto de reportes ...
    Api.get('/reportes/rendimiento')      // <- consulta la vista
]);
// cada resultado se convierte en una tabla/tarjeta con renderReporte(...)
```

---

## 13. Resumen de conexiones (una fila por tabla)

| Tabla / Objeto SQL   | Ruta backend (`routes/`) | Endpoint base       | Módulo frontend (`js/`) |
|----------------------|--------------------------|---------------------|--------------------------|
| `usuario` + `progreso`| `auth.routes.js`        | `/api/auth`         | `auth.js`                |
| `progreso`           | `progreso.routes.js`     | `/api/progreso`     | `dashboard.js`           |
| `curso`              | `cursos.routes.js`       | `/api/cursos`       | `cursos.js`              |
| `tema`               | `temas.routes.js`        | `/api/temas`        | `cursos.js`              |
| `simulacro`          | `simulacros.routes.js`   | `/api/simulacros`   | `simulacros.js`          |
| `horario`            | `horarios.routes.js`     | `/api/horarios`     | `horarios.js`            |
| `meta`               | `metas.routes.js`        | `/api/metas`        | `metas.js`               |
| `sesion`             | `sesiones.routes.js`     | `/api/sesiones`     | `sesiones.js`            |
| `documento`          | `documentos.routes.js`   | `/api/documentos`   | `documentos.js`          |
| `flashcard`          | `flashcards.routes.js`   | `/api/flashcards`   | `flashcards.js`          |
| `vista_rendimiento` + 17 consultas | `reportes.routes.js` | `/api/reportes` | `reportes.js`         |
| `trg_actualiza_progreso` (trigger) | *(automático en MySQL)* | — | se refleja en `dashboard.js` |

---

## 14. Ejemplo de extremo a extremo: "marcar un tema como Dominado"

1. **Frontend** — el usuario elige *Dominado* en el `<select>` de un tema
   (`js/cursos.js` → `updateTemaEstado`).
2. `Api.put('/temas/5', { estado: 'Dominado' })` envía el JWT en el header
   (`js/api.js`).
3. **Backend** — `middleware/auth.js` valida el token y rellena `req.user`.
4. `routes/temas.routes.js` confirma que el tema pertenece al usuario (JOIN con `curso`)
   y ejecuta `UPDATE tema SET estado = 'Dominado' ...`.
5. **Base de datos** — el `CHECK` valida que *Dominado* es un estado permitido y el
   **trigger** `trg_actualiza_progreso` recalcula `progreso.porcentaje_av`.
6. **Frontend** — `render()` recarga las tarjetas; al entrar al *Dashboard*,
   `/api/progreso` ya devuelve el nuevo porcentaje calculado por el trigger.
```
