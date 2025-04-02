// API Endpoints from api.js
const API_ENDPOINTS = {
    questions: '/api/questions',
    saveScore: '/api/score',
    topScores: '/api/top-scores',
    checkPhone: (phone) => `/api/check-phone/${phone}`
};

// Game Configuration
const GAME_CONFIG = {
    timePerDifficulty: {
        facil_🟢: 45,
        menos_facil_🟡: 40,
        dificil_🔴: 35,
        muy_dificil_🔥: 30,
        complicada_💀: 25
    },
    lifelines: {
        'fifty-fifty': true,
        'audience-help': true,
        'expert-call': true
    },
    chancesPerCorrectQuestions: 5 // 1 chance por cada 5 preguntas correctas
};

// Game Structure
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

// DOM Elements
const elements = {
    // Screens
    loadingScreen: document.getElementById('loading-screen'),
    errorScreen: document.getElementById('error-screen'),
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    resultsScreen: document.getElementById('results-screen'),
    leaderboardScreen: document.getElementById('leaderboard-screen'),
    
    // Start Screen Elements
    playerNameInput: document.getElementById('player-name'),
    playerPhoneInput: document.getElementById('player-phone'),
    startGameButton: document.getElementById('start-game-button'),
    mobileStartButton: document.getElementById('mobile-start-button'),
    nameError: document.getElementById('name-error'),
    phoneError: document.getElementById('phone-error'),
    statusIcon: document.getElementById('status-icon'),
    statusText: document.getElementById('status-text'),
    viewLeaderboardStartButton: document.getElementById('view-leaderboard-start'),
    
    // Game Screen Elements
    playerNameDisplay: document.getElementById('player-name-display'),
    currentPrize: document.getElementById('current-prize'),
    currentDifficulty: document.getElementById('current-difficulty'),
    currentPillar: document.getElementById('current-pillar'),
    timerBar: document.getElementById('timer-bar'),
    questionNumber: document.getElementById('question-number'),
    questionText: document.getElementById('question-text'),
    answers: Array.from(document.querySelectorAll('.answer')),
    answerTexts: Array.from(document.querySelectorAll('.answer-text')),
    progressDots: Array.from(document.querySelectorAll('.progress-dot')),
    prizeLadder: Array.from(document.querySelectorAll('.prize-level')),
    lifelines: Array.from(document.querySelectorAll('.lifeline')),
    
    // Result Screen Elements
    resultTitle: document.getElementById('result-title'),
    resultPlayerName: document.getElementById('result-player-name'),
    resultPlayerPhone: document.getElementById('result-player-phone'),
    resultPrize: document.getElementById('result-prize'),
    resultRound: document.getElementById('result-round'),
    resultPillar: document.getElementById('result-pillar'),
    viewLeaderboardButton: document.getElementById('view-leaderboard'),
    
    // Leaderboard Elements
    leaderboardLoading: document.getElementById('leaderboard-loading'),
    leaderboardTable: document.getElementById('leaderboard-table'),
    leaderboardBody: document.getElementById('leaderboard-body'),
    hideLeaderboardButton: document.getElementById('hide-leaderboard'),
    
    // Modals
    overlay: document.getElementById('overlay'),
    roundCompleteModal: document.getElementById('round-complete-modal'),
    roundCompleteTitle: document.getElementById('round-complete-title'),
    roundCompleteMessage: document.getElementById('round-complete-message'),
    nextRoundButton: document.getElementById('next-round-button'),
    expertModal: document.getElementById('expert-modal'),
    expertAdvice: document.getElementById('expert-advice'),
    closeExpertModalButton: document.getElementById('close-expert-modal'),
    audienceModal: document.getElementById('audience-modal'),
    audienceChartBars: Array.from(document.querySelectorAll('.bar-fill')),
    audiencePercentages: Array.from(document.querySelectorAll('.bar-percentage')),
    closeAudienceModalButton: document.getElementById('close-audience-modal'),
    errorModal: document.getElementById('error-modal'),
    errorText: document.getElementById('error-text'),
    errorOkBtn: document.getElementById('error-ok-btn'),
    
    // Other Elements
    confettiCanvas: document.getElementById('confetti-canvas'),
    errorMessage: document.getElementById('error-message'),
    retryButton: document.getElementById('retry-button'),
    debugMessage: document.getElementById('debug-message')
};

// Game State
const gameState = {
    gameActive: false,
    gameStartTime: null,
    gameEndTime: null,
    gameCompleted: false,
    playerWon: false,
    player: {
        name: '',
        phone: '',
        currentRound: 1,
        currentPillar: '',
        currentQuestionIndex: 0,
        questionsAnswered: 0,
        prize: 0,
        totalGameTimeSeconds: 0,
        completedRounds: [],
        usedLifelines: {
            'fifty-fifty': false,
            'audience-help': false,
            'expert-call': false
        }
    },
    selectedAnswer: null,
    timeRemaining: 0,
    timer: null,
    answerTimeout: null,
    allQuestions: null,
    currentRoundQuestions: [],
    currentQuestion: null,
    availablePillarsByDifficulty: {}
};

// Inicializar la aplicación al cargar el documento
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded: Juego inicializando");
    
    // Debug - mostrar todos los elementos importantes
    logElementStatus();
    
    // Inicializar el juego
    initGame();
    
    // Configurar evento para botón estándar
    setupStandardStartButton();
    
    // Configurar evento para botón móvil
    setupMobileStartButton();
    
    // Configurar otros eventos
    setupEventListeners();
});

// Función para mostrar el estado de los elementos DOM importantes
function logElementStatus() {
    const elementsToCheck = [
        'start-game-button', 
        'mobile-start-button', 
        'player-name', 
        'player-phone',
        'debug-message'
    ];
    
    console.log("Elementos disponibles al iniciar:");
    elementsToCheck.forEach(id => {
        console.log(`${id}: ${document.getElementById(id) ? "✅" : "❌"}`);
    });
}

// Configurar el botón de inicio estándar
function setupStandardStartButton() {
    const startBtn = elements.startGameButton;
    if (!startBtn) {
        console.error("Botón de inicio estándar no encontrado");
        return;
    }
    
    startBtn.addEventListener('click', function(e) {
        console.log("CLICK en botón estándar");
        updateDebugMessage("Botón estándar presionado");
        startGameWithValidation();
    });
}

// Configurar el botón de inicio para móviles
function setupMobileStartButton() {
    const mobileBtn = elements.mobileStartButton;
    if (!mobileBtn) {
        console.error("Botón móvil no encontrado");
        return;
    }
    
    mobileBtn.addEventListener('click', function(e) {
        console.log("CLICK en botón móvil");
        updateDebugMessage("Botón móvil presionado - iniciando juego directo");
        startGameDirectly();
    });
}

