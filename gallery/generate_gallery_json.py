import os
import json

def generate_gallery_json():
    gallery_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(gallery_dir, 'projects.json')
    
    projects = []
    
    # Iterate over items in the gallery directory
    for item in os.listdir(gallery_dir):
        item_path = os.path.join(gallery_dir, item)
        
        # Check if it's a directory and not hidden/excluded
        if os.path.isdir(item_path) and not item.startswith('.'):
            # Only include if it has an index.html or seems like a project
            if os.path.exists(os.path.join(item_path, 'index.html')):
                projects.append({
                    "name": item,
                    "path": f"{item}/"
                })
    
    # Sort by name
    projects.sort(key=lambda x: x['name'])
    
    # Write to JSON
    with open(output_file, 'w') as f:
        json.dump(projects, f, indent=2)
    
    print(f"Generated {output_file} with {len(projects)} projects.")

if __name__ == "__main__":
    generate_gallery_json()
