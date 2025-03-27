// Main game logic

// Game state
let gameState = {
    player: {
        name: "",
        currentRound: 1, // Starts at round 1 (Fácil)
        currentQuestionIndex: 0, // Index in the current round's questions
        currentPillar: null, // Current pillar (reputacion, oferta, etc.)
        questionsAnswered: 0, // Total questions answered
        prize: 0, // Current prize amount
        usedLifelines: {
            fiftyFifty: false,
            audienceHelp: false,
            expertCall: false
        },
        completedRounds: [] // Tracks which rounds have been completed
    },
    currentQuestion: null,
    timer: null,
    timeRemaining: 0,
    selectedAnswer: null,
    gameActive: false,
    allQuestions: {}, // Will hold questions from Airtable, grouped by difficulty and pillar
    currentRoundQuestions: [], // Questions for the current round
    isLoading: true,
    hasError: false,
    errorMessage: ""
};

// Constants from config.js should be available here

// DOM Elements
const elements = {
    // Screens
    loadingScreen: document.getElementById('loading-screen'),
    errorScreen: document.getElementById('error-screen'),
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    resultsScreen: document.getElementById('results-screen'),
    leaderboardScreen: document.getElementById('leaderboard-screen'),
    
    // Error screen elements
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    
    // Start screen elements
    playerForm: document.getElementById('player-form'),
    playerNameInput: document.getElementById('player-name'),
    showLeaderboardBtn: document.getElementById('show-leaderboard-btn'),
    
    // Game screen elements
    playerNameDisplay: document.getElementById('player-name-display'),
    currentPrize: document.getElementById('current-prize'),
    currentPillar: document.getElementById('current-pillar'),
    currentDifficulty: document.getElementById('current-difficulty'),
    timerBar: document.getElementById('timer-bar'),
    questionNumber: document.getElementById('question-number'),
    questionText: document.getElementById('question-text'),
    answers: document.querySelectorAll('.answer'),
    answerTexts: document.querySelectorAll('.answer-text'),
    lifelines: document.querySelectorAll('.lifeline'),
    prizeLevels: document.querySelectorAll('.prize-level'),
    
    // Results screen elements
    resultTitle: document.getElementById('result-title'),
    resultPlayerName: document.getElementById('result-player-name'),
    resultPrize: document.getElementById('result-prize'),
    resultRound: document.getElementById('result-round'),
    resultPillar: document.getElementById('result-pillar'),
    playAgainBtn: document.getElementById('play-again-btn'),
    backToStartBtn: document.getElementById('back-to-start-btn'),
    
    // Leaderboard elements
    leaderboardTable: document.getElementById('leaderboard-table'),
    leaderboardLoading: document.getElementById('leaderboard-loading'),
    leaderboardBody: document.getElementById('leaderboard-body'),
    backFromLeaderboardBtn: document.getElementById('back-from-leaderboard-btn'),
    
    // Round Complete Modal
    roundCompleteModal: document.getElementById('round-complete-modal'),
    roundCompleteTitle: document.getElementById('round-complete-title'),
    roundCompleteMessage: document.getElementById('round-complete-message'),
    nextRoundBtn: document.getElementById('next-round-btn'),
    
    // Lifelines modals
    expertModal: document.getElementById('expert-modal'),
    expertAdvice: document.getElementById('expert-advice'),
    audienceModal: document.getElementById('audience-modal'),
    audienceChartBars: document.querySelectorAll('.chart-bar'),
    barFills: document.querySelectorAll('.bar-fill'),
    barPercentages: document.querySelectorAll('.bar-percentage'),
    closeModalButtons: document.querySelectorAll('.close-modal'),
    
    // Other UI elements
    overlay: document.getElementById('overlay'),
    confettiCanvas: document.getElementById('confetti-canvas')
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game
    initGame();
    
    // Start screen
    elements.playerForm.addEventListener('submit', startGame);
    elements.showLeaderboardBtn.addEventListener('click', showLeaderboard);
    
    // Error screen
    elements.retryBtn.addEventListener('click', initGame);
    
    // Game screen
    elements.answers.forEach(answer => {
        answer.addEventListener('click', selectAnswer);
    });
    
    elements.lifelines.forEach(lifeline => {
        lifeline.addEventListener('click', useLifeline);
    });
    
    // Results screen
    elements.playAgainBtn.addEventListener('click', resetAndStartGame);
    elements.backToStartBtn.addEventListener('click', goToStartScreen);
    
    // Leaderboard screen
    elements.backFromLeaderboardBtn.addEventListener('click', hideLeaderboard);
    
    // Round complete modal
    elements.nextRoundBtn.addEventListener('click', startNextRound);
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });
    
    // Initialize sound system
    if (typeof initializeSounds === 'function') {
        initializeSounds();
    }
});

