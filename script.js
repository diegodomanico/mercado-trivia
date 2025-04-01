// DOM Elements
const elements = {
    // Screens
    loadingScreen: document.getElementById('loading-screen'),
    errorScreen: document.getElementById('error-screen'),
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    resultsScreen: document.getElementById('results-screen'),
    leaderboardScreen: document.getElementById('leaderboard-screen'),
    
    // Error Screen
    errorMessage: document.getElementById('error-message'),
    retryButton: document.getElementById('retry-button'),
    
    // Error Modal
    errorModal: document.getElementById('error-modal'),
    errorText: document.getElementById('error-text'),
    errorOkBtn: document.getElementById('error-ok-btn'),
    
    // Start Screen
    playerNameInput: document.getElementById('player-name'),
    playerPhoneInput: document.getElementById('player-phone'),
    phoneError: document.getElementById('phone-error'),
    nameError: document.getElementById('name-error'),
    startGameButton: document.getElementById('start-game'),
    statusIcon: document.getElementById('status-icon'),
    statusText: document.getElementById('status-text'),
    
    // Game Screen
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
    lifelines: Array.from(document.querySelectorAll('.lifeline')),
    prizeLevels: Array.from(document.querySelectorAll('.prize-level')),
    
    // Results Screen
    resultTitle: document.getElementById('result-title'),
    resultPlayerName: document.getElementById('result-player-name'),
    resultPlayerPhone: document.getElementById('result-player-phone'),
    resultPrize: document.getElementById('result-prize'),
    resultRound: document.getElementById('result-round'),
    resultPillar: document.getElementById('result-pillar'),
    viewLeaderboardButton: document.getElementById('view-leaderboard'),
    viewLeaderboardStartButton: document.getElementById('view-leaderboard-start'),
    
    // Leaderboard Screen
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
    audienceChartBars: Array.from(document.querySelectorAll('.chart-bar')),
    closeAudienceModalButton: document.getElementById('close-audience-modal'),
    
    // Confetti
    confettiCanvas: document.getElementById('confetti-canvas')
};

// Game State
const gameState = {
    // Game active status
    gameActive: false,
    gameStartTime: null,
    gameEndTime: null,
    gameCompleted: false,
    playerWon: false,
    
    // Timer
    timer: null,
    timeRemaining: 0,
    
    // Questions
    allQuestions: null,
    currentRoundQuestions: [],
    currentQuestion: null,
    selectedAnswer: null,
    
    // Player data
    player: {
        name: '',
        phone: '',
        currentRound: 1,
        currentPillar: '',
        currentQuestionIndex: 0,
        questionsAnswered: 0,
        prize: 0,
        completedRounds: [],
        totalGameTimeSeconds: 0,
        usedLifelines: {
            'fifty-fifty': false,
            'audience-help': false,
            'expert-call': false
        }
    }
};

// Initialize the game
document.addEventListener('DOMContentLoaded', initGame);

// Event Listeners
elements.retryButton.addEventListener('click', initGame);
elements.startGameButton.addEventListener('click', checkPhoneAndStartGame);
elements.answers.forEach(answer => answer.addEventListener('click', selectAnswer));
elements.lifelines.forEach(lifeline => lifeline.addEventListener('click', useLifeline));
elements.viewLeaderboardButton.addEventListener('click', showLeaderboard);
elements.viewLeaderboardStartButton.addEventListener('click', showLeaderboard);
elements.hideLeaderboardButton.addEventListener('click', hideLeaderboard);
// Manejar el botón para continuar después de completar ronda o ganar chance
elements.nextRoundButton.addEventListener('click', function() {
    console.log("Botón Continuar presionado");
    
    // PRIMERO: Forzar la detención del temporizador en cualquier caso
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
        console.log("🛑 FORZANDO DETENCIÓN DEL TEMPORIZADOR al presionar Continuar");
    }
    
    // Verificar si el juego ha sido completado primero
    if (gameState.gameCompleted || gameState.playerWon) {
        console.log("Juego completado con éxito. Mostrando pantalla final.");
        
        // Ocultar modal antes de mostrar pantalla de resultados
        elements.roundCompleteModal.classList.add('hide');
        elements.overlay.classList.add('hide');
        
        // Detener la animación de confetis
        if (typeof stopConfetti === 'function') {
            stopConfetti();
        }
        
        // Llamar a endGame para ir a la pantalla de resultados
        endGame(true);
        return;
    }
    
    // Si no es fin de juego, continuar normalmente
    // Ocultar el modal
    elements.roundCompleteModal.classList.add('hide');
    elements.overlay.classList.add('hide');
    
    // Remover las clases de estilo que podrían estar presentes
    elements.roundCompleteTitle.classList.remove('violet-text');
    elements.roundCompleteTitle.classList.remove('winner-text');
    
    // Detener la animación de confetis si está activa
    if (typeof stopConfetti === 'function') {
        stopConfetti();
    }
    
    // Reactivar el juego para continuar
    gameState.gameActive = true;
    
    // Cargar la siguiente pregunta
    loadQuestion();
    
    // Esperar un poco antes de iniciar el temporizador para dar tiempo al jugador
    setTimeout(() => {
        console.log("Iniciando nuevo temporizador después de ganar una chance");
        // Reiniciar temporizador para la nueva pregunta
        const difficultyKey = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1].toLowerCase().replace(/ /g, '_');
        gameState.timeRemaining = GAME_CONFIG.timePerDifficulty[difficultyKey];
        startTimer();
    }, 1000); // Aumentado el retraso para asegurar que la UI se actualice completamente
});
elements.closeExpertModalButton.addEventListener('click', closeModals);
elements.closeAudienceModalButton.addEventListener('click', closeModals);
elements.errorOkBtn.addEventListener('click', handleErrorModalClose);

