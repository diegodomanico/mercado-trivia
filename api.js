// API Integration for Airtable
// Simplificación: Eliminamos la lógica Node.js que estaba causando errores
// Este archivo ahora solo funciona en el navegador
// En el navegador, config.js ya definió las variables necesarias

// Airtable constants - ID correcto de la base y tabla según prueba exitosa
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

// Hardcoded API Key para probar el juego
let airtableApiKey = 'pataNDZa0oP2ht21i.a5e7b6539cb5e38e51a07b1a6af90d11a7ab4aec76cc7f51c5a24bddc5e1bbe7';

// Verificar clave API de Airtable
console.log('Verificando clave de API: ', airtableApiKey ? 'La clave existe' : 'La clave NO existe');

/**
 * Validates that we have all the required API keys
 * @returns {boolean} True if all keys are present
 */
function validateApiKeys() {
    return airtableApiKey !== null;
}

/**
 * Gets the Airtable API key - Ahora retorna directamente la clave hardcodeada
 * @returns {Promise<string>} The API key
 */
async function getAirtableApiKey() {
    try {
        // Usamos la clave API que obtuvimos del entorno
        return airtableApiKey;
    } catch (error) {
        console.error('Error getting Airtable API key:', error);
        
        // En caso de error, alertar al usuario
        throw new Error('Error al obtener clave de API. Por favor recarga la página.');
    }
}

/**
 * Convierte un número de nivel a su descripción con emoji
 * @param {number|string} nivel - Número de nivel (1-5)
 * @returns {string} - Descripción del nivel con emoji
 */
function convertirNumeroANivel(nivel) {
    // Convertir a número si es string
    const nivelNum = parseInt(nivel);
    
    // Mapa de niveles
    const niveles = {
        1: "Fácil 🟢",
        2: "Menos fácil 🟡",
        3: "Difícil 🔴",
        4: "Muy difícil 🔥",
        5: "Complicada 💀"
    };
    
    // Devolver descripción o valor por defecto
    return niveles[nivelNum] || "Nivel " + nivelNum;
}

