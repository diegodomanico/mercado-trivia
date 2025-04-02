// Configuración
const AIRTABLE_BASE_ID = 'app6Q7z8qliHP0YXF';
const AIRTABLE_QUESTIONS_TABLE = 'MELIXP_GAME_QUIEN_PREGUNTAS';
const AIRTABLE_SCORES_TABLE = 'MELIXP_GAME_QUIEN_PUNTAJES';

// Estructura del juego
const GAME_STRUCTURE = {
    totalRounds: 5,
    questionsPerRound: 1, // Una pregunta por cada tema
    temas: [
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
    window.confettiEffect = new ConfettiEffect();
    
    // Inicializar sonidos (si está disponible)
    if (typeof initializeSounds === 'function') {
        initializeSounds();
    }
    
    // Comprobar conexión a API
    checkApiConnection();
    
    // Cargar tabla de líderes
    loadLeaderboard();
    
    // Configurar eventos
    // Hacer que el botón de inicio sea accesible por teclado
    startButton.setAttribute('tabindex', '0');
    startButton.setAttribute('role', 'button');
    
    // Eventos para el botón de inicio
    startButton.addEventListener('click', handleStartGame);
    startButton.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleStartGame();
        }
    });
    
    answerElements.forEach(answer => {
        // Hacer que los elementos de respuesta sean accesibles por teclado
        answer.setAttribute('tabindex', '0');
        answer.setAttribute('role', 'button');
        
        // Agregar manejador de click 
        answer.addEventListener('click', function() {
            handleAnswerSelection(parseInt(this.dataset.index));
        });
        
        // Agregar soporte para teclado (Enter y Espacio)
        answer.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAnswerSelection(parseInt(this.dataset.index));
            }
        });
    });
    
    // Hacer que los comodines sean accesibles por teclado
    [fiftyFiftyBtn, audienceBtn, phoneBtn].forEach(btn => {
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('role', 'button');
    });
    
    // Eventos de clic para comodines
    fiftyFiftyBtn.addEventListener('click', useFiftyFifty);
    audienceBtn.addEventListener('click', useAudience);
    phoneBtn.addEventListener('click', usePhone);
    
    // Eventos de teclado para comodines
    fiftyFiftyBtn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            useFiftyFifty();
        }
    });
    
    audienceBtn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            useAudience();
        }
    });
    
    phoneBtn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            usePhone();
        }
    });
    
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

// Obtiene un tema aleatorio no completado
function getRandomPillar() {
    const availableTemas = GAME_STRUCTURE.temas.filter(
        tema => !gameState.pillarsCompleted.includes(tema)
    );
    
    if (availableTemas.length === 0) {
        return null; // Todos los temas completados
    }
    
    const randomIndex = Math.floor(Math.random() * availableTemas.length);
    return availableTemas[randomIndex];
}

// Debug - Imprime el estado actual del juego
function logGameState() {
    console.log("Estado del juego:", {
        nivel: gameState.player.level,
        pilar: gameState.currentPillar,
        preguntasContestadas: gameState.player.questionsAnswered,
        preguntasEnRonda: gameState.questionsInRound,
        chances: gameState.player.prize,
        pilaresCompletados: gameState.pillarsCompleted
    });
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
    
    // Limpiar contenido anterior si hubiera algún botón
    while (resultContainer.childElementCount > 1) {
        resultContainer.removeChild(resultContainer.lastChild);
    }
    
    // Agregar botón para volver al inicio 
    const returnButton = document.createElement('button');
    returnButton.textContent = 'Volver al inicio';
    returnButton.style.marginTop = '10px';
    returnButton.style.padding = '8px 15px';
    returnButton.style.backgroundColor = '#7A1DEA';
    returnButton.style.color = 'white';
    returnButton.style.border = 'none';
    returnButton.style.borderRadius = '4px';
    returnButton.style.cursor = 'pointer';
    returnButton.onclick = () => window.location.reload();
    resultContainer.appendChild(returnButton);
    
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
        
        // Si completó las preguntas para este tema, marcar como completado
        if (gameState.questionsInRound >= GAME_STRUCTURE.questionsPerRound) {
            gameState.pillarsCompleted.push(gameState.currentPillar);
            gameState.questionsInRound = 0;
            
            // La siguiente pregunta mostrará la celebración del tema
            gameState.currentPillar = getRandomPillar();
        }
    } else {
        resultText.textContent = "Respuesta incorrecta. ¡Has perdido!";
        resultContainer.style.display = 'block';
        
        // Limpiar contenido anterior si hubiera algún botón
        while (resultContainer.childElementCount > 1) {
            resultContainer.removeChild(resultContainer.lastChild);
        }
        
        // Agregar botón para volver al inicio 
        const returnButton = document.createElement('button');
        returnButton.textContent = 'Volver al inicio';
        returnButton.style.marginTop = '10px';
        returnButton.style.padding = '8px 15px';
        returnButton.style.backgroundColor = '#7A1DEA';
        returnButton.style.color = 'white';
        returnButton.style.border = 'none';
        returnButton.style.borderRadius = '4px';
        returnButton.style.cursor = 'pointer';
        returnButton.onclick = () => window.location.reload();
        resultContainer.appendChild(returnButton);
        
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
            // Registrar estado para depuración
            logGameState();
            // Cargar siguiente pregunta
            loadQuestion();
        }
    }, 50); // 50ms * 50 iteraciones = ~2.5 segundos
}

