const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar funciones de la base de datos
const { 
    validatePhone, 
    fetchAllGameQuestions, 
    saveScore, 
    fetchTopScores,
    loadQuestionsFromCSV
} = require('./db');

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
        
        const response = await validatePhone(cleanPhone);
        res.json({ valid: response });
    } catch (error) {
        console.error('Error verificando teléfono:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para obtener preguntas
app.get('/api/questions', async (req, res) => {
    try {
        const allQuestions = await fetchAllGameQuestions();
        res.json(allQuestions);
    } catch (error) {
        console.error('Error obteniendo preguntas:', error);
        res.status(500).json({ error: error.message });
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

// Endpoint para cargar preguntas desde CSV
app.get('/api/load-questions-from-csv', async (req, res) => {
    try {
        // Ruta al archivo CSV de preguntas
        const csvPath = path.join(__dirname, 'attached_assets', 'MELIXP_GAME_QUIEN_PREGUNTAS-Grid view (1).csv');
        const result = await loadQuestionsFromCSV(csvPath);
        res.json(result);
    } catch (error) {
        console.error('Error cargando preguntas desde CSV:', error);
        res.status(500).json({ error: error.message });
    }
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    
    // Cargar automáticamente las preguntas desde el CSV al iniciar
    const csvPath = path.join(__dirname, 'attached_assets', 'MELIXP_GAME_QUIEN_PREGUNTAS-Grid view (1).csv');
    loadQuestionsFromCSV(csvPath)
        .then(() => console.log('Iniciada carga de preguntas desde CSV'))
        .catch(err => console.error('Error iniciando carga de CSV:', err));
});