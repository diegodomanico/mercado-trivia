// Game Configuration
const GAME_CONFIG = {
    timePerDifficulty: {
        "Fácil 🟢": 45,
        "Menos fácil 🟡": 40,
        "Difícil 🔴": 35,
        "Muy difícil 🔥": 30,
        "Complicada 💀": 25
    },
    lifelines: {
        'fifty-fifty': true,
        'audience-help': true,
        'expert-call': true
    },
    chancesPerCorrectQuestions: 5
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

// API Endpoints
const API_ENDPOINTS = {
    questions: '/api/questions',
    saveScore: '/api/score',
    topScores: '/api/top-scores',
    checkPhone: (phone) => `/api/check-phone/${phone}`
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
    startGameButton: document.getElementById('start-game'),
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
    playerForm: document.getElementById('player-form')
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

// Document Ready Function
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded event - Iniciando aplicación");

    // Initialize the game
    initGame();

    // Iniciar eventos de botones
    if (elements.playerForm) {
        console.log("Encontrado el formulario de jugador - configurando evento de envío");
        elements.playerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Obtener nombre y teléfono
            const name = elements.playerNameInput.value.trim();
            const phone = elements.playerPhoneInput.value.trim();

            // Validar entrada
            if (!name) {
                alert("Por favor ingresa tu nombre");
                return;
            }

            if (!phone) {
                alert("Por favor ingresa tu teléfono");
                return;
            }

            // Guardar datos
            gameState.player.name = name;
            gameState.player.phone = phone;

            // Iniciar juego
            startGame();
        });
    } else {
        console.error("¡No se encontró el formulario del jugador!");
    }

    // Botón de inicio alternativo
    if (elements.startGameButton) {
        elements.startGameButton.addEventListener('click', function(e) {
            e.preventDefault();

            // Validación simple
            const name = elements.playerNameInput.value.trim() || "Jugador";
            const phone = elements.playerPhoneInput.value.trim() || "1122334455";

            // Guardar datos
            gameState.player.name = name;
            gameState.player.phone = phone;

            // Iniciar juego
            startGame();
        });
    }

    // Other Event Listeners
    elements.retryButton.addEventListener('click', initGame);
    elements.answers.forEach(answer => answer.addEventListener('click', selectAnswer));
    elements.lifelines.forEach(lifeline => lifeline.addEventListener('click', useLifeline));
    elements.viewLeaderboardButton.addEventListener('click', showLeaderboard);
    elements.viewLeaderboardStartButton.addEventListener('click', showLeaderboard);
    elements.hideLeaderboardButton.addEventListener('click', hideLeaderboard);
    elements.nextRoundButton.addEventListener('click', completeRound);
    elements.closeExpertModalButton.addEventListener('click', closeModals);
    elements.closeAudienceModalButton.addEventListener('click', closeModals);
    elements.errorOkBtn.addEventListener('click', handleErrorModalClose);
});

// Initialize Game
async function initGame() {
    console.log("Inicializando juego");

    // Show loading screen
    showScreen(elements.loadingScreen);

    // Reset game state
    resetGameState();

    // Set loading status
    if (elements.statusIcon) elements.statusIcon.className = 'status-icon loading';
    if (elements.statusText) elements.statusText.textContent = 'Conectando a la base de datos...';
    if (elements.startGameButton) elements.startGameButton.disabled = true;

    try {
        // Load all questions
        await loadAllQuestions();

        // Show start screen if questions loaded successfully
        showScreen(elements.startScreen);
    } catch (error) {
        console.error('Error initializing game:', error);
        if (elements.errorMessage) elements.errorMessage.textContent = `Error: ${error.message}. Por favor intenta nuevamente.`;
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

    // Clear timer
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }

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

        // Store questions in game state
        gameState.allQuestions = data;

        console.log('All questions loaded:', data);

        // Update status
        if (elements.statusIcon) elements.statusIcon.className = 'status-icon connected';
        if (elements.statusText) elements.statusText.textContent = `Conectado (${data.total} preguntas)`;
        if (elements.startGameButton) elements.startGameButton.disabled = false;

        return data;
    } catch (error) {
        console.error('Error loading questions:', error);

        // Update status to show error
        if (elements.statusIcon) elements.statusIcon.className = 'status-icon disconnected';
        if (elements.statusText) elements.statusText.textContent = 'Error de conexión. Intenta nuevamente.';
        if (elements.startGameButton) elements.startGameButton.disabled = true;

        throw error;
    }
}

