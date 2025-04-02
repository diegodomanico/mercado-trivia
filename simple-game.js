// Configuración
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

// Estructura del juego
const GAME_STRUCTURE = {
    totalRounds: 5,
    questionsPerRound: 5,
    pillars: [
        "Reputación  ❤️",
        "Oferta 💙",
        "Servicio 💛",
        "Tráfico 💜",
        "Data driven 💗"
    ],
    difficultyLevels: [
        "Fácil 🟢",
        "Menos fácil 🟡",
        "Difícil 🔴",
        "Muy difícil 🔥",
        "Complicada 💀"
    ]
};

// Cache de preguntas
let allQuestions = null;

// Estado del juego
const gameState = {
    player: {
        name: '',
        phone: '',
        level: 1,
        prize: 0,
        questionsAnswered: 0
    },
    lifelines: {
        fiftyFifty: true,
        audience: true,
        phone: true
    },
    timerInterval: null,
    timeLeft: 0,
    currentQuestion: null,
    questionsInRound: 0,
    currentPillar: null,
    pillarsCompleted: [],
    usedQuestionIds: []
};

// Elementos DOM
let startScreen;
let gameScreen;
let resultScreen;
let nameInput;
let phoneInput;
let startButton;
let phoneError;
let playerNameDisplay;
let currentLevelDisplay;
let currentPrizeDisplay;
let questionElement;
let answerElements;
let resultContainer;
let resultText;
let resultName;
let resultPhone;
let resultPrize;
let resultLevel;
let timerBar;
let fiftyFiftyBtn;
let audienceBtn;
let phoneBtn;
let statusDot;
let statusText;
let leaderboardEntries;
let progressDots;
let confettiEffect;
let chanceCelebration;
let pillarCelebration;
let pillarNameElement;
let levelUpCelebration;
let levelNameElement;

// Inicialización
document.addEventListener('DOMContentLoaded', initGame);

// Función de inicialización
function initGame() {
    // Elementos de pantalla
    startScreen = document.getElementById('start-screen');
    gameScreen = document.getElementById('game-screen');
    resultScreen = document.getElementById('result-screen');
    
    // Elementos de formulario
    nameInput = document.getElementById('name');
    phoneInput = document.getElementById('phone');
    startButton = document.getElementById('start-button');
    phoneError = document.getElementById('phone-error');
    
    // Elementos de juego
    playerNameDisplay = document.getElementById('player-name-display');
    currentLevelDisplay = document.getElementById('current-level');
    currentPrizeDisplay = document.getElementById('current-prize');
    questionElement = document.getElementById('question');
    answerElements = document.querySelectorAll('.answer');
    resultContainer = document.getElementById('result-container');
    resultText = document.getElementById('result-text');
    resultName = document.getElementById('result-name');
    resultPhone = document.getElementById('result-phone');
    resultPrize = document.getElementById('result-prize');
    resultLevel = document.getElementById('result-level');
    timerBar = document.getElementById('timer-bar');
    fiftyFiftyBtn = document.getElementById('fifty-fifty');
    audienceBtn = document.getElementById('audience');
    phoneBtn = document.getElementById('phone');
    statusDot = document.getElementById('status-dot');
    statusText = document.getElementById('status-text');
    leaderboardEntries = document.getElementById('leaderboard-entries');
    
    // Elementos de progreso
    progressDots = [
        document.getElementById('dot-1'),
        document.getElementById('dot-2'),
        document.getElementById('dot-3'),
        document.getElementById('dot-4'),
        document.getElementById('dot-5')
    ];
    
    // Elementos de celebración
    chanceCelebration = document.getElementById('chance-celebration');
    pillarCelebration = document.getElementById('pillar-celebration');
    pillarNameElement = document.getElementById('pillar-name');
    levelUpCelebration = document.getElementById('level-up-celebration');
    levelNameElement = document.getElementById('level-name');
    
    // Inicializar confetti
    confettiEffect = new ConfettiEffect();
    
    // Inicializar sonidos (si está disponible)
    if (typeof initializeSounds === 'function') {
        initializeSounds();
    }
    
    // Comprobar conexión a API
    checkApiConnection();
    
    // Cargar tabla de líderes
    loadLeaderboard();
    
    // Configurar eventos
    startButton.addEventListener('click', handleStartGame);
    
    answerElements.forEach(answer => {
        answer.addEventListener('click', function() {
            handleAnswerSelection(parseInt(this.dataset.index));
        });
    });
    
    fiftyFiftyBtn.addEventListener('click', useFiftyFifty);
    audienceBtn.addEventListener('click', useAudience);
    phoneBtn.addEventListener('click', usePhone);
    
    phoneInput.addEventListener('blur', validatePhoneNumber);
}

