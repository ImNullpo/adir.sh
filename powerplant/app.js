/**
 * CHERNOBYL TERMINAL - ASCII ENGINE
 */

class AsciiRenderer {
    constructor(elementId) {
        this.el = document.getElementById(elementId);
        this.cols = 0;
        this.rows = 0;
        this.buffer = [];
        this.width = 0;
        this.height = 0;
        this.charWidth = 0;
        this.charHeight = 0;
    }

    async init() {
        // Wait for fonts to ensure accurate measurement
        await document.fonts.ready;

        // Measure and initial resize
        this.measureChar();
        this.resize();

        // Listen for window resize
        window.addEventListener('resize', () => this.resize());
    }

    measureChar() {
        const span = document.createElement('span');
        span.textContent = 'X';
        span.style.position = 'absolute';
        span.style.visibility = 'hidden';
        span.style.whiteSpace = 'pre'; // Force no wrap
        this.el.appendChild(span);

        const rect = span.getBoundingClientRect();
        this.charWidth = rect.width;
        this.charHeight = rect.height;

        this.el.removeChild(span);

        if (this.charWidth === 0 || this.charHeight === 0) {
            console.error("Failed to measure character size. Using defaults.");
            this.charWidth = 8.4; // Approx for monospace 14px
            this.charHeight = 14;
        }
    }

    resize() {
        // Get container dimensions
        const rect = this.el.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;

        // Calculate grid dimensions
        // Subtract a small buffer to prevent scrollbars
        this.cols = Math.floor((this.width - 4) / this.charWidth);
        this.rows = Math.floor((this.height - 4) / this.charHeight);

        if (this.cols <= 0) this.cols = 1;
        if (this.rows <= 0) this.rows = 1;

        this.initBuffer();
    }

    initBuffer() {
        this.buffer = new Array(this.cols * this.rows).fill(' ');
    }

    clear() {
        // Efficient clearing
        const len = this.buffer.length;
        // Check if buffer size changed
        if (len !== this.cols * this.rows) {
            this.initBuffer();
        } else {
            for (let i = 0; i < len; i++) this.buffer[i] = ' ';
        }
    }

    draw(x, y, char) {
        // Round coordinates to be safe
        const ix = Math.floor(x);
        const iy = Math.floor(y);

        if (ix >= 0 && ix < this.cols && iy >= 0 && iy < this.rows) {
            this.buffer[iy * this.cols + ix] = char;
        }
    }

    drawText(x, y, text) {
        const chars = text.split('');
        for (let i = 0; i < chars.length; i++) {
            this.draw(x + i, y, chars[i]);
        }
    }

    render() {
        let output = '';
        // Optimized string building
        for (let y = 0; y < this.rows; y++) {
            const start = y * this.cols;
            const end = start + this.cols;
            // Join the slice
            output += this.buffer.slice(start, end).join('') + '\n';
        }
        // Direct assignment
        this.el.textContent = output;
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.2) * 0.5;
        this.vy = -(Math.random() * 0.4 + 0.1);
        this.life = 1.0;
        this.decay = Math.random() * 0.008 + 0.004;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx += 0.002; // Gentle wind to right
        this.life -= this.decay;
    }

    getChar() {
        if (this.life > 0.8) return '▓';
        if (this.life > 0.6) return '▒';
        if (this.life > 0.4) return '░';
        if (this.life > 0.2) return '.';
        return ' ';
    }
}

class Scene {
    constructor(renderer) {
        this.renderer = renderer;
        this.particles = [];
        this.frameCount = 0;
        this.lastTime = 0;
        this.fpsBox = document.createElement('div');
    }

