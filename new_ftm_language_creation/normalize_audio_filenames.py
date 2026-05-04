import argparse
import os
import sys
import unicodedata
from pathlib import Path

def normalize_unicode(text):
    """Normalize Unicode strings to NFC form (composed characters)"""
    return unicodedata.normalize('NFC', text)

def construct_json_path(root_folder, language):
    json_path = os.path.join(root_folder, language, f"ftm_{language}.json")
    return json_path

def find_prompt_audios(json_path):
    """Extract all audio filenames referenced in the JSON"""
    prompt_audio_urls = []
    
    try:
        import json
        
        with open(json_path, "r", encoding="utf8") as json_file:
            data = json.load(json_file)
            
            if "Levels" in data:
                for level in data["Levels"]:
                    if "Puzzles" in level:
                        for puzzle in level["Puzzles"]:
                            if "prompt" in puzzle and "PromptAudio" in puzzle["prompt"]:
                                prompt_audio_url = puzzle["prompt"]["PromptAudio"]
                                basename = os.path.basename(prompt_audio_url)
                                if basename not in prompt_audio_urls:
                                    prompt_audio_urls.append(basename)

            if "FeedbackAudios" in data:
                for feedbackAudioUrl in data["FeedbackAudios"]:
                    basename = os.path.basename(feedbackAudioUrl)
                    if basename not in prompt_audio_urls:
                        prompt_audio_urls.append(basename)
            
        return prompt_audio_urls
    except Exception as e:
        print("Error finding prompt audios:", e)
        return []

def normalize_audio_filenames(language, root_folder):
    """Rename audio files to match NFC normalization expected by JSON"""
    json_path = construct_json_path(root_folder, language)
    audios_folder = os.path.join(root_folder, language, "audios")
    
    if not os.path.exists(audios_folder):
        print(f"Audios folder does not exist: {audios_folder}")
        return
    
    # Get expected filenames from JSON (already in NFC from JSON parsing)
    expected_files = find_prompt_audios(json_path)
    expected_normalized = {normalize_unicode(f) for f in expected_files}
    
    # Get actual files in folder
    actual_files = [f for f in os.listdir(audios_folder) 
                   if os.path.isfile(os.path.join(audios_folder, f))]
    
    renamed_count = 0
    
    for actual_filename in actual_files:
        normalized_filename = normalize_unicode(actual_filename)

        # Only normalize files expected by the JSON list.
        if normalized_filename not in expected_normalized:
            continue
        
        # Check if normalization changed the filename
        if actual_filename != normalized_filename:
            old_path = os.path.join(audios_folder, actual_filename)
            new_path = os.path.join(audios_folder, normalized_filename)
            
            # Check if the normalized name would conflict with an existing file
            if os.path.exists(new_path):
                print(f"⚠️  Cannot rename: {actual_filename}")
                print(f"   Target already exists: {normalized_filename}")
            else:
                try:
                    os.rename(old_path, new_path)
                    print(f"✓ Renamed: {actual_filename} → {normalized_filename}")
                    renamed_count += 1
                except Exception as e:
                    print(f"✗ Error renaming {actual_filename}: {e}")
    
    if renamed_count == 0:
        print("No files needed normalization.")
    else:
        print(f"\nTotal files renamed: {renamed_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Normalize audio filenames to NFC.")
    parser.add_argument(
        "--root-folder",
        help="Path to the lang folder. Defaults to ../lang relative to this script.",
    )
    args = parser.parse_args()

    default_root = Path(__file__).resolve().parents[1] / "lang"
    root_folder = Path(args.root_folder).resolve() if args.root_folder else default_root

    if not root_folder.exists() or not root_folder.is_dir():
        print(f"Lang folder does not exist: {root_folder}")
        sys.exit(1)

    language = input("Enter the language: ")

    print(f"\nNormalizing audio filenames for: {language}")
    print("-" * 50)
    normalize_audio_filenames(language, str(root_folder))
    print("\nDone!")