// Comprueba la conexión a la API
async function checkApiConnection() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        if (data.connected) {
            // Conexión exitosa
            statusDot.classList.remove('disconnected');
            statusDot.classList.add('connected');
            statusText.textContent = 'Conectado a la base de datos';
            startButton.disabled = false;
            
            // Cargar preguntas
            loadQuestions();
        } else {
            // Error de conexión
            showConnectionError(data.message || 'Error de conexión desconocido');
        }
    } catch (error) {
        // Error de conexión
        showConnectionError('Error al conectar con el servidor');
    }
}

// Muestra un error de conexión
function showConnectionError(message) {
    statusDot.classList.remove('connected');
    statusDot.classList.add('disconnected');
    statusText.textContent = message;
    startButton.disabled = true;
}

// Valida el número de teléfono
async function validatePhoneNumber() {
    const phone = phoneInput.value.trim();
    if (!phone) return;
    
    // Ocultar mensaje de error previo
    phoneError.style.display = 'none';
    
    try {
        const response = await fetch('/api/validate-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        
        const data = await response.json();
        
        if (!data.valid) {
            // Mostrar mensaje de error
            phoneError.style.display = 'block';
            // Mantener el botón habilitado para permitir cambiar el número
            startButton.disabled = false;
        }
    } catch (error) {
        console.error('Error al validar teléfono:', error);
        // Mantener el botón habilitado en caso de error
        startButton.disabled = false;
    }
}

// Carga la tabla de líderes
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/top-scores?limit=5');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            // Limpiar entradas actuales
            leaderboardEntries.innerHTML = '';
            
            // Agregar nuevas entradas
            data.data.forEach(score => {
                const entry = document.createElement('div');
                entry.className = 'leaderboard-entry';
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = score.name;
                
                const scoreSpan = document.createElement('span');
                scoreSpan.textContent = `${score.chances || score.score} chances`;
                
                entry.appendChild(nameSpan);
                entry.appendChild(scoreSpan);
                
                leaderboardEntries.appendChild(entry);
            });
        } else {
            leaderboardEntries.innerHTML = '<div class="leaderboard-entry"><span>No hay puntuaciones disponibles</span><span></span></div>';
        }
    } catch (error) {
        console.error('Error al cargar tabla de líderes:', error);
        leaderboardEntries.innerHTML = '<div class="leaderboard-entry"><span>Error al cargar puntuaciones</span><span></span></div>';
    }
}