// Start the Game
function startGame() {
    console.log("Iniciando juego con:", gameState.player.name, gameState.player.phone);

    // Set game as active
    gameState.gameActive = true;
    gameState.gameStartTime = new Date();

    // Reset lifelines UI
    elements.lifelines.forEach(lifeline => {
        lifeline.classList.remove('used');
    });

    // Update player name display
    elements.playerNameDisplay.textContent = gameState.player.name;

    // Select initial pillar
    gameState.player.currentPillar = getRandomPillar();

    // Load questions for this round
    prepareQuestionsForRound();

    // Update prize ladder
    updatePrizeLadder();

    // Show game screen
    showScreen(elements.gameScreen);

    // Load the first question
    loadQuestion();
}

// Get a random pillar
function getRandomPillar() {
    const pillars = GAME_STRUCTURE.pillars;
    return pillars[Math.floor(Math.random() * pillars.length)];
}

// Prepare Questions for Round
function prepareQuestionsForRound() {
    const difficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    const pillar = gameState.player.currentPillar;

    // Get questions for this difficulty and pillar
    const allQuestions = gameState.allQuestions.byDifficultyAndPillar[difficulty][pillar] || [];

    // If no questions available, use default questions
    if (allQuestions.length === 0) {
        gameState.currentRoundQuestions = generateDefaultQuestions(difficulty, pillar);
    } else {
        // Shuffle and select questions
        gameState.currentRoundQuestions = shuffleArray([...allQuestions]).slice(0, 5);
    }

    // Reset current question index
    gameState.player.currentQuestionIndex = 0;
}

// Generate default questions if none available
function generateDefaultQuestions(difficulty, pillar) {
    return [
        {
            id: "default-1",
            pillar: pillar,
            difficulty: difficulty,
            text: `¿Cuál es la mejor práctica para ${pillar}?`,
            options: ["Opción A", "Opción B", "Opción C", "Opción D"],
            correctIndex: 0
        },
        {
            id: "default-2",
            pillar: pillar,
            difficulty: difficulty,
            text: `¿Qué estrategia beneficia más a ${pillar}?`,
            options: ["Estrategia 1", "Estrategia 2", "Estrategia 3", "Estrategia 4"],
            correctIndex: 1
        },
        {
            id: "default-3",
            pillar: pillar,
            difficulty: difficulty,
            text: `Para el nivel ${difficulty}, ¿qué elemento es clave?`,
            options: ["Elemento A", "Elemento B", "Elemento C", "Elemento D"],
            correctIndex: 2
        },
        {
            id: "default-4",
            pillar: pillar,
            difficulty: difficulty,
            text: `¿Cuál de estas opciones NO beneficia a ${pillar}?`,
            options: ["Primera", "Segunda", "Tercera", "Cuarta"],
            correctIndex: 3
        },
        {
            id: "default-5",
            pillar: pillar,
            difficulty: difficulty,
            text: `¿Qué acción mejoraría más rápido tu ${pillar}?`,
            options: ["Acción 1", "Acción 2", "Acción 3", "Acción 4"],
            correctIndex: 0
        }
    ];
}

