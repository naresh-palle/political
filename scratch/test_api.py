import urllib.request

url = "https://political-ddmj.onrender.com/api/pi/constituencies/AP-AC-132/audience-estimates?radius=0&userId=usr-sma"
try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode()
        print("Live Render Status Code:", resp.status)
        print("Raw response (first 300 chars):", repr(raw[:300]))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.read().decode())
except Exception as e:
    print("Other error:", e)
