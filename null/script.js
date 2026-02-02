const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height, centerX, centerY;
let particles = [];
const blackHoleRadius = 50;
const spawnRate = 4; // Increased spawn rate for density

// Configuration
const colors = ['#ffffff', '#eeeeee', '#cccccc', '#aaaaaa'];
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

// Wake Lock
let wakeLock = null;
const requestWakeLock = async () => {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock active');
        wakeLock.addEventListener('release', () => {
            console.log('Wake Lock released');
        });
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
};

document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
    }
});

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        // Spawn at random edge
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

        if (edge === 0) { // Top
            this.x = Math.random() * width;
            this.y = -20;
        } else if (edge === 1) { // Right
            this.x = width + 20;
            this.y = Math.random() * height;
        } else if (edge === 2) { // Bottom
            this.x = Math.random() * width;
            this.y = height + 20;
        } else { // Left
            this.x = -20;
            this.y = Math.random() * height;
        }

        this.char = chars[Math.floor(Math.random() * chars.length)];
        this.size = Math.random() * 8 + 8; // Slightly smaller for more chaos

        // Initial velocity towards center but with some randomness
        let dx = centerX - this.x;
        let dy = centerY - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        // REDUCED initial tangential velocity to prevent wide orbits
        const angle = Math.atan2(dy, dx);
        const speed = Math.random() * 2.5 + 1.0; // Increased initial speed slightly

        // Aim more directly at center (reduced offset)
        const angleOffset = (Math.random() - 0.5) * 0.5; // Reduced from 1.0 to 0.5

        this.vx = Math.cos(angle + angleOffset) * speed;
        this.vy = Math.sin(angle + angleOffset) * speed;

        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.age = 0;
    }

    update() {
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // Gravity Force
        // INCREASED gravity force significantly to pull them in
        const force = 2000 / (distSq + 100);  // Increased from 800
        const accelX = (dx / dist) * force;
        const accelY = (dy / dist) * force;

        this.vx += accelX;
        this.vy += accelY;

        // "Swirl" or Tangential force 
        // REDUCED artificial spin significantly to stop the "eye" formation
        const tangentX = -dy / dist;
        const tangentY = dx / dist;

        // Very subtle spin now
        const spin = 0.01; // Reduced from 0.05
        this.vx += tangentX * spin;
        this.vy += tangentY * spin;

        // Reduced friction to let them accelerate faster
        this.vx *= 0.995;
        this.vy *= 0.995;

        this.x += this.vx;
        this.y += this.vy;

        this.age++;

        // Event Horizon Collision
        if (dist < blackHoleRadius) {
            this.reset();
        }
    }

    draw() {
        // Opacity based on distance? Or age?
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px monospace`;
        ctx.fillText(this.char, this.x, this.y);
    }
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    centerX = width / 2;
    centerY = height / 2;
}

function init() {
    resize();
    window.addEventListener('resize', resize);
    requestWakeLock();
    loop();
}

function loop() {
    // Trail effect - slightly more transparent for longer trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);

    // Draw Black hole Core
    ctx.beginPath();
    ctx.arc(centerX, centerY, blackHoleRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();

    // Accretion Disk / Glow
    // Use multiple shadows/gradients to simulate the glow
    ctx.shadowBlur = 40;
    ctx.shadowColor = 'white';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke(); // Stroke the edge

    ctx.shadowBlur = 0; // Reset for particles

    // Inner "Photon Ring" (optional decorative ring)
    ctx.beginPath();
    ctx.arc(centerX, centerY, blackHoleRadius * 1.2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();


    // Spawn new particles
    for (let i = 0; i < spawnRate; i++) {
        particles.push(new Particle());
    }

    // Update and draw
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();

        // Remove way off screen particles to save memory
        if (p.x < -100 || p.x > width + 100 || p.y < -100 || p.y > height + 100) {
            particles.splice(i, 1);
        }
    }

    // Performance optimization
    if (particles.length > 800) {
        particles.splice(0, particles.length - 800);
    }

    requestAnimationFrame(loop);
}

init();