// Load a question
function loadQuestion() {
    // Ocultar resultados
    const resultContainer = document.getElementById('result-container');
    if (resultContainer) resultContainer.style.display = 'none';

    // Validate question data exists
    if (!gameState.currentRoundQuestions || !Array.isArray(gameState.currentRoundQuestions)) {
        console.error("No hay preguntas disponibles");
        endGame(false);
        return;
    }

    // Get the current question
    gameState.currentQuestion = gameState.currentRoundQuestions[gameState.player.currentQuestionIndex];

    if (!gameState.currentQuestion) {
        console.error("No se pudo cargar la pregunta actual");
        endGame(false);
        return;
    }

    // Update UI with question data
    elements.questionNumber.textContent = `Pregunta ${gameState.player.currentQuestionIndex + 1} de ${gameState.currentRoundQuestions.length}`;
    elements.questionText.textContent = gameState.currentQuestion.text;
    elements.currentPillar.textContent = `TEMA: ${gameState.player.currentPillar}`;
    elements.currentDifficulty.textContent = `Nivel: ${GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1]}`;

    // Update answers
    elements.answers.forEach((answer, index) => {
        answer.classList.remove('selected', 'correct', 'incorrect', 'disabled');
        elements.answerTexts[index].textContent = gameState.currentQuestion.options[index];
    });

    // Reset selected answer
    gameState.selectedAnswer = null;

    // Start timer
    const difficultyKey = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1].toLowerCase().replace(/ /g, '_');
    gameState.timeRemaining = GAME_CONFIG.timePerDifficulty[difficultyKey] || 30;
    startTimer();

    // Play question sound
    if (typeof playSound === 'function') {
        playSound('question');
    }
}

// Select an answer
function selectAnswer(e) {
    // If game is not active or answer already selected, do nothing
    if (!gameState.gameActive || gameState.selectedAnswer !== null) return;

    // Find the answer element
    const answerElement = e.target.closest('.answer');
    if (!answerElement || answerElement.classList.contains('disabled')) return;

    // Get selected answer index
    const answerIndex = parseInt(answerElement.dataset.index);
    gameState.selectedAnswer = answerIndex;

    // Update UI
    answerElement.classList.add('selected');

    // Play select sound
    if (typeof playSound === 'function') {
        playSound('select');
    }

    // Stop the timer
    stopTimer();

    // Check answer after a delay
    setTimeout(() => checkAnswer(answerIndex), 1500);
}

// Check if the answer is correct
function checkAnswer(selectedIndex) {
    // If game is not active or answer already selected, do nothing
    if (!gameState.gameActive || gameState.selectedAnswer !== null) return;

    // Validate current question exists and has correctIndex
    if (!gameState.currentQuestion || typeof gameState.currentQuestion.correctIndex === 'undefined') {
        console.error('Invalid question data:', gameState.currentQuestion);
        endGame(false);
        return;
    }

    // Get the current question
    const correctIndex = gameState.currentQuestion.correctIndex;

    // Update UI
    elements.answers[selectedIndex].classList.add(selectedIndex === correctIndex ? 'correct' : 'incorrect');

    // Play sound
    if (typeof playSound === 'function') {
        playSound(selectedIndex === correctIndex ? 'correct' : 'wrong');
    }

    // Process result after a delay
    setTimeout(() => {
        if (selectedIndex === correctIndex) {
            handleCorrectAnswer();
        } else {
            handleWrongAnswer();
        }
    }, 2000);
}

// Handle correct answer
function handleCorrectAnswer() {
    // Increment counters
    gameState.player.currentQuestionIndex++;
    gameState.player.questionsAnswered++;

    // Update progress dots
    updateProgressDots();

    // Check if player just earned a new chance
    const earnedChance = gameState.player.questionsAnswered > 0 &&
                          gameState.player.questionsAnswered % GAME_CONFIG.chancesPerCorrectQuestions === 0;

    if (earnedChance) {
        // Calculate new chances
        const chances = Math.floor(gameState.player.questionsAnswered / GAME_CONFIG.chancesPerCorrectQuestions);

        // Update prize
        gameState.player.prize = chances;
        elements.currentPrize.textContent = `${chances} ${chances === 1 ? 'Chance' : 'Chances'}`;

        // Show celebration
        showChanceEarnedCelebration(chances);
        return;
    }

    // Check if all questions in this round have been answered
    if (gameState.player.currentQuestionIndex >= gameState.currentRoundQuestions.length) {
        // Mark pillar as completed
        const roundKey = `${gameState.player.currentRound}-${gameState.player.currentPillar}`;
        if (!gameState.player.completedRounds.includes(roundKey)) {
            gameState.player.completedRounds.push(roundKey);
        }

        // Show pillar completed message
        showPillarCompletedMessage();
    } else {
        // Load next question
        loadQuestion();
    }
}

// Handle wrong answer
function handleWrongAnswer() {
    // End the game (player lost)
    endGame(false);
}

