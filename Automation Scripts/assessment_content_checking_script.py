import functions_framework
import re
import unicodedata
import requests
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import os
import functions_framework
import codecs
import random
import googleapiclient
import googleapiclient.errors
from datetime import datetime
import xml.etree.ElementTree as ET
import os
import json
import csv
import pygsheets
import unicodedata
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.discovery import build
root_drive_id="0AArPHFZAiZRmUk9PVA"
drive_folder_id = "16mfArt7NQds_jTYPYAp_Hp7thkQ3SD8v"
teamid = "0AArPHFZAiZRmUk9PVA"
## client secrets location
sec_file = './credentials.json'
# The Google Drive API version to use.
API_VERSION = 'v3'
present_audios=set()
missing_assessment_audios=set()
feedback_audios={'fantastic','great','amazing'}
# Create a service account credentials object.
credentials = service_account.Credentials.from_service_account_file(
    sec_file, scopes=['https://www.googleapis.com/auth/drive'])

# Create a Drive API service.
drive_service = build('drive', API_VERSION, credentials=credentials)

@functions_framework.http
def assessment_content_check(request):
    """HTTP Cloud Function.
    Args:
        request (flask.Request): The request object.
    Returns:
        The response text, or any set of values that can be turned into a
        Response object using `make_response`.
    """
    
    
    gc = pygsheets.authorize(service_file=sec_file)
    # gc.drive.enable_team_drive(teamid);

    request_json = request.get_json(silent=True)
    request_args = request.args
    receiver=["amit@sutara.org","nikhilchoudhary@sutara.org"]
    
    body = "Hello,\n\n"
    if request_json and "sheet_id" in request_json:
        sheet_id = request_json["sheet_id"]  
    else:
        sheet_id = request.args.get("sheet_id", "English")
        
        lang =request.args.get("lang", "English")
         
    subject=lang+"  "+"Assessment Survey Content Check Report"
    assesment_data=get_assessment_data(gc,sheet_id)
    if not assesment_data:
        body="There was error while generating json,\n Make sure that the language name is correct" 
        inform_user_about_updates(receiver,subject,body)
    assesment_data= assesment_data.union(feedback_audios)
    check_missing_audio_assets_in_drive(drive_service, root_drive_id,root_drive_id,assesment_data,lang,depth=0)
    missing_assessment_audios=assesment_data-present_audios
    if not missing_assessment_audios:        
        body="Sucess,\n All the Assessment Audios are available!" 
        inform_user_about_updates(receiver,subject,body) 
    else:
        body="Checking for audios are done,\n Here's the list of missing audios in assessment!" 
        body+="\n".join(missing_assessment_audios)
        inform_user_about_updates(receiver,subject,body)
    return f"missing audios in google drive-->{body}"

def get_assessment_data(gc, sheet_id):
    # connect to the spreadsheet
    fetched_sheet = gc.open_by_key(sheet_id)
    fetched_content = fetched_sheet[1].get_values("B1","B150")
    unique_content=get_unique_content(fetched_content)
    return unique_content



def get_unique_content(fetched_content):
    unique_characters = set()
    for sublist in fetched_content:
      for item in sublist:
        item = unicodedata.normalize('NFKD',item)
        item=item.strip()
        unique_characters.update(item.split(','))
    return unique_characters

def check_missing_audio_assets_in_drive(drive_service, root_drive_id,drive_id,assesment_data,lang,depth ):
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': root_drive_id,
        'q': f"'{drive_id}' in parents and mimeType = 'application/vnd.google-apps.folder'",
    }
    results = drive_service.files().list(**query_params).execute()
    contents = results.get('files', [])
    try:
    
        for i, content in enumerate(contents, start=1):
            print('  ' * depth + f'{content["name"]} ({content["id"]})')
            if content["id"] =="1241p6yE0at78OZVdTewJSWS6XdjPjx93":
                check_missing_audio_assets_in_drive(drive_service,root_drive_id,content["id"],assesment_data,lang,depth+1)
            elif content["id"]=="16mfArt7NQds_jTYPYAp_Hp7thkQ3SD8v":
               check_feedback_audios_in_drive(drive_service,root_drive_id,content["id"],assesment_data,lang,depth+1)
               check_audios_in_folder(drive_service,root_drive_id,content["id"],assesment_data,lang,depth+1)
            
    except googleapiclient.errors.HttpError as e:
        error_details = e._get_reason()
        if 'notFound' in error_details:
            print("Shared drive not found. Skipping...")
        else:
            # Handle other types of errors
            print("An error occurred:", error_details)        
                         
    
    

