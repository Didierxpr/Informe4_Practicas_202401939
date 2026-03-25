const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json()); // Middleware para parsear JSON
app.use(cors());

// Pool de conexión
const pool = mysql.createPool({
    host: 'localhost',
    user: 'Didiere',
    password: 'Didiere0508@',
    database: 'mi_base_de_datos',
    waitForConnections: true,
    connectionLimit: 10
});

// Verificar conexión
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conectado a MySQL');
        connection.release();
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
})();

// Ruta base
app.get('/', (req, res) => {
    res.send('Servidor funcionando');
});

// REGISTRO 
const bcrypt = require('bcrypt');

app.post('/register', async (req, res) => {
    try {
        const { nombre, carnet, correo, password } = req.body;

        if (!nombre || !carnet || !correo || !password) {
            return res.status(400).json({ message: 'Campos requeridos' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO estudiante (nombre, carnet, correo, password) VALUES (?, ?, ?, ?)',
            [nombre, carnet, correo, hashedPassword]
        );

        res.status(201).json({
            message: 'Usuario registrado',
            id: result.insertId
        });

    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

// OBTENER ESTUDIANTES
app.get('/students', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM estudiante');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error', error });
    }
});

app.listen(3001, () => {
    console.log('🚀 http://localhost:3001');
});

const jwt = require('jsonwebtoken');

app.post('/login', async (req, res) => {
    try {
        const { correo, password } = req.body;

        const [rows] = await pool.query(
            'SELECT * FROM estudiante WHERE correo = ?',
            [correo]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const user = rows[0];

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: user.id_estudiante, correo: user.correo },
            'secreto_super_seguro',
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id_estudiante: user.id_estudiante,
                nombre: user.nombre,
                correo: user.correo
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

app.post('/publicaciones', async (req, res) => {
    try {
        const { titulo, contenido, id_catedratico, id_curso, id_estudiante } = req.body;

        if (!titulo || !contenido || !id_estudiante) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        const [result] = await pool.query(
            `INSERT INTO publicacion 
            (titulo, contenido, fecha_publicacion, id_catedratico, id_curso, id_estudiante)
            VALUES (?, ?, NOW(), ?, ?, ?)`,
            [titulo, contenido, id_catedratico, id_curso, id_estudiante]
        );

        res.json({ message: 'Publicación creada', id: result.insertId });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/publicaciones', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, 
                   e.nombre AS estudiante,
                   c.nombre_curso,
                   cat.nombre AS catedratico
            FROM publicacion p
            JOIN estudiante e ON p.id_estudiante = e.id_estudiante
            LEFT JOIN curso c ON p.id_curso = c.id_curso
            LEFT JOIN catedratico cat ON p.id_catedratico = cat.id_catedratico
            ORDER BY p.fecha_publicacion DESC
        `);

        res.json(rows);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/publicaciones/curso/:id', async (req, res) => {
    const { id } = req.params;

    const [rows] = await pool.query(`
        SELECT * FROM publicacion
        WHERE id_curso = ?
    `, [id]);

    res.json(rows);
});

app.get('/publicaciones/catedratico/:id', async (req, res) => {
    const { id } = req.params;

    const [rows] = await pool.query(`
        SELECT * FROM publicacion
        WHERE id_catedratico = ?
    `, [id]);

    res.json(rows);
});

app.post('/comentarios', async (req, res) => {
    try {
        const { contenido, id_publicacion, id_estudiante } = req.body;

        const [result] = await pool.query(
            `INSERT INTO comentario 
            (contenido, fecha, id_publicacion, id_estudiante)
            VALUES (?, NOW(), ?, ?)`,
            [contenido, id_publicacion, id_estudiante]
        );

        res.json({ message: 'Comentario agregado' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/comentarios/:id_publicacion', async (req, res) => {
    const { id_publicacion } = req.params;

    const [rows] = await pool.query(`
        SELECT c.*, e.nombre
        FROM comentario c
        JOIN estudiante e ON c.id_estudiante = e.id_estudiante
        WHERE c.id_publicacion = ?
        ORDER BY c.fecha DESC
    `, [id_publicacion]);

    res.json(rows);
});

app.get('/perfil/:id', async (req, res) => {
    const { id } = req.params;

    const [usuario] = await pool.query(
        'SELECT * FROM estudiante WHERE id_estudiante = ?',
        [id]
    );

    const [cursos] = await pool.query(`
        SELECT c.nombre_curso, ca.nota
        FROM curso_aprobado ca
        JOIN curso c ON ca.id_curso = c.id_curso
        WHERE ca.id_estudiante = ?
    `, [id]);

    res.json({
        usuario: usuario[0],
        cursos
    });
});

app.post('/curso-aprobado', async (req, res) => {
    const { id_estudiante, id_curso, nota } = req.body;

    await pool.query(`
        INSERT INTO curso_aprobado 
        (id_estudiante, id_curso, nota, fecha_aprobacion)
        VALUES (?, ?, ?, NOW())
    `, [id_estudiante, id_curso, nota]);

    res.json({ message: 'Curso agregado' });
});

app.get('/cursos', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM curso');
    res.json(rows);
});

app.get('/catedraticos', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM catedratico');
    res.json(rows);
});