// Initialize Game
async function initGame() {
    // Show loading screen
    showScreen(elements.loadingScreen);
    
    // Reset game state
    resetGameState();
    
    // Set loading status for API connection
    elements.statusIcon.className = 'status-icon loading';
    elements.statusText.textContent = 'Verificando conexión a la base de datos...';
    elements.startGameButton.disabled = true;
    
    try {
        // Load all questions
        await loadAllQuestions();
        
        // Show start screen if questions were loaded successfully
        showScreen(elements.startScreen);
    } catch (error) {
        // Show error screen with message
        console.error('Error initializing game:', error);
        elements.errorMessage.textContent = `Error: ${error.message}. Por favor intenta nuevamente.`;
        showScreen(elements.errorScreen);
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
        elements.startGameButton.disabled = true;
        return;
    }
    
    if (!data || !data.total || data.total === 0) {
        // No data o insuficientes preguntas - no permitimos jugar
        elements.statusIcon.className = 'status-icon disconnected';
        elements.statusText.textContent = 'No hay suficientes preguntas en Airtable. No se puede iniciar el juego.';
        elements.startGameButton.disabled = true;
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
        elements.startGameButton.disabled = true;
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
    
    elements.startGameButton.disabled = false;
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

// Check Phone Number and Start Game
async function checkPhoneAndStartGame(e) {
    e.preventDefault();
    
    // Limpiar errores previos
    elements.phoneError.classList.add('hide');
    elements.playerPhoneInput.classList.remove('input-error');
    elements.nameError.classList.add('hide');
    elements.playerNameInput.classList.remove('input-error');
    
    // Get player input
    const name = elements.playerNameInput.value.trim();
    const phone = elements.playerPhoneInput.value.trim();
    
    // Validar el nombre
    if (!name) {
        elements.nameError.textContent = 'Por favor ingresa tu nombre';
        elements.nameError.classList.remove('hide');
        elements.playerNameInput.classList.add('input-error');
        return;
    }
    
    // Validar que el teléfono no esté vacío
    if (!phone) {
        elements.phoneError.textContent = 'Por favor ingresa tu número de teléfono';
        elements.phoneError.classList.remove('hide');
        elements.playerPhoneInput.classList.add('input-error');
        return;
    }
    
    // Simple phone validation (Argentina numbers)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
        elements.phoneError.textContent = 'El número de teléfono debe tener 10 dígitos (sin 0 ni 15)';
        elements.phoneError.classList.remove('hide');
        elements.playerPhoneInput.classList.add('input-error');
        return;
    }
    
    try {
        // Check if phone has already played
        // IMPORTANTE: Ya no permitimos jugar si hay un error en la validación
        try {
            // Asegurar que se envía como string
            const phoneStr = String(phone);
            const response = await fetch(API_ENDPOINTS.checkPhone(phoneStr));
            if (!response.ok) {
                throw new Error(`Error al verificar teléfono: ${response.status}`);
            }
            const data = await response.json();
            
            if (!data.valid) {
                // Mostramos el mensaje de error personalizado que viene del servidor
                elements.phoneError.textContent = data.message || 'Este número ya participó en el juego. Cada número solo puede participar una vez.';
                elements.phoneError.classList.remove('hide');
                elements.playerPhoneInput.classList.add('input-error');
                return;
            }
        } catch (phoneError) {
            console.warn('Error validando el teléfono:', phoneError);
            // Ahora mostramos error y no permitimos jugar cuando hay error
            elements.phoneError.textContent = 'Error al verificar el teléfono en la base de datos. Intenta nuevamente.';
            elements.phoneError.classList.remove('hide');
            elements.playerPhoneInput.classList.add('input-error');
            return;
        }
        
        // Clear any previous errors
        elements.phoneError.classList.add('hide');
        elements.playerPhoneInput.classList.remove('input-error');
        
        // Store player data
        gameState.player.name = name;
        gameState.player.phone = String(phone); // Aseguramos que sea string
        
        // Start the game
        startGame();
    } catch (error) {
        console.error('Error checking phone:', error);
        // Mostrar mensaje de error específico en un modal
        if (error.message.includes('base de datos')) {
            elements.errorText.textContent = 'Error al conectar con la base de datos. Por favor intenta de nuevo más tarde.';
        } else {
            elements.errorText.textContent = 'Error al verificar el número de teléfono. Por favor intenta de nuevo.';
        }
        elements.errorModal.classList.remove('hide');
        elements.overlay.classList.remove('hide');
        return; // Asegurarnos de que no continúe
    }
}

// Start the Game
function startGame() {
    // Set game as active and record start time
    gameState.gameActive = true;
    gameState.gameStartTime = new Date();
    
    // Reset lifelines UI
    elements.lifelines.forEach(lifeline => {
        lifeline.classList.remove('used');
    });
    
    // Update player name display
    elements.playerNameDisplay.textContent = gameState.player.name;
    
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
            
            // Increment round for increased difficulty (solo si no estamos en el último nivel)
            if (gameState.player.currentRound < GAME_STRUCTURE.totalRounds) {
                gameState.player.currentRound++;
            }
            
            const newDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
            
            elements.roundCompleteMessage.textContent = 
                `¡Felicidades! Has ganado 1 Chance por responder correctamente 5 preguntas.
                 Ahora avanzarás al nivel ${newDifficulty} de dificultad. 
                 ¡Sigue así para ganar más chances!`;
            
            // Set button text
            elements.nextRoundButton.textContent = 'Continuar';
            
            // Prepare questions for the new round
            prepareQuestionsForRound();
        }
        
        // Show the modal
        elements.roundCompleteModal.classList.remove('hide');
        elements.overlay.classList.remove('hide');
        
        // The nextRoundButton click event will hide the modal and continue the game
        
        // Update prize ladder to show current level
        updatePrizeLadder();
    }
    
    // Update prizes
    gameState.player.prize = newChances;
    
    // Update prize display
    updatePrizeDisplay();
    
    // Check if all questions in the round have been answered
    if (gameState.player.currentQuestionIndex >= gameState.currentRoundQuestions.length) {
        // Mark this pillar as completed
        const completedPillarKey = `${gameState.player.currentRound}-${gameState.player.currentPillar}`;
        gameState.player.completedRounds.push(completedPillarKey);
        
        // Check if all pillars have been completed in this round
        const allPillarsComplete = checkAllPillarsComplete();
        
        if (allPillarsComplete) {
            // If this was the last round, player wins
            if (gameState.player.currentRound >= GAME_STRUCTURE.totalRounds) {
                endGame(true);
            } else {
                // Otherwise, show round complete modal
                completeRound();
            }
        } else {
            // Otherwise, select a new pillar and continue
            selectNewPillar();
        }
    } else {
        // Load next question
        setTimeout(loadQuestion, 1500);
    }
}

