# for deleting the unused audios for a particular language
import os

def delete_audio_files_for_language(language, root_folder):
    language_path = os.path.join(root_folder, language)
    if not os.path.exists(language_path):
        print(f"Language folder {language} does not exist.")
        return
    
    json_path = os.path.join(language_path, f"ftm_{language}.json")
    audios_folder = os.path.join(language_path, "audios")

    # Find all audio files in the folder
    audio_files_in_folder = find_audios_in_folder(audios_folder)

    # Get prompt audio URLs from JSON file
    prompt_audio_urls = find_prompt_audios(json_path)

    # Delete audio files not listed in the prompt audio URLs
    missing_audios = []
    for audio_name in audio_files_in_folder:
        if audio_name not in prompt_audio_urls:
            audio_path = os.path.join(audios_folder, audio_name)
            if audio_name != "great.mp3" and audio_name != "amazing.mp3":
                deleteAudio(audio_path)
            missing_audios.append(audio_name)

    if missing_audios:
        print("Audio files missing in the unique prompt texts:")
        for missing_audio in missing_audios:
            print(missing_audio)
    else:
        print("All audio files in the folder are listed in the unique prompt texts.")

def deleteAudio(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"File {file_path} has been deleted.")
    else:
        print(f"The file {file_path} does not exist.")

def find_prompt_audios(json_path, prompt_audio_urls=None):
    if prompt_audio_urls is None:
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
                                if os.path.basename(prompt_audio_url) not in prompt_audio_urls:
                                    prompt_audio_urls.append(os.path.basename(prompt_audio_url))

            if "FeedbackAudios" in data:
                for feedbackAudioUrl in data["FeedbackAudios"]:
                    if os.path.basename(feedbackAudioUrl) not in prompt_audio_urls:
                        prompt_audio_urls.append(os.path.basename(feedbackAudioUrl))

        return prompt_audio_urls
    except Exception as e:
        print("Error finding prompt audios:", e)
        return prompt_audio_urls

def find_audios_in_folder(audios_folder):
    try:
        audio_files = [filename for filename in os.listdir(audios_folder) if os.path.isfile(os.path.join(audios_folder, filename))]
        return audio_files
    except Exception as e:
        print("Error finding audio files in folder:", e)
        return []

if __name__ == "__main__":
    root_folder = r"D:\curious leraning\FeedTheMonsterJS\lang"
    language = input("Enter the language name: ")
    delete_audio_files_for_language(language, root_folder)