// Configurar otros event listeners del juego
function setupEventListeners() {
    // Botones de pantallas
    if (elements.retryButton) elements.retryButton.addEventListener('click', initGame);
    if (elements.viewLeaderboardButton) elements.viewLeaderboardButton.addEventListener('click', showLeaderboard);
    if (elements.viewLeaderboardStartButton) elements.viewLeaderboardStartButton.addEventListener('click', showLeaderboard);
    if (elements.hideLeaderboardButton) elements.hideLeaderboardButton.addEventListener('click', hideLeaderboard);
    
    // Elementos del juego
    if (elements.answers && elements.answers.length) {
        elements.answers.forEach(answer => answer.addEventListener('click', selectAnswer));
    }
    
    if (elements.lifelines && elements.lifelines.length) {
        elements.lifelines.forEach(lifeline => lifeline.addEventListener('click', useLifeline));
    }
    
    // Modal buttons
    if (elements.closeExpertModalButton) elements.closeExpertModalButton.addEventListener('click', closeModals);
    if (elements.closeAudienceModalButton) elements.closeAudienceModalButton.addEventListener('click', closeModals);
    if (elements.errorOkBtn) elements.errorOkBtn.addEventListener('click', handleErrorModalClose);
    
    // Botón de siguiente ronda
    if (elements.nextRoundButton) {
        elements.nextRoundButton.addEventListener('click', function() {
            console.log("Botón Continuar presionado");
            
            // PRIMERO: Forzar la detención del temporizador
            stopTimer();
            
            // Verificar si el juego ha sido completado
            if (gameState.gameCompleted || gameState.playerWon) {
                console.log("Juego completado con éxito. Mostrando pantalla final.");
                
                // Ocultar modal
                elements.roundCompleteModal.classList.add('hide');
                elements.overlay.classList.add('hide');
                
                // Detener confeti
                if (typeof stopConfetti === 'function') {
                    stopConfetti();
                }
                
                // Mostrar resultados
                endGame(true);
                return;
            }
            
            // Continuar juego normalmente
            elements.roundCompleteModal.classList.add('hide');
            elements.overlay.classList.add('hide');
            elements.roundCompleteTitle.classList.remove('violet-text', 'winner-text');
            
            // Detener confeti
            if (typeof stopConfetti === 'function') {
                stopConfetti();
            }
            
            // Reactivar juego
            gameState.gameActive = true;
            
            // Cargar siguiente pregunta
            loadQuestion();
            
            // Iniciar temporizador con delay
            setTimeout(() => {
                console.log("Iniciando temporizador para nueva pregunta");
                const difficultyKey = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1].toLowerCase().replace(/ /g, '_');
                gameState.timeRemaining = GAME_CONFIG.timePerDifficulty[difficultyKey];
                startTimer();
            }, 1000);
        });
    }
}

// Función para actualizar mensaje de debug
function updateDebugMessage(message) {
    if (elements.debugMessage) {
        elements.debugMessage.textContent = message;
    }
}

// Iniciar el juego con validación de campos
function startGameWithValidation() {
    // Obtener y validar datos del formulario
    const name = elements.playerNameInput ? elements.playerNameInput.value.trim() : "";
    const phone = elements.playerPhoneInput ? elements.playerPhoneInput.value.trim() : "";
    
    // Validar campos
    if (!name) {
        updateDebugMessage("Por favor ingresa tu nombre");
        if (elements.nameError) elements.nameError.classList.remove('hide');
        if (elements.playerNameInput) elements.playerNameInput.focus();
        return;
    }
    
    if (!phone) {
        updateDebugMessage("Por favor ingresa tu teléfono");
        if (elements.phoneError) elements.phoneError.classList.remove('hide');
        if (elements.playerPhoneInput) elements.playerPhoneInput.focus();
        return;
    }
    
    // Guardar datos del jugador
    gameState.player.name = name;
    gameState.player.phone = phone;
    
    updateDebugMessage("Validación correcta, iniciando juego...");
    startGame();
}

// Iniciar el juego directamente (para botón móvil)
function startGameDirectly() {
    // Obtener datos o usar valores por defecto
    let name = "Jugador";
    let phone = "1122334455";
    
    // Intentar obtener los valores ingresados
    const nameInput = elements.playerNameInput;
    const phoneInput = elements.playerPhoneInput;
    
    if (nameInput && nameInput.value.trim()) {
        name = nameInput.value.trim();
    }
    
    if (phoneInput && phoneInput.value.trim()) {
        phone = phoneInput.value.trim();
    }
    
    // Actualizar estado del juego
    gameState.player.name = name;
    gameState.player.phone = phone;
    
    updateDebugMessage(`Iniciando juego con: ${name} / ${phone}`);
    startGame();
}

// Start the Game
function startGame() {
    console.log("⭐ INICIO DE JUEGO con:", gameState.player.name, gameState.player.phone);
    
    // Set game as active and record start time
    gameState.gameActive = true;
    gameState.gameStartTime = new Date();
    
    // Reset lifelines UI
    elements.lifelines.forEach(lifeline => {
        lifeline.classList.remove('used');
    });
    
    // Update player name display
    elements.playerNameDisplay.textContent = gameState.player.name;
    
    // Añadir mensaje de depuración
    updateDebugMessage("Juego iniciado correctamente");
    
    // Select a random pillar
    selectRandomPillar();
    
    // Prepare questions for the first round
    prepareQuestionsForRound();
    
    // Update prize ladder
    updatePrizeLadder();
    
    // Show game screen
    showScreen(elements.gameScreen);
    
    // Load the first question
    loadQuestion();
}

// Initialize Game
async function initGame() {
    // Show loading screen
    showScreen(elements.loadingScreen);
    
    // Reset game state
    resetGameState();
    
    // Set loading status for API connection
    elements.statusIcon.className = 'status-icon loading';
    elements.statusText.textContent = 'Verificando conexión a la base de datos...';
    if (elements.startGameButton) elements.startGameButton.disabled = true;
    
    try {
        // Load all questions
        await loadAllQuestions();
        
        // Show start screen if questions were loaded successfully
        showScreen(elements.startScreen);
        
        // Mensaje inicial
        updateDebugMessage("Juego cargado correctamente. Listo para jugar.");
    } catch (error) {
        // Show error screen with message
        console.error('Error initializing game:', error);
        if (elements.errorMessage) elements.errorMessage.textContent = `Error: ${error.message}. Por favor intenta nuevamente.`;
        showScreen(elements.errorScreen);
        updateDebugMessage("Error al cargar el juego: " + error.message);
    }
}

