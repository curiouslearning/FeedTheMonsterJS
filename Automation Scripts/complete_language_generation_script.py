import re
import json
import requests
import gdown
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import requests
import shutil
import subprocess
from pydub import AudioSegment

# Path to the JSON key file you downloaded when setting up the service account.
KEY_FILE = '/run/media/amitsingh/New Volume/Sutara/NewProject/FeedTheMonsterJS/Automation Scripts/credentials.json'

# The Google Drive API version to use.
API_VERSION = 'v3'

# Create a service account credentials object.
credentials = service_account.Credentials.from_service_account_file(
    KEY_FILE, scopes=['https://www.googleapis.com/auth/drive'])

# Create a Drive API service.
drive_service = build('drive', API_VERSION, credentials=credentials)















def import_language_json(language_path):
    
    
    try:
        with open(language_path, 'r') as json_file:
            language_data = json.load(json_file)
        return language_data
    except FileNotFoundError:
        print("Language file not found.")
        return None



















def getLanguage():
    lang=input("Enter the language:---")
    return lang
    
    





















def find_unique_audio_urls(obj, unique_audio_keys=None):
    feedback_words = ['amazing.mp3', 'fantastic1.mp3','fantastic.mp3', 'great1.mp3', 'amazing.mp3']
    if unique_audio_keys is None:
        unique_audio_keys = set()
    for feedback in feedback_words:
        unique_audio_keys.add(feedback)
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key == "PromptAudio" or key == "FeedbackAudios" or key == "OtherAudios":
                if isinstance(value, list):
                    for url in value:
                        match = re.search(r'/(\w+\.mp3)$', url)
                        if match:
                            audio_key = match.group(1)
                            unique_audio_keys.add(audio_key)
                elif isinstance(value, str):
                    match = re.search(r'/(\w+\.mp3)$', value)
                    if match:
                        audio_key = match.group(1)
                        unique_audio_keys.add(audio_key)
            if isinstance(value, (dict, list)):
                find_unique_audio_urls(value, unique_audio_keys)

    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, (dict, list)):
                find_unique_audio_urls(item, unique_audio_keys)

    return unique_audio_keys



















def navigate_to_desired_location(drive_id, folder_id, desired_folder_id, depth=0):
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': drive_id,
        'q': f"'{folder_id}' in parents and mimeType = 'application/vnd.google-apps.folder'",
    }

    results = drive_service.files().list(**query_params).execute()
    folders = results.get('files', [])

    if not folders:
        return

    for folder in folders:
        if folder["id"] == desired_folder_id:
            print('  ' * depth + f'{folder["name"]} ({folder["id"]})')
            # You've reached the desired folder, now you can list its contents or perform any desired actions.
            list_contents_of_folder(drive_id, folder["id"], depth + 1)
           
                        
        else:
            if folder["id"]=="1241p6yE0at78OZVdTewJSWS6XdjPjx93" or folder["id"]=="1lsbOukZZTFGJI8tTMRGDTi1QpuiAGJaR" or folder["id"]=="1dVw3lRUcP0vHP8qGhGqeHmG0Elflx2HY" or folder["id"]=="1xTln0bFAGJe3hhWu_KdpdQb7gQcSAktG":
                navigate_to_desired_location(drive_id, folder['id'], desired_folder_id, depth + 1)

























































def list_contents_and_download(drive_id, folder_id, depth=0, output_folder=''):
    # Query for contents in the selected folder
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': drive_id,
        'q': f"'{folder_id}' in parents ",
    }
    
    results = drive_service.files().list(**query_params).execute()
    contents = results.get('files', [])

    # Create the output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    for content in contents:
        if content['mimeType'] == 'application/vnd.google-apps.folder':
            # If it's a folder, call the function recursively
            list_contents_and_download(drive_id, content['id'], depth + 1, output_folder)
        
            
            # If it's not a folder, it's assumed to be an audio file
        download_audio_files(drive_id, content['id'],depth+1, output_folder)















































    
