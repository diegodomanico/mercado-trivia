// Confetti Animation
class ConfettiEffect {
    constructor() {
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 150;
        this.gravity = 0.5;
        this.colors = [
            '#3483FA', // ML Blue
            '#FFE600', // ML Yellow
            '#7A1DEA', // ML Violet
            '#39B54A', // Success Green
            '#F19F4D', // Warning Orange
            '#F44336', // Danger Red
        ];
        this.animationId = null;
        
        this.initialize();
    }
    
    initialize() {
        // Set canvas to full window size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    start() {
        // Create initial particles
        this.createParticles(this.particleCount);
        
        // Start animation loop
        this.animate();
    }
    
    stop() {
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear particles
        this.particles = [];
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    createParticles(count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,  // Random x position
                y: Math.random() * -this.canvas.height, // Start above the canvas
                size: Math.random() * 10 + 5,          // Random size between 5-15
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                speed: Math.random() * 3 + 2,          // Random speed between 2-5
                angle: Math.random() * Math.PI * 2,    // Random angle
                rotation: Math.random() * 0.2 - 0.1,   // Random rotation
                rotationSpeed: Math.random() * 0.01 - 0.005, // Random rotation speed
                opacity: 1
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw and update each particle
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            // Draw particle
            this.drawParticle(particle);
            
            // Update particle position
            particle.x += Math.cos(particle.angle) * particle.speed;
            particle.y += Math.sin(particle.angle) * particle.speed + this.gravity;
            
            // Update particle rotation
            particle.rotation += particle.rotationSpeed;
            
            // Update particle speed and angle
            particle.speed *= 0.99;
            particle.angle += particle.rotation;
            
            // Fade out particles as they approach the bottom
            if (particle.y > this.canvas.height * 0.8) {
                particle.opacity = (this.canvas.height - particle.y) / (this.canvas.height * 0.2);
            }
            
            // Remove particles that have gone off-screen or faded out
            if (particle.y > this.canvas.height || particle.opacity <= 0) {
                // Replace with a new particle
                this.particles[i] = {
                    x: Math.random() * this.canvas.width,
                    y: -10, // Just above the top of canvas
                    size: Math.random() * 10 + 5,
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    speed: Math.random() * 3 + 2,
                    angle: Math.random() * Math.PI * 2,
                    rotation: Math.random() * 0.2 - 0.1,
                    rotationSpeed: Math.random() * 0.01 - 0.005,
                    opacity: 1
                };
            }
        }
        
        // Continue animation loop
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        this.ctx.globalAlpha = particle.opacity;
        this.ctx.fillStyle = particle.color;
        
        // Draw a rectangle for confetti piece
        this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size / 2);
        
        this.ctx.restore();
    }
}

// Create confetti instance
const confetti = new ConfettiEffect();

// Public functions
function startConfetti() {
    confetti.canvas.classList.remove('hide');
    confetti.start();
}

function stopConfetti() {
    confetti.stop();
    confetti.canvas.classList.add('hide');
}