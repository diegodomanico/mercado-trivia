const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar funciones de API para Airtable
const {
    fetchQuestions,
    fetchAllGameQuestions,
    validatePhone,
    saveScore,
    fetchTopScores
} = require('./api');

// Importar función para cargar preguntas desde CSV
const { loadQuestionsFromCSV } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Rutas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para verificar teléfono
app.get('/api/check-phone/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const cleanPhone = phone.replace(/\D/g, '');
        
        // El método validatePhone ahora devuelve un objeto { valid, message }
        const response = await validatePhone(cleanPhone);
        
        // Enviar la respuesta completa (valid + message)
        res.json(response);
    } catch (error) {
        console.error('Error verificando teléfono:', error);
        res.status(500).json({ 
            valid: false, 
            message: `Error al verificar el teléfono: ${error.message}` 
        });
    }
});

// Endpoint para obtener preguntas
app.get('/api/questions', async (req, res) => {
    try {
        const allQuestions = await fetchAllGameQuestions();
        
        // Verificar si hay datos suficientes
        if (!allQuestions.total || allQuestions.total === 0) {
            console.log('No se encontraron preguntas en Airtable');
            // Enviamos un código 200 pero con una propiedad que indique que faltan datos
            allQuestions.error = 'No hay preguntas disponibles en Airtable.';
        }
        
        res.json(allQuestions);
    } catch (error) {
        console.error('Error obteniendo preguntas:', error);
        res.status(500).json({ 
            error: error.message
        });
    }
});

// Endpoint para guardar puntaje
app.post('/api/scores', async (req, res) => {
    try {
        const scoreData = req.body;
        const savedScore = await saveScore(scoreData);
        res.json(savedScore);
    } catch (error) {
        console.error('Error guardando puntaje:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para obtener mejores puntajes
app.get('/api/top-scores', async (req, res) => {
    try {
        const limit = req.query.limit || 5;
        const scores = await fetchTopScores(limit);
        res.json(scores);
    } catch (error) {
        console.error('Error obteniendo mejores puntajes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ya no necesitamos este endpoint porque obtenemos la clave directamente del entorno
// app.get('/api/airtable-key', (req, res) => {
//     try {
//         if (!process.env.AIRTABLE_API_KEY) {
//             throw new Error('AIRTABLE_API_KEY not set in environment variables');
//         }
//         res.json({ key: process.env.AIRTABLE_API_KEY });
//     } catch (error) {
//         console.error('Error obteniendo API key:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// Endpoint para cargar preguntas desde CSV
app.post('/api/load-questions-csv', async (req, res) => {
    try {
        const csvFilePath = './attached_assets/MELIXP_GAME_QUIEN_PREGUNTAS-Grid view 2025-03-30.csv';
        const result = await loadQuestionsFromCSV(csvFilePath);
        res.json(result);
    } catch (error) {
        console.error('Error cargando preguntas desde CSV:', error);
        res.status(500).json({ 
            error: error.message
        });
    }
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    console.log('Usando Airtable para obtener preguntas y almacenar datos');
    
    // Cargar preguntas desde CSV al iniciar el servidor
    try {
        const csvFilePath = './attached_assets/MELIXP_GAME_QUIEN_PREGUNTAS-Grid view 2025-03-30.csv';
        const result = await loadQuestionsFromCSV(csvFilePath);
        console.log('Preguntas cargadas desde CSV:', result.message);
    } catch (error) {
        console.error('Error cargando preguntas desde CSV al iniciar:', error);
    }
});