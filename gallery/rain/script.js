const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

let width, height;

// Resize canvas to full screen
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- Configuration ---
const fontSize = 16;
// Katakana + Latin + Numerals
const chars = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// "Malicious" strings from a hypothetical security scanner
const threats = [
    "TROJAN.WIN32.GEN",
    "RANSOMWARE.DETECTED",
    "MALWARE.HEURISTIC",
    "WORM.NETSKY",
    "EXPLOIT.ZERO_DAY",
    "ROOTKIT.ACCESS",
    "VIRUS.NIMDA",
    "SPYWARE.TRACKER",
    "HASH:0x4F2A1C",
    "INFECTED_SECTOR",
    "ACCESS_DENIED",
    "SYSTEM_CRITICAL"
];

let columns = 0;
let drops = [];        // current y position of the drop (in grid units)
let dropState = [];    // 'normal' or index of threat string in threats array
let dropCharIndex = []; // current char index for the threat string

function initDrops() {
    columns = Math.floor(width / fontSize);
    drops = [];
    dropState = [];
    dropCharIndex = [];

    for (let x = 0; x < columns; x++) {
        drops[x] = Math.random() * -100; // Start above screen randomly
        dropState[x] = -1; // -1 means normal green rain
        dropCharIndex[x] = 0;
    }
}
initDrops();
// Re-init drops on resize to avoid array bounds issues
window.addEventListener('resize', initDrops);

function draw() {
    // Semi-transparent black background to create trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const isInfected = dropState[i] !== -1;

        // Pick character and color
        let text = '';
        if (isInfected) {
            ctx.fillStyle = '#ff0000'; // Red for threats
            const threatString = threats[dropState[i]];
            // Cycle through the threat string based on y position
            // We use dropCharIndex to track, or just mod by string length
            // Using logic: text = threatString[charIndex % length]
            // We want the string to "fall" intact or just spell it out?
            // "Vertical streams" means letters fall.
            // Let's just pick the next char in the string for this specific drop frame?
            // Actually, drops[i] increments.
            // Let's use Math.floor(drops[i]) as the index.
            const charIdx = Math.floor(drops[i]) % threatString.length;
            // Handle negative indices if drops start above 0
            const cleanIdx = charIdx < 0 ? 0 : charIdx;
            text = threatString[cleanIdx];
        } else {
            ctx.fillStyle = '#0F0'; // Green for normal
            // Occasional white flicker for "lead" character effect?
            // Let's just stick to classic green for simplicity unless...
            // "Different speeds" - handled by random reset probability? No, standard alg is constant speed per frame usually.
            // To do different speeds we'd need a speed array. Let's add that for extra polish.
            text = chars.charAt(Math.floor(Math.random() * chars.length));
        }

        ctx.fillText(text, x, y);

        // Reset drop to top randomly or if off screen
        if (y > height && Math.random() > 0.975) {
            drops[i] = 0;

            // Randomly decide if this new stream is "infected"
            // 5% chance to be a threat
            if (Math.random() < 0.05) {
                dropState[i] = Math.floor(Math.random() * threats.length);
            } else {
                dropState[i] = -1; // Normal
            }
        }

        // Increment y
        // Add speed variation? For now fixed speed is classic.
        drops[i]++;
    }
}

// Optimization: 30-60FPS. Matrix usually looks good at ~30FPS (classic look is slightly stuttery) or smooth 60.
// Let's do setInterval for control or requestAnimationFrame
setInterval(draw, 33); // ~30 FPS