def check_audios_in_folder(drive_service, root_drive_id,drive_id,assesment_data,lang,depth):

    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': root_drive_id,
        'pageSize':500,
        'q': f"'{drive_id}' in parents and mimeType = 'application/vnd.google-apps.folder'",
    }
    results = drive_service.files().list(**query_params).execute()
    contents = results.get('files', [])
    for i, content in enumerate(contents, start=1):
        print('  ' * depth + f'{content["name"]} ({content["id"]})')
        if content["id"]=="1_OKwBPcv9PQqp8v-L4sNTFhX0tF6NtgH":
            check_audios_in_folder(drive_service, root_drive_id,content["id"],assesment_data,lang,depth)
            
        if lang.lower() ==content["name"].lower():
            if content['mimeType'] == 'application/vnd.google-apps.folder':
               check_audios_in_lang_folder(drive_service, root_drive_id,content["id"],assesment_data,lang,depth)
            

def check_audios_in_lang_folder(drive_service, root_drive_id,drive_id,assesment_data,lang,depth ):
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': root_drive_id,
        'pageSize':500,
        'q': f"'{drive_id}' in parents ",
    }
    results = drive_service.files().list(**query_params).execute()
    contents = results.get('files', [])
    for i, content in enumerate(contents, start=1):
        if content['mimeType'] == 'application/vnd.google-apps.folder':
           check_audios_in_lang_folder(drive_service, root_drive_id,content["id"],assesment_data,lang,depth)
        else :
            
          compare_audios_in_lang_folder(content["name"].lower(),assesment_data)   
        

def compare_audios_in_lang_folder(file_name,assesment_data):
    file_name, extension = os.path.splitext(file_name)
    file_name=unicodedata.normalize("NFKD",file_name)
    file_name=re.sub(r'[0-9\s]', '', file_name)
    if file_name in assesment_data and file_name not in present_audios:
        present_audios.add(file_name)
        

def check_feedback_audios_in_drive(drive_service, root_drive_id,drive_id,assesment_data,lang,depth ):
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': root_drive_id,
        'q': f"'{drive_id}' in parents and mimeType = 'application/vnd.google-apps.folder'",
    }
    results = drive_service.files().list(**query_params).execute()
    contents = results.get('files', [])
    for i, content in enumerate(contents, start=1):
        print('  ' * depth + f'{content["name"]} ({content["id"]})'+">>>>>>")
        if content["id"]=="1cDNqpl6hpponslP8XFAc37BNlZv3bW4X" or content["id"]=="1eXmu1e8G7l881tHB-g6zL9FBPMmlNvI3" or content["id"]=="1qhKKLccb2jznBY070Cq4h5ozL41EweSk":
            check_feedback_audios_in_drive(drive_service,root_drive_id,content["id"],assesment_data,lang,depth+1)


        if lang.lower() == content["name"].lower():
           list_missing_feedback_audios(drive_service,root_drive_id,content["id"],assesment_data,lang,depth+1)

def list_missing_feedback_audios(drive_service, root_drive_id,drive_id,assesment_data,lang,depth):
    available_feedback_audios={}
    query_params = {
        'supportsAllDrives': True,
        'includeItemsFromAllDrives': True,
        'corpora': 'drive',
        'driveId': root_drive_id,
        'pageSize':500,
        'q': f"'{drive_id}' in parents ",
    }
    results = drive_service.files().list(**query_params).execute()
    contents = results.get('files', [])
    for i, content in enumerate(contents, start=1):
        filename, extension = os.path.splitext(content["name"].lower())
        if filename in feedback_audios and filename not in available_feedback_audios:
            present_audios.add(filename)
        
        

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
     
    

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.ehlo()
        server.login(gmail_user, gmail_app_password)
        server.sendmail(gmail_user, receiver, msg.as_string())
        server.close()
        
        print('Email sent!')
    except Exception as exception:
        inform_user_about_updates(receiver,"Error in Building Lamguage",e)
        print("Error: %s!\n\n" % exception)