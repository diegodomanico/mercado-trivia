const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

// Crear conexión a la base de datos PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Inicializar tablas si no existen
async function initDatabase() {
    try {
        // Crear tabla de preguntas si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                text TEXT NOT NULL,
                pillar TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                option1 TEXT NOT NULL,
                option2 TEXT NOT NULL,
                option3 TEXT NOT NULL,
                option4 TEXT NOT NULL,
                correct_index SMALLINT NOT NULL
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                prize INTEGER DEFAULT 0,
                round INTEGER DEFAULT 1,
                final_pillar TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Tablas creadas o ya existentes');
        return true;
    } catch (error) {
        console.error('Error inicializando la base de datos:', error);
        return false;
    }
}

// Validar si un teléfono ya jugó
async function validatePhone(phone) {
    try {
        const cleanPhone = phone.replace(/\D/g, '');
        const result = await pool.query(
            'SELECT * FROM scores WHERE phone = $1 LIMIT 1',
            [cleanPhone]
        );
        
        // Si no hay resultados, el teléfono es válido (no ha jugado)
        return result.rows.length === 0;
    } catch (error) {
        console.error('Error validando teléfono:', error);
        // En caso de error, permitimos jugar de todos modos
        return true;
    }
}

// Guardar puntaje
async function saveScore(scoreData) {
    try {
        const { name, phone, prize, round, finalPillar } = scoreData;
        const cleanPhone = phone ? phone.replace(/\D/g, '') : null;
        
        const result = await pool.query(
            `INSERT INTO scores (name, phone, prize, round, final_pillar) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [name, cleanPhone, prize, round, finalPillar]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Error guardando puntaje:', error);
        return null;
    }
}

// Obtener mejores puntajes
async function fetchTopScores(limit = 5) {
    try {
        const result = await pool.query(
            `SELECT name, phone, prize, round, final_pillar, created_at 
             FROM scores 
             ORDER BY prize DESC, round DESC 
             LIMIT $1`,
            [limit]
        );
        
        return result.rows.map(row => ({
            name: row.name,
            phone: row.phone,
            prize: row.prize,
            round: row.round,
            pillar: row.final_pillar,
            date: row.created_at
        }));
    } catch (error) {
        console.error('Error obteniendo mejores puntajes:', error);
        return getSampleScores(limit);
    }
}

// Cargar preguntas desde CSV
async function loadQuestionsFromCSV(csvFilePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        const startTime = Date.now();
        let count = 0;
        
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (data) => {
                try {
                    // Procesar cada fila del CSV
                    // Asignar dificultad según el valor del CSV
                    let difficulty = 'Fácil'; // Valor por defecto
                    if (data.Dificultad && data.Dificultad.includes('Fácil')) {
                        difficulty = 'Fácil';
                    } else if (data.Dificultad && data.Dificultad.includes('Media')) {
                        difficulty = 'Media';
                    } else if (data.Dificultad && data.Dificultad.includes('Difícil')) {
                        difficulty = 'Difícil';
                    } else if (data.Dificultad && data.Dificultad.includes('Muy Difícil')) {
                        difficulty = 'Muy Difícil';
                    } else if (data.Dificultad && data.Dificultad.includes('Experto')) {
                        difficulty = 'Experto';
                    }
                    
                    // Mapeo directo y simplificado de pilares
                    let pillar = 'Reputación'; // Valor por defecto
                    
                    // Mapeo manual de patrones específicos a pilares estándar
                    const pilarMappings = [
                        { pattern: '❤️', pillar: 'Reputación' },
                        { pattern: '💙', pillar: 'Oferta' },
                        { pattern: '💜', pillar: 'Tráfico' },
                        { pattern: '💛', pillar: 'Servicio' },
                        { pattern: '💗', pillar: 'Data driven' },
                        { pattern: '🟠', pillar: 'Logística' },
                        { pattern: '🤔', pillar: 'Experiencia' },
                        { pattern: '💰', pillar: 'Costos' }
                    ];
                    
                    if (data.Pilar) {
                        // Buscar coincidencia en el mapeo
                        for (const mapping of pilarMappings) {
                            if (data.Pilar.includes(mapping.pattern)) {
                                pillar = mapping.pillar;
                                break;
                            }
                        }
                        
                        console.log(`CSV row #${count}: Pilar "${data.Pilar}" mapeado a "${pillar}"`);
                    }
                    
                    // Verificar si la pregunta tiene todos los datos necesarios
                    if (!data.Pregunta || !data.OpcionA || !data.OpcionB || !data.OpcionC || !data.OpcionD) {
                        console.log('Datos faltantes en fila:', data);
                        return; // Saltar esta fila
                    }
                    
                    const options = [
                        data.OpcionA,
                        data.OpcionB,
                        data.OpcionC,
                        data.OpcionD
                    ];
                    
                    // Determinar la opción correcta
                    let correctIndex;
                    if (data.RespuestaCorrecta !== undefined) {
                        // Si tenemos el campo numérico directo
                        correctIndex = parseInt(data.RespuestaCorrecta);
                    } else {
                        // Si no, intentamos con la letra
                        switch (data.RespuestaCorrecta) {
                            case 'A': correctIndex = 0; break;
                            case 'B': correctIndex = 1; break;
                            case 'C': correctIndex = 2; break;
                            case 'D': correctIndex = 3; break;
                            default: correctIndex = 0;
                        }
                    }
                    
                    results.push({
                        text: data.Pregunta,
                        pillar,
                        difficulty,
                        options,
                        correctIndex
                    });
                    
                    count++;
                } catch (error) {
                    console.error('Error procesando fila CSV:', error, data);
                }
            })
            .on('end', async () => {
                try {
                    // Una vez leído todo el CSV, guardamos en la base de datos
                    console.log(`Se leyeron ${count} preguntas del CSV en ${Date.now() - startTime}ms`);
                    
                    // Primero inicializamos la base de datos (si no está ya)
                    await initDatabase();
                    
                    // Vaciamos la tabla de preguntas para actualizar todas
                    await pool.query('TRUNCATE TABLE questions');
                    
                    // Insertar todas las preguntas
                    for (const question of results) {
                        await pool.query(
                            `INSERT INTO questions (text, pillar, difficulty, option1, option2, option3, option4, correct_index)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                            [
                                question.text,
                                question.pillar,
                                question.difficulty,
                                question.options[0],
                                question.options[1],
                                question.options[2],
                                question.options[3],
                                question.correctIndex
                            ]
                        );
                    }
                    
                    console.log(`Se guardaron ${results.length} preguntas en la base de datos`);
                    resolve({
                        success: true,
                        message: `Se cargaron ${results.length} preguntas desde el CSV a la base de datos`,
                        count: results.length
                    });
                } catch (error) {
                    console.error('Error guardando preguntas en la base de datos:', error);
                    reject(error);
                }
            })
            .on('error', (error) => {
                console.error('Error leyendo el archivo CSV:', error);
                reject(error);
            });
    });
}

// Obtener todas las preguntas agrupadas por dificultad y pilar
async function fetchAllGameQuestions() {
    try {
        // Primero inicializamos la base de datos (si no está ya)
        const dbInitialized = await initDatabase();
        
        // Obtenemos todas las preguntas de la base de datos
        const result = await pool.query(
            `SELECT id, text, pillar, difficulty, option1, option2, option3, option4, correct_index 
             FROM questions`
        );
        
        // Transformar las filas a la estructura esperada por el juego
        const allQuestions = {
            byDifficultyAndPillar: {},
            realQuestionsCount: result.rows.length,
            dbConnected: true
        };
        
        // Inicializar estructura para todas las dificultades y pilares
        for (const difficulty of ['Fácil', 'Media', 'Difícil', 'Muy Difícil', 'Experto']) {
            allQuestions.byDifficultyAndPillar[difficulty] = {};
            
            for (const pillar of ['Reputación', 'Oferta', 'Logística', 'Experiencia', 'Costos', 'Servicio', 'Tráfico', 'Data driven']) {
                allQuestions.byDifficultyAndPillar[difficulty][pillar] = [];
            }
        }
        
        // Agrupar las preguntas por dificultad y pilar
        for (const row of result.rows) {
            const question = {
                id: `db-${row.id}`,
                text: row.text,
                pillar: row.pillar,
                difficulty: row.difficulty,
                options: [row.option1, row.option2, row.option3, row.option4],
                correctIndex: row.correct_index
            };
            
            // Agregar a la estructura agrupada
            if (allQuestions.byDifficultyAndPillar[question.difficulty] && 
                allQuestions.byDifficultyAndPillar[question.difficulty][question.pillar]) {
                allQuestions.byDifficultyAndPillar[question.difficulty][question.pillar].push(question);
            }
        }
        
        // Completar con preguntas de muestra si no hay suficientes
        for (const difficulty of ['Fácil', 'Media', 'Difícil', 'Muy Difícil', 'Experto']) {
            for (const pillar of ['Reputación', 'Oferta', 'Logística', 'Experiencia', 'Costos', 'Servicio', 'Tráfico', 'Data driven']) {
                const questions = allQuestions.byDifficultyAndPillar[difficulty][pillar];
                
                // Si no hay al menos 5 preguntas para esta combinación, agregar preguntas de muestra
                if (questions.length < 5) {
                    const sampleQuestions = getSampleQuestions([pillar], difficulty);
                    
                    // Agregar solo las preguntas de muestra necesarias
                    const neededSamples = 5 - questions.length;
                    allQuestions.byDifficultyAndPillar[difficulty][pillar] = [
                        ...questions,
                        ...sampleQuestions.slice(0, neededSamples)
                    ];
                }
            }
        }
        
        return allQuestions;
    } catch (error) {
        console.error('Error obteniendo preguntas:', error);
        // Si hay un error, devolver preguntas de muestra
        return getSampleQuestionsResult();
    }
}

// Obtener preguntas de muestra para ciertos pilares y dificultad
function getSampleQuestions(pillars, difficulty) {
    const questions = [];
    let index = 0;
    
    for (const pillar of pillars) {
        for (let i = 0; i < 5; i++) {
            questions.push({
                id: `sample-${difficulty}-${pillar}-${i}`,
                text: `Pregunta de muestra #${i+1} sobre ${pillar} (${difficulty})`,
                difficulty,
                pillar,
                options: [
                    `Opción A para ${pillar}`,
                    `Opción B para ${pillar}`,
                    `Opción C para ${pillar}`,
                    `Opción D para ${pillar}`
                ],
                correctIndex: i % 4 // Alternamos la respuesta correcta
            });
            index++;
        }
    }
    
    return questions;
}