// Carga todas las preguntas
async function loadQuestions() {
    try {
        const response = await fetch('/api/questions');
        const data = await response.json();
        
        if (data.success) {
            allQuestions = data.data;
            console.log("Preguntas cargadas:", allQuestions);
        } else {
            console.error('Error al cargar preguntas:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar preguntas:', error);
    }
}

// Maneja el inicio del juego
function handleStartGame() {
    // Validar formulario
    if (!nameInput.value || !phoneInput.value) {
        alert("Por favor completa todos los campos");
        return;
    }
    
    // Verificar que tenemos preguntas cargadas
    if (!allQuestions) {
        alert("Esperando conexión con la base de datos. Por favor, intenta de nuevo en unos segundos.");
        checkApiConnection();
        return;
    }
    
    // Guardar datos del jugador
    gameState.player.name = nameInput.value;
    gameState.player.phone = phoneInput.value;
    
    // Mostrar nombre en la pantalla
    playerNameDisplay.textContent = `Jugador: ${gameState.player.name}`;
    
    // Reproducir sonido de inicio
    if (typeof playSound === 'function') {
        playSound('start');
    }
    
    // Cambiar a pantalla de juego
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    // Preparar juego
    prepareGame();
    
    // Cargar primera pregunta
    loadQuestion();
}

// Prepara el juego
function prepareGame() {
    // Reiniciar estado
    gameState.player.level = 1;
    gameState.player.prize = 0;
    gameState.player.questionsAnswered = 0;
    gameState.questionsInRound = 0;
    gameState.pillarsCompleted = [];
    gameState.usedQuestionIds = [];
    gameState.lifelines.fiftyFifty = true;
    gameState.lifelines.audience = true;
    gameState.lifelines.phone = true;
    
    // Reiniciar UI de comodines
    fiftyFiftyBtn.classList.remove('used');
    audienceBtn.classList.remove('used');
    phoneBtn.classList.remove('used');
    
    // Seleccionar el primer pilar aleatoriamente
    gameState.currentPillar = getRandomPillar();
    
    // Reiniciar puntos de progreso
    updateProgressDots();
    
    // Actualizar display de nivel
    updateLevelDisplay();
    
    // Actualizar display de premio
    currentPrizeDisplay.textContent = `Chances: 0`;
}

// Obtiene un pilar aleatorio no completado
function getRandomPillar() {
    const availablePillars = GAME_STRUCTURE.pillars.filter(
        pillar => !gameState.pillarsCompleted.includes(pillar)
    );
    
    if (availablePillars.length === 0) {
        return null; // Todos los pilares completados
    }
    
    const randomIndex = Math.floor(Math.random() * availablePillars.length);
    return availablePillars[randomIndex];
}

// Actualiza los puntos de progreso
function updateProgressDots() {
    // Calcular número de preguntas completadas en módulo 5
    const completedQuestions = gameState.player.questionsAnswered % 5;
    
    // Actualizar dots
    progressDots.forEach((dot, index) => {
        if (index < completedQuestions) {
            dot.classList.add('completed');
        } else {
            dot.classList.remove('completed');
        }
    });
}

// Actualiza el display de nivel
function updateLevelDisplay() {
    const levelIndex = gameState.player.level - 1;
    const levelName = GAME_STRUCTURE.difficultyLevels[levelIndex] || 'Desconocido';
    currentLevelDisplay.textContent = `Nivel: ${gameState.player.level} - ${levelName}`;
}

// Carga una pregunta
function loadQuestion() {
    // Ocultar resultados
    resultContainer.style.display = 'none';
    
    // Si no hay pilar actual (todos completados), avanzar nivel
    if (!gameState.currentPillar) {
        if (gameState.player.level < 5) {
            gameState.player.level++;
            gameState.pillarsCompleted = []; // Reiniciar pilares para el nuevo nivel
            gameState.currentPillar = getRandomPillar();
            updateLevelDisplay();
            
            // Mostrar celebración de nivel
            showLevelUpCelebration();
        } else {
            // Completó todos los niveles - ganó el juego
            endGame(true);
            return;
        }
    }
    
    // Obtener preguntas para el nivel y pilar actual
    const questions = getQuestionsForLevelAndPillar();
    
    // Si no hay preguntas disponibles para este pilar y nivel
    if (!questions || questions.length === 0) {
        // Marcar este pilar como completado
        gameState.pillarsCompleted.push(gameState.currentPillar);
        
        // Mostrar celebración de pilar completado
        showPillarCompletedCelebration();
        
        // Obtener siguiente pilar
        gameState.currentPillar = getRandomPillar();
        
        // Intentar cargar pregunta de nuevo
        setTimeout(() => loadQuestion(), 3000); // Dar tiempo para la celebración
        return;
    }
    
    // Filtrar preguntas que ya han sido usadas
    const availableQuestions = questions.filter(q => !gameState.usedQuestionIds.includes(q.id));
    
    // Si no quedan preguntas sin usar, reutilizar todas
    if (availableQuestions.length === 0) {
        // Limpiar las preguntas usadas de este nivel y pilar
        gameState.usedQuestionIds = gameState.usedQuestionIds.filter(id => {
            return !questions.some(q => q.id === id);
        });
        
        // Ahora todas las preguntas están disponibles de nuevo
        const randomIndex = Math.floor(Math.random() * questions.length);
        gameState.currentQuestion = questions[randomIndex];
    } else {
        // Seleccionar una pregunta aleatoria entre las disponibles
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        gameState.currentQuestion = availableQuestions[randomIndex];
    }
    
    // Marcar esta pregunta como usada
    gameState.usedQuestionIds.push(gameState.currentQuestion.id);
    
    // Actualizar UI
    questionElement.textContent = gameState.currentQuestion.text;
    
    // Reproducir sonido de pregunta
    if (typeof playSound === 'function') {
        playSound('question');
    }
    
    // Actualizar opciones de respuesta
    answerElements.forEach((answer, index) => {
        const answerText = answer.querySelector('.answer-text');
        answerText.textContent = gameState.currentQuestion.options[index];
        
        // Resetear clases
        answer.classList.remove('correct', 'incorrect');
        answer.style.display = 'flex';
        answer.style.pointerEvents = 'auto';
    });
    
    // Iniciar temporizador
    startTimer();
}

// Obtiene preguntas para el nivel y pilar actual
function getQuestionsForLevelAndPillar() {
    if (!allQuestions || !allQuestions[gameState.player.level] || !allQuestions[gameState.player.level][gameState.currentPillar]) {
        console.log("No hay preguntas para nivel:", gameState.player.level, "pilar:", gameState.currentPillar);
        return [];
    }
    
    return allQuestions[gameState.player.level][gameState.currentPillar];
}

// Inicia el temporizador
function startTimer() {
    // Tiempo según nivel
    const times = [45, 40, 35, 30, 25];
    gameState.timeLeft = times[gameState.player.level - 1] || 30;
    
    // Resetear estado del timer
    clearInterval(gameState.timerInterval);
    timerBar.style.width = '100%';
    timerBar.style.backgroundColor = '#3483FA';
    
    // Iniciar cuenta regresiva
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        
        // Actualizar barra de tiempo
        const percentage = (gameState.timeLeft / times[gameState.player.level - 1]) * 100;
        timerBar.style.width = `${percentage}%`;
        
        // Cambiar color según el tiempo restante
        if (gameState.timeLeft <= 10) {
            timerBar.style.backgroundColor = '#F44336';
            
            // Reproducir sonido de tiempo bajo
            if (gameState.timeLeft === 10 && typeof playSound === 'function') {
                playSound('timeLow');
            }
        } else if (gameState.timeLeft <= 20) {
            timerBar.style.backgroundColor = '#FFE600';
            
            // Reproducir sonido de tiempo corriendo
            if (gameState.timeLeft === 20 && typeof playSound === 'function') {
                playSound('timeRunning');
            }
        }
        
        // Si se acaba el tiempo
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            timeUp();
        }
    }, 1000);
}

