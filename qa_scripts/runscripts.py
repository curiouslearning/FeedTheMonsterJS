import requests
import json
import os

# GitHub repository details
owner = "curiouslearning"
repo = "ftm-languagepacks"

# Provide your access token
token = "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"

# API endpoint
url = f"https://api.github.com/repos/{owner}/{repo}/contents"

# Set up headers with the access token
headers = {
    "Authorization": f"token {token}"
}

# Send the API request
response = requests.get(url, headers=headers)

# Check if the API request was successful
if response.status_code != 200:
    print(f"Error: Unable to access the GitHub repository. Status code: {response.status_code}")
    exit(1)

# Parse the API response JSON
data = response.json()

# Extract folder names from the response
folders = [item["name"] for item in data if item["type"] == "dir"]

print(f"Folders in the GitHub repository '{owner}/{repo}':")
for i, folder in enumerate(folders, start=1):
    print(f"{i}. {folder}")

# Function for folder selection
def select_folder():
    while True:
        try:
            selection = int(input("Select a language number (0 to cancel): "))
            if 0 <= selection <= len(folders):
                return folders[selection - 1] if selection > 0 else None
            else:
                print("Invalid selection. Please try again.")
        except ValueError:
            print("Invalid input. Please enter a number.")

# Prompt the user to select a folder
selected_folder = select_folder()

if selected_folder is None:
    print("Invalid selection or folder selection canceled.")
    exit(1)

print(f"You selected: {selected_folder}")

# Run the scripts using the selected folder
os.system(f"python create_folder.py {selected_folder}")
os.system(f"node find_missing_foilstone_paths.js {selected_folder}")
os.system(f"python download_audio_files.py {selected_folder}")

# Prompt to build the language
options = ["Yes", "No"]
while True:
    print("Do you want to build the language?")
    for i, option in enumerate(options, start=1):
        print(f"{i}. {option}")
    try:
        selection = int(input("Select an option: "))
        if 1 <= selection <= len(options):
            if options[selection - 1] == "Yes":
                os.system(f"python download_audio_files.py {selected_folder} True")
            print("Exiting...")
            break
        else:
            print("Invalid option. Please select a valid number.")
    except ValueError:
        print("Invalid input. Please enter a number.")