// Initialize the game
async function initGame() {
    // Show loading screen
    showScreen(elements.loadingScreen);
    
    // Reset game state
    resetGameState();
    
    try {
        // Fetch questions from the server
        await loadAllQuestions();
        
        // Check if we have enough questions
        if (!hasEnoughQuestions()) {
            throw new Error(GAME_MESSAGES.noQuestions);
        }
        
        // Show start screen
        showScreen(elements.startScreen);
    } catch (error) {
        console.error('Error initializing game:', error);
        gameState.hasError = true;
        gameState.errorMessage = error.message || 'Error desconocido al cargar el juego.';
        elements.errorMessage.textContent = gameState.errorMessage;
        showScreen(elements.errorScreen);
    }
}

// Reset game state
function resetGameState() {
    gameState = {
        player: {
            name: "",
            currentRound: 1,
            currentQuestionIndex: 0,
            currentPillar: null,
            questionsAnswered: 0,
            prize: 0,
            usedLifelines: {
                fiftyFifty: false,
                audienceHelp: false,
                expertCall: false
            },
            completedRounds: []
        },
        currentQuestion: null,
        timer: null,
        timeRemaining: 0,
        selectedAnswer: null,
        gameActive: false,
        allQuestions: {},
        currentRoundQuestions: [],
        isLoading: false,
        hasError: false,
        errorMessage: ""
    };
}

// Load all questions from the server
async function loadAllQuestions() {
    try {
        // Get difficulty labels in lowercase for API calls
        const difficulties = GAME_STRUCTURE.difficultyLevels.map(d => d.toLowerCase());
        
        // Get pillar labels for API calls
        const pillars = GAME_STRUCTURE.pillars;
        
        // Initialize allQuestions structure
        gameState.allQuestions = {
            total: 0,
            byDifficultyAndPillar: {}
        };
        
        // For each difficulty level, load questions for all pillars
        for (let i = 0; i < difficulties.length; i++) {
            const difficultyKey = difficulties[i];
            const difficultyLabel = GAME_STRUCTURE.difficultyLevels[i];
            
            // Create entry for this difficulty
            gameState.allQuestions.byDifficultyAndPillar[difficultyLabel] = {};
            
            // Fetch questions from API
            const response = await fetch(`${API_ENDPOINTS.questions}?pillars=${JSON.stringify(pillars)}&difficulty=${difficultyLabel}`);
            
            if (!response.ok) {
                throw new Error(`Error al cargar preguntas de dificultad ${difficultyLabel}`);
            }
            
            const questions = await response.json();
            
            // Organize questions by pillar
            for (const pillar of pillars) {
                const pillarQuestions = questions.filter(q => q.pillar === pillar);
                gameState.allQuestions.byDifficultyAndPillar[difficultyLabel][pillar] = pillarQuestions;
                gameState.allQuestions.total += pillarQuestions.length;
            }
        }
        
        console.log('All questions loaded:', gameState.allQuestions);
    } catch (error) {
        console.error('Error loading questions:', error);
        throw error;
    }
}

// Check if we have enough questions to play
function hasEnoughQuestions() {
    return gameState.allQuestions.total >= GAME_STRUCTURE.totalQuestionsNeeded;
}

