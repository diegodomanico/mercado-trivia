// Main game logic

// Game state
let gameState = {
    player: {
        name: "",
        currentLevel: 0, // 0-based index in the prize levels array
        usedLifelines: {
            fiftyFifty: false,
            audienceHelp: false,
            expertCall: false
        }
    },
    currentQuestion: null,
    timer: null,
    timeRemaining: TIMER_CONFIG.initialTime,
    selectedAnswer: null,
    gameActive: false,
    questionsForGame: []
};

// DOM Elements
const elements = {
    // Screens
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    resultsScreen: document.getElementById('results-screen'),
    leaderboardScreen: document.getElementById('leaderboard-screen'),
    
    // Start screen elements
    playerForm: document.getElementById('player-form'),
    playerNameInput: document.getElementById('player-name'),
    showLeaderboardBtn: document.getElementById('show-leaderboard-btn'),
    
    // Game screen elements
    playerNameDisplay: document.getElementById('player-name-display'),
    currentPrize: document.getElementById('current-prize'),
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
    resultQuestions: document.getElementById('result-questions'),
    playAgainBtn: document.getElementById('play-again-btn'),
    backToStartBtn: document.getElementById('back-to-start-btn'),
    
    // Leaderboard elements
    leaderboardTable: document.getElementById('leaderboard-table'),
    leaderboardBody: document.getElementById('leaderboard-body'),
    backFromLeaderboardBtn: document.getElementById('back-from-leaderboard-btn'),
    
    // Lifeline modals
    expertModal: document.getElementById('expert-modal'),
    expertAdvice: document.getElementById('expert-advice'),
    audienceModal: document.getElementById('audience-modal'),
    audienceChartBars: document.querySelectorAll('.chart-bar'),
    
    // Overlay and Confetti
    overlay: document.getElementById('overlay'),
    confettiCanvas: document.getElementById('confetti-canvas')
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Start screen
    elements.playerForm.addEventListener('submit', startGame);
    elements.showLeaderboardBtn.addEventListener('click', showLeaderboard);
    
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
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });
    
    // Initialize sound system
    initializeSounds();
});

// Functions

// Game Flow Functions
function startGame(e) {
    e.preventDefault();
    
    // Get player name
    const playerName = elements.playerNameInput.value.trim();
    if (!playerName) {
        alert('Por favor, ingresa tu nombre para comenzar.');
        return;
    }
    
    // Initialize game state
    gameState.player.name = playerName;
    gameState.player.currentLevel = 0;
    gameState.player.usedLifelines = {
        fiftyFifty: false,
        audienceHelp: false,
        expertCall: false
    };
    gameState.gameActive = true;
    
    // Reset lifelines UI
    elements.lifelines.forEach(lifeline => {
        lifeline.classList.remove('used');
    });
    
    // Prepare questions for the game
    prepareQuestions();
    
    // Update UI
    elements.playerNameDisplay.textContent = playerName;
    updatePrizeDisplay();
    updatePrizeLadder();
    
    // Show game screen
    showScreen(elements.gameScreen);
    
    // Play start sound
    playSound('start');
    
    // Load first question
    loadQuestion();
}

function prepareQuestions() {
    // Create a new array with one question per level
    gameState.questionsForGame = [];
    
    // Group questions by level
    const questionsByLevel = {};
    QUESTIONS.forEach(question => {
        if (!questionsByLevel[question.level]) {
            questionsByLevel[question.level] = [];
        }
        questionsByLevel[question.level].push(question);
    });
    
    // Select one random question for each level
    for (let level = 1; level <= 15; level++) {
        if (questionsByLevel[level] && questionsByLevel[level].length > 0) {
            const randomIndex = Math.floor(Math.random() * questionsByLevel[level].length);
            gameState.questionsForGame.push(questionsByLevel[level][randomIndex]);
        } else {
            // Fallback if no question for this level
            console.error(`No questions available for level ${level}`);
            // Use a question from another level or create a generic one
            gameState.questionsForGame.push({
                text: `Pregunta de nivel ${level} (faltante)`,
                options: ["Opción A", "Opción B", "Opción C", "Opción D"],
                correctIndex: 0,
                level: level
            });
        }
    }
}