// Muestra celebración de chance ganado
function showChanceEarnedCelebration() {
    // Iniciar confetti
    if (window.confettiEffect) {
        startConfetti();
        setTimeout(() => stopConfetti(), 3000);
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

// Muestra celebración de tema completado
function showPillarCompletedCelebration() {
    // Iniciar confetti
    if (window.confettiEffect) {
        startConfetti();
        setTimeout(() => stopConfetti(), 3000);
    }
    
    // Actualizar nombre del tema
    pillarNameElement.textContent = `¡Has completado el tema ${gameState.currentPillar}!`;
    
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
    if (window.confettiEffect) {
        startConfetti();
        setTimeout(() => stopConfetti(), 3000);
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
    if (isWinner && window.confettiEffect) {
        startConfetti();
        setTimeout(() => stopConfetti(), 5000);
        
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
    
    // Agregar botón de "Volver al inicio" en la pantalla de resultados
    const resultButtons = document.getElementById('result-buttons');
    if (resultButtons) {
        // Limpiar botones existentes
        resultButtons.innerHTML = '';
        
        // Crear botón volver al inicio
        const backButton = document.createElement('button');
        backButton.textContent = 'Volver al inicio';
        backButton.className = 'result-button';
        backButton.style.marginTop = '20px';
        backButton.style.padding = '10px 20px';
        backButton.style.backgroundColor = '#7A1DEA';
        backButton.style.color = 'white';
        backButton.style.border = 'none';
        backButton.style.borderRadius = '5px';
        backButton.style.cursor = 'pointer';
        backButton.style.fontSize = '16px';
        backButton.onclick = () => {
            clearTimeout(gameState.redirectTimer);
            window.location.reload();
        };
        
        resultButtons.appendChild(backButton);
        
        // Mostrar temporizador de redirección
        const timerDisplay = document.createElement('div');
        timerDisplay.className = 'timer-redirect';
        timerDisplay.style.marginTop = '15px';
        timerDisplay.style.color = '#FFE600';
        timerDisplay.style.fontSize = '14px';
        resultButtons.appendChild(timerDisplay);
        
        // Iniciar temporizador para redirigir automáticamente (15 segundos)
        let secondsLeft = 15;
        timerDisplay.textContent = `Redirección en ${secondsLeft} segundos...`;
        
        const countdownInterval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft > 0) {
                timerDisplay.textContent = `Redirección en ${secondsLeft} segundos...`;
            } else {
                timerDisplay.textContent = 'Redirigiendo...';
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        gameState.redirectTimer = setTimeout(() => {
            window.location.reload();
        }, secondsLeft * 1000);
    }
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
    const letters = ['A', 'B', 'C', 'D'];
    
    // Crear un elemento para mostrar los resultados de la audiencia
    const audienceResultsEl = document.createElement('div');
    audienceResultsEl.className = 'audience-results';
    audienceResultsEl.style.position = 'fixed';
    audienceResultsEl.style.top = '50%';
    audienceResultsEl.style.left = '50%';
    audienceResultsEl.style.transform = 'translate(-50%, -50%)';
    audienceResultsEl.style.backgroundColor = '#1a1a1a';
    audienceResultsEl.style.border = '2px solid #7A1DEA';
    audienceResultsEl.style.borderRadius = '8px';
    audienceResultsEl.style.padding = '15px';
    audienceResultsEl.style.boxShadow = '0 0 15px rgba(122, 29, 234, 0.5)';
    audienceResultsEl.style.zIndex = '1000';
    audienceResultsEl.style.minWidth = '250px';
    
    // Título
    const titleEl = document.createElement('h3');
    titleEl.textContent = 'El público opina:';
    titleEl.style.color = '#FFE600';
    titleEl.style.textAlign = 'center';
    titleEl.style.marginBottom = '15px';
    audienceResultsEl.appendChild(titleEl);
    
    // Crear barras de porcentaje
    for (let i = 0; i < 4; i++) {
        const barContainer = document.createElement('div');
        barContainer.style.marginBottom = '10px';
        barContainer.style.display = 'flex';
        barContainer.style.alignItems = 'center';
        
        // Letra
        const letterEl = document.createElement('div');
        letterEl.textContent = letters[i];
        letterEl.style.width = '30px';
        letterEl.style.color = '#ffffff';
        letterEl.style.fontWeight = 'bold';
        barContainer.appendChild(letterEl);
        
        // Barra de porcentaje
        const barEl = document.createElement('div');
        barEl.style.flex = '1';
        barEl.style.height = '20px';
        barEl.style.backgroundColor = '#333';
        barEl.style.borderRadius = '4px';
        barEl.style.overflow = 'hidden';
        
        const fillEl = document.createElement('div');
        fillEl.style.width = '0%'; // Iniciar en 0 y animar
        fillEl.style.height = '100%';
        fillEl.style.backgroundColor = i === correctIndex ? '#3483FA' : '#7A1DEA';
        fillEl.style.transition = 'width 1s ease-in-out';
        barEl.appendChild(fillEl);
        
        barContainer.appendChild(barEl);
        
        // Porcentaje
        const percentEl = document.createElement('div');
        percentEl.textContent = '0%'; // Iniciar en 0 y animar
        percentEl.style.width = '50px';
        percentEl.style.textAlign = 'right';
        percentEl.style.color = '#ffffff';
        percentEl.style.paddingLeft = '10px';
        barContainer.appendChild(percentEl);
        
        audienceResultsEl.appendChild(barContainer);
        
        // Animar después de añadir al DOM
        setTimeout(() => {
            fillEl.style.width = `${percentages[i]}%`;
            percentEl.textContent = `${percentages[i]}%`;
        }, 100 + (i * 200));
    }
    
    // Botón para cerrar
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cerrar';
    closeBtn.style.display = 'block';
    closeBtn.style.margin = '15px auto 0';
    closeBtn.style.padding = '8px 15px';
    closeBtn.style.backgroundColor = '#7A1DEA';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => {
        document.body.removeChild(audienceResultsEl);
    };
    audienceResultsEl.appendChild(closeBtn);
    
    // Agregar al body
    document.body.appendChild(audienceResultsEl);
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
    
    // Crear un elemento para mostrar la llamada al experto
    const phoneCallEl = document.createElement('div');
    phoneCallEl.className = 'phone-call';
    phoneCallEl.style.position = 'fixed';
    phoneCallEl.style.top = '50%';
    phoneCallEl.style.left = '50%';
    phoneCallEl.style.transform = 'translate(-50%, -50%)';
    phoneCallEl.style.backgroundColor = '#1a1a1a';
    phoneCallEl.style.border = '2px solid #7A1DEA';
    phoneCallEl.style.borderRadius = '8px';
    phoneCallEl.style.padding = '20px';
    phoneCallEl.style.boxShadow = '0 0 15px rgba(122, 29, 234, 0.5)';
    phoneCallEl.style.zIndex = '1000';
    phoneCallEl.style.minWidth = '300px';
    phoneCallEl.style.maxWidth = '450px';
    
    // Título
    const titleEl = document.createElement('h3');
    titleEl.textContent = 'Llamada al experto';
    titleEl.style.color = '#FFE600';
    titleEl.style.textAlign = 'center';
    titleEl.style.marginBottom = '15px';
    phoneCallEl.appendChild(titleEl);
    
    // Animación de llamada
    const callingEl = document.createElement('div');
    callingEl.style.textAlign = 'center';
    callingEl.style.marginBottom = '15px';
    callingEl.style.color = '#ffffff';
    
    let dots = 0;
    const callingInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        callingEl.textContent = `Llamando${'.'.repeat(dots)}`;
    }, 300);
    
    phoneCallEl.appendChild(callingEl);
    
    // Agregar al body inmediatamente para mostrar "Llamando..."
    document.body.appendChild(phoneCallEl);
    
    // Simular tiempo de conexión
    setTimeout(() => {
        clearInterval(callingInterval);
        
        // Crear burbuja de diálogo
        const dialogEl = document.createElement('div');
        dialogEl.style.backgroundColor = '#2a2a2a';
        dialogEl.style.borderRadius = '10px';
        dialogEl.style.padding = '15px';
        dialogEl.style.position = 'relative';
        dialogEl.style.marginTop = '10px';
        dialogEl.style.marginBottom = '20px';
        dialogEl.style.color = '#ffffff';
        dialogEl.style.fontSize = '16px';
        dialogEl.style.lineHeight = '1.5';
        
        // Agregar texto del experto
        dialogEl.innerHTML = `<strong>El experto dice:</strong><br>"Creo que la respuesta es <span style="color: #3483FA; font-weight: bold;">${expertAnswer}</span>, ${confidencePhrase}."`;
        
        // Eliminar el elemento "llamando"
        phoneCallEl.removeChild(callingEl);
        
        // Agregar el dialogo
        phoneCallEl.appendChild(dialogEl);
        
        // Botón para cerrar
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Cerrar';
        closeBtn.style.display = 'block';
        closeBtn.style.margin = '15px auto 0';
        closeBtn.style.padding = '8px 15px';
        closeBtn.style.backgroundColor = '#7A1DEA';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '4px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => {
            document.body.removeChild(phoneCallEl);
        };
        phoneCallEl.appendChild(closeBtn);
        
    }, 2500); // 2.5 segundos de "llamando..."
}

// Función para mezclar un array (algoritmo Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Registrar confettiEffect como global para acceso en otras funciones
window.confettiEffect = null;