// Reset Game State
function resetGameState() {
    // Reset game active status
    gameState.gameActive = false;
    gameState.gameStartTime = null;
    gameState.gameEndTime = null;
    gameState.gameCompleted = false;
    gameState.playerWon = false;
    
    // Limpiar cualquier setTimeout pendiente para verificar respuestas
    if (gameState.answerTimeout) {
        clearTimeout(gameState.answerTimeout);
        gameState.answerTimeout = null;
    }
    
    // Clear timer
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    
    // Reset player data
    gameState.player = {
        name: '',
        phone: '',
        currentRound: 1,
        currentPillar: '',
        currentQuestionIndex: 0,
        questionsAnswered: 0,
        prize: 0,
        totalGameTimeSeconds: 0,
        completedRounds: [],
        usedLifelines: {
            'fifty-fifty': false,
            'audience-help': false,
            'expert-call': false
        }
    };
    
    // Reset selected answer
    gameState.selectedAnswer = null;
    
    // Reset question data
    gameState.currentRoundQuestions = [];
    gameState.currentQuestion = null;
}

// Load All Questions
async function loadAllQuestions() {
    try {
        // Fetch questions from the server
        const response = await fetch(API_ENDPOINTS.questions);
        
        if (!response.ok) {
            throw new Error(`Error al cargar preguntas: ${response.status} ${response.statusText}`);
        }
        
        // Parse response
        const data = await response.json();
        
        // Verificar si hay un mensaje de error
        if (data.error) {
            console.error('Error en los datos:', data.error);
            throw new Error(data.error || 'Error en Airtable al cargar los datos.');
        }
        
        // Store questions in game state
        gameState.allQuestions = data;
        
        console.log('All questions loaded:', data);
        
        // Update connection status UI
        updateAirtableConnectionStatus(data);
        
        // Check if we have enough questions
        if (!hasEnoughQuestions()) {
            throw new Error('No hay suficientes preguntas para jugar. Por favor agrega más preguntas a la base de datos.');
        }
        
        return data;
    } catch (error) {
        console.error('Error loading questions:', error);
        // Update connection status to show error
        updateAirtableConnectionStatus(null, error);
        throw error;
    }
}

// Update Database Connection Status
function updateAirtableConnectionStatus(data, error = null) {
    if (error) {
        // Connection error - no permitimos jugar sin Airtable
        elements.statusIcon.className = 'status-icon disconnected';
        elements.statusText.textContent = 'Error de conexión a Airtable. No se puede iniciar el juego.';
        if (elements.startGameButton) elements.startGameButton.disabled = true;
        return;
    }
    
    if (!data || !data.total || data.total === 0) {
        // No data o insuficientes preguntas - no permitimos jugar
        elements.statusIcon.className = 'status-icon disconnected';
        elements.statusText.textContent = 'No hay suficientes preguntas en Airtable. No se puede iniciar el juego.';
        if (elements.startGameButton) elements.startGameButton.disabled = true;
        return;
    }

    // Verificar si tenemos al menos un pilar con preguntas para cada dificultad
    let availablePillarsByDifficulty = {};
    const pillars = GAME_STRUCTURE.pillars;
    let insufficientDifficulties = [];
    
    // Primero contamos cuántos temas tienen al menos una pregunta por cada dificultad
    for (const difficulty of Object.keys(data.byDifficultyAndPillar)) {
        availablePillarsByDifficulty[difficulty] = [];
        
        for (const pillar of pillars) {
            const questions = data.byDifficultyAndPillar[difficulty][pillar];
            if (questions && questions.length > 0) {
                availablePillarsByDifficulty[difficulty].push(pillar);
            }
        }
        
        // Si no hay preguntas para ningún pilar en esta dificultad, es un problema
        if (availablePillarsByDifficulty[difficulty].length === 0) {
            insufficientDifficulties.push(difficulty);
        }
    }
    
    // Guardamos la información de temas disponibles en el estado global
    gameState.availablePillarsByDifficulty = availablePillarsByDifficulty;
    
    if (insufficientDifficulties.length > 0) {
        elements.statusIcon.className = 'status-icon disconnected';
        elements.statusText.textContent = `No hay preguntas para las siguientes dificultades: ${insufficientDifficulties.join(', ')}. Se necesita al menos un pilar con preguntas por cada dificultad.`;
        if (elements.startGameButton) elements.startGameButton.disabled = true;
        return;
    }
    
    // Contar el número total de preguntas disponibles
    let totalQuestionsAvailable = 0;
    let pillaresDisponibles = [];
    
    for (const difficulty in availablePillarsByDifficulty) {
        if (availablePillarsByDifficulty[difficulty].length > 0) {
            console.log(`Dificultad ${difficulty}: ${availablePillarsByDifficulty[difficulty].length} pilares disponibles`);
            totalQuestionsAvailable += availablePillarsByDifficulty[difficulty].length;
            
            // Agregar los pilares únicos
            availablePillarsByDifficulty[difficulty].forEach(pillar => {
                if (!pillaresDisponibles.includes(pillar)) {
                    pillaresDisponibles.push(pillar);
                }
            });
        }
    }
    
    // Todo correcto - permitimos jugar
    elements.statusIcon.className = 'status-icon connected';
    
    if (pillaresDisponibles.length < pillars.length) {
        elements.statusText.textContent = `Conectado a Airtable (${data.total} preguntas). Nota: Solo hay preguntas para ${pillaresDisponibles.length} pilares: ${pillaresDisponibles.join(', ')}`;
    } else {
        elements.statusText.textContent = `Conectado a Airtable (${data.total} preguntas en ${pillaresDisponibles.length} pilares)`;
    }
    
    if (elements.startGameButton) elements.startGameButton.disabled = false;
}

// Check if we have enough questions
function hasEnoughQuestions() {
    if (!gameState.allQuestions || !gameState.allQuestions.byDifficultyAndPillar) {
        return false;
    }
    
    // Verificar que al menos tengamos una pregunta para algún pilar en cada dificultad
    let availablePillarsByDifficulty = {};
    
    // Primero identificamos qué pilares están disponibles en cada dificultad
    for (const difficulty of GAME_STRUCTURE.difficultyLevels) {
        availablePillarsByDifficulty[difficulty] = [];
        
        // Verificar que existan preguntas para esta dificultad
        if (!gameState.allQuestions.byDifficultyAndPillar[difficulty]) {
            console.warn(`No hay preguntas para la dificultad ${difficulty}`);
            gameState.allQuestions.byDifficultyAndPillar[difficulty] = {};
        }
        
        for (const pillar of GAME_STRUCTURE.pillars) {
            // Verificar que exista el pilar en esta dificultad
            if (!gameState.allQuestions.byDifficultyAndPillar[difficulty][pillar]) {
                console.warn(`No hay categoría ${pillar} en dificultad ${difficulty}`);
                gameState.allQuestions.byDifficultyAndPillar[difficulty][pillar] = [];
            }
            
            const questions = gameState.allQuestions.byDifficultyAndPillar[difficulty][pillar];
            
            if (questions && questions.length >= 1) {
                availablePillarsByDifficulty[difficulty].push(pillar);
            } else {
                console.warn(`No hay preguntas para ${pillar} en dificultad ${difficulty}. Se omitirá.`);
            }
        }
        
        // Si no hay temas disponibles para esta dificultad, es un problema
        if (availablePillarsByDifficulty[difficulty].length === 0) {
            console.error(`No hay ninguna pregunta para la dificultad ${difficulty}. Se necesita al menos un pilar con preguntas.`);
            return false;
        }
    }
    
    // Actualizar los temas disponibles en el estado de juego para cada dificultad
    gameState.availablePillarsByDifficulty = availablePillarsByDifficulty;
    
    console.log("Pilares disponibles por dificultad:", availablePillarsByDifficulty);
    return true;
}

