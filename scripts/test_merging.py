import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
import json
import re

xlsx_path = r'C:\Users\narpal\.gemini\antigravity\brain\37c02349-68e5-45a7-8b95-7208550f340f\.user_uploaded\media_1795544387383_9ce7c47e.xlsx'

with open('backend/data/assemblies.json', 'r', encoding='utf-8') as f:
    assemblies_db = json.load(f)

ap_acs = {a['id']: a for a in assemblies_db if a.get('stateId') == 'AP'}

def norm_ac(s, leader_name=""):
    if not s:
        return ""
    raw = s.strip()
    s_clean = s.lower()
    
    # Specific disambiguations
    if 'kamalapuram' in s_clean:
        return 'kamalapuram'
    if ('gannavaram' in s_clean and 'amalapuram' in s_clean) or 'p gannavaram' in s_clean or 'pgannavaram' in s_clean or 'p. gannavaram' in s_clean:
        return 'gannavaramamalapuram'
    if s_clean.strip() == 'amalapuram':
        return 'amalapuram'
    if ('guntur' in s_clean and 'prathipadu' in s_clean) or 'pratthipadu' in s_clean or ('prathipadu' in s_clean and '(sc)' in s_clean) or 'burla' in leader_name.lower() or 'balasani' in leader_name.lower():
        return 'prathipaduguntur'
    if 'prathipadu' in s_clean:
        return 'prathipadu'
    if 'gannavaram' in s_clean:
        return 'gannavaram'
        
    s_clean = re.sub(r'\(sc\)|\(st\)', '', s_clean)
    s_clean = re.sub(r'[^a-z0-9]', '', s_clean)
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
        'ananthapururban': 'anantapururban',
        'thadepalligudem': 'tadepalligudem',
        'nidadhavole': 'nidadavole',
        'nidadavolu': 'nidadavole',
        'kodur': 'railwaykodur',
        'railwaykoduru': 'railwaykodur',
        'anakapalle': 'anakapalli',
        'bapatla': 'bapatlanorth',
        'icchapuram': 'ichchapuram',
        'kaikaluru': 'kaikalur',
        'narsannapeta': 'narasannapeta',
        'saluru': 'salur',
        'sarvepally': 'sarvepalli',
        'thanuku': 'tanuku',
        'tirupathi': 'tirupati'
    }
    return reps.get(s_clean, s_clean)

ac_lookup = {}
for a in ap_acs.values():
    clean_name = norm_ac(a['name'])
    ac_lookup[clean_name] = a