// Handle a wrong answer
function handleWrongAnswer() {
    // End game with loss
    endGame(false);
}

// Check if all pillars have been completed in the current round
function checkAllPillarsComplete() {
    // Verificar si ya se alcanzaron las 25 preguntas (5 chances) - esto es fin de juego
    if (gameState.player.questionsAnswered >= 25) {
        console.log("🎮 FIN DEL JUEGO: Se respondieron 25 preguntas (5 chances)");
        gameState.gameCompleted = true;
        gameState.playerWon = true;
        return true;
    }
    
    // Get current difficulty
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    
    // Get available pillars for this difficulty
    const availablePillars = gameState.availablePillarsByDifficulty[currentDifficulty] || [];
    
    // Si no hay temas disponibles, consideramos que ya están completos
    if (availablePillars.length === 0) {
        console.warn(`No hay temas disponibles para la dificultad ${currentDifficulty}. Considerando ronda completada.`);
        return true;
    }
    
    // Count how many pillars have been completed in this round
    const completedPillarsInRound = gameState.player.completedRounds.filter(key => 
        key.startsWith(`${gameState.player.currentRound}-`)
    ).length;
    
    console.log(`Pilares completados: ${completedPillarsInRound}/${availablePillars.length}`);
    
    // Check if all available pillars have been completed
    return completedPillarsInRound >= availablePillars.length;
}

// Select a new pillar and prepare questions
function selectNewPillar() {
    // Select a new random pillar
    selectRandomPillar();
    
    // Prepare questions for the new pillar
    prepareQuestionsForRound();
    
    // Show modal with pillar change info
    showPillarChangeModal();
}

// Show the pillar change modal
function showPillarChangeModal() {
    // Si el juego está completado, ir directamente a la pantalla de resultados
    if (gameState.gameCompleted || gameState.playerWon || gameState.player.questionsAnswered >= 25) {
        console.log("🏆 Juego completado durante cambio de pilar, mostrando resultados finales");
        gameState.gameCompleted = true;
        gameState.playerWon = true;
        
        // Terminar el juego como ganador
        endGame(true);
        return;
    }
    
    elements.roundCompleteTitle.textContent = `¡Cambiando de TEMA! 🔄`;
    elements.roundCompleteMessage.textContent = 
        `Ahora jugarás con preguntas del tema ${gameState.player.currentPillar}. ¡Mantén el buen desempeño!`;
    
    elements.roundCompleteModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');
    
    // Auto-continue after 3 seconds
    setTimeout(() => {
        // Verificar nuevamente si el juego se completó mientras esperaba
        if (gameState.gameCompleted || gameState.playerWon || gameState.player.questionsAnswered >= 25) {
            console.log("🏆 Juego completado durante espera de 3 segundos, mostrando resultados finales");
            endGame(true);
            return;
        }
        
        elements.roundCompleteModal.classList.add('hide');
        elements.overlay.classList.add('hide');
        loadQuestion();
    }, 3000);
}

