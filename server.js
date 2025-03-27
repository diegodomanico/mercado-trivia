const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Key Endpoint (secure sharing of API key)
app.get('/api/airtable-key', (req, res) => {
    // Get API key from environment variable
    const apiKey = process.env.AIRTABLE_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API key is not configured' });
    }
    
    res.json({ key: apiKey });
});

// Check Phone Endpoint
app.get('/api/check-phone/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const cleanPhone = phone.replace(/\D/g, '');
        
        const response = await validatePhone(cleanPhone);
        res.json({ valid: response });
    } catch (error) {
        console.error('Error checking phone:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Questions Endpoint
app.get('/api/questions', async (req, res) => {
    try {
        const allQuestions = await fetchAllGameQuestions();
        res.json(allQuestions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save Score Endpoint
app.post('/api/scores', async (req, res) => {
    try {
        const scoreData = req.body;
        const savedScore = await saveScore(scoreData);
        res.json(savedScore);
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Top Scores Endpoint
app.get('/api/top-scores', async (req, res) => {
    try {
        const limit = req.query.limit || 5;
        const scores = await fetchTopScores(limit);
        res.json(scores);
    } catch (error) {
        console.error('Error fetching top scores:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper Functions for API Integration
async function validatePhone(phone) {
    // Replicating the function from api.js on the server side
    try {
        const cleanPhone = phone.replace(/\D/g, '');
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
        const AIRTABLE_TABLE_NAME = 'MELIXP_GAME_QUIEN_PUNTAJES';
        
        const filterFormula = `{Telefono}="${cleanPhone}"`;
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${encodeURIComponent(filterFormula)}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        if (!response.ok) {
            console.error(`Error validating phone: ${response.status} ${response.statusText}`);
            return true;
        }
        
        const data = await response.json();
        
        // If records exist, phone has already been used
        const isValid = !data.records || data.records.length === 0;
        
        return isValid;
    } catch (error) {
        console.error('Error validating phone:', error);
        return true;
    }
}

async function fetchAllGameQuestions() {
    // For the server side, we need a simpler implementation
    return getSampleQuestions(
        ['Reputación', 'Oferta', 'Logística', 'Experiencia', 'Costos'],
        'Fácil'
    );
}

async function fetchTopScores(limit) {
    // For the server side, we need a simpler implementation
    return getSampleScores(limit);
}

async function saveScore(scoreData) {
    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
        const AIRTABLE_TABLE_NAME = 'MELIXP_GAME_QUIEN_PUNTAJES';
        
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
        
        const airtableData = {
            fields: {
                Nombre: scoreData.name,
                Telefono: scoreData.phone,
                Puntaje: scoreData.score,
                NivelMaximo: scoreData.maxRound,
                PilarFinal: scoreData.finalPillar,
                FechaHora: new Date().toISOString()
            }
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airtableData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error Response Data:', errorText);
            console.error('Error Response Status:', response.status);
            console.error('Error Response Headers:', response.headers);
            throw new Error(`Error saving score: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error saving score:', error);
        throw error;
    }
}

function getSampleQuestions(pillars, difficulty) {
    const allQuestions = {
        total: 0,
        byDifficultyAndPillar: {
            'Fácil': {},
            'Media': {},
            'Difícil': {},
            'Muy Difícil': {},
            'Experto': {}
        }
    };
    
    // Initialize empty arrays for each pillar and difficulty
    pillars.forEach(pillar => {
        allQuestions.byDifficultyAndPillar['Fácil'][pillar] = [];
        allQuestions.byDifficultyAndPillar['Media'][pillar] = [];
        allQuestions.byDifficultyAndPillar['Difícil'][pillar] = [];
        allQuestions.byDifficultyAndPillar['Muy Difícil'][pillar] = [];
        allQuestions.byDifficultyAndPillar['Experto'][pillar] = [];
    });
    
    // Add sample questions
    pillars.forEach((pillar, pillarIndex) => {
        // For each difficulty level
        ['Fácil', 'Media', 'Difícil', 'Muy Difícil', 'Experto'].forEach((diffLevel, diffIndex) => {
            // Add 5 sample questions per difficulty and pillar
            for (let i = 0; i < 5; i++) {
                const question = {
                    id: `sample-${pillar}-${diffLevel}-${i}`,
                    pillar: pillar,
                    difficulty: diffLevel,
                    text: `Pregunta de muestra de ${pillar} (${diffLevel}): ¿Cuál es la mejor práctica para los vendedores de Mercado Libre?`,
                    options: [
                        "Responder rápidamente a las preguntas",
                        "Usar imágenes de calidad",
                        "Ofrecer envío gratis",
                        "Todas las anteriores"
                    ],
                    correctIndex: 3
                };
                
                allQuestions.byDifficultyAndPillar[diffLevel][pillar].push(question);
                allQuestions.total++;
            }
        });
    });
    
    return allQuestions;
}

function getSampleScores(limit = 5) {
    const sampleScores = [];
    
    for (let i = 0; i < limit; i++) {
        sampleScores.push({
            id: `sample-${i}`,
            name: `Jugador ${i + 1}`,
            phone: `1155${i}${i}${i}${i}${i}${i}`,
            score: Math.floor(Math.random() * 5) + 1, // 1-5 chances
            maxRound: Math.floor(Math.random() * 5) + 1, // Rounds 1-5
            finalPillar: ['Reputación', 'Oferta', 'Logística', 'Experiencia', 'Costos'][Math.floor(Math.random() * 5)],
            date: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString() // Random date within last 10 days
        });
    }
    
    return sampleScores;
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});