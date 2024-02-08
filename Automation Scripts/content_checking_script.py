import functions_framework
import re
import unicodedata
import requests
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.discovery import build



@functions_framework.http
def content_verification(request):
    """HTTP Cloud Function.
    Args:
        request (flask.Request): The request object.
    Returns:
        The response text, or any set of values that can be turned into a
        Response object using `make_response`.
    """
    request_json = request.get_json(silent=True)
    request_args = request.args
    shared_drive_id = '0AArPHFZAiZRmUk9PVA'
    root_folder_id = '0AArPHFZAiZRmUk9PVA'  # You can specify the folder ID if you want to start from a specific folder.
    desired_folder_id = '1wwOr5zIuwGWID7m4AW3SInh2M_GN-nwp'   # Replace with the ID of your desired folder.
    receiver=["amit@sutara.org","sgottwald@curiouslearning.org", "bburrage@curiouslearning.org"]
    
    body = "Hello,\n\n"
    if request_json and "name" in request_json:
        name = request_json["name"]
    elif request_args and "name" in request_args:
        name = request_args["name"]
    else:
        lang = request.args.get("lang", "English")
        subject=lang+"  "+"Feed the Monster Automation Report"
        json_data=get_json_data(lang,shared_drive_id,root_folder_id)
        if not json_data:
            body="There was error while generating json,\n Make sure that the language name is correct"
            inform_user_about_updates(receiver,subject,body)
            return
        
        print("Json Data Generated sucessfully")
        # prompt_text=find_unique_audio_urls(json_data)
        prompt_text =find_prompt_audios(json_data)
        print(prompt_text)
        if not prompt_text:
            body="There was error while generating json,\n Make sure that the language name is correct"
            inform_user_about_updates(receiver,subject,body)
            return
        
        wav_prompt_text=find_unique_wav_audio_texts(prompt_text)
        m4a_prompt_text=get_m4a_prompt_texts(prompt_text)
        print(m4a_prompt_text)
        output= check_in_drive(shared_drive_id,root_folder_id,desired_folder_id,prompt_text,wav_prompt_text,m4a_prompt_text,lang)
        if not output and json_data:
            body += "JSON generation process is successful.\n"
            body += "Checking for audios is done. \n The Language is ready to be build"
            inform_user_about_updates(receiver,subject,body)
            
        else:    
            body += "JSON generation process is successful.\n"
            body += "Checking for audios is done. Here is the list of missing audios:\n"
            body += "\n".join(output) 
            inform_user_about_updates(receiver,subject,body)


    return f"missing audios in google drive-->{body}"

                        
                        
def find_prompt_audios(data, prompt_audio_urls=None):
    feedback_words = ['amazing.mp3', 'fantastic.mp3', 'great1.mp3', 'amazing.mp3']
    if prompt_audio_urls is None:
        prompt_audio_urls = set()
        
    for feedback in feedback_words:
        prompt_audio_urls.add(feedback)
    try:
       
            
        if "Levels" in data:
                for level in data["Levels"]:
                    if "Puzzles" in level:
                        for puzzle in level["Puzzles"]:
                            if "prompt" in puzzle and "PromptAudio" in puzzle["prompt"]:
                                prompt_audio_url = puzzle["prompt"]["PromptAudio"]
                                if os.path.basename(prompt_audio_url) not in prompt_audio_urls:
                                    prompt_text=unicodedata.normalize('NFKD', os.path.basename(prompt_audio_url))
                                    prompt_audio_urls.add(prompt_text)

        if "FeedbackAudios" in data:
                for feedbackAudioUrl in data["FeedbackAudios"]:
                    if os.path.basename(feedbackAudioUrl) not in prompt_audio_url:
                        feedback_text=unicodedata.normalize('NFKD',os.path.basename(feedbackAudioUrl))
                        prompt_audio_urls.add(feedback_text)
            
        return prompt_audio_urls
    except Exception as e:
        print("Error finding prompt audios:", e)
        return prompt_audio_urls


def find_unique_wav_audio_texts(unique_prompt_texts):
    wav_prompt_texts=set()
    for prompt_text in unique_prompt_texts:
        wav_prompt = prompt_text.replace(".mp3", ".wav")
        wav_prompt_texts.add(wav_prompt)
    return wav_prompt_texts

def get_m4a_prompt_texts(unique_prompt_texts):
    m4a_prompt_texts=set()
    for prompt_text in unique_prompt_texts:
        m4a_prompt = prompt_text.replace(".mp3", ".m4a")
        m4a_prompt_texts.add(m4a_prompt)
    return m4a_prompt_texts











