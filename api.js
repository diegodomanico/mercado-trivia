// API Integration for Airtable

// Airtable constants - actualizamos ID de base y tablas
const AIRTABLE_BASE_ID = 'appqpx1yzSgAOBlB3';
const AIRTABLE_QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

// Cache for API key
let airtableApiKey = null;

/**
 * Validates that we have all the required API keys
 * @returns {boolean} True if all keys are present
 */
function validateApiKeys() {
    return airtableApiKey !== null;
}

/**
 * Gets the Airtable API key from the server
 * @returns {Promise<string>} The API key
 */
async function getAirtableApiKey() {
    try {
        // If we already have the key in cache, return it
        if (airtableApiKey) {
            return airtableApiKey;
        }
        
        // Otherwise, fetch it from the server
        const response = await fetch(API_ENDPOINTS.apiKey);
        
        if (!response.ok) {
            throw new Error(`Error fetching API key: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.key) {
            throw new Error('API key not found in response');
        }
        
        // Cache the key
        airtableApiKey = data.key;
        
        return airtableApiKey;
    } catch (error) {
        console.error('Error getting Airtable API key:', error);
        
        // In case of error, alert the user
        throw new Error('Error al obtener clave de API. Por favor recarga la página.');
    }
}

/**
 * Fetches questions from Airtable based on specified criteria
 * @param {Array} pillars - List of pillars to fetch questions for
 * @param {String} difficulty - Difficulty level to fetch
 * @returns {Promise<Array>} - Array of question objects
 */
async function fetchQuestions(pillars, difficulty) {
    try {
        // Get API key
        const apiKey = await getAirtableApiKey();
        
        if (!apiKey) {
            console.warn('No API key available, using sample questions');
            return generateSampleQuestions(pillars, difficulty);
        }
        
        const questions = [];
        
        // Construct filter formula for Airtable
        const pillarFilter = pillars.map(pillar => `{Pilar}="${pillar}"`).join(',');
        const filterFormula = encodeURIComponent(`AND({Dificultad}="${difficulty}", OR(${pillarFilter}))`);
        
        // Construct URL for Airtable API
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_QUESTIONS_TABLE}?filterByFormula=${filterFormula}`;
        
        // Fetch questions from Airtable
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (!response.ok) {
            console.error(`Error fetching questions: ${response.status} ${response.statusText}`);
            return generateSampleQuestions(pillars, difficulty);
        }
        
        const data = await response.json();
        
        // Process Airtable records into question objects
        if (data.records && data.records.length > 0) {
            data.records.forEach(record => {
                const fields = record.fields;
                
                // Verificar y usar los varios campos posibles para opciones
                if (fields.Pregunta && 
                   ((fields.OpcionA && fields.OpcionB && fields.OpcionC && fields.OpcionD) || 
                    (fields.Opcion1 && fields.Opcion2 && fields.Opcion3 && fields.Opcion4) ||
                    (fields["Opción A"] && fields["Opción B"] && fields["Opción C"] && fields["Opción D"]) ||
                    (fields["Opción 1"] && fields["Opción 2"] && fields["Opción 3"] && fields["Opción 4"]) ||
                    (fields["Opcion A"] && fields["Opcion B"] && fields["Opcion C"] && fields["Opcion D"]) ||
                    (fields["Opcion 1"] && fields["Opcion 2"] && fields["Opcion 3"] && fields["Opcion 4"])) && 
                    fields.RespuestaCorrecta) {
                    
                    // Get options in the correct format
                    function getOptions(fields) {
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
                        
                        // Default to empty array (shouldn't be reached due to the if check in the parent function)
                        return ["Opción 1", "Opción 2", "Opción 3", "Opción 4"];
                    }
                    
                    const question = {
                        id: record.id,
                        pillar: fields.Pilar,
                        difficulty: fields.Dificultad,
                        text: fields.Pregunta,
                        options: getOptions(fields),
                        correctIndex: parseInt(fields.RespuestaCorrecta) - 1 // Convert from 1-based to 0-based index
                    };
                    
                    questions.push(question);
                }
            });
        }
        
        return questions;
    } catch (error) {
        console.error('Error fetching questions from Airtable:', error);
        return generateSampleQuestions(pillars, difficulty);
    }
}

/**
 * Fetches all questions needed for the game
 * @returns {Promise<Object>} - Object containing questions grouped by difficulty and pillar
 */
async function fetchAllGameQuestions() {
    try {
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
        
        // Get all pillars from game structure
        const pillars = GAME_STRUCTURE.pillars;
        
        // Initialize empty arrays for each pillar and difficulty
        pillars.forEach(pillar => {
            allQuestions.byDifficultyAndPillar['Fácil'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Media'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Difícil'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Muy Difícil'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Experto'][pillar] = [];
        });
        
        // Fetch questions for each difficulty level
        for (const difficulty of ['Fácil', 'Media', 'Difícil', 'Muy Difícil', 'Experto']) {
            const questionsForDifficulty = await fetchQuestions(pillars, difficulty);
            
            // Organize questions by pillar
            questionsForDifficulty.forEach(question => {
                const pillar = question.pillar;
                
                if (pillars.includes(pillar)) {
                    allQuestions.byDifficultyAndPillar[difficulty][pillar].push(question);
                    allQuestions.total++;
                }
            });
            
            // Check if we have enough questions for each pillar
            const needsMoreQuestions = pillars.some(pillar => {
                return allQuestions.byDifficultyAndPillar[difficulty][pillar].length < GAME_CONFIG.questionsPerRound;
            });
            
            // If any pillar doesn't have enough questions, generate more sample questions
            if (needsMoreQuestions) {
                pillars.forEach(pillar => {
                    const currentQuestions = allQuestions.byDifficultyAndPillar[difficulty][pillar];
                    
                    if (currentQuestions.length < GAME_CONFIG.questionsPerRound) {
                        // Generate additional sample questions
                        const additionalQuestions = generateSampleQuestions([pillar], difficulty);
                        const neededCount = GAME_CONFIG.questionsPerRound - currentQuestions.length;
                        
                        // Add only as many as needed to reach the minimum
                        for (let i = 0; i < Math.min(neededCount, additionalQuestions.length); i++) {
                            allQuestions.byDifficultyAndPillar[difficulty][pillar].push(additionalQuestions[i]);
                            allQuestions.total++;
                        }
                    }
                });
            }
        }
        
        return allQuestions;
    } catch (error) {
        console.error('Error fetching all game questions:', error);
        
        // In case of error, return sample questions
        return {
            total: 0,
            byDifficultyAndPillar: {
                'Fácil': generateSampleQuestionsForAllPillars('Fácil'),
                'Media': generateSampleQuestionsForAllPillars('Media'),
                'Difícil': generateSampleQuestionsForAllPillars('Difícil'),
                'Muy Difícil': generateSampleQuestionsForAllPillars('Muy Difícil'),
                'Experto': generateSampleQuestionsForAllPillars('Experto')
            }
        };
    }
}

/**
 * Generates sample questions for all pillars at a given difficulty
 * @param {String} difficulty - Difficulty level
 * @returns {Object} - Object with pillar keys and arrays of sample questions
 */
function generateSampleQuestionsForAllPillars(difficulty) {
    const result = {};
    
    GAME_STRUCTURE.pillars.forEach(pillar => {
        result[pillar] = generateSampleQuestions([pillar], difficulty);
    });
    
    return result;
}

/**
 * Generates sample questions for testing when Airtable data is not available
 * @param {Array} pillars - List of pillars to generate questions for
 * @param {String} difficulty - Difficulty level to generate
 * @returns {Array} - Array of sample question objects
 */
function generateSampleQuestions(pillars, difficulty) {
    // Reputación sample questions
    const reputationQuestions = [
        {
            text: "¿Cuál es el principal factor que impacta la reputación de un vendedor en Mercado Libre?",
            options: [
                "El precio de sus productos",
                "La cantidad de ventas",
                "La calificación y opiniones de los compradores",
                "La antigüedad de la cuenta"
            ],
            correctIndex: 2
        },
        {
            text: "¿Qué métrica NO afecta directamente al nivel de reputación en Mercado Libre?",
            options: [
                "Tasa de reclamos",
                "Tiempo de respuesta a preguntas",
                "Cantidad de productos publicados",
                "Cumplimiento en tiempo de envío"
            ],
            correctIndex: 2
        },
        {
            text: "¿Cuál es el tiempo recomendado para responder a las preguntas de los compradores?",
            options: [
                "En las primeras 24 horas",
                "En los primeros 60 minutos",
                "Dentro de una semana",
                "En cualquier momento antes de la compra"
            ],
            correctIndex: 1
        },
        {
            text: "¿Qué práctica afecta más negativamente la reputación de un vendedor?",
            options: [
                "Cancelar ventas frecuentemente",
                "No ofrecer envío gratis",
                "Tener pocas fotos en las publicaciones",
                "No responder preguntas antiguas"
            ],
            correctIndex: 0
        },
        {
            text: "¿Qué debes hacer si un comprador realiza un reclamo injustificado?",
            options: [
                "Ignorarlo, eventualmente se cerrará solo",
                "Responder de manera cordial y ofrecer una solución",
                "Contactar directamente al comprador fuera de la plataforma",
                "Cancelar la venta inmediatamente"
            ],
            correctIndex: 1
        }
    ];
    
    // Oferta sample questions
    const ofertaQuestions = [
        {
            text: "¿Qué información NO debe faltar en una buena publicación?",
            options: [
                "Precio de los competidores",
                "Especificaciones técnicas del producto",
                "Historia de la marca",
                "Nombre del proveedor"
            ],
            correctIndex: 1
        },
        {
            text: "¿Cuál es la cantidad recomendada de fotos por publicación?",
            options: [
                "1-2 fotos son suficientes",
                "3-5 fotos",
                "6-8 fotos",
                "Más de 10 fotos"
            ],
            correctIndex: 2
        },
        {
            text: "¿Qué estrategia de precio es más efectiva en Mercado Libre?",
            options: [
                "Siempre el precio más bajo del mercado",
                "Precios altos con descuentos frecuentes",
                "Precios competitivos con buena calidad de servicio",
                "Cambiar el precio diariamente según la competencia"
            ],
            correctIndex: 2
        },
        {
            text: "¿Qué tipo de foto principal genera más conversión en las publicaciones?",
            options: [
                "Foto del producto con fondo elaborado y texto",
                "Foto con múltiples productos para mostrar variedad",
                "Foto del producto sobre fondo blanco o neutro",
                "Foto del producto siendo utilizado por un modelo"
            ],
            correctIndex: 2
        },
        {
            text: "¿Qué práctica es recomendada para la descripción del producto?",
            options: [
                "Textos breves con datos básicos",
                "Contenido detallado con formato y listas",
                "Usar mayúsculas para destacar información",
                "Incluir condiciones de venta y políticas de devolución"
            ],
            correctIndex: 1
        }
    ];
    
    // Logística sample questions
    const logisticaQuestions = [
        {
            text: "¿Cuál es la principal ventaja de ofrecer Mercado Envíos Full?",
            options: [
                "Es más económico para el vendedor",
                "Permite envíos internacionales",
                "El producto obtiene mejor posicionamiento y etiqueta de Full",
                "Solo se puede usar para productos pequeños"
            ],
            correctIndex: 2
        },
        {
            text: "¿Qué ocurre si no despachas un producto dentro del plazo establecido?",
            options: [
                "Se cobra una multa económica",
                "Afecta negativamente tu reputación",
                "La publicación se pausa automáticamente",
                "Nada, solo debes comunicarte con el comprador"
            ],
            correctIndex: 1
        },
        {
            text: "¿Cuál es el beneficio de configurar correctamente las dimensiones y peso del producto?",
            options: [
                "No hay ningún beneficio significativo",
                "El comprador sabe exactamente qué va a recibir",
                "El costo de envío se calcula correctamente",
                "Es obligatorio para todas las categorías"
            ],
            correctIndex: 2
        },
        {
            text: "¿Qué método de envío suele tener mejor conversión en ventas?",
            options: [
                "Envío estándar a cargo del comprador",
                "Envío gratis (a cargo del vendedor)",
                "Retiro en persona",
                "Envío a cargo del comprador con fechas flexibles"
            ],
            correctIndex: 1
        },
        {
            text: "¿Qué práctica es recomendada para el empaque de productos?",
            options: [
                "Usar el empaque más económico posible",
                "Empacar de manera segura protegiendo el producto de daños",
                "Siempre usar cajas de Mercado Libre",
                "Cobrar el empaque por separado"
            ],
            correctIndex: 1
        }
    ];
    
    // Experiencia sample questions
    const experienciaQuestions = [
        {
            text: "¿Cuál es la mejor práctica para gestionar devoluciones?",
            options: [
                "Evitar aceptar devoluciones",
                "Aceptarlas solo si el producto tiene defectos",
                "Procesar rápidamente y aprender de los motivos",
                "Ofrecer reembolso parcial en vez de devolución"
            ],
            correctIndex: 2
        },
        {
            text: "¿Qué debes hacer después de concretar una venta?",
            options: [
                "Esperar a que el comprador te contacte",
                "Contactar al comprador para coordinar el envío",
                "Solicitar calificación positiva",
                "Ofrecer descuento en próximas compras"
            ],
            correctIndex: 1
        },
        {
            text: "¿Cuál es la mejor forma de gestionar los comentarios negativos?",
            options: [
                "Solicitar su eliminación a Mercado Libre",
                "Responder de manera profesional y buscar soluciones",
                "Ignorarlos para no darles importancia",
                "Ofrecer siempre reembolso total"
            ],
            correctIndex: 1
        },
        {
            text: "¿Qué información es importante comunicar al comprador luego de la compra?",
            options: [
                "Solo la información que solicite",
                "Los detalles del envío y tiempos estimados",
                "Promociones de otros productos",
                "Datos personales para contacto directo"
            ],
            correctIndex: 1
        },
        {
            text: "¿Qué elemento mejora más la experiencia de compra?",
            options: [
                "Incluir regalos con la compra",
                "Envío inmediato y comunicación clara",
                "Empaque lujoso",
                "Llamar por teléfono al comprador"
            ],
            correctIndex: 1
        }
    ];
    
    // Costos sample questions
    const costosQuestions = [
        {
            text: "¿Qué factor impacta más en la rentabilidad de una venta?",
            options: [
                "El costo del producto",
                "La comisión de Mercado Libre",
                "El costo de envío",
                "El balance entre precio, comisión y costos operativos"
            ],
            correctIndex: 3
        },
        {
            text: "¿Qué estrategia de precio es más efectiva para productos de baja rotación?",
            options: [
                "Reducir el precio hasta lograr la venta",
                "Mantener el precio y ofrecer beneficios adicionales",
                "Aumentar el precio para aparentar mayor calidad",
                "Cancelar la publicación si no se vende rápido"
            ],
            correctIndex: 1
        },
        {
            text: "¿Cómo afecta la suscripción a Mercado Shops a tus costos?",
            options: [
                "Aumenta el costo pero reduce comisiones",
                "No impacta en los costos de manera significativa",
                "Elimina por completo las comisiones por venta",
                "Solo conviene para vendedores con alto volumen"
            ],
            correctIndex: 0
        },
        {
            text: "¿Qué herramienta te ayuda a calcular la rentabilidad de tus productos?",
            options: [
                "Mercado Crédito",
                "Calculadora de envíos",
                "Mercado Ads",
                "Calculadora de rentabilidad en el panel de vendedor"
            ],
            correctIndex: 3
        },
        {
            text: "¿Qué estrategia de publicidad ofrece mejor retorno de inversión?",
            options: [
                "Publicitar todos los productos por igual",
                "Invertir en los productos con mayor margen de ganancia",
                "No usar publicidad y enfocarse en precio bajo",
                "Publicitar solo productos nuevos"
            ],
            correctIndex: 1
        }
    ];
    
    // Select the appropriate question set based on the pillar
    let questionsByPillar = {};
    questionsByPillar['Reputación'] = reputationQuestions;
    questionsByPillar['Oferta'] = ofertaQuestions;
    questionsByPillar['Logística'] = logisticaQuestions;
    questionsByPillar['Experiencia'] = experienciaQuestions;
    questionsByPillar['Costos'] = costosQuestions;
    
    // Create array for sample questions
    const sampleQuestions = [];
    
    // Add sample questions for each requested pillar
    pillars.forEach((pillar, pillarIndex) => {
        if (questionsByPillar[pillar]) {
            questionsByPillar[pillar].forEach((q, index) => {
                sampleQuestions.push({
                    id: `sample-${pillar}-${difficulty}-${index}`,
                    pillar: pillar,
                    difficulty: difficulty,
                    text: q.text,
                    options: q.options,
                    correctIndex: q.correctIndex
                });
            });
        }
    });
    
    return sampleQuestions;
}

/**
 * Validates a phone number against the Airtable database
 * @param {String} phone - Phone number to validate
 * @returns {Promise<boolean>} - True if phone is valid (not already used)
 */
async function validatePhone(phone) {
    try {
        // Clean the phone number (remove non-digits)
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Check phone via server endpoint to avoid exposing API key
        const response = await fetch(API_ENDPOINTS.checkPhone(cleanPhone));
        
        if (!response.ok) {
            throw new Error(`Phone validation error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Return if the phone is valid (not already used)
        return data.valid;
    } catch (error) {
        console.error('Error validating phone:', error);
        throw error;
    }
}

/**
 * Saves player score to Airtable
 * @param {Object} scoreData - Player score data
 * @returns {Promise<Object>} - Saved record
 */
async function saveScore(scoreData) {
    try {
        // Send score via server endpoint
        const response = await fetch(API_ENDPOINTS.scores, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scoreData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error saving score response:', errorText);
            throw new Error(`Error saving score: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        return result;
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
    try {
        // Fetch top scores via server endpoint
        const response = await fetch(`${API_ENDPOINTS.topScores}?limit=${limit}`);
        
        if (!response.ok) {
            throw new Error(`Error fetching top scores: ${response.status} ${response.statusText}`);
        }
        
        const scores = await response.json();
        return scores;
    } catch (error) {
        console.error('Error fetching top scores:', error);
        throw error;
    }
}