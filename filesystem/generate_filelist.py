import os
import json
import math

# Configuration
FILES_DIR = os.path.join(os.path.dirname(__file__), 'files')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'filelist.json')

def get_size_str(size_bytes):
    if size_bytes == 0:
        return "0B"
    size_name = ("B", "KB", "MB", "GB", "TB")
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return "%s %s" % (s, size_name[i])

def scan_directory(path, relative_base):
    entries = []
    
    # Check if directory exists
    if not os.path.exists(path):
        print(f"Warning: Directory not found: {path}")
        return []
    
    # Folders to exclude
    IGNORED_ITEMS = {'personal', 'friends'}

    for entry in os.scandir(path):
        if entry.name.startswith('.'): # Skip hidden files
            continue
        
        if entry.name.lower() in IGNORED_ITEMS:
            continue
            
        entry_data = {
            'name': entry.name,
            'path': os.path.join(relative_base, entry.name).replace('\\', '/'),
        }

        if entry.is_dir():
            entry_data['type'] = 'DIR'
            entry_data['size'] = '-'
            entry_data['children'] = scan_directory(entry.path, os.path.join(relative_base, entry.name))
        else:
            ext = os.path.splitext(entry.name)[1][1:].upper()
            entry_data['type'] = ext if ext else 'FILE'
            entry_data['size'] = get_size_str(entry.stat().st_size)
            # URL relative to filesystem/index.html
            entry_data['url'] = 'files/' + os.path.join(relative_base, entry.name).replace('\\', '/')

        entries.append(entry_data)
    
    # Sort: Directories first, then files
    entries.sort(key=lambda x: (x['type'] != 'DIR', x['name'].lower()))
    return entries

def generate_html_index(folder_name, relative_path_to_root):
    # This is a template based on the main index.html
    # We need to adjust relative paths for CSS and JS
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Filesystem // {folder_name}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap" rel="stylesheet">
    <link rel="icon" type="image/png" href="{relative_path_to_root}/webpage icon.png">
    <link rel="stylesheet" href="{relative_path_to_root}/style.css">
</head>
<body>
    <main class="content-wrapper">
        <section class="file-system-container">
            <header class="file-header">
                <div class="file-path">
                    C:\\Users\\Adir\\Filesystem\\Friends\\<span class="current-dir">{folder_name}</span> >
                </div>
            </header>
            <div class="upload-zone">
                <span class="upload-icon">📂</span>
                <p>PRIVATE REPOSITORY</p>
                <p style="font-size: 0.8rem; color: var(--text-dim); margin-top: 5px;">[ ACCESS GRANTED ]</p>
            </div>
            <div class="file-list" id="file-list">
                <div class="file-item" style="text-align: center; display: block; color: var(--text-dim);">
                    LOADING_FILES...
                </div>
            </div>
        </section>
    </main>
    <footer class="global-hud">
        <div class="hud-frame">
            <div class="hud-module left">
               <a href="{relative_path_to_root}/filesystem/index.html" class="hud-btn" style="text-decoration:none; display:flex; align-items:center; justify-content:center; color: var(--text-color);">
                    &lt; BACK
               </a>
            </div>
            <div class="hud-module center">
                <span class="scrolling-text">CONNECTED TO NODE: {folder_name.upper()} ...</span>
            </div>
            <div class="hud-module right"></div>
        </div>
    </footer>
    <!-- Point to the main filesystem.js which will load 'filelist.json' from THIS directory -->
    <script src="{relative_path_to_root}/filesystem/filesystem.js"></script>
</body>
</html>"""

def process_friends_folders(base_path):
    friends_path = os.path.join(base_path, 'friends')
    if not os.path.exists(friends_path):
        return

    for entry in os.scandir(friends_path):
        if entry.is_dir() and not entry.name.startswith('.'):
            friend_name = entry.name
            friend_dir = entry.path
            
            print(f"Generating filesystem for friend: {friend_name}")
            
            # 1. Generate local filelist.json for this friend
            # We treat this friend_dir as the root for their view
            # The 'url' must be relative to THEIR index.html, so it's just the filename
            # Actually scan_directory creates urls like 'files/name'. 
            # If we are inside 'files/friends/nadav/', the file 'foo.txt' is right there.
            # So we need a custom scan that produces relative URLs correctly.
            
            friend_files = []
            for f_entry in os.scandir(friend_dir):
                if f_entry.name.startswith('.') or f_entry.name == 'index.html' or f_entry.name == 'filelist.json':
                    continue
                
                f_data = {
                    'name': f_entry.name,
                    'path': f_entry.name,
                }
                
                if f_entry.is_dir():
                    f_data['type'] = 'DIR'
                    f_data['size'] = '-'
                    # Not recursive for simplicity, or simple recurse
                    f_data['children'] = [] # simplified
                else:
                    ext = os.path.splitext(f_entry.name)[1][1:].upper()
                    f_data['type'] = ext if ext else 'FILE'
                    f_data['size'] = get_size_str(f_entry.stat().st_size)
                    f_data['url'] = f_entry.name # Direct link relative to index.html
                
                friend_files.append(f_data)
            
            # Write friend's filelist.json
            with open(os.path.join(friend_dir, 'filelist.json'), 'w', encoding='utf-8') as f:
                json.dump(friend_files, f, indent=4)
                
            # 2. Generate index.html
            # Path back to root: files/friends/nadav -> ../../../..
            html_content = generate_html_index(friend_name, "../../../..")
            with open(os.path.join(friend_dir, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(html_content)

def main():
    print(f"Scanning directory: {FILES_DIR}")
    
    # 1. Generate Main Index
    files_data = scan_directory(FILES_DIR, "")
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(files_data, f, indent=4)
    
    # 2. Generate Friend Indexes
    process_friends_folders(FILES_DIR)
    
    print(f"Successfully generated main index and friend sub-systems.")

if __name__ == "__main__":
    main()
