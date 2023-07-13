#!/bin/bash

owner="curiouslearning"
repo="ftm-languagepacks"
response=$(curl -s "https://api.github.com/repos/$owner/$repo/contents")

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

node find_missing_foilstone_paths.js "$folder"

python3 download_audio_files.py "$folder"