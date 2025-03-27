// Game constants and configuration

// API Endpoints
const API_ENDPOINTS = {
    questions: '/api/questions',
    scores: '/api/scores',
    topScores: '/api/scores/top',
    checkPhone: '/api/check-phone'
};

// Game structure
const GAME_STRUCTURE = {
    difficultyLevels: ['Fácil', 'Media', 'Difícil', 'Muy Difícil', 'Experto'],
    pillars: ['Reputación', 'Oferta', 'Logística', 'Experiencia', 'Costos'],
    totalRounds: 5, // One round per difficulty level
    totalQuestionsNeeded: 10 // Reducido para poder jugar con las preguntas disponibles
};

// Game configuration
const GAME_CONFIG = {
    questionsPerRound: 5, // Number of questions per pillar in each round
    questionPointValue: 100, // Base points per question
    timePerDifficulty: { // Time in seconds for each difficulty level
        facil: 30,
        media: 45,
        dificil: 60,
        muy_dificil: 75,
        experto: 90
    },
    audienceHelpAccuracy: { // Percentage of audience that will choose the correct answer
        facil: 70,
        media: 60,
        dificil: 50,
        muy_dificil: 40,
        experto: 30
    }
};

// Prize levels for each round (now in chances instead of money)
const PRIZE_LEVELS = [
    { round: 1, amount: 1 },    // Fácil - 1 Chance
    { round: 2, amount: 2 },    // Media - 2 Chances
    { round: 3, amount: 3 },   // Difícil - 3 Chances
    { round: 4, amount: 4 },  // Muy Difícil - 4 Chances
    { round: 5, amount: 5 }  // Experto - 5 Chances
];

// Game messages
const GAME_MESSAGES = {
    welcome: "¡Bienvenido a ¿Quién quiere ser un Vendedor Estrella?!",
    noQuestions: "No hay suficientes preguntas disponibles para jugar. Intenta más tarde.",
    timeUp: "¡Se acabó el tiempo!",
    correctAnswer: "¡Respuesta correcta!",
    wrongAnswer: "Respuesta incorrecta",
    gameOver: "Juego terminado",
    winner: "¡Eres un Vendedor Estrella!",
    nextRound: "¡Prepárate para la siguiente ronda!"
};

// Expert advice templates
const EXPERT_ADVICE_TEMPLATES = [
    "Después de analizar la pregunta, creo que la opción {option} es la correcta porque {reason}",
    "Basado en mi experiencia, diría que la respuesta es {option} ya que {reason}",
    "He visto este tema muchas veces, y la opción {option} parece ser la correcta porque {reason}",
    "Si no me equivoco, la respuesta es {option} debido a que {reason}",
    "Tengo bastante certeza de que {option} es la respuesta correcta porque {reason}"
];

// Expert reasons by confidence level
const EXPERT_REASONS = {
    high: [
        "es un concepto fundamental en Mercado Libre.",
        "es una práctica recomendada para todos los vendedores exitosos.",
        "está bien documentado en el Centro de Vendedores de Mercado Libre.",
        "he visto que los mejores vendedores siempre siguen esta estrategia.",
        "es consistente con las políticas actuales de la plataforma."
    ],
    medium: [
        "tiene sentido según lo que he visto en mi experiencia.",
        "es probablemente la mejor opción, aunque hay algunas excepciones.",
        "suena como la respuesta más razonable en este contexto.",
        "encaja con lo que he observado en casos similares.",
        "parece ser la práctica más común entre vendedores exitosos."
    ],
    low: [
        "podría ser correcto, pero no estoy completamente seguro.",
        "es mi mejor suposición, aunque este tema es complicado.",
        "parece tener sentido, pero hay varias posibilidades.",
        "es lo que recuerdo, aunque las políticas pueden haber cambiado.",
        "es lo que yo haría en esta situación, pero verifica por tu cuenta."
    ]
};