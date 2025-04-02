// Servidor Express que sirve archivos estáticos y proporciona API para el juego
const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Verificar clave API
console.log('AIRTABLE_API_KEY presente:', process.env.AIRTABLE_API_KEY ? 'Sí' : 'No');

// Constantes de Airtable
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// API para verificar el estado de la conexión
app.get('/api/status', async (req, res) => {
    try {
        const apiKey = process.env.AIRTABLE_API_KEY;
        
        if (!apiKey) {
            return res.status(400).json({
                connected: false,
                message: 'No hay clave API configurada'
            });
        }
        
        // Intentar hacer una llamada simple a Airtable
        const response = await axios.get(
            `${AIRTABLE_API_URL}/${AIRTABLE_QUESTIONS_TABLE}?maxRecords=1`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return res.json({
            connected: true,
            message: 'Conexión a Airtable funcionando correctamente',
            data: { recordCount: response.data.records.length }
        });
    } catch (error) {
        console.error('Error al verificar la conexión a Airtable:', error.message);
        return res.status(500).json({
            connected: false,
            message: 'Error al conectar con Airtable',
            error: error.message
        });
    }
});

// Obtener todas las preguntas para el juego
app.get('/api/questions', async (req, res) => {
    try {
        const apiKey = process.env.AIRTABLE_API_KEY;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'No hay clave API configurada'
            });
        }
        
        // Hacer consulta a Airtable para obtener todas las preguntas
        const response = await axios.get(
            `${AIRTABLE_API_URL}/${AIRTABLE_QUESTIONS_TABLE}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Procesar las preguntas recibidas
        const questions = processQuestions(response.data.records);
        
        return res.json({
            success: true,
            data: questions
        });
    } catch (error) {
        console.error('Error al obtener preguntas de Airtable:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener preguntas',
            error: error.message
        });
    }
});

// Validar número de teléfono
app.post('/api/validate-phone', async (req, res) => {
    try {
        const { phone } = req.body;
        const apiKey = process.env.AIRTABLE_API_KEY;
        
        if (!phone) {
            return res.status(400).json({
                valid: false,
                message: 'Número de teléfono no proporcionado'
            });
        }
        
        if (!apiKey) {
            return res.status(400).json({
                valid: false,
                message: 'No hay clave API configurada'
            });
        }
        
        // Intentar diferentes formatos de teléfono para la consulta
        const cleanPhone = String(phone).replace(/\D/g, '');
        const phoneFormats = [
            cleanPhone,                // Formato simple: 1151331242
            `+${cleanPhone}`,          // Con signo +: +1151331242
            `+54${cleanPhone}`         // Con prefijo país: +541151331242
        ];
        
        let existsInAnyFormat = false;
        
        // Probar con cada formato
        for (const phoneFormat of phoneFormats) {
            console.log(`Verificando formato: ${phoneFormat}`);
            
            // Consultar si el teléfono ya existe en este formato
            const response = await axios.get(
                `${AIRTABLE_API_URL}/${AIRTABLE_SCORES_TABLE}?filterByFormula={Telefono}="${phoneFormat}"`,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Si hay registros con este formato, el teléfono ya existe
            if (response.data.records && response.data.records.length > 0) {
                existsInAnyFormat = true;
                console.log(`Encontrado en formato: ${phoneFormat}`);
                break;
            }
        }
        
        // Si el teléfono no está presente en ningún formato, es válido
        if (!existsInAnyFormat) {
            return res.json({
                valid: true,
                message: 'Número de teléfono válido'
            });
        }
        
        // Si hay registros, el teléfono ya está registrado
        return res.json({
            valid: false,
            message: 'Este número de teléfono ya ha participado'
        });
    } catch (error) {
        console.error('Error al validar teléfono:', error.message);
        // En caso de error, permitir que el juego continúe devolviendo valid=true
        return res.json({
            valid: true,
            message: 'Teléfono aceptado por error en validación',
            error: error.message
        });
    }
});

// Guardar puntuación
app.post('/api/save-score', async (req, res) => {
    try {
        const { name, phone, prize, maxLevel, pillar } = req.body;
        const apiKey = process.env.AIRTABLE_API_KEY;
        
        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos'
            });
        }
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'No hay clave API configurada'
            });
        }
        
        // Crear nuevo registro en Airtable
        const response = await axios.post(
            `${AIRTABLE_API_URL}/${AIRTABLE_SCORES_TABLE}`,
            {
                records: [
                    {
                        fields: {
                            'Nombre': name,
                            'Telefono': phone,
                            'Puntaje': prize || 0,
                            'Nivel Maximo': maxLevel || 1,
                            'Fecha': new Date().toISOString(),
                            'Chances': prize || 0
                        }
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return res.json({
            success: true,
            message: 'Puntuación guardada correctamente',
            data: response.data
        });
    } catch (error) {
        console.error('Error al guardar puntuación:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al guardar la puntuación',
            error: error.message
        });
    }
});

// Obtener mejores puntuaciones
app.get('/api/top-scores', async (req, res) => {
    try {
        const limit = req.query.limit || 5;
        const apiKey = process.env.AIRTABLE_API_KEY;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'No hay clave API configurada'
            });
        }
        
        // Obtener las mejores puntuaciones ordenadas
        const response = await axios.get(
            `${AIRTABLE_API_URL}/${AIRTABLE_SCORES_TABLE}?sort[0][field]=Puntaje&sort[0][direction]=desc&maxRecords=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Transformar los datos para la respuesta
        const scores = response.data.records.map(record => ({
            id: record.id,
            name: record.fields.Nombre,
            score: record.fields.Puntaje || 0,
            level: record.fields.Nivel_Maximo || 1,
            date: record.fields.Fecha,
            chances: record.fields.Chances || 0
        }));
        
        return res.json({
            success: true,
            data: scores
        });
    } catch (error) {
        console.error('Error al obtener puntuaciones:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener las mejores puntuaciones',
            error: error.message
        });
    }
});