// Select a Random Pillar
function selectRandomPillar() {
    // Get current difficulty
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    
    // Get all available pillars that:
    // 1. Haven't been completed in this round
    // 2. Tienen al menos una pregunta en esta dificultad
    const availablePillars = (gameState.availablePillarsByDifficulty[currentDifficulty] || []).filter(pillar => {
        const pillarKey = `${gameState.player.currentRound}-${pillar}`;
        return !gameState.player.completedRounds.includes(pillarKey);
    });
    
    console.log(`Seleccionando pilar para dificultad ${currentDifficulty}. Pilares disponibles:`, availablePillars);
    
    // If all pillars have been completed, use the first available pillar
    if (availablePillars.length === 0) {
        // Si no hay pillares disponibles entre los no completados, tomar cualquiera disponible
        if (gameState.availablePillarsByDifficulty[currentDifficulty] && 
            gameState.availablePillarsByDifficulty[currentDifficulty].length > 0) {
            
            gameState.player.currentPillar = gameState.availablePillarsByDifficulty[currentDifficulty][0];
            console.log(`Todos los pilares ya completados. Usando: ${gameState.player.currentPillar}`);
        } else {
            // Caso de emergencia - no debería ocurrir si hasEnoughQuestions() funciona correctamente
            gameState.player.currentPillar = GAME_STRUCTURE.pillars[0];
            console.log(`¡ADVERTENCIA! No hay pilares disponibles para esta dificultad. Usando valor por defecto.`);
        }
        return;
    }
    
    // Select a random pillar from available ones
    const randomIndex = Math.floor(Math.random() * availablePillars.length);
    gameState.player.currentPillar = availablePillars[randomIndex];
    console.log(`Pilar seleccionado: ${gameState.player.currentPillar}`);
}

// Prepare Questions for Round
function prepareQuestionsForRound() {
    // Get difficulty for current round
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    
    // En lugar de seleccionar preguntas de un solo pilar, vamos a seleccionar una pregunta de cada pilar
    gameState.currentRoundQuestions = [];
    
    // Verificar que existan preguntas para esta dificultad
    if (!gameState.allQuestions.byDifficultyAndPillar[currentDifficulty]) {
        console.warn(`No hay preguntas para la dificultad ${currentDifficulty}`);
        gameState.allQuestions.byDifficultyAndPillar[currentDifficulty] = {};
    }
    
    // Obtener una pregunta de cada pilar para este nivel de dificultad
    GAME_STRUCTURE.pillars.forEach(pillar => {
        // Verificar que exista el pilar en esta dificultad
        if (!gameState.allQuestions.byDifficultyAndPillar[currentDifficulty][pillar]) {
            console.warn(`No hay categoría ${pillar} en dificultad ${currentDifficulty}`);
            gameState.allQuestions.byDifficultyAndPillar[currentDifficulty][pillar] = [];
        }
        
        const pillarQuestions = gameState.allQuestions.byDifficultyAndPillar[currentDifficulty][pillar];
        
        // Si hay preguntas disponibles para este pilar, tomamos una
        if (pillarQuestions && pillarQuestions.length > 0) {
            // Seleccionar una pregunta aleatoria de este pilar
            const randomIndex = Math.floor(Math.random() * pillarQuestions.length);
            const selectedQuestion = pillarQuestions[randomIndex];
            
            gameState.currentRoundQuestions.push(selectedQuestion);
        }
    });
    
    // Mezclar las preguntas para que no siempre aparezcan en el mismo orden
    gameState.currentRoundQuestions = shuffleArray(gameState.currentRoundQuestions);
    
    // Reset current question index
    gameState.player.currentQuestionIndex = 0;
}

// Load the current question
function loadQuestion() {
    // Verificar que tengamos preguntas para mostrar
    if (!gameState.currentRoundQuestions || gameState.currentRoundQuestions.length === 0) {
        console.error("No hay preguntas disponibles para mostrar");
        
        // Mostrar error en un modal
        elements.errorText.textContent = 'No hay suficientes preguntas disponibles para este nivel. Por favor contacta al administrador.';
        elements.errorModal.classList.remove('hide');
        elements.overlay.classList.remove('hide');
        
        // Volver a la pantalla inicial
        setTimeout(() => {
            showScreen(elements.startScreen);
        }, 3000);
        
        return;
    }
    
    // Get the current question
    gameState.currentQuestion = gameState.currentRoundQuestions[gameState.player.currentQuestionIndex];
    
    // Verificar que la pregunta sea válida
    if (!gameState.currentQuestion) {
        console.error("La pregunta actual es inválida o nula");
        
        // Mostrar error en un modal
        elements.errorText.textContent = 'Ocurrió un error al cargar la pregunta. Por favor intenta de nuevo.';
        elements.errorModal.classList.remove('hide');
        elements.overlay.classList.remove('hide');
        
        // Volver a la pantalla inicial
        setTimeout(() => {
            showScreen(elements.startScreen);
        }, 3000);
        
        return;
    }
    
    // Actualizar el pilar actual según la pregunta que se está mostrando
    gameState.player.currentPillar = gameState.currentQuestion.pillar;
    
    // Get current round difficulty
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    
    // Update question UI - Usamos la longitud real de las preguntas disponibles
    elements.questionNumber.textContent = `Pregunta ${gameState.player.currentQuestionIndex + 1} de ${gameState.currentRoundQuestions.length}`;
    elements.questionText.textContent = gameState.currentQuestion.text;
    elements.currentPillar.textContent = `TEMA: ${gameState.player.currentPillar}`;
    elements.currentDifficulty.textContent = `Nivel: ${currentDifficulty}`;
    
    // Set pillar color for question container
    document.querySelector('.question-container').className = 'question-container';
    
    // Convertir el nombre del pilar a una clase CSS válida (eliminando emoji y espacios)
    const pillarClass = gameState.player.currentPillar
        .split(' ')[0]           // Solo tomar la primera palabra (ej: "Reputación" de "Reputación ❤️")
        .toLowerCase()           // Convertir a minúsculas
        .normalize("NFD")        // Normalizar caracteres acentuados
        .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        + '-theme';
    
    console.log(`Aplicando clase de pilar: ${pillarClass}`);
    document.querySelector('.question-container').classList.add(pillarClass);
    
    // Update answers - primero forzar un reflow para resetear estados visuales persistentes
    elements.answers.forEach((answer, index) => {
        // Eliminar todas las clases, forzar reflow y aplicar una transición temporal para resetear el estado visual
        answer.classList.remove('selected', 'correct', 'incorrect', 'disabled', 'reputacion-theme', 'oferta-theme', 'servicio-theme', 'trafico-theme', 'data-driven-theme');
        answer.style.transition = 'none';
        void answer.offsetWidth; // Forzar reflow para limpiar estados visuales en iOS
        answer.style.backgroundColor = ''; // Resetear explícitamente el fondo
        answer.style.color = '';           // Resetear explícitamente el color
        answer.style.transition = '';      // Restaurar transiciones
        
        // Usar setTimeout para asegurar que el estado visual esté completamente reseteado
        setTimeout(() => {
            // Agregar clase de tema después del reflow
            answer.classList.add(pillarClass);
        }, 10);
        
        elements.answerTexts[index].textContent = gameState.currentQuestion.options[index];
    });
    
    // Reset selected answer
    gameState.selectedAnswer = null;
    
    // Get time for this difficulty
    const difficultyKey = currentDifficulty.toLowerCase().replace(/ /g, '_');
    gameState.timeRemaining = GAME_CONFIG.timePerDifficulty[difficultyKey];
    
    // Start timer
    startTimer();
    
    // Play question sound
    if (typeof playSound === 'function') {
        playSound('question');
    }
}

