document.addEventListener('DOMContentLoaded', () => {
    // --- HUD Logic (Copied from main script) ---
    const pagesToggle = document.getElementById('pages-toggle');
    const pagesMenu = document.getElementById('pages-menu');

    // Toggle Pages Menu
    if (pagesToggle) {
        pagesToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            pagesMenu.classList.toggle('hidden');
        });
    }

    // Close Pages Menu when clicking outside
    document.addEventListener('click', (e) => {
        if (pagesMenu && !pagesMenu.contains(e.target) && pagesToggle && !pagesToggle.contains(e.target)) {
            pagesMenu.classList.add('hidden');
        }
    });

    // --- Filesystem Logic ---
    const fileListContainer = document.getElementById('file-list');
    const currentPathSpan = document.querySelector('.current-dir');
    const backButtonHtml = `<div class="file-item back-btn-item" onclick="navigateUp()">
        <div class="file-icon">..</div>
        <div class="file-name">[ UP ONE LEVEL ]</div>
        <div class="file-meta">DIR</div>
        <div class="file-meta">-</div>
        <div class="file-actions"></div>
    </div>`;

    // Emoji mapping for file types
    const fileIcons = {
        'DIR': '📁',
        'TXT': '📄',
        'PDF': '📕',
        'ZIP': '📦',
        'EXE': '💾',
        'JPG': '🖼️',
        'PNG': '🖼️',
        'DEFAULT': '📄'
    };

    let allFiles = []; // Store full tree
    let currentStack = []; // Stack of folders to track history

    function getFileIcon(type) {
        return fileIcons[type] || fileIcons['DEFAULT'];
    }

    window.navigateDown = function (folderName) {
        // Find the folder object in current view
        const currentView = getCurrentView();
        const folder = currentView.find(f => f.name === folderName && f.type === 'DIR');

        if (folder && folder.children) {
            currentStack.push(folder);
            renderFiles(folder.children);
            updatePath();
        }
    };

    window.navigateUp = function () {
        if (currentStack.length > 0) {
            currentStack.pop();
            renderFiles(getCurrentView());
            updatePath();
        }
    };

    function getCurrentView() {
        if (currentStack.length === 0) {
            return allFiles;
        }
        return currentStack[currentStack.length - 1].children;
    }

    function updatePath() {
        let path = "Files";
        if (currentStack.length > 0) {
            path += " / " + currentStack.map(f => f.name).join(" / ");
        }
        if (currentPathSpan) currentPathSpan.innerText = path;
    }

    function renderFiles(files) {
        fileListContainer.innerHTML = '';

        // Add back button if strictly inside a subfolder
        if (currentStack.length > 0) {
            fileListContainer.innerHTML += backButtonHtml;
        }

        if (!files || files.length === 0) {
            fileListContainer.innerHTML += `<div class="file-item" style="justify-content:center; color:#555;">[ EMPTY DIRECTORY ]</div>`;
            return;
        }

        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            // Interaction: Click to open folder
            if (file.type === 'DIR') {
                fileItem.classList.add('is-directory');
                fileItem.onclick = (e) => {
                    // Prevent download button from triggering nav
                    if (!e.target.closest('.action-btn')) {
                        navigateDown(file.name);
                    }
                };
            }

            const icon = getFileIcon(file.type);

            let actionButton = '';
            if (file.type === 'DIR') {
                actionButton = `<button class="action-btn btn-view" onclick="navigateDown('${file.name}')">OPEN</button>`;
            } else {
                // For files: DL and OPEN
                actionButton = `
                    <a href="${file.url}" target="_blank" class="action-btn btn-view">OPEN</a>
                    <a href="${file.url}" class="action-btn btn-download" download>↓ DL</a>
                `;
            }

            // Layout: [Icon] [Name] [Type] [Size] [Actions]
            fileItem.innerHTML = `
                <div class="file-icon">${icon}</div>
                <div class="file-name">${file.name}</div>
                <div class="file-meta">${file.type}</div>
                <div class="file-meta">${file.size}</div>
                <div class="file-actions">
                    ${actionButton}
                </div>
            `;

            fileListContainer.appendChild(fileItem);
        });
    }

    // Fetch and render files
    fetch('filelist.json')
        .then(response => {
            if (!response.ok) throw new Error("Index file not found");
            return response.json();
        })
        .then(data => {
            allFiles = data;
            renderFiles(allFiles);
        })
        .catch(error => {
            console.error('Error loading files:', error);
            fileListContainer.innerHTML = `
                <div class="file-item" style="color: #ff4444; justify-content: center; flex-direction: column; text-align: center;">
                    <div>[ ERROR ] FAILED TO LOAD DIRECTORY LISTING</div>
                    <div style="font-size: 0.8em; opacity: 0.7; margin-top:5px;">Run 'python generate_filelist.py' then push to rebuild index.</div>
                </div>
            `;
        });
});