// Procesar las preguntas recibidas de Airtable
function processQuestions(records) {
    // Definir pilares y niveles de dificultad
    const pillars = [
        "Reputación  ❤️",
        "Oferta 💙",
        "Servicio 💛",
        "Tráfico 💜",
        "Data driven 💗"
    ];
    
    const difficultyLevels = [
        "Fácil 🟢",
        "Menos fácil 🟡",
        "Difícil 🔴",
        "Muy difícil 🔥",
        "Complicada 💀"
    ];
    
    // Crear estructura organizada por dificultad y pilar
    const organizedQuestions = {};
    
    // Inicializar estructura
    difficultyLevels.forEach((difficulty, diffIndex) => {
        organizedQuestions[diffIndex + 1] = {};
        
        pillars.forEach(pillar => {
            organizedQuestions[diffIndex + 1][pillar] = [];
        });
    });
    
    // Procesar cada registro
    records.forEach(record => {
        const fields = record.fields;
        
        // Verificar que tenga los campos necesarios
        if (!fields.Pilar || !fields.Dificultad || !fields.Pregunta || 
            !fields.OpcionA || !fields.OpcionB || !fields.OpcionC || !fields.OpcionD || 
            fields.RespuestaCorrecta === undefined) {
            return; // Saltar este registro si faltan campos
        }
        
        // Determinar el nivel según la dificultad
        const difficultyIndex = difficultyLevels.indexOf(fields.Dificultad);
        if (difficultyIndex === -1) return; // Saltar si no se reconoce la dificultad
        
        const level = difficultyIndex + 1;
        
        // Crear objeto de pregunta
        const questionObj = {
            id: record.id,
            text: fields.Pregunta,
            options: [
                fields.OpcionA,
                fields.OpcionB,
                fields.OpcionC,
                fields.OpcionD
            ],
            correctIndex: fields.RespuestaCorrecta,
            level: level,
            pillar: fields.Pilar
        };
        
        // Añadir a la estructura organizada
        if (organizedQuestions[level] && organizedQuestions[level][fields.Pilar]) {
            organizedQuestions[level][fields.Pilar].push(questionObj);
        }
    });
    
    return organizedQuestions;
}

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});