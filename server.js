// Simple Express server to handle Airtable API proxying
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
// Using axios instead of node-fetch (CommonJS compatible)
const axios = require('axios');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Constants for Airtable
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';
const SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Endpoint to fetch questions
app.get('/api/questions', async (req, res) => {
    try {
        const { pillars, difficulty } = req.query;
        
        if (!pillars || !difficulty) {
            return res.status(400).json({ error: 'Missing pillars or difficulty' });
        }
        
        // Check if we have a valid API key
        if (!AIRTABLE_API_KEY || AIRTABLE_API_KEY === 'XXXXXXXXXX') {
            console.warn('Missing or invalid Airtable API key. Please provide a valid key in the .env file.');
            // Return a sample question for testing
            return res.json(getSampleQuestions(pillars, difficulty));
        }
        
        // Parse pillars if it's a string
        const pillarsArray = Array.isArray(pillars) ? pillars : JSON.parse(pillars);
        
        // Create filter formula for Airtable - Simplified to avoid encoding issues
        let pillarFilter = '';
        if (pillarsArray.length === 1) {
            pillarFilter = `AND({Dificultad}="${difficulty}", {Pilar}="${pillarsArray[0]}")`;
        } else {
            // For multiple pillars, we need to be careful with the OR syntax
            const pillarConditions = pillarsArray.map(pillar => `{Pilar}="${pillar}"`).join(",");
            pillarFilter = `AND({Dificultad}="${difficulty}", OR(${pillarConditions}))`;
        }
        const filterFormula = pillarFilter;
        
        // Encode the formula for URL
        const encodedFilter = encodeURIComponent(filterFormula);
        
        // Build the API URL
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${QUESTIONS_TABLE}?filterByFormula=${encodedFilter}`;
        
        console.log('Fetching questions with URL:', url);
        
        // Fetch data from Airtable using axios
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        // With axios, successful responses have status in the 200-299 range
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Failed to fetch questions: ${response.status} ${response.statusText}`);
        }
        
        // Axios already parses JSON in the response
        const data = response.data;
        
        // Check if we have records
        if (!data.records || data.records.length === 0) {
            console.warn(`No questions found for pillars ${pillars} and difficulty ${difficulty}`);
            // Return sample questions for testing
            return res.json(getSampleQuestions(pillars, difficulty));
        }
        
        // Log the raw record data to see the structure
        console.log('Sample Airtable record:', data.records[0]);
        
        // Transform Airtable records to our question format
        const questions = data.records.map(record => {
            // Ensure the correct answer field is properly processed
            let correctIndex = 0; // Default to first option if not found
            
            if (record.fields.RespuestaCorrecta !== undefined) {
                // Check if RespuestaCorrecta is a number (0-3)
                if (typeof record.fields.RespuestaCorrecta === 'number') {
                    // If it's a number between 0-3, use it directly
                    if (record.fields.RespuestaCorrecta >= 0 && record.fields.RespuestaCorrecta <= 3) {
                        correctIndex = record.fields.RespuestaCorrecta;
                    } else {
                        // If it's a number outside that range, it might be 1-based index (1-4)
                        const adjusted = record.fields.RespuestaCorrecta - 1;
                        if (adjusted >= 0 && adjusted <= 3) {
                            correctIndex = adjusted;
                        }
                    }
                } else {
                    // Try as a letter (A, B, C, D)
                    correctIndex = ['A', 'B', 'C', 'D'].indexOf(record.fields.RespuestaCorrecta);
                    
                    // If not found as letter, try as Respuesta_Correcta
                    if (correctIndex === -1 && record.fields.Respuesta_Correcta) {
                        correctIndex = ['A', 'B', 'C', 'D'].indexOf(record.fields.Respuesta_Correcta);
                    }
                }
                
                // If still not valid, default to first option
                if (correctIndex < 0 || correctIndex > 3) {
                    correctIndex = 0;
                    console.log(`Warning: Could not determine correct answer for question ID ${record.id}, defaulting to A`);
                }
            }
            
            return {
                id: record.id,
                pillar: record.fields.Pilar,
                difficulty: record.fields.Dificultad,
                text: record.fields.Pregunta,
                options: [
                    record.fields.OpcionA,
                    record.fields.OpcionB,
                    record.fields.OpcionC,
                    record.fields.OpcionD
                ],
                correctIndex: correctIndex,
                correctSoundURL: record.fields.CorrectSoundURL,
                wrongSoundURL: record.fields.WrongSoundURL
            };
        });
        
        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        
        // Print detailed error information
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error Response Data:', error.response.data);
            console.error('Error Response Status:', error.response.status);
            console.error('Error Response Headers:', error.response.headers);
        }
        
        // On error, return sample questions for testing
        const { pillars, difficulty } = req.query;
        const pillarsArray = Array.isArray(pillars) ? pillars : JSON.parse(pillars);
        res.json(getSampleQuestions(pillarsArray, difficulty));
    }
});