// Obtener la estructura completa de preguntas de muestra
function getSampleQuestionsResult() {
    const difficulties = ['Fácil', 'Media', 'Difícil', 'Muy Difícil', 'Experto'];
    const pillars = ['Reputación', 'Oferta', 'Logística', 'Experiencia', 'Costos', 'Servicio', 'Tráfico', 'Data driven'];
    
    const result = {
        byDifficultyAndPillar: {},
        realQuestionsCount: 0,
        dbConnected: false
    };
    
    // Crear estructura para cada dificultad y pilar
    for (const difficulty of difficulties) {
        result.byDifficultyAndPillar[difficulty] = {};
        
        for (const pillar of pillars) {
            // Generar 5 preguntas de muestra para cada combinación
            result.byDifficultyAndPillar[difficulty][pillar] = getSampleQuestions([pillar], difficulty);
        }
    }
    
    return result;
}

// Generar puntajes de muestra para el caso en que no haya datos reales
function getSampleScores(limit = 5) {
    const sampleNames = [
        'Juan Pérez', 'María López', 'Carlos Rodríguez', 
        'Ana González', 'Luis Martínez', 'Laura Sánchez', 
        'Pedro Gómez', 'Sofía Díaz', 'Fernando Castro', 'Valentina Torres'
    ];
    
    const samplePillars = ['Reputación', 'Oferta', 'Logística', 'Experiencia', 'Costos', 'Servicio', 'Tráfico', 'Data driven'];
    
    return Array.from({ length: limit }, (_, i) => {
        const prize = Math.floor(Math.random() * 5) + 1; // 1 a 5 chances
        const round = Math.floor(Math.random() * 5) + 1; // Ronda 1 a 5
        const pillarIndex = Math.floor(Math.random() * samplePillars.length);
        
        return {
            name: sampleNames[i % sampleNames.length],
            phone: `1591${Math.floor(1000000 + Math.random() * 9000000)}`,
            prize,
            round,
            pillar: samplePillars[pillarIndex],
            date: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString()
        };
    }).sort((a, b) => b.prize - a.prize || b.round - a.round);
}

// Inicializar la base de datos al cargar el módulo
initDatabase().catch(err => {
    console.error('Error inicializando la base de datos al cargar:', err);
});

module.exports = {
    validatePhone,
    fetchAllGameQuestions,
    saveScore,
    fetchTopScores,
    loadQuestionsFromCSV,
    getSampleQuestions,
    getSampleScores
};