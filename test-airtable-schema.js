require('dotenv').config();
const fetch = require('node-fetch');

// Constantes para Airtable
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

async function getAirtableApiKey() {
    return process.env.AIRTABLE_API_KEY;
}

async function getTableSchema() {
    try {
        // Get the API key
        const apiKey = await getAirtableApiKey();
        console.log("API Key:", apiKey ? "Obtenida correctamente" : "No se pudo obtener");
        
        // Primero intentemos obtener la metadata de la base
        const metaUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
        console.log("Consultando metadata de la base en:", metaUrl);
        
        const metaResponse = await fetch(metaUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!metaResponse.ok) {
            console.error(`Error obteniendo metadata: ${metaResponse.status} ${metaResponse.statusText}`);
            const errorText = await metaResponse.text();
            console.error('Error response:', errorText);
            
            // Si la metadata no funciona, intentemos crear un registro para ver el error específico
            console.log("\nIntentando crear un registro de prueba para ver el error...");
            
            const testData = {
                records: [
                    {
                        fields: {
                            Nombre: "Test Usuario",
                            Telefono: "1122334455",
                            Premio: 1,
                            Chances: 1,
                            "Nivel Maximo": 1,
                            "Pilar Final": "Test Pilar",
                            Fecha: new Date().toISOString()
                        }
                    }
                ]
            };
            
            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}`;
            console.log("URL para crear registro:", url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });
            
            const responseText = await response.text();
            console.log("Respuesta al intentar crear registro:", responseText);
            return;
        }
        
        const metadata = await metaResponse.json();
        console.log("Metadata completa:", JSON.stringify(metadata, null, 2));
        
        // Encuentra la tabla de puntajes
        const scoresTable = metadata.tables.find(table => table.name === AIRTABLE_SCORES_TABLE);
        
        if (!scoresTable) {
            console.log(`No se encontró la tabla ${AIRTABLE_SCORES_TABLE}. Tablas disponibles:`, 
                metadata.tables.map(t => t.name));
            return;
        }
        
        console.log(`\nEstructura de la tabla ${AIRTABLE_SCORES_TABLE}:`);
        console.log("Campos disponibles:");
        
        scoresTable.fields.forEach(field => {
            console.log(`- ${field.name} (${field.type})`);
        });
        
    } catch (error) {
        console.error('Error obteniendo schema:', error);
    }
}

// Ejecutar la función
getTableSchema().then(() => console.log('Finalizado'));