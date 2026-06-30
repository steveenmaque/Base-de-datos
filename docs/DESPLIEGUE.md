# Guia de despliegue y de base de datos visible

Esta guia responde dos preguntas:

1. Se puede desplegar la landing page y el backend en internet? **Si.**
2. Como hacer que la base de datos sea "visible" (ya que el curso trata de bases de datos)?

Se proponen **tres opciones**, de la mas simple a la mas completa. Para entregar el curso, la **Opcion A o B** es suficiente y de bajo riesgo.

---

## Resumen de opciones

| | Landing | Backend | Base de datos | Esfuerzo |
|---|---|---|---|---|
| **A. Repo + demo local** | GitHub Pages | Local (en tu PC) | Local + visible como codigo/diagrama | Bajo |
| **B. BD en la nube** | GitHub Pages | Local o nube | MySQL en la nube (Aiven/Railway) | Medio |
| **C. Todo desplegado** | GitHub Pages | Render | MySQL en la nube | Alto |

---

## Que significa "base de datos visible"

Para un curso de Base de Datos, "visible" puede lograrse de tres formas que se complementan:

1. **Como codigo en el repositorio** (siempre): `database/schema.sql` y `database/seed.sql` muestran tablas, llaves, la vista y el disparador. Cualquiera los lee en GitHub.
2. **Como diagrama y diccionario**: el modelo entidad-relacion y el diccionario de datos estan documentados en el informe del proyecto y en el README.
3. **En vivo**: una base de datos MySQL accesible (local con MySQL Workbench durante la exposicion, o en la nube para que el docente se conecte cuando quiera).

La forma mas contundente para una exposicion es **MySQL Workbench conectado a la base** (local o en la nube): permite mostrar las tablas, ejecutar las 17 consultas, ver la vista y disparar el trigger en directo.

---

## Opcion A - Repositorio + demostracion local (recomendada para entregar ya)

La mas simple y sin costo. La base de datos es visible como codigo en GitHub y en vivo con Workbench durante la exposicion.

1. Sube el proyecto a GitHub (ver [INSTALACION.md](INSTALACION.md), Parte 1).
2. Publica **solo la landing** en GitHub Pages:
   - En GitHub: *Settings > Pages*.
   - En **Source** elige la rama `main` y la carpeta `/root` (o mueve `landing/index.html` a una rama `gh-pages`).
   - Para servir unicamente la landing, lo mas limpio es indicar la carpeta `/landing` si tu configuracion lo permite, o copiar `landing/index.html` a la raiz como `index.html`.
   - GitHub te dara una URL publica del tipo `https://<tu-usuario>.github.io/prepatrack/`.
3. Para la demostracion del sistema completo, corre el backend localmente (`npm start`) y abre MySQL Workbench para mostrar la base.

> **Nota:** GitHub Pages solo sirve archivos estaticos. La landing se vera, pero el boton "Iniciar sesion" solo funciona si el backend esta corriendo (localmente o desplegado en la Opcion C).

---

## Opcion B - Base de datos MySQL en la nube

Hace la base **accesible desde internet**, para que el docente se conecte con Workbench cuando quiera. Tu backend puede seguir corriendo en local apuntando a esa base.

### Proveedores gratuitos recomendados (soportan MySQL completo: llaves foraneas, vistas y disparadores)

- **Aiven** ( https://aiven.io ) - plan gratuito de MySQL.
- **Railway** ( https://railway.app ) - MySQL con creditos gratuitos.
- **Clever Cloud** ( https://www.clever-cloud.com ) - MySQL pequeno gratuito.

> Evita PlanetScale/Vitess para este proyecto: tienen restricciones con disparadores y llaves foraneas, y PrepaTrack usa ambos.

### Pasos

1. Crea una cuenta en el proveedor y crea una instancia de **MySQL 8**.
2. Copia los datos de conexion que te entregan: host, puerto, usuario, contrasena y nombre de la base.
3. Carga el esquema y los datos en esa base. Con el cliente `mysql`:
   ```bash
   mysql -h HOST -P PUERTO -u USUARIO -p NOMBREBASE < database/schema.sql
   mysql -h HOST -P PUERTO -u USUARIO -p NOMBREBASE < database/seed.sql
   ```
   - El `schema.sql` empieza con `DROP DATABASE`/`CREATE DATABASE`. En la nube quiza no tengas permiso para crear bases: en ese caso edita las primeras lineas del script para usar la base que te asignaron (quita el `DROP/CREATE/USE` y carga las tablas en la base existente).
4. Apunta tu backend a la nube editando `backend/.env`:
   ```
   DB_HOST=mysql-xxxx.aivencloud.com
   DB_PORT=3306
   DB_USER=avnadmin
   DB_PASSWORD=la_contrasena_del_proveedor
   DB_NAME=prepatrack
   ```
   - Si el proveedor exige conexion cifrada (SSL), agrega la opcion `ssl` al pool en `backend/config/db.js`.
5. Comparte el host/usuario (idealmente un usuario de solo lectura) con el docente para que se conecte con MySQL Workbench y vea la base en vivo.

---

## Opcion C - Despliegue completo (backend en internet)

Para tener la aplicacion completa accesible por una URL publica.

### 1. Base de datos

Usa una MySQL en la nube (Opcion B).

### 2. Backend en Render

1. Crea una cuenta en https://render.com y conecta tu repositorio de GitHub.
2. Crea un **Web Service** apuntando a la carpeta `backend`:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. En **Environment** agrega las variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `PORT`.
4. Render te dara una URL del tipo `https://prepatrack.onrender.com`. Como el backend tambien sirve el frontend (carpeta `frontend`), la aplicacion completa quedara disponible en esa URL.

> En el plan gratuito de Render el servicio se "duerme" tras un rato de inactividad; la primera visita despues puede tardar unos segundos en responder.

### 3. Landing en GitHub Pages

Igual que en la Opcion A. Si quieres que el boton "Iniciar sesion" de la landing apunte al backend desplegado, cambia en `landing/index.html` el enlace `../frontend/index.html` por la URL de Render.

### Ajuste de CORS (si frontend y backend quedan en dominios distintos)

El backend ya usa `cors()` permitiendo todos los origenes, suficiente para una demostracion. Para mayor control, puedes restringirlo al dominio de la landing en `backend/server.js`.

---

## Recomendacion para el curso

1. **Sube el repositorio a GitHub** (la BD ya queda visible como `schema.sql`/`seed.sql` y diagrama). Esto cubre el requisito principal.
2. **Publica la landing en GitHub Pages** para tener una URL presentable.
3. Para la exposicion, abre **MySQL Workbench** (local o, mejor aun, conectado a una base en la nube de la Opcion B) y muestra en vivo las tablas, las 17 consultas, la vista `vista_rendimiento` y el disparador `trg_actualiza_progreso`.

El despliegue completo (Opcion C) es un plus si te queda tiempo, pero no es indispensable para demostrar el trabajo de base de datos.