// Complete the current round and prepare for the next
function completeRound() {
    // Si ya se han completado las 25 preguntas totales o se alcanzó el nivel final, 
    // terminar como ganador en lugar de avanzar
    if (gameState.player.questionsAnswered >= 25 || gameState.player.currentRound >= GAME_STRUCTURE.totalRounds) {
        console.log("🏆 Última ronda completada, finalizando juego como ganador");
        gameState.gameCompleted = true;
        gameState.playerWon = true;
        endGame(true);
        return;
    }
    
    // Play level up sound
    if (typeof playSound === 'function') {
        playSound('levelUp');
    }
    
    // Show round complete modal
    elements.roundCompleteTitle.textContent = `¡Ronda ${gameState.player.currentRound} Completada! 🎉`;
    elements.roundCompleteTitle.classList.add('violet-text');
    elements.roundCompleteMessage.textContent = 
        `¡Felicidades! Has completado todos los temas de la dificultad ${GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1]}. 
        Tienes ${formatCurrency(gameState.player.prize)} para participar en sorteos.
        ¡Prepárate para la siguiente ronda!`;
    
    elements.roundCompleteModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');
}

// La función startNextRound ya no se utiliza porque fue reemplazada
// por la función anónima en el event listener del botón nextRoundButton

// End the game
function endGame(isWinner) {
    // Set game as inactive and record end time
    gameState.gameActive = false;
    gameState.gameEndTime = new Date();
    
    // Calculate total game time in seconds
    if (gameState.gameStartTime) {
        const gameTimeMs = gameState.gameEndTime - gameState.gameStartTime;
        gameState.player.totalGameTimeSeconds = Math.floor(gameTimeMs / 1000);
        console.log(`Juego completado en ${gameState.player.totalGameTimeSeconds} segundos`);
    }
    
    // Asegurarnos de que el temporizador esté detenido
    console.log("🛑 Deteniendo temporizador al finalizar juego");
    stopTimer();
    
    // Update results screen
    if (isWinner) {
        elements.resultTitle.textContent = '¡FELICIDADES! ¡ERES UN VENDEDOR SUPER PRO!';
        elements.resultTitle.classList.add('winner-text');
        
        // Play winner sound
        if (typeof playSound === 'function') {
            playSound('winner');
        }
        
        // Show confetti
        if (typeof showConfetti === 'function') {
            showConfetti();
        }
    } else {
        elements.resultTitle.classList.remove('winner-text');
        if (gameState.timeRemaining <= 0) {
            elements.resultTitle.textContent = '¡SE ACABÓ EL TIEMPO!';
        } else {
            elements.resultTitle.textContent = '¡JUEGO TERMINADO!';
        }
    }
    
    // Update result details
    elements.resultPlayerName.textContent = gameState.player.name;
    elements.resultPlayerPhone.textContent = gameState.player.phone;
    elements.resultPrize.textContent = formatCurrency(gameState.player.prize);
    elements.resultRound.textContent = `${gameState.player.questionsAnswered} de 25`;
    
    // Mostrar el nivel de dificultad alcanzado en lugar del pilar
    const difficultyLevel = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    elements.resultPillar.textContent = difficultyLevel;
    
    // Save score to leaderboard - now using the same difficulty level
    saveScore(
        gameState.player.name, 
        gameState.player.prize, 
        gameState.player.currentRound,
        difficultyLevel
    );
    
    // Show results screen after a short delay
    setTimeout(() => {
        showScreen(elements.resultsScreen);
    }, 1500);
}

// Timer Functions
function startTimer() {
    // No iniciar temporizador si el juego no está activo
    if (!gameState.gameActive) {
        console.log("⚠️ Intento de iniciar temporizador mientras el juego está inactivo. Ignorando.");
        return;
    }
    
    // Clear any existing timer
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    
    // Asegurar que el valor del tiempo restante es válido
    if (typeof gameState.timeRemaining !== 'number' || gameState.timeRemaining <= 0) {
        console.warn("⚠️ Valor de tiempo restante inválido:", gameState.timeRemaining);
        // Establecer un valor predeterminado de seguridad
        gameState.timeRemaining = 30;
    }
    
    // Log para debugging
    console.log("Iniciando temporizador con " + gameState.timeRemaining + " segundos");
    
    // Inicializar la visualización del temporizador
    elements.timerBar.style.transition = 'none'; // Desactivar transición para reinicio instantáneo
    elements.timerBar.style.width = '100%';
    elements.timerBar.style.backgroundColor = 'var(--success-green)';
    
    // Forzar reflow para asegurar que los cambios se apliquen inmediatamente
    void elements.timerBar.offsetWidth;
    
    // Restaurar transición
    elements.timerBar.style.transition = 'width 1s linear, background-color 0.5s ease';
    
    // Actualizar la visualización del temporizador inmediatamente
    updateTimerDisplay();
    
    // Start the timer immediately
    gameState.timer = setInterval(() => {
        // Decrement time remaining
        gameState.timeRemaining--;
        
        console.log("Tiempo restante: " + gameState.timeRemaining);
        
        // Update timer display
        updateTimerDisplay();
        
        // Play sounds based on time remaining
        if (typeof playSound === 'function') {
            if (gameState.timeRemaining <= 5) {
                playSound('timeLow');
            } else if (gameState.timeRemaining <= 15) {
                playSound('timeRunning');
            }
        }
        
        // Check if time is up
        if (gameState.timeRemaining <= 0) {
            stopTimer();
            timeUp();
        }
    }, 1000);
}