def list_contents_of_folder(drive_id, folder_id, depth=0):
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': drive_id,
        'q': f"'{folder_id}' in parents",
    }

    results = drive_service.files().list(**query_params).execute()
    contents = results.get('files', [])
    
    selected_folder=None

    for i, content in enumerate(contents, start=1):
        print('  ' * depth + f'{i} {content["name"]} ({content["id"]})')
        
    while not selected_folder:
            selected_number = input("Enter the number of the folder you want to select (0 to exit): ")
            try:
                selected_number = int(selected_number)
                if 0 <= selected_number <= len(contents):
                    if selected_number == 0:
                        navigate_to_desired_location(shared_drive_id, root_folder_id, desired_folder_id)
                        missing_audios_in_drive=check_missing_audios(missing_audios,output_folder)
                        body=("Hey There!"
                            "Downloaded audios from Google Drive"
                            "Audios Missing in Github-->>>>" f'{missing_audios}'
                            "Audios missing in google drive--->>"f'{missing_audios_in_drive}')
                        inform_user_about_issue(receiver,"Levelgen generating error",body)
                        return None
                    selected_folder = contents[selected_number - 1]
                    if selected_folder['mimeType'] != 'application/vnd.google-apps.folder':
                        print("Selected item is not a folder. Please select a folder.")
                        selected_folder = None
                    else:
                        print(f'Selected folder: {selected_folder["name"]}{selected_folder["mimeType"]}({selected_folder["id"]})')
                        download_audios = input("Download audio files from this folder? (yes/no): ")
                        if download_audios.lower() == "yes":
                             print(lang)
                             
                             list_contents_and_download(drive_id,selected_folder["id"],depth+1,output_folder)
                            #  download_audio_files(drive_id,selected_folder["id"],depth+1,output_folder)
                        list_contents_of_folder(drive_id, selected_folder["id"], depth + 1)
                else:
                    print("Invalid number. Please enter a valid number.")
            except ValueError:
                print("Invalid input. Please enter a valid number.")
        
    return selected_folder









































     
def download_audio_files(drive_id,folder_id,depth=0,output_folder=''):
    # Query for audio files in the selected folder
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': drive_id,
        'q': f"'{folder_id}' in parents ",
    }
    
    results = drive_service.files().list(**query_params).execute()
    audio_files = results.get('files', [])
    print(audio_files)
    if not audio_files:
        print("No audio files found in the selected folder.")
        return
    
     # Create the output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Loop through the audio files and download each one
    for audio_file in audio_files:
        file_name = audio_file["name"]
        file_id = audio_file["id"]
        file_name=get_correct_file_name(file_name)
        print(file_name)
        download_url = f'https://drive.google.com/uc?id={file_id}'
        output_path = os.path.join(output_folder, file_name)  # Construct the full output path

        # Use your preferred method to download the file (e.g., requests library)
        # Example using requests library:
        # print(file_name)

        if file_name in missing_wav_audios:
            if not os.path.exists(output_path):
                gdown.download(download_url, output_path, quiet=False)
                perform_operations(output_path)
                if output_path =="fantastic1.mp3":
                    os.rename(output_path,"fantastic.mp3")
                        
                if output_path =="great1.mp3":
                     os.rename(output_path,"great.mp3")
                
        elif file_name in missing_audios: 
            if not os.path.exists(output_path):   
                gdown.download(download_url, output_path, quiet=False)
                if output_path =="fantastic1.mp3":
                    os.rename(output_path,"fantastic.mp3")
                        
                if output_path =="great1.mp3":
                     os.rename(output_path,"great.mp3")
        


def get_correct_file_name(filename):
    keywords_to_remove = ["_feedback", "_sound", "_word", "_syllable", "_memory"]
    
    for keyword in keywords_to_remove:
        if keyword in filename:
            filename = filename.replace(keyword, "")

    return filename.lower()