async function fetchQuestions(pillars, difficulty) {
    try {
        // Get API key
        const apiKey = await getAirtableApiKey();
        
        if (!apiKey) {
            console.error('No API key available');
            throw new Error('Airtable API key not available');
        }
        
        let questions = [];
        
        try {
            // Construct filter formula for Airtable - buscamos coincidencias parciales para pilares con emojis
            // Airtable usa búsquedas sensibles a mayúsculas/minúsculas, adaptamos los filtros
            // Manejo especial para "Reputación  ❤️" con dos espacios vs "Reputación ❤️" con un espacio
            const pillarFilter = pillars.map(pillar => {
                if (pillar === 'Reputación  ❤️') {
                    return `OR(SEARCH("Reputación", {Pilar}), SEARCH("❤️", {Pilar}))`;
                } else {
                    return `OR(SEARCH("${pillar}", {Pilar}), SEARCH("${pillar.replace(/[❤️💙💛💜💗]/g, '')}", {Pilar}))`;
                }
            }).join(',');
            const difficultyFilter = `OR(SEARCH("${difficulty}", {Dificultad}), SEARCH("${difficulty.toLowerCase()}", LOWER({Dificultad})))`;
            const filterFormula = encodeURIComponent(`AND(${difficultyFilter}, OR(${pillarFilter}))`);
            
            // Construct URL for Airtable API
            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_QUESTIONS_TABLE}?filterByFormula=${filterFormula}&maxRecords=100`;
            
            // Fetch questions from Airtable
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            if (!response.ok) {
                console.error(`Error fetching questions: ${response.status} ${response.statusText}`);
                throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
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
                        fields.RespuestaCorrecta !== undefined) {
                        
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
                        
                        // Extraer el nombre del pilar sin emojis
                        let pillarName = fields.Pilar;
                        // Limpiamos el campo de pillar para eliminar emojis y caracteres especiales
                        // Nota: Las comparaciones deben considerar los dobles espacios presentes en "Reputación  ❤️"
                        for (const p of GAME_STRUCTURE.pillars) {
                            if (pillarName.includes(p) || 
                                // Caso especial para "Reputación ❤️" con un espacio vs "Reputación  ❤️" con dos espacios
                                (p === 'Reputación  ❤️' && pillarName.includes('Reputación') && pillarName.includes('❤️'))) {
                                pillarName = p; // Usamos el nombre exacto de nuestros pilares definidos
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
                        
                        const question = {
                            id: record.id,
                            pillar: pillarName,
                            difficulty: difficultyName,
                            text: fields.Pregunta,
                            options: getOptions(fields),
                            correctIndex: parseInt(fields.RespuestaCorrecta) // ¡Atención! Los índices en Airtable/CSV ya están en base 0
                        };
                        
                        questions.push(question);
                    }
                });
            }
        } catch (airtableError) {
            console.error(`Error obteniendo preguntas de Airtable: ${airtableError.message}`);
            // No relanzamos el error, continuamos para generar preguntas de muestra
        }
        
        // Si no hay suficientes preguntas, reutilizar las existentes
        if (questions.length < pillars.length) {
            console.log(`Insuficientes preguntas en Airtable para dificultad ${difficulty}. Reutilizando preguntas.`);
            
            // Para cada pilar, revisar si necesitamos más preguntas (al menos 1)
            pillars.forEach(pillar => {
                const pillarQuestions = questions.filter(q => q.pillar === pillar);
                
                if (pillarQuestions.length < 1) {
                    const neededCount = 1 - pillarQuestions.length;
                    
                    // Si tenemos al menos una pregunta, la reutilizamos
                    if (pillarQuestions.length > 0) {
                        const reusedQuestions = [];
                        
                        for (let i = 0; i < neededCount; i++) {
                            const sourceQuestion = pillarQuestions[i % pillarQuestions.length];
                            // Crear una copia con ID único
                            reusedQuestions.push({
                                ...sourceQuestion,
                                id: `reused-${sourceQuestion.id}-${Date.now()}-${i}`
                            });
                        }
                        
                        console.log(`Reutilizando ${reusedQuestions.length} preguntas para ${pillar} en dificultad ${difficulty}`);
                        questions = [...questions, ...reusedQuestions];
                    } else {
                        // Si no hay ninguna pregunta para este pilar, buscamos en otras dificultades
                        console.log(`No hay preguntas para ${pillar} en dificultad ${difficulty}, buscando en otras dificultades`);
                        
                        // No usamos preguntas de muestra, solo reportamos la insuficiencia
                        console.log(`No hay suficientes preguntas en Airtable para ${pillar} en dificultad ${difficulty}`);
                        // No agregamos preguntas de muestra
                        // questions permanece sin cambios
                    }
                }
            });
        }
        
        return questions;
    } catch (error) {
        console.error('Error fetching questions from Airtable:', error);
        throw error;
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
                'Fácil 🟢': {},
                'Menos fácil 🟡': {},
                'Difícil 🔴': {},
                'Muy difícil 🔥': {},
                'Complicada 💀': {}
            }
        };
        
        // Get all pillars from game structure
        const pillars = GAME_STRUCTURE.pillars;
        
        // Initialize empty arrays for each pillar and difficulty
        pillars.forEach(pillar => {
            allQuestions.byDifficultyAndPillar['Fácil 🟢'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Menos fácil 🟡'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Difícil 🔴'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Muy difícil 🔥'][pillar] = [];
            allQuestions.byDifficultyAndPillar['Complicada 💀'][pillar] = [];
        });
        
        // Fetch questions for each difficulty level
        for (const difficulty of ['Fácil 🟢', 'Menos fácil 🟡', 'Difícil 🔴', 'Muy difícil 🔥', 'Complicada 💀']) {
            try {
                const questionsForDifficulty = await fetchQuestions(pillars, difficulty);
                
                // Organize questions by pillar
                questionsForDifficulty.forEach(question => {
                    const pillar = question.pillar;
                    
                    if (pillars.includes(pillar)) {
                        allQuestions.byDifficultyAndPillar[difficulty][pillar].push(question);
                        allQuestions.total++;
                    }
                });
                
                // Verificamos si hay al menos una pregunta para cada pilar
                const insufficientPillars = pillars.filter(pillar => 
                    allQuestions.byDifficultyAndPillar[difficulty][pillar].length < 1
                );
                
                if (insufficientPillars.length > 0) {
                    console.error(`Insuficientes preguntas para dificultad ${difficulty} en pilares: ${insufficientPillars.join(', ')}`);
                    console.log(`Reutilizando preguntas existentes para: ${insufficientPillars.join(', ')} en dificultad ${difficulty}`);
                    
                    // Reutilizar preguntas existentes para los pilares con insuficientes preguntas
                    insufficientPillars.forEach(pillar => {
                        const existingQuestions = allQuestions.byDifficultyAndPillar[difficulty][pillar];
                        const neededCount = 1 - existingQuestions.length;
                        
                        // Si hay preguntas existentes, las reutilizamos
                        if (existingQuestions.length > 0) {
                            const reusedQuestions = [];
                            for (let i = 0; i < neededCount; i++) {
                                const sourceQuestion = existingQuestions[i % existingQuestions.length];
                                // Crear una copia con ID único
                                reusedQuestions.push({
                                    ...sourceQuestion,
                                    id: `reused-${sourceQuestion.id}-${Date.now()}-${i}`
                                });
                            }
                            
                            // Agregar las preguntas reutilizadas
                            allQuestions.byDifficultyAndPillar[difficulty][pillar] = [
                                ...existingQuestions,
                                ...reusedQuestions
                            ];
                        } else {
                            // No usamos preguntas de muestra, reportamos la insuficiencia
                            console.log(`No hay preguntas para ${pillar} en dificultad ${difficulty}`);
                            allQuestions.byDifficultyAndPillar[difficulty][pillar] = [];
                        }
                        
                        // Actualizar el contador total
                        allQuestions.total += neededCount;
                    });
                }
            } catch (err) {
                console.error(`Error obteniendo preguntas para dificultad ${difficulty}:`, err);
                // Intentar buscar preguntas de otras dificultades para reutilizar
                console.log(`Buscando preguntas de otras dificultades para reutilizar en ${difficulty}`);
                
                // Buscar en las otras dificultades ya cargadas para encontrar preguntas por pilar
                const otherDifficulties = ['Fácil 🟢', 'Menos fácil 🟡', 'Difícil 🔴', 'Muy difícil 🔥', 'Complicada 💀'].filter(d => d !== difficulty);
                
                pillars.forEach(pillar => {
                    // Intentar encontrar preguntas en otras dificultades para este pilar
                    let questionsToReuse = [];
                    
                    // Buscar en cada dificultad
                    for (const otherDiff of otherDifficulties) {
                        const questions = allQuestions.byDifficultyAndPillar[otherDiff] && 
                                         allQuestions.byDifficultyAndPillar[otherDiff][pillar] || [];
                        
                        if (questions.length > 0) {
                            questionsToReuse = [...questionsToReuse, ...questions];
                            if (questionsToReuse.length >= GAME_CONFIG.questionsPerRound) {
                                break; // Ya tenemos suficientes
                            }
                        }
                    }
                    
                    if (questionsToReuse.length > 0) {
                        // Reutilizar preguntas de otras dificultades con nuevos IDs
                        const reusedQuestions = [];
                        // Solo necesitamos una pregunta por pilar
                        for (let i = 0; i < 1; i++) {
                            const sourceQuestion = questionsToReuse[i % questionsToReuse.length];
                            reusedQuestions.push({
                                ...sourceQuestion,
                                difficulty: difficulty, // Cambiar a la dificultad actual
                                id: `reused-${sourceQuestion.id}-${Date.now()}-${i}`
                            });
                        }
                        
                        console.log(`Reutilizando ${reusedQuestions.length} preguntas para ${pillar} en dificultad ${difficulty}`);
                        allQuestions.byDifficultyAndPillar[difficulty][pillar] = reusedQuestions;
                    } else {
                        // No usamos preguntas de muestra, reportamos la insuficiencia
                        console.log(`Insuficientes preguntas en Airtable para ${pillar} en dificultad ${difficulty}`);
                        allQuestions.byDifficultyAndPillar[difficulty][pillar] = [];
                    }
                    
                    // Actualizar el contador total
                    allQuestions.total += 1; // Solo necesitamos una pregunta por pilar
                });
            }
        }
        
        return allQuestions;
    } catch (error) {
        console.error('Error fetching all game questions:', error);
        throw new Error('No se pudieron cargar las preguntas desde Airtable: ' + error.message);
    }
}

/**
 * Función de marcador para mantener compatibilidad con el resto del código.
 * Esta función ya no genera preguntas de ejemplo, solo devuelve un array vacío.
 * @param {String} difficulty - Nivel de dificultad
 * @returns {Object} - Objeto vacío
 */
function generateSampleQuestionsForAllPillars(difficulty) {
    console.warn('generateSampleQuestionsForAllPillars está obsoleta y no debe usarse');
    const result = {};
    
    GAME_STRUCTURE.pillars.forEach(pillar => {
        result[pillar] = [];
    });
    
    return result;
}

/**
 * Función de marcador para mantener compatibilidad con el resto del código.
 * Esta función ya no genera preguntas de ejemplo, solo devuelve un array vacío.
 * @param {Array} pillars - Lista de pilares
 * @param {String} difficulty - Nivel de dificultad
 * @returns {Array} - Array vacío
 */
function generateSampleQuestions(pillars, difficulty) {
    console.warn('generateSampleQuestions está obsoleta y no debe usarse');
    return [];
}

/**
 * Validates a phone number against the Airtable database
 * @param {String} phone - Phone number to validate
 * @returns {Promise<Object>} - Object with { valid: boolean, message: string }
 */
async function validatePhone(phone) {
    try {
        // Get the API key
        const apiKey = await getAirtableApiKey();
        
        // Clean the phone number and ensure it's a string
        const cleanPhone = String(phone).replace(/\D/g, '');
        
        console.log(`Validando teléfono: ${cleanPhone}`);
        
        // Probar diferentes formatos para Airtable
        const phoneFormats = [
            cleanPhone,                  // Formato simple: 1151331242
            `+${cleanPhone}`,            // Con signo +: +1151331242
            `+54${cleanPhone}`           // Con prefijo país: +541151331242
        ];
        
        let isValid = true;
        let existingRecords = null;
        
        // Intentar todos los formatos de teléfono
        for (const phoneFormat of phoneFormats) {
            // Construct the URL with the FILTER formula to check if the phone exists
            // Búsqueda solo en campo "Telefono" ya que "Contacto" no existe
            const filterFormula = encodeURIComponent(`{Telefono}="${phoneFormat}"`);
            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}?filterByFormula=${filterFormula}`;
            
            console.log(`Verificando formato de teléfono: ${phoneFormat}`);
            
            // Make the request to Airtable
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error(`Error verificando teléfono: ${response.status} ${response.statusText}`);
                continue; // Intentar con el siguiente formato
            }
            
            const data = await response.json();
            
            // If records exist with this phone, it's already been used
            if (data.records && data.records.length > 0) {
                isValid = false;
                existingRecords = data.records;
                break; // Encontramos una coincidencia, no necesitamos buscar más
            }
        }
        
        if (!isValid && existingRecords) {
            // Obtener detalles del registro existente para el mensaje personalizado
            const record = existingRecords[0];
            const fields = record.fields;
            const nombre = fields.Nombre || 'Usuario';
            const premio = fields.Premio || 0;
            const chances = fields.Chances || 0;
            const fecha = new Date(fields.Fecha).toLocaleDateString('es-AR') || 'fecha previa';
            
            return {
                valid: false,
                message: `El número ${phone} ya participó anteriormente (${nombre}, ${fecha}) y obtuvo ${premio} premio y ${chances} chances. Cada participante puede jugar una sola vez.`
            };
        }
        
        return {
            valid: true,
            message: ''
        };
    } catch (error) {
        console.error('Error validating phone:', error);
        // En caso de error, reportamos el problema
        return {
            valid: false, 
            message: `Error en la validación: ${error.message}. Por favor, intenta con otro número de teléfono.`
        };
    }
}