// Stop the timer
function stopTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

// Update the timer display
function updateTimerDisplay() {
    // Calculate the percentage of time remaining
    const difficultyKey = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1].toLowerCase().replace(/ /g, '_');
    const totalTime = GAME_CONFIG.timePerDifficulty[difficultyKey];
    const percentage = (gameState.timeRemaining / totalTime) * 100;
    
    // Update the timer bar width
    elements.timerBar.style.width = `${percentage}%`;
    
    // Update the color based on time remaining
    if (percentage <= 20) {
        elements.timerBar.style.backgroundColor = 'var(--danger-red)';
    } else if (percentage <= 50) {
        elements.timerBar.style.backgroundColor = 'var(--warning-orange)';
    } else {
        elements.timerBar.style.backgroundColor = 'var(--success-green)';
    }
}

// Handle time up
function timeUp() {
    // Disable all answers
    elements.answers.forEach(answer => answer.classList.add('disabled'));
    
    // Don't show correct answer when time is up
    
    // Play wrong sound
    if (typeof playSound === 'function') {
        playSound('wrong');
    }
    
    // End game after a short delay
    setTimeout(() => {
        endGame(false);
    }, 2000);
}

// Lifeline Functions
function useLifeline(e) {
    // Get the lifeline element and ID
    const lifeline = e.currentTarget;
    const lifelineId = lifeline.id;
    
    // Check if the lifeline is already used or game is not active
    if (lifeline.classList.contains('used') || !gameState.gameActive) {
        return;
    }
    
    // Mark lifeline as used
    lifeline.classList.add('used');
    gameState.player.usedLifelines[lifelineId] = true;
    
    // Play lifeline sound
    if (typeof playSound === 'function') {
        playSound('lifeline');
    }
    
    // Apply the lifeline effect
    switch(lifelineId) {
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

// Apply the 50:50 lifeline
function applyFiftyFifty() {
    // Get the correct answer index
    const correctIndex = gameState.currentQuestion.correctIndex;
    
    // Get all incorrect answer indices
    const incorrectIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
    
    // Randomly select 2 incorrect answers to remove
    shuffleArray(incorrectIndices);
    const indicesToRemove = incorrectIndices.slice(0, 2);
    
    // Disable these answers
    indicesToRemove.forEach(index => {
        elements.answers[index].classList.add('disabled');
    });
}

// Show the audience help lifeline
function showAudienceHelp() {
    // Show overlay
    elements.overlay.classList.remove('hide');
    
    // Get the correct answer index
    const correctIndex = gameState.currentQuestion.correctIndex;
    
    // Generate audience percentages based on the difficulty
    const difficultyKey = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1].toLowerCase().replace(/ /g, '_');
    let percentages = generateAudiencePercentages(difficultyKey, correctIndex);
    
    // Update the audience chart
    elements.audienceChartBars.forEach((bar, index) => {
        const fill = bar.querySelector('.bar-fill');
        const percentage = bar.querySelector('.bar-percentage');
        const barLabel = bar.querySelector('.bar-label');
        
        // Reset height first
        fill.style.height = '0%';
        percentage.textContent = '0%';
        
        // Add or remove correct class
        if (index === correctIndex) {
            fill.classList.add('correct');
            barLabel.classList.add('correct');
        } else {
            fill.classList.remove('correct');
            barLabel.classList.remove('correct');
        }
        
        // Animate the chart after a short delay
        setTimeout(() => {
            fill.style.height = `${percentages[index]}%`;
            percentage.textContent = `${percentages[index]}%`;
        }, 500 + index * 300);
    });
    
    // Show the audience modal
    elements.audienceModal.classList.remove('hide');
}

// Generate audience percentages based on difficulty and correct answer
function generateAudiencePercentages(difficulty, correctIndex) {
    // Determine correct answer percentage based on difficulty
    let correctPercentage;
    switch(difficulty) {
        case 'fácil_🟢':
            correctPercentage = 65 + Math.floor(Math.random() * 20); // 65-84%
            break;
        case 'menos_fácil_🟡':
            correctPercentage = 55 + Math.floor(Math.random() * 20); // 55-74%
            break;
        case 'difícil_🔴':
            correctPercentage = 45 + Math.floor(Math.random() * 20); // 45-64%
            break;
        case 'muy_difícil_🔥':
            correctPercentage = 40 + Math.floor(Math.random() * 20); // 40-59%
            break;
        case 'complicada_💀':
            correctPercentage = 30 + Math.floor(Math.random() * 25); // 30-54%
            break;
        default:
            correctPercentage = 50;
    }
    
    // Initialize percentages for all options
    let percentages = [0, 0, 0, 0];
    percentages[correctIndex] = correctPercentage;
    
    // Distribute remaining percentage among incorrect options
    const remainingPercentage = 100 - correctPercentage;
    let distributed = 0;
    
    for (let i = 0; i < 4; i++) {
        if (i !== correctIndex) {
            // For the last incorrect option, assign all remaining percentage
            if (i === 3 || (i === 2 && correctIndex === 3)) {
                percentages[i] = remainingPercentage - distributed;
            } else {
                // Otherwise assign a random percentage
                const maxAssign = remainingPercentage - distributed - (2 - [0, 1, 2].filter(idx => idx !== correctIndex && idx > i).length);
                const assign = Math.max(1, Math.floor(Math.random() * maxAssign));
                percentages[i] = assign;
                distributed += assign;
            }
        }
    }
    
    return percentages;
}

// Show the expert call lifeline
function showExpertCall() {
    // Show overlay
    elements.overlay.classList.remove('hide');
    
    // Get the correct answer index and option letter
    const correctIndex = gameState.currentQuestion.correctIndex;
    const correctOption = String.fromCharCode(65 + correctIndex); // A, B, C, D
    
    // Determine confidence level based on difficulty
    let confidenceLevel;
    const difficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1].toLowerCase().replace(/ /g, '_');
    
    switch(difficulty) {
        case 'fácil_🟢':
            confidenceLevel = Math.random() < 0.8 ? 'high' : 'medium';
            break;
        case 'menos_fácil_🟡':
            confidenceLevel = Math.random() < 0.6 ? 'high' : (Math.random() < 0.8 ? 'medium' : 'low');
            break;
        case 'difícil_🔴':
            confidenceLevel = Math.random() < 0.4 ? 'high' : (Math.random() < 0.7 ? 'medium' : 'low');
            break;
        case 'muy_difícil_🔥':
            confidenceLevel = Math.random() < 0.3 ? 'high' : (Math.random() < 0.6 ? 'medium' : 'low');
            break;
        case 'complicada_💀':
            confidenceLevel = Math.random() < 0.2 ? 'high' : (Math.random() < 0.5 ? 'medium' : 'low');
            break;
        default:
            confidenceLevel = 'medium';
    }
    
    // Generate the expert advice
    const advice = generateExpertAdvice(correctOption, confidenceLevel);
    
    // Update the expert advice in the modal
    elements.expertAdvice.textContent = advice;
    
    // Show the expert modal
    elements.expertModal.classList.remove('hide');
}

