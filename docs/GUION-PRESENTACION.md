# Guion de presentacion - Conexion backend / frontend

Guion para exponer **como se conecta el frontend con el backend y con la base de datos** en PrepaTrack, incluyendo los cambios realizados para que el sistema funcione de extremo a extremo.

- **Duracion sugerida:** 8 a 10 minutos.
- **Formato:** cada bloque tiene **[DECIR]** (lo que explicas) y **[MOSTRAR]** (lo que se ve en pantalla).

---

## Antes de empezar (lista de verificacion)

- [ ] Servidor corriendo: en `backend`, `npm start`. Debe decir "Conexion a la base de datos establecida correctamente".
- [ ] Navegador en `http://localhost:3000` (sesion cerrada).
- [ ] MySQL Workbench abierto y conectado a la base `prepatrack`.
- [ ] Pestana "Red" (Network) de las herramientas del desarrollador del navegador lista (tecla F12), para mostrar las peticiones.
- [ ] Usuario de prueba a la mano: `carlos@unmsm.edu.pe` / `password123`.

---

## Bloque 1 - Que es y que problema resuelve (1 min)

**[DECIR]**
"PrepaTrack es un sistema de seguimiento academico para postulantes preuniversitarios. El problema es que durante la preparacion se genera mucha informacion dispersa: simulacros, horas de estudio, temas dominados. Nuestra solucion es una base de datos relacional que convierte esos registros en reportes exactos. El proyecto tiene tres capas: una aplicacion web, una API en Node.js y una base de datos MySQL."

**[MOSTRAR]** La landing page (`landing/index.html`) y luego la aplicacion en `http://localhost:3000`.

---

## Bloque 2 - La arquitectura de tres capas (1 min)

**[DECIR]**
"La conexion funciona asi: el navegador nunca habla directamente con la base de datos. El frontend envia peticiones HTTP a la API; la API valida, ejecuta consultas SQL y devuelve los datos en formato JSON. Solo el backend tiene las credenciales de la base de datos."

```
NAVEGADOR  --fetch/JSON-->  API REST (Express)  --SQL/mysql2-->  MySQL (InnoDB)
   |  guarda el token JWT          |  valida el token y arma las consultas      |
   +-- Authorization: Bearer ...   +-- consultas parametrizadas (anti inyeccion) +
```

**[MOSTRAR]** El archivo `backend/server.js`: senala el montaje de rutas (`app.use('/api/auth', ...)`, `'/api/cursos'`, etc.) y como tambien sirve el frontend con `express.static`.

---

## Bloque 3 - La conexion en vivo, paso a paso (4 a 5 min)

Esta es la parte central: se muestra el recorrido completo de un dato, del clic al SQL y de vuelta.

### 3.1 Inicio de sesion (autenticacion con JWT)

**[DECIR]**
"Cuando inicio sesion, el frontend toma el correo y la contrasena y los envia a la ruta `POST /api/auth/login`. El backend busca el usuario, compara la contrasena con bcrypt (la contrasena nunca se guarda en texto plano) y, si es correcta, genera un token JWT. El frontend guarda ese token y lo envia en cada peticion siguiente."

**[MOSTRAR]**
1. Abre la pestana "Red" (F12) e inicia sesion con `carlos@unmsm.edu.pe` / `password123`.
2. Muestra la peticion `login`: el cuerpo enviado y la respuesta con el `token`.
3. Codigo de apoyo:
   - `frontend/js/api.js`: la funcion `request()` agrega `Authorization: Bearer <token>`.
   - `backend/routes/auth.routes.js`: `bcrypt.compare(...)` y `jwt.sign(...)`.

### 3.2 Una operacion de escritura (INSERT)

**[DECIR]**
"Cuando creo un tema, el frontend envia `POST /api/temas` con el token. El middleware verifica el token, identifica al usuario y el backend ejecuta un INSERT parametrizado. La base aplica las restricciones: el estado solo acepta cinco valores validos por un CHECK."

**[MOSTRAR]**
1. En "Cursos y Temas", agrega un tema nuevo a un curso.
2. En "Red" muestra la peticion `POST /api/temas`.
3. Codigo: `backend/middleware/auth.js` (verifica el JWT y pone `req.user`) y `backend/routes/temas.routes.js` (el `INSERT`).

### 3.3 El disparador en accion (lo mas importante para Base de Datos)

**[DECIR]**
"Aqui se ve el valor de tener logica en la base de datos. Voy a marcar un tema como 'Dominado'. El frontend envia `PUT /api/temas/:id`, que ejecuta un UPDATE. Ese UPDATE dispara automaticamente el trigger `trg_actualiza_progreso`, que recalcula el porcentaje de avance del usuario. El frontend no calcula nada: solo lee el nuevo porcentaje. La base de datos hace el trabajo."

**[MOSTRAR]**
1. Anota el porcentaje de avance actual (panel principal o el curso).
2. Cambia el estado de un tema a "Dominado".
3. Vuelve al panel: el porcentaje subio solo.
4. En **MySQL Workbench**, ejecuta para comprobarlo:
   ```sql
   SELECT porcentaje_av FROM progreso WHERE id_usuario = 1;
   ```
