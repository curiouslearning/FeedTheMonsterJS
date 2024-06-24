import requests
import json
language = input("Enter the language :")
audio_urls = []
url = "https://feedthemonsterdev.curiouscontent.org/lang/"+language+"/ftm_"+language+".json" 
file_path = "output.txt"
response = requests.get(url)
file =open(file_path, 'w',encoding='utf-8')
if response.status_code == 200:
    data = json.loads(response.content)
else:
    print("Error:", response.status_code)
for feedbackUrl in data['FeedbackAudios']:
    feedbackUrl = feedbackUrl.replace("feedthemonster", "feedthemonsterdev")
    feedback_response = requests.head(feedbackUrl)
    if feedback_response.status_code == 200:
        print("FeedbackAudio Exist")
    else:
        print("FeedbackAudio Not Exist")  
        file.write(feedbackUrl+"\n") 
for level  in data['Levels']:
    for puzzle in level['Puzzles']:
        prompt_audio = puzzle['prompt']['PromptAudio']
        prompt_audio = prompt_audio.replace("feedthemonster", "feedthemonsterdev")
        audio_response = requests.head(prompt_audio)
        if audio_response.status_code == 200:
            print("Successful")
        else:
            print("Failed")
            audio_urls.append(prompt_audio) 
unique_urls = set(audio_urls)
for element in unique_urls:
     file.write(element+"\n")