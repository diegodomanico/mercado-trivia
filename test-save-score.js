require('dotenv').config();
const fetch = require('node-fetch');

// Constantes para Airtable
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

async function getAirtableApiKey() {
    console.log("AIRTABLE_API_KEY:", process.env.AIRTABLE_API_KEY ? "Existe" : "No existe");
    return process.env.AIRTABLE_API_KEY;
}

async function testSaveScore() {
    try {
        // Get the API key
        const apiKey = await getAirtableApiKey();
        
        // Intentemos varios nombres de campos para ver cuál funciona
        const testVariations = [
            {
                description: "Versión 1 - Campos actuales",
                data: {
                    records: [
                        {
                            fields: {
                                Nombre: "Test Usuario 1",
                                Premio: 1,
                                Chances: 1,
                                "Nivel Maximo": 1,
                                "Pilar Final": "Test Pilar",
                                Fecha: new Date().toISOString()
                            }
                        }
                    ]
                }
            },
            {
                description: "Versión 2 - Score en lugar de Premio",
                data: {
                    records: [
                        {
                            fields: {
                                Nombre: "Test Usuario 2",
                                Score: 1,
                                Chances: 1,
                                "Nivel Maximo": 1,
                                "Pilar Final": "Test Pilar",
                                Fecha: new Date().toISOString()
                            }
                        }
                    ]
                }
            },
            {
                description: "Versión 3 - Puntos en lugar de Premio",
                data: {
                    records: [
                        {
                            fields: {
                                Nombre: "Test Usuario 3",
                                Puntos: 1,
                                Chances: 1,
                                "Nivel Maximo": 1,
                                "Pilar Final": "Test Pilar",
                                Fecha: new Date().toISOString()
                            }
                        }
                    ]
                }
            },
            {
                description: "Versión 4 - Sin Premio/Score/Puntos",
                data: {
                    records: [
                        {
                            fields: {
                                Nombre: "Test Usuario 4",
                                Chances: 1,
                                "Nivel Maximo": 1,
                                "Pilar Final": "Test Pilar",
                                Fecha: new Date().toISOString()
                            }
                        }
                    ]
                }
            },
            {
                description: "Versión 5 - Solo con Nombre",
                data: {
                    records: [
                        {
                            fields: {
                                Nombre: "Test Usuario 5"
                            }
                        }
                    ]
                }
            }
        ];
        
        // Probar cada variación
        for (const test of testVariations) {
            console.log(`\nProbando ${test.description}:`);
            console.log(JSON.stringify(test.data, null, 2));
            
            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}`;
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(test.data)
                });
                
                const responseText = await response.text();
                console.log(`Respuesta (${response.status} ${response.statusText}):`, responseText);
            } catch (error) {
                console.error('Error en la solicitud:', error);
            }
        }
        
    } catch (error) {
        console.error('Error general:', error);
    }
}

// Ejecutar la función
testSaveScore().then(() => console.log('Test finalizado'));