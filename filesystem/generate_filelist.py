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

def main():
    print(f"Scanning directory: {FILES_DIR}")
    files_data = scan_directory(FILES_DIR, "")
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(files_data, f, indent=4)
    
    print(f"Successfully generated {OUTPUT_FILE} with {len(files_data)} top-level items.")

if __name__ == "__main__":
    main()