// Tiempo agotado
function timeUp() {
    clearInterval(gameState.timerInterval);
    
    // Reproducir sonido de error
    if (typeof playSound === 'function') {
        playSound('wrong');
    }
    
    // Deshabilitar respuestas
    answerElements.forEach((answer) => {
        answer.style.pointerEvents = 'none';
    });
    
    resultText.textContent = "¡Tiempo agotado! Has perdido.";
    resultContainer.style.display = 'block';
    
    // Finalizar juego como perdedor
    setTimeout(() => endGame(false), 2000);
}

// Maneja la selección de respuesta
function handleAnswerSelection(selectedIndex) {
    clearInterval(gameState.timerInterval);
    
    const isCorrect = selectedIndex === gameState.currentQuestion.correctIndex;
    
    // Reproducir sonido de selección
    if (typeof playSound === 'function') {
        playSound('select');
    }
    
    // Mostrar resultado
    answerElements.forEach((answer, index) => {
        answer.style.pointerEvents = 'none';
        
        if (isCorrect && index === gameState.currentQuestion.correctIndex) {
            answer.classList.add('correct');
            
            // Reproducir sonido de correcto
            if (typeof playSound === 'function') {
                playSound('correct');
            }
        } else if (!isCorrect && index === selectedIndex) {
            answer.classList.add('incorrect');
            
            // Reproducir sonido de incorrecto
            if (typeof playSound === 'function') {
                playSound('wrong');
            }
        }
    });
    
    if (isCorrect) {
        resultText.textContent = "¡Respuesta correcta!";
        
        // Actualizar estado del juego
        gameState.player.questionsAnswered++;
        gameState.questionsInRound++;
        
        // Actualizar puntos de progreso
        updateProgressDots();
        
        // Cada 5 preguntas = 1 chance
        if (gameState.player.questionsAnswered % 5 === 0) {
            gameState.player.prize++;
            currentPrizeDisplay.textContent = `Chances: ${gameState.player.prize}`;
            resultText.textContent = `¡Respuesta correcta! ¡Has ganado 1 chance! Total: ${gameState.player.prize}`;
            
            // Mostrar celebración de chance ganado
            showChanceEarnedCelebration();
        }
        
        resultContainer.style.display = 'block';
        
        // Iniciar temporizador para avanzar automáticamente
        autoAdvance();
        
        // Si completó las preguntas para este pilar, marcar como completado
        if (gameState.questionsInRound >= GAME_STRUCTURE.questionsPerRound) {
            gameState.pillarsCompleted.push(gameState.currentPillar);
            gameState.questionsInRound = 0;
            
            // La siguiente pregunta mostrará la celebración del pilar
            gameState.currentPillar = getRandomPillar();
        }
    } else {
        resultText.textContent = "Respuesta incorrecta. ¡Has perdido!";
        resultContainer.style.display = 'block';
        
        // Finalizar juego como perdedor
        setTimeout(() => endGame(false), 2000);
    }
}

