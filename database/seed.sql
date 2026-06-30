-- =============================================================
-- PrepaTrack - Datos iniciales de prueba (DML)
-- Contexto: estudiantes preuniversitarios peruanos
-- =============================================================

USE prepatrack;

-- =============================================================
-- USUARIOS
-- Contrasena hasheada con bcrypt para 'password123'
-- =============================================================
INSERT INTO usuario (nombre, correo, contrasena, carrera) VALUES
('Carlos Mendoza', 'carlos@unmsm.edu.pe', '$2a$10$BN8T5i.ngMreiOJYv0J1meZKgpyurvFJlGcBIbtLlof1tmtnvSZAS', 'Ingenieria de Sistemas'),
('Maria Garcia',   'maria@unmsm.edu.pe',  '$2a$10$BN8T5i.ngMreiOJYv0J1meZKgpyurvFJlGcBIbtLlof1tmtnvSZAS', 'Medicina Humana'),
('Luis Quispe',    'luis@unmsm.edu.pe',   '$2a$10$BN8T5i.ngMreiOJYv0J1meZKgpyurvFJlGcBIbtLlof1tmtnvSZAS', 'Derecho');

-- =============================================================
-- PROGRESO
-- Todos inician con 0% de avance
-- =============================================================
INSERT INTO progreso (id_usuario, porcentaje_av) VALUES
(1, 0.00),
(2, 0.00),
(3, 0.00);

-- =============================================================
-- CURSOS
-- Usuario 1 (Carlos): 8 cursos tipicos de preparacion preuniversitaria
-- Usuario 2 (Maria): 4 cursos
-- Usuario 3 (Luis): 3 cursos
-- =============================================================
INSERT INTO curso (id_usuario, nombre) VALUES
-- Carlos (id_usuario = 1): cursos 1-8
(1, 'Algebra'),
(1, 'Aritmetica'),
(1, 'Geometria'),
(1, 'Trigonometria'),
(1, 'Fisica'),
(1, 'Quimica'),
(1, 'Biologia'),
(1, 'Lenguaje'),
-- Maria (id_usuario = 2): cursos 9-12
(2, 'Biologia'),
(2, 'Quimica'),
(2, 'Fisica'),
(2, 'Anatomia'),
-- Luis (id_usuario = 3): cursos 13-15
(3, 'Lenguaje'),
(3, 'Historia del Peru'),
(3, 'Economia');

