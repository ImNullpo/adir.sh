document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const terminalToggle = document.getElementById('terminal-toggle');
    const terminalOverlay = document.getElementById('terminal-overlay');
    const closeTerminalBtn = document.querySelector('.close-terminal');

    const pagesToggle = document.getElementById('pages-toggle');
    const pagesMenu = document.getElementById('pages-menu');

    const cboxToggle = document.getElementById('cbox-toggle');
    const cboxWidget = document.getElementById('cbox-container');

    // Toggle Cbox Minimize
    cboxToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        cboxWidget.classList.toggle('minimized');
    });

    document.querySelector('.cbox-header').addEventListener('click', () => {
        cboxWidget.classList.toggle('minimized');
    });

    // --- Terminal Toggle Button Logic (Easter Egg) ---
    // 1 click: Toggle Cbox Visibility (Delayed check)
    // 10 clicks: Open Terminal Overlay (Immediate check)
    let terminalClickCount = 0;
    let clickTimer; // Timer for resetting count
    let toggleTimer; // Timer for executing the toggle (debounce)

    terminalToggle.addEventListener('click', (e) => {
        e.preventDefault();

        terminalClickCount++;

        // Reset count if too much time passes
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
            terminalClickCount = 0;
        }, 3000);

        // Clear any pending single-click toggle
        clearTimeout(toggleTimer);

        if (terminalClickCount >= 10) {
            // Easter Egg Triggered
            terminalOverlay.classList.remove('hidden');
            terminalClickCount = 0;
            console.log("[ SYSTEM ] ACCESS GRANTED: TERMINAL");
        } else {
            // Wait briefly to see if this is a spam-click sequence
            toggleTimer = setTimeout(() => {
                // If we haven't reached 10 clicks yet, and no new clicks came in 200ms
                if (terminalClickCount < 10) {
                    cboxWidget.classList.toggle('hidden');
                }
            }, 250);
        }
    });

    // Close Terminal
    closeTerminalBtn.addEventListener('click', () => {
        terminalOverlay.classList.add('hidden');
    });

    // Toggle Pages Menu
    pagesToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        pagesMenu.classList.toggle('hidden');
    });

    // Close Pages Menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!pagesMenu.contains(e.target) && !pagesToggle.contains(e.target)) {
            pagesMenu.classList.add('hidden');
        }
    });

    console.log("[ SYSTEM ] HUD Initialized.");
});
