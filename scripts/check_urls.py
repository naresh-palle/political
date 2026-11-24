import sys, os
sys.path.insert(0, os.getcwd())
from scripts.test_merging import merged_leaders
import re

total_fb, total_ig, total_x, total_yt = 0, 0, 0, 0
bad_urls = []

for key, l in merged_leaders.items():
    for plat in ['fb', 'ig', 'x', 'yt']:
        url = l[plat]['url']
        fol = l[plat]['followers']
        if url or fol > 0:
            if plat == 'fb': total_fb += 1
            elif plat == 'ig': total_ig += 1
            elif plat == 'x': total_x += 1
            elif plat == 'yt': total_yt += 1
            
            # test basic url format
            if url:
                if plat == 'fb' and 'facebook.com' not in url and 'fb.com' not in url:
                    bad_urls.append((plat, url, l['name']))
                elif plat == 'ig' and 'instagram.com' not in url:
                    bad_urls.append((plat, url, l['name']))
                elif plat == 'x' and 'x.com' not in url and 'twitter.com' not in url:
                    bad_urls.append((plat, url, l['name']))
                elif plat == 'yt' and 'youtube.com' not in url and 'youtu.be' not in url:
                    bad_urls.append((plat, url, l['name']))

print(f"Total FB accounts: {total_fb}")
print(f"Total IG accounts: {total_ig}")
print(f"Total X accounts: {total_x}")
print(f"Total YT accounts: {total_yt}")
print(f"Total social accounts: {total_fb + total_ig + total_x + total_yt}")
print(f"Suspicious or irregular URLs: {len(bad_urls)}")
for plat, url, name in bad_urls:
    print(f"  [{plat}] {name}: '{url}'")