// Handle answer selection
function selectAnswer(e) {
    // If game is not active or answer already selected, do nothing
    if (!gameState.gameActive || gameState.selectedAnswer !== null) return;
    
    // Find the parent answer div if clicked on a child element
    const answerElement = e.target.closest('.answer');
    if (!answerElement || answerElement.classList.contains('disabled')) return;
    
    // Desactivar temporalmente el evento táctil para evitar selecciones dobles
    e.preventDefault();
    
    // Get selected answer index
    const answerIndex = parseInt(answerElement.dataset.index);
    gameState.selectedAnswer = answerIndex;
    
    // Primero remover cualquier selección previa para evitar que iOS mantenga el efecto táctil
    elements.answers.forEach(ans => {
        ans.classList.remove('selected');
        ans.style.pointerEvents = 'none'; // Desactivar eventos de puntero temporalmente
        // Resetear explícitamente propiedades visuales
        ans.style.transition = 'none';
        ans.style.backgroundColor = '';
        ans.style.color = '';
        // Forzar un reflow para limpiar cualquier estado visual persistente
        void ans.offsetWidth;
        ans.style.transition = '';
    });
    
    // Luego aplicar la selección al elemento correcto
    setTimeout(() => {
        answerElement.classList.add('selected');
        
        // Reactivar eventos después de un tiempo
        setTimeout(() => {
            elements.answers.forEach(ans => {
                ans.style.pointerEvents = '';
            });
        }, 1000);
        
        // Play select sound
        if (typeof playSound === 'function') {
            playSound('select');
        }
        
        // Stop the timer
        stopTimer();
        
        // Check answer after a short delay
        // Limpiar cualquier setTimeout previo que pudiera quedar
        if (gameState.answerTimeout) {
            clearTimeout(gameState.answerTimeout);
        }
        // Guardar referencia al nuevo setTimeout para poder cancelarlo si es necesario
        gameState.answerTimeout = setTimeout(() => checkAnswer(answerIndex), 1500);
    }, 50);
}

