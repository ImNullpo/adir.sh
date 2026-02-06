import os
import json
import math

# Configuration
FILES_DIR = os.path.join(os.path.dirname(__file__), 'files')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'files.json')

def get_size_str(size_bytes):
    if size_bytes == 0:
        return "0B"
    size_name = ("B", "KB", "MB", "GB", "TB")
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return "%s %s" % (s, size_name[i])

def scan_directory(path):
    entries = []
    
    # Check if directory exists
    if not os.path.exists(path):
        print(f"Warning: Directory not found: {path}")
        return []

    for entry in os.scandir(path):
        if entry.name.startswith('.'): # Skip hidden files
            continue
        
        # Skip this script or json if they somehow end up in files (unlikely with current structure but good safety)
        if entry.name == 'files.json' or entry.name.endswith('.py'):
            continue
            
        entry_data = {
            'name': entry.name,
            'path': entry.name # For reference
        }

        if entry.is_dir():
            # For simplicity in this version, we aren't doing recursive folders yet, or effectively treating them as items
            entry_data['type'] = 'DIR'
            entry_data['size'] = '-'
            # entry_data['children'] = ... # Future expansion
        else:
            ext = os.path.splitext(entry.name)[1][1:].upper()
            entry_data['type'] = ext if ext else 'FILE'
            entry_data['size'] = get_size_str(entry.stat().st_size)
            # URL relative to library/index.html
            entry_data['url'] = 'files/' + entry.name

        entries.append(entry_data)
    
    # Sort: Directories first, then files
    entries.sort(key=lambda x: (x['type'] != 'DIR', x['name'].lower()))
    return entries

def main():
    print(f"Scanning Public Library: {FILES_DIR}")
    
    files_data = scan_directory(FILES_DIR)
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(files_data, f, indent=4)
    
    print(f"Successfully updated library catalog: {OUTPUT_FILE}")
    print(f"Found {len(files_data)} items.")

if __name__ == "__main__":
    main()
