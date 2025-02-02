(() => {
    const pre    = document.getElementById('ascii-canvas');
    const bgCanvas = document.getElementById('stars-bg');
    const bgCtx    = bgCanvas.getContext('2d');

    /* ══════════════════════════════════════════════════════
       FULL-SCREEN STARFIELD  (drawn on <canvas>)
       ══════════════════════════════════════════════════════ */
    let bgStars = [];
    const BG_STAR_COUNT = 260;

    function initBgStars() {
        const w = bgCanvas.width, h = bgCanvas.height;
        bgStars = Array.from({ length: BG_STAR_COUNT }, () => ({
            x:     Math.random() * w,
            y:     Math.random() * h,
            r:     0.4 + Math.random() * 1.4,          // radius
            base:  0.3 + Math.random() * 0.7,          // base brightness
            speed: 0.8 + Math.random() * 2.5,          // twinkle speed
            phase: Math.random() * Math.PI * 2
        }));
    }

    function resizeBgCanvas() {
        const dpr = window.devicePixelRatio || 1;
        bgCanvas.width  = window.innerWidth  * dpr;
        bgCanvas.height = window.innerHeight * dpr;
        bgCanvas.style.width  = window.innerWidth  + 'px';
        bgCanvas.style.height = window.innerHeight + 'px';
        bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initBgStars();
    }

    function drawBgStars(time) {
        const w = window.innerWidth, h = window.innerHeight;
        bgCtx.clearRect(0, 0, w, h);

        for (const s of bgStars) {
            const flicker = s.base + (1 - s.base) * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase));
            const alpha   = Math.max(0, Math.min(1, flicker));
            bgCtx.beginPath();
            bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            bgCtx.fillStyle = `rgba(210, 220, 255, ${alpha.toFixed(2)})`;
            bgCtx.fill();
        }
    }

    /* ══════════════════════════════════════════════════════
       ASCII SATURN RENDERER
       ══════════════════════════════════════════════════════ */
    let W, H, CX, CY, A;
    let R, RI, RO, SB, CB, L;
    let scale;
    const IDEAL_W = 140, IDEAL_H = 48;

    const RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
    const NR   = RAMP.length;

    let particles = [];
    let t = 0;
    let running = false;

    /* ── Resize / init ───────────────────────────────────── */
    function resize() {
        /* --- background stars --- */
        resizeBgCanvas();

        /* --- ASCII grid --- */
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let fontSize = 12;
        if (vw < 500)       fontSize = 6;
        else if (vw < 800)  fontSize = 8;
        else if (vw < 1100) fontSize = 10;

        pre.style.fontSize   = fontSize + 'px';
        pre.style.lineHeight = fontSize + 'px';
        pre.style.letterSpacing = (fontSize <= 8 ? '0px' : '0.5px');

        const probe = document.createElement('span');
        probe.style.font       = getComputedStyle(pre).font;
        probe.style.position   = 'absolute';
        probe.style.visibility = 'hidden';
        probe.style.whiteSpace = 'pre';
        probe.textContent      = 'M';
        document.body.appendChild(probe);
        const charW = probe.getBoundingClientRect().width;
        const charH = fontSize;
        document.body.removeChild(probe);

        W  = Math.min(IDEAL_W, Math.floor((vw * 0.96) / charW));
        H  = Math.min(IDEAL_H, Math.floor((vh * 0.94) / charH));
        CX = W / 2;
        CY = H / 2;
        A  = charH / charW;

        scale = Math.min(W / IDEAL_W, H / IDEAL_H);
        R  = 10   * scale;
        RI = 11.5 * scale;
        RO = 25.3 * scale;
        SB = 0.27;
        CB = Math.sqrt(1 - SB * SB);

        const lRaw = [0.35, 0.50, 0.78];
        const lMag = Math.hypot(...lRaw);
        L = lRaw.map(v => v / lMag);

        const numPart = Math.max(8, Math.round(18 * scale));
        particles = Array.from({ length: numPart }, (_, i) => ({
            a:  (i / numPart) * Math.PI * 2 + Math.random() * 0.5,
            r:  RI + 1.5 * scale + Math.random() * (RO - RI - 3 * scale),
            sp: 0.45 + Math.random() * 0.4,
            ch: 'O*#@'[Math.floor(Math.random() * 4)]
        }));

        if (!running) { running = true; render(); }
    }

    /* ── Helpers ─────────────────────────────────────────── */
    function shade(v) {
        return RAMP[Math.max(0, Math.min(NR - 1, Math.round(v * (NR - 1))))];
    }

    function ringDensity(r) {
        if (r < RI || r > RO) return 0;
        const u   = (r - RI) / (RO - RI);
        const ref = 11.5 + u * (25.3 - 11.5);

        if (ref < 12.5) return 0.10;
        if (ref < 13.0) return 0;
        if (ref < 15.0) return 0.30 + 0.05 * Math.sin((ref - 13) * 3);
        if (ref < 19.4) return 0.75 + 0.25 * Math.sin((ref - 15) * 1.4);
        if (ref < 20.5) return 0;
        if (ref < 24.0) {
            if (ref > 22.7 && ref < 23.1) return 0.03;
            return 0.55 + 0.12 * Math.sin((ref - 20.5) * 2.2);
        }
        if (ref < 24.5) return 0;
        return 0.20;
    }

    function atmBands(lat) {
        return Math.max(0.30, Math.min(1.0,
            0.58 + 0.22 * Math.sin(lat * 7)
                 + 0.12 * Math.sin(lat * 3.5 + 0.4)
                 + 0.06 * Math.sin(lat * 14)));
    }

    /* ── Main render loop ────────────────────────────────── */
    function render() {
        /* --- background stars (full-screen canvas) --- */
        drawBgStars(t * 1.5);

        /* --- ASCII buffer --- */
        const buf = Array.from({ length: H }, () => new Array(W).fill(' '));

        for (let row = 0; row < H; row++) {
            for (let col = 0; col < W; col++) {
                const x = (col - CX) / A;
                const y = CY - row;

                const d2  = x * x + y * y;
                const onP = d2 <= R * R;
                let pZ = 0, pI = 0;

                if (onP) {
                    pZ = Math.sqrt(R * R - d2);
                    const nx = x / R, ny = y / R, nz = pZ / R;
                    let diff = Math.max(0.05, nx * L[0] + ny * L[1] + nz * L[2]);
                    const lat = Math.asin(Math.max(-1, Math.min(1, ny)));
                    pI = diff * atmBands(lat);
                    if (y > 0) {
                        const sr = y / SB;
                        if (ringDensity(sr) > 0.05) pI *= 0.15;
                    }
                }

                const rr  = Math.sqrt(x * x + y * y / (SB * SB));
                const rd  = ringDensity(rr);
                const onR = rd > 0;
                let rZ = 0, rI = 0;

                if (onR) {
                    rZ = -y * CB / SB;
                    let diff = Math.max(0.08, Math.abs(L[1] * CB + L[2] * SB));
                    const theta = Math.atan2(-y / SB, x);
                    const speed = 0.6 + (rr - RI) / (RO - RI) * 0.5;
                    const flow  = theta + t * speed;
                    const tex   = 0.70 + 0.30 * Math.sin(flow * 4);
                    rI = diff * rd * tex;
                    if (rZ < 0) {
                        const px = x - L[0] * rZ / L[2];
                        const py = y - L[1] * rZ / L[2];
                        if (px * px + py * py <= R * R) rI *= 0.08;
                    }
                }

                if (onP && onR) {
                    buf[row][col] = shade(rZ > pZ ? rI : pI);
                } else if (onP) {
                    buf[row][col] = shade(pI);
                } else if (onR) {
                    buf[row][col] = shade(rI);
                }
            }
        }

        for (const p of particles) {
            const ang = p.a + t * p.sp;
            const sc  = Math.round(CX + Math.cos(ang) * p.r * A);
            const sr  = Math.round(CY - Math.sin(ang) * p.r * SB);
            if (sc < 0 || sc >= W || sr < 0 || sr >= H) continue;
            const wx = (sc - CX) / A, wy = CY - sr;
            if (Math.sin(ang) < 0 && wx * wx + wy * wy <= R * R) continue;
            if (ringDensity(p.r) < 0.03) continue;
            buf[sr][sc] = p.ch;
        }

        let out = '';
        for (let i = 0; i < H; i++) out += buf[i].join('') + '\n';
        pre.textContent = out;

        t += 0.02;
        requestAnimationFrame(render);
    }

    /* ── Viewport listeners ──────────────────────────────── */
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });
    window.addEventListener('orientationchange', () => setTimeout(resize, 200));

    resize();
})();
