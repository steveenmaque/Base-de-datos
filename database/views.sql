-- =============================================================
-- PrepaTrack - Vistas para la demostracion en vivo
-- Ejecutar DESPUES de schema.sql y seed.sql:
--     mysql -u root -p prepatrack < database/views.sql
-- o abrir este archivo en MySQL Workbench y ejecutarlo completo.
--
-- Estas vistas consolidan el estado de la base de datos para poder
-- mostrar, en una sola consulta, como cambian las cosas cada vez que
-- se agrega o se elimina informacion desde la aplicacion.
-- =============================================================

USE prepatrack;

-- -------------------------------------------------------------
-- VISTA 1: v_conteo_tablas
-- Panorama general: cuantas filas tiene cada tabla del sistema.
-- Ideal para mostrar "antes y despues" de un INSERT o un DELETE.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_conteo_tablas AS
             SELECT 'usuario'   AS tabla, COUNT(*) AS filas FROM usuario
   UNION ALL SELECT 'progreso',  COUNT(*) FROM progreso
   UNION ALL SELECT 'curso',     COUNT(*) FROM curso
   UNION ALL SELECT 'tema',      COUNT(*) FROM tema
   UNION ALL SELECT 'simulacro', COUNT(*) FROM simulacro
   UNION ALL SELECT 'horario',   COUNT(*) FROM horario
   UNION ALL SELECT 'meta',      COUNT(*) FROM meta
   UNION ALL SELECT 'sesion',    COUNT(*) FROM sesion
   UNION ALL SELECT 'documento', COUNT(*) FROM documento
   UNION ALL SELECT 'flashcard', COUNT(*) FROM flashcard;

-- -------------------------------------------------------------
-- VISTA 2: v_resumen_usuario
-- Resumen por usuario, incluyendo el porcentaje de progreso que
-- mantiene automaticamente el trigger trg_actualiza_progreso.
-- Al cambiar un tema a 'Dominado', la columna progreso cambia sola.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_resumen_usuario AS
SELECT  u.id_usuario,
        u.nombre,
        COUNT(DISTINCT c.id_curso)  AS cursos,
        COUNT(t.id_tema)            AS temas,
        SUM(t.estado = 'Dominado')  AS temas_dominados,
        p.porcentaje_av             AS progreso
FROM        usuario  u
LEFT JOIN   curso    c ON c.id_usuario = u.id_usuario
LEFT JOIN   tema     t ON t.id_curso   = c.id_curso
LEFT JOIN   progreso p ON p.id_usuario = u.id_usuario
GROUP BY u.id_usuario, u.nombre, p.porcentaje_av;

-- -------------------------------------------------------------
-- VISTA 3: v_temas_detalle
-- Cada tema con el nombre de su curso y de su usuario.
-- Util para ver aparecer/desaparecer una fila al crear o borrar temas.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_temas_detalle AS
SELECT  u.id_usuario,
        u.nombre  AS usuario,
        c.id_curso,
        c.nombre  AS curso,
        t.id_tema,
        t.nombre  AS tema,
        t.estado
FROM    tema   t
JOIN    curso  c ON c.id_curso   = t.id_curso
JOIN    usuario u ON u.id_usuario = c.id_usuario;

-- -------------------------------------------------------------
-- VISTA 4: v_avance_curso
-- Porcentaje de avance calculado por curso (temas dominados / total).
-- Es el mismo calculo que dispara el trigger sobre la tabla progreso.
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_avance_curso AS
SELECT  u.nombre  AS usuario,
        c.id_curso,
        c.nombre  AS curso,
        COUNT(t.id_tema)            AS total_temas,
        SUM(t.estado = 'Dominado')  AS dominados,
        ROUND(SUM(t.estado = 'Dominado') * 100 / COUNT(t.id_tema), 2) AS porcentaje
FROM    curso  c
JOIN    tema   t ON t.id_curso   = c.id_curso
JOIN    usuario u ON u.id_usuario = c.id_usuario
GROUP BY u.nombre, c.id_curso, c.nombre;

-- =============================================================
-- HOJA DE CONSULTAS PARA LA DEMO (copiar y pegar en Workbench)
-- =============================================================
-- 1) Panorama de toda la base de datos (ejecutar antes y despues):
--      SELECT * FROM v_conteo_tablas;
--
-- 2) Resumen por usuario con el progreso del trigger:
--      SELECT * FROM v_resumen_usuario;
--
-- 3) Ver los temas de un usuario (cambia el 1 por el id que quieras):
--      SELECT * FROM v_temas_detalle WHERE id_usuario = 1;
--
-- 4) Avance por curso:
--      SELECT * FROM v_avance_curso WHERE usuario = 'Carlos Mendoza';
--
-- 5) DEMOSTRAR EL TRIGGER en SQL puro:
--      -- Mira el progreso actual del usuario 1:
--      SELECT * FROM progreso WHERE id_usuario = 1;
--      -- Marca un tema como Dominado (elige un id_tema del usuario 1):
--      UPDATE tema SET estado = 'Dominado' WHERE id_tema = 3;
--      -- Vuelve a mirar: el porcentaje cambio solo, sin tocar la tabla progreso:
--      SELECT * FROM progreso WHERE id_usuario = 1;
--
-- 6) DEMOSTRAR EL BORRADO EN CASCADA (ON DELETE CASCADE):
--      SELECT * FROM v_conteo_tablas;          -- antes
--      DELETE FROM curso WHERE id_curso = 1;   -- borra el curso...
--      SELECT * FROM v_conteo_tablas;          -- ...y caen sus temas, sesiones, etc.
-- =============================================================
