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
        
        // Parse pillars if it's a string
        const pillarsArray = Array.isArray(pillars) ? pillars : JSON.parse(pillars);
        
        // Create filter formula for Airtable
        const pillarFilter = pillarsArray.map(pillar => `{Pilar} = '${pillar}'`).join(' OR ');
        const difficultyFilter = `{Dificultad} = '${difficulty}'`;
        const filterFormula = `AND(${pillarFilter}, ${difficultyFilter})`;

        // Encode the formula for URL
        const encodedFilter = encodeURIComponent(filterFormula);
        
        // Build the API URL
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${QUESTIONS_TABLE}?filterByFormula=${encodedFilter}`;
        
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
            correctIndex: record.fields.RespuestaCorrecta,
            correctSoundURL: record.fields.CorrectSoundURL,
            wrongSoundURL: record.fields.WrongSoundURL
        }));
        
        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to save score
app.post('/api/scores', async (req, res) => {
    try {
        const scoreData = req.body;
        
        if (!scoreData.name || scoreData.score === undefined || scoreData.maxRound === undefined || !scoreData.finalPillar) {
            return res.status(400).json({ error: 'Missing required score data' });
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
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to fetch top scores
app.get('/api/scores/top', async (req, res) => {
    try {
        const limit = req.query.limit || 5;
        
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
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});