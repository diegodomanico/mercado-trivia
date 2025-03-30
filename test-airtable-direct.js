// Prueba directa sin environment variables
const Airtable = require('airtable');

// Usar la clave API directamente
const AIRTABLE_API_KEY = 'patLfTMqyWfeWozcn.a81270dff05974a93249740f92b27681390b6995fd376f79215747bbaa359231';
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';

console.log('Usando clave API directamente:', AIRTABLE_API_KEY.substring(0, 5) + '...');

async function testAirtableConnection() {
    try {
        // Configurar Airtable
        Airtable.configure({
            apiKey: AIRTABLE_API_KEY
        });
        
        const base = Airtable.base(AIRTABLE_BASE_ID);
        console.log('Base configurada:', AIRTABLE_BASE_ID);
        
        // Obtener registros de la tabla
        console.log('Intentando obtener registros de:', AIRTABLE_QUESTIONS_TABLE);
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