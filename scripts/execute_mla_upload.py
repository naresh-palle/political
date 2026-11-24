import os
import sys
sys.path.insert(0, os.getcwd())
import re
import json
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
import httpx
import time

SERVER_URL = "https://political-ddmj.onrender.com"
USER_ID = "usr-admin"
XLSX_PATH = r"C:\Users\narpal\.gemini\antigravity\brain\37c02349-68e5-45a7-8b95-7208550f340f\.user_uploaded\media_1795544387383_9ce7c47e.xlsx"

# Load packaged assemblies and parliaments
with open('backend/data/assemblies.json', 'r', encoding='utf-8') as f:
    assemblies_db = json.load(f)
with open('backend/data/parliaments.json', 'r', encoding='utf-8') as f:
    parliaments_db = json.load(f)

from backend.services.geo_districts import district_name_for_assembly, district_id_for

pc_by_id = {p['id']: p for p in parliaments_db}
ap_acs = {a['id']: a for a in assemblies_db if a.get('stateId') == 'AP'}

def norm_ac(s, leader_name=""):
    if not s:
        return ""
    s_clean = s.lower().strip()
    
    # Specific disambiguations
    if 'kamalapuram' in s_clean:
        return 'kamalapuram'
    if ('gannavaram' in s_clean and 'amalapuram' in s_clean) or 'p gannavaram' in s_clean or 'pgannavaram' in s_clean or 'p. gannavaram' in s_clean:
        return 'gannavaramamalapuram'
    if s_clean == 'amalapuram':
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
    name = re.sub(r'\(.*?\)', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    name_clean = name.replace('.', ' ')
    name_clean = re.sub(r'\s+', ' ', name_clean).strip().lower()
    
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
        'k.v. usha shricharan': 'k v usha shricharan',
        'ushashricharan': 'k v usha shricharan',
        'b. s. maqbool ahmed': 'maqbool bs',
        'maqbool bs': 'maqbool bs',
        'm. veeranjaneyulu': 'mannepakula veeranjaneyulu',
        'veeranjaneyulu': 'mannepakula veeranjaneyulu',
        'eera lakkappa': 'erra lakkappa',
        't. n. deepika': 'tn deepika',
        's. savitha': 's savitha',
        'm veeranjaneyulu': 'mannepakula veeranjaneyulu',
        'anantha venkatarami reddy': 'anantha venkata rami reddy',
        'm s raju': 'ms raju',
        't n deepika': 'tn deepika',
        'k v ushashri charan': 'k v usha shricharan',
        'b s maqbool ahmed': 'maqbool bs',
    }
    return synonyms.get(name_clean, name_clean)

def clean_url(plat, url, leader_name):
    if not url:
        if plat == 'fb' and 'uma shankar ganesh' in leader_name.lower():
            return 'https://www.facebook.com/petla.umashankarganesh'
        return ''
    url = url.strip()
    if 'nstagram.com' in url and 'instagram.com' not in url:
        url = url.replace('nstagram.com', 'instagram.com')
    if not url.startswith('http://') and not url.startswith('https://'):
        if '@' in url or '/' in url:
            if plat == 'fb': url = f'https://www.facebook.com/{url.lstrip("@")}'
            elif plat == 'ig': url = f'https://www.instagram.com/{url.lstrip("@")}'
            elif plat == 'x': url = f'https://x.com/{url.lstrip("@")}'
            elif plat == 'yt': url = f'https://www.youtube.com/{url}'
    return url

