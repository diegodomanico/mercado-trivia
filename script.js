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
    playAgainButton: document.getElementById('play-again'),
    viewLeaderboardButton: document.getElementById('view-leaderboard'),
    
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
elements.playAgainButton.addEventListener('click', resetAndStartGame);
elements.viewLeaderboardButton.addEventListener('click', showLeaderboard);
elements.hideLeaderboardButton.addEventListener('click', hideLeaderboard);
elements.nextRoundButton.addEventListener('click', startNextRound);
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
    
    // Verificar si tenemos suficientes preguntas para cada pilar y dificultad
    const minQuestionsPerRound = GAME_CONFIG.questionsPerRound;
    const pillars = GAME_STRUCTURE.pillars;
    let insufficientQuestions = false;
    
    for (const difficulty of Object.keys(data.byDifficultyAndPillar)) {
        for (const pillar of pillars) {
            const questions = data.byDifficultyAndPillar[difficulty][pillar];
            if (!questions || questions.length < minQuestionsPerRound) {
                insufficientQuestions = true;
                console.error(`Insuficientes preguntas para ${pillar} en dificultad ${difficulty}: ${questions ? questions.length : 0}/${minQuestionsPerRound}`);
            }
        }
    }
    
    if (insufficientQuestions) {
        elements.statusIcon.className = 'status-icon disconnected';
        elements.statusText.textContent = 'Faltan preguntas en algunas categorías. No se puede iniciar el juego.';
        elements.startGameButton.disabled = true;
        return;
    }
    
    // Todo correcto - permitimos jugar
    elements.statusIcon.className = 'status-icon connected';
    elements.statusText.textContent = `Conectado a Airtable (${data.total} preguntas)`;
    elements.startGameButton.disabled = false;
}

// Check if we have enough questions
function hasEnoughQuestions() {
    if (!gameState.allQuestions || !gameState.allQuestions.byDifficultyAndPillar) {
        return false;
    }
    
    // Verificar si hay suficientes preguntas para cada pilar y dificultad
    for (const difficulty of GAME_STRUCTURE.difficultyLevels) {
        for (const pillar of GAME_STRUCTURE.pillars) {
            const questions = gameState.allQuestions.byDifficultyAndPillar[difficulty][pillar];
            
            if (!questions || questions.length < GAME_CONFIG.questionsPerRound) {
                console.error(`Insuficientes preguntas para ${pillar} en dificultad ${difficulty}: ${questions ? questions.length : 0}/${GAME_CONFIG.questionsPerRound}`);
                return false;
            }
        }
    }
    
    return true;
}

