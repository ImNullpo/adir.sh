const container = document.getElementById('ascii-ocean');

// Configuration
const config = {
    waveSpeed: 0.05,   // How fast the waves undulate
    waveHeight: 5,     // Amplitude of the wave (in rows)
    bubbleChance: 0.02, // Chance of a bubble appearing in the static map
    OCEAN_CHARS: " :~=coCO?" // New gradient chars from donut
};

// Global State
let cols = 0;
let rows = 0;
let fishes = [];
let crabs = [];

// Fish Sprites (facing right and left)
const fishSprites = {
    right: ["><>", "><(('>", "><>"],
    left: ["<><", "<'))><", "<><"]
};

// Colors for fish
const fishColors = [
    "#FF5733", // Red-Orange
    "#FFC300", // Yellow
    "#DAF7A6", // Light Green
    "#FF33FF", // Pink
    "#33FFF9", // Cyan
    "#FFFFFF"  // White
];

// Initialize dimensions based on screen size
function resize() {
    cols = Math.floor(container.clientWidth / 9); // approximate char width
    rows = Math.floor(container.clientHeight / 14); // approximate char height

    // Spawn some fish initially if empty
    if (fishes.length === 0) spawnFish(5);

    // Spawn crabs if none exist
    if (crabs.length === 0) spawnCrabs(3);
}

// Fish Class
class Fish {
    constructor() {
        this.x = Math.floor(Math.random() * cols);
        // Spawn strictly below max wave depth (0.175)
        // Water starts around 0.1, max depth ~0.18. Using 0.25 for safety.
        this.y = Math.floor(Math.random() * (rows * 0.7)) + (rows * 0.25);
        this.speed = (Math.random() * 0.1) + 0.05;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.type = Math.floor(Math.random() * fishSprites.right.length);
        this.color = fishColors[Math.floor(Math.random() * fishColors.length)];
    }

    update() {
        this.x += this.speed * this.direction;

        // Wrap around screen
        if (this.direction === 1 && this.x > cols) this.x = -5;
        if (this.direction === -1 && this.x < -5) this.x = cols;
    }
}

// Crab Class
class Crab {
    constructor() {
        this.x = Math.floor(Math.random() * cols);
        // Walk on the very bottom
        this.y = rows - 1;
        this.speed = (Math.random() * 0.03) + 0.02; // Very slow
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.sprite = "(\\/)!_!(\\/)"; // Simple crab ascii
        this.color = "#FF8800"; // Orange
        // Timer for random direction changes
        this.changeDirTimer = 0;
    }

    update() {
        this.x += this.speed * this.direction;

        // Randomly change direction occasionally
        this.changeDirTimer++;
        if (this.changeDirTimer > 200 && Math.random() < 0.01) {
            this.direction *= -1;
            this.changeDirTimer = 0;
        }

        if (this.x > cols) this.x = -5;
        if (this.x < -5) this.x = cols;
    }
}

function spawnFish(count) {
    for (let i = 0; i < count; i++) fishes.push(new Fish());
}

function spawnCrabs(count) {
    for (let i = 0; i < count; i++) crabs.push(new Crab());
}

// The Core Render Loop
function draw() {
    let now = Date.now() / 1000;

    // 1. Create a fresh grid for this frame
    let grid = [];

    // 2. Generate Waves Dynamic Simulation (Donut style)
    for (let y = 0; y < rows; y++) {
        grid[y] = new Array(cols);
        for (let x = 0; x < cols; x++) {
            // Normalize X and Y to 0-1 range
            const u = x / cols;
            const v = y / rows;

            // Calculate Surface Height at this X
            // 0.1 is center (10% from top), so significantly higher.
            const waveHeight = 0.1 + 0.05 * Math.sin((u * 10) + (now * 2))
                + 0.025 * Math.sin((u * 25) - (now * 4));

            // Determine character
            if (v > waveHeight) {
                // Underwater
                const depth = (v - waveHeight) / (1 - waveHeight);
                const charIndex = Math.floor(depth * (config.OCEAN_CHARS.length - 1));

                // Add sparkle/foam randomly
                if (depth < 0.05 && Math.random() > 0.95) {
                    grid[y][x] = ".";
                } else {
                    grid[y][x] = config.OCEAN_CHARS[Math.min(charIndex, config.OCEAN_CHARS.length - 1)];
                }
            } else {
                // Sky
                grid[y][x] = " ";
            }
        }
    }

    // Helper to safely write to grid with checks
    const writeToGrid = (x, y, char, color) => {
        if (y >= 0 && y < rows && x >= 0 && x < cols) {
            // Keep the grid clean, handle colors via span only if needed
            // But here we are overwriting the background
            if (color) {
                grid[y][x] = `<span style="color:${color}">${char}</span>`;
            } else {
                grid[y][x] = char;
            }
        }
    };

    // 3. Draw Fish
    fishes.forEach(fish => {
        fish.update();
        let sprite = fish.direction === 1
            ? fishSprites.right[fish.type]
            : fishSprites.left[fish.type];
        let renderX = Math.floor(fish.x);
        let renderY = Math.floor(fish.y);

        // Render fish, but strictly check against wave height for clipping
        for (let i = 0; i < sprite.length; i++) {
            let px = renderX + i;
            let py = renderY;

            // Re-calculate wave height for this specific pixel column
            // 0.1 is base, 0.05 + 0.025 amplitude
            let u = px / cols;
            let h = 0.1 + 0.05 * Math.sin((u * 10) + (now * 2)) + 0.025 * Math.sin((u * 25) - (now * 4));
            let v = py / rows;

            // Only draw if strictly underwater (v > h)
            if (v > h) {
                writeToGrid(px, py, sprite[i], fish.color);
            }
        }
    });

    // 4. Draw Crabs
    crabs.forEach(crab => {
        crab.update();
        // Keep crab pinned to bottom row even if resize happened
        crab.y = rows - 1;

        let renderX = Math.floor(crab.x);
        let renderY = Math.floor(crab.y);

        for (let i = 0; i < crab.sprite.length; i++) {
            writeToGrid(renderX + i, renderY, crab.sprite[i], crab.color);
        }
    });

    // 5. Convert Grid to String and Render
    let lines = grid.map(row => row.join(""));
    let output = lines.join("\n");

    container.innerHTML = output;

    requestAnimationFrame(draw);
}

// Start
window.addEventListener('resize', resize);
setTimeout(() => {
    resize();
    requestAnimationFrame(draw);
}, 100);
