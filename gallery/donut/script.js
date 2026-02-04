// --- CONFIGURATION ---
const FPS = 60;

// Nodes
const donutPre = document.getElementById('donut-display');

// --- THE SPINNING DONUT ENGINE ---
class Donut {
    constructor() {
        this.A = 0;
        this.B = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        // We want the donut to take up about 75% of the smaller dimension of the screen
        // Font aspect ratio is roughly 0.6 (width/height of a character)
        // Let's rely on fixed font size defined in CSS (12px)
        // or we could dynamically adjust font size, but adjusting grid is easier for resolution.

        // Let's assume font is approx 7px wide and 12px high (Courier New 12px)
        const charW = 7.2;
        const charH = 12;

        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // Grid dimensions (characters)
        this.width = Math.floor(screenW / charW);
        this.height = Math.floor(screenH / charH);

        // Calculate Scale Factor (K1)
        // We want diameter to be 75% of the smaller dimension (in pixels)
        const minDimPixels = Math.min(screenW, screenH);
        const targetDiameterPixels = minDimPixels * 0.75;

        // Donut mathematical radius is roughly (R1 + R2) = 1 + 2 = 3 units in the math model.
        // The detailed math: x = K1 * D * (model_x)
        // Max model_x is roughly 3.
        // So Max projected x (center relative) is K1 * (1/(z_camera + z_donut)) * 3.
        // We usually assume z_camera is fixed (e.g., 5).
        // Let's simplifying:
        // We want the donut to span `targetDiameterPixels` approximately.
        // The scale factor `K1` scales the unit circle to the screen.
        // The formula uses `x = width/2 + K1 * D * ...`
        // Effectively, K1 controls the zoom.
        // D ranges around 1/5.
        // So we want K1 * (1/5) * 3 approx = targetDiameterPixels / 2 (radius)
        // K1 approx = (targetDiameterPixels / 2) * 5 / 3 = targetDiameterPixels * 5 / 6.
        // Let's adjust slightly for aspect ratio corrections.

        // Note: x projection is scaled by 1 (or K1), y projection is scaled by K1 at different aspect.

        // Let's try a heuristic:
        // K1 should be large enough so 3 * K1 * D fills the screen.
        // D is approx 1/(distance + roughly 0), distance is 5.
        // So 3 * K1 / 5 = screen_radius_in_chars * char_width? No, the formula produces integers directly or effectively pixels if we treat grid as pixels?
        // No, standard donut code produces integer GRID COORDINATES.
        // So `x` is an integer index from 0 to `this.width`.

        // We want the donut to cover 75% of `this.height` (since height is usually limiting).
        // Radius in grid units = (this.height * 0.75) / 2.
        const targetRadiusGridY = (this.height * 0.75) / 2;

        // Formula: y = height/2 + K1 * D * ...
        // We need K1 * D_avg * 3 (approx max coordinate) = targetRadiusGridY
        // K1 * (1/5) * 3 = targetRadiusGridY
        // K1 = targetRadiusGridY * 5 / 3

        // However, standard code uses different X and Y scales because characters are not square.
        // K1 typically refers to the X scale. Y scale is K1/2 usually (since chars are 2x higher than wide typically, though 12px/7px is 1.7).

        this.K1 = (targetRadiusGridY * 5 / 3) * 2; // Factor of 2 to compensate for Y component usually being scaled down
        // Actually, let's just stick to a derived scale:
        // If we want it huge, let's make K1 proportional to the min dimension in chars.

        const minDimChars = Math.min(this.width, this.height * 2); // height*2 roughly normalizes aspect
        this.K1 = minDimChars * 25; // heuristic from standard donut (where width=80 -> K1=15ish? No standard is 40 width, K1 is calculate differently).

        // Standard code: K1 = 15 for 40x22 ish?
        // Let's just calculate it:
        // x = 40 + 30 * D * (cp * h * cB - t * sB)
        // 30 is the scale. 40 is center.

        // We want scale to be proportional.
        // Let's use scale = min(width, height) * 0.35 * (some factor).
        // If width = 100, we want scale around 40-50.
        this.scaleX = Math.min(this.width, this.height * (charH / charW)) * 0.35 * 3;
        // 0.35 because diameter is ~3 units? No, let's play safe.
        // If diameter is 3 units, and we want it 3/4 of screen...
        // scale * (1/5) * 3 = (width/2) * 0.75
        // scale = (width * 0.375) * 5 / 3 = width * 0.625.

        this.scaleX = Math.min(this.width, this.height * (charH / charW)) * 0.5; // Conservative start
        this.scaleY = this.scaleX * (charW / charH); // Adjust for character aspect ratio
    }

    render() {
        const width = this.width;
        const height = this.height;

        let b = new Array(width * height).fill(" ");
        let z = new Array(width * height).fill(0);

        // Updated Rotation Speeds (SLOWER)
        // Original: A+=0.07, B+=0.03
        this.A += 0.02; // Roughly 3.5x slower
        this.B += 0.01; // Roughly 3x slower

        const cA = Math.cos(this.A), sA = Math.sin(this.A);
        const cB = Math.cos(this.B), sB = Math.sin(this.B);

        // Theta (cross-section circle)
        for (let j = 0; j < 6.28; j += 0.05) { // Decrease step for higher density if needed
            const ct = Math.cos(j), st = Math.sin(j);

            // Phi (center of rotation)
            for (let i = 0; i < 6.28; i += 0.01) { // Lighter step for density
                const sp = Math.sin(i), cp = Math.cos(i);

                const h = ct + 2; // R2 + R1*cos(theta)
                const D = 1 / (sp * h * sA + st * cA + 5); // 1/z
                const t = sp * h * cA - st * sA;

                // Projected coordinates
                // x = CenterX + ScaleX * D * (RotatedX)
                const x = 0 | (width / 2 + this.scaleX * D * (cp * h * cB - t * sB));
                // y = CenterY + ScaleY * D * (RotatedY)
                const y = 0 | (height / 2 + this.scaleY * D * (cp * h * sB + t * cB));

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
        // Optimization: Use a single join is often faster or cleaner
        let output = "";
        for (let y = 0; y < height; y++) {
            // Slice the row from the buffer
            const row = b.slice(y * width, (y + 1) * width).join("");
            // In some implementations, we might need a newline char, but if using pre and fixed width, we usually do.
            output += row + "\n";
        }

        donutPre.innerText = output;
    }
}

// --- MAIN LOOP ---
const donut = new Donut();

function loop() {
    donut.render();
    requestAnimationFrame(loop);
}

// Start
loop();