// Show chance earned celebration
function showChanceEarnedCelebration(chances) {
    // Stop the game temporarily
    gameState.gameActive = false;

    // Update round complete modal
    elements.roundCompleteTitle.textContent = "¡HAS GANADO UNA CHANCE! 🎉";
    elements.roundCompleteTitle.classList.add('winner-text');

    // Check if player completed all levels
    const isGameComplete = gameState.player.questionsAnswered >= GAME_STRUCTURE.totalRounds * GAME_STRUCTURE.questionsPerRound;

    if (isGameComplete) {
        // Game completed message
        elements.roundCompleteMessage.textContent =
            `¡FELICIDADES! Has completado todos los niveles y has ganado ${chances} chances en total.
             ¡Eres un Vendedor SUPER PRO de Mercado Libre!`;

        // Update button text
        elements.nextRoundButton.textContent = 'Ver Resultados Finales';

        // Mark game as completed
        gameState.gameCompleted = true;
        gameState.playerWon = true;
    } else {
        // Increase difficulty level if not at max
        if (gameState.player.currentRound < GAME_STRUCTURE.totalRounds) {
            gameState.player.currentRound++;
        }

        // Update message
        elements.roundCompleteMessage.textContent =
            `¡EXCELENTE! Has ganado ${chances} ${chances === 1 ? 'chance' : 'chances'}.
             Ahora avanzarás al nivel ${GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1]}.`;

        // Update button text
        elements.nextRoundButton.textContent = 'Continuar';

        // Update prize ladder
        updatePrizeLadder();

        // Prepare for next round
        gameState.player.currentPillar = getRandomPillar();
        prepareQuestionsForRound();
    }

    // Show confetti
    if (typeof showConfetti === 'function') {
        showConfetti();
    }

    // Show the modal
    elements.roundCompleteModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');
}

// Show pillar completed message
function showPillarCompletedMessage() {
    // Stop the game temporarily
    gameState.gameActive = false;

    // Update modal
    elements.roundCompleteTitle.textContent = '¡Has completado este TEMA!';
    elements.roundCompleteTitle.classList.add('violet-text');

    // Select a new pillar
    gameState.player.currentPillar = getRandomPillar();

    // Update message
    elements.roundCompleteMessage.textContent = `Ahora continuarás con preguntas del tema: ${gameState.player.currentPillar}`;

    // Update button
    elements.nextRoundButton.textContent = 'Continuar';

    // Show the modal
    elements.roundCompleteModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');

    // Prepare questions for new pillar
    prepareQuestionsForRound();
}

// Complete Round (called from next round button)
function completeRound() {
    // Hide modal
    elements.roundCompleteModal.classList.add('hide');
    elements.overlay.classList.add('hide');

    // Remove style classes
    elements.roundCompleteTitle.classList.remove('violet-text', 'winner-text');

    // Stop confetti if active
    if (typeof stopConfetti === 'function') {
        stopConfetti();
    }

    // Check if game is completed
    if (gameState.gameCompleted) {
        endGame(true);
        return;
    }

    // Resume game
    gameState.gameActive = true;

    // Load next question
    gameState.player.currentQuestionIndex = 0;
    loadQuestion();
}