    start() {
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        const delta = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.frameCount++;

        this.update();
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update() {
        // Spawn particles
        // Logic moved to draw phase for sync
    }

    draw() {
        this.renderer.clear();

        // Safety check
        if (this.renderer.cols < 10 || this.renderer.rows < 10) {
            this.renderer.drawText(0, 0, "TERMINAL OFFLINE / RESIZE WINDOW");
            this.renderer.render();
            return;
        }

        const { cols, rows } = this.renderer;
        const horizon = Math.floor(rows * 0.65); // Lower horizon for better view

        // 1. Draw Road & Ground
        this.drawFunctions_Ground(horizon);

        // 2. Draw Plant
        this.drawFunctions_Plant(horizon);

        // 3. Draw Particles
        this.handleParticles();

        // 4. Render Final
        this.renderer.render();
    }

    drawFunctions_Ground(horizon) {
        const { cols, rows } = this.renderer;

        // Fill Ground
        for (let y = horizon; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                // Dithering pattern based on coordinates
                const dither = (x + y * 2 + this.frameCount) % 17;
                let char = ' ';
                if (y === horizon) char = '_';
                else if (dither < 2) char = ' ';
                else if (dither < 5) char = '.';
                else chart = ' '; // mostly empty for "dark" ground look? 
                // Actually user asked for dense ground
                if (Math.random() > 0.95) char = '▒';

                // Let's stick to the user request: Dense characters
                if (y > horizon) {
                    // Solid noise
                    const n = Math.random();
                    if (n > 0.9) char = '▓';
                    else if (n > 0.7) char = '▒';
                    else if (n > 0.6) char = '░';
                }

                this.renderer.draw(x, y, char);
            }
        }

        // Road
        const cx = Math.floor(cols / 2);
        const roadTopW = 2;
        const roadBotW = Math.floor(cols * 0.6);

        for (let y = horizon; y < rows; y++) {
            const progress = (y - horizon) / (rows - horizon);
            const w = roadTopW + (roadBotW - roadTopW) * progress;
            const left = Math.floor(cx - w / 2);
            const right = Math.floor(cx + w / 2);

            this.renderer.draw(left, y, '/');
            this.renderer.draw(right, y, '\\');

            // Road surface
            for (let rx = left + 1; rx < right; rx++) {
                // Moving stripes
                const stripeY = (y - Math.floor(this.frameCount * 0.2)) % 6;
                // Center line
                if (Math.abs(rx - cx) < 1 && stripeY < 3) {
                    this.renderer.draw(rx, y, '|');
                } else {
                    this.renderer.draw(rx, y, (y % 2 === 0) ? '=' : '-');
                }
            }
        }

        // Stop Sign
        // Right side, foreground
        const signX = Math.floor(cx + roadBotW / 2 + 5);
        const signY = rows - 6;

        if (signX < cols - 5) {
            this.renderer.drawText(signX, signY - 2, "  _  ");
            this.renderer.drawText(signX, signY - 1, " / \\ ");
            this.renderer.drawText(signX, signY, " \\_/ ");
            this.renderer.drawText(signX, signY + 1, "  || ");
            this.renderer.drawText(signX, signY + 2, "  || ");
        }
    }

    drawFunctions_Plant(horizon) {
        const { cols } = this.renderer;

        // Plant sits ON horizon
        // Coordinates relative to horizon

        // Main Reactor
        const rX = Math.floor(cols * 0.4);
        const rW = 20;
        const rH = 12;

        // Draw Reactor Box
        for (let py = 0; py < rH; py++) {
            const y = horizon - py;
            for (let px = 0; px < rW; px++) {
                const x = rX - rW / 2 + px;
                let char = '#';
                if (px === 0 || px === rW - 1) char = '|';
                if (py === rH - 1) char = '_';
                this.renderer.draw(x, y, char);
            }
        }

        // Chimney (The iconic stack)
        const chimX = Math.floor(rX - 4);
        const chimH = 18;
        for (let i = 0; i < chimH; i++) {
            let y = horizon - rH - i;
            this.renderer.draw(chimX, y, '|');
            this.renderer.draw(chimX + 1, y, ditherFill(i));
            this.renderer.draw(chimX + 2, y, '|');

            // Emit smoke
            if (i === chimH - 1 && this.frameCount % 4 === 0) {
                this.particles.push(new Particle(chimX + 1, y - 1));
            }
        }

        // Cooling Tower (Hyperbola)
        // To the left
        this.drawHyperbola(Math.floor(cols * 0.20), horizon, 16, 22);

        // To the right
        this.drawHyperbola(Math.floor(cols * 0.75), horizon, 14, 20);
    }

    drawHyperbola(cx, groundY, widthBase, height) {
        // Draw bottom to top
        for (let y = 0; y < height; y++) {
            const screenY = groundY - y;
            const normalizedY = y / height;

            // Curve function: wide base, narrow waist, slight flare top
            // Waist at 0.7
            let w = widthBase * (1.0 - 0.5 * Math.sin(normalizedY * Math.PI * 0.8));
            if (normalizedY > 0.8) w *= 1.1; // flare

            const left = Math.floor(cx - w);
            const right = Math.floor(cx + w);

            this.renderer.draw(left, screenY, '(');
            this.renderer.draw(right, screenY, ')');

            // Texture
            if (y % 2 === 0) {
                for (let i = left + 1; i < right; i += 2) this.renderer.draw(i, screenY, ':');
            }

            // Steam
            if (y === height - 1 && Math.random() > 0.3) {
                this.particles.push(new Particle(cx + (Math.random() - 0.5) * w, screenY - 2));
            }
        }
    }

    handleParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            // Cull if off screen (top) or dead
            if (p.life <= 0 || p.y < -5 || p.x < 0 || p.x > this.renderer.cols) {
                this.particles.splice(i, 1);
            } else {
                this.renderer.draw(p.x, p.y, p.getChar());
            }
        }
    }
}

function ditherFill(i) {
    const chars = ['░', '▒', '▓'];
    return chars[i % 3];
}

// Bootstrap
window.addEventListener('load', async () => {
    const renderer = new AsciiRenderer('viewport');
    await renderer.init();

    const scene = new Scene(renderer);
    scene.start();
});