-- =============================================================
-- TEMAS
-- 3 a 5 temas por curso con estados variados
-- =============================================================
INSERT INTO tema (id_curso, nombre, estado) VALUES
-- Algebra (curso 1)
(1, 'Ecuaciones lineales',              'Dominado'),
(1, 'Sistemas de ecuaciones',           'Estudiado'),
(1, 'Polinomios y factorizacion',       'En proceso'),
(1, 'Inecuaciones',                     'No iniciado'),
-- Aritmetica (curso 2)
(2, 'Conjuntos numericos',              'Dominado'),
(2, 'Divisibilidad',                    'Dominado'),
(2, 'Numeros primos y MCD-MCM',         'Estudiado'),
(2, 'Razones y proporciones',           'En proceso'),
(2, 'Regla de tres',                    'No iniciado'),
-- Geometria (curso 3)
(3, 'Angulos y rectas paralelas',       'Dominado'),
(3, 'Triangulos: propiedades basicas',  'Estudiado'),
(3, 'Cuadrilateros',                    'Reforzar'),
(3, 'Circunferencia',                   'No iniciado'),
-- Trigonometria (curso 4)
(4, 'Razones trigonometricas',          'En proceso'),
(4, 'Identidades trigonometricas',      'No iniciado'),
(4, 'Ecuaciones trigonometricas',       'No iniciado'),
-- Fisica (curso 5)
(5, 'Cinematica: MRU y MRUV',          'Estudiado'),
(5, 'Leyes de Newton',                 'En proceso'),
(5, 'Trabajo y energia',               'No iniciado'),
(5, 'Estatica',                        'Reforzar'),
-- Quimica (curso 6)
(6, 'Estructura atomica',              'Dominado'),
(6, 'Tabla periodica',                 'Estudiado'),
(6, 'Enlace quimico',                  'En proceso'),
(6, 'Estequiometria',                  'No iniciado'),
-- Biologia (curso 7)
(7, 'La celula: estructura y funcion', 'Estudiado'),
(7, 'Genetica mendeliana',             'En proceso'),
(7, 'Ecologia y ecosistemas',          'No iniciado'),
-- Lenguaje (curso 8)
(8, 'Acentuacion y tildacion',         'Dominado'),
(8, 'Oracion simple y compuesta',      'Estudiado'),
(8, 'Comprension lectora',             'En proceso'),
(8, 'Analogias y sinonimos',           'Reforzar'),
-- Biologia de Maria (curso 9)
(9, 'Citologia',                       'Dominado'),
(9, 'Histologia',                      'Estudiado'),
(9, 'Genetica molecular',              'En proceso'),
(9, 'Fisiologia humana',               'No iniciado'),
-- Quimica de Maria (curso 10)
(10, 'Quimica organica',               'En proceso'),
(10, 'Soluciones y concentraciones',   'Estudiado'),
(10, 'Equilibrio quimico',             'No iniciado'),
-- Fisica de Maria (curso 11)
(11, 'Optica geometrica',              'Estudiado'),
(11, 'Ondas y sonido',                 'No iniciado'),
(11, 'Electromagnetismo',              'No iniciado'),
-- Anatomia de Maria (curso 12)
(12, 'Sistema oseo',                   'Dominado'),
(12, 'Sistema circulatorio',           'En proceso'),
(12, 'Sistema nervioso',               'No iniciado'),
-- Lenguaje de Luis (curso 13)
(13, 'Redaccion y argumentacion',      'Estudiado'),
(13, 'Comprension de textos juridicos','No iniciado'),
(13, 'Ortografia avanzada',            'En proceso'),
-- Historia del Peru de Luis (curso 14)
(14, 'Culturas preincaicas',           'Dominado'),
(14, 'El Tahuantinsuyo',               'Estudiado'),
(14, 'Conquista y Virreinato',         'No iniciado'),
(14, 'Independencia del Peru',         'No iniciado'),
-- Economia de Luis (curso 15)
(15, 'Oferta y demanda',               'Estudiado'),
(15, 'Sistema financiero',             'No iniciado'),
(15, 'Politica fiscal y monetaria',    'No iniciado');

-- =============================================================
-- SIMULACROS
-- Usuario 1 (Carlos): 8 simulacros en los ultimos 2 meses
-- Usuario 2 (Maria): 4 simulacros
-- Puntajes en el rango de 500 a 900 (escala tipica UNMSM)
-- =============================================================
INSERT INTO simulacro (id_usuario, fecha, puntaje, tiempo, correccion, archivo) VALUES
-- Carlos
(1, '2026-05-04', 542,  '02:30:00', 'Reforzar razonamiento matematico',  'simulacro_2026-05-04.pdf'),
(1, '2026-05-11', 610,  '02:25:00', 'Mejorar quimica organica',          'simulacro_2026-05-11.pdf'),
(1, '2026-05-18', 635,  '02:20:00', 'Revisar geometria',                 'simulacro_2026-05-18.pdf'),
(1, '2026-06-01', 688,  '02:15:00', 'Bien en algebra, falta biologia',   'simulacro_2026-06-01.pdf'),
(1, '2026-06-08', 712,  '02:10:00', 'Avance sostenido en ciencias',      'simulacro_2026-06-08.pdf'),
(1, '2026-06-15', 745,  '02:05:00', 'Buen desempeno general',            'simulacro_2026-06-15.pdf'),
(1, '2026-06-22', 780,  '02:00:00', 'Mejorar velocidad en verbal',       'simulacro_2026-06-22.pdf'),
(1, '2026-06-29', 810,  '01:55:00', 'Mejor puntaje hasta la fecha',      'simulacro_2026-06-29.pdf'),
-- Maria
(2, '2026-05-10', 590,  '02:30:00', 'Necesita mas practica en fisica',   'simulacro_maria_05-10.pdf'),
(2, '2026-05-24', 648,  '02:20:00', 'Mejora en biologia',                'simulacro_maria_05-24.pdf'),
(2, '2026-06-07', 705,  '02:15:00', 'Progreso notable en quimica',       'simulacro_maria_06-07.pdf'),
(2, '2026-06-21', 738,  '02:10:00', 'Buen dominio de anatomia',          'simulacro_maria_06-21.pdf');

