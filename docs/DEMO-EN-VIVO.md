# PrepaTrack — Guía de Demostración en Vivo

Cómo mostrar, durante la presentación, que **cada vez que se agrega o elimina algo**
la base de datos cambia en tiempo real. Hay **dos formas** y puedes usar la que prefieras
(o ambas):

- **A) Página "Monitor BD"** dentro de la propia aplicación (visual, en el navegador).
- **B) Vistas SQL** ejecutadas en MySQL Workbench / consola (técnico, SQL puro).

---

## 0. Preparación (una sola vez)

1. Cargar la base de datos con sus datos y las vistas de demo.

   > **Windows (PowerShell).** El comando `mysql` no suele estar en el PATH y PowerShell
   > **no** entiende el símbolo `<`. Usa la ruta completa al cliente y `Get-Content ... |`.
   > Ajusta `8.0` a tu versión y `-p2005` a tu contraseña de root:
   >
   > ```powershell
   > $mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
   > Get-Content database\schema.sql | & $mysql -u root -p2005
   > Get-Content database\seed.sql   | & $mysql -u root -p2005 prepatrack
   > Get-Content database\views.sql  | & $mysql -u root -p2005 prepatrack
   > ```

   En **Linux/macOS o Git Bash** (con `mysql` en el PATH) sí funciona la forma clásica:

   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p prepatrack < database/seed.sql
   mysql -u root -p prepatrack < database/views.sql
   ```

2. Arrancar el backend (sirve también el frontend):

   ```powershell
   cd backend
   npm install      # solo la primera vez
   npm start        # -> http://localhost:3000
   ```

3. Entrar a `http://localhost:3000` e iniciar sesión con un usuario semilla:
   - Correo: `carlos@unmsm.edu.pe`
   - Contraseña: `password123`

---

## A) Demostración con la página "Monitor BD" (navegador)

La app ahora tiene en el menú lateral una opción nueva: **Monitor BD**.
Esa página lee la base de datos y muestra **todas las tablas del usuario**, con:

- Un número grande con `progreso.porcentaje_av` (el que mantiene el trigger).
- Un conteo de filas por tabla.
- Una tabla por cada entidad (curso, tema, simulacro, …).
- **Auto-refresco cada 2 segundos**: las **filas nuevas se resaltan en verde** y el
  progreso **parpadea** cuando cambia.

### Montaje recomendado en pantalla
Abre **dos pestañas** del navegador, lado a lado:
- Pestaña 1: la sección normal (ej. *Cursos y Temas*).
- Pestaña 2: la sección **Monitor BD**.

> Ambas pestañas comparten la misma sesión, así que ves el efecto al instante.

### Guion sugerido

1. **Agregar un curso** → en la Pestaña 1 crea el curso *"Razonamiento Verbal"*.
   En la Pestaña 2 (Monitor) aparece una **fila nueva resaltada** en la tabla `curso`
   y el chip de conteo sube de número.

2. **Agregar un tema** → crea un tema dentro de ese curso.
   En el Monitor aparece la fila en la tabla `tema` con estado `No iniciado`.

3. **Mostrar el TRIGGER en acción** → cambia el estado de un tema a **`Dominado`**
   con el `<select>`. En el Monitor, el número grande de **`progreso.porcentaje_av`
   parpadea y cambia solo** — nadie escribió en la tabla `progreso`, lo hizo el trigger
   `trg_actualiza_progreso`.

4. **Eliminar un curso** → borra el curso creado. En el Monitor verás que **desaparece
   la fila del curso y también sus temas** (borrado en cascada, `ON DELETE CASCADE`),
   y el progreso se recalcula otra vez.

> Si prefieres controlar el momento exacto, desmarca **"Auto-refresco"** y usa el botón
> **"Refrescar ahora"** después de cada cambio.

---

## B) Demostración con vistas SQL (MySQL Workbench / consola)

Si la presentación es más técnica, muestra los cambios directamente sobre la base de datos
usando las vistas de `database/views.sql`. Ten una ventana de Workbench abierta junto a la app.

### B.1 — Ver el panorama general (antes y después)

```sql
SELECT * FROM v_conteo_tablas;
```

Agrega o elimina algo en la app y **vuelve a ejecutar** la misma consulta: el número de
filas de la tabla afectada cambia.

### B.2 — Ver el progreso por usuario (efecto del trigger)

```sql
SELECT * FROM v_resumen_usuario;
```

### B.3 — Demostrar el TRIGGER 100% en SQL

```sql
-- Progreso actual del usuario 1
SELECT * FROM progreso WHERE id_usuario = 1;

-- Marcar un tema como Dominado (elige un id_tema del usuario 1)
UPDATE tema SET estado = 'Dominado' WHERE id_tema = 3;

-- El porcentaje cambió SOLO, sin tocar la tabla progreso
SELECT * FROM progreso WHERE id_usuario = 1;
```

### B.4 — Demostrar el borrado en CASCADA

```sql
SELECT * FROM v_conteo_tablas;          -- antes
DELETE FROM curso WHERE id_curso = 1;   -- borra el curso...
SELECT * FROM v_conteo_tablas;          -- ...caen también sus temas, sesiones, documentos y flashcards
```

---

## Resumen de lo que demuestra cada cosa

| Acción en la app / SQL         | Qué se ve cambiar                                   | Concepto de BD que prueba          |
|--------------------------------|-----------------------------------------------------|------------------------------------|
| Crear curso / tema             | Fila nueva resaltada en el Monitor; sube el conteo  | `INSERT`, clave foránea            |
| Cambiar tema a `Dominado`      | `progreso.porcentaje_av` parpadea y cambia solo     | **TRIGGER** `trg_actualiza_progreso` |
| Eliminar un curso              | Desaparece el curso **y** sus temas/sesiones/etc.   | `ON DELETE CASCADE`                |
| `SELECT * FROM v_conteo_tablas`| El conteo de filas antes/después                    | Vistas, estado de la BD            |
| `SELECT * FROM v_avance_curso` | El % por curso                                      | Vistas con `JOIN` y agregación     |

> Nota: el Monitor solo muestra los datos del **usuario que inició sesión** (igual que el
> resto de la app), por seguridad. Para ver a todos los usuarios a la vez, usa las vistas
> SQL de la sección B.