def perform_operations(output_path):
    # Check if the file exists
    if not os.path.exists(output_path):
        print(f"File not found: {output_path}")
        return

    # Get the file extension
    file_extension = os.path.splitext(output_path)[-1].lower()

    if file_extension == '.wav':
        # If it's a WAV file, convert it to MP3 using ffmpeg
        mp3_path = os.path.splitext(output_path)[0] + '.mp3'  # Replace the extension with '.mp3'
        ffmpeg_command = ['ffmpeg', '-i', output_path, mp3_path]
        
        try:
            subprocess.run(ffmpeg_command, check=True)
            os.remove(output_path)  # Delete the original WAV file
            print(f"Converted to MP3 using ffmpeg: {mp3_path}")
        except subprocess.CalledProcessError:
            print(f"Conversion to MP3 failed using ffmpeg for: {output_path}")
    elif file_extension == '.mp3':
        # It's already an MP3, no need to convert
        print(f"MP3 file found: {output_path}")
    else:
        # Unsupported file format
        print(f"Unsupported file format: {output_path}")
    


















def find_unique_wav_audio_texts(unique_prompt_texts):
    wav_prompt_texts=set()
    for prompt_text in unique_prompt_texts:
        wav_prompt = prompt_text.replace(".mp3", ".wav")
        wav_prompt_texts.add(wav_prompt)
    return wav_prompt_texts














def generate_json_from_levelgen(lang,drive_id,folder_id,depth=0):
    if not os.path.exists(lanugageJsonPath):
        is_json_generated= list_initial_files(drive_id,"18SRLdZK-n2QismpXY1Cn-FFqrJutIU8I",depth+1,lang)
        return is_json_generated
    else:
        print("already Exists")
        return True




def list_initial_files(drive_id,folder_id,depth,lang):
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': drive_id,
        'q': f"'{folder_id}' in parents",
    }

    results = drive_service.files().list(**query_params).execute()
    contents = results.get('files', [])
    for i, content in enumerate(contents, start=1):
        print('  ' * depth + f'{i} {content["name"].lower()} ({content["id"]})')
        file_name=content["name"].lower()
        print(file_name,lang)
        if file_name == lang:
          is_generation_sucessful=  generate_json_file(lang,content["id"]);
        else :
            return False    
            
    return is_generation_sucessful

def generate_json_file(lang,id):
    url = 'https://us-central1-ftm-b9d99.cloudfunctions.net/hello-world?act=generate&sheet='+id
    lang_folder='/run/media/amitsingh/New Volume/Sutara/NewProject/FeedTheMonsterJS/lang/'+lang
    if not os.path.exists(lang_folder):
        os.makedirs(lang_folder)
# Make a GET request to fetch the JSON data
    headers = {
        'Authorization': f'Bearer {github_access_token}'
    }
    
    response = requests.get(url, headers=headers)

# Check if the request was successful (status code 200)
    if response.status_code == 200:
    # Parse the JSON content
        json_data = response.json()
    
    # Define the path for the output JSON file
        output_json_file = lanugageJsonPath

    # Save the JSON data to a local JSON file
        with open(output_json_file, 'w') as json_file:
            json.dump(json_data, json_file, indent=4)

        print(f"JSON data saved to {output_json_file}")
        return True
    else:
        print(f"Failed to fetch JSON data. Status code: {response.status_code}")
        return False










def inform_user_about_issue(receiver,subject,body):
    # Replace these with your Gmail account details and email content
    gmail_user = 'amit@sutara.org'
    gmail_app_password = 'Please enter you app password'
     # Create a multipart message
    msg = MIMEMultipart()
    msg['From'] = gmail_user
    msg['To'] = ', '.join(receiver)
    msg['Subject'] = subject

    # Add the body of the email
    msg.attach(MIMEText(body, 'plain'))
    # Generate the report
    report_content = ("This is the content of your report."
                        f'{body}'
                        "Missing audios in github->"f'{missing_audios}'
                        "missing audios in google drive-->"f'{missing_audios_in_drive}') 
    report_file_path = 'report.txt'
    with open(report_file_path, 'w') as report_file:
        report_file.write(report_content)

    # Attach the report file
    with open(report_file_path, 'rb') as report_file:
        attachment = MIMEApplication(report_file.read())
        attachment.add_header('Content-Disposition', 'attachment', filename=os.path.basename(report_file_path))
        msg.attach(attachment)

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.ehlo()
        server.login(gmail_user, gmail_app_password)
        server.sendmail(gmail_user, receiver, msg.as_string())
        server.close()

        print('Email sent!')
    except Exception as exception:
        inform_user_about_issue(receiver,"Error in Building Lamguage",e)
        print("Error: %s!\n\n" % exception)





