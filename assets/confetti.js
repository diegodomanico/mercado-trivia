// Confetti animation for celebration
const confetti = {
    maxParticles: 150,
    gravity: 1,
    particles: [],
    colors: [
        '#3483FA', // Blue - Mercado Libre color
        '#FFE600', // Yellow - Mercado Libre color
        '#36A1FF', // Light blue
        '#00A650', // Green
        '#FF7733', // Orange
        '#FF2D55'  // Pink
    ],
    shapes: ['circle', 'square', 'triangle', 'line'],
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    animationId: null,
    active: false,
    
    initialize() {
        this.canvas = document.getElementById('confetti-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Add event listener for window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    },
    
    resizeCanvas() {
        if (!this.canvas) return;
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    },
    
    start() {
        if (!this.canvas || !this.ctx) this.initialize();
        if (!this.canvas) return;
        
        this.active = true;
        this.createParticles(this.maxParticles);
        
        // Cancel any existing animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Start the animation
        this.animate();
    },
    
    stop() {
        this.active = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear the canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
        
        // Clear the particles array
        this.particles = [];
    },
    
    createParticles(count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height - this.height,
                size: Math.random() * 10 + 5,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                shape: this.shapes[Math.floor(Math.random() * this.shapes.length)],
                speedX: Math.random() * 6 - 3,
                speedY: Math.random() * 2 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 4 - 2,
                opacity: 1
            });
        }
    },
    
    animate() {
        if (!this.active) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Update and draw particles
        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.speedY += this.gravity * 0.1;
            particle.rotation += particle.rotationSpeed;
            
            // Draw the particle
            this.drawParticle(particle);
            
            // Remove particles that are out of bounds
            if (particle.y > this.height + 100) {
                // Create a new particle at the top
                if (this.active) {
                    this.particles[index] = {
                        x: Math.random() * this.width,
                        y: -20,
                        size: Math.random() * 10 + 5,
                        color: this.colors[Math.floor(Math.random() * this.colors.length)],
                        shape: this.shapes[Math.floor(Math.random() * this.shapes.length)],
                        speedX: Math.random() * 6 - 3,
                        speedY: Math.random() * 2 + 2,
                        rotation: Math.random() * 360,
                        rotationSpeed: Math.random() * 4 - 2,
                        opacity: 1
                    };
                }
            }
        });
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    },
    
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation * Math.PI / 180);
        this.ctx.fillStyle = particle.color;
        this.ctx.globalAlpha = particle.opacity;
        
        switch (particle.shape) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2, true);
                this.ctx.fill();
                break;
                
            case 'square':
                this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                break;
                
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -particle.size / 2);
                this.ctx.lineTo(particle.size / 2, particle.size / 2);
                this.ctx.lineTo(-particle.size / 2, particle.size / 2);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'line':
                this.ctx.lineWidth = particle.size / 5;
                this.ctx.strokeStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -particle.size);
                this.ctx.lineTo(0, particle.size);
                this.ctx.stroke();
                break;
        }
        
        this.ctx.restore();
    }
};

// Initialize confetti when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    confetti.initialize();
});

// Function to start confetti animation
function startConfetti() {
    confetti.start();
    
    // Stop confetti after 15 seconds
    setTimeout(() => {
        confetti.stop();
    }, 15000);
}

// Function to stop confetti animation
function stopConfetti() {
    confetti.stop();
}