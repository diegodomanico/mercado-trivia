// Prueba simple de conexión a Airtable
require('dotenv').config();
const fetch = require('node-fetch');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

console.log('Verificando clave API:', AIRTABLE_API_KEY ? 'La clave existe (primeros 5 caracteres: ' + AIRTABLE_API_KEY.substring(0, 5) + '...)' : 'La clave NO existe');

async function testAirtableConnection() {
    try {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_QUESTIONS_TABLE}?maxRecords=1`;
        
        console.log('URL de prueba:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        
        console.log('Respuesta de Airtable:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error en la respuesta de Airtable: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        console.log('Número de registros:', data.records ? data.records.length : 0);
        
        if (data.records && data.records.length > 0) {
            console.log('Primer registro:', JSON.stringify(data.records[0], null, 2));
            return 'Conexión exitosa a Airtable';
        } else {
            console.log('No se encontraron registros en la tabla');
            return 'Conexión a Airtable OK pero no hay registros';
        }
    } catch (error) {
        console.error('Error en la prueba de conexión:', error);
        return `Error: ${error.message}`;
    }
}

// Ejecutar la prueba
testAirtableConnection()
    .then(result => console.log('Resultado final:', result))
    .catch(error => console.error('Error final:', error));