def download_files(owner, repo, path, output_folder):
    print("path.>>",path)
    api_url=f"https://api.github.com/repos/{owner}/{repo}/contents"
    
    if path:
        api_url=f"{api_url}/{path}"

    try:
        headers = {
        'Authorization': f'Bearer {github_access_token}'
        }
    
        response = requests.get(api_url, headers=headers)

        if response.status_code == 200:
            contents = response.json()
            if not os.path.exists(output_folder):
                os.makedirs(output_folder)

            for item in contents:
                item_name = item["name"]
                item_type = item["type"]
                file_url = item["download_url"]

                if item_type == "file" and item_name.endswith(".wav") and item_name in wav_unique_prompt_texts:
                    response_file = requests.get(file_url)
                    if response_file.status_code == 200:
                        file_data = response_file.content
                        file_path = os.path.join(output_folder, item_name)
                        mp3_path = os.path.join(output_folder, os.path.splitext(item_name)[0] + '.mp3')

                        with open(file_path, 'wb') as file:
                            file.write(file_data)

                        audio = AudioSegment.from_wav(file_path)
                        audio.export(mp3_path, format="mp3")

                        os.remove(file_path)
                        if mp3_path =="fantastic1.mp3":
                            os.rename(mp3_path,"fantastic.mp3")
                        
                        if mp3_path =="great1.mp3":
                            os.rename(mp3_path,"great.mp3")
                            
                        print(f"Downloaded and converted: {item_name}")

                    else:
                        print(f"Failed to download: {item_name}")

                elif item_type == "file" and item_name.endswith(".mp3") and item_name in unique_prompt_texts:
                    response_file = requests.get(file_url)
                    if response_file.status_code == 200:
                        file_data = response_file.content
                        file_path = os.path.join(output_folder, item_name)

                        with open(file_path, 'wb') as file:
                            file.write(file_data)
                        if file_path =="fantastic1.mp3":
                            os.rename(file_path,"fantastic.mp3")
                        
                        if file_path =="great1.mp3":
                            os.rename(file_path,"great.mp3")
                        print(f"Downloaded: {item_name}")

                    else:
                        print(f"Failed to download: {item_name}")
                        
                    

        else:
            print(f"Failed to retrieve contents. Status code: {response.status_code}")

    except Exception as exception:
        inform_user_about_issue(receiver,"Error in Building Lamguage",e)
        print("Error: %s!\n\n" % exception)





def list_sounds_folder(owner, repo, path):
    api_url=f"https://api.github.com/repos/{owner}/{repo}/contents"
    
    if path:
        api_url=f"{api_url}/{path}"
    
    try:
        headers = {
        'Authorization': f'Bearer {github_access_token}'
        }
    
        response = requests.get(api_url, headers=headers)
        if response.status_code == 200:
            # Parse the JSON response
            contents = response.json()

            # Iterate over the contents and print their names and types
            for item in contents:
                item_name = item["name"]
                item_type = item["type"]
                
                if item_type =="dir":
                    print("sounds folder")
                    download_files(owner, repo, f'{path}/{item_name}',output_folder)
                    
        
    except requests.exceptions.RequestException as e:
        inform_user_about_issue(receiver,"Error in Building Lamguage",e)
        print(f"Request failed: {e}")







def check_missing_audios(prompt_audio_urls,output_folder):
    try:
        missing_prompt_audios = []

        for prompt_audio_name in prompt_audio_urls:
            prompt_audio_path = os.path.join(output_folder, prompt_audio_name)

            if not os.path.exists(prompt_audio_path) and  prompt_audio_path =="fantastic1.mp3" and prompt_audio_path =="amazing.mp3" and prompt_audio_path =="great1.mp3":
                missing_prompt_audios.append(prompt_audio_name)

        if missing_prompt_audios:
            print("Prompt audios missing in the audios folder:")
            for missing_audio in missing_prompt_audios:
                print(missing_audio)
        else:
            print("All prompt audios are present in the audios folder.")
    except Exception as e:
        inform_user_about_issue(receiver,"Error in Building Lamguage",e)
        print("Error checking prompt audios:", e)
    
    return missing_prompt_audios


