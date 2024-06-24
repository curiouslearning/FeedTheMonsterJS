import requests
import json
import base64

from urllib.parse import urlparse
missing_audio_urls = []
lang = 'austrailianenglish'
language = lang.upper()
owner = "curiouslearning"
repo = "ftm-languagepacks"
file_path = f"{language}output.txt"
file = open(file_path, 'w', encoding='utf-8')
wordsdirectory = f"{language}/sounds/words"
print(wordsdirectory)
letterdirectory = f"{language}/sounds/letters"
jsonUrl = f"https://api.github.com/repos/curiouslearning/ftm-asset-api/contents/fulljsons/All{language}.json"
headers = {
    "Accept": "application/vnd.github.v3+json"
}
print(jsonUrl)
jsonResponse = requests.get(jsonUrl, headers=headers)
jdata = jsonResponse.json()
content = jdata["content"]
decoded_content = base64.b64decode(content).decode("utf-8")
json_data =json.loads(decoded_content)
wordUrl = f"https://api.github.com/repos/{owner}/{repo}/contents/{wordsdirectory}"
lettersUrl = f"https://api.github.com/repos/{owner}/{repo}/contents/{letterdirectory}"
wordResponse = requests.get(wordUrl)
wordData = wordResponse.json()
#word_sounds =[]
word_sounds = [file['name'].split('.')[0] for file in wordData]
print('WordSound',word_sounds)
letterResponse = requests.get(lettersUrl)
lettersdata = letterResponse.json()
letter_sounds = [file['name'].split('.')[0] for file in lettersdata]
print('LetterSound',letter_sounds)
#letter_sounds =[]
# print(len(word_sounds))
# print(len(letter_sounds))
for level in json_data['Levels']:
    for puzzle in level['Puzzles']:
        prompt_audio = puzzle['prompt']['PromptAudio']
        parsed_url = urlparse(prompt_audio)
        path = parsed_url.path
        segments = path.strip("/").split("/")
        if("letters" in prompt_audio):
            letter_index = segments.index("letters")
            letter = segments[letter_index + 1]
            # print('letters',letter.split('.')[0])
            try:
                letter_sounds.index(letter.split('.')[0])
            except ValueError:
                missing_audio_urls.append(prompt_audio)
        elif("words" in prompt_audio):
            index = segments.index("words")
            word = segments[index + 1]
            try:
                word_sounds.index(word.split('.')[0])
            except ValueError:
                missing_audio_urls.append(prompt_audio)
unique_urls = set(missing_audio_urls)
for element in unique_urls:
    file.write(element+"\n")