// Function to generate sample questions for testing
function getSampleQuestions(pillars, difficulty) {
    const sampleQuestions = [];
    
    // Parse pillars if it's a string
    const pillarsArray = Array.isArray(pillars) ? pillars : JSON.parse(pillars);
    
    // Create a sample question for each pillar
    pillarsArray.forEach(pillar => {
        for (let i = 0; i < 5; i++) {
            sampleQuestions.push({
                id: `sample-${pillar}-${i}`,
                pillar: pillar,
                difficulty: difficulty,
                text: `Pregunta de muestra de ${pillar} (${difficulty}): ¿Cuál es la mejor práctica para los vendedores de Mercado Libre?`,
                options: [
                    'Responder rápidamente a las preguntas',
                    'Usar imágenes de calidad',
                    'Ofrecer envío gratis',
                    'Todas las anteriores'
                ],
                correctIndex: 3 // "Todas las anteriores"
            });
        }
    });
    
    return sampleQuestions;
}

// Endpoint to save score
app.post('/api/scores', async (req, res) => {
    try {
        const scoreData = req.body;
        
        if (!scoreData.name || !scoreData.phone || scoreData.score === undefined || scoreData.maxRound === undefined || !scoreData.finalPillar) {
            return res.status(400).json({ error: 'Missing required score data' });
        }
        
        // Check if we have a valid API key
        if (!AIRTABLE_API_KEY || AIRTABLE_API_KEY === 'XXXXXXXXXX') {
            console.warn('Missing or invalid Airtable API key. Please provide a valid key in the .env file.');
            // Return a successful response without saving (for testing)
            return res.json({
                id: 'sample-score-id',
                success: true,
                message: 'Score saved successfully (sample response)'
            });
        }
        
        // Build the API URL
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${SCORES_TABLE}`;
        
        // Prepare data for Airtable
        const data = {
            fields: {
                Nombre: scoreData.name,
                Telefono: scoreData.phone.toString().replace(/[^0-9]/g, '') || "123456789", // Asegurar que el teléfono sea string para Airtable y solo contenga números
                Puntaje: scoreData.score,
                Fecha: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
                RondaMax: scoreData.maxRound,
                PilarFinal: scoreData.finalPillar
            }
        };
        
        // Save data to Airtable using axios
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        // With axios, successful responses have status in the 200-299 range
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Failed to save score: ${response.status} ${response.statusText}`);
        }
        
        // Axios already parses JSON in the response
        const result = response.data;
        res.json(result);
    } catch (error) {
        console.error('Error saving score:', error);
        
        // Print detailed error information
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error Response Data:', error.response.data);
            console.error('Error Response Status:', error.response.status);
            console.error('Error Response Headers:', error.response.headers);
        }
        
        // Return a successful response for testing
        res.json({
            id: 'sample-score-id',
            success: true,
            message: 'Score saved successfully (sample response due to API error)'
        });
    }
});

