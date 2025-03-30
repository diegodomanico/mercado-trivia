// Prueba con la biblioteca oficial de Airtable
require('dotenv').config();
const Airtable = require('airtable');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

console.log('Verificando clave API:', AIRTABLE_API_KEY ? 'La clave existe (primeros 5 caracteres: ' + AIRTABLE_API_KEY.substring(0, 5) + '...)' : 'La clave NO existe');

async function testAirtableConnection() {
    try {
        // Configurar Airtable
        Airtable.configure({
            apiKey: AIRTABLE_API_KEY
        });
        
        const base = Airtable.base(AIRTABLE_BASE_ID);
        console.log('Base configurada:', AIRTABLE_BASE_ID);
        
        // Obtener registros de la tabla
        const records = await base(AIRTABLE_QUESTIONS_TABLE).select({
            maxRecords: 1
        }).firstPage();
        
        console.log('Número de registros:', records.length);
        
        if (records.length > 0) {
            console.log('Primer registro:', JSON.stringify(records[0].fields, null, 2));
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