# Guia de instalacion

Esta guia explica como **publicar el proyecto en GitHub** y como **instalar y ejecutar PrepaTrack** en una computadora desde cero.

---

## Parte 1 - Subir el proyecto a GitHub

En esta computadora **no esta instalado Git**, por lo que la forma mas sencilla de publicar el proyecto es con **GitHub Desktop** (incluye Git y maneja el inicio de sesion por ti).

### Paso 1. Crear una cuenta y instalar GitHub Desktop

1. Crea una cuenta gratuita en https://github.com (si aun no tienes una).
2. Descarga e instala **GitHub Desktop** desde https://desktop.github.com.
3. Abre GitHub Desktop e inicia sesion con tu cuenta de GitHub.

### Paso 2. Agregar el proyecto como repositorio

1. En GitHub Desktop ve a **File > Add local repository**.
2. Selecciona la carpeta del proyecto:
   `C:\Users\Steveen\Documents\BaseDeDatos\prepatrack`
3. Si avisa que la carpeta no es un repositorio Git, haz clic en **"create a repository"** (crear un repositorio aqui).
4. Confirma con **Create repository**.

> El archivo `.gitignore` ya esta incluido en el proyecto. Gracias a el, **no se subiran** la carpeta `node_modules` ni el archivo `backend/.env` (que contiene tu contrasena). Esto es intencional y correcto.

### Paso 3. Primer commit

1. En GitHub Desktop veras la lista de archivos a incluir en el panel izquierdo.
2. Abajo a la izquierda, en **Summary**, escribe un mensaje como: `Version inicial de PrepaTrack`.
3. Haz clic en **Commit to main**.

### Paso 4. Publicar en GitHub

1. Arriba haz clic en **Publish repository**.
2. Pon el nombre `prepatrack`.
3. Decide la visibilidad:
   - **Publico** (recomendado para el curso): el docente puede ver el codigo sin permisos especiales.
   - **Privado**: solo tu y a quienes invites. Si lo eliges, agrega al docente en *Settings > Collaborators*.
4. Haz clic en **Publish repository**.

Listo. Tu proyecto ya esta en `https://github.com/<tu-usuario>/prepatrack`.

> **Alternativa con linea de comandos:** si prefieres instalar Git ( https://git-scm.com/download/win ), desde la carpeta del proyecto ejecuta:
> ```bash
> git init
> git add .
> git commit -m "Version inicial de PrepaTrack"
> git branch -M main
> git remote add origin https://github.com/<tu-usuario>/prepatrack.git
> git push -u origin main
> ```

---

## Parte 2 - Instalar y ejecutar el proyecto

Estos pasos sirven para correr PrepaTrack en cualquier computadora despues de clonarlo desde GitHub.

### Requisitos previos

| Programa | Version | Descarga |
|----------|---------|----------|
| Node.js | 18 o superior | https://nodejs.org |
| MySQL Server | 8.x | https://dev.mysql.com/downloads/installer/ |
| MySQL Workbench (opcional, recomendado) | - | viene con el instalador de MySQL |

### Paso 1. Obtener el codigo

Con GitHub Desktop: **File > Clone repository**, elige `prepatrack`.

O con Git por linea de comandos:

```bash
git clone https://github.com/<tu-usuario>/prepatrack.git
cd prepatrack
```

### Paso 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

Esto crea la carpeta `node_modules` con Express, mysql2, bcryptjs, jsonwebtoken, cors y dotenv.

### Paso 3. Configurar las variables de entorno

1. En la carpeta `backend`, copia el archivo `.env.example` y renombra la copia como `.env`.
2. Abre `.env` y coloca la contrasena de tu MySQL:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contrasena_de_mysql
DB_NAME=prepatrack
JWT_SECRET=una_clave_secreta_larga_y_aleatoria
PORT=3000
```

### Paso 4. Crear la base de datos

El script `schema.sql` usa `DELIMITER` para definir el disparador, por lo que **debe cargarse con el cliente `mysql`** (no con un script de Node). Desde la raiz del proyecto:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Si `mysql` no esta en el PATH, usa la ruta completa del cliente, por ejemplo:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database\schema.sql
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database\seed.sql
```

**Alternativa con MySQL Workbench:** abre Workbench, conectate, usa *File > Open SQL Script*, abre `database/schema.sql` y ejecutalo (rayo). Repite con `database/seed.sql`.

Esto crea la base `prepatrack` con sus 10 tablas, la vista, el disparador y los datos de prueba.

### Paso 5. Ejecutar el servidor

```bash
cd backend
npm start
```

Deberias ver:

```
Servidor PrepaTrack corriendo en el puerto 3000
Conexion a la base de datos establecida correctamente
```

### Paso 6. Usar la aplicacion

- Aplicacion: abre **http://localhost:3000**
- Landing page: abre el archivo `landing/index.html` en el navegador.

Usuarios de prueba (contrasena `password123`):

- `carlos@unmsm.edu.pe`
- `maria@unmsm.edu.pe`
- `luis@unmsm.edu.pe`

---

## Solucion de problemas

### "Error al conectar a la base de datos: Access denied for user 'root'@'localhost'"

La contrasena de `.env` no coincide con la de tu MySQL. Opciones:

1. Edita `backend/.env` y pon la contrasena correcta de tu root.
2. Si **no recuerdas** la contrasena de root, hay que resetearla. En una PowerShell **abierta como administrador**:
   - Detener el servicio: `net stop MySQL80`
   - Iniciar MySQL temporalmente con un archivo de inicializacion que contenga:
     `ALTER USER 'root'@'localhost' IDENTIFIED BY 'tu_nueva_contrasena';`
     usando `mysqld --init-file="ruta\reset.sql"`.
   - Cerrar esa instancia y reiniciar el servicio: `net start MySQL80`.
   - Actualizar `backend/.env` con la nueva contrasena.

### "Cannot find module 'express'"

No se instalaron las dependencias. Ejecuta `npm install` dentro de la carpeta `backend`.

### El puerto 3000 ya esta en uso

Cambia `PORT=3000` por otro valor (por ejemplo `PORT=4000`) en `backend/.env`.

### La pagina carga pero no inicia sesion

Verifica que el servidor muestre "Conexion a la base de datos establecida correctamente" y que hayas cargado `seed.sql` (los usuarios de prueba se crean alli).

---

Para desplegar el proyecto en internet y hacer la base de datos visible en linea, continua con [DESPLIEGUE.md](DESPLIEGUE.md).
