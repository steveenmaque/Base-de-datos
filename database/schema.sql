-- =============================================================
-- PrepaTrack - Script de creacion de base de datos (DDL)
-- Sistema de seguimiento academico para estudiantes preuniversitarios
-- =============================================================

DROP DATABASE IF EXISTS prepatrack;
CREATE DATABASE prepatrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prepatrack;

-- =============================================================
-- TABLA 1: usuario
-- Almacena la informacion de los usuarios registrados
-- =============================================================
CREATE TABLE usuario (
    id_usuario  INT          AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(255) NOT NULL,
    correo      VARCHAR(255) NOT NULL UNIQUE,
    contrasena  VARCHAR(255) NOT NULL,
    carrera     VARCHAR(255) NULL
) ENGINE=InnoDB;

-- =============================================================
-- TABLA 2: progreso
-- Registra el porcentaje de avance global de cada usuario
-- =============================================================
CREATE TABLE progreso (
    id_progreso    INT          AUTO_INCREMENT PRIMARY KEY,
    id_usuario     INT          NOT NULL,
    porcentaje_av  DECIMAL(5,2) NOT NULL DEFAULT 0,
    CONSTRAINT uq_progreso_usuario UNIQUE (id_usuario),
    CONSTRAINT fk_progreso_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_porcentaje CHECK (porcentaje_av BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- =============================================================
-- TABLA 3: curso
-- Cursos asociados a cada usuario
-- =============================================================
CREATE TABLE curso (
    id_curso    INT          AUTO_INCREMENT PRIMARY KEY,
    id_usuario  INT          NOT NULL,
    nombre      VARCHAR(255) NOT NULL,
    CONSTRAINT fk_curso_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- TABLA 4: tema
-- Temas dentro de cada curso con su estado de avance
-- =============================================================
CREATE TABLE tema (
    id_tema  INT          AUTO_INCREMENT PRIMARY KEY,
    id_curso INT          NOT NULL,
    nombre   VARCHAR(255) NOT NULL,
    estado   VARCHAR(20)  NOT NULL DEFAULT 'No iniciado',
    CONSTRAINT fk_tema_curso FOREIGN KEY (id_curso)
        REFERENCES curso (id_curso) ON DELETE CASCADE,
    CONSTRAINT chk_estado_tema CHECK (
        estado IN ('No iniciado', 'En proceso', 'Estudiado', 'Reforzar', 'Dominado')
    )
) ENGINE=InnoDB;

-- =============================================================
-- TABLA 5: simulacro
-- Resultados de simulacros (examenes de practica)
-- =============================================================
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

-- =============================================================
-- TABLA 6: horario
-- Bloques de estudio programados por dia y hora
-- =============================================================
CREATE TABLE horario (
    id_horario INT         AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT         NOT NULL,
    dia        VARCHAR(20) NOT NULL,
    hora       TIME        NOT NULL,
    CONSTRAINT fk_horario_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- TABLA 7: meta
-- Metas u objetivos definidos por cada usuario
-- =============================================================
CREATE TABLE meta (
    id_meta    INT          AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT          NOT NULL,
    objetivo   VARCHAR(255) NOT NULL,
    estado     VARCHAR(20)  NOT NULL DEFAULT 'Pendiente',
    CONSTRAINT fk_meta_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_estado_meta CHECK (
        estado IN ('Pendiente', 'En proceso', 'Cumplida')
    )
) ENGINE=InnoDB;

-- =============================================================
-- TABLA 8: sesion
-- Sesiones de estudio con duracion y nivel de comprension
-- =============================================================
CREATE TABLE sesion (
    id_sesion         INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario        INT NOT NULL,
    id_tema           INT NOT NULL,
    tiempo_hora       INT NOT NULL DEFAULT 0,
    tiempo_minuto     INT NOT NULL DEFAULT 0,
    tiempo_segundo    INT NOT NULL DEFAULT 0,
    nivel_comprension INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_sesion_tema FOREIGN KEY (id_tema)
        REFERENCES tema (id_tema) ON DELETE CASCADE,
    CONSTRAINT chk_nivel_comprension CHECK (nivel_comprension BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- =============================================================
-- TABLA 9: documento
-- Documentos asociados a cada tema (temarios, separatas, etc.)
-- =============================================================
CREATE TABLE documento (
    id_documento INT          AUTO_INCREMENT PRIMARY KEY,
    id_tema      INT          NOT NULL,
    temario      VARCHAR(255) NULL,
    separata     VARCHAR(255) NULL,
    resumen      VARCHAR(255) NULL,
    guia         VARCHAR(255) NULL,
    CONSTRAINT fk_documento_tema FOREIGN KEY (id_tema)
        REFERENCES tema (id_tema) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- TABLA 10: flashcard
-- Tarjetas de estudio con pregunta y respuesta por tema
-- =============================================================
CREATE TABLE flashcard (
    id_flashcard INT  AUTO_INCREMENT PRIMARY KEY,
    id_tema      INT  NOT NULL,
    pregunta     TEXT NOT NULL,
    respuesta    TEXT NOT NULL,
    CONSTRAINT fk_flashcard_tema FOREIGN KEY (id_tema)
        REFERENCES tema (id_tema) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- VISTA: vista_rendimiento
-- Muestra el rendimiento por curso de cada usuario
-- =============================================================
CREATE OR REPLACE VIEW vista_rendimiento AS
SELECT  u.id_usuario,
        u.nombre,
        c.nombre AS curso,
        COUNT(t.id_tema) AS total_temas,
        SUM(t.estado = 'Dominado') AS dominados
FROM    usuario u
JOIN    curso  c ON c.id_usuario = u.id_usuario
JOIN    tema   t ON t.id_curso  = c.id_curso
GROUP BY u.id_usuario, u.nombre, c.id_curso, c.nombre;

-- =============================================================
-- TRIGGER: trg_actualiza_progreso
-- Recalcula automaticamente el porcentaje de avance del usuario
-- cada vez que se actualiza el estado de un tema
-- =============================================================
DELIMITER //
CREATE TRIGGER trg_actualiza_progreso
AFTER UPDATE ON tema
FOR EACH ROW
BEGIN
    DECLARE v_usuario INT;

    -- Obtener el usuario propietario del curso al que pertenece el tema
    SELECT id_usuario INTO v_usuario
    FROM   curso
    WHERE  id_curso = NEW.id_curso;

    -- Actualizar el porcentaje de avance basado en temas dominados
    UPDATE progreso
    SET    porcentaje_av = (
               SELECT ROUND(SUM(t.estado = 'Dominado') * 100 / COUNT(t.id_tema), 2)
               FROM   tema  t
               JOIN   curso c ON c.id_curso = t.id_curso
               WHERE  c.id_usuario = v_usuario
           )
    WHERE  id_usuario = v_usuario;
END //
DELIMITER ;
