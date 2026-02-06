document.addEventListener('DOMContentLoaded', () => {
    const fileListContainer = document.getElementById('file-list');
    const libraryTitle = document.querySelector('.scrolling-text');

    // Path to the JSON file
    const JSON_PATH = 'files.json';

    fetch(JSON_PATH)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            renderFiles(data);
            if (libraryTitle) {
                libraryTitle.textContent = `PUBLIC LIBRARY ONLINE ... ${data.length} ITEMS CATALOGED ... READ-ONLY ACCESS`;
            }
        })
        .catch(error => {
            console.error('Error loading library catalog:', error);
            fileListContainer.innerHTML = `
                <div class="file-item error">
                    <span class="file-icon">⚠️</span>
                    <span class="file-name">ERROR_LOADING_CATALOG</span>
                    <span class="file-size">NAN</span>
                    <span class="file-type">ERR</span>
                </div>
            `;
        });

    function renderFiles(files) {
        fileListContainer.innerHTML = ''; // Clear loading message

        if (files.length === 0) {
            fileListContainer.innerHTML = `
                <div class="file-item empty">
                    <span class="file-name" style="color: var(--text-dim)">[ NO DOCUMENTS FOUND ]</span>
                </div>
            `;
            return;
        }

        files.forEach(file => {
            const fileItem = document.createElement('a');
            fileItem.className = 'file-item';

            // Handle links
            if (file.url) {
                fileItem.href = file.url;
                fileItem.target = "_blank"; // Open in new tab
            } else {
                fileItem.href = "#";
            }

            // Icon selection
            let icon = '📄';
            if (file.type === 'DIR') icon = '📁';
            else if (file.type === 'PDF') icon = '📕';
            else if (file.type === 'ZIP' || file.type === 'RAR' || file.type === '7Z') icon = '📦';
            else if (file.type === 'TXT' || file.type === 'MD') icon = '📝';
            else if (file.type === 'JPG' || file.type === 'PNG' || file.type === 'GIF') icon = '🖼️';

            fileItem.innerHTML = `
                <span class="file-icon">${icon}</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${file.size}</span>
                <span class="file-type">${file.type}</span>
            `;

            fileListContainer.appendChild(fileItem);
        });
    }
});
