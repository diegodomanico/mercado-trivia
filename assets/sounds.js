// Game sound effects using Web Audio API
let audioContext;
let sounds = {};
let isSoundInitialized = false;

// Function to initialize the sound system
function initializeSounds() {
    if (isSoundInitialized) return;
    
    try {
        // Create audio context
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // Create all sound effects
        createSounds();
        
        console.log('Sound system initialized');
        isSoundInitialized = true;
    } catch (error) {
        console.error('Error initializing sound system:', error);
    }
    
    // Add a click handler to the document to resume audio context if needed
    document.addEventListener('click', resumeAudioContext, { once: true });
}

// Function to resume audio context (needed for browsers that suspend it until user interaction)
function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Audio context resumed');
        });
    }
}

// Create all sounds
function createSounds() {
    sounds = {
        start: createStartSound(),
        question: createQuestionSound(),
        select: createSelectSound(),
        correct: createCorrectSound(),
        wrong: createWrongSound(),
        timeRunning: createTimeRunningSound(),
        timeLow: createTimeLowSound(),
        lifeline: createLifelineSound(),
        winner: createWinnerSound(),
        levelUp: createLevelUpSound()
    };
}

// Play a sound by name
function playSound(soundName) {
    // Ensure audio context is running
    if (!audioContext || audioContext.state === 'suspended') {
        resumeAudioContext();
        return;
    }
    
    // Check if the sound exists
    if (!sounds[soundName]) {
        console.error(`Sound '${soundName}' not found`);
        return;
    }
    
    // For simple sounds
    if (typeof sounds[soundName] === 'function') {
        sounds[soundName]();
    } 
    // For pre-defined oscillator sequences
    else if (Array.isArray(sounds[soundName])) {
        playOscillatorSequence(sounds[soundName]);
    }
}

// Play a sequence of oscillator notes
function playOscillatorSequence(sequence) {
    let startTime = audioContext.currentTime;
    
    sequence.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Set oscillator type and frequency
        oscillator.type = note.type || 'sine';
        oscillator.frequency.setValueAtTime(note.frequency, startTime + note.time);
        
        // Frequency modulation if needed
        if (note.frequencyTo) {
            oscillator.frequency.exponentialRampToValueAtTime(
                note.frequencyTo, 
                startTime + note.time + note.duration
            );
        }
        
        // Volume envelope
        gainNode.gain.setValueAtTime(0, startTime + note.time);
        gainNode.gain.linearRampToValueAtTime(note.volume || 0.5, startTime + note.time + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + note.time + note.duration);
        
        // Connect and start
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(startTime + note.time);
        oscillator.stop(startTime + note.time + note.duration + 0.01);
    });
}

// Create start game sound
function createStartSound() {
    return [
        { time: 0.0, frequency: 300, duration: 0.15, volume: 0.5, type: 'triangle' },
        { time: 0.2, frequency: 400, duration: 0.15, volume: 0.5, type: 'triangle' },
        { time: 0.4, frequency: 500, duration: 0.15, volume: 0.5, type: 'triangle' },
        { time: 0.6, frequency: 600, duration: 0.45, volume: 0.7, type: 'triangle' }
    ];
}

// Create new question sound
function createQuestionSound() {
    return [
        { time: 0.0, frequency: 300, duration: 0.1, volume: 0.3, type: 'sine' },
        { time: 0.1, frequency: 400, duration: 0.1, volume: 0.4, type: 'sine' },
        { time: 0.2, frequency: 500, duration: 0.2, volume: 0.5, type: 'sine' }
    ];
}

// Create select answer sound
function createSelectSound() {
    return function() {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    };
}

// Create correct answer sound
function createCorrectSound() {
    return [
        { time: 0.0, frequency: 300, duration: 0.1, volume: 0.4, type: 'sine' },
        { time: 0.1, frequency: 400, duration: 0.1, volume: 0.4, type: 'sine' },
        { time: 0.2, frequency: 500, duration: 0.1, volume: 0.4, type: 'sine' },
        { time: 0.3, frequency: 600, duration: 0.5, volume: 0.5, type: 'sine' }
    ];
}

// Create wrong answer sound
function createWrongSound() {
    return [
        { time: 0.0, frequency: 400, duration: 0.2, volume: 0.5, type: 'sawtooth' },
        { time: 0.2, frequency: 200, duration: 0.6, volume: 0.5, type: 'sawtooth', frequencyTo: 180 }
    ];
}

// Create time running out sound
function createTimeRunningSound() {
    return function() {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    };
}

// Create time almost up sound
function createTimeLowSound() {
    return function() {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    };
}

// Create lifeline used sound
function createLifelineSound() {
    return [
        { time: 0.0, frequency: 600, duration: 0.1, volume: 0.4, type: 'sine' },
        { time: 0.1, frequency: 700, duration: 0.1, volume: 0.4, type: 'sine' },
        { time: 0.2, frequency: 800, duration: 0.3, volume: 0.4, type: 'sine' }
    ];
}

// Create winner celebration sound
function createWinnerSound() {
    return [
        { time: 0.0, frequency: 300, duration: 0.15, volume: 0.5, type: 'triangle' },
        { time: 0.15, frequency: 400, duration: 0.15, volume: 0.5, type: 'triangle' },
        { time: 0.3, frequency: 500, duration: 0.15, volume: 0.5, type: 'triangle' },
        { time: 0.45, frequency: 600, duration: 0.15, volume: 0.5, type: 'triangle' },
        { time: 0.6, frequency: 700, duration: 0.15, volume: 0.5, type: 'triangle' },
        { time: 0.75, frequency: 800, duration: 0.5, volume: 0.6, type: 'triangle' }
    ];
}

// Create level up sound
function createLevelUpSound() {
    return [
        { time: 0.0, frequency: 400, duration: 0.15, volume: 0.4, type: 'sine' },
        { time: 0.15, frequency: 500, duration: 0.15, volume: 0.5, type: 'sine' },
        { time: 0.3, frequency: 600, duration: 0.15, volume: 0.5, type: 'sine' },
        { time: 0.45, frequency: 700, duration: 0.4, volume: 0.6, type: 'sine' }
    ];
}