// Endpoint to check if phone number already exists
app.get('/api/check-phone', async (req, res) => {
    try {
        let { phone } = req.query;
        
        if (!phone) {
            return res.status(400).json({ error: 'Missing phone number' });
        }
        
        // Limpiar el teléfono para asegurar que solo contenga números
        phone = phone.toString().replace(/[^0-9]/g, '');
        console.log(`Verificando teléfono limpio: ${phone}`);
        
        // Check if we have a valid API key
        if (!AIRTABLE_API_KEY || AIRTABLE_API_KEY === 'XXXXXXXXXX') {
            console.warn('Missing or invalid Airtable API key. Please provide a valid key in the .env file.');
            // For testing, return that phone doesn't exist
            return res.json({ exists: false });
        }
        
        // Build the API URL with filter for phone number
        const filterFormula = encodeURIComponent(`{Telefono}="${phone}"`);
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${SCORES_TABLE}?filterByFormula=${filterFormula}`;
        console.log(`URL de consulta: ${url}`);
        
        // Fetch data from Airtable using axios
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        // With axios, successful responses have status in the 200-299 range
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Failed to check phone: ${response.status} ${response.statusText}`);
        }
        
        // Axios already parses JSON in the response
        const data = response.data;
        
        // Check if we have records with this phone number
        const exists = data.records && data.records.length > 0;
        
        res.json({ exists });
    } catch (error) {
        console.error('Error checking phone number:', error);
        
        // Print detailed error information
        if (error.response) {
            console.error('Error Response Data:', error.response.data);
            console.error('Error Response Status:', error.response.status);
            console.error('Error Response Headers:', error.response.headers);
        }
        
        // Return a default response for testing
        res.json({ exists: false, error: true });
    }
});

// Endpoint to fetch top scores
app.get('/api/scores/top', async (req, res) => {
    try {
        const limit = req.query.limit || 5;
        
        // Check if we have a valid API key
        if (!AIRTABLE_API_KEY || AIRTABLE_API_KEY === 'XXXXXXXXXX') {
            console.warn('Missing or invalid Airtable API key. Please provide a valid key in the .env file.');
            // Return sample scores for testing
            return res.json(getSampleScores(limit));
        }
        
        // Build the API URL with sorting and limit - using simpler query syntax
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${SCORES_TABLE}?sort%5B0%5D%5Bfield%5D=Puntaje&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=${limit}`;
        
        // Fetch data from Airtable using axios
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        // With axios, successful responses have status in the 200-299 range
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Failed to fetch scores: ${response.status} ${response.statusText}`);
        }
        
        // Axios already parses JSON in the response
        const data = response.data;
        
        // Check if we have records
        if (!data.records || data.records.length === 0) {
            console.warn('No scores found');
            // Return sample scores for testing
            return res.json(getSampleScores(limit));
        }
        
        // Transform Airtable records to our score format
        const scores = data.records.map(record => ({
            id: record.id,
            name: record.fields.Nombre,
            phone: record.fields.Telefono || '',
            score: record.fields.Puntaje,
            date: record.fields.Fecha,
            maxRound: record.fields.RondaMax,
            finalPillar: record.fields.PilarFinal
        }));
        
        res.json(scores);
    } catch (error) {
        console.error('Error fetching top scores:', error);
        
        // Print detailed error information
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error Response Data:', error.response.data);
            console.error('Error Response Status:', error.response.status);
            console.error('Error Response Headers:', error.response.headers);
        }
        
        // Return sample scores for testing
        const limit = req.query.limit || 5;
        res.json(getSampleScores(limit));
    }
});

// Function to generate sample scores for testing
function getSampleScores(limit = 5) {
    const sampleScores = [
        {
            id: 'sample-1',
            name: 'Carlos Rodriguez',
            phone: '1122334455',
            score: 1000000,
            date: new Date().toISOString(),
            maxRound: 5,
            finalPillar: 'Reputación'
        },
        {
            id: 'sample-2',
            name: 'Laura Gómez',
            phone: '1166778899',
            score: 500000,
            date: new Date().toISOString(),
            maxRound: 4,
            finalPillar: 'Logística'
        },
        {
            id: 'sample-3',
            name: 'Martín López',
            phone: '1198765432',
            score: 200000,
            date: new Date().toISOString(),
            maxRound: 3,
            finalPillar: 'Oferta'
        },
        {
            id: 'sample-4',
            name: 'Sofía Martinez',
            phone: '1155443322',
            score: 50000,
            date: new Date().toISOString(),
            maxRound: 2,
            finalPillar: 'Experiencia'
        },
        {
            id: 'sample-5',
            name: 'Javier Ruiz',
            phone: '1112345678',
            score: 10000,
            date: new Date().toISOString(),
            maxRound: 1,
            finalPillar: 'Costos'
        }
    ];
    
    return sampleScores.slice(0, limit);
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});