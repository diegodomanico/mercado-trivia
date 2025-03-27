// Confetti animation for winner celebration

// Global canvas context
let confettiCanvas;
let confettiCtx;
let confettiAnimationId;
let confettiParticles = [];

// Initialize confetti
document.addEventListener('DOMContentLoaded', function() {
    confettiCanvas = document.getElementById('confetti-canvas');
    confettiCtx = confettiCanvas.getContext('2d');
    
    // Set canvas to full window size
    function resizeCanvas() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    
    // Resize on load and window resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});

// Start confetti animation
function startConfetti() {
    if (!confettiCanvas || !confettiCtx) return;
    
    // Clear existing animation if running
    if (confettiAnimationId) {
        stopConfetti();
    }
    
    // Reset particles array
    confettiParticles = [];
    
    // Create initial particles
    createConfettiParticles(150);
    
    // Start animation loop
    animateConfetti();
}

// Stop confetti animation
function stopConfetti() {
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
    }
    
    // Clear canvas
    if (confettiCtx) {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
}

// Create confetti particles
function createConfettiParticles(count) {
    for (let i = 0; i < count; i++) {
        confettiParticles.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * -confettiCanvas.height,
            size: randomRange(7, 14),
            color: getRandomColor(),
            shape: getRandomShape(),
            angle: randomRange(0, 2 * Math.PI),
            rotation: randomRange(-0.1, 0.1),
            speed: randomRange(1, 3),
            opacity: 1
        });
    }
}

// Animate confetti
function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    // Draw and update each particle
    for (let i = 0; i < confettiParticles.length; i++) {
        const particle = confettiParticles[i];
        
        // Update position
        particle.y += particle.speed;
        particle.angle += particle.rotation;
        
        // Slight horizontal movement
        particle.x += Math.sin(particle.angle) * 0.5;
        
        // Fade out as it falls
        if (particle.y > confettiCanvas.height * 0.7) {
            particle.opacity = Math.max(0, particle.opacity - 0.01);
        }
        
        // Draw the particle
        drawConfettiParticle(particle);
        
        // Remove particles that are out of view or completely faded
        if (particle.y > confettiCanvas.height || particle.opacity <= 0) {
            confettiParticles.splice(i, 1);
            i--;
            
            // Add a new particle to replace the removed one
            if (Math.random() < 0.3) {
                confettiParticles.push({
                    x: Math.random() * confettiCanvas.width,
                    y: -10,
                    size: randomRange(7, 14),
                    color: getRandomColor(),
                    shape: getRandomShape(),
                    angle: randomRange(0, 2 * Math.PI),
                    rotation: randomRange(-0.1, 0.1),
                    speed: randomRange(1, 3),
                    opacity: 1
                });
            }
        }
    }
    
    // Continue animation
    confettiAnimationId = requestAnimationFrame(animateConfetti);
}

// Draw a single confetti particle
function drawConfettiParticle(particle) {
    confettiCtx.save();
    confettiCtx.translate(particle.x, particle.y);
    confettiCtx.rotate(particle.angle);
    confettiCtx.globalAlpha = particle.opacity;
    confettiCtx.fillStyle = particle.color;
    
    switch (particle.shape) {
        case 'circle':
            confettiCtx.beginPath();
            confettiCtx.arc(0, 0, particle.size / 2, 0, 2 * Math.PI);
            confettiCtx.fill();
            break;
        
        case 'rect':
            confettiCtx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            break;
        
        case 'triangle':
            confettiCtx.beginPath();
            confettiCtx.moveTo(0, -particle.size / 2);
            confettiCtx.lineTo(particle.size / 2, particle.size / 2);
            confettiCtx.lineTo(-particle.size / 2, particle.size / 2);
            confettiCtx.closePath();
            confettiCtx.fill();
            break;
    }
    
    confettiCtx.restore();
}

// Utility functions
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomColor() {
    // Mercado Libre colors plus some festive colors
    const colors = [
        '#FFE600', // Yellow
        '#3483FA', // Blue
        '#2968C8', // Dark Blue
        '#39B54A', // Green
        '#FF9800', // Orange
        '#F23D4F', // Red
        '#9C27B0', // Purple
        '#4CAF50', // Green
        '#00BCD4', // Cyan
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomShape() {
    const shapes = ['circle', 'rect', 'triangle'];
    return shapes[Math.floor(Math.random() * shapes.length)];
}