// Generate expert advice based on the correct option and confidence level
function generateExpertAdvice(correctOption, confidenceLevel) {
    // Select a random template
    const template = EXPERT_ADVICE_TEMPLATES[Math.floor(Math.random() * EXPERT_ADVICE_TEMPLATES.length)];
    
    // Select a random reason based on confidence level
    const reasons = EXPERT_REASONS[confidenceLevel];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    
    // If confidence is not high, there's a chance the expert gives wrong advice
    let option = correctOption;
    if (confidenceLevel !== 'high' && Math.random() < (confidenceLevel === 'low' ? 0.3 : 0.15)) {
        // Select a wrong option
        const options = ['A', 'B', 'C', 'D'].filter(opt => opt !== correctOption);
        option = options[Math.floor(Math.random() * options.length)];
    }
    
    // Fill the template with the option and reason
    return template.replace('{option}', option).replace('{reason}', reason);
}

// UI Functions
function showScreen(screen) {
    // Hide all screens
    elements.loadingScreen.classList.add('hide');
    elements.errorScreen.classList.add('hide');
    elements.startScreen.classList.add('hide');
    elements.gameScreen.classList.add('hide');
    elements.resultsScreen.classList.add('hide');
    elements.leaderboardScreen.classList.add('hide');
    
    // Detener la animación de confeti si existe y está funcionando
    // excepto cuando vamos a la pantalla de resultados para un ganador
    if (typeof stopConfetti === 'function' && !(screen === elements.resultsScreen && gameState.player.currentRound >= GAME_STRUCTURE.totalRounds)) {
        stopConfetti();
    }
    
    // Show the requested screen
    screen.classList.remove('hide');
}

// Update the prize display
function updatePrizeDisplay() {
    elements.currentPrize.textContent = formatCurrency(gameState.player.prize);
}

// Update the prize ladder
function updatePrizeLadder() {
    // Highlight the current round in the prize ladder
    elements.prizeLevels.forEach(level => {
        level.classList.remove('current');
        
        const levelRound = parseInt(level.dataset.round);
        if (levelRound === gameState.player.currentRound) {
            level.classList.add('current');
        }
    });
    
    // Asegurar que el nivel actual en la barra superior coincida con el del ladder
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    elements.currentDifficulty.textContent = `Nivel: ${currentDifficulty}`;
}

// Format currency (changed to show chances instead of money amount)
function formatCurrency(amount) {
    // If amount is 0, show "0 Chances"
    if (amount === 0) {
        return `0 Chances`;
    } else if (amount === 1) {
        return `1 Chance`;
    } else {
        return `${amount} Chances`;
    }
}