// End Game
function endGame(isWinner) {
    clearInterval(gameState.timer);

    // Limpiar cualquier timeout pendiente
    if (gameState.answerTimeout) {
        clearTimeout(gameState.answerTimeout);
    }

    // Desactivar interacciones durante la transición
    gameState.gameActive = false;

    // Mostrar mensaje de resultado inmediato
    const resultContainer = document.getElementById('result-container');
    if (resultContainer) {
        resultContainer.style.display = 'block';
        const resultText = document.getElementById('result-text');
        if (resultText) {
            resultText.textContent = isWinner ? "¡FELICITACIONES!" : "¡Juego Terminado!";
        }

        // Agregar botón de volver
        const volverBtn = document.createElement('button');
        volverBtn.textContent = 'Volver a jugar';
        volverBtn.style.marginTop = '10px';
        volverBtn.onclick = () => window.location.reload();
        resultContainer.appendChild(volverBtn);

    }

    // Esperar un momento antes de mostrar la pantalla de resultados
    setTimeout(() => {
        // Actualizar pantalla de resultados
        const resultScreen = document.getElementById('results-screen');
        const gameScreen = document.getElementById('game-screen');

        if (resultScreen && gameScreen) {
            // Actualizar valores
            if (document.getElementById('result-title')) {
                document.getElementById('result-title').textContent = isWinner ? "¡FELICITACIONES!" : "¡Juego Terminado!";
            }
            if (document.getElementById('result-prize')) {
                document.getElementById('result-prize').textContent = gameState.player.prize || 0;
            }
            if (document.getElementById('result-player-name')) {
                document.getElementById('result-player-name').textContent = gameState.player.name || 'Jugador';
            }
            if (document.getElementById('result-player-phone')) {
                document.getElementById('result-player-phone').textContent = gameState.player.phone || '-';
            }

            // Asegurarse que existe el contenedor de botones
            let buttonsContainer = resultScreen.querySelector('.result-buttons');
            if (!buttonsContainer) {
                buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'result-buttons';
                resultScreen.querySelector('.final-result').appendChild(buttonsContainer);
            }

            // Limpiar botones existentes
            buttonsContainer.innerHTML = '';

            // Agregar botón de reinicio
            const playAgainBtn = document.createElement('button');
            playAgainBtn.textContent = 'Jugar de nuevo';
            playAgainBtn.className = 'cta-button';
            playAgainBtn.onclick = () => location.reload();
            buttonsContainer.appendChild(playAgainBtn);

            // Cambiar pantallas
            gameScreen.classList.add('hide');
            resultScreen.classList.remove('hide');
        }
    }, 3000);
}

// Start Timer
function startTimer() {
    // Clear existing timer
    stopTimer();

    // Reset timer bar
    elements.timerBar.style.width = '100%';
    elements.timerBar.className = '';

    // Start countdown
    const intervalTime = 50; // Update every 50ms for smooth animation
    const initialWidth = 100;
    const totalTime = gameState.timeRemaining * 1000;
    let timeElapsed = 0;

    gameState.timer = setInterval(() => {
        // Skip if game not active
        if (!gameState.gameActive) {
            stopTimer();
            return;
        }

        // Update elapsed time
        timeElapsed += intervalTime;

        // Calculate remaining width percentage
        const percentRemaining = initialWidth - (timeElapsed / totalTime * initialWidth);

        // Update timer bar
        elements.timerBar.style.width = `${percentRemaining}%`;

        // Update color based on time remaining
        if (percentRemaining <= 25) {
            elements.timerBar.className = 'critical';
        } else if (percentRemaining <= 50) {
            elements.timerBar.className = 'warning';
        }

        // Check if time is up
        if (timeElapsed >= totalTime) {
            stopTimer();
            timeUp();
        }
    }, intervalTime);
}

// Stop Timer
function stopTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

// Time Up
function timeUp() {
    // Show time up message
    elements.errorText.textContent = "¡Se acabó el tiempo!";
    elements.errorModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');

    // End game after delay
    setTimeout(() => {
        elements.errorModal.classList.add('hide');
        elements.overlay.classList.add('hide');
        handleWrongAnswer();
    }, 2000);
}

// Use Lifeline
function useLifeline(e) {
    // If game is not active, do nothing
    if (!gameState.gameActive) return;

    // Get the lifeline type
    const lifeline = e.currentTarget.id;

    // Check if already used
    if (gameState.player.usedLifelines[lifeline]) {
        return;
    }

    // Mark as used
    gameState.player.usedLifelines[lifeline] = true;
    e.currentTarget.classList.add('used');

    // Apply lifeline
    switch(lifeline) {
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

    // Play sound
    if (typeof playSound === 'function') {
        playSound('lifeline');
    }
}

// Apply 50:50 Lifeline
function applyFiftyFifty() {
    // Get correct index
    const correctIndex = gameState.currentQuestion.correctIndex;

    // Get incorrect indices
    const incorrectIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);

    // Shuffle and select two to hide
    shuffleArray(incorrectIndices);
    const toHide = incorrectIndices.slice(0, 2);

    // Hide selected answers
    toHide.forEach(index => {
        elements.answers[index].classList.add('disabled');
    });
}

