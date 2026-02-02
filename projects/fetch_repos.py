import json
import urllib.request
import os

# Configuration
USERNAME = "ImNullpo"
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'repos.json')
GITHUB_API_URL = f"https://api.github.com/users/{USERNAME}/repos?sort=updated&direction=desc"

def fetch_repos():
    print(f"Fetching repositories for user: {USERNAME}...")
    # Add User-Agent to avoid GitHub API blocking requests without it
    headers = {'User-Agent': 'Python-Project-Fetcher'}
    
    try:
        req = urllib.request.Request(GITHUB_API_URL, headers=headers)
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                return data
            else:
                print(f"Error: Received status code {response.status}")
                return []
    except Exception as e:
        print(f"Error fetching data: {e}")
        return []

def process_repos(repos):
    processed = []
    for repo in repos:
        # Extract only necessary fields to keep JSON light and secure
        processed.append({
            'name': repo.get('name'),
            'description': repo.get('description'),
            'html_url': repo.get('html_url'),
            'language': repo.get('language'),
            'stargazers_count': repo.get('stargazers_count', 0),
            'visibility': repo.get('visibility', 'public'),
            'updated_at': repo.get('updated_at')
        })
    return processed

def main():
    repos = fetch_repos()
    if repos:
        cleaned_data = process_repos(repos)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, indent=4)
        print(f"Successfully saved {len(cleaned_data)} repositories to {OUTPUT_FILE}")
    else:
        print("No repositories found to save.")

if __name__ == "__main__":
    main()
