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



// Iniciar el servidor
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});