// Game Configuration

// Prize levels in ascending order
const PRIZE_LEVELS = [
    { level: 1, amount: 100 },
    { level: 2, amount: 200 },
    { level: 3, amount: 300 },
    { level: 4, amount: 500 },
    { level: 5, amount: 1000 },    // Safe point
    { level: 6, amount: 2000 },
    { level: 7, amount: 4000 },
    { level: 8, amount: 8000 },
    { level: 9, amount: 16000 },
    { level: 10, amount: 32000 },  // Safe point
    { level: 11, amount: 64000 },
    { level: 12, amount: 125000 },
    { level: 13, amount: 250000 },
    { level: 14, amount: 500000 },
    { level: 15, amount: 1000000 }
];

// Safe points are the levels that if a player fails after reaching them,
// they'll still get the prize amount of that safe point
const SAFE_POINTS = [5, 10, 15];

// Timer configuration
const TIMER_CONFIG = {
    initialTime: 30,       // Time in seconds for each question
    warningThreshold: 15,  // Time threshold to change timer color to orange
    dangerThreshold: 5     // Time threshold to change timer color to red
};

// Questions database
// Each question has:
// - text: the question text
// - options: array of 4 possible answers
// - correctIndex: index (0-3) of the correct answer in the options array
// - level: difficulty level (1-15) matching the prize levels
const QUESTIONS = [
    {
        text: "¿Qué significa SKU en el ámbito de ventas?",
        options: [
            "Sistema de Kioscos Unificados",
            "Stock Keeping Unit",
            "Sistema Kilométrico Unitario",
            "Standard Knowledge Update"
        ],
        correctIndex: 1,
        level: 1
    },
    {
        text: "¿Cuál es el color principal del logo de Mercado Libre?",
        options: [
            "Rojo",
            "Azul",
            "Verde",
            "Amarillo"
        ],
        correctIndex: 3,
        level: 1
    },
    {
        text: "¿Qué significa CTR en marketing digital?",
        options: [
            "Click Through Rate",
            "Control Total de Rentas",
            "Comercio Totalmente Rentable",
            "Customer Trust Rating"
        ],
        correctIndex: 0,
        level: 2
    },
    {
        text: "¿Qué herramienta de Mercado Libre sirve para gestionar envíos?",
        options: [
            "Mercado Shops",
            "Mercado Crédito",
            "Mercado Envíos",
            "Mercado Pago"
        ],
        correctIndex: 2,
        level: 2
    },
    {
        text: "¿Qué métrica mide la frecuencia con la que los clientes abandonan una compra?",
        options: [
            "Tasa de conversión",
            "Tasa de rebote",
            "Tasa de abandono de carrito",
            "Tasa de retención"
        ],
        correctIndex: 2,
        level: 3
    },
    {
        text: "¿Qué es el 'FBA' en el contexto de comercio electrónico?",
        options: [
            "Fast Business Approval",
            "Fulfillment By Amazon",
            "Free Business Account",
            "Forward Buying Approach"
        ],
        correctIndex: 1,
        level: 3
    },
    {
        text: "¿Qué significa ROI en el contexto de negocios?",
        options: [
            "Risk Of Investment",
            "Return On Investment",
            "Rate Of Inflation",
            "Retention Of Income"
        ],
        correctIndex: 1,
        level: 4
    },
    {
        text: "¿Qué formato de imagen es preferible para fotos de productos con fondo transparente?",
        options: [
            "JPG",
            "BMP",
            "PNG",
            "GIF"
        ],
        correctIndex: 2,
        level: 4
    },
    {
        text: "¿Cuál es la política de Mercado Libre respecto a productos prohibidos?",
        options: [
            "Permite su venta con restricciones",
            "Permite su venta solo a usuarios verificados",
            "No permite su venta bajo ninguna circunstancia",
            "Permite su venta con autorización previa"
        ],
        correctIndex: 2,
        level: 5
    },
    {
        text: "¿Qué es un 'upselling' en ventas?",
        options: [
            "Ofrecer un producto de menor valor",
            "Ofrecer productos complementarios",
            "Ofrecer un producto de mayor valor",
            "Ofrecer un descuento por volumen"
        ],
        correctIndex: 2,
        level: 5
    },
    {
        text: "¿Qué significa CPC en publicidad digital?",
        options: [
            "Cost Per Click",
            "Cost Per Conversion",
            "Cost Per Customer",
            "Click Per Cost"
        ],
        correctIndex: 0,
        level: 6
    },
    {
        text: "¿Qué es 'dropshipping'?",
        options: [
            "Enviar productos a granel",
            "Vender productos sin tenerlos en inventario",
            "Reducir precios gradualmente",
            "Enviar productos por correo expreso"
        ],
        correctIndex: 1,
        level: 6
    },
    {
        text: "¿Qué es un 'lead' en marketing?",
        options: [
            "Un cliente potencial",
            "Un producto líder en ventas",
            "Una estrategia de ventas",
            "Un descuento especial"
        ],
        correctIndex: 0,
        level: 7
    },
    {
        text: "¿Qué significa B2B en comercio?",
        options: [
            "Back to Business",
            "Business to Business",
            "Business to Buyer",
            "Buyer to Business"
        ],
        correctIndex: 1,
        level: 7
    },
    {
        text: "¿Qué es un 'KPI' en el mundo empresarial?",
        options: [
            "Key Performance Indicator",
            "Knowledge Process Integration",
            "Key Product Investment",
            "Known Profit Index"
        ],
        correctIndex: 0,
        level: 8
    },
    {
        text: "¿Cuál es la función principal de un CRM?",
        options: [
            "Gestionar el inventario",
            "Procesar pagos",
            "Gestionar relaciones con clientes",
            "Optimizar el SEO"
        ],
        correctIndex: 2,
        level: 8
    },
    {
        text: "¿Qué es la 'tasa de conversión' en e-commerce?",
        options: [
            "Porcentaje de visitantes que realizan una compra",
            "Porcentaje de productos devueltos",
            "Velocidad de carga de la página web",
            "Número de visitantes diarios"
        ],
        correctIndex: 0,
        level: 9
    },
    {
        text: "¿Qué significa FOMO en marketing?",
        options: [
            "Forward Motion",
            "Fear Of Missing Out",
            "Focus On Market Operations",
            "Free Offer Marketing Option"
        ],
        correctIndex: 1,
        level: 9
    },
    {
        text: "¿Qué es un 'marketplace'?",
        options: [
            "Una tienda física",
            "Una plataforma donde múltiples vendedores ofrecen productos",
            "Un centro comercial",
            "Un método de pago"
        ],
        correctIndex: 1,
        level: 10
    },
    {
        text: "¿Cuál fue el año de fundación de Mercado Libre?",
        options: [
            "1995",
            "1999",
            "2003",
            "2007"
        ],
        correctIndex: 1,
        level: 10
    },
    {
        text: "¿Qué es el 'remarketing'?",
        options: [
            "Vender productos usados",
            "Dirigir publicidad a usuarios que ya visitaron tu sitio",
            "Rediseñar la imagen de marca",
            "Renegociar precios con proveedores"
        ],
        correctIndex: 1,
        level: 11
    },
    {
        text: "¿Qué significa SEO?",
        options: [
            "System Engine Optimization",
            "Search Engine Optimization",
            "Sales Enhancement Operations",
            "Social Engagement Opportunity"
        ],
        correctIndex: 1,
        level: 11
    },
    {
        text: "¿Qué es un 'chatbot' en el servicio al cliente?",
        options: [
            "Un grupo de chat para clientes",
            "Un programa automatizado que interactúa con clientes",
            "Un call center tercerizado",
            "Un sistema de fidelización"
        ],
        correctIndex: 1,
        level: 12
    },
    {
        text: "¿Qué significa LTV en marketing?",
        options: [
            "Long Term Value",
            "Lifetime Value",
            "Local Target Verification",
            "Low Transaction Volume"
        ],
        correctIndex: 1,
        level: 12
    },
    {
        text: "¿Qué es el 'omnichannel' en retail?",
        options: [
            "Vender a través de múltiples canales integrados",
            "Tener una tienda con múltiples departamentos",
            "Ofrecer productos de múltiples marcas",
            "Tener múltiples sucursales"
        ],
        correctIndex: 0,
        level: 13
    },
    {
        text: "¿Qué es un 'early adopter'?",
        options: [
            "Un cliente que compra con frecuencia",
            "Un usuario que adopta nuevas tecnologías tempranamente",
            "Un vendedor principiante",
            "Un niño que usa tecnología"
        ],
        correctIndex: 1,
        level: 13
    },
    {
        text: "¿Qué es la 'economía de escala'?",
        options: [
            "Reducción de costos al aumentar el volumen de producción",
            "Economía basada en transacciones digitales",
            "Sistema de préstamos a pequeñas empresas",
            "Economía basada en importaciones"
        ],
        correctIndex: 0,
        level: 14
    },
    {
        text: "¿En qué país tiene Mercado Libre su sede principal?",
        options: [
            "México",
            "Brasil",
            "Argentina",
            "Colombia"
        ],
        correctIndex: 2,
        level: 14
    },
    {
        text: "¿Quién es el fundador de Mercado Libre?",
        options: [
            "Marcos Galperín",
            "Hernán Kazah",
            "Nicolás Szekasy",
            "Stelleo Tolda"
        ],
        correctIndex: 0,
        level: 15
    },
    {
        text: "¿En qué año Mercado Libre comenzó a cotizar en NASDAQ?",
        options: [
            "2001",
            "2007",
            "2010",
            "2015"
        ],
        correctIndex: 1,
        level: 15
    }
];