// Avanza automáticamente a la siguiente pregunta
function autoAdvance() {
    const timerNext = document.getElementById('timer-next');
    let width = 100;
    const interval = setInterval(() => {
        width -= 2;
        timerNext.style.width = width + '%';
        
        if (width <= 0) {
            clearInterval(interval);
            loadQuestion();
        }
    }, 50); // 50ms * 50 iteraciones = ~2.5 segundos
}

// Muestra celebración de chance ganado
function showChanceEarnedCelebration() {
    // Iniciar confetti
    if (confettiEffect) {
        confettiEffect.start();
        setTimeout(() => confettiEffect.stop(), 3000);
    }
    
    // Reproducir sonido de ganador
    if (typeof playSound === 'function') {
        playSound('winner');
    }
    
    // Mostrar mensaje de celebración
    chanceCelebration.classList.add('active');
    setTimeout(() => {
        chanceCelebration.classList.remove('active');
    }, 3000);
}

// Muestra celebración de pilar completado
function showPillarCompletedCelebration() {
    // Iniciar confetti
    if (confettiEffect) {
        confettiEffect.start();
        setTimeout(() => confettiEffect.stop(), 3000);
    }
    
    // Actualizar nombre del pilar
    pillarNameElement.textContent = `¡Has completado el pilar ${gameState.currentPillar}!`;
    
    // Reproducir sonido de nivel superado
    if (typeof playSound === 'function') {
        playSound('levelUp');
    }
    
    // Mostrar mensaje de celebración
    pillarCelebration.classList.add('active');
    setTimeout(() => {
        pillarCelebration.classList.remove('active');
    }, 3000);
}

// Muestra celebración de nivel completado
function showLevelUpCelebration() {
    // Iniciar confetti
    if (confettiEffect) {
        confettiEffect.start();
        setTimeout(() => confettiEffect.stop(), 3000);
    }
    
    // Actualizar nombre del nivel
    const levelIndex = gameState.player.level - 1;
    const levelName = GAME_STRUCTURE.difficultyLevels[levelIndex] || 'Desconocido';
    levelNameElement.textContent = `¡Ahora estás en el nivel ${gameState.player.level} - ${levelName}!`;
    
    // Reproducir sonido de nivel superado
    if (typeof playSound === 'function') {
        playSound('levelUp');
    }
    
    // Mostrar mensaje de celebración
    levelUpCelebration.classList.add('active');
    setTimeout(() => {
        levelUpCelebration.classList.remove('active');
    }, 3000);
}

// Finaliza el juego
async function endGame(isWinner) {
    // Guardar estadísticas finales
    resultName.textContent = gameState.player.name;
    resultPhone.textContent = gameState.player.phone;
    resultPrize.textContent = gameState.player.prize;
    resultLevel.textContent = gameState.player.level;
    
    // Si es ganador, mostrar confetti
    if (isWinner && confettiEffect) {
        confettiEffect.start();
        setTimeout(() => confettiEffect.stop(), 5000);
        
        // Reproducir sonido de ganador
        if (typeof playSound === 'function') {
            playSound('winner');
        }
    }
    
    // Guardar puntuación en Airtable
    try {
        await saveScore();
    } catch (error) {
        console.error('Error al guardar puntuación:', error);
    }
    
    // Cambiar a pantalla de resultados
    gameScreen.classList.remove('active');
    resultScreen.classList.add('active');
}

