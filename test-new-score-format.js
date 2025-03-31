// Test script para probar el nuevo formato de guardado de puntajes
require('dotenv').config();
const { saveScore, fetchTopScores } = require('./api.js');

async function testNewScoreFormat() {
    try {
        console.log("Probando el nuevo formato de guardado de puntajes...");
        
        // Crear un registro de prueba
        const testScore = {
            name: "Prueba Técnica",
            phone: "123456789",
            score: 500,
            chances: 2,
            maxRound: 10,
            finalPillar: "Fácil 🟢" // Ahora este campo contiene el nombre del nivel con emoji
        };
        
        console.log("Datos de prueba a enviar:", testScore);
        
        // Guardar el puntaje
        const result = await saveScore(testScore);
        console.log("Resultado del guardado:", result);
        
        // Obtener los puntajes
        console.log("\nObteniendo puntajes guardados...");
        const scores = await fetchTopScores(10);
        console.log("Puntajes recuperados:");
        scores.forEach((score, index) => {
            console.log(`${index + 1}. ${score.name} - Nivel: ${score.finalPillar}, Chances: ${score.chances}`);
        });
        
        console.log("\nPrueba completada con éxito!");
    } catch (error) {
        console.error("Error en la prueba:", error);
    }
}

// Ejecutar la prueba
testNewScoreFormat();