def norm_name(name):
    if not name:
        return ""
    # remove honorifics, titles, party suffixes in parens like (BJP)
    name = re.sub(r'\(.*?\)', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    # Normalize initials like "M. S. Raju" -> "ms raju", "N. Md. Farooq" -> "n md farooq"
    # replace dots with space
    name_clean = name.replace('.', ' ')
    name_clean = re.sub(r'\s+', ' ', name_clean).strip().lower()
    
    # Specific known phonetic spellings across rows
    synonyms = {
        'nandamuri blakrishna': 'nandamuri balakrishna',
        'kalava srinivas': 'kalava srinivasulu',
        'jc asmith reddy': 'j c asmit reddy',
        'j c asmith reddy': 'j c asmit reddy',
        'daggupati venkateshwara prasad': 'daggupati venkateswara prasad',
        'surendra babu amilineni': 'amilineni surendra babu',
        'paritala sree ram': 'paritala sreeram',
        'pusapati aditi viajayalakshmi': 'pusapati aditi vijayalakshmi',
        'viswasarayi kalavathi': 'viswasarayi kalavathi',
        'kethireddy venkartrami reddy': 'kethireddy venkatarami reddy',
        'kethi reddy peddha reddy': 'kethireddy pedda reddy',
        'chintakayala ayyanna patrudu': 'chintakayala ayyanna patrudu',
        'y vishweshwara reddy': 'y visweswara reddy',
        'y venkatarama reddy': 'y venkatrama reddy',
        'k.v. usha shricharan': 'k v ushashri charan',
        'ushashricharan': 'k v ushashri charan',
        'b. s. maqbool ahmed': 'maqbool bs',
        'maqbool bs': 'maqbool bs',
        'm veeranjaneyulu': 'mannepakula veeranjaneyulu',
        'anantha venkatarami reddy': 'anantha venkata rami reddy',
        'm s raju': 'ms raju',
        't n deepika': 'tn deepika',
        'k v ushashri charan': 'k v usha shricharan',
        'b s maqbool ahmed': 'maqbool bs',
        'veeranjaneyulu': 'mannepakula veeranjaneyulu',
        'eera lakkappa': 'erra lakkappa',
        't. n. deepika': 'tn deepika',
        's. savitha': 's savitha',
    }
    return synonyms.get(name_clean, name_clean)

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

print(f"Total rows: {len(rows)}")

# Deduplicate by key: (assembly_id, normalized_name)
merged_leaders = {}

for r_num, r in rows:
    raw_name = r.get('Leader Name', '').strip()
    raw_ac = r.get('Assembly Constituency', '').strip()
    norm_ac_key = norm_ac(raw_ac, raw_name)
    ac_obj = ac_lookup[norm_ac_key]
    ac_id = ac_obj['id']
    n_name = norm_name(raw_name)
    key = (ac_id, n_name)
    
    if key not in merged_leaders:
        merged_leaders[key] = {
            'assemblyConstituencyId': ac_id,
            'assemblyName': ac_obj['name'],
            'normalizedName': n_name,
            'name': raw_name,
            'partyId': r.get('Party', '').strip().upper(),
            'representativeType': r.get('Representative Type', '').strip().upper() or 'MLA',
            'politicalRole': r.get('Political Role', '').strip() or 'MLA',
            'leaderKind': r.get('Leader Status', '').strip() or 'SITTING_MLA',
            'rows': [r_num],
            'fb': {'url': '', 'followers': 0, 'verified': False},
            'ig': {'url': '', 'followers': 0, 'verified': False},
            'x': {'url': '', 'followers': 0, 'verified': False},
            'yt': {'url': '', 'followers': 0, 'verified': False},
            'monthlyPosts': 0,
            'monthlyAds': 0,
            'monthlyReach': 0,
            'remarks': r.get('Remarks', '').strip()
        }
    else:
        # Merge info into existing
        existing = merged_leaders[key]
        existing['rows'].append(r_num)
        if not existing['partyId'] and r.get('Party'):
            existing['partyId'] = r.get('Party').strip().upper()
        if not existing['politicalRole'] and r.get('Political Role'):
            existing['politicalRole'] = r.get('Political Role').strip()
        if not existing['remarks'] and r.get('Remarks'):
            existing['remarks'] = r.get('Remarks').strip()

    # Update social accounts
    item = merged_leaders[key]
    # FB
    fb_url = r.get('Facebook Profile URL', '').strip()
    fb_fol = float(r.get('Facebook Followers', 0) or 0)
    fb_ver = r.get('Facebook Verified', '').strip().upper() == 'YES'
    if fb_url:
        item['fb']['url'] = fb_url
    if fb_fol > item['fb']['followers']:
        item['fb']['followers'] = int(fb_fol)
    if fb_ver:
        item['fb']['verified'] = True

    # IG
    ig_url = r.get('Instagram Profile URL', '').strip()
    ig_fol = float(r.get('Instagram Followers', 0) or 0)
    ig_ver = r.get('Instagram Verified', '').strip().upper() == 'YES'
    if ig_url:
        item['ig']['url'] = ig_url
    if ig_fol > item['ig']['followers']:
        item['ig']['followers'] = int(ig_fol)
    if ig_ver:
        item['ig']['verified'] = True

    # X
    x_url = r.get('X (Twitter) Profile URL', '').strip() or r.get('X Profile URL', '').strip()
    x_fol = float(r.get('X Followers', 0) or 0)
    x_ver = r.get('X Verified', '').strip().upper() == 'YES'
    if x_url:
        item['x']['url'] = x_url
    if x_fol > item['x']['followers']:
        item['x']['followers'] = int(x_fol)
    if x_ver:
        item['x']['verified'] = True

    # YT
    yt_url = r.get('YouTube Channel URL', '').strip()
    yt_fol = float(r.get('YouTube Subscribers', 0) or 0)
    yt_ver = r.get('YouTube Verified', '').strip().upper() == 'YES'
    if yt_url:
        item['yt']['url'] = yt_url
    if yt_fol > item['yt']['followers']:
        item['yt']['followers'] = int(yt_fol)
    if yt_ver:
        item['yt']['verified'] = True

    # Monthly
    posts = float(r.get('Monthly Posts', 0) or 0)
    ads = float(r.get('Monthly Ads', 0) or 0)
    reach = float(r.get('Monthly Reach', 0) or 0)
    if posts > item['monthlyPosts']:
        item['monthlyPosts'] = int(posts)
    if ads > item['monthlyAds']:
        item['monthlyAds'] = int(ads)
    if reach > item['monthlyReach']:
        item['monthlyReach'] = int(reach)

print(f"Total merged distinct leader records: {len(merged_leaders)}")

# Check any leaders missing party
missing_party = [l for l in merged_leaders.values() if not l['partyId']]
print(f"Leaders missing party: {len(missing_party)}")
for l in missing_party:
    print(f"  AC: {l['assemblyName']} ({l['assemblyConstituencyId']}) | Name: {l['name']} | Rows: {l['rows']}")
