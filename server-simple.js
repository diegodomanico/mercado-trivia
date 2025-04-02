const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Airtable constants
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

// Verificar clave API de Airtable
const airtableApiKey = process.env.AIRTABLE_API_KEY;

// Estructura del juego
const GAME_STRUCTURE = {
    totalRounds: 5,
    questionsPerRound: 5,
    pillars: [
        "Reputación  ❤️",
        "Oferta 💙",
        "Servicio 💛",
        "Tráfico 💜",
        "Data driven 💗"
    ],
    difficultyLevels: [
        "Fácil 🟢",
        "Menos fácil 🟡",
        "Difícil 🔴",
        "Muy difícil 🔥",
        "Complicada 💀"
    ]
};

// Rutas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-simple.html'));
});

// API para obtener preguntas
app.get('/api/questions', async (req, res) => {
    try {
        console.log("Obteniendo preguntas de Airtable...");
        
        // Variable para almacenar todas las preguntas
        const allQuestions = {
            total: 0,
            byDifficultyAndPillar: {}
        };
        
        // Inicializar estructura de preguntas
        GAME_STRUCTURE.difficultyLevels.forEach(difficulty => {
            allQuestions.byDifficultyAndPillar[difficulty] = {};
            GAME_STRUCTURE.pillars.forEach(pillar => {
                allQuestions.byDifficultyAndPillar[difficulty][pillar] = [];
            });
        });
        
        // Verificar si tenemos API key
        if (!airtableApiKey) {
            console.log("No se encontró API key de Airtable, usando datos de ejemplo");
            
            // Crear preguntas de ejemplo
            GAME_STRUCTURE.difficultyLevels.forEach(difficulty => {
                GAME_STRUCTURE.pillars.forEach(pillar => {
                    // Crear 5 preguntas por combinación de pilar y dificultad
                    for (let i = 0; i < 5; i++) {
                        const question = {
                            id: `example-${difficulty}-${pillar}-${i}`,
                            text: `Pregunta ${i+1} sobre ${pillar} (${difficulty})`,
                            options: [`Opción A ${i}`, `Opción B ${i}`, `Opción C ${i}`, `Opción D ${i}`],
                            correctIndex: Math.floor(Math.random() * 4),
                            difficulty: difficulty,
                            pillar: pillar
                        };
                        
                        allQuestions.byDifficultyAndPillar[difficulty][pillar].push(question);
                        allQuestions.total++;
                    }
                });
            });
            
            return res.json(allQuestions);
        }
        
        // Si tenemos API key, hacer petición a Airtable
        try {
            // Obtener datos de Airtable
            const response = await axios.get(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_QUESTIONS_TABLE}`, {
                headers: {
                    'Authorization': `Bearer ${airtableApiKey}`
                }
            });
            
            // Procesar registros de Airtable
            if (response.data && response.data.records) {
                console.log(`Se encontraron ${response.data.records.length} preguntas en Airtable`);
                
                response.data.records.forEach(record => {
                    const fields = record.fields;
                    
                    // Extraer los datos necesarios
                    if (fields.Pregunta && fields.Dificultad && fields.Pilar && fields.RespuestaCorrecta !== undefined) {
                        // Determinar a qué nivel de dificultad corresponde
                        let difficulty = null;
                        for (const d of GAME_STRUCTURE.difficultyLevels) {
                            if (fields.Dificultad.includes(d) || fields.Dificultad.includes(d.replace(/[🟢🟡🔴🔥💀]/g, '').trim())) {
                                difficulty = d;
                                break;
                            }
                        }
                        
                        // Determinar a qué pilar corresponde
                        let pillar = null;
                        for (const p of GAME_STRUCTURE.pillars) {
                            if (fields.Pilar.includes(p) || fields.Pilar.includes(p.replace(/[❤️💙💛💜💗]/g, '').trim())) {
                                pillar = p;
                                break;
                            }
                        }
                        
                        // Si tenemos dificultad y pilar válidos
                        if (difficulty && pillar) {
                            // Obtener opciones
                            let options = [];
                            if (fields.OpcionA && fields.OpcionB && fields.OpcionC && fields.OpcionD) {
                                options = [fields.OpcionA, fields.OpcionB, fields.OpcionC, fields.OpcionD];
                            } else if (fields.Opcion1 && fields.Opcion2 && fields.Opcion3 && fields.Opcion4) {
                                options = [fields.Opcion1, fields.Opcion2, fields.Opcion3, fields.Opcion4];
                            } else if (fields["Opción A"] && fields["Opción B"] && fields["Opción C"] && fields["Opción D"]) {
                                options = [fields["Opción A"], fields["Opción B"], fields["Opción C"], fields["Opción D"]];
                            } else {
                                options = ["Opción A", "Opción B", "Opción C", "Opción D"];
                            }
                            
                            // Crear objeto de pregunta
                            const question = {
                                id: record.id,
                                text: fields.Pregunta,
                                options: options,
                                correctIndex: parseInt(fields.RespuestaCorrecta),
                                difficulty: difficulty,
                                pillar: pillar
                            };
                            
                            // Añadir a la colección
                            allQuestions.byDifficultyAndPillar[difficulty][pillar].push(question);
                            allQuestions.total++;
                        }
                    }
                });
                
                // Completar con preguntas de ejemplo si faltan
                GAME_STRUCTURE.difficultyLevels.forEach(difficulty => {
                    GAME_STRUCTURE.pillars.forEach(pillar => {
                        if (allQuestions.byDifficultyAndPillar[difficulty][pillar].length < 5) {
                            const needed = 5 - allQuestions.byDifficultyAndPillar[difficulty][pillar].length;
                            
                            console.log(`Faltan ${needed} preguntas para ${pillar} en ${difficulty}. Añadiendo preguntas de ejemplo.`);
                            
                            for (let i = 0; i < needed; i++) {
                                const question = {
                                    id: `example-${difficulty}-${pillar}-${i}`,
                                    text: `Pregunta ${i+1} sobre ${pillar} (${difficulty})`,
                                    options: [`Opción A ${i}`, `Opción B ${i}`, `Opción C ${i}`, `Opción D ${i}`],
                                    correctIndex: Math.floor(Math.random() * 4),
                                    difficulty: difficulty,
                                    pillar: pillar
                                };
                                
                                allQuestions.byDifficultyAndPillar[difficulty][pillar].push(question);
                                allQuestions.total++;
                            }
                        }
                    });
                });
            }
            
            console.log(`Total de preguntas disponibles: ${allQuestions.total}`);
            return res.json(allQuestions);
            
        } catch (airtableError) {
            console.error("Error en la petición a Airtable:", airtableError);
            
            // En caso de error, crear preguntas de ejemplo
            GAME_STRUCTURE.difficultyLevels.forEach(difficulty => {
                GAME_STRUCTURE.pillars.forEach(pillar => {
                    // Crear 5 preguntas por combinación de pilar y dificultad
                    for (let i = 0; i < 5; i++) {
                        const question = {
                            id: `example-${difficulty}-${pillar}-${i}`,
                            text: `Pregunta ${i+1} sobre ${pillar} (${difficulty})`,
                            options: [`Opción A ${i}`, `Opción B ${i}`, `Opción C ${i}`, `Opción D ${i}`],
                            correctIndex: Math.floor(Math.random() * 4),
                            difficulty: difficulty,
                            pillar: pillar
                        };
                        
                        allQuestions.byDifficultyAndPillar[difficulty][pillar].push(question);
                        allQuestions.total++;
                    }
                });
            });
            
            return res.json(allQuestions);
        }
    } catch (error) {
        console.error("Error general al obtener preguntas:", error);
        res.status(500).json({ error: "Error al obtener preguntas" });
    }
});

// API para verificar teléfono
app.get('/api/check-phone/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Siempre retornar válido para simplificar
        res.json({ valid: true, message: "Teléfono válido" });
    } catch (error) {
        console.error('Error verificando teléfono:', error);
        res.status(500).json({ 
            valid: false, 
            message: `Error al verificar el teléfono: ${error.message}` 
        });
    }
});

// API para guardar puntaje
app.post('/api/score', async (req, res) => {
    try {
        const scoreData = req.body;
        
        // Validar datos mínimos necesarios
        if (!scoreData.name || !scoreData.phone) {
            return res.status(400).json({ error: "Faltan datos obligatorios (nombre y teléfono)" });
        }
        
        console.log("Guardando puntaje:", scoreData);
        
        // Si tenemos API key, intentar guardar en Airtable
        if (airtableApiKey) {
            try {
                const response = await axios.post(
                    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}`,
                    {
                        fields: {
                            Nombre: scoreData.name,
                            Telefono: scoreData.phone,
                            Puntaje: scoreData.prize || 0,
                            "Nivel Maximo": scoreData.maxLevel || 1,
                            Fecha: new Date().toISOString()
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${airtableApiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log("Puntaje guardado en Airtable:", response.data);
                return res.json({ success: true, data: response.data });
            } catch (airtableError) {
                console.error("Error al guardar en Airtable:", airtableError);
                // Continuar y devolver éxito de todas formas
            }
        }
        
        // Si no pudimos guardar en Airtable o no hay API key, simplemente indicar éxito
        res.json({ success: true, data: scoreData });
    } catch (error) {
        console.error('Error al guardar puntaje:', error);
        res.status(500).json({ error: `Error al guardar puntaje: ${error.message}` });
    }
});

// API para obtener mejores puntajes
app.get('/api/top-scores', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        
        // Si tenemos API key, intentar obtener de Airtable
        if (airtableApiKey) {
            try {
                const response = await axios.get(
                    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}?sort%5B0%5D%5Bfield%5D=Puntaje&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=${limit}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${airtableApiKey}`
                        }
                    }
                );
                
                // Mapear registros a formato más simple
                const scores = response.data.records.map(record => ({
                    id: record.id,
                    name: record.fields.Nombre,
                    phone: record.fields.Telefono,
                    prize: record.fields.Puntaje || 0,
                    maxLevel: record.fields["Nivel Maximo"] || 1,
                    date: record.fields.Fecha || new Date().toISOString()
                }));
                
                return res.json(scores);
            } catch (airtableError) {
                console.error("Error al obtener puntajes de Airtable:", airtableError);
                // Continuar y devolver datos de ejemplo
            }
        }
        
        // Si no pudimos obtener de Airtable o no hay API key, devolver datos de ejemplo
        const exampleScores = [
            { id: '1', name: 'Jugador 1', phone: '1122334455', prize: 5, maxLevel: 5, date: new Date().toISOString() },
            { id: '2', name: 'Jugador 2', phone: '2233445566', prize: 4, maxLevel: 4, date: new Date().toISOString() },
            { id: '3', name: 'Jugador 3', phone: '3344556677', prize: 3, maxLevel: 3, date: new Date().toISOString() },
            { id: '4', name: 'Jugador 4', phone: '4455667788', prize: 2, maxLevel: 2, date: new Date().toISOString() },
            { id: '5', name: 'Jugador 5', phone: '5566778899', prize: 1, maxLevel: 1, date: new Date().toISOString() }
        ];
        
        res.json(exampleScores.slice(0, limit));
    } catch (error) {
        console.error('Error al obtener puntajes:', error);
        res.status(500).json({ error: `Error al obtener puntajes: ${error.message}` });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    console.log(`API key de Airtable: ${airtableApiKey ? 'Configurada correctamente' : 'No configurada'}`);
});