/**
 * Saves player score to Airtable
 * @param {Object} scoreData - Player score data
 * @returns {Promise<Object>} - Saved record
 */
async function saveScore(scoreData) {
    try {
        // Registrar los datos para depuración
        console.log('Intentando guardar puntaje:', JSON.stringify(scoreData));
        
        // Intentamos guardar en Airtable, pero si falla, devolvemos una respuesta mockeada
        // para que el juego pueda continuar
        try {
            // Get the API key
            const apiKey = await getAirtableApiKey();
            
            // Investigar el tipo de campo Telefono en Airtable
            console.log("Tipo de teléfono:", typeof scoreData.phone, "Valor:", scoreData.phone);
            
            // Formatear el teléfono para hacer que sea compatible con Airtable
            // Revisando los logs, parece que Airtable rechaza el campo Telefono
            // Vamos a cambiarlo por "Contacto" para ver si eso resuelve el problema
            
            // Simplemente usamos el valor tal como está, sin formateo especial
            let phoneValue = String(scoreData.phone).trim();
            
            console.log(`Tipo de teléfono: ${typeof phoneValue} Valor: ${phoneValue}`);
            
            // Format the data for Airtable - usando SOLO los campos que existen en la tabla
            // Adaptación basada en el esquema confirmado:
            // - Nombre (string)
            // - Puntaje (number) -> Usaremos questionsAnswered como puntaje
            // - Fecha (string/date) -> Formato ISO
            // - Nivel Maximo (string) -> Nombre del nivel final
            // - Telefono (string) -> Teléfono del jugador
            // - Chances (number) -> Número de chances ganadas
            
            // El tiempo total lo guardaremos en los comentarios del campo Nombre
            // Las preguntas contestadas van en el campo Puntaje
            const tiempoTotalStr = scoreData.totalGameTimeSeconds ? 
                ` (Tiempo: ${scoreData.totalGameTimeSeconds}s)` : '';
            
            const airtableData = {
                records: [
                    {
                        fields: {
                            // Solo usamos los campos confirmados que existen en la tabla
                            Nombre: (scoreData.name || "Anónimo") + tiempoTotalStr,
                            Puntaje: Number(scoreData.questionsAnswered) || 0, 
                            Telefono: String(scoreData.phone || "").trim(),
                            Chances: Number(scoreData.prize || scoreData.chances || 0),
                            "Nivel Maximo": String(scoreData.finalPillar || "Fácil 🟢"),
                            Fecha: new Date().toISOString() // Airtable acepta formato ISO
                        }
                    }
                ]
            };
            
            // Log detallado para diagnóstico
            console.log("DATOS DEL JUGADOR PARA GUARDAR:");
            console.log("- Nombre:", scoreData.name);
            console.log("- Teléfono:", scoreData.phone);
            console.log("- Preguntas contestadas:", scoreData.questionsAnswered);
            console.log("- Premio/Chances:", scoreData.prize || scoreData.chances);
            
            // Log para diagnóstico
            console.log("Enviando datos a Airtable:", JSON.stringify(airtableData, null, 2));
            
            // Send to Airtable
            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(airtableData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error saving score response:', errorText);
                throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            return result.records[0];
        } catch (airtableError) {
            console.error('Error guardando en Airtable:', airtableError);
            // No devolvemos datos simulados, sino que propagamos el error
            throw new Error(`Error al guardar puntaje en Airtable: ${airtableError.message}`);
        }
    } catch (error) {
        console.error('Error guardando puntaje:', error);
        // Propagamos el error para que se maneje adecuadamente en el cliente
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
        // Intentar obtener los puntajes de Airtable
        try {
            // Get the API key
            const apiKey = await getAirtableApiKey();
            
            // Ordenar por puntaje (descendente)
            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}?maxRecords=${limit}&sort%5B0%5D%5Bfield%5D=Puntaje&sort%5B0%5D%5Bdirection%5D=desc`;
            
            // Make the request to Airtable
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Si obtenemos un error 422, probablemente significa que la tabla no existe
            // o no hay registros, en ese caso devolvemos un array vacío con un mensaje informativo
            if (response.status === 422) {
                console.log('La tabla de puntajes está vacía o aún no se ha creado.');
                return [
                    {
                        id: 'empty',
                        name: 'Aún no hay datos',
                        phone: '',
                        prize: 0,
                        chances: 0,
                        questionsAnswered: 0,
                        totalGameTimeSeconds: 0,
                        maxRound: 0,
                        finalPillar: 'Sé el primero en completar el juego para aparecer aquí',
                        date: new Date().toISOString()
                    }
                ];
            }
            
            // Para otros errores, lanzamos una excepción
            if (!response.ok) {
                throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Si no hay registros, devolvemos un mensaje informativo
            if (!data.records || data.records.length === 0) {
                return [
                    {
                        id: 'empty',
                        name: 'Aún no hay datos',
                        phone: '',
                        prize: 0,
                        chances: 0,
                        questionsAnswered: 0,
                        totalGameTimeSeconds: 0,
                        maxRound: 0,
                        finalPillar: 'Sé el primero en completar el juego para aparecer aquí',
                        date: new Date().toISOString()
                    }
                ];
            }
            
            // Transform Airtable records to our score format (campos actualizados)
            const scores = data.records.map(record => {
                return {
                    id: record.id,
                    name: record.fields.Nombre || "Jugador",
                    phone: record.fields.Telefono || "000000000",
                    prize: record.fields.Chances || 0, // Premio son las chances
                    chances: record.fields.Chances || 0,
                    questionsAnswered: record.fields.Puntaje || 0, // Puntaje son las preguntas respondidas
                    totalGameTimeSeconds: 0, // No tenemos este campo, dejamos en 0
                    maxRound: 1, // Valor por defecto
                    finalPillar: record.fields["Nivel Maximo"] || "Fácil 🟢", // Nivel máximo alcanzado
                    date: record.fields.Fecha || new Date().toISOString()
                };
            });
            
            return scores;
        } catch (airtableError) {
            console.error('Error al obtener puntajes de Airtable:', airtableError);
            // No devolvemos datos de ejemplo, solo un array con un mensaje informativo
            return [
                {
                    id: 'error',
                    name: 'Sin datos disponibles',
                    phone: '',
                    prize: 0,
                    chances: 0,
                    questionsAnswered: 0,
                    totalGameTimeSeconds: 0,
                    maxRound: 0,
                    finalPillar: 'La tabla de posiciones estará disponible pronto',
                    date: new Date().toISOString()
                }
            ];
        }
    } catch (error) {
        console.error('Error obteniendo mejores puntajes:', error);
        // En caso de error, devolvemos un array con mensaje amigable
        return [
            {
                id: 'error',
                name: 'Error de conexión',
                phone: '',
                prize: 0,
                chances: 0,
                questionsAnswered: 0,
                totalGameTimeSeconds: 0,
                maxRound: 0,
                finalPillar: 'No se pudieron cargar los datos',
                date: new Date().toISOString()
            }
        ];
    }
}

// Export all necessary functions
// En el navegador, las funciones ya están disponibles globalmente
// Solo exportamos en Node.js
if (typeof window === 'undefined' && typeof module !== 'undefined' && module.exports) {
    // Entorno Node.js
    module.exports = {
        validateApiKeys,
        getAirtableApiKey,
        fetchQuestions,
        fetchAllGameQuestions,
        generateSampleQuestions,
        generateSampleQuestionsForAllPillars,
        validatePhone,
        saveScore,
        fetchTopScores
    };
}