// --- CONFIGURATION ---
const FPS = 60;
const CANVAS_WIDTH_PCT = 0.95; // Use 95% of viewport width for ocean
const OCEAN_CHARS = " :~=coCO?"; // Characters for wave height/intensity

// --- GLOBAL STATE ---
let time = 0;

// Nodes
const oceanPre = document.getElementById('ocean-display');
const donutPre = document.getElementById('donut-display');

// --- THE ASCII OCEAN ENGINE ---
class Ocean {
    constructor() {
        this.cols = 0;
        this.rows = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        // Calculate rough grid size based on font size (approx 8.4px width, 14px height)
        const rect = document.getElementById('main-viewport').getBoundingClientRect();
        this.cols = Math.floor(rect.width / 9); // approximate char width
        this.rows = Math.floor(rect.height / 14); // approximate char height
    }

    render(t) {
        let frame = "";

        // Loop through rows and columns
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                // Wave Math: Multiple Sine waves for complexity
                // Normalize X and Y to 0-1 range for math
                const u = x / this.cols;
                const v = y / this.rows;

                // Calculate Surface Height at this X
                // Base wave + secondary faster wave
                const waveHeight = 0.5 + 0.2 * Math.sin((u * 10) + (t * 2))
                    + 0.1 * Math.sin((u * 25) - (t * 4));

                // Determine character
                // If y (normalized v) is greater than waveHeight, it's underwater
                if (v > waveHeight) {
                    // Depth gradient: deeper = denser char
                    const depth = (v - waveHeight) / (1 - waveHeight); // 0 at surface, 1 at bottom
                    const charIndex = Math.floor(depth * (OCEAN_CHARS.length - 1));
                    // Add some random noise for "sparkle" or "foam"
                    if (depth < 0.05 && Math.random() > 0.95) {
                        frame += ".";
                    } else {
                        frame += OCEAN_CHARS[Math.min(charIndex, OCEAN_CHARS.length - 1)];
                    }
                } else {
                    // Sky / Empty space
                    frame += " ";
                }
            }
            frame += "\n";
        }

        oceanPre.innerText = frame;
    }
}

// --- THE SPINNING DONUT ENGINE ---
class Donut {
    constructor() {
        this.A = 0;
        this.B = 0;
    }

    render() {
        const width = 45; // Fixed size for widget
        const height = 28;

        let b = []; // buffer
        let z = []; // z-buffer

        // Initialize buffers
        for (let i = 0; i < width * height; i++) {
            b[i] = " ";
            z[i] = 0;
        }

        // Increment rotation angles
        this.A += 0.07;
        this.B += 0.03;

        const cA = Math.cos(this.A), sA = Math.sin(this.A);
        const cB = Math.cos(this.B), sB = Math.sin(this.B);

        // Theta (cross-section circle)
        for (let j = 0; j < 6.28; j += 0.07) {
            const ct = Math.cos(j), st = Math.sin(j);

            // Phi (center of rotation)
            for (let i = 0; i < 6.28; i += 0.02) {
                const sp = Math.sin(i), cp = Math.cos(i);

                const h = ct + 2; // R2 + R1*cos(theta)
                const D = 1 / (sp * h * sA + st * cA + 5); // 1/z
                const t = sp * h * cA - st * sA;

                // Projected coordinates
                const x = 0 | (width / 2 + 20 * D * (cp * h * cB - t * sB));
                const y = 0 | (height / 2 + 12 * D * (cp * h * sB + t * cB));

                const o = x + width * y;

                // Luminance index
                const N = 0 | (8 * ((st * sA - sp * ct * cA) * cB - sp * ct * sA - st * cA - cp * ct * sB));

                if (y >= 0 && y < height && x >= 0 && x < width && D > z[o]) {
                    z[o] = D;
                    b[o] = ".,-~:;=!*#$@"[N > 0 ? N : 0];
                }
            }
        }

        // Build string
        let output = "";
        for (let k = 0; k < b.length; k++) {
            // Add newline at end of each row
            output += (k % width === width - 1) ? "\n" : b[k];
        }

        donutPre.innerText = output;
    }
}

// --- MAIN LOOP ---
const ocean = new Ocean();
const donut = new Donut();

function loop() {
    let now = Date.now() / 1000;

    ocean.render(now);
    donut.render();

    requestAnimationFrame(loop);
}

// Start
loop();
