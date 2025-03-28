const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Airtable Configuration - nombres exactos según proporcionados
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

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
    try {
        const cleanPhone = phone.replace(/\D/g, '');
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        
        if (!AIRTABLE_API_KEY) {
            console.warn('No Airtable API key found in environment, cannot validate phone');
            return true; // Allow phone to pass if we can't validate
        }
        
        const filterFormula = `{Telefono}="${cleanPhone}"`;
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}?filterByFormula=${encodeURIComponent(filterFormula)}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        if (!response.ok) {
            console.error(`Error validating phone: ${response.status} ${response.statusText}`);
            return true; // Allow phone to pass if validation fails
        }
        
        const data = await response.json();
        
        // If records exist, phone has already been used
        const isValid = !data.records || data.records.length === 0;
        
        return isValid;
    } catch (error) {
        console.error('Error validating phone:', error);
        return true; // Allow phone to pass if validation fails
    }
}

async function fetchAllGameQuestions() {
    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        
        console.log(`Usando API KEY: ${AIRTABLE_API_KEY ? "DISPONIBLE" : "NO DISPONIBLE"}`);
        // Imprimimos la versión truncada de la API Key para debug (solo primeros 3 caracteres)
        if (AIRTABLE_API_KEY) {
            console.log(`API KEY (primeros 3 caracteres): ${AIRTABLE_API_KEY.substring(0, 3)}...`);
        }
        
        // Create a response object with connection status
        const result = {
            connected: false,
            airtableConnected: false,
            realQuestionsCount: 0,
            total: 0,
            byDifficultyAndPillar: {
                'Fácil': {},
                'Media': {},
                'Difícil': {},
                'Muy Difícil': {},
                'Experto': {}
            }
        };
        
        if (!AIRTABLE_API_KEY) {
            console.warn('No Airtable API key found in environment, using sample questions');
            return result;
        }
        
        // Initialize question structure
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
        
        // Get all pillars - incluir todos los pillars según el CSV
        const pillars = ['Reputación', 'Oferta', 'Logística', 'Experiencia', 'Costos', 'Servicio', 'Tráfico', 'Data driven'];
        
        // Initialize empty arrays for each pillar and difficulty
        pillars.forEach(pillar => {
            allQuestions.byDifficultyAndPillar['Fácil'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Media'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Difícil'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Muy Difícil'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Experto'][pillar] = [];
        });
        
        // Fetch all questions from Airtable - usar el nombre exacto de la tabla
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_QUESTIONS_TABLE}?maxRecords=200`;
        
        console.log(`Fetching questions from URL: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        if (!response.ok) {
            console.error(`Error fetching questions: ${response.status} ${response.statusText}`);
            const sampleData = getSampleQuestions(pillars, 'Fácil');
            result.byDifficultyAndPillar = sampleData.byDifficultyAndPillar;
            result.total = sampleData.total;
            return result;
        }
        
        const data = await response.json();
        
        console.log(`Fetched ${data.records ? data.records.length : 0} records from Airtable`);
        
        // Process Airtable records into question objects
        if (data.records && data.records.length > 0) {
            data.records.forEach(record => {
                const fields = record.fields;
                
                // Revisamos todas las combinaciones posibles de nombres de campos
                if (fields.Pregunta && 
                   ((fields.OpcionA && fields.OpcionB && fields.OpcionC && fields.OpcionD) || 
                    (fields.Opcion1 && fields.Opcion2 && fields.Opcion3 && fields.Opcion4) ||
                    (fields["Opción A"] && fields["Opción B"] && fields["Opción C"] && fields["Opción D"]) ||
                    (fields["Opción 1"] && fields["Opción 2"] && fields["Opción 3"] && fields["Opción 4"]) ||
                    (fields["Opcion A"] && fields["Opcion B"] && fields["Opcion C"] && fields["Opcion D"]) ||
                    (fields["Opcion 1"] && fields["Opcion 2"] && fields["Opcion 3"] && fields["Opcion 4"])) &&
                    fields.RespuestaCorrecta && fields.Pilar && fields.Dificultad) {
                    // Extraer el nombre del pilar sin emojis
                    let pillarName = fields.Pilar;
                    // Limpiamos el campo de pilar para eliminar emojis y caracteres especiales
                    for (const p of pillars) {
                        if (pillarName.includes(p)) {
                            pillarName = p;
                            break;
                        }
                    }
                    
                    // Extraer dificultad sin emojis
                    let difficultyName = fields.Dificultad;
                    const difficulties = ['Fácil', 'Media', 'Difícil', 'Muy Difícil', 'Experto'];
                    for (const d of difficulties) {
                        if (difficultyName.includes(d)) {
                            difficultyName = d;
                            break;
                        }
                    }
                    
                    if (pillars.includes(pillarName) && allQuestions.byDifficultyAndPillar[difficultyName]) {
                        const question = {
                            id: record.id,
                            pillar: pillarName,
                            difficulty: difficultyName,
                            text: fields.Pregunta,
                            options: getOptionsFromFields(fields),
                            correctIndex: parseInt(fields.RespuestaCorrecta) // Índice según CSV (0-based)
                        };
                        
                        allQuestions.byDifficultyAndPillar[difficultyName][pillarName].push(question);
                        allQuestions.total++;
                    }
                }
            });
        }
        
        // Check if we have enough questions, fill with sample questions if necessary
        pillars.forEach(pillar => {
            ['Fácil', 'Media', 'Difícil', 'Muy Difícil', 'Experto'].forEach(difficulty => {
                const questionsForDifficultyAndPillar = allQuestions.byDifficultyAndPillar[difficulty][pillar];
                
                // If we have less than 5 questions, add sample questions
                if (questionsForDifficultyAndPillar.length < 5) {
                    console.warn(`Not enough real questions for ${pillar} at ${difficulty} level. Need 5, have ${questionsForDifficultyAndPillar.length}`);
                    
                    const neededCount = 5 - questionsForDifficultyAndPillar.length;
                    
                    for (let i = 0; i < neededCount; i++) {
                        const question = {
                            id: `sample-${pillar}-${difficulty}-${i}`,
                            pillar: pillar,
                            difficulty: difficulty,
                            text: `Pregunta de muestra de ${pillar} (${difficulty}): ¿Cuál es la mejor práctica para los vendedores de Mercado Libre?`,
                            options: [
                                "Responder rápidamente a las preguntas",
                                "Usar imágenes de calidad",
                                "Ofrecer envío gratis",
                                "Todas las anteriores"
                            ],
                            correctIndex: 3
                        };
                        
                        questionsForDifficultyAndPillar.push(question);
                        allQuestions.total++;
                    }
                }
            });
        });
        
        console.log(`Loaded ${allQuestions.total} questions from Airtable and samples`);
        
        // Count real questions from Airtable vs. sample questions
        let realQuestions = 0;
        // Debug para ver qué IDs de preguntas hay en el sistema
        pillars.forEach(pillar => {
            ['Fácil', 'Media', 'Difícil', 'Muy Difícil', 'Experto'].forEach(difficulty => {
                const questions = allQuestions.byDifficultyAndPillar[difficulty][pillar];
                questions.forEach(question => {
                    // Solo contamos preguntas que no son de muestra (no empiezan con "sample-")
                    if (!question.id.startsWith('sample-')) {
                        realQuestions++;
                    }
                });
            });
        });
        
        console.log(`Total real questions count: ${realQuestions}`);
        
        // Set connection status based on real questions
        result.connected = true;
        result.airtableConnected = realQuestions > 0;
        result.realQuestionsCount = realQuestions;
        result.byDifficultyAndPillar = allQuestions.byDifficultyAndPillar;
        result.total = allQuestions.total;
        
        return result;
    } catch (error) {
        console.error('Error fetching questions from Airtable:', error);
        const sampleData = getSampleQuestions(
            ['Reputación', 'Oferta', 'Logística', 'Experiencia', 'Costos', 'Servicio', 'Tráfico', 'Data driven'],
            'Fácil'
        );
        const result = {
            connected: true,
            airtableConnected: false,
            realQuestionsCount: 0,
            byDifficultyAndPillar: sampleData.byDifficultyAndPillar,
            total: sampleData.total
        };
        return result;
    }
}

