const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json()); // Para parsear JSON

// Crear un pool de conexiones a la base de datos MySQL
const pool = mysql.createPool({
    host: 'localhost',        // Usa localhost 
    user: 'Didiere',             // usuario de MySQL
    password: 'Didiere0508@', // contraseña de MySQL
    database: 'mi_base_de_datos', // Nombre de base de datos
    waitForConnections: true,
    connectionLimit: 10, // Número máximo de conexiones
    queueLimit: 0 // Sin límite de conexiones en espera
});

// Verifica la conexión al iniciar el servidor
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.stack);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
    connection.release(); // Libera la conexión después de la verificación
});

// Ruta para la página principal
app.get('/', (req, res) => {
    res.send('¡Servidor funcionando correctamente!');
});

// Ruta para registrar un estudiante
app.post('/register', (req, res) => {
    const { nombre, carnet, correo } = req.body;

    // Validación de los datos
    if (!nombre || !carnet || !correo) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Consulta SQL para insertar el estudiante
    const query = 'INSERT INTO estudiante (nombre, carnet, correo) VALUES (?, ?, ?)';
    pool.query(query, [nombre, carnet, correo], (err, result) => {
        if (err) {
            console.error('Error al registrar el estudiante:', err);
            return res.status(500).json({ message: 'Error al registrar el estudiante', error: err.message });
        }

        res.status(201).json({
            message: 'Estudiante registrado exitosamente',
            studentId: result.insertId,  // Devuelve el ID del nuevo estudiante
        });
    });
});

// Ruta GET para obtener todos los estudiantes
app.get('/students', async (req, res) => {
  try {
    // Realiza la consulta usando la versión basada en promesas de mysql2
    const [rows] = await pool.query('SELECT * FROM estudiante');
    res.status(200).json(rows); // Enviar los datos de los estudiantes como respuesta
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los estudiantes', error: error.message });
  }
});

// Iniciar el servidor
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});