// Check Phone Number and Start Game
async function checkPhoneAndStartGame(e) {
    e.preventDefault();
    
    // Get player input
    const name = elements.playerNameInput.value.trim();
    const phone = elements.playerPhoneInput.value.trim();
    
    // Validate input
    if (!name) {
        alert('Por favor ingresa tu nombre');
        return;
    }
    
    if (!phone) {
        alert('Por favor ingresa tu número de teléfono');
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
        let isValid = false;
        try {
            const response = await fetch(API_ENDPOINTS.checkPhone(phone));
            if (!response.ok) {
                throw new Error(`Error al verificar teléfono: ${response.status}`);
            }
            const data = await response.json();
            isValid = data.valid;
        } catch (phoneError) {
            console.warn('Error validando el teléfono:', phoneError);
            // Ahora mostramos error y no permitimos jugar cuando hay error
            throw new Error('Error al verificar el teléfono en la base de datos');
        }
        
        if (!isValid) {
            elements.phoneError.textContent = 'Este número ya participó en el juego. Cada número solo puede participar una vez.';
            elements.phoneError.classList.remove('hide');
            elements.playerPhoneInput.classList.add('input-error');
            return;
        }
        
        // Clear any previous errors
        elements.phoneError.classList.add('hide');
        elements.playerPhoneInput.classList.remove('input-error');
        
        // Store player data
        gameState.player.name = name;
        gameState.player.phone = phone;
        
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
    // Set game as active
    gameState.gameActive = true;
    
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
    // Get all available pillars that haven't been completed in this round
    const availablePillars = GAME_STRUCTURE.pillars.filter(pillar => {
        const pillarKey = `${gameState.player.currentRound}-${pillar}`;
        return !gameState.player.completedRounds.includes(pillarKey);
    });
    
    // If all pillars have been completed, this should not happen but just in case
    if (availablePillars.length === 0) {
        gameState.player.currentPillar = GAME_STRUCTURE.pillars[0];
        return;
    }
    
    // Select a random pillar from available ones
    const randomIndex = Math.floor(Math.random() * availablePillars.length);
    gameState.player.currentPillar = availablePillars[randomIndex];
}

// Prepare Questions for Round
function prepareQuestionsForRound() {
    // Get difficulty for current round
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    
    // En lugar de seleccionar preguntas de un solo pilar, vamos a seleccionar una pregunta de cada pilar
    gameState.currentRoundQuestions = [];
    
    // Obtener una pregunta de cada pilar para este nivel de dificultad
    GAME_STRUCTURE.pillars.forEach(pillar => {
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
    // Get the current question
    gameState.currentQuestion = gameState.currentRoundQuestions[gameState.player.currentQuestionIndex];
    
    // Actualizar el pilar actual según la pregunta que se está mostrando
    gameState.player.currentPillar = gameState.currentQuestion.pillar;
    
    // Get current round difficulty
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    
    // Update question UI
    elements.questionNumber.textContent = `Pregunta ${gameState.player.currentQuestionIndex + 1} de ${GAME_CONFIG.questionsPerRound}`;
    elements.questionText.textContent = gameState.currentQuestion.text;
    elements.currentPillar.textContent = `Pilar: ${gameState.player.currentPillar}`;
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
    
    // Update answers
    elements.answers.forEach((answer, index) => {
        answer.classList.remove('selected', 'correct', 'incorrect', 'disabled');
        elements.answerTexts[index].textContent = gameState.currentQuestion.options[index];
    });
    
    // Reset selected answer
    gameState.selectedAnswer = null;
    
    // Get time for this difficulty
    const difficultyKey = currentDifficulty.toLowerCase().replace(' ', '_');
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
    
    // Get selected answer index
    const answerIndex = parseInt(answerElement.dataset.index);
    gameState.selectedAnswer = answerIndex;
    
    // Update UI to show selection
    elements.answers.forEach(ans => ans.classList.remove('selected'));
    answerElement.classList.add('selected');
    
    // Play select sound
    if (typeof playSound === 'function') {
        playSound('select');
    }
    
    // Stop the timer
    stopTimer();
    
    // Check answer after a short delay
    setTimeout(() => checkAnswer(answerIndex), 1500);
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
    
    // Si la respuesta es correcta, mostrar cuál era la correcta
    // Si es incorrecta, NO mostrar la respuesta correcta
    if (isCorrect) {
        elements.answers[correctIndex].classList.add('correct');
    }
    
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
        // Show round complete modal with custom message
        elements.roundCompleteTitle.textContent = `¡Felicidades! 🎉`;
        elements.roundCompleteMessage.textContent = `Has ganado 1 Chance por responder correctamente 5 preguntas.`;
        
        // Set button text
        elements.nextRoundButton.textContent = 'Aceptar';
        
        // Show the modal
        elements.roundCompleteModal.classList.remove('hide');
        elements.overlay.classList.remove('hide');
        
        // The nextRoundButton click event will hide the modal and continue the game
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
    // Count how many pillars have been completed in this round
    const completedPillarsInRound = gameState.player.completedRounds.filter(key => 
        key.startsWith(`${gameState.player.currentRound}-`)
    ).length;
    
    // Check if all pillars have been completed
    return completedPillarsInRound >= GAME_STRUCTURE.pillars.length;
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
    elements.roundCompleteTitle.textContent = `¡Cambiando de Pilar! 🔄`;
    elements.roundCompleteMessage.textContent = 
        `Ahora jugarás con preguntas del pilar ${gameState.player.currentPillar}. ¡Mantén el buen desempeño!`;
    
    elements.roundCompleteModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');
    
    // Auto-continue after 3 seconds
    setTimeout(() => {
        elements.roundCompleteModal.classList.add('hide');
        elements.overlay.classList.add('hide');
        loadQuestion();
    }, 3000);
}

// Complete the current round and prepare for the next
function completeRound() {
    // Play level up sound
    if (typeof playSound === 'function') {
        playSound('levelUp');
    }
    
    // Show round complete modal
    elements.roundCompleteTitle.textContent = `¡Ronda ${gameState.player.currentRound} Completada! 🎉`;
    elements.roundCompleteTitle.classList.add('violet-text');
    elements.roundCompleteMessage.textContent = 
        `¡Felicidades! Has completado todos los pilares de la dificultad ${GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1]}. 
        Tienes ${formatCurrency(gameState.player.prize)} para participar en sorteos.
        ¡Prepárate para la siguiente ronda!`;
    
    elements.roundCompleteModal.classList.remove('hide');
    elements.overlay.classList.remove('hide');
}

// Start the next round
function startNextRound() {
    // Hide the round complete modal
    elements.roundCompleteModal.classList.add('hide');
    elements.overlay.classList.add('hide');
    
    // Remove violet text class from the title
    elements.roundCompleteTitle.classList.remove('violet-text');
    
    // Increment round
    gameState.player.currentRound++;
    
    // Update prize ladder
    updatePrizeLadder();
    
    // Select a new pillar
    selectRandomPillar();
    
    // Prepare questions for the new round
    prepareQuestionsForRound();
    
    // Load first question
    loadQuestion();
}

// End the game
function endGame(isWinner) {
    // Set game as inactive
    gameState.gameActive = false;
    
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
    elements.resultPillar.textContent = gameState.player.currentPillar;
    
    // Save score to leaderboard
    saveScore(
        gameState.player.name, 
        gameState.player.prize, 
        gameState.player.currentRound,
        gameState.player.currentPillar
    );
    
    // Show results screen after a short delay
    setTimeout(() => {
        showScreen(elements.resultsScreen);
    }, 1500);
}

// Timer Functions
function startTimer() {
    // Clear any existing timer
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    
    // Log for debugging
    console.log("Iniciando temporizador con " + gameState.timeRemaining + " segundos");
    
    // Initialize timer display
    elements.timerBar.style.width = '100%';
    elements.timerBar.style.backgroundColor = 'var(--success-green)';
    
    // Update timer display immediately
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
    const difficultyKey = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1].toLowerCase().replace(' ', '_');
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
    const difficultyKey = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1].toLowerCase();
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
        case 'fácil':
            correctPercentage = 65 + Math.floor(Math.random() * 20); // 65-84%
            break;
        case 'media':
            correctPercentage = 55 + Math.floor(Math.random() * 20); // 55-74%
            break;
        case 'difícil':
            correctPercentage = 45 + Math.floor(Math.random() * 20); // 45-64%
            break;
        case 'muy difícil':
            correctPercentage = 40 + Math.floor(Math.random() * 20); // 40-59%
            break;
        case 'experto':
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
    const difficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1].toLowerCase();
    
    switch(difficulty) {
        case 'fácil':
            confidenceLevel = Math.random() < 0.8 ? 'high' : 'medium';
            break;
        case 'media':
            confidenceLevel = Math.random() < 0.6 ? 'high' : (Math.random() < 0.8 ? 'medium' : 'low');
            break;
        case 'difícil':
            confidenceLevel = Math.random() < 0.4 ? 'high' : (Math.random() < 0.7 ? 'medium' : 'low');
            break;
        case 'muy difícil':
            confidenceLevel = Math.random() < 0.3 ? 'high' : (Math.random() < 0.6 ? 'medium' : 'low');
            break;
        case 'experto':
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
}

// Handle error modal close specifically
function handleErrorModalClose() {
    // Ocultar el modal de error
    elements.errorModal.classList.add('hide');
    elements.overlay.classList.add('hide');
    
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
        
        // Create the row content
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.name}</td>
            <td>${formatCurrency(score.score)}</td>
            <td>${score.maxRound}</td>
            <td>${score.finalPillar}</td>
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
        const scoreData = {
            name: name,
            phone: gameState.player.phone.toString(),
            score: prize,
            maxRound: maxRound,
            finalPillar: finalPillar
        };
        
        console.log('Guardando puntuación:', JSON.stringify(scoreData));
        
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
        // Fetch the top scores from the server
        const response = await fetch(API_ENDPOINTS.topScores);
        
        if (!response.ok) {
            throw new Error('Error al cargar la tabla de líderes');
        }
        
        // Parse the response
        const scores = await response.json();
        
        // Update the leaderboard with the scores
        updateLeaderboard(scores);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        
        // Show error message
        elements.leaderboardBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-message">
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