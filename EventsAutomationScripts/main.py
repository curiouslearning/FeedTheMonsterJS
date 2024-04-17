import functions_framework
import re
import unicodedata
import requests
import os
import requests
from google.cloud import bigquery
import json
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.discovery import build
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
@functions_framework.http
def level_completed_event_check(request):
    """HTTP Cloud Function.
    Args:
        request (flask.Request): The request object.
    Returns:
        The response text, or any set of values that can be turned into a
        Response object using `make_response`.
    """
    request_json = request.get_json(silent=True)
    request_args = request.args
    
    run_qa_tests()
    return "Event check completed."
    
    
credentials_path = 'credentials.json'  # Replace with the actual path to your credentials file
# Function to send Slack notification
def send_slack_notification(*args):
    webhook_url = 'https://hooks.slack.com/services/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'  # Replace with your Slack webhook URL
    message = args[0]
    missing_keys = args[1] if len(args) > 1 else None
    if missing_keys:
        message += f"\nMissing keys: {', '.join(missing_keys)}"
    payload = {
        "text": message
    }
    response = requests.post(webhook_url, json=payload)
    if response.status_code != 200:
        print(f"Failed to send Slack notification. Status code: {response.status_code}")
# Function to run QA tests
def run_qa_tests():
    with open(credentials_path) as f:
        credentials_info = json.load(f)
    
    client = bigquery.Client.from_service_account_info(credentials_info)
    today_date = datetime.now().strftime('%Y%m%d')
    query = f"""
    SELECT * FROM `ftm-b9d99.analytics_159643920.events_intraday_{today_date}`
    WHERE event_name="level_completed"
    """
    query_job = client.query(query)
    result = query_job.result()
    rows = list(result)  
    # Now iterate over the rows and perform checks
    for row in rows:
        event_params = row.get('event_params', [])  # Use get() to handle missing key
        required_keys = {'success_or_failure', 'number_of_successful_puzzles', 'level_number', 'profile_number','ftm_language', 'version_number', 'json_version_number', 'duration'}
        present_keys = [param['key'] for param in event_params]
        
        # Check if all required keys are present
        missing_keys = []
        for key in required_keys:
            if key not in present_keys:
                missing_keys.append(key)
        if missing_keys:
            send_slack_notification(" level_completed QA Test Failure: Missing one or more required keys in event parameters.", missing_keys)
            
        for param in event_params:
            key = param['key']
            value = param['value']
            if key == 'success_or_failure':
                if 'string_value' in value and value['string_value'] is None:
                    send_slack_notification("level_completed QA Test Failure: success_or_failure should be a string. Possibly missing or not a string.")
                    
            elif key == 'number_of_successful_puzzles':
                if 'int_value' in value and value['int_value'] is None:
                    send_slack_notification("level_completed QA Test Failure: number_of successful_puzzles should be an integer. Possibly missing or not an integer.")
                    
            elif key == 'level_number':
                if 'int_value' in value and value['int_value'] is None:
                    send_slack_notification("level_completed QA Test Failure: level_number should be an integer. Possibly missing or not an integer")
                    
            elif key == 'profile_number':
                if 'int_value' in value and value['int_value'] is None:
                    send_slack_notification("level_completed QA Test Failure: profile_number should be an integer. Possibly missing or not an integer")
                    
            elif key == 'cr_user_id':
                if 'string_value' in value and value['string_value'] is None:
                    send_slack_notification("level_completed QA Test Failure: cr_user_id should be a string. Possibly missing or not a string")
                    
            elif key == 'ftm_language':
                if 'string_value' in value and value['string_value'] is None:
                    send_slack_notification("level_completed QA Test Failure: ftm_language should be a string. Possibly missing or not a string")
                    
            elif key == 'version_number':
                if 'string_value' in value and value['string_value'] is None:
                    send_slack_notification("level_completed QA Test Failure: version_number should be a string. Possibly missing or not a string")
                    
            elif key == 'json_version_number':
                if 'double_value' in value and value['double_value'] is None:
                    send_slack_notification("level_completed QA Test Failure: json_version_number should be a double. Possibly missing or not a double")
                    
            elif key == 'duration':
                if 'double_value' in value and value['double_value'] is None:
                    send_slack_notification("level_completed QA Test Failure: duration should be a double. Possibly missing or not a double")
                    
    # If all checks passed, send success notification
    # send_slack_notification("level Completed QA Test Success: All QA tests passed successfully.")