// Guarda la puntuación
async function saveScore() {
    try {
        const response = await fetch('/api/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: gameState.player.name,
                phone: gameState.player.phone,
                prize: gameState.player.prize,
                maxLevel: gameState.player.level,
                pillar: gameState.currentPillar,
                questionsAnswered: gameState.player.questionsAnswered
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        return data;
    } catch (error) {
        console.error('Error al guardar puntuación:', error);
        throw error;
    }
}

// Comodín 50:50
function useFiftyFifty() {
    if (!gameState.lifelines.fiftyFifty) return;
    
    // Marcar como usado
    gameState.lifelines.fiftyFifty = false;
    fiftyFiftyBtn.classList.add('used');
    
    // Reproducir sonido de comodín
    if (typeof playSound === 'function') {
        playSound('lifeline');
    }
    
    // Determinar opciones a eliminar
    const correctIndex = gameState.currentQuestion.correctIndex;
    const indicesToRemove = [0, 1, 2, 3].filter(i => i !== correctIndex);
    
    // Eliminar aleatoriamente dos opciones incorrectas
    shuffleArray(indicesToRemove);
    const removeThese = indicesToRemove.slice(0, 2);
    
    // Ocultar las opciones seleccionadas
    removeThese.forEach(index => {
        answerElements[index].style.display = 'none';
    });
}

// Comodín ayuda del público
function useAudience() {
    if (!gameState.lifelines.audience) return;
    
    // Marcar como usado
    gameState.lifelines.audience = false;
    audienceBtn.classList.add('used');
    
    // Reproducir sonido de comodín
    if (typeof playSound === 'function') {
        playSound('lifeline');
    }
    
    // Generar porcentajes
    const correctIndex = gameState.currentQuestion.correctIndex;
    const percentages = generateAudiencePercentages(correctIndex);
    
    // Mostrar los porcentajes
    let audienceMessage = "El público opina:\n";
    const letters = ['A', 'B', 'C', 'D'];
    
    for (let i = 0; i < 4; i++) {
        audienceMessage += `${letters[i]}: ${percentages[i]}%\n`;
    }
    
    alert(audienceMessage);
}

// Genera porcentajes para la ayuda del público
function generateAudiencePercentages(correctIndex) {
    const percentages = [0, 0, 0, 0];
    
    // Dar mayor porcentaje a la respuesta correcta (entre 40% y 65%)
    percentages[correctIndex] = Math.floor(Math.random() * 25) + 40;
    
    // Repartir el resto entre las demás opciones
    const remaining = 100 - percentages[correctIndex];
    let allocated = 0;
    
    for (let i = 0; i < 4; i++) {
        if (i !== correctIndex) {
            if (i === 3) {
                // La última opción recibe lo que queda
                percentages[i] = remaining - allocated;
            } else {
                // Las demás reciben una parte aleatoria de lo que queda
                const max = Math.floor((remaining - allocated) / (3 - i));
                percentages[i] = Math.floor(Math.random() * max) + 5;
                allocated += percentages[i];
            }
        }
    }
    
    return percentages;
}

// Comodín llamada a un experto
function usePhone() {
    if (!gameState.lifelines.phone) return;
    
    // Marcar como usado
    gameState.lifelines.phone = false;
    phoneBtn.classList.add('used');
    
    // Reproducir sonido de comodín
    if (typeof playSound === 'function') {
        playSound('lifeline');
    }
    
    // Generar consejo del experto
    const correctIndex = gameState.currentQuestion.correctIndex;
    const letters = ['A', 'B', 'C', 'D'];
    
    // 80% de probabilidad de que el experto acierte
    const expertIsCorrect = Math.random() < 0.8;
    
    let expertAnswer;
    if (expertIsCorrect) {
        expertAnswer = letters[correctIndex];
    } else {
        // Seleccionar una respuesta incorrecta aleatoria
        const incorrectOptions = letters.filter((_, i) => i !== correctIndex);
        expertAnswer = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
    }
    
    let confidence;
    if (expertIsCorrect) {
        confidence = ["estoy bastante seguro", "estoy casi completamente seguro", "tengo mucha confianza"];
    } else {
        confidence = ["no estoy 100% seguro", "podría equivocarme", "es mi mejor suposición"];
    }
    
    const confidencePhrase = confidence[Math.floor(Math.random() * confidence.length)];
    
    alert(`El experto dice: "Creo que la respuesta es ${expertAnswer}, ${confidencePhrase}."`);
}

// Función para mezclar un array (algoritmo Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}