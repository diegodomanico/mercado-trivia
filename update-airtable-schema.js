// Script para añadir nuevos campos a la tabla de puntajes en Airtable
require('dotenv').config();
const fetch = require('node-fetch');

// Airtable constants - Usando las mismas constantes que en api.js
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

// Función para obtener la clave API de Airtable
async function getAirtableApiKey() {
    if (process.env.AIRTABLE_API_KEY) {
        console.log("Usando clave de API de las variables de entorno");
        return process.env.AIRTABLE_API_KEY;
    } else {
        throw new Error("La clave API de Airtable no está configurada en las variables de entorno");
    }
}

// Función principal
async function updateAirtableSchema() {
    try {
        console.log("Iniciando actualización del esquema de Airtable...");
        
        // Obtener la clave API
        const apiKey = await getAirtableApiKey();
        console.log("Clave API obtenida correctamente");
        
        // 1. Obtener la estructura actual de la tabla
        console.log("Obteniendo estructura de la tabla...");
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}?maxRecords=1`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al obtener estructura: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        if (!result.records || result.records.length === 0) {
            console.log("No se encontraron registros en la tabla. Continuando con la actualización...");
        } else {
            console.log("Estructura actual de la tabla:", JSON.stringify(result.records[0].fields, null, 2));
        }
        
        // 2. Crear un nuevo registro con los campos adicionales para forzar su creación
        console.log("Creando registro con nuevos campos...");
        const newRecordData = {
            records: [
                {
                    fields: {
                        Nombre: "Test - Nuevos Campos",
                        Puntaje: 0,
                        Telefono: "0000000000",
                        Chances: 0,
                        "Nivel Maximo": "Fácil 🟢",
                        Fecha: new Date().toISOString(),
                        // Nuevos campos que queremos añadir
                        "Tiempo Total": 60, // En segundos, tipo Número
                        "Preguntas Contestadas": 0 // Tipo Número
                    }
                }
            ]
        };
        
        const createResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRecordData)
        });
        
        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Error al crear registro: ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
        }
        
        const createResult = await createResponse.json();
        console.log("Registro creado exitosamente con ID:", createResult.records[0].id);
        console.log("Estructura del nuevo registro:", JSON.stringify(createResult.records[0].fields, null, 2));
        
        // 3. Eliminar el registro de prueba para no contaminar la tabla
        console.log("Eliminando registro de prueba...");
        const deleteResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_SCORES_TABLE}/${createResult.records[0].id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            console.warn(`Advertencia: No se pudo eliminar el registro de prueba: ${deleteResponse.status} ${deleteResponse.statusText} - ${errorText}`);
        } else {
            console.log("Registro de prueba eliminado exitosamente");
        }
        
        console.log("¡Esquema de Airtable actualizado con éxito!");
        console.log("Los siguientes campos han sido añadidos a la tabla:");
        console.log("- 'Tiempo Total' (tipo Número)");
        console.log("- 'Preguntas Contestadas' (tipo Número)");
        
    } catch (error) {
        console.error("Error durante la actualización del esquema:", error);
    }
}

// Ejecutar la función principal
updateAirtableSchema();