#!/bin/bash

owner="curiouslearning"
repo="ftm-languagepacks"
options=("Yes" "No")
build=true
# provide your access token 
token=""
response=$(curl -s -H "Authorization: token $token" "https://api.github.com/repos/$owner/$repo/contents")
folders=($(echo "$response" | jq -r '.[] | select(.type == "dir") | .name'))
echo "Folders in the GitHub repository '$owner/$repo':"
# echo "response$response"
PS3="Select a language number: "
select folder in "${folders[@]}"; do
    if [[ -n $folder ]]; then
        echo "You selected: $folder"
        selected_lang="$folder" 
        break
    else
        echo "Invalid selection. Please try again."
    fi
done
echo "Generating report for $folder language Please wait..... "
python3 create_folder.py "$folder"
node find_missing_foilstone_paths.js "$folder"  # First Script (Javascript)
python3 download_audio_files.py "$folder"
echo "Generated report for $folder language and writen to language_report.txt "
echo "Do you want to build language"
select option in "${options[@]}"; do
  case $option in
    "Yes")
      echo "You selected yes."
      # node find_missing_foilstone_paths.js "$folder" "$build" 
      # echo "Done"
      python3 download_audio_files.py "$folder" "$build"
      break
      ;;
    "No")
       echo "Exiting..."
      break
      ;;
    *)
      echo "Invalid option. Please select a valid number."
      ;;
  esac
done