// Start the game
function startGame(e) {
    if (e) e.preventDefault();
    
    // Get player name
    const playerName = elements.playerNameInput.value.trim();
    if (!playerName) {
        alert('Por favor, ingresa tu nombre para comenzar.');
        return;
    }
    
    // Set player name
    gameState.player.name = playerName;
    
    // Select a random pillar for first round
    selectRandomPillar();
    
    // Prepare questions for the current round
    prepareQuestionsForRound();
    
    // Update UI
    elements.playerNameDisplay.textContent = playerName;
    updatePrizeDisplay();
    updatePrizeLadder();
    
    // Set game as active
    gameState.gameActive = true;
    
    // Show game screen
    showScreen(elements.gameScreen);
    
    // Play start sound
    if (typeof playSound === 'function') {
        playSound('start');
    }
    
    // Load first question
    loadQuestion();
}

// Select a random pillar that hasn't been completed in the current round
function selectRandomPillar() {
    // Get current round difficulty
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    
    // Get all available pillars for this difficulty
    const availablePillars = GAME_STRUCTURE.pillars.filter(pillar => {
        // Check if we have questions for this pillar at the current difficulty
        const questions = gameState.allQuestions.byDifficultyAndPillar[currentDifficulty][pillar];
        if (!questions || questions.length === 0) return false;
        
        // Check if this pillar has already been completed in this round
        const completedPillarKey = `${gameState.player.currentRound}-${pillar}`;
        return !gameState.player.completedRounds.includes(completedPillarKey);
    });
    
    // If no available pillars, use all pillars (should not happen normally)
    const pillarsToChooseFrom = availablePillars.length > 0 ? availablePillars : GAME_STRUCTURE.pillars;
    
    // Select a random pillar
    const randomIndex = Math.floor(Math.random() * pillarsToChooseFrom.length);
    gameState.player.currentPillar = pillarsToChooseFrom[randomIndex];
    
    console.log(`Selected pillar: ${gameState.player.currentPillar} for round ${gameState.player.currentRound}`);
}

// Prepare questions for the current round and pillar
function prepareQuestionsForRound() {
    // Get current round difficulty
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    
    // Get questions for this difficulty and pillar
    const questionsForPillar = gameState.allQuestions.byDifficultyAndPillar[currentDifficulty][gameState.player.currentPillar];
    
    // Shuffle questions
    const shuffledQuestions = shuffleArray([...questionsForPillar]);
    
    // Take the first QUESTIONS_PER_ROUND questions
    gameState.currentRoundQuestions = shuffledQuestions.slice(0, GAME_CONFIG.questionsPerRound);
    
    // Reset current question index
    gameState.player.currentQuestionIndex = 0;
}

// Load the current question
function loadQuestion() {
    // Get the current question
    gameState.currentQuestion = gameState.currentRoundQuestions[gameState.player.currentQuestionIndex];
    
    // Get current round difficulty
    const currentDifficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1];
    
    // Update question UI
    elements.questionNumber.textContent = `Pregunta ${gameState.player.currentQuestionIndex + 1} de ${GAME_CONFIG.questionsPerRound}`;
    elements.questionText.textContent = gameState.currentQuestion.text;
    elements.currentPillar.textContent = `Pilar: ${gameState.player.currentPillar}`;
    elements.currentDifficulty.textContent = `Dificultad: ${currentDifficulty}`;
    
    // Set pillar color for question container
    document.querySelector('.question-container').className = 'question-container';
    document.querySelector('.question-container').classList.add(`${gameState.player.currentPillar.toLowerCase()}-theme`);
    
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
    
    // Increment questions answered counter
    gameState.player.questionsAnswered++;
    
    // Get correct answer index
    const correctIndex = gameState.currentQuestion.correctIndex;
    
    // Check if the answer is correct
    const isCorrect = selectedIndex === correctIndex;
    
    // Update UI to show correct/incorrect
    elements.answers[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
    if (!isCorrect) {
        elements.answers[correctIndex].classList.add('correct');
    }
    
    // Play sound
    if (typeof playSound === 'function') {
        playSound(isCorrect ? 'correct' : 'wrong');
    }
    
    // Wait before proceeding
    setTimeout(() => {
        if (isCorrect) {
            handleCorrectAnswer();
        } else {
            handleWrongAnswer();
        }
    }, 2000);
}