// Show Audience Help
function showAudienceHelp() {
    // Get percentages based on difficulty
    const percentages = generateAudiencePercentages();

    // Update UI
    elements.audienceChartBars.forEach((bar, index) => {
        bar.style.height = `${percentages[index]}%`;
    });

    elements.audiencePercentages.forEach((element, index) => {
        element.textContent = `${percentages[index]}%`;
    });

    // Show modal
    elements.audienceModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');
}

// Generate audience percentages
function generateAudiencePercentages() {
    const correctIndex = gameState.currentQuestion.correctIndex;
    const difficulty = gameState.player.currentRound;

    // Base correct percentage by difficulty
    let correctPercentage;
    switch(difficulty) {
        case 1: correctPercentage = 70 + Math.floor(Math.random() * 20); break; // 70-89%
        case 2: correctPercentage = 60 + Math.floor(Math.random() * 20); break; // 60-79%
        case 3: correctPercentage = 50 + Math.floor(Math.random() * 20); break; // 50-69%
        case 4: correctPercentage = 40 + Math.floor(Math.random() * 20); break; // 40-59%
        case 5: correctPercentage = 30 + Math.floor(Math.random() * 20); break; // 30-49%
        default: correctPercentage = 60;
    }

    // Distribute remaining percentage
    const percentages = [0, 0, 0, 0];
    percentages[correctIndex] = correctPercentage;

    // Calculate for other options
    const remainingPercent = 100 - correctPercentage;
    const incorrectIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);

    // Randomly assign remaining percentage
    let remaining = remainingPercent;
    for (let i = 0; i < incorrectIndices.length - 1; i++) {
        const value = Math.floor(Math.random() * (remaining - (incorrectIndices.length - i - 1)));
        percentages[incorrectIndices[i]] = value;
        remaining -= value;
    }

    // Assign last value
    percentages[incorrectIndices[incorrectIndices.length - 1]] = remaining;

    return percentages;
}

// Show Expert Call
function showExpertCall() {
    // Generate expert advice
    const advice = generateExpertAdvice();

    // Update modal
    elements.expertAdvice.textContent = advice;

    // Show modal
    elements.expertModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');
}

// Generate expert advice
function generateExpertAdvice() {
    const correctIndex = gameState.currentQuestion.correctIndex;
    const correctLetter = String.fromCharCode(65 + correctIndex); // A, B, C, or D

    // Expert accuracy based on difficulty
    const difficulty = gameState.player.currentRound;
    let accuracy;
    switch(difficulty) {
        case 1: accuracy = 0.95; break; // 95% correct
        case 2: accuracy = 0.85; break; // 85% correct
        case 3: accuracy = 0.75; break; // 75% correct
        case 4: accuracy = 0.65; break; // 65% correct
        case 5: accuracy = 0.55; break; // 55% correct
        default: accuracy = 0.80;
    }

    // Determine if expert is correct
    const isCorrect = Math.random() < accuracy;

    // Select answer letter
    let answerLetter;
    if (isCorrect) {
        answerLetter = correctLetter;
    } else {
        // Choose a wrong answer
        const options = ['A', 'B', 'C', 'D'].filter(letter => letter !== correctLetter);
        answerLetter = options[Math.floor(Math.random() * options.length)];
    }

    // Generate confidence phrase based on accuracy
    let confidencePhrase;
    if (accuracy > 0.9) {
        confidencePhrase = "Estoy muy seguro de que";
    } else if (accuracy > 0.7) {
        confidencePhrase = "Creo que";
    } else if (accuracy > 0.6) {confidencePhrase = "No estoy completamente seguro, pero creo que";
    } else {
        confidencePhrase = "Es difícil saberlo, pero si tuviera que adivinar diría que";
    }

    return `${confidencePhrase} la respuesta correcta es la opción ${answerLetter}.`;
}

