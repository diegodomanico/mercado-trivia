// Prueba para verificar la estructura actualizada de la tabla de puntajes
require('dotenv').config();
const { saveScore, fetchTopScores } = require('./api');

async function testScoresWithUpdatedFields() {
    console.log('Iniciando prueba con la estructura actualizada de campos...');
    
    try {
        // Verificar que podemos obtener puntajes con la estructura actualizada
        console.log('Obteniendo puntajes actuales...');
        const currentScores = await fetchTopScores(10);
        console.log(`Puntajes obtenidos: ${currentScores.length}`);
        
        if (currentScores.length > 0 && currentScores[0].id !== 'empty' && currentScores[0].id !== 'error') {
            console.log('Primer puntaje de ejemplo:');
            console.log(JSON.stringify(currentScores[0], null, 2));
        } else {
            console.log('No hay puntajes aún o hubo un error al obtenerlos.');
        }
        
        // Crear un puntaje de prueba
        const testScore = {
            name: 'Usuario de Prueba',
            phone: '1198765432',
            score: 1500,  // Este campo debería mapearse a "Puntaje" en Airtable
            chances: 2,
            maxRound: 3,
            finalPillar: 'Oferta 💙'
        };
        
        console.log('Intentando guardar un puntaje de prueba...');
        console.log('Datos a guardar:', JSON.stringify(testScore, null, 2));
        
        // Guardar el puntaje
        const savedResult = await saveScore(testScore);
        console.log('Resultado guardado:');
        console.log(JSON.stringify(savedResult, null, 2));
        
        // Verificar que el puntaje se guardó correctamente
        console.log('Verificando que el puntaje se guardó...');
        const updatedScores = await fetchTopScores(10);
        
        // Buscar nuestro puntaje de prueba entre los resultados
        const ourScore = updatedScores.find(score => 
            score.name === testScore.name && 
            score.phone === testScore.phone
        );
        
        if (ourScore) {
            console.log('Puntaje encontrado en los resultados:');
            console.log(JSON.stringify(ourScore, null, 2));
            console.log('✅ Prueba exitosa: El puntaje se guardó y recuperó correctamente.');
        } else {
            console.log('❌ Prueba fallida: No se encontró el puntaje recién creado.');
            console.log('Todos los puntajes obtenidos:');
            console.log(JSON.stringify(updatedScores, null, 2));
        }
    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    }
    
    console.log('Prueba finalizada.');
}

// Ejecutar la prueba
testScoresWithUpdatedFields();