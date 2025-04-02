// Sound Effects System

// Audio Context and Sounds Storage
let audioContext;
let soundsLoaded = false;
let sounds = {};

// Initialize audio context and setup sounds
function initializeSounds() {
    try {
        // Create AudioContext
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // Create all sound effects
        createSounds();
        
        // Mark sounds as loaded
        soundsLoaded = true;
        
        console.log("Sound system initialized");
        
        // Some browsers require user interaction to start audio context
        document.addEventListener('click', resumeAudioContext, { once: true });
    } catch (error) {
        console.error("Error initializing sound system:", error);
    }
}

// Resume audio context after user interaction
function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log("AudioContext resumed successfully");
        }).catch(error => {
            console.error("Error resuming AudioContext:", error);
        });
    }
}

// Create all game sounds
function createSounds() {
    // Create all sound effects
    createStartSound();
    createQuestionSound();
    createSelectSound();
    createCorrectSound();
    createWrongSound();
    createTimeRunningSound();
    createTimeLowSound();
    createLifelineSound();
    createWinnerSound();
    createLevelUpSound();
}

// Play a specific sound by name
function playSound(soundName) {
    // If sound system not initialized or no such sound, do nothing
    if (!soundsLoaded || !sounds[soundName]) {
        return;
    }
    
    try {
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // If sound is an oscillator sequence, play that
        if (sounds[soundName].type === 'sequence') {
            playOscillatorSequence(sounds[soundName].sequence);
            return;
        }
        
        // For normal sounds
        const sound = sounds[soundName];
        
        // Create source node
        const source = audioContext.createOscillator();
        source.type = sound.type;
        
        // Create gain node
        const gainNode = audioContext.createGain();
        gainNode.gain.value = sound.volume;
        
        // If frequency is an array, it's a sweep
        if (Array.isArray(sound.frequency)) {
            source.frequency.setValueAtTime(sound.frequency[0], audioContext.currentTime);
            source.frequency.linearRampToValueAtTime(sound.frequency[1], audioContext.currentTime + sound.duration);
        } else {
            source.frequency.value = sound.frequency;
        }
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start and stop the sound
        source.start();
        source.stop(audioContext.currentTime + sound.duration);
    } catch (error) {
        console.error(`Error playing sound ${soundName}:`, error);
    }
}

// Play a sequence of oscillator sounds
function playOscillatorSequence(sequence) {
    let startTime = audioContext.currentTime;
    
    sequence.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = note.type || 'sine';
        oscillator.frequency.value = note.frequency;
        
        gainNode.gain.value = note.volume || 0.3;
        
        // Apply fade in/out for smoother sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(note.volume || 0.3, startTime + 0.01);
        gainNode.gain.setValueAtTime(note.volume || 0.3, startTime + note.duration - 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + note.duration);
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Schedule start/stop
        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);
        
        // Update start time for next note
        startTime += note.duration;
    });
}

// Create game start sound
function createStartSound() {
    sounds.start = {
        type: 'sequence',
        sequence: [
            { type: 'sine', frequency: 523.25, duration: 0.15, volume: 0.3 },  // C5
            { type: 'sine', frequency: 659.25, duration: 0.15, volume: 0.3 },  // E5
            { type: 'sine', frequency: 783.99, duration: 0.3, volume: 0.3 }    // G5
        ]
    };
}

// Create new question sound
function createQuestionSound() {
    sounds.question = {
        type: 'sine',
        frequency: [400, 600],
        duration: 0.3,
        volume: 0.2
    };
}

// Create select sound
function createSelectSound() {
    sounds.select = {
        type: 'sine',
        frequency: 440,
        duration: 0.1,
        volume: 0.2
    };
}

// Create correct answer sound
function createCorrectSound() {
    sounds.correct = {
        type: 'sequence',
        sequence: [
            { type: 'sine', frequency: 523.25, duration: 0.1, volume: 0.3 },  // C5
            { type: 'sine', frequency: 659.25, duration: 0.1, volume: 0.3 },  // E5
            { type: 'sine', frequency: 783.99, duration: 0.1, volume: 0.3 },  // G5
            { type: 'sine', frequency: 1046.50, duration: 0.3, volume: 0.3 }  // C6
        ]
    };
}

// Create wrong answer sound
function createWrongSound() {
    sounds.wrong = {
        type: 'sequence',
        sequence: [
            { type: 'sawtooth', frequency: 440, duration: 0.1, volume: 0.2 },
            { type: 'sawtooth', frequency: 349.23, duration: 0.1, volume: 0.2 },
            { type: 'sawtooth', frequency: 293.66, duration: 0.3, volume: 0.2 }
        ]
    };
}

// Create time running sound
function createTimeRunningSound() {
    sounds.timeRunning = {
        type: 'sine',
        frequency: 220,
        duration: 0.1,
        volume: 0.1
    };
}

// Create time low sound (urgent ticking)
function createTimeLowSound() {
    sounds.timeLow = {
        type: 'triangle',
        frequency: 440,
        duration: 0.1,
        volume: 0.2
    };
}

// Create lifeline use sound
function createLifelineSound() {
    sounds.lifeline = {
        type: 'sequence',
        sequence: [
            { type: 'sine', frequency: 587.33, duration: 0.1, volume: 0.3 },  // D5
            { type: 'sine', frequency: 659.25, duration: 0.1, volume: 0.3 },  // E5
            { type: 'sine', frequency: 783.99, duration: 0.2, volume: 0.3 }   // G5
        ]
    };
}

// Create winner celebration sound
function createWinnerSound() {
    sounds.winner = {
        type: 'sequence',
        sequence: [
            { type: 'sine', frequency: 523.25, duration: 0.1, volume: 0.3 },  // C5
            { type: 'sine', frequency: 587.33, duration: 0.1, volume: 0.3 },  // D5
            { type: 'sine', frequency: 659.25, duration: 0.1, volume: 0.3 },  // E5
            { type: 'sine', frequency: 698.46, duration: 0.1, volume: 0.3 },  // F5
            { type: 'sine', frequency: 783.99, duration: 0.1, volume: 0.3 },  // G5
            { type: 'sine', frequency: 880.00, duration: 0.1, volume: 0.3 },  // A5
            { type: 'sine', frequency: 987.77, duration: 0.1, volume: 0.3 },  // B5
            { type: 'sine', frequency: 1046.50, duration: 0.3, volume: 0.4 }  // C6
        ]
    };
}

// Create level up sound
function createLevelUpSound() {
    sounds.levelUp = {
        type: 'sequence',
        sequence: [
            { type: 'sine', frequency: 523.25, duration: 0.1, volume: 0.3 },  // C5
            { type: 'sine', frequency: 659.25, duration: 0.1, volume: 0.3 },  // E5
            { type: 'sine', frequency: 783.99, duration: 0.1, volume: 0.3 },  // G5
            { type: 'sine', frequency: 1046.50, duration: 0.3, volume: 0.4 }  // C6
        ]
    };
}