5. Muestra el codigo del disparador en `database/schema.sql` (`CREATE TRIGGER trg_actualiza_progreso`).

### 3.4 Un reporte con SQL y la vista

**[DECIR]**
"Los reportes son consultas SQL reales. Por ejemplo, el avance por curso usa JOIN, GROUP BY y una suma condicional para contar temas dominados. Tambien tenemos una vista, `vista_rendimiento`, que el backend consulta como si fuera una tabla."

**[MOSTRAR]**
1. Entra a "Reportes" en la aplicacion.
2. En "Red", muestra `GET /api/reportes/avance-por-curso`.
3. En **MySQL Workbench**, ejecuta la misma consulta para mostrar que el dato viene de SQL:
   ```sql
   SELECT c.nombre AS curso,
          COUNT(t.id_tema) AS total_temas,
          SUM(t.estado = 'Dominado') AS temas_dominados,
          ROUND(SUM(t.estado = 'Dominado') * 100 / COUNT(t.id_tema), 2) AS porcentaje_avance
   FROM curso c JOIN tema t ON t.id_curso = c.id_curso
   WHERE c.id_usuario = 1
   GROUP BY c.id_curso, c.nombre;
   ```
4. Muestra la vista:
   ```sql
   SELECT * FROM vista_rendimiento WHERE id_usuario = 1;
   ```

---

## Bloque 4 - Los cambios realizados (1 a 2 min)

**[DECIR]**
"El proyecto ya tenia la base de datos, el backend y los modulos del frontend, pero la conexion no estaba completa. Estos fueron los cambios que hicieron que el sistema funcionara de extremo a extremo:"

1. **Se creo el archivo `frontend/js/app.js`** (faltaba). Es el orquestador que une todos los modulos: controla la navegacion entre paginas, los modales y las notificaciones, y decide si mostrar el login o la aplicacion segun la sesion guardada. Tambien define funciones globales que todos los modulos usaban (`escapeHtml`, `getBadgeClass`). Sin este archivo, la aplicacion no arrancaba.

2. **Se corrigieron tres desajustes entre lo que enviaba el backend y lo que esperaba el frontend:**
   - *Sesiones*: el backend devolvia las columnas con un nombre (`nombre_curso`, `nombre_tema`) distinto al que leia el frontend (`curso_nombre`, `tema_nombre`); se alinearon.
   - *Flashcards*: la consulta de reportes no incluia el `id_tema`, por lo que el modo de estudio no abria; se agrego al SELECT.
   - *Mejor simulacro*: el backend devolvia un objeto pero el frontend esperaba un arreglo, lo que rompia toda la pagina de Reportes; se corrigio.

3. **Se corrigio la contrasena cifrada de los datos de prueba** (`seed.sql`): el hash original no correspondia a `password123`, por lo que ningun usuario podia iniciar sesion. Se reemplazo por un hash bcrypt valido.

4. **Se alinearon las credenciales de la base de datos** entre MySQL y el archivo `.env`, se cargaron el esquema y los datos, y se verifico todo el flujo: inicio de sesion, reportes y el disparador de progreso.

5. **Se construyo la landing page** institucional como puerta de entrada del sistema.

**[MOSTRAR]** (opcional) El archivo `frontend/js/app.js` y, en `backend/routes/reportes.routes.js`, la consulta de `flashcards-por-tema` ya con `id_tema`.

---

## Bloque 5 - Cierre (30 seg)

**[DECIR]**
"En resumen: el frontend es solo la cara visible; la logica de integridad y los calculos viven en la base de datos, mediante llaves foraneas, restricciones, una vista y un disparador. El backend es el puente que conecta ambos de forma segura con tokens y consultas parametrizadas. Asi, la informacion dispersa del postulante se convierte en reportes exactos."

---

## Anexo - Posibles preguntas del jurado

**Como se protegen las contrasenas?**
Se cifran con bcrypt antes de guardarlas. En el login se compara el hash; nunca se almacena ni se compara texto plano.

**Como se evita la inyeccion SQL?**
Todas las consultas usan parametros (`?`) con `mysql2`, que escapa los valores. No se concatena entrada del usuario en el SQL.

**Que pasa si elimino un usuario o un curso?**
Las llaves foraneas tienen `ON DELETE CASCADE`: al borrar un usuario se eliminan en cascada sus cursos, temas, documentos, etc., manteniendo la integridad.

**Por que un disparador y no calcular el avance en el backend?**
Para garantizar que el porcentaje sea consistente sin importar desde donde se actualice el estado de un tema. La base se encarga del calculo, una sola fuente de verdad.

**Donde estan las 17 consultas de aplicacion?**
En `backend/routes/reportes.routes.js`, cada una expuesta como un endpoint bajo `/api/reportes/`.

**Como sabe el backend que usuario hace la peticion?**
Por el token JWT: el middleware lo verifica, extrae el `id_usuario` y todas las consultas se filtran por ese usuario.
