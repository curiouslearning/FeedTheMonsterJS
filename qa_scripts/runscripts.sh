#!/bin/bash

owner="curiouslearning"
repo="ftm-languagepacks"
# provide your access token 
token=""
response=$(curl -s -H "Authorization: token $token" "https://api.github.com/repos/$owner/$repo/contents")
folders=($(echo "$response" | jq -r '.[] | select(.type == "dir") | .name'))

echo "Folders in the GitHub repository '$owner/$repo':"

PS3="Select a folder number: "
select folder in "${folders[@]}"; do
    if [[ -n $folder ]]; then
        echo "You selected: $folder"
        selected_lang="$folder" 
        break
    else
        echo "Invalid selection. Please try again."
    fi
done
echo "Executing------------->firstScript"

node find_missing_foilstone_paths.js "$folder"  # First Script (Javascript)

echo "executed------------->firstScript"

echo "Executing------------->secondScript"

echo "Downloading Audios,Please wait........."

secd_scrpt_output=$(python3 download_audio_files.py "$folder")  #Second Script (Python)

echo "executed------------->secondScript"
# Use the desired values in subsequent operations
echo "Output from second script:$secd_scrpt_output"

# Extract the desired value from the output
