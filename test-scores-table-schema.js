require('dotenv').config();
const Airtable = require('airtable');

// Constantes para Airtable
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

async function getAirtableApiKey() {
    return process.env.AIRTABLE_API_KEY;
}

async function getScoresTableSchema() {
    try {
        // Get the API key
        const apiKey = await getAirtableApiKey();
        console.log("API Key:", apiKey ? "Obtenida correctamente" : "No se pudo obtener");
        
        // Configurar Airtable
        Airtable.configure({
            apiKey: apiKey
        });
        
        console.log(`Intentando conectar a Airtable base: ${AIRTABLE_BASE_ID}`);
        const base = Airtable.base(AIRTABLE_BASE_ID);
        
        // Primero, intentemos obtener un registro para ver la estructura
        console.log(`Obteniendo un registro de la tabla ${AIRTABLE_SCORES_TABLE} para ver su estructura...`);
        
        try {
            const records = await base(AIRTABLE_SCORES_TABLE).select({
                maxRecords: 1
            }).firstPage();
            
            if (records.length > 0) {
                console.log('Encontrado un registro. Estructura de campos:');
                const fields = records[0].fields;
                
                console.log(JSON.stringify(fields, null, 2));
                
                console.log('\nNombres de los campos disponibles:');
                Object.keys(fields).forEach(fieldName => {
                    console.log(`- ${fieldName} (${typeof fields[fieldName]})`);
                });
                
                return;
            } else {
                console.log('No se encontraron registros en la tabla de puntajes.');
            }
        } catch (tableError) {
            console.error(`Error al acceder a la tabla: ${tableError.message}`);
        }
        
        // Si no podemos obtener registros, intentemos crear uno de prueba para ver la respuesta
        console.log('\nIntentando crear un registro de prueba para verificar los campos...');
        
        // Intentar con varios nombres de campo posibles para el puntaje
        const testVariations = [
            {
                Nombre: "Usuario Prueba",
                Premio: 100,
                Chances: 2,
                "Nivel Maximo": 3,
                "Pilar Final": "Test Pilar",
                Fecha: new Date().toISOString()
            },
            {
                Nombre: "Usuario Prueba 2",
                Score: 200,
                Chances: 3,
                "Nivel Maximo": 4,
                "Pilar Final": "Test Pilar 2",
                Fecha: new Date().toISOString()
            },
            {
                Nombre: "Usuario Prueba 3",
                Puntos: 300,
                Chances: 4,
                "Nivel Maximo": 5,
                "Pilar Final": "Test Pilar 3",
                Fecha: new Date().toISOString()
            }
        ];
        
        for (const [index, testData] of testVariations.entries()) {
            console.log(`\nProbando variación ${index + 1}:`, testData);
            
            try {
                const result = await base(AIRTABLE_SCORES_TABLE).create([
                    {
                        fields: testData
                    }
                ]);
                
                console.log('Registro creado exitosamente. Campos aceptados:');
                console.log(JSON.stringify(result[0].fields, null, 2));
                
                return;
            } catch (createError) {
                console.error(`Error creando registro con variación ${index + 1}:`, createError.message);
                if (createError.message.includes('Invalid value for field')) {
                    const match = createError.message.match(/Invalid value for field '([^']+)'/);
                    if (match) {
                        console.log(`El campo '${match[1]}' existe pero tiene un formato inválido.`);
                    }
                } else if (createError.message.includes('Unknown field(s)')) {
                    const match = createError.message.match(/Unknown field\(s\) '([^']+)'/);
                    if (match) {
                        console.log(`El campo '${match[1]}' no existe en la tabla.`);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error general:', error);
    }
}

// Ejecutar la función
getScoresTableSchema().then(() => console.log('Análisis finalizado'));