def download_github_audios(owner, repo, path):
    # Create the URL for the contents API with the specified path
    api_url = f"https://api.github.com/repos/{owner}/{repo}/contents"
    if path:
        api_url = f"{api_url}/{path}"

    try:
        # Send a GET request to the API URL
        headers = {
        'Authorization': f'Bearer {github_access_token}'
        }
    
        response = requests.get(api_url, headers=headers)

        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            # Parse the JSON response
            contents = response.json()

            # Iterate over the contents and print their names and types
            for item in contents:
                item_name = item["name"]
                item_type = item["type"]
                language_name=lang.upper()
                if item_type == "dir":
                    if language_name== item_name:
                    # If the item is a directory, recursively list its contents
                        download_github_audios(owner, repo, f"{path}/{item_name}")
                        
                    if item_name == "sounds" or item_name =="sound" or item_name =="audio" or item_name == "audios":
                        list_sounds_folder(owner, repo, f"{path}/{item_name}")

        else:
            print(f"Failed to retrieve contents. Status code: {response.status_code}")

    except requests.exceptions.RequestException as e:
        inform_user_about_issue(receiver,"Error in Building Lamguage",e)
        print(f"Request failed: {e}")


def find_missing_wav_audios(missing_audios):
    wav_missing_audios=set()
    for missing_audio in missing_audios:
        wav_prompt = missing_audio.replace(".mp3", ".wav")
        wav_missing_audios.add(wav_prompt)
    return wav_missing_audios



if __name__ == '__main__':
    shared_drive_id = '0AArPHFZAiZRmUk9PVA'
    root_folder_id = '0AArPHFZAiZRmUk9PVA'  # You can specify the folder ID if you want to start from a specific folder.
    desired_folder_id = '1wwOr5zIuwGWID7m4AW3SInh2M_GN-nwp'  # Replace with the ID of your desired folder.
    receiver=["amit@sutara.org","nikhilchoudhary@sutara.org"]
    owner = 'curiouslearning'
    repo = 'ftm-languagepacks'
    github_access_token="please enter your github access token"
    lang=getLanguage();
    missing_audios =set()
    missing_audios_in_drive=[]
    lanugageJsonPath='/run/media/amitsingh/New Volume/Sutara/NewProject/FeedTheMonsterJS/lang/'+lang+'/ftm_'+lang+'.json'
    is_json_generated= generate_json_from_levelgen(lang,shared_drive_id,root_folder_id);
    
    if  is_json_generated:
            language_data = import_language_json(lanugageJsonPath)

            feedback_words = ['amazing.mp3', 'fantastic1.mp3','fantastic.mp3', 'great1.mp3', 'amazing.mp3']
            unique_prompt_texts = find_unique_audio_urls(language_data)
            
            wav_unique_prompt_texts = find_unique_wav_audio_texts(unique_prompt_texts)
            
            
            # print(wav_unique_prompt_texts)
            output_folder=f'/run/media/amitsingh/New Volume/Sutara/NewProject/FeedTheMonsterJS/lang/{lang}/audios'
            
            # download_github_audios(owner,repo,"");
            
            missing_audios =  check_missing_audios(unique_prompt_texts,output_folder);
            missing_wav_audios=find_missing_wav_audios(missing_audios)
            
            if missing_audios:
                # print(f'Navigating to the desired location in the shared drive (Drive ID: {shared_drive_id}):')
                navigate_to_desired_location(shared_drive_id, root_folder_id, desired_folder_id)
                
            else:
                body=("Hey There!"
                  "You are now sucessfully able to generate a new language"
                  "You can see you language in the lang folder"
                  "Best")    
                inform_user_about_issue(receiver,"Sucessfully generated language",body)
    else :
            body=("Hey There!"
                  "Unable to generate New Json")
            inform_user_about_issue(receiver,"Levelgen generating error",body)        