def load_and_merge():
    with zipfile.ZipFile(XLSX_PATH, 'r') as z:
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

    merged = {}
    for r_num, r in rows:
        raw_name = r.get('Leader Name', '').strip()
        raw_ac = r.get('Assembly Constituency', '').strip()
        norm_ac_key = norm_ac(raw_ac, raw_name)
        ac_obj = ac_lookup[norm_ac_key]
        ac_id = ac_obj['id']
        n_name = norm_name(raw_name)
        key = (ac_id, n_name)
        
        # Calculate district
        pc = pc_by_id.get(ac_obj.get('parliamentConstituencyId'))
        d_name = district_name_for_assembly(ac_obj, pc)
        d_id = district_id_for('AP', d_name)

        if key not in merged:
            merged[key] = {
                'assemblyConstituencyId': ac_id,
                'assemblyName': ac_obj['name'],
                'districtId': d_id,
                'districtName': d_name,
                'parliamentConstituencyId': ac_obj.get('parliamentConstituencyId'),
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
            existing = merged[key]
            existing['rows'].append(r_num)
            if not existing['partyId'] and r.get('Party'):
                existing['partyId'] = r.get('Party').strip().upper()
            if not existing['politicalRole'] and r.get('Political Role'):
                existing['politicalRole'] = r.get('Political Role').strip()
            if not existing['remarks'] and r.get('Remarks'):
                existing['remarks'] = r.get('Remarks').strip()

        item = merged[key]
        # FB
        fb_url = clean_url('fb', r.get('Facebook Profile URL', ''), raw_name)
        fb_fol = float(r.get('Facebook Followers', 0) or 0)
        fb_ver = r.get('Facebook Verified', '').strip().upper() == 'YES'
        if fb_url: item['fb']['url'] = fb_url
        if fb_fol > item['fb']['followers']: item['fb']['followers'] = int(fb_fol)
        if fb_ver: item['fb']['verified'] = True

        # IG
        ig_url = clean_url('ig', r.get('Instagram Profile URL', ''), raw_name)
        ig_fol = float(r.get('Instagram Followers', 0) or 0)
        ig_ver = r.get('Instagram Verified', '').strip().upper() == 'YES'
        if ig_url: item['ig']['url'] = ig_url
        if ig_fol > item['ig']['followers']: item['ig']['followers'] = int(ig_fol)
        if ig_ver: item['ig']['verified'] = True

        # X
        x_url = clean_url('x', r.get('X (Twitter) Profile URL', '') or r.get('X Profile URL', ''), raw_name)
        x_fol = float(r.get('X Followers', 0) or 0)
        x_ver = r.get('X Verified', '').strip().upper() == 'YES'
        if x_url: item['x']['url'] = x_url
        if x_fol > item['x']['followers']: item['x']['followers'] = int(x_fol)
        if x_ver: item['x']['verified'] = True

        # YT
        yt_url = clean_url('yt', r.get('YouTube Channel URL', ''), raw_name)
        yt_fol = float(r.get('YouTube Subscribers', 0) or 0)
        yt_ver = r.get('YouTube Verified', '').strip().upper() == 'YES'
        if yt_url: item['yt']['url'] = yt_url
        if yt_fol > item['yt']['followers']: item['yt']['followers'] = int(yt_fol)
        if yt_ver: item['yt']['verified'] = True

    return rows, merged

def execute_upload():
    raw_rows, merged_leaders = load_and_merge()
    print(f"==================================================")
    print(f"Total Raw Rows in Excel: {len(raw_rows)}")
    print(f"Total Unique Leaders Processed: {len(merged_leaders)}")
    print(f"Target Server: {SERVER_URL}")
    print(f"==================================================")

    leader_success = 0
    leader_failed = []
    social_success = 0
    social_failed = []

    # Use persistent HTTPX client with connection pooling
    limits = httpx.Limits(max_keepalive_connections=20, max_connections=30)
    with httpx.Client(timeout=30.0, limits=limits) as client:
        start_time = time.time()
        for idx, (key, l) in enumerate(merged_leaders.items(), 1):
            is_any_verified = any([l['fb']['verified'], l['ig']['verified'], l['x']['verified'], l['yt']['verified']])
            leader_payload = {
                "name": l["name"],
                "partyId": l["partyId"],
                "representativeType": l["representativeType"],
                "politicalRole": l["politicalRole"],
                "roles": [{"politicalRole": l["politicalRole"], "status": "CURRENT"}],
                "leaderKind": "SITTING_MLA" if l["politicalRole"].upper() == "MLA" else "INCHARGE",
                "currentFormerStatus": "CURRENT",
                "stateId": "AP",
                "districtId": l["districtId"],
                "assemblyConstituencyId": l["assemblyConstituencyId"],
                "parliamentConstituencyId": l["parliamentConstituencyId"],
                "verificationStatus": "VERIFIED" if is_any_verified else "PENDING",
                "dataSource": "CSV_IMPORT",
                "remarks": l["remarks"]
            }

            try:
                res = client.post(
                    f"{SERVER_URL}/api/pi/leaders?userId={USER_ID}",
                    json=leader_payload
                )
                if res.status_code in (200, 201):
                    saved_leader = res.json()
                    person_id = saved_leader.get("id")
                    leader_success += 1
                    print(f"[{idx}/{len(merged_leaders)}] ✓ Leader: {l['name']} ({l['partyId']}) in {l['assemblyName']} -> {person_id}")

                    # Upload social accounts
                    for plat in ['fb', 'ig', 'x', 'yt']:
                        plat_name = 'facebook' if plat == 'fb' else 'instagram' if plat == 'ig' else 'x' if plat == 'x' else 'youtube'
                        account_data = l[plat]
                        url = account_data['url']
                        fol = account_data['followers']
                        ver = account_data['verified']
                        if url:
                            acc_payload = {
                                "personId": person_id,
                                "platform": plat_name,
                                "profileUrl": url,
                                "followers": fol,
                                "verified": ver,
                                "verificationStatus": "VERIFIED" if ver else "PENDING"
                            }
                            acc_res = client.post(
                                f"{SERVER_URL}/api/pi/social-accounts?userId={USER_ID}",
                                json=acc_payload
                            )
                            if acc_res.status_code in (200, 201):
                                social_success += 1
                                print(f"       + {plat_name}: {fol} followers ({'VERIFIED' if ver else 'PENDING'})")
                            else:
                                err_msg = f"{acc_res.status_code}: {acc_res.text[:120]}"
                                social_failed.append({"leader": l["name"], "platform": plat_name, "url": url, "error": err_msg})
                                print(f"       ✗ {plat_name} failed: {err_msg}")
                else:
                    err_msg = f"{res.status_code}: {res.text[:120]}"
                    leader_failed.append({"leader": l["name"], "assembly": l["assemblyName"], "error": err_msg})
                    print(f"[{idx}/{len(merged_leaders)}] ✗ Leader failed: {l['name']} ({err_msg})")
            except Exception as e:
                leader_failed.append({"leader": l["name"], "assembly": l["assemblyName"], "error": str(e)})
                print(f"[{idx}/{len(merged_leaders)}] ✗ Leader exception: {l['name']} ({e})")

        elapsed = time.time() - start_time
        print(f"\n==================================================")
        print(f"UPLOAD SUMMARY (Completed in {elapsed:.1f}s)")
        print(f"==================================================")
        print(f"Total Raw Rows: {len(raw_rows)}")
        print(f"Total Unique Leaders Processed: {len(merged_leaders)}")
        print(f"Leaders Uploaded/Updated Successfully: {leader_success}")
        print(f"Leaders Failed: {len(leader_failed)}")
        print(f"Social Media Accounts Uploaded Successfully: {social_success}")
        print(f"Social Media Accounts Failed: {len(social_failed)}")
        print(f"==================================================")
        
        if leader_failed:
            print("\nFAILED LEADERS:")
            for f in leader_failed:
                print(f"  - {f['leader']} ({f['assembly']}): {f['error']}")

        if social_failed:
            print("\nFAILED SOCIAL ACCOUNTS:")
            for f in social_failed:
                print(f"  - {f['leader']} [{f['platform']}]: {f['url']} -> {f['error']}")

        # Save upload report to disk
        report = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "totalRawRows": len(raw_rows),
            "totalUniqueLeaders": len(merged_leaders),
            "leadersSuccess": leader_success,
            "leadersFailedCount": len(leader_failed),
            "leadersFailed": leader_failed,
            "socialSuccess": social_success,
            "socialFailedCount": len(social_failed),
            "socialFailed": social_failed,
            "elapsedSeconds": round(elapsed, 1)
        }
        with open("scripts/mla_upload_report.json", "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

if __name__ == "__main__":
    execute_upload()