// Handle a correct answer
function handleCorrectAnswer() {
    // Increment question index
    gameState.player.currentQuestionIndex++;
    
    // Update prize (each correct answer adds a fraction of the round's prize)
    const roundPrize = PRIZE_LEVELS[gameState.player.currentRound - 1].amount;
    const questionPrize = roundPrize / GAME_CONFIG.questionsPerRound;
    gameState.player.prize += questionPrize;
    
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
    
    // Auto-continue after 3 seconds
    setTimeout(() => {
        elements.roundCompleteModal.classList.add('hide');
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
        Tu premio actual es ${formatCurrency(gameState.player.prize)}.
        ¡Prepárate para la siguiente ronda!`;
    
    elements.roundCompleteModal.classList.remove('hide');
}

// Start the next round
function startNextRound() {
    // Hide the round complete modal
    elements.roundCompleteModal.classList.add('hide');
    
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
        elements.resultTitle.textContent = '¡FELICIDADES! ¡ERES UN VENDEDOR MELI PRO!';
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
    elements.resultPrize.textContent = formatCurrency(gameState.player.prize);
    elements.resultRound.textContent = `${gameState.player.currentRound} de ${GAME_STRUCTURE.totalRounds}`;
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
    }
    
    // Update timer display initially
    updateTimerDisplay();
    
    // Start the timer
    gameState.timer = setInterval(() => {
        // Decrement time remaining
        gameState.timeRemaining--;
        
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
    
    // Highlight the correct answer
    elements.answers[gameState.currentQuestion.correctIndex].classList.add('correct');
    
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
        case 'facil':
            correctPercentage = 65 + Math.floor(Math.random() * 20); // 65-84%
            break;
        case 'media':
            correctPercentage = 55 + Math.floor(Math.random() * 20); // 55-74%
            break;
        case 'dificil':
            correctPercentage = 45 + Math.floor(Math.random() * 20); // 45-64%
            break;
        case 'muy_dificil':
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
    // Get the correct answer index and option letter
    const correctIndex = gameState.currentQuestion.correctIndex;
    const correctOption = String.fromCharCode(65 + correctIndex); // A, B, C, D
    
    // Determine confidence level based on difficulty
    let confidenceLevel;
    const difficulty = GAME_STRUCTURE.difficultyLevels[gameState.player.currentRound - 1].toLowerCase();
    
    switch(difficulty) {
        case 'facil':
            confidenceLevel = Math.random() < 0.8 ? 'high' : 'medium';
            break;
        case 'media':
            confidenceLevel = Math.random() < 0.6 ? 'high' : (Math.random() < 0.8 ? 'medium' : 'low');
            break;
        case 'dificil':
            confidenceLevel = Math.random() < 0.4 ? 'high' : (Math.random() < 0.7 ? 'medium' : 'low');
            break;
        case 'muy_dificil':
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
}

// Format currency (e.g., 1000 -> $1,000)
function formatCurrency(amount) {
    return `$${amount.toLocaleString('es')}`;
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
            score: prize,
            maxRound: maxRound,
            finalPillar: finalPillar
        };
        
        // Send the score to the server
        const response = await fetch(API_ENDPOINTS.scores, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scoreData)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar la puntuación');
        }
        
        console.log('Score saved successfully');
    } catch (error) {
        console.error('Error saving score:', error);
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
    // Reset game state
    resetGameState();
    
    // Reset lifelines UI
    elements.lifelines.forEach(lifeline => {
        lifeline.classList.remove('used');
    });
    
    // Start the game
    startGame();
}

// Go back to the start screen
function goToStartScreen() {
    // Reset game state
    resetGameState();
    
    // Reset lifelines UI
    elements.lifelines.forEach(lifeline => {
        lifeline.classList.remove('used');
    });
    
    // Show start screen
    showScreen(elements.startScreen);
}

// Utility Functions
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}