// Update visual progress indicator (the 5 dots)
function updateProgressDots() {
    console.log("Actualizando puntos de progreso: " + gameState.player.questionsAnswered);
    // Calculate how many dots should be completed (1-5)
    const currentProgress = Math.min(5, gameState.player.questionsAnswered % 5);
    
    // Update each of the 5 dots
    for (let i = 0; i < 5; i++) {
        // Update the class of each progress dot
        if (i < currentProgress) {
            elements.progressDots[i].classList.add('completed');
        } else {
            elements.progressDots[i].classList.remove('completed');
        }
    }
}

// Show the confetti animation
function showConfetti() {
    // Make sure the confetti canvas is visible
    elements.confettiCanvas.classList.remove('hide');
    
    // Start the confetti animation if the function exists
    if (typeof startConfetti === 'function') {
        startConfetti();
    }
}

// Close all modals
function closeModals() {
    elements.expertModal.classList.add('hide');
    elements.audienceModal.classList.add('hide');
    elements.errorModal.classList.add('hide');
    elements.overlay.classList.add('hide');
    
    // Asegurarnos de detener los confetis si están activos
    if (typeof stopConfetti === 'function') {
        stopConfetti();
    }
}

// Handle error modal close specifically
function handleErrorModalClose() {
    // Ocultar el modal de error
    elements.errorModal.classList.add('hide');
    elements.overlay.classList.add('hide');
    
    // Detener la animación de confetis si está activa
    if (typeof stopConfetti === 'function') {
        stopConfetti();
    }
    
    // Volver a la pantalla inicial
    showScreen(elements.startScreen);
}

// Show the leaderboard
function showLeaderboard() {
    // Show the leaderboard screen
    showScreen(elements.leaderboardScreen);
    
    // Show loading indicator
    elements.leaderboardTable.classList.add('hide');
    elements.leaderboardLoading.classList.remove('hide');
    
    // Fetch and display leaderboard data
    getLeaderboard();
}

// Hide the leaderboard and go back to the previous screen
function hideLeaderboard() {
    // Go back to start screen if not in a game
    if (!gameState.gameActive) {
        showScreen(elements.startScreen);
    } else {
        // Otherwise go back to game screen
        showScreen(elements.gameScreen);
    }
}