// Lifeline configurations
const LIFELINES = {
    fiftyFifty: {
        id: "fifty-fifty",
        name: "50:50",
        used: false,
        // This lifeline removes two incorrect options
    },
    audienceHelp: {
        id: "audience-help",
        name: "Ayuda del Público",
        used: false,
        // This lifeline shows audience voting percentages for each option
    },
    expertCall: {
        id: "expert-call",
        name: "Llamada al Experto",
        used: false,
        // This lifeline provides expert advice
    }
};

// Expert advice templates
const EXPERT_ADVICE_TEMPLATES = [
    "Estoy bastante seguro de que la respuesta correcta es {option}. {reason}",
    "Aunque no es mi área de especialidad, me inclino por la opción {option}. {reason}",
    "Basado en mi experiencia en Mercado Libre, diría que es {option}. {reason}",
    "Si tuviera que apostar, elegiría {option}. {reason}",
    "Sin duda alguna, la respuesta es {option}. {reason}"
];

// Expert reasons based on confidence level
const EXPERT_REASONS = {
    high: [
        "He trabajado con esto durante años.",
        "Esta información es básica para cualquier vendedor exitoso.",
        "Es un concepto fundamental en e-commerce.",
        "No hay ninguna duda al respecto."
    ],
    medium: [
        "Aunque podría equivocarme, creo que es la más lógica.",
        "He visto casos similares antes.",
        "Tiene sentido desde la perspectiva del negocio.",
        "Las otras opciones no parecen correctas."
    ],
    low: [
        "No estoy 100% seguro, pero es mi mejor estimación.",
        "Es un tema complejo, pero esa parece la respuesta más probable.",
        "Tendría que verificarlo, pero creo que es correcto.",
        "Es una pregunta difícil, pero me inclino por esa opción."
    ]
};

// Game messages
const GAME_MESSAGES = {
    welcome: "¡Bienvenido a ¿Quién quiere ser un Vendedor Estrella?!",
    start: "Vamos a comenzar. ¡Buena suerte!",
    correctAnswer: "¡Respuesta correcta!",
    wrongAnswer: "Lo siento, respuesta incorrecta.",
    gameOver: "Juego terminado. ",
    timeUp: "¡Se acabó el tiempo!",
    winner: "¡Felicidades! ¡Eres un Vendedor Estrella de Mercado Libre!",
    lifeline5050: "Se han eliminado dos respuestas incorrectas.",
    lifelineAudience: "El público ha votado.",
    lifelineExpert: "El experto ha respondido."
};

// Sound effects paths (these will be loaded by the sounds.js module)
const SOUND_PATHS = {
    start: "start",
    question: "question",
    select: "select",
    correct: "correct",
    wrong: "wrong",
    timeRunning: "time-running",
    timeLow: "time-low",
    lifeline: "lifeline",
    winner: "winner",
    levelUp: "level-up"
};