function loadQuestion() {
    // Get current question based on level
    gameState.currentQuestion = gameState.questionsForGame[gameState.player.currentLevel];
    
    // Update question UI
    elements.questionNumber.textContent = `Pregunta ${gameState.player.currentLevel + 1} de 15`;
    elements.questionText.textContent = gameState.currentQuestion.text;
    
    // Update answers
    elements.answers.forEach((answer, index) => {
        answer.classList.remove('selected', 'correct', 'incorrect', 'disabled');
        elements.answerTexts[index].textContent = gameState.currentQuestion.options[index];
    });
    
    // Reset selected answer
    gameState.selectedAnswer = null;
    
    // Start timer
    startTimer();
    
    // Play question sound
    playSound('question');
}

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
    playSound('select');
    
    // Stop the timer
    stopTimer();
    
    // Check answer after a short delay
    setTimeout(() => checkAnswer(answerIndex), 1500);
}

function checkAnswer(selectedIndex) {
    if (!gameState.gameActive) return;
    
    const correctIndex = gameState.currentQuestion.correctIndex;
    const isCorrect = selectedIndex === correctIndex;
    
    // Update UI to show correct/incorrect
    elements.answers[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
    if (!isCorrect) {
        elements.answers[correctIndex].classList.add('correct');
    }
    
    // Play sound
    playSound(isCorrect ? 'correct' : 'wrong');
    
    setTimeout(() => {
        if (isCorrect) {
            handleCorrectAnswer();
        } else {
            handleWrongAnswer();
        }
    }, 2000);
}

function handleCorrectAnswer() {
    // Increase level
    gameState.player.currentLevel++;
    
    // Update prize display
    updatePrizeDisplay();
    updatePrizeLadder();
    
    // Play level up sound
    playSound('levelUp');
    
    // Check if game is won
    if (gameState.player.currentLevel >= 15) {
        // Player won the game!
        endGame(true);
        return;
    }
    
    // Load next question
    setTimeout(loadQuestion, 1500);
}

function handleWrongAnswer() {
    // End game
    endGame(false);
}

function endGame(isWinner) {
    gameState.gameActive = false;
    
    // Calculate final prize based on current level and safe points
    const finalPrize = calculateFinalPrize();
    
    // Update results screen
    if (isWinner) {
        elements.resultTitle.textContent = '¡FELICIDADES! ¡ERES UN VENDEDOR ESTRELLA!';
        playSound('winner');
        showConfetti();
    } else {
        if (gameState.timeRemaining <= 0) {
            elements.resultTitle.textContent = '¡SE ACABÓ EL TIEMPO!';
        } else {
            elements.resultTitle.textContent = '¡JUEGO TERMINADO!';
        }
    }
    
    elements.resultPlayerName.textContent = gameState.player.name;
    elements.resultPrize.textContent = formatCurrency(finalPrize);
    elements.resultQuestions.textContent = `${gameState.player.currentLevel} de 15`;
    
    // Save score to leaderboard
    saveScore(gameState.player.name, finalPrize, gameState.player.currentLevel);
    
    // Show results screen
    setTimeout(() => {
        showScreen(elements.resultsScreen);
    }, 1500);
}

function calculateFinalPrize() {
    // If player won, return the million
    if (gameState.player.currentLevel >= 15) {
        return PRIZE_LEVELS[14].amount;
    }
    
    // If player didn't answer any question correctly
    if (gameState.player.currentLevel === 0) {
        return 0;
    }
    
    // Find the highest safe point level the player has passed
    let safePointLevel = 0;
    for (const safePoint of SAFE_POINTS) {
        if (gameState.player.currentLevel >= safePoint) {
            safePointLevel = Math.max(safePointLevel, safePoint);
        }
    }
    
    // If player passed a safe point, they get that prize
    if (safePointLevel > 0) {
        return PRIZE_LEVELS[safePointLevel - 1].amount;
    }
    
    // Otherwise, they get the prize of the previous level they completed
    return PRIZE_LEVELS[gameState.player.currentLevel - 1].amount;
}

// Timer Functions
function startTimer() {
    // Reset timer
    gameState.timeRemaining = TIMER_CONFIG.initialTime;
    updateTimerDisplay();
    
    // Clear any existing timer
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    // Start new timer
    gameState.timer = setInterval(() => {
        gameState.timeRemaining--;
        updateTimerDisplay();
        
        // Play timer sounds based on remaining time
        if (gameState.timeRemaining <= TIMER_CONFIG.dangerThreshold) {
            playSound('timeLow');
        } else if (gameState.timeRemaining <= TIMER_CONFIG.warningThreshold) {
            playSound('timeRunning');
        }
        
        // Check if time is up
        if (gameState.timeRemaining <= 0) {
            stopTimer();
            timeUp();
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

function updateTimerDisplay() {
    const percentage = (gameState.timeRemaining / TIMER_CONFIG.initialTime) * 100;
    elements.timerBar.style.width = `${percentage}%`;
    
    // Update color based on time remaining
    if (gameState.timeRemaining <= TIMER_CONFIG.dangerThreshold) {
        elements.timerBar.style.backgroundColor = 'var(--danger-red)';
    } else if (gameState.timeRemaining <= TIMER_CONFIG.warningThreshold) {
        elements.timerBar.style.backgroundColor = 'var(--warning-orange)';
    } else {
        elements.timerBar.style.backgroundColor = 'var(--success-green)';
    }
}

function timeUp() {
    // Handle time up as a wrong answer
    elements.answers.forEach(answer => answer.classList.add('disabled'));
    elements.answers[gameState.currentQuestion.correctIndex].classList.add('correct');
    
    playSound('wrong');
    
    setTimeout(() => {
        endGame(false);
    }, 2000);
}

// Lifeline Functions
function useLifeline(e) {
    const lifeline = e.currentTarget;
    const lifelineId = lifeline.id;
    
    // Check if lifeline is already used or game is not active
    if (lifeline.classList.contains('used') || !gameState.gameActive) {
        return;
    }
    
    // Mark lifeline as used
    lifeline.classList.add('used');
    gameState.player.usedLifelines[lifelineId] = true;
    
    // Play lifeline sound
    playSound('lifeline');
    
    // Apply lifeline effect based on type
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

function applyFiftyFifty() {
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

function showAudienceHelp() {
    const correctIndex = gameState.currentQuestion.correctIndex;
    
    // Generate audience poll percentages based on question difficulty
    const level = gameState.currentQuestion.level;
    const difficulty = level <= 5 ? 'easy' : level <= 10 ? 'medium' : 'hard';
    
    let percentages = generateAudiencePercentages(difficulty, correctIndex);
    
    // Update audience chart in the modal
    elements.audienceChartBars.forEach((bar, index) => {
        const option = String.fromCharCode(65 + index); // A, B, C, D
        const fill = bar.querySelector('.bar-fill');
        const percentage = bar.querySelector('.bar-percentage');
        
        // Reset height first
        fill.style.height = '0%';
        percentage.textContent = '0%';
        
        // Animate the chart after a short delay
        setTimeout(() => {
            fill.style.height = `${percentages[index]}%`;
            percentage.textContent = `${percentages[index]}%`;
        }, 500 + index * 300);
    });
    
    // Show the modal
    elements.audienceModal.classList.remove('hide');
}

function generateAudiencePercentages(difficulty, correctIndex) {
    let correctPercentage;
    
    // Determine correct answer percentage based on difficulty
    switch(difficulty) {
        case 'easy':
            correctPercentage = 60 + Math.floor(Math.random() * 25); // 60-84%
            break;
        case 'medium':
            correctPercentage = 40 + Math.floor(Math.random() * 30); // 40-69%
            break;
        case 'hard':
            correctPercentage = 30 + Math.floor(Math.random() * 30); // 30-59%
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
            // For the last incorrect option, assign the remaining percentage
            if (i === 3 || (correctIndex === 3 && i === 2)) {
                percentages[i] = remainingPercentage - distributed;
            } else {
                // Random distribution for other incorrect options
                const maxToDistribute = remainingPercentage - distributed - (2 - [0, 1, 2, 3].filter(idx => idx !== correctIndex && idx > i).length);
                const randomPercentage = Math.floor(Math.random() * maxToDistribute);
                percentages[i] = randomPercentage;
                distributed += randomPercentage;
            }
        }
    }
    
    return percentages;
}

function showExpertCall() {
    const correctIndex = gameState.currentQuestion.correctIndex;
    const correctOption = String.fromCharCode(65 + correctIndex); // A, B, C, D
    
    // Determine confidence level based on question difficulty
    const level = gameState.currentQuestion.level;
    let confidenceLevel;
    
    if (level <= 5) confidenceLevel = 'high';
    else if (level <= 10) confidenceLevel = 'medium';
    else confidenceLevel = 'low';
    
    // Generate expert advice
    const advice = generateExpertAdvice(correctOption, confidenceLevel);
    elements.expertAdvice.textContent = advice;
    
    // Show the modal
    elements.expertModal.classList.remove('hide');
}

function generateExpertAdvice(correctOption, confidenceLevel) {
    // Get random template and reason based on confidence level
    const templateIndex = Math.floor(Math.random() * EXPERT_ADVICE_TEMPLATES.length);
    const reasonIndex = Math.floor(Math.random() * EXPERT_REASONS[confidenceLevel].length);
    
    const template = EXPERT_ADVICE_TEMPLATES[templateIndex];
    const reason = EXPERT_REASONS[confidenceLevel][reasonIndex];
    
    // Should the expert give the correct answer?
    let expertOption;
    const accuracy = confidenceLevel === 'high' ? 0.9 : 
                    confidenceLevel === 'medium' ? 0.7 : 0.5;
    
    if (Math.random() < accuracy) {
        // Expert gives correct answer
        expertOption = correctOption;
    } else {
        // Expert gives wrong answer
        const options = ['A', 'B', 'C', 'D'].filter(opt => opt !== correctOption);
        expertOption = options[Math.floor(Math.random() * options.length)];
    }
    
    // Replace placeholders with actual values
    return template.replace('{option}', expertOption).replace('{reason}', reason);
}

// UI Functions
function showScreen(screen) {
    // Hide all screens
    elements.startScreen.classList.add('hide');
    elements.gameScreen.classList.add('hide');
    elements.resultsScreen.classList.add('hide');
    elements.leaderboardScreen.classList.add('hide');
    
    // Show transition overlay
    elements.overlay.classList.remove('hide');
    elements.overlay.classList.add('show');
    
    // After a short delay, show the requested screen and hide the overlay
    setTimeout(() => {
        screen.classList.remove('hide');
        
        setTimeout(() => {
            elements.overlay.classList.remove('show');
            setTimeout(() => {
                elements.overlay.classList.add('hide');
            }, 500);
        }, 500);
    }, 500);
}

function updatePrizeDisplay() {
    const currentPrizeAmount = gameState.player.currentLevel > 0 
        ? PRIZE_LEVELS[gameState.player.currentLevel - 1].amount 
        : 0;
    
    elements.currentPrize.textContent = formatCurrency(currentPrizeAmount);
}

function updatePrizeLadder() {
    // Reset all levels
    elements.prizeLevels.forEach(level => {
        level.classList.remove('current');
    });
    
    // Highlight current level
    const currentLevelElement = document.querySelector(`.prize-level[data-level="${gameState.player.currentLevel + 1}"]`);
    if (currentLevelElement) {
        currentLevelElement.classList.add('current');
    }
}

function showConfetti() {
    elements.confettiCanvas.classList.remove('hide');
    startConfetti();
    
    // Stop confetti after a while
    setTimeout(() => {
        stopConfetti();
        setTimeout(() => {
            elements.confettiCanvas.classList.add('hide');
        }, 2000);
    }, 5000);
}

function closeModals() {
    elements.expertModal.classList.add('hide');
    elements.audienceModal.classList.add('hide');
}

// Leaderboard Functions
function showLeaderboard() {
    updateLeaderboard();
    showScreen(elements.leaderboardScreen);
}

function hideLeaderboard() {
    showScreen(elements.startScreen);
}

function updateLeaderboard() {
    // Get leaderboard from localStorage
    const leaderboard = getLeaderboard();
    
    // Clear current entries
    elements.leaderboardBody.innerHTML = '';
    
    // Add entries
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = entry.name;
        
        const prizeCell = document.createElement('td');
        prizeCell.textContent = formatCurrency(entry.prize);
        
        const dateCell = document.createElement('td');
        dateCell.textContent = new Date(entry.date).toLocaleDateString();
        
        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(prizeCell);
        row.appendChild(dateCell);
        
        elements.leaderboardBody.appendChild(row);
    });
    
    // If no entries, show message
    if (leaderboard.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'No hay registros aún.';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        elements.leaderboardBody.appendChild(row);
    }
}

function saveScore(name, prize, level) {
    // Get current leaderboard
    const leaderboard = getLeaderboard();
    
    // Add new entry
    leaderboard.push({
        name,
        prize,
        level,
        date: new Date().toISOString()
    });
    
    // Sort by prize (descending)
    leaderboard.sort((a, b) => b.prize - a.prize);
    
    // Keep only top 10 entries
    const topEntries = leaderboard.slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem('vendedorEstrellaLeaderboard', JSON.stringify(topEntries));
}

function getLeaderboard() {
    const leaderboardJSON = localStorage.getItem('vendedorEstrellaLeaderboard');
    return leaderboardJSON ? JSON.parse(leaderboardJSON) : [];
}

// Navigation Functions
function resetAndStartGame() {
    elements.playerNameInput.value = gameState.player.name;
    showScreen(elements.startScreen);
    setTimeout(() => {
        elements.playerForm.dispatchEvent(new Event('submit'));
    }, 500);
}

function goToStartScreen() {
    showScreen(elements.startScreen);
}

// Utility Functions
function formatCurrency(amount) {
    return `$${amount.toLocaleString()}`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