// Show Leaderboard
async function showLeaderboard() {
    // Show leaderboard screen
    showScreen(elements.leaderboardScreen);

    // Show loading
    elements.leaderboardLoading.classList.remove('hide');
    elements.leaderboardTable.classList.add('hide');

    try {
        // Fetch leaderboard data
        const scores = await getLeaderboard();

        // Update leaderboard
        updateLeaderboard(scores);

        // Hide loading
        elements.leaderboardLoading.classList.add('hide');
        elements.leaderboardTable.classList.remove('hide');
    } catch (error) {
        console.error('Error loading leaderboard:', error);        elements.leaderboardLoading.innerHTML = `
            <p>Error cargando tabla de líderes: ${error.message}</p>
        `;
    }
}

// Hide Leaderboard
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

// Update Leaderboard
function updateLeaderboard(scores) {
    // Clear current leaderboard
    elements.leaderboardBody.innerHTML = '';

    // Check if empty
    if (!scores || scores.length === 0) {
        elements.leaderboardBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-scores">No hay puntajes registrados aún</td>
            </tr>
        `;
        return;
    }

    // Add scores to table
    scores.forEach((score, index) => {
        const row = document.createElement('tr');

        // Format date
        const date = new Date(score.date);
        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

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

// Save Score
async function saveScore(name, prize, maxRound, finalPillar) {
    try {
        if (!name || !gameState.player.phone) {
            throw new Error('Missing required player data');
        }

        // Create score data
        const scoreData = {
            name: name,
            phone: gameState.player.phone,
            prize: prize || 0,
            questionsAnswered: gameState.player.questionsAnswered || 0,
            gameTimeSeconds: gameState.player.totalGameTimeSeconds || 0,
            maxRound: maxRound || 1,
            finalPillar: finalPillar || 'Level 1',
            date: new Date().toISOString()
        };

        if (!scoreData || typeof scoreData !== 'object') {
            throw new Error('Invalid score data');
        }

        // Send score to server
        const response = await fetch(API_ENDPOINTS.saveScore, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scoreData)
        });

        if (!response.ok) {
            throw new Error(`Error al guardar puntaje: ${response.status}`);
        }

        const data = await response.json();
        console.log('Score saved:', data);

        return data;
    } catch (error) {
        console.error('Error saving score:', error);

        // Show error message
        elements.errorText.textContent = `Error al guardar tu puntaje: ${error.message}`;
        elements.errorModal.classList.remove('hide');
        elements.overlay.classList.remove('hide');
    }
}

// Get Leaderboard
async function getLeaderboard() {
    try {
        // Fetch top scores
        const response = await fetch(API_ENDPOINTS.topScores);

        if (!response.ok) {
            throw new Error(`Error al obtener puntajes: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
    }
}

// Update Progress Dots
function updateProgressDots() {
    // Calculate dots to fill
    const dotsToFill = gameState.player.questionsAnswered % 5;

    // Update dots
    elements.progressDots.forEach((dot, index) => {
        if (index < dotsToFill) {
            dot.classList.add('completed');
        } else {
            dot.classList.remove('completed');
        }
    });
}

// Update Prize Ladder
function updatePrizeLadder() {
    // Update prize ladder UI
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

// Close Modals
function closeModals() {
    elements.overlay.classList.add('hide');
    elements.expertModal.classList.add('hide');
    elements.audienceModal.classList.add('hide');
}

// Handle Error Modal Close
function handleErrorModalClose() {
    elements.errorModal.classList.add('hide');
    elements.overlay.classList.add('hide');
}

// Show Specific Screen
function showScreen(screen) {
    // Hide all screens
    elements.loadingScreen.classList.add('hide');
    elements.errorScreen.classList.add('hide');
    elements.startScreen.classList.add('hide');
    elements.gameScreen.classList.add('hide');
    elements.resultsScreen.classList.add('hide');
    elements.leaderboardScreen.classList.add('hide');

    // Show requested screen
    screen.classList.remove('hide');
}

// Utility function to shuffle array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function usePhone() {
    if (!gameState.lifelines.phone) return;

    // Marcar como usado
    gameState.lifelines.phone = false;
    phone.classList.add('used');

    // Reproducir sonido de comodín
    if (typeof playSound === 'function') {
        playSound('lifeline');
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <h2 class="modal-title">Consejo del Experto</h2>
        <div class="modal-content">
            ${generateExpertAdvice()}
        </div>
        <button onclick="this.parentElement.remove();document.querySelector('.overlay').remove()">Cerrar</button>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}