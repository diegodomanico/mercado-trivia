// API Endpoints
const API_ENDPOINTS = {
    checkPhone: (phone) => `/api/check-phone/${phone}`,
    questions: '/api/questions',
    scores: '/api/scores',
    topScores: '/api/top-scores',
    apiKey: '/api/airtable-key'
};

// Game configuration
const GAME_CONFIG = {
    // Time per difficulty level (in seconds)
    timePerDifficulty: {
        fácil: 30,
        media: 45,
        difícil: 60,
        muy_difícil: 75,
        experto: 90
    },
    
    // Number of questions per pillar in each round
    questionsPerRound: 5,
    
    // Points awarded per difficulty level
    pointsPerDifficulty: {
        fácil: 100,
        media: 200,
        difícil: 500,
        muy_difícil: 1000,
        experto: 2000
    }
};

// Game structure
const GAME_STRUCTURE = {
    // Difficulty levels
    difficultyLevels: [
        'Fácil',
        'Media',
        'Difícil',
        'Muy Difícil',
        'Experto'
    ],
    
    // Pillars - solo usamos los que están en el CSV
    pillars: [
        'Reputación ❤️',
        'Oferta 💙',
        'Servicio 💛',
        'Tráfico 💜',
        'Data driven 💗'
    ],
    
    // Total number of rounds
    totalRounds: 5
};

// Templates for expert advice
const EXPERT_ADVICE_TEMPLATES = [
    "Después de analizar la pregunta, creo que la respuesta correcta es la opción {option}. {reason}",
    "Si tuviera que elegir, diría que es la opción {option}. {reason}",
    "Basado en mi experiencia, me inclino por la opción {option}. {reason}",
    "Mmm... Esta es difícil, pero creo que la respuesta es {option}. {reason}",
    "Analizando las opciones, me parece que {option} es la respuesta correcta. {reason}"
];

// Expert reasons based on confidence level
const EXPERT_REASONS = {
    high: [
        "Estoy bastante seguro de esta respuesta.",
        "He visto este tema muchas veces en mi experiencia.",
        "La respuesta es clara según las mejores prácticas de Mercado Libre.",
        "Esta es definitivamente la mejor opción para los vendedores."
    ],
    medium: [
        "Aunque no estoy 100% seguro, es la que tiene más sentido.",
        "Entre las opciones disponibles, esta parece ser la más adecuada.",
        "Basado en lo que sé, esta debería ser la correcta, pero tengo algunas dudas.",
        "No es mi área de especialidad, pero esta opción parece la más lógica."
    ],
    low: [
        "Es un tema complicado y podría equivocarme.",
        "No tengo mucha experiencia en este aspecto específico, pero es mi mejor suposición.",
        "La verdad es que estoy dividido entre un par de opciones, pero me inclino por esta.",
        "Es difícil estar seguro, pero vamos con esta respuesta."
    ]
};

// Export all configuration
module.exports = {
    API_ENDPOINTS,
    GAME_CONFIG,
    GAME_STRUCTURE,
    EXPERT_ADVICE_TEMPLATES,
    EXPERT_REASONS
};