-- =============================================================
-- HORARIOS
-- Usuario 1 (Carlos): 7 bloques distribuidos en la semana
-- =============================================================
INSERT INTO horario (id_usuario, dia, hora) VALUES
(1, 'Lunes',     '06:00:00'),
(1, 'Lunes',     '16:00:00'),
(1, 'Martes',    '06:00:00'),
(1, 'Miercoles', '16:00:00'),
(1, 'Jueves',    '06:00:00'),
(1, 'Viernes',   '16:00:00'),
(1, 'Sabado',    '08:00:00');

-- =============================================================
-- METAS
-- Usuario 1 (Carlos): 5 metas con distintos estados
-- =============================================================
INSERT INTO meta (id_usuario, objetivo, estado) VALUES
(1, 'Alcanzar 800 puntos en el simulacro de junio',             'Cumplida'),
(1, 'Dominar todos los temas de Algebra',                       'En proceso'),
(1, 'Completar 50 flashcards de Aritmetica',                    'Pendiente'),
(1, 'Resolver 100 ejercicios de Geometria antes de julio',      'En proceso'),
(1, 'Repasar Quimica organica tres veces por semana',           'Pendiente');

-- =============================================================
-- SESIONES DE ESTUDIO
-- Usuario 1 (Carlos): 12 sesiones vinculadas a sus temas
-- Los id_tema corresponden a los temas insertados para Carlos
-- =============================================================
INSERT INTO sesion (id_usuario, id_tema, tiempo_hora, tiempo_minuto, tiempo_segundo, nivel_comprension) VALUES
-- Sesiones de Algebra
(1, 1,  1, 30, 0,  5),   -- Ecuaciones lineales
(1, 2,  1, 15, 0,  4),   -- Sistemas de ecuaciones
(1, 3,  0, 45, 0,  3),   -- Polinomios y factorizacion
-- Sesiones de Aritmetica
(1, 5,  1, 0,  0,  5),   -- Conjuntos numericos
(1, 6,  1, 20, 0,  5),   -- Divisibilidad
(1, 7,  0, 50, 0,  4),   -- Numeros primos y MCD-MCM
(1, 8,  0, 40, 0,  3),   -- Razones y proporciones
-- Sesiones de Geometria
(1, 10, 1, 10, 0,  5),   -- Angulos y rectas paralelas
(1, 11, 0, 55, 0,  4),   -- Triangulos: propiedades basicas
(1, 12, 0, 35, 0,  2),   -- Cuadrilateros
-- Sesiones de Fisica
(1, 17, 1, 0,  0,  4),   -- Cinematica: MRU y MRUV
(1, 18, 0, 50, 30, 3);   -- Leyes de Newton

