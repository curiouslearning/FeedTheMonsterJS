import requests
from google.cloud import bigquery
import json
from datetime import datetime

# Define the credentials path outside of any function
credentials_path = 'D:\curious leraning\FeedTheMonsterJS\Automation Scripts\credentials.json'  # Replace with the actual path to your credentials file

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
    # Explicitly provide credentials for BigQuery client
    with open(credentials_path) as f:
        credentials_info = json.load(f)
    
    client = bigquery.Client.from_service_account_info(credentials_info)
    today_date = datetime.now().strftime('%Y%m%d')
    # Check if level_completed event is logged
    query = f"""
    SELECT * FROM `ftm-b9d99.analytics_159643920.events_intraday_{today_date}`
    WHERE event_name="level_completed"
    """
    query_job = client.query(query)
    
    # Fetch all results using pagination
    result = query_job.result()
    rows = list(result)  # Convert the result iterator to a list
    # Now iterate over the rows and perform checks
    for row in rows:
        event_params = row.get('event_params', [])  # Use get() to handle missing key
        required_keys = {'success_or_failure', 'number_of_successful_puzzles', 'level_number', 'profile_number','ftm_language', 'version_number', 'json_version_number', 'duration'}
    # Check if all required keys are present
        present_keys = [param['key'] for param in event_params]
        
        # Check if all required keys are present
        missing_keys = []
        for key in required_keys:
            if key not in present_keys:
                missing_keys.append(key)
        
        if missing_keys:
            send_slack_notification("QA Test Failure: Missing one or more required keys in event parameters.", missing_keys)
            return
        for param in event_params:
            key = param['key']
            value = param['value']
            # Check if the key is 'level_number' and int_value is None
            if key == 'success_or_failure':
                # Check if int_value exists and if the value is None
                if 'string_value' in value and value['string_value'] is None:
                    send_slack_notification("QA Test Failure: success_or_failure should be an string. Possibly missing or not an string.")
                    return
            elif key == 'number_of_successful_puzzles':
                # Check if int_value exists and if the value is None
                if 'int_value' in value and value['int_value'] is None:
                    send_slack_notification("QA Test Failure: number_of successful_puzzles should be an integer. Possibly missing or not an integer.")
                    return
            elif key == 'level_number':
                # Check if int_value exists and if the value is None
                if 'int_value' in value and value['int_value'] is None:
                    send_slack_notification("QA Test Failure: level_number should be an integer. Possibly missing or not an integer")
                    return
            elif key == 'profile_number':
                # Check if int_value exists and if the value is None
                if 'int_value' in value and value['int_value'] is None:
                    send_slack_notification("QA Test Failure: profile_number should be an integer. Possibly missing or not an integer")
                    return
            elif key == 'cr_user_id':
                # Check if int_value exists and if the value is None
                if 'string_value' in value and value['string_value'] is None:
                    send_slack_notification("QA Test Failure: cr_user_id should be an string. Possibly missing or not an string")
                    return
            elif key == 'ftm_language':
                # Check if int_value exists and if the value is None
                if 'string_value' in value and value['string_value'] is None:
                    send_slack_notification("QA Test Failure: ftm_language should be an string. Possibly missing or not an string")
                    return
            elif key == 'version_number':
                # Check if int_value exists and if the value is None
                if 'string_value' in value and value['string_value'] is None:
                    send_slack_notification("QA Test Failure: version_number should be an string. Possibly missing or not an string")
                    return
            elif key == 'json_version_number':
                # Check if int_value exists and if the value is None
                if 'double_value' in value and value['double_value'] is None:
                    send_slack_notification("QA Test Failure: json_version_number should be an double. Possibly missing or not an double")
                    return
            elif key == 'duration':
                # Check if int_value exists and if the value is None
                if 'double_value' in value and value['double_value'] is None:
                    send_slack_notification("QA Test Failure: duration should be an double. Possibly missing or not an double")
                    return
    # If all checks passed, send success notification
    send_slack_notification("QA Test Success: All QA tests passed successfully.")

# Run QA tests
run_qa_tests()
