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
        
        // Create filter formula for Airtable
        const pillarFilter = pillarsArray.map(pillar => `{Pilar} = '${pillar}'`).join(' OR ');
        const difficultyFilter = `{Dificultad} = '${difficulty}'`;
        const filterFormula = `AND(${difficultyFilter}, OR(${pillarFilter}))`;  // Fixed the formula order
        
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
        
        // Transform Airtable records to our question format
        const questions = data.records.map(record => ({
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
            correctIndex: ['A', 'B', 'C', 'D'].indexOf(record.fields.RespuestaCorrecta),
            correctSoundURL: record.fields.CorrectSoundURL,
            wrongSoundURL: record.fields.WrongSoundURL
        }));
        
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
        
        if (!scoreData.name || scoreData.score === undefined || scoreData.maxRound === undefined || !scoreData.finalPillar) {
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
            records: [
                {
                    fields: {
                        Nombre: scoreData.name,
                        Puntaje: scoreData.score,
                        Fecha: new Date().toISOString(),
                        RondaMax: scoreData.maxRound,
                        PilarFinal: scoreData.finalPillar
                    }
                }
            ]
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
        
        // Build the API URL with sorting and limit
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${SCORES_TABLE}?sort[0][field]=Puntaje&sort[0][direction]=desc&maxRecords=${limit}`;
        
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
            score: 1000000,
            date: new Date().toISOString(),
            maxRound: 5,
            finalPillar: 'Reputación'
        },
        {
            id: 'sample-2',
            name: 'Laura Gómez',
            score: 500000,
            date: new Date().toISOString(),
            maxRound: 4,
            finalPillar: 'Logística'
        },
        {
            id: 'sample-3',
            name: 'Martín López',
            score: 200000,
            date: new Date().toISOString(),
            maxRound: 3,
            finalPillar: 'Oferta'
        },
        {
            id: 'sample-4',
            name: 'Sofía Martinez',
            score: 50000,
            date: new Date().toISOString(),
            maxRound: 2,
            finalPillar: 'Experiencia'
        },
        {
            id: 'sample-5',
            name: 'Javier Ruiz',
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