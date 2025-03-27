// API functions for interacting with Airtable
const axios = require('axios');
require('dotenv').config();

// Get environment variables
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF'; // Mercado Libre Game base ID
const QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';
const SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

/**
 * Validates that we have all the required API keys
 * @returns {boolean} True if all keys are present
 */
function validateApiKeys() {
    if (!AIRTABLE_API_KEY) {
        console.error('API Error: Missing AIRTABLE_API_KEY. Please check .env file.');
        return false;
    }
    return true;
}

/**
 * Fetches questions from Airtable based on specified criteria
 * @param {Array} pillars - List of pillars to fetch questions for
 * @param {String} difficulty - Difficulty level to fetch
 * @returns {Promise<Array>} - Array of question objects
 */
async function fetchQuestions(pillars, difficulty) {
    if (!validateApiKeys()) {
        throw new Error('Missing API keys');
    }

    try {
        // Build filter formula for the Airtable API
        let pillarFilter = pillars.map(pillar => `{Pilar}='${pillar}'`).join(',');
        let filterByFormula = `AND({Dificultad}='${difficulty}', OR(${pillarFilter}))`;
        
        // URL encode the filter formula
        filterByFormula = encodeURIComponent(filterByFormula);

        // Build the API URL with filter
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${QUESTIONS_TABLE}?filterByFormula=${filterByFormula}&maxRecords=100`;
        
        // Fetch questions from Airtable
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        // Transform Airtable records to our question format
        const questions = response.data.records.map(record => ({
            id: record.id,
            text: record.fields.Pregunta,
            pillar: record.fields.Pilar,
            difficulty: record.fields.Dificultad,
            options: [
                record.fields.OpcionA,
                record.fields.OpcionB,
                record.fields.OpcionC,
                record.fields.OpcionD
            ],
            correctIndex: ['A', 'B', 'C', 'D'].indexOf(record.fields.RespuestaCorrecta)
        }));
        
        return questions;
    } catch (error) {
        console.error('Error fetching questions:', error);
        throw error;
    }
}

/**
 * Fetches all questions needed for the game
 * @returns {Promise<Object>} - Object containing questions grouped by difficulty and pillar
 */
async function fetchAllGameQuestions() {
    if (!validateApiKeys()) {
        throw new Error('Missing API keys');
    }
    
    try {
        // Get the pillars and difficulty levels from the config
        const pillars = GAME_STRUCTURE.pillars;
        const difficultyLevels = GAME_STRUCTURE.difficultyLevels;
        
        // Create structure to hold all questions
        const allQuestions = {
            total: 0,
            byDifficultyAndPillar: {}
        };
        
        // Fetch questions for each difficulty level
        for (const difficulty of difficultyLevels) {
            allQuestions.byDifficultyAndPillar[difficulty] = {};
            
            // Fetch questions for all pillars at this difficulty
            const questions = await fetchQuestions(pillars, difficulty);
            
            // Organize questions by pillar
            for (const pillar of pillars) {
                const pillarQuestions = questions.filter(q => q.pillar === pillar);
                allQuestions.byDifficultyAndPillar[difficulty][pillar] = pillarQuestions;
                allQuestions.total += pillarQuestions.length;
            }
        }
        
        return allQuestions;
    } catch (error) {
        console.error('Error fetching all game questions:', error);
        throw error;
    }
}

/**
 * Saves player score to Airtable
 * @param {Object} scoreData - Player score data
 * @returns {Promise<Object>} - Saved record
 */
async function saveScore(scoreData) {
    if (!validateApiKeys()) {
        throw new Error('Missing API keys');
    }
    
    try {
        // Format the date
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        
        // Prepare data for Airtable
        const data = {
            fields: {
                Nombre: scoreData.name,
                Telefono: scoreData.phone.toString().replace(/[^0-9]/g, ''), // Asegurar que el teléfono sea string y solo contenga números
                Puntaje: scoreData.score,
                Fecha: formattedDate,
                RondaMax: scoreData.maxRound,
                PilarFinal: scoreData.finalPillar
            }
        };
        
        // Build the API URL
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${SCORES_TABLE}`;
        
        // Save data to Airtable
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error saving score:', error);
        throw error;
    }
}

/**
 * Fetches top scores from Airtable
 * @param {Number} limit - Number of top scores to fetch
 * @returns {Promise<Array>} - Array of score objects
 */
async function fetchTopScores(limit = 5) {
    if (!validateApiKeys()) {
        throw new Error('Missing API keys');
    }
    
    try {
        // Build the API URL with sorting and limit
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${SCORES_TABLE}?sort[0][field]=Puntaje&sort[0][direction]=desc&maxRecords=${limit}`;
        
        // Fetch data from Airtable
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        // Transform Airtable records to our score format
        const scores = response.data.records.map(record => ({
            id: record.id,
            name: record.fields.Nombre,
            score: record.fields.Puntaje,
            date: record.fields.Fecha,
            maxRound: record.fields.RondaMax,
            finalPillar: record.fields.PilarFinal
        }));
        
        return scores;
    } catch (error) {
        console.error('Error fetching top scores:', error);
        throw error;
    }
}

module.exports = {
    fetchQuestions,
    fetchAllGameQuestions,
    saveScore,
    fetchTopScores
};