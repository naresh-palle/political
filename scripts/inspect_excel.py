import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
import json

xlsx_path = r'C:\Users\narpal\.gemini\antigravity\brain\37c02349-68e5-45a7-8b95-7208550f340f\.user_uploaded\media_1795544387383_9ce7c47e.xlsx'

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
    rows = {}
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
                rows[row_num] = named_row

print(f"Total rows: {len(rows)}")

for r_num in range(305, 335):
    if r_num in rows:
        r = rows[r_num]
        print(f"Row {r_num}: {r.get('Assembly Constituency')} | {r.get('Leader Name')} | Party: {r.get('Party')} | Role: {r.get('Political Role')} | FB: {bool(r.get('Facebook Profile URL'))}")