// Update the leaderboard with new data
function updateLeaderboard(scores) {
    // Clear the leaderboard table
    elements.leaderboardBody.innerHTML = '';
    
    // Add each score to the table
    scores.forEach((score, index) => {
        const row = document.createElement('tr');
        
        // Format the date
        const date = new Date(score.date);
        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        
        // Determinar número de preguntas respondidas
        const questionsAnswered = score.questionsAnswered || score.maxRound * 5 || 0;
        
        // Determinar tiempo de juego (si existe)
        let gameTime = 'N/A';
        if (score.totalGameTimeSeconds) {
            const minutes = Math.floor(score.totalGameTimeSeconds / 60);
            const seconds = score.totalGameTimeSeconds % 60;
            gameTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Generar HTML para el nivel con color según dificultad
        let levelHtml = score.finalPillar;
        
        if (score.finalPillar) {
            if (score.finalPillar.includes('Fácil')) {
                levelHtml = `<span style="color: #4CAF50; font-weight: bold;">${score.finalPillar}</span>`;
            } else if (score.finalPillar.includes('Menos fácil')) {
                levelHtml = `<span style="color: #FFC107; font-weight: bold;">${score.finalPillar}</span>`;
            } else if (score.finalPillar.includes('Difícil')) {
                levelHtml = `<span style="color: #F44336; font-weight: bold;">${score.finalPillar}</span>`;
            } else if (score.finalPillar.includes('Muy difícil')) {
                levelHtml = `<span style="color: #FF5722; font-weight: bold;">${score.finalPillar}</span>`;
            } else if (score.finalPillar.includes('Complicada')) {
                levelHtml = `<span style="color: #9C27B0; font-weight: bold;">${score.finalPillar}</span>`;
            }
        }
        
        // Create the row content con estilos en línea para colores más fuertes
        row.innerHTML = `
            <td style="color: var(--ml-violet); font-weight: bold;">${index + 1}</td>
            <td style="font-weight: bold;">${score.name}</td>
            <td style="color: black; font-weight: bold;">${score.chances !== undefined ? score.chances : Math.floor(score.score / 5)} Chances</td>
            <td style="color: #3483FA; font-weight: bold;">${questionsAnswered}</td>
            <td>${gameTime}</td>
            <td>${levelHtml}</td>
            <td>${formattedDate}</td>
        `;
        
        // Add the row to the table
        elements.leaderboardBody.appendChild(row);
    });
    
    // Hide loading indicator and show the table
    elements.leaderboardLoading.classList.add('hide');
    elements.leaderboardTable.classList.remove('hide');
}

// Save the player's score to the leaderboard
async function saveScore(name, prize, maxRound, finalPillar) {
    try {
        // Mostrar un mensaje explícito de depuración de datos
        console.log("------------- DEPURACIÓN DE DATOS -------------");
        console.log("- Nombre del jugador:", name);
        console.log("- Teléfono:", gameState.player.phone);
        console.log("- Premio/Chances real:", prize);
        console.log("- Ronda máxima:", maxRound);
        console.log("- Nivel final:", finalPillar);
        console.log("- Preguntas respondidas:", gameState.player.questionsAnswered);
        console.log("- Tiempo total:", gameState.player.totalGameTimeSeconds);
        console.log("--------------------------------------------");
        
        // Calcular el número de chances basado en preguntas correctas
        const chances = Math.floor(gameState.player.questionsAnswered / 5);
        
        // Asegurarse de que el teléfono sea string y no esté vacío
        const phone = String(gameState.player.phone || "").trim();
        if (!phone) {
            console.warn("⚠️ ¡Teléfono vacío! Esto puede causar problemas al guardar.");
        }
        
        const scoreData = {
            name: name || "Jugador anónimo", // Evitar nombres vacíos
            phone: phone,
            score: Number(prize) || 0, // Forzar conversión a número
            prize: Number(prize) || 0,  // Campo adicional para compatibilidad
            chances: chances, // Agregamos el campo de chances explícitamente
            maxRound: Number(maxRound) || 1, // Forzar conversión a número con valor mínimo
            questionsAnswered: Number(gameState.player.questionsAnswered) || 0,
            totalGameTimeSeconds: Number(gameState.player.totalGameTimeSeconds) || 0,
            finalPillar: String(finalPillar || "Nivel 1") // Asegurar que siempre sea string con valor por defecto
        };
        
        console.log('Guardando puntuación:', JSON.stringify(scoreData, null, 2));
        
        // Send the score to the server
        const response = await fetch(API_ENDPOINTS.scores, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scoreData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error respuesta del servidor:', errorText);
            throw new Error('Error al guardar la puntuación');
        }
        
        const result = await response.json();
        console.log('Puntuación guardada exitosamente:', result);
        
        // Get the leaderboard after saving
        getLeaderboard();
    } catch (error) {
        console.error('Error guardando puntuación:', error);
    }
}

// Get the leaderboard data from the server
async function getLeaderboard() {
    try {
        // Mostrar indicador de carga
        elements.leaderboardLoading.classList.remove('hide');
        elements.leaderboardTable.classList.add('hide');
        
        console.log("Cargando tabla de líderes...");
        
        // Fetch the top scores from the server
        const response = await fetch(API_ENDPOINTS.topScores);
        
        if (!response.ok) {
            console.error(`Error de servidor: ${response.status} ${response.statusText}`);
            throw new Error('Error al cargar la tabla de líderes');
        }
        
        // Parse the response
        const scores = await response.json();
        
        console.log("Datos de tabla de líderes recibidos:", scores);
        
        // Verificar si los datos son válidos
        if (!Array.isArray(scores)) {
            console.error("Los datos recibidos no son un array:", scores);
            throw new Error('Formato de datos incorrecto');
        }
        
        // Ordenar los puntajes por:
        // 1. Mayor número de preguntas respondidas
        // 2. Menor tiempo de juego (si ambos jugadores tienen la misma cantidad de preguntas)
        const sortedScores = [...scores].sort((a, b) => {
            // Determinar preguntas respondidas (usar valores por defecto si no existen)
            const aQuestions = a.questionsAnswered || a.maxRound * 5 || 0;
            const bQuestions = b.questionsAnswered || b.maxRound * 5 || 0;
            
            // Si tienen diferentes cantidades de preguntas, ordenar por eso primero
            if (aQuestions !== bQuestions) {
                return bQuestions - aQuestions; // Mayor número primero
            }
            
            // Si tienen la misma cantidad de preguntas, ordenar por tiempo
            const aTime = a.totalGameTimeSeconds || Number.MAX_SAFE_INTEGER;
            const bTime = b.totalGameTimeSeconds || Number.MAX_SAFE_INTEGER;
            return aTime - bTime; // Menor tiempo primero
        });
        
        // Update the leaderboard with the sorted scores
        updateLeaderboard(sortedScores);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        
        // Show error message
        elements.leaderboardBody.innerHTML = `
            <tr>
                <td colspan="7" class="error-message">
                    Error al cargar la tabla de líderes. Inténtalo de nuevo más tarde.
                </td>
            </tr>
        `;
        
        // Hide loading indicator and show the table
        elements.leaderboardLoading.classList.add('hide');
        elements.leaderboardTable.classList.remove('hide');
    }
}

// Reset the game and start again
function resetAndStartGame() {
    // Reset game state completely
    resetGameState();
    
    // Reset lifelines UI
    elements.lifelines.forEach(lifeline => {
        lifeline.classList.remove('used');
    });
    
    // Reset progress dots
    elements.progressDots.forEach(dot => {
        dot.classList.remove('completed');
    });
    
    // Reset form inputs
    elements.playerNameInput.value = '';
    elements.playerPhoneInput.value = '';
    elements.playerPhoneInput.classList.remove('input-error');
    
    // Detener cualquier animación de confeti
    if (typeof stopConfetti === 'function') {
        stopConfetti();
    }
    
    // Show start screen
    showScreen(elements.startScreen);
}

// Utility Functions
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Swap elements
    }
    return newArray;
}