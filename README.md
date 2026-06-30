# PrepaTrack

**Sistema de seguimiento academico para postulantes preuniversitarios.**

Proyecto del curso **Base de Datos I** - Universidad Nacional Mayor de San Marcos (Facultad de Ingenieria de Sistemas e Informatica).

PrepaTrack transforma los registros dispersos de un estudiante (calificaciones de simulacros, horas de estudio, temas dominados, material de repaso) en reportes estadisticos exactos, apoyandose en una base de datos relacional normalizada hasta la Tercera Forma Normal (3FN).

---

## Tabla de contenido

- [Caracteristicas](#caracteristicas)
- [Arquitectura](#arquitectura)
- [Base de datos](#base-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Inicio rapido](#inicio-rapido)
- [Tecnologias](#tecnologias)
- [Documentacion](#documentacion)
- [Equipo](#equipo)

---

## Caracteristicas

El sistema se organiza en ocho modulos funcionales:

| Modulo | Descripcion |
|--------|-------------|
| Cursos y Temas | Registro de cursos y temas con cinco estados de avance: No iniciado, En proceso, Estudiado, Reforzar, Dominado. El porcentaje de avance se calcula de forma automatica. |
| Simulacros | Registro de examenes de practica con fecha, puntaje, tiempo y correccion. Muestra la evolucion del desempeno. |
| Horarios | Bloques de estudio por dia y hora de la semana. |
| Metas | Objetivos con estado: Pendiente, En proceso, Cumplida. |
| Sesiones de estudio | Tiempo invertido (horas, minutos, segundos) y nivel de comprension del 1 al 5. |
| Documentos | Temarios, separatas, resumenes y guias asociados a cada tema. |
| Flashcards | Tarjetas de pregunta y respuesta por tema, con modo de estudio interactivo. |
| Reportes | 17 consultas analiticas, una vista y un disparador para automatizar el calculo del avance. |

Ademas incluye **autenticacion segura** (contrasenas cifradas con bcrypt y sesiones con JWT) y una **landing page** institucional.

---

## Arquitectura

PrepaTrack es una aplicacion de tres capas:

```
   NAVEGADOR                      SERVIDOR NODE.JS                 BASE DE DATOS
+--------------+   HTTP/JSON   +---------------------+   SQL    +----------------+
|  Frontend    | <-----------> |  Backend (Express)  | <------> |    MySQL 8     |
|  HTML/CSS/JS |   fetch +     |  API REST + JWT     |  mysql2  |    InnoDB      |
|  (SPA)       |   Bearer JWT  |  /api/*             |  (pool)  |  10 tablas     |
+--------------+               +---------------------+          +----------------+
```

- El **frontend** (HTML, CSS y JavaScript puro, sin frameworks) consume la API mediante `fetch`, enviando el token JWT en la cabecera `Authorization`.
- El **backend** expone una API REST con Express. Valida el token en cada ruta protegida y ejecuta consultas parametrizadas contra MySQL usando un pool de conexiones.
- La **base de datos** MySQL (motor InnoDB) garantiza la integridad referencial con llaves foraneas, y automatiza calculos con una vista y un disparador.

El detalle del flujo de conexion esta en [docs/GUION-PRESENTACION.md](docs/GUION-PRESENTACION.md).

---

## Base de datos

El curso es de Base de Datos, por lo que el modelo es el corazon del proyecto. Toda la BD es visible en [`database/schema.sql`](database/schema.sql) (estructura) y [`database/seed.sql`](database/seed.sql) (datos de prueba).

### Diez tablas (relacion 1:N salvo Progreso, que es 1:1 con Usuario)

```
                 +-----------+
                 |  usuario  |
                 +-----+-----+
       +---------+-----+------+----------+----------+
       |         |            |          |          |
  +----v---+ +---v----+  +----v----+ +---v---+ +----v----+
  |progreso| | curso  |  |simulacro| |horario| |  meta   |
  +--------+ +---+----+  +---------+ +-------+ +---------+
                 |
            +----v----+        (sesion referencia a usuario y a tema)
            |  tema   |<--------------------+
            +----+----+                     |
        +--------+--------+            +-----+----+
   +----v----+      +-----v----+       |  sesion  |
   |documento|      |flashcard |       +----------+
   +---------+      +----------+
```

- `usuario (id_usuario PK, nombre, correo UNIQUE, contrasena, carrera)`
- `progreso (id_progreso PK, id_usuario FK, porcentaje_av)` - relacion 1:1
- `curso (id_curso PK, id_usuario FK, nombre)`
- `tema (id_tema PK, id_curso FK, nombre, estado)`
- `simulacro (id_simulacro PK, id_usuario FK, fecha, puntaje, tiempo, correccion, archivo)`
- `horario (id_horario PK, id_usuario FK, dia, hora)`
- `meta (id_meta PK, id_usuario FK, objetivo, estado)`
- `sesion (id_sesion PK, id_usuario FK, id_tema FK, tiempo_hora, tiempo_minuto, tiempo_segundo, nivel_comprension)`
- `documento (id_documento PK, id_tema FK, temario, separata, resumen, guia)`
- `flashcard (id_flashcard PK, id_tema FK, pregunta, respuesta)`

### Objetos automatizados

- **Vista `vista_rendimiento`**: consolida total de temas y temas dominados por usuario y curso.
- **Disparador `trg_actualiza_progreso`**: recalcula `progreso.porcentaje_av` cada vez que se actualiza el estado de un tema.

### Restricciones de integridad

- Llaves foraneas con `ON DELETE CASCADE`.
- `CHECK` en `porcentaje_av` (0 a 100), `nivel_comprension` (1 a 5) y los estados validos de `tema` y `meta`.
- `correo` unico por usuario.

### Consultas de aplicacion

Las 17 consultas (avance por curso, temas pendientes, evolucion de simulacros, tiempo de estudio, ranking de progreso, etc.) estan implementadas en [`backend/routes/reportes.routes.js`](backend/routes/reportes.routes.js).

---

## Estructura del proyecto

```
prepatrack/
├── backend/                  API REST (Node.js + Express)
│   ├── config/db.js          Pool de conexiones MySQL
│   ├── middleware/auth.js     Verificacion de token JWT
│   ├── routes/                Rutas por modulo (auth, cursos, temas, reportes...)
│   ├── server.js              Punto de entrada del servidor
│   ├── package.json
│   └── .env.example           Plantilla de variables de entorno
├── database/
│   ├── schema.sql            Estructura: tablas, vista y disparador (DDL)
│   └── seed.sql              Datos de prueba (DML)
├── frontend/                  Aplicacion web (HTML/CSS/JS sin frameworks)
│   ├── index.html
│   ├── css/styles.css
│   └── js/                    Modulos: api, auth, app, dashboard, cursos, ...
├── landing/
│   └── index.html            Landing page institucional
├── docs/                      Guias del proyecto
│   ├── INSTALACION.md
│   ├── DESPLIEGUE.md
│   └── GUION-PRESENTACION.md
└── README.md
```

---

## Inicio rapido

Requisitos: **Node.js 18+** y **MySQL 8**.

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/prepatrack.git
cd prepatrack

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Configurar variables de entorno
#    Copia backend/.env.example como backend/.env y pon tu contrasena de MySQL.

# 4. Crear la base de datos (desde la raiz del proyecto)
#    El cliente "mysql" es necesario porque el schema usa DELIMITER (para el trigger).
mysql -u root -p < ../database/schema.sql
mysql -u root -p < ../database/seed.sql

# 5. Iniciar el servidor
npm start
```

Luego abre **http://localhost:3000** e inicia sesion con un usuario de prueba.

**Usuarios de prueba** (contrasena `password123` en los tres):

- `carlos@unmsm.edu.pe` (el mas completo para la demostracion)
- `maria@unmsm.edu.pe`
- `luis@unmsm.edu.pe`

La guia detallada (incluyendo solucion de problemas) esta en [docs/INSTALACION.md](docs/INSTALACION.md).

---

## Tecnologias

- **Backend**: Node.js, Express, mysql2, bcryptjs, jsonwebtoken, cors, dotenv.
- **Base de datos**: MySQL 8 (motor InnoDB).
- **Frontend**: HTML5, CSS3, JavaScript (ES5/ES6, sin frameworks).

---

## Documentacion

- [docs/INSTALACION.md](docs/INSTALACION.md) - Instalacion paso a paso y publicacion en GitHub.
- [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) - Despliegue en la nube y como hacer la base de datos visible.
- [docs/GUION-PRESENTACION.md](docs/GUION-PRESENTACION.md) - Guion para exponer la conexion backend-frontend.

---

## Equipo

| Integrante | Codigo |
|------------|--------|
| Edwin Piero Badillo Castillo | 24200150 |
| Landry Nicol Bardales Guadalupe | 24200151 |
| Steveen Dennys Maque Espinoza | 24200059 |
| Maria Sunori Tonconi Isidro | 24200176 |

Docente: Sumiko Elizabeth Murakami de la Cruz de Molina.

---

*Proyecto academico. Universidad Nacional Mayor de San Marcos - 2026.*
