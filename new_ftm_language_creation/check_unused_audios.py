import os

def construct_json_path(root_folder, language):
    json_path = os.path.join(root_folder, language, f"ftm_{language}.json")
    return json_path

def check_prompt_audios(json_path, audios_folder, prompt_audio_urls):
    try:
        missing_prompt_audios = []

        for prompt_audio_name in prompt_audio_urls:
            prompt_audio_path = os.path.join(audios_folder, prompt_audio_name)

            if not os.path.exists(prompt_audio_path):
                missing_prompt_audios.append(prompt_audio_name)

        if missing_prompt_audios:
            print("Prompt audios missing in the audios folder:")
            for missing_audio in missing_prompt_audios:
                print(missing_audio)
        else:
            print("All prompt audios are present in the audios folder.")
    except Exception as e:
        print("Error checking prompt audios:", e)

def find_prompt_audios(json_path, prompt_audio_urls=None):
    if prompt_audio_urls is None:
        prompt_audio_urls = []

    try:
        import json
        
        with open(json_path, "r",encoding="utf8") as json_file:
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
                    if os.path.basename(feedbackAudioUrl) not in prompt_audio_url:
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
    root_folder = r"C:\Users\lenovo\Desktop\curious leraning\FeedTheMonsterJS\lang"
   
    language = input("Enter the language: ")
    
    json_path = construct_json_path(root_folder, language)
    audios_folder = os.path.join(root_folder, language, "audios")
    print("Constructed JSON path:", json_path)
    
    prompt_audio_urls = find_prompt_audios(json_path)
    print("Prompt audio URLs:", prompt_audio_urls)
    audio_files_in_folder = find_audios_in_folder(audios_folder)
    # check_prompt_audios(json_path, audios_folder, prompt_audio_urls)


    
    missing_audios = []

    for audio_name in audio_files_in_folder:
        if audio_name not in prompt_audio_urls:
            missing_audios.append(audio_name)

    if missing_audios:
        print("Audio files missing in the unique prompt texts:")
        for missing_audio in missing_audios:
            print(missing_audio)
    else:
        print("All audio files in the folder are listed in the unique prompt texts.")