// Check if the selected answer is correct
function checkAnswer(selectedIndex) {
    // If game is not active, do nothing
    if (!gameState.gameActive) return;
    
    // Disable all answers to prevent multiple selections
    elements.answers.forEach(answer => answer.classList.add('disabled'));
    
    // Get correct answer index
    const correctIndex = gameState.currentQuestion.correctIndex;
    
    // Check if the answer is correct
    const isCorrect = selectedIndex === correctIndex;
    
    // Update UI to show correct/incorrect
    elements.answers[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
    
    // Si la respuesta es correcta, mostrar que es correcta
    // Si es incorrecta, NO mostrar cuál era la respuesta correcta
    
    // Play sound
    if (typeof playSound === 'function') {
        playSound(isCorrect ? 'correct' : 'wrong');
    }
    
    // Increase delay before proceeding to next step
    setTimeout(() => {
        if (isCorrect) {
            handleCorrectAnswer();
        } else {
            handleWrongAnswer();
        }
    }, 3000);
}

// Handle a correct answer
function handleCorrectAnswer() {
    // IMPORTANTE: Siempre detener el temporizador primero al responder correctamente
    stopTimer();
    
    // Increment question index
    gameState.player.currentQuestionIndex++;
    
    // Increment questions answered counter
    gameState.player.questionsAnswered++;
    
    // Update progress dots
    updateProgressDots();
    
    // Calculate chances (1 chance per 5 correct questions)
    const newChances = Math.floor(gameState.player.questionsAnswered / 5);
    console.log(`Preguntas correctas: ${gameState.player.questionsAnswered}, Chances: ${newChances}`);
    
    // If just earned a new chance (divisible by 5), show modal instead of alert
    if (gameState.player.questionsAnswered > 0 && gameState.player.questionsAnswered % 5 === 0) {
        // SOLUCIÓN DRÁSTICA: Forzar la detención del temporizador directamente sin usar la función
        if (gameState.timer) {
            clearInterval(gameState.timer);
            gameState.timer = null;
            console.log("🚨 FORZANDO DETENCIÓN DIRECTA DEL TEMPORIZADOR");
        }
        
        // Desactivar el juego durante la celebración para evitar que cualquier timer se active
        gameState.gameActive = false;
        console.log("🛑 Temporizador detenido al ganar chance");
        
        // Verificar si ya se completó el nivel máximo del juego
        const isGameComplete = gameState.player.currentRound >= GAME_STRUCTURE.totalRounds && 
                             (gameState.player.questionsAnswered / 5) >= 5; // 5 chances = juego completo
        
        // Show round complete modal with custom message
        elements.roundCompleteTitle.textContent = `¡HAS GANADO UNA CHANCE! 🎉`;
        elements.roundCompleteTitle.classList.add('winner-text');
        
        // Play winner sound
        if (typeof playSound === 'function') {
            playSound('winner');
        }
        
        // Show confetti
        if (typeof showConfetti === 'function') {
            showConfetti();
        }
        
        // Texto del botón y mensaje según si es fin de juego o no
        if (isGameComplete || gameState.player.questionsAnswered >= 25) {
            // El juego ha sido completado
            console.log("¡El jugador ha completado todos los niveles! Juego terminado.");
            
            elements.roundCompleteMessage.textContent = 
                `¡FELICIDADES! Has completado el nivel ${GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1]}
                y has ganado ${newChances} chances en total.
                ¡Eres un Vendedor SUPER PRO de Mercado Libre!`;
            
            // Cambiar texto del botón
            elements.nextRoundButton.textContent = 'Ver Resultados Finales';
            
            // Marcar para terminar el juego cuando presione el botón
            gameState.gameCompleted = true;
            // Marcar como ganador
            gameState.playerWon = true;
        } else {
            // Increase difficulty level (move to next round)
            const oldDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
            
            // Increment round for increased difficulty (solo si no hemos llegado al máximo)
            if (gameState.player.currentRound < GAME_STRUCTURE.totalRounds) {
                gameState.player.currentRound++;
                console.log(`Incrementando nivel dificultad a: ${gameState.player.currentRound}`);
            }
            
            // Get new difficulty
            const newDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
            
            // Update prize display
            gameState.player.prize = newChances;
            elements.currentPrize.textContent = `${newChances} ${newChances === 1 ? 'Chance' : 'Chances'}`;
            
            // Update round complete message
            elements.roundCompleteMessage.textContent = 
                `¡EXCELENTE! Has completado el nivel ${oldDifficulty} 
                 y has ganado ${newChances} ${newChances === 1 ? 'chance' : 'chances'}.
                 Ahora avanzarás al nivel ${newDifficulty}.`;
            
            // Update next round button text
            elements.nextRoundButton.textContent = 'Continuar';
            
            // Update prize ladder
            updatePrizeLadder();
            
            // Mark current pillar as completed for this round
            const roundKey = `${gameState.player.currentRound - 1}-${gameState.player.currentPillar}`;
            if (!gameState.player.completedRounds.includes(roundKey)) {
                gameState.player.completedRounds.push(roundKey);
            }
            
            // Prepare questions for the next round
            prepareQuestionsForRound();
        }
        
        // Show the modal
        elements.roundCompleteModal.classList.remove('hide');
        elements.overlay.classList.remove('hide');
        
        return;
    }
    
    // Check if all questions in this round have been answered
    if (gameState.player.currentQuestionIndex >= gameState.currentRoundQuestions.length) {
        // Reset question index
        gameState.player.currentQuestionIndex = 0;
        
        // Mark current pillar as completed for this round
        const roundKey = `${gameState.player.currentRound}-${gameState.player.currentPillar}`;
        if (!gameState.player.completedRounds.includes(roundKey)) {
            gameState.player.completedRounds.push(roundKey);
        }
        
        // Check if all pillars for this round have been completed
        if (checkAllPillarsComplete()) {
            showPillarChangeModal();
        } else {
            // Select a new pillar
            selectNewPillar();
        }
    } else {
        // Load the next question
        loadQuestion();
    }
}

// Handle a wrong answer
function handleWrongAnswer() {
    // End the game (player lost)
    endGame(false);
}

// Check if all pillars are completed for current round
function checkAllPillarsComplete() {
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    const availablePillars = gameState.availablePillarsByDifficulty[currentDifficulty] || [];
    
    if (availablePillars.length === 0) {
        console.warn(`No hay pilares disponibles para la dificultad ${currentDifficulty}`);
        return true;
    }
    
    // Check if all available pillars for this round have been completed
    const completedCount = availablePillars.filter(pillar => {
        const pillarKey = `${gameState.player.currentRound}-${pillar}`;
        return gameState.player.completedRounds.includes(pillarKey);
    }).length;
    
    return completedCount >= availablePillars.length;
}

// Select a new pillar
function selectNewPillar() {
    // Select a new random pillar
    selectRandomPillar();
    
    // Prepare new set of questions for this pillar and round
    prepareQuestionsForRound();
    
    // Show pillar change modal
    showPillarChangeModal();
}

// Show pillar change modal
function showPillarChangeModal() {
    // Verificar si hemos respondido un número de preguntas múltiplo de 5
    const isChanceEarned = gameState.player.questionsAnswered > 0 && gameState.player.questionsAnswered % 5 === 0;
    
    if (isChanceEarned) {
        // Esta situación se maneja en handleCorrectAnswer()
        return;
    }
    
    // Detener el juego durante la transición
    gameState.gameActive = false;
    
    // Set modal title and message for pillar change
    elements.roundCompleteTitle.textContent = '¡Has completado este TEMA!';
    elements.roundCompleteTitle.classList.add('violet-text');
    elements.roundCompleteMessage.textContent = `Ahora continuarás con preguntas del tema: ${gameState.player.currentPillar}`;
    elements.nextRoundButton.textContent = 'Continuar';
    
    // Show the modal
    elements.roundCompleteModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');
}

// End Game
function endGame(isWinner) {
    // Stop game activity
    gameState.gameActive = false;
    gameState.gameEndTime = new Date();
    gameState.playerWon = isWinner;
    
    // Calculate total game time
    const totalTimeMs = gameState.gameEndTime - gameState.gameStartTime;
    gameState.player.totalGameTimeSeconds = Math.floor(totalTimeMs / 1000);
    
    // Stop the timer
    stopTimer();
    
    // Update results UI
    elements.resultTitle.textContent = isWinner ? '¡FELICIDADES!' : 'Juego Terminado';
    elements.resultPlayerName.textContent = gameState.player.name;
    elements.resultPlayerPhone.textContent = gameState.player.phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    
    // Calculate final prize
    const finalChances = Math.floor(gameState.player.questionsAnswered / 5);
    const totalQuestionsRequired = GAME_STRUCTURE.totalRounds * GAME_STRUCTURE.questionsPerRound;
    elements.resultPrize.textContent = `${finalChances} ${finalChances === 1 ? 'Chance' : 'Chances'}`;
    elements.resultRound.textContent = `${gameState.player.questionsAnswered} de ${totalQuestionsRequired}`;
    elements.resultPillar.textContent = gameState.player.currentPillar;
    
    // Show results screen
    showScreen(elements.resultsScreen);
    
    // Save the score
    saveScore(gameState.player.name, finalChances, gameState.player.currentRound, gameState.player.currentPillar);
}

// Start Timer
function startTimer() {
    // Clear existing timer
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    
    // Reset timer UI
    elements.timerBar.style.width = '100%';
    
    // Calculate time per frame based on total time
    const fps = 30; // frames per second
    const totalFrames = gameState.timeRemaining * fps;
    const msPerFrame = 1000 / fps;
    let currentFrame = 0;
    
    // Set timer interval
    gameState.timer = setInterval(() => {
        if (!gameState.gameActive) {
            clearInterval(gameState.timer);
            return;
        }
        
        currentFrame++;
        const percentRemaining = 100 - (currentFrame / totalFrames * 100);
        
        // Update timer UI
        elements.timerBar.style.width = `${percentRemaining}%`;
        
        // Update class for color changes
        if (percentRemaining <= 25) {
            elements.timerBar.className = 'critical';
            
            // Play time low sound at 25%
            if (percentRemaining <= 25.5 && percentRemaining >= 24.5 && typeof playSound === 'function') {
                playSound('timeLow');
            }
        } else if (percentRemaining <= 50) {
            elements.timerBar.className = 'warning';
            
            // Play time running sound at 50%
            if (percentRemaining <= 50.5 && percentRemaining >= 49.5 && typeof playSound === 'function') {
                playSound('timeRunning');
            }
        } else {
            elements.timerBar.className = '';
        }
        
        // Check if time is up
        if (currentFrame >= totalFrames) {
            clearInterval(gameState.timer);
            gameState.timer = null;
            timeUp();
        }
    }, msPerFrame);
}

// Stop Timer
function stopTimer() {
    // Clear timer interval
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
        console.log("🛑 Timer detenido");
    }
}

