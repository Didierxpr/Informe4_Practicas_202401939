USE mi_base_de_datos;

-- ================================
-- TABLA: CATEDRATICO
-- ================================
CREATE TABLE IF NOT EXISTS catedratico (
    id_catedratico INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    facultad VARCHAR(150) NOT NULL,
    fecha_registro DATE NOT NULL
);

-- ================================
-- TABLA: ESTUDIANTE
-- ================================
CREATE TABLE IF NOT EXISTS estudiante (
    id_estudiante INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    carnet VARCHAR(50) NOT NULL,
    correo VARCHAR(150) NOT NULL
);

-- ================================
-- TABLA: CURSO
-- ================================
CREATE TABLE IF NOT EXISTS curso (
    id_curso INT AUTO_INCREMENT PRIMARY KEY,
    nombre_curso VARCHAR(150) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    creditos INT NOT NULL,
    id_catedratico INT NOT NULL,
    FOREIGN KEY (id_catedratico) REFERENCES catedratico(id_catedratico)
);

-- ================================
-- TABLA: PUBLICACION
-- ================================
CREATE TABLE IF NOT EXISTS publicacion (
    id_publicacion INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    fecha_publicacion DATE NOT NULL,
    id_catedratico INT NOT NULL,
    id_curso INT NOT NULL,
    FOREIGN KEY (id_catedratico) REFERENCES catedratico(id_catedratico),
    FOREIGN KEY (id_curso) REFERENCES curso(id_curso)
);

-- ================================
-- TABLA: COMENTARIO
-- ================================
CREATE TABLE IF NOT EXISTS comentario (
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    contenido TEXT NOT NULL,
    fecha DATE NOT NULL,
    id_publicacion INT NOT NULL,
    id_estudiante INT NOT NULL,
    FOREIGN KEY (id_publicacion) REFERENCES publicacion(id_publicacion),
    FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante)
);

-- ================================
-- TABLA: CURSO_APROBADO
-- ================================
CREATE TABLE IF NOT EXISTS curso_aprobado (
    id_aprobado INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_curso INT NOT NULL,
    nota DECIMAL(5,2) NOT NULL,
    fecha_aprobacion DATE NOT NULL,
    FOREIGN KEY (id_estudiante) REFERENCES estudiante(id_estudiante),
    FOREIGN KEY (id_curso) REFERENCES curso(id_curso)
);