-- =============================================================
-- DOCUMENTOS
-- 1 documento por tema para los primeros 3 cursos de Carlos
-- (Algebra, Aritmetica, Geometria)
-- =============================================================
INSERT INTO documento (id_tema, temario, separata, resumen, guia) VALUES
-- Algebra (temas 1-4)
(1,  'temario_ecuaciones_lineales.pdf',    'separata_ecuaciones.pdf',    'resumen_ecuaciones.pdf',    'guia_ecuaciones.pdf'),
(2,  'temario_sistemas_ecuaciones.pdf',    'separata_sistemas.pdf',      'resumen_sistemas.pdf',      'guia_sistemas.pdf'),
(3,  'temario_polinomios.pdf',             'separata_polinomios.pdf',    'resumen_polinomios.pdf',    'guia_polinomios.pdf'),
(4,  'temario_inecuaciones.pdf',           'separata_inecuaciones.pdf',  'resumen_inecuaciones.pdf',  'guia_inecuaciones.pdf'),
-- Aritmetica (temas 5-9)
(5,  'temario_conjuntos.pdf',              'separata_conjuntos.pdf',     'resumen_conjuntos.pdf',     'guia_conjuntos.pdf'),
(6,  'temario_divisibilidad.pdf',          'separata_divisibilidad.pdf', 'resumen_divisibilidad.pdf', 'guia_divisibilidad.pdf'),
(7,  'temario_primos_mcd_mcm.pdf',         'separata_primos.pdf',        'resumen_primos.pdf',        'guia_primos.pdf'),
(8,  'temario_razones_proporciones.pdf',   'separata_razones.pdf',       'resumen_razones.pdf',       'guia_razones.pdf'),
(9,  'temario_regla_de_tres.pdf',          'separata_regla_tres.pdf',    'resumen_regla_tres.pdf',    'guia_regla_tres.pdf'),
-- Geometria (temas 10-13)
(10, 'temario_angulos_paralelas.pdf',      'separata_angulos.pdf',       'resumen_angulos.pdf',       'guia_angulos.pdf'),
(11, 'temario_triangulos.pdf',             'separata_triangulos.pdf',    'resumen_triangulos.pdf',    'guia_triangulos.pdf'),
(12, 'temario_cuadrilateros.pdf',          'separata_cuadrilateros.pdf', 'resumen_cuadrilateros.pdf', 'guia_cuadrilateros.pdf'),
(13, 'temario_circunferencia.pdf',         'separata_circunferencia.pdf','resumen_circunferencia.pdf','guia_circunferencia.pdf');

-- =============================================================
-- FLASHCARDS
-- 3 a 4 flashcards por tema para los primeros 2 cursos de Carlos
-- Preguntas realistas de nivel preuniversitario
-- =============================================================
INSERT INTO flashcard (id_tema, pregunta, respuesta) VALUES
-- Algebra: Ecuaciones lineales (tema 1)
(1, 'Si 3x + 7 = 22, cual es el valor de x?',
    'x = 5. Se resta 7 a ambos lados: 3x = 15, luego se divide entre 3.'),
(1, 'Resuelve: 2(x - 4) = 10',
    'x = 9. Se distribuye: 2x - 8 = 10, luego 2x = 18, x = 9.'),
(1, 'En una ecuacion lineal ax + b = 0, cuando no tiene solucion?',
    'Cuando a = 0 y b distinto de 0, la ecuacion es inconsistente y no tiene solucion.'),
-- Algebra: Sistemas de ecuaciones (tema 2)
(2, 'Resuelve el sistema: x + y = 10, x - y = 4',
    'x = 7, y = 3. Sumando ambas ecuaciones: 2x = 14, x = 7; sustituyendo: y = 3.'),
(2, 'Que metodos existen para resolver sistemas de ecuaciones lineales?',
    'Los principales son: sustitucion, igualacion, reduccion (eliminacion) y metodo grafico.'),
(2, 'Cuando un sistema de 2 ecuaciones con 2 incognitas es incompatible?',
    'Cuando las rectas representadas son paralelas (misma pendiente, distinto intercepto). El determinante del sistema es cero y no hay solucion.'),
(2, 'Resuelve: 2x + 3y = 12, 4x + 6y = 24. Que tipo de sistema es?',
    'Es un sistema compatible indeterminado (infinitas soluciones), ya que la segunda ecuacion es el doble de la primera.'),
-- Algebra: Polinomios y factorizacion (tema 3)
(3, 'Factoriza: x^2 - 9',
    '(x + 3)(x - 3). Es una diferencia de cuadrados: a^2 - b^2 = (a+b)(a-b).'),
(3, 'Cual es el grado del polinomio 4x^3 - 2x^5 + x?',
    'El grado es 5, determinado por el termino de mayor exponente: -2x^5.'),
(3, 'Factoriza: x^2 + 5x + 6',
    '(x + 2)(x + 3). Se buscan dos numeros que multiplicados den 6 y sumados den 5.'),
-- Algebra: Inecuaciones (tema 4)
(4, 'Resuelve: 2x - 3 > 7',
    'x > 5. Se suma 3: 2x > 10, se divide entre 2: x > 5. Solucion: (5, +infinito).'),
(4, 'Que ocurre con el signo de la desigualdad al multiplicar por un numero negativo?',
    'El signo de la desigualdad se invierte. Por ejemplo, si -2x > 6, entonces x < -3.'),