# Path to the JSON key file you downloaded when setting up the service account.
KEY_FILE = './credentials.json'
missing_audios_on_drive= set()
present_audios_on_drive= set()
# The Google Drive API version to use.
API_VERSION = 'v3'

# Create a service account credentials object.
credentials = service_account.Credentials.from_service_account_file(
    KEY_FILE, scopes=['https://www.googleapis.com/auth/drive'])

# Create a Drive API service.
drive_service = build('drive', API_VERSION, credentials=credentials)


def download_audio_files(drive_id,folder_id,fileName,lang,wav_unique_prompt_texts,m4a_prompt_text,unique_prompt_texts,depth=0):
    # # Query for audio files in the selected folder
    
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': drive_id,
        'pageSize':500,
        'q': f"'{folder_id}' in parents ",
    }
    
    results = drive_service.files().list(**query_params).execute()
    
    audio_files = results.get('files', [])
    if not audio_files:
        return
    
    
    count=0
    # Loop through the audio files and download each one
    for audio_file in audio_files:
        count =count+1
        file_name = audio_file["name"].lower()
        file_id = audio_file["id"]
        file_name=get_correct_file_name(file_name)
        file_name=unicodedata.normalize('NFKD', file_name)
        print(str(count)+"___"+file_name+" "+"checking in"+" "+fileName)   
                
                
        
        if file_name in wav_unique_prompt_texts or file_name in unique_prompt_texts  or file_name in m4a_prompt_text:
            if file_name not in present_audios_on_drive:
                name=file_name.lower()
                
    
                if name.endswith('.wav'):
                    new_file_name=name.replace(".wav", ".mp3")
                    present_audios_on_drive.add(new_file_name)
                elif name.endswith(".m4a"):
                    new_file_name=name.replace(".m4a", ".mp3")
                    present_audios_on_drive.add(new_file_name)
                elif name.endswith('.mp3'):
                    present_audios_on_drive.add(name)
                
                        

def get_correct_file_name(name):
    filename, extension = os.path.splitext(name)
    print(">>>>>>>>>>>",extension)
    keywords_to_remove = ["_feedback", "_sound", "_word", "_syllable", "_memory",".wav",".mp3"]
    if filename == "fantastic1.wav" or filename == "fantastic1.mp3" or filename == "fantastic1_feedback.wav" or filename == "fantastic1_feedback.mp3":
        filename = "fantastic.wav"
        print(filename+"<<<<<<<<<<<")
                        

        
    for keyword in keywords_to_remove:
        if keyword in filename:
            filename = filename.replace(keyword, "")
            
    filename=re.sub(r'[\d_]', '', filename)+extension
    filename=" ".join(filename.split())
            
    print(">>>>>>>>>>>>>",filename)
    return filename.lower()






def list_contents_and_download(drive_id, folder_id,lang,wav_unique_prompt_texts,m4a_prompt_text,unique_prompt_texts, depth=0):
    # Query for contents in the selected folder
    
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': drive_id,
        'pageSize':500,
        'q': f"'{folder_id}' in parents ",
    }
    
    results = drive_service.files().list(**query_params).execute()
    contents = results.get('files', [])

    # Create the output folder if it doesn't exist
    

    for content in contents:
        print('  ' * depth + f'{content["name"].lower()} ({content["id"]})')
        if content['mimeType'] == 'application/vnd.google-apps.folder':
            # If it's a folder, call the function recursively
            list_contents_and_download(drive_id, content['id'],lang,wav_unique_prompt_texts,m4a_prompt_text,unique_prompt_texts, depth + 1)
        
            
        download_audio_files(drive_id, content['id'],content['name'].lower(),lang,wav_unique_prompt_texts,m4a_prompt_text,unique_prompt_texts,depth+1)


def list_english_content(drive_id, folder_id,unique_prompt_texts,lang,wav_unique_prompt_texts,m4a_prompt_text, depth):
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': drive_id,
        'q': f"'{folder_id}' in parents",
    }
    if lang == "austrailianenglish":
        lang="englishaustralian"
        
    if lang=="indianenglish":
        lang="englishindian"
        
    if lang  =="saenglish":
        lang="southafricaenglish"
                
    results = drive_service.files().list(**query_params).execute()
    contents = results.get('files', [])

    for i, content in enumerate(contents, start=1):
        print('  ' * depth + f'{content["name"]} ({content["id"]})')
        content_name=content["name"].lower()
        processed_string = content_name.replace(" ", "").replace("-", "").lower()
        if lang in processed_string:
            list_contents_and_download(drive_id,content["id"],lang,wav_unique_prompt_texts,m4a_prompt_text,unique_prompt_texts,depth+1)