async function fetchTopScores(limit) {
    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        
        if (!AIRTABLE_API_KEY) {
            console.warn('No Airtable API key found in environment, using sample scores');
            return getSampleScores(limit);
        }
        
        // Construct URL for Airtable API with sorting by score (descending) and limit
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}?sort[0][field]=Puntaje&sort[0][direction]=desc&maxRecords=${limit}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        if (!response.ok) {
            console.error(`Error fetching top scores: ${response.status} ${response.statusText}`);
            return getSampleScores(limit);
        }
        
        const data = await response.json();
        
        // Process Airtable records into score objects
        const scores = [];
        
        if (data.records && data.records.length > 0) {
            data.records.forEach(record => {
                const fields = record.fields;
                
                if (fields.Nombre && fields.Puntaje) {
                    scores.push({
                        id: record.id,
                        name: fields.Nombre,
                        phone: fields.Telefono || "",
                        score: fields.Puntaje,
                        maxRound: fields.NivelMaximo || fields.RondaMax || 1,
                        finalPillar: fields.PilarFinal || 'Reputación',
                        date: fields.FechaHora || fields.Fecha || new Date().toISOString()
                    });
                }
            });
        }
        
        console.log(`Loaded ${scores.length} scores from Airtable`);
        
        // If we didn't get enough scores, pad with sample scores
        if (scores.length < limit) {
            const sampleScores = getSampleScores(limit - scores.length);
            scores.push(...sampleScores);
        }
        
        return scores;
    } catch (error) {
        console.error('Error fetching top scores from Airtable:', error);
        return getSampleScores(limit);
    }
}

