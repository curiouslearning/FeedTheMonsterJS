import os
import sys
import shutil
language = sys.argv[1]

file_path = f'../lang/{language.lower()}/ftm_{language.lower()}.json'
source_file = f'../ftm_web_json/FTM{language}.json'
destination_file = f'../lang/{language.lower()}'
if os.path.isfile(file_path):
    print("File exists.")
else:
    print("File does not exist,creating...")
    os.makedirs(destination_file, exist_ok=True)
    shutil.copyfile(source_file, file_path)