def list_contents_of_folder(drive_id, folder_id,unique_prompt_texts,lang,wav_unique_prompt_texts,m4a_prompt_text, depth=0):
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
        print('  ' * depth +" inside of folder"+ f'{content["name"]} ({content["id"]})')
        content_name=content["name"].lower()
        if "english" in content_name:
            list_english_content(drive_id, content["id"],unique_prompt_texts,lang,wav_unique_prompt_texts,m4a_prompt_text, depth + 1)
        
        if lang in content_name:
            list_contents_and_download(drive_id,content["id"],lang,wav_unique_prompt_texts,m4a_prompt_text,unique_prompt_texts,depth+1)
        
    

def check_in_drive(drive_id, folder_id, desired_folder_id,unique_prompt_texts,wav_unique_prompt_texts,m4a_prompt_text,lang,depth =0):
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
            # You've reached the desired folder, now you can list its contents or perform any desired actions.
            list_contents_of_folder(drive_id, folder["id"],unique_prompt_texts,lang,wav_unique_prompt_texts,m4a_prompt_text, depth + 1)
           
                        
        else:
            if folder["id"]=="1241p6yE0at78OZVdTewJSWS6XdjPjx93" or folder["id"]=="1lsbOukZZTFGJI8tTMRGDTi1QpuiAGJaR" or folder["id"]=="1dVw3lRUcP0vHP8qGhGqeHmG0Elflx2HY" or folder["id"]=="1xTln0bFAGJe3hhWu_KdpdQb7gQcSAktG":
                check_in_drive(drive_id, folder['id'], desired_folder_id,unique_prompt_texts,wav_unique_prompt_texts,m4a_prompt_text,lang, depth + 1)
    
    missing_audios_on_drive =unique_prompt_texts-present_audios_on_drive            
    return missing_audios_on_drive












#####################################



# Path to the JSON key file you downloaded when setting up the service account.
KEY_FILE = './credentials.json'

# The Google Drive API version to use.
API_VERSION = 'v3'

# Create a service account credentials object.
credentials = service_account.Credentials.from_service_account_file(
    KEY_FILE, scopes=['https://www.googleapis.com/auth/drive'])

# Create a Drive API service.
drive_service = build('drive', API_VERSION, credentials=credentials)


def get_json_data(lang,drive_id,folder_id,depth=0):
    
    is_json_generated= list_initial_files(drive_id,"18SRLdZK-n2QismpXY1Cn-FFqrJutIU8I",depth+1,lang)
    return is_json_generated
    




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
        file_name=content["name"].lower()
        if file_name == lang:
          is_generation_sucessful=  generate_json_file(lang,content["id"]);
          return is_generation_sucessful
            
    

def generate_json_file(lang,id):
    url = 'https://us-central1-ftm-b9d99.cloudfunctions.net/hello-world?act=generate&sheet='+id
    
    
    response = requests.get(url)

# Check if the request was successful (status code 200)
    if response.status_code == 200:
    # Parse the JSON content
        json_data = response.json()
        
    
        result =ProcessLookupError(json_data)

        return json_data
    else:
        print(f"Failed to fetch JSON data. Status code: {response.status_code}")
        return  null

    
def process_data(json_data):
    # Example operation: Summing values in a list
    if 'values' in json_data and isinstance(json_data['values'], list):
        total = sum(json_data['values'])
        return total
    else:
        return "Invalid JSON format"
    







#######################################################

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication


def inform_user_about_updates(receiver,subject,body):
    # Replace these with your Gmail account details and email content
    gmail_user = 'amit@sutara.org'
    gmail_app_password = 'pjwt jlkx weuj dzwg'
     # Create a multipart message
    msg = MIMEMultipart()
    msg['From'] = gmail_user
    msg['To'] = ', '.join(receiver)
    msg['Subject'] = subject

    # Add the body of the email
    msg.attach(MIMEText(body, 'plain'))
    # Generate the report
    # report_content = f"Missing audios in google drive-->\n{body}"
     
    

    try:
        # msg.attach(MIMEText(report_content, 'plain'))
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.ehlo()
        server.login(gmail_user, gmail_app_password)
        server.sendmail(gmail_user, receiver, msg.as_string())
        server.close()
        
        print('Email sent!')
    except Exception as exception:
        inform_user_about_updates(receiver,"Error in Building Lamguage",e)
        print("Error: %s!\n\n" % exception)