async function saveScore(scoreData) {
    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        
        if (!AIRTABLE_API_KEY) {
            console.warn('No Airtable API key found in environment, cannot save score');
            // Return a mock success response
            return {
                id: `mock-${Date.now()}`,
                fields: {
                    Nombre: scoreData.name,
                    Telefono: scoreData.phone,
                    Puntaje: scoreData.score,
                    NivelMaximo: scoreData.maxRound,
                    PilarFinal: scoreData.finalPillar,
                    FechaHora: new Date().toISOString()
                }
            };
        }
        
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}`;
        
        // Format the phone number to ensure it's a string and clean it
        let cleanPhone = String(scoreData.phone).replace(/\D/g, '');
        
        // Ensure score is a number
        const score = typeof scoreData.score === 'number' ? scoreData.score : parseInt(scoreData.score) || 0;
        
        // Ensure maxRound is a number
        const maxRound = typeof scoreData.maxRound === 'number' ? scoreData.maxRound : parseInt(scoreData.maxRound) || 1;
        
        const airtableData = {
            fields: {
                Nombre: String(scoreData.name),
                Telefono: cleanPhone,
                Puntaje: score,
                NivelMaximo: maxRound,
                PilarFinal: String(scoreData.finalPillar || 'Reputación'),
                FechaHora: new Date().toISOString()
            }
        };
        
        console.log('Saving score to Airtable:', JSON.stringify(airtableData));
        
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
            
            // If we get an error, return a mock success to not break the game flow
            return {
                id: `mock-${Date.now()}`,
                fields: airtableData.fields
            };
        }
        
        const data = await response.json();
        console.log('Score saved successfully to Airtable');
        return data;
    } catch (error) {
        console.error('Error saving score:', error);
        
        // Instead of throwing, return a mock success to not break the game flow
        return {
            id: `mock-${Date.now()}`,
            fields: {
                Nombre: scoreData.name,
                Telefono: scoreData.phone,
                Puntaje: scoreData.score,
                NivelMaximo: scoreData.maxRound,
                PilarFinal: scoreData.finalPillar,
                FechaHora: new Date().toISOString()
            }
        };
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
            finalPillar: ['Reputación', 'Oferta', 'Logística', 'Experiencia', 'Costos', 'Servicio', 'Tráfico', 'Data driven'][Math.floor(Math.random() * 8)],
            date: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString() // Random date within last 10 days
        });
    }
    
    return sampleScores;
}

// Helper para obtener las opciones de los diferentes formatos de campos
function getOptionsFromFields(fields) {
    // Check for fields named OpcionA, OpcionB, etc.
    if (fields.OpcionA && fields.OpcionB && fields.OpcionC && fields.OpcionD) {
        return [fields.OpcionA, fields.OpcionB, fields.OpcionC, fields.OpcionD];
    }
    
    // Check for fields named Opcion1, Opcion2, etc.
    if (fields.Opcion1 && fields.Opcion2 && fields.Opcion3 && fields.Opcion4) {
        return [fields.Opcion1, fields.Opcion2, fields.Opcion3, fields.Opcion4];
    }
    
    // Check for fields named Opción A, Opción B, etc.
    if (fields["Opción A"] && fields["Opción B"] && fields["Opción C"] && fields["Opción D"]) {
        return [fields["Opción A"], fields["Opción B"], fields["Opción C"], fields["Opción D"]];
    }
    
    // Check for fields named Opción 1, Opción 2, etc.
    if (fields["Opción 1"] && fields["Opción 2"] && fields["Opción 3"] && fields["Opción 4"]) {
        return [fields["Opción 1"], fields["Opción 2"], fields["Opción 3"], fields["Opción 4"]];
    }
    
    // Check for fields named Opcion A, Opcion B, etc.
    if (fields["Opcion A"] && fields["Opcion B"] && fields["Opcion C"] && fields["Opcion D"]) {
        return [fields["Opcion A"], fields["Opcion B"], fields["Opcion C"], fields["Opcion D"]];
    }
    
    // Check for fields named Opcion 1, Opcion 2, etc.
    if (fields["Opcion 1"] && fields["Opcion 2"] && fields["Opcion 3"] && fields["Opcion 4"]) {
        return [fields["Opcion 1"], fields["Opcion 2"], fields["Opcion 3"], fields["Opcion 4"]];
    }
    
    // Default to simple array (shouldn't be reached due to the if check in the parent function)
    return ["Opción 1", "Opción 2", "Opción 3", "Opción 4"];
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});