(4, 'Resuelve: -4 < 2x + 2 <= 8',
    'Se resta 2: -6 < 2x <= 6, se divide entre 2: -3 < x <= 3. Solucion: (-3, 3].'),
-- Aritmetica: Conjuntos numericos (tema 5)
(5, 'Cuales son los principales conjuntos numericos?',
    'Naturales (N), Enteros (Z), Racionales (Q), Irracionales (I) y Reales (R). Se cumple: N c Z c Q c R.'),
(5, 'El numero raiz cuadrada de 2, a que conjunto pertenece?',
    'Pertenece a los numeros irracionales (I), ya que no puede expresarse como fraccion de enteros. Tambien pertenece a los reales (R).'),
(5, 'Cual es la diferencia entre numeros racionales e irracionales?',
    'Los racionales se pueden expresar como p/q (con q distinto de 0) y su expansion decimal es finita o periodica. Los irracionales no pueden expresarse asi y su decimal es infinito no periodico.'),
-- Aritmetica: Divisibilidad (tema 6)
(6, 'Cuales son los criterios de divisibilidad por 3 y por 9?',
    'Un numero es divisible por 3 si la suma de sus cifras es multiplo de 3. Es divisible por 9 si la suma de sus cifras es multiplo de 9.'),
(6, 'Es 2346 divisible por 6?',
    'Si. Es divisible por 2 (termina en 6) y por 3 (2+3+4+6=15, multiplo de 3). Como cumple ambos criterios, es divisible por 6.'),
(6, 'Que es el Maximo Comun Divisor (MCD)?',
    'Es el mayor numero que divide exactamente a dos o mas numeros. Se calcula descomponiendo en factores primos y tomando los comunes con menor exponente.'),
-- Aritmetica: Numeros primos y MCD-MCM (tema 7)
(7, 'Halla el MCD y MCM de 12 y 18.',
    '12 = 2^2 x 3; 18 = 2 x 3^2. MCD = 2 x 3 = 6. MCM = 2^2 x 3^2 = 36.'),
(7, 'El numero 1 es primo?',
    'No. Por definicion, un numero primo tiene exactamente dos divisores: 1 y el mismo. El numero 1 solo tiene un divisor.'),
(7, 'Descomponer 360 en sus factores primos.',
    '360 = 2^3 x 3^2 x 5. Se divide sucesivamente: 360/2=180, 180/2=90, 90/2=45, 45/3=15, 15/3=5, 5/5=1.'),
(7, 'Si MCD(a,b) x MCM(a,b) = a x b, que condicion deben cumplir a y b?',
    'Esta propiedad se cumple siempre para cualquier par de numeros naturales a y b positivos.'),
-- Aritmetica: Razones y proporciones (tema 8)
(8, 'En la proporcion a/b = c/d, como se llaman a y d?',
    'Se llaman extremos. Los terminos b y c se llaman medios. Se cumple que a x d = b x c (propiedad fundamental).'),
(8, 'Dos numeros estan en la razon 3:5 y su suma es 64. Halla los numeros.',
    'Si los numeros son 3k y 5k: 3k + 5k = 64, 8k = 64, k = 8. Los numeros son 24 y 40.'),
(8, 'Que es una proporcion geometrica continua?',
    'Es cuando los medios son iguales: a/b = b/c. El termino b se llama media proporcional o media geometrica de a y c. Se cumple b^2 = a x c.'),
-- Aritmetica: Regla de tres (tema 9)
(9, 'Si 5 obreros hacen una obra en 12 dias, en cuantos dias la harian 10 obreros?',
    'Es regla de tres inversa: 5 x 12 = 10 x d, d = 6 dias. A mas obreros, menos dias.'),
(9, 'Cual es la diferencia entre regla de tres simple directa e inversa?',
    'Directa: al aumentar una magnitud, la otra tambien aumenta proporcionalmente. Inversa: al aumentar una magnitud, la otra disminuye proporcionalmente.'),
(9, 'Si 3 kg de arroz cuestan 9 soles, cuanto cuestan 7 kg?',
    'Es regla de tres directa: 3/9 = 7/x, x = 9 x 7/3 = 21 soles.');
