// Sound management for the game

// Audio context and sounds
let audioContext;
let audioSources = {};
let sounds = {};

// Initialize the audio system
function initializeSounds() {
    try {
        // Create audio context
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // Load all sound effects
        createSounds();
        
        // Add event listener to resume audio context on user interaction
        document.addEventListener('click', resumeAudioContext, { once: true });
    } catch (e) {
        console.error('Web Audio API is not supported in this browser', e);
    }
}

// Resume audio context (needed due to autoplay policy in browsers)
function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Create oscillator-based sounds
function createSounds() {
    // Start sound (when game begins)
    sounds.start = createStartSound();
    
    // Question sound (when a new question appears)
    sounds.question = createQuestionSound();
    
    // Select sound (when player selects an answer)
    sounds.select = createSelectSound();
    
    // Correct answer sound
    sounds.correct = createCorrectSound();
    
    // Wrong answer sound
    sounds.wrong = createWrongSound();
    
    // Time running sound (warning)
    sounds.timeRunning = createTimeRunningSound();
    
    // Time low sound (danger)
    sounds.timeLow = createTimeLowSound();
    
    // Lifeline sound (when using a lifeline)
    sounds.lifeline = createLifelineSound();
    
    // Winner sound (million dollar win)
    sounds.winner = createWinnerSound();
    
    // Level up sound (advancing to next question)
    sounds.levelUp = createLevelUpSound();
}

// Play a sound
function playSound(soundName) {
    try {
        // Make sure audio context is running
        resumeAudioContext();
        
        // Stop the sound if it's already playing
        if (audioSources[soundName]) {
            audioSources[soundName].stop();
        }
        
        // Get the sound buffer
        const sound = sounds[soundName];
        if (!sound) return;
        
        // Create a new source
        const source = typeof sound === 'function' ? sound() : playOscillatorSequence(sound);
        audioSources[soundName] = source;
    } catch (e) {
        console.error(`Error playing sound ${soundName}:`, e);
    }
}

// Play a sequence of oscillator notes
function playOscillatorSequence(sequence) {
    const startTime = audioContext.currentTime;
    
    sequence.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = note.type || 'sine';
        oscillator.frequency.value = note.frequency;
        
        gainNode.gain.value = note.volume || 0.5;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(startTime + note.time);
        oscillator.stop(startTime + note.time + note.duration);
        
        // Optional frequency ramp
        if (note.frequencyTo) {
            oscillator.frequency.linearRampToValueAtTime(
                note.frequencyTo,
                startTime + note.time + note.duration
            );
        }
        
        // Optional gain ramp for fade in/out
        if (note.fadeOut) {
            gainNode.gain.linearRampToValueAtTime(
                0,
                startTime + note.time + note.duration
            );
        }
        
        if (note.fadeIn) {
            gainNode.gain.setValueAtTime(0, startTime + note.time);
            gainNode.gain.linearRampToValueAtTime(
                note.volume || 0.5,
                startTime + note.time + note.fadeIn
            );
        }
    });
    
    // Return dummy source with stop method for consistency
    return {
        stop: function() {}
    };
}

// Create sounds
function createStartSound() {
    return function() {
        const sequence = [
            { frequency: 523.25, time: 0, duration: 0.2, volume: 0.4, type: 'sine' },
            { frequency: 659.25, time: 0.2, duration: 0.2, volume: 0.4, type: 'sine' },
            { frequency: 783.99, time: 0.4, duration: 0.2, volume: 0.4, type: 'sine' },
            { frequency: 1046.50, time: 0.6, duration: 0.5, volume: 0.4, type: 'sine', fadeOut: true }
        ];
        
        return playOscillatorSequence(sequence);
    };
}

function createQuestionSound() {
    return function() {
        const sequence = [
            { frequency: 440, time: 0, duration: 0.1, volume: 0.3, type: 'sine' },
            { frequency: 466.16, time: 0.12, duration: 0.1, volume: 0.3, type: 'sine' },
            { frequency: 493.88, time: 0.24, duration: 0.1, volume: 0.3, type: 'sine' },
            { frequency: 523.25, time: 0.36, duration: 0.4, volume: 0.3, type: 'sine', fadeOut: true }
        ];
        
        return playOscillatorSequence(sequence);
    };
}

function createSelectSound() {
    return function() {
        const sequence = [
            { frequency: 440, time: 0, duration: 0.15, volume: 0.3, type: 'sine' }
        ];
        
        return playOscillatorSequence(sequence);
    };
}

function createCorrectSound() {
    return function() {
        const sequence = [
            { frequency: 523.25, time: 0, duration: 0.2, volume: 0.4, type: 'sine' },
            { frequency: 659.25, time: 0.2, duration: 0.2, volume: 0.4, type: 'sine' },
            { frequency: 783.99, time: 0.4, duration: 0.6, volume: 0.4, type: 'sine', fadeOut: true }
        ];
        
        return playOscillatorSequence(sequence);
    };
}

function createWrongSound() {
    return function() {
        const sequence = [
            { frequency: 311.13, time: 0, duration: 0.2, volume: 0.4, type: 'square' },
            { frequency: 233.08, time: 0.2, duration: 0.6, volume: 0.4, type: 'square', fadeOut: true }
        ];
        
        return playOscillatorSequence(sequence);
    };
}

function createTimeRunningSound() {
    return function() {
        const sequence = [
            { frequency: 440, time: 0, duration: 0.1, volume: 0.2, type: 'sine' }
        ];
        
        return playOscillatorSequence(sequence);
    };
}

function createTimeLowSound() {
    return function() {
        const sequence = [
            { frequency: 440, time: 0, duration: 0.1, volume: 0.3, type: 'square' }
        ];
        
        return playOscillatorSequence(sequence);
    };
}

function createLifelineSound() {
    return function() {
        const sequence = [
            { frequency: 523.25, time: 0, duration: 0.1, volume: 0.3, type: 'sine' },
            { frequency: 659.25, time: 0.1, duration: 0.1, volume: 0.3, type: 'sine' },
            { frequency: 783.99, time: 0.2, duration: 0.3, volume: 0.3, type: 'sine', fadeOut: true }
        ];
        
        return playOscillatorSequence(sequence);
    };
}

function createWinnerSound() {
    return function() {
        const sequence = [];
        const baseFrequency = 523.25; // C5
        
        // Create an ascending and descending arpeggio
        for (let i = 0; i < 8; i++) {
            sequence.push({
                frequency: baseFrequency * Math.pow(2, i/12),
                time: i * 0.1,
                duration: 0.2,
                volume: 0.3,
                type: 'sine'
            });
        }
        
        // Add a triumphant chord
        sequence.push(
            { frequency: 523.25, time: 1.0, duration: 1.0, volume: 0.3, type: 'sine', fadeOut: true },
            { frequency: 659.25, time: 1.0, duration: 1.0, volume: 0.3, type: 'sine', fadeOut: true },
            { frequency: 783.99, time: 1.0, duration: 1.0, volume: 0.3, type: 'sine', fadeOut: true }
        );
        
        return playOscillatorSequence(sequence);
    };
}

function createLevelUpSound() {
    return function() {
        const sequence = [
            { frequency: 523.25, time: 0, duration: 0.1, volume: 0.3, type: 'sine' },
            { frequency: 587.33, time: 0.1, duration: 0.1, volume: 0.3, type: 'sine' },
            { frequency: 659.25, time: 0.2, duration: 0.3, volume: 0.3, type: 'sine', fadeOut: true }
        ];
        
        return playOscillatorSequence(sequence);
    };
}