// Time Up
function timeUp() {
    // Only proceed if game is active
    if (!gameState.gameActive) return;
    
    // Game over due to time up
    console.log("Tiempo agotado");
    
    // Show message
    elements.errorText.textContent = "¡Se acabó el tiempo!";
    elements.errorModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');
    
    // Wait 2 seconds then end game
    setTimeout(() => {
        elements.errorModal.classList.add('hide');
        elements.overlay.classList.add('hide');
        
        // End game (player lost)
        handleWrongAnswer();
    }, 2000);
}

// Use Lifeline
function useLifeline(e) {
    // If game is not active, do nothing
    if (!gameState.gameActive) return;
    
    // Get the lifeline type from the element's ID
    const lifeline = e.currentTarget.id;
    
    // Check if the lifeline has already been used
    if (gameState.player.usedLifelines[lifeline]) {
        console.log(`El comodín ${lifeline} ya ha sido usado`);
        return;
    }
    
    // Mark lifeline as used
    gameState.player.usedLifelines[lifeline] = true;
    e.currentTarget.classList.add('used');
    
    // Play lifeline sound
    if (typeof playSound === 'function') {
        playSound('lifeline');
    }
    
    // Apply the lifeline effect
    switch (lifeline) {
        case 'fifty-fifty':
            applyFiftyFifty();
            break;
        case 'audience-help':
            showAudienceHelp();
            break;
        case 'expert-call':
            showExpertCall();
            break;
    }
}

// Apply 50:50 Lifeline
function applyFiftyFifty() {
    // Get the correct answer index
    const correctIndex = gameState.currentQuestion.correctIndex;
    
    // Create an array of incorrect answer indices
    const incorrectIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
    
    // Shuffle the incorrect answers
    shuffleArray(incorrectIndices);
    
    // Select two incorrect answers to remove (leave one incorrect and the correct)
    const toRemove = incorrectIndices.slice(0, 2);
    
    // Hide the selected incorrect answers
    toRemove.forEach(index => {
        elements.answers[index].classList.add('disabled');
        elements.answers[index].style.opacity = '0.3';
        elements.answerTexts[index].textContent = '...';
    });
}

// Show Audience Help
function showAudienceHelp() {
    // Get the current difficulty and correct answer index
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    const correctIndex = gameState.currentQuestion.correctIndex;
    
    // Generate audience percentages
    const percentages = generateAudiencePercentages(currentDifficulty, correctIndex);
    
    // Update the audience poll UI
    elements.audienceChartBars.forEach((bar, index) => {
        bar.style.height = `${percentages[index]}%`;
    });
    
    elements.audiencePercentages.forEach((element, index) => {
        element.textContent = `${percentages[index]}%`;
    });
    
    // Show the audience help modal
    elements.audienceModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');
}

// Generate audience percentages for the poll
function generateAudiencePercentages(difficulty, correctIndex) {
    // Difficulty affects how accurate the audience is
    let correctPercentage;
    
    switch (difficulty) {
        case 'Fácil 🟢':
            correctPercentage = 70 + Math.floor(Math.random() * 20); // 70-89%
            break;
        case 'Menos fácil 🟡':
            correctPercentage = 60 + Math.floor(Math.random() * 20); // 60-79%
            break;
        case 'Difícil 🔴':
            correctPercentage = 50 + Math.floor(Math.random() * 20); // 50-69%
            break;
        case 'Muy difícil 🔥':
            correctPercentage = 40 + Math.floor(Math.random() * 20); // 40-59%
            break;
        case 'Complicada 💀':
            correctPercentage = 30 + Math.floor(Math.random() * 20); // 30-49%
            break;
        default:
            correctPercentage = 60;
    }
    
    // Distribute the remaining percentage among the incorrect answers
    const remainingPercentage = 100 - correctPercentage;
    let percentages = [0, 0, 0, 0];
    
    // Assign the correct percentage to the correct answer
    percentages[correctIndex] = correctPercentage;
    
    // Get indices of incorrect answers
    const incorrectIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
    
    // Distribute remaining percentage randomly
    let remaining = remainingPercentage;
    for (let i = 0; i < incorrectIndices.length - 1; i++) {
        const maxForThis = remaining - (incorrectIndices.length - i - 1);
        const randomPercent = Math.floor(Math.random() * maxForThis);
        percentages[incorrectIndices[i]] = randomPercent;
        remaining -= randomPercent;
    }
    
    // Assign the remaining percentage to the last incorrect answer
    percentages[incorrectIndices[incorrectIndices.length - 1]] = remaining;
    
    return percentages;
}

// Show Expert Call
function showExpertCall() {
    // Get the correct answer
    const correctIndex = gameState.currentQuestion.correctIndex;
    const correctOption = String.fromCharCode(65 + correctIndex); // Convert 0-3 to A-D
    
    // Expert confidence level depends on question difficulty
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    
    let confidenceLevel;
    switch (currentDifficulty) {
        case 'Fácil 🟢':
            confidenceLevel = 'very-confident'; // 95% correct
            break;
        case 'Menos fácil 🟡':
            confidenceLevel = 'confident'; // 80% correct
            break;
        case 'Difícil 🔴':
            confidenceLevel = 'somewhat-confident'; // 70% correct
            break;
        case 'Muy difícil 🔥':
            confidenceLevel = 'unsure'; // 60% correct
            break;
        case 'Complicada 💀':
            confidenceLevel = 'guessing'; // 50% correct
            break;
        default:
            confidenceLevel = 'confident';
    }
    
    // Generate expert advice
    const advice = generateExpertAdvice(correctOption, confidenceLevel);
    
    // Update expert modal UI
    elements.expertAdvice.textContent = advice;
    
    // Show the expert modal
    elements.expertModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');
}

