document.addEventListener('DOMContentLoaded', () => {
    // Subtle typing effect for the notice text
    const noticeTextEl = document.getElementById('notice-text');
    if (noticeTextEl) {
        const originalText = noticeTextEl.textContent;
        noticeTextEl.textContent = '';

        let i = 0;
        const typeWriter = () => {
            if (i < originalText.length) {
                noticeTextEl.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 50); // Speed of typing
            } else {
                // Add blinking cursor at the end
                setInterval(() => {
                    if (noticeTextEl.textContent.endsWith('_')) {
                        noticeTextEl.textContent = noticeTextEl.textContent.slice(0, -1);
                    } else {
                        noticeTextEl.textContent += '_';
                    }
                }, 500);
            }
        };

        // Start typing effect after a short delay
        setTimeout(typeWriter, 500);
    }

    // =====================================
    // Glitching Title Effect
    // =====================================
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const glitchTitleLength = 20;

    setInterval(() => {
        let glitchedTitle = '';
        for (let j = 0; j < glitchTitleLength; j++) {
            glitchedTitle += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        document.title = glitchedTitle;
    }, 50); // Change rapidly every 50ms
});
