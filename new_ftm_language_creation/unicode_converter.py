import json

# Read and re-write the JSON file
with open('lang/spanish/ftm_spanish.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('lang/spanish/ftm_spanish_new.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)