// Generate expert advice based on confidence level
function generateExpertAdvice(correctOption, confidenceLevel) {
    const randomChance = Math.random() * 100;
    
    let isCorrect = false;
    let adviceIntro = '';
    
    // Determine if the expert gives the correct answer based on confidence level
    switch (confidenceLevel) {
        case 'very-confident':
            isCorrect = randomChance < 95;
            adviceIntro = 'Estoy muy seguro de que ';
            break;
        case 'confident':
            isCorrect = randomChance < 80;
            adviceIntro = 'Estoy bastante seguro de que ';
            break;
        case 'somewhat-confident':
            isCorrect = randomChance < 70;
            adviceIntro = 'Creo que ';
            break;
        case 'unsure':
            isCorrect = randomChance < 60;
            adviceIntro = 'No estoy completamente seguro, pero creo que ';
            break;
        case 'guessing':
            isCorrect = randomChance < 50;
            adviceIntro = 'Es difícil saberlo, pero si tuviera que adivinar diría que ';
            break;
    }
    
    // If not correct, select a random wrong option
    let suggestedOption = correctOption;
    if (!isCorrect) {
        const options = ['A', 'B', 'C', 'D'].filter(opt => opt !== correctOption);
        suggestedOption = options[Math.floor(Math.random() * options.length)];
    }
    
    return `${adviceIntro}la respuesta correcta es la opción ${suggestedOption}.`;
}

// Show a specific screen
function showScreen(screen) {
    // Hide all screens
    elements.loadingScreen.classList.add('hide');
    elements.errorScreen.classList.add('hide');
    elements.startScreen.classList.add('hide');
    elements.gameScreen.classList.add('hide');
    elements.resultsScreen.classList.add('hide');
    elements.leaderboardScreen.classList.add('hide');
    
    // Show the requested screen
    screen.classList.remove('hide');
}

// Update prize display
function updatePrizeDisplay() {
    const chances = Math.floor(gameState.player.questionsAnswered / 5);
    elements.currentPrize.textContent = `${chances} ${chances === 1 ? 'Chance' : 'Chances'}`;
}

// Update the prize ladder UI
function updatePrizeLadder() {
    elements.prizeLadder.forEach(level => {
        level.classList.remove('current', 'completed');
        
        const levelRound = parseInt(level.dataset.round);
        
        if (levelRound < gameState.player.currentRound) {
            level.classList.add('completed');
        } else if (levelRound === gameState.player.currentRound) {
            level.classList.add('current');
        }
    });
}

// Update progress dots
function updateProgressDots() {
    // Reset all dots
    elements.progressDots.forEach(dot => {
        dot.classList.remove('completed');
    });
    
    // Calculate how many dots to fill based on questions answered mod 5
    const dotsToFill = gameState.player.questionsAnswered % 5;
    
    // Fill dots
    for (let i = 0; i < dotsToFill; i++) {
        if (elements.progressDots[i]) {
            elements.progressDots[i].classList.add('completed');
        }
    }
}

// Show confetti animation
function showConfetti() {
    // Check if confetti function exists
    if (typeof startConfetti === 'function') {
        elements.confettiCanvas.classList.remove('hide');
        startConfetti();
    }
}

// Close all modals
function closeModals() {
    elements.overlay.classList.add('hide');
    elements.expertModal.classList.add('hide');
    elements.audienceModal.classList.add('hide');
    elements.roundCompleteModal.classList.add('hide');
}

// Handle error modal close
function handleErrorModalClose() {
    elements.errorModal.classList.add('hide');
    elements.overlay.classList.add('hide');
}

// Show leaderboard
async function showLeaderboard() {
    // Show leaderboard screen
    showScreen(elements.leaderboardScreen);
    
    // Show loading animation
    elements.leaderboardLoading.classList.remove('hide');
    elements.leaderboardTable.classList.add('hide');
    
    try {
        // Get leaderboard data
        const scores = await getLeaderboard();
        
        // Update leaderboard UI
        updateLeaderboard(scores);
        
        // Hide loading animation
        elements.leaderboardLoading.classList.add('hide');
        elements.leaderboardTable.classList.remove('hide');
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        elements.leaderboardLoading.innerHTML = `
            <p class="error-message">Error al cargar la tabla de líderes: ${error.message}</p>
        `;
    }
}

// Hide leaderboard
function hideLeaderboard() {
    // Return to appropriate screen
    if (gameState.gameActive) {
        showScreen(elements.gameScreen);
    } else if (gameState.gameEndTime) {
        showScreen(elements.resultsScreen);
    } else {
        showScreen(elements.startScreen);
    }
}

// Update leaderboard UI
function updateLeaderboard(scores) {
    // Clear existing leaderboard
    elements.leaderboardBody.innerHTML = '';
    
    if (!scores || !scores.length) {
        // No scores yet
        elements.leaderboardBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-scores">No hay puntajes registrados aún</td>
            </tr>
        `;
        return;
    }
    
    // Format and add each score to the table
    scores.forEach((score, index) => {
        const row = document.createElement('tr');
        
        // Format date
        const scoreDate = new Date(score.date);
        const formattedDate = `${scoreDate.getDate()}/${scoreDate.getMonth() + 1}/${scoreDate.getFullYear()}`;
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.name}</td>
            <td>${score.prize}</td>
            <td>${score.questionsAnswered || 0}</td>
            <td>${score.gameTimeSeconds || '-'}</td>
            <td>${score.maxRound || 1}</td>
            <td>${formattedDate}</td>
        `;
        
        elements.leaderboardBody.appendChild(row);
    });
}

// Save score to the server
async function saveScore(name, prize, maxRound, finalPillar) {
    try {
        const scoreData = {
            name: name,
            phone: gameState.player.phone,
            prize: prize,
            questionsAnswered: gameState.player.questionsAnswered,
            gameTimeSeconds: gameState.player.totalGameTimeSeconds,
            maxRound: maxRound,
            finalPillar: finalPillar,
            date: new Date().toISOString()
        };
        
        console.log('Guardando puntaje:', scoreData);
        
        // Call API to save score
        const response = await fetch(API_ENDPOINTS.saveScore, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scoreData)
        });
        
        if (!response.ok) {
            throw new Error(`Error al guardar el puntaje: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Puntaje guardado exitosamente:', data);
        
        return data;
    } catch (error) {
        console.error('Error saving score:', error);
        // Show error message
        elements.errorText.textContent = `Error al guardar tu puntaje: ${error.message}`;
        elements.errorModal.classList.remove('hide');
        elements.overlay.classList.remove('hide');
        
        throw error;
    }
}

// Get leaderboard data from the server
async function getLeaderboard() {
    try {
        // Call API to get top scores
        const response = await fetch(API_ENDPOINTS.topScores);
        
        if (!response.ok) {
            throw new Error(`Error al obtener tabla de líderes: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Tabla de líderes cargada:', data);
        
        return data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
    }
}

// Utility function to shuffle an array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}