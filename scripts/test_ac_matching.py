import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
import json
import re

xlsx_path = r'C:\Users\narpal\.gemini\antigravity\brain\37c02349-68e5-45a7-8b95-7208550f340f\.user_uploaded\media_1795544387383_9ce7c47e.xlsx'

with open('backend/data/assemblies.json', 'r', encoding='utf-8') as f:
    assemblies_db = json.load(f)

ap_acs = {a['id']: a for a in assemblies_db if a.get('stateId') == 'AP'}
print(f"Total AP Assemblies in DB: {len(ap_acs)}")

def norm_ac(s):
    if not s:
        return ""
    s = s.lower()
    s = re.sub(r'\(sc\)|\(st\)', '', s)
    s = re.sub(r'[^a-z0-9]', '', s)
    # Common variations
    reps = {
        'rapthadu': 'raptadu',
        'hindupuram': 'hindupur',
        'rayadurgam': 'rayadurg',
        'chilakaluripeta': 'chilakaluripet',
        'macharla': 'macherla',
        'peddhakurapadu': 'pedakurapadu',
        'kovvurusc': 'kovvur',
        'kovvuru': 'kovvur',
        'rajamahendravaramcity': 'rajahmundrycity',
        'rajamahendravaramrural': 'rajahmundryrural',
        'rajahmundry': 'rajahmundrycity',
        'narsraopet': 'narasaraopet',
        'narasaraopeta': 'narasaraopet',
        'sattenapalle': 'sattenapalli',
        'yerragondapalem': 'yerragondapalem',
        'santhanuthalapadu': 'santhanuthalapadu',
        'kandukuru': 'kandukur',
        'kondapi': 'kondepi',
        'atmakuru': 'atmakur',
        'kovuru': 'kovur',
        'guduru': 'gudur',
        'sullurupeta': 'sullurpeta',
        'sullurpeta': 'sullurpeta',
        'pulivendhula': 'pulivendla',
        'praddatur': 'proddatur',
        'mydhukuru': 'mydukur',
        'nandikotkuru': 'nandikotkur',
        'patthikonda': 'pattikonda',
        'kodumuru': 'kodumur',
        'manthralayam': 'mantralayam',
        'alur': 'aluru',
        'aluru': 'aluru',
        'thamballapalle': 'thamballapalle',
        'srikalahasthi': 'srikalahasti',
        'sathyavedu': 'sathyavedu',
        'chittore': 'chittoor',
        'puthalpattu': 'puthalapattu',
        'palamneru': 'palamaner',
        'nuzividu': 'nuzvid',
        'chinthalapudi': 'chintalapudi',
        'thadikonda': 'tadikonda',
        'pratthipadu': 'prathipadu',
        'gunturwest': 'gunturwest',
        'guntureast': 'guntureast',
        'bheemili': 'bhimili',
        'vishakapatnameast': 'visakhapatnameast',
        'vishakapatnamsouth': 'visakhapatnamsouth',
        'vishakapatnamnorth': 'visakhapatnamnorth',
        'vishakapatnamwest': 'visakhapatnamwest',
        'visakhapatnam': 'visakhapatnam',
        'pendhurthi': 'pendurthi',
        'kalyanadurgam': 'kalyandurg',
        'peddhapuram': 'peddapuram',
        'mummadivaram': 'mummidivaram',
        'pgannavaram': 'gannavaram',
        'ananthapururban': 'anantapururban',
        'thadepalligudem': 'tadepalligudem',
        'nidadhavole': 'nidadavole',
        'nidadavolu': 'nidadavole',
        'kodur': 'railwaykodur',
        'railwaykoduru': 'railwaykodur'
    }
    return reps.get(s, s)

# Create lookup from normalized name to AC object
ac_lookup = {}
for a in ap_acs.values():
    clean_name = norm_ac(a['name'])
    ac_lookup[clean_name] = a

with zipfile.ZipFile(xlsx_path, 'r') as z:
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
            text_pieces = [t.text or '' for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]
            shared_strings.append(''.join(text_pieces))
    
    tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    sheet_data = tree.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData')
    
    headers = {}
    rows = []
    for row in sheet_data.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
        row_num = int(row.get('r'))
        row_dict = {}
        for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            col_letter = ''.join([ch for ch in c.get('r') if ch.isalpha()])
            t = c.get('t')
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            val = ''
            if v is not None and v.text is not None:
                if t == 's':
                    idx = int(v.text)
                    val = shared_strings[idx] if idx < len(shared_strings) else ''
                else:
                    val = v.text
            row_dict[col_letter] = val.strip()
        
        if row_num == 1:
            headers = row_dict
        else:
            if any(row_dict.values()):
                named_row = {headers.get(col, col): val for col, val in row_dict.items() if val}
                rows.append((row_num, named_row))

# Test AC mapping
unmatched_acs = set()
for r_num, r in rows:
    raw_ac = r.get('Assembly Constituency', '')
    normed = norm_ac(raw_ac)
    if normed not in ac_lookup:
        unmatched_acs.add((raw_ac, normed))

print(f"Unmatched ACs count: {len(unmatched_acs)}")
for raw, normed in sorted(unmatched_acs):
    print(f"  Raw: '{raw}' -> Normed: '{normed}'")
