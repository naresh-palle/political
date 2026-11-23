"""
Bulk CSV Leader Records Importer for Leaders Lens
Imports MLA, MP, and MLC CSV records directly into the platform database.
Can run locally or post to the live production server.
"""

import sys
import os
import csv
import json
import re
import argparse
from pathlib import Path
import httpx

ROOT = Path(__file__).parent.parent
DEFAULT_SERVER = "https://political-ddmj.onrender.com"

PLATFORMS = ["facebook", "instagram", "x", "youtube"]

def parse_num(val):
    if val is None or val == "":
        return 0
    clean = str(val).replace(",", "").strip()
    try:
        return int(float(clean))
    except Exception:
        return 0

def clean_str(val):
    return str(val or "").strip()

def run_import(csv_path: str, server_url: str = DEFAULT_SERVER, user_id: str = "usr-smm"):
    if not os.path.exists(csv_path):
        print(f"Error: File '{csv_path}' not found.")
        return False

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"==================================================")
    print(f"Bulk Importing {len(rows)} rows from: {os.path.basename(csv_path)}")
    print(f"Target Server: {server_url}")
    print(f"==================================================")

    # First fetch geo lookups from server
    with httpx.Client(timeout=30.0) as client:
        try:
            intel_res = client.get(f"{server_url}/api/pi/intelligence?userId={user_id}&stateId=AP")
            if intel_res.status_code == 200:
                intel_data = intel_res.json()
                print("✓ Successfully connected to backend intelligence service")
            else:
                print(f"Notice: intelligence status {intel_res.status_code}")
        except Exception as e:
            print(f"Warning connecting to server: {e}")

        success_count = 0
        error_count = 0

        for idx, row in enumerate(rows, 1):
            name = clean_str(row.get("Leader Name"))
            party = clean_str(row.get("Party")).upper()
            rep_type = clean_str(row.get("Representative Type")).upper() or "MLA"
            state = clean_str(row.get("State")) or "Andhra Pradesh"
            state_id = "AP" if "andhra" in state.lower() else "TG" if "telangana" in state.lower() else state
            district = clean_str(row.get("District") or row.get("District HQ"))
            ac_name = clean_str(row.get("Assembly Constituency"))
            pc_name = clean_str(row.get("Parliamentary Constituency"))
            zone_name = clean_str(row.get("Council Zone"))
            pol_role = clean_str(row.get("Political Role")) or rep_type
            leader_status = clean_str(row.get("Leader Status")) or f"SITTING_{rep_type}"
            remarks = clean_str(row.get("Remarks"))

            if not name or not party:
                print(f"[{idx}] Skipping invalid row: Name or Party missing")
                error_count += 1
                continue

            print(f"[{idx}/{len(rows)}] Processing {name} ({party}) - {rep_type} ({ac_name or pc_name or zone_name})...")

            # Prepare account drafts
            accounts = []
            # Facebook
            fb_url = clean_str(row.get("Facebook Profile URL"))
            fb_followers = parse_num(row.get("Facebook Followers"))
            fb_ver = clean_str(row.get("Facebook Verified")).upper() == "YES"
            if fb_url:
                accounts.append({
                    "platform": "facebook",
                    "profileUrl": fb_url,
                    "followers": fb_followers,
                    "verified": fb_ver,
                    "verificationStatus": "VERIFIED" if fb_ver else "PENDING"
                })

            # Instagram
            ig_url = clean_str(row.get("Instagram Profile URL"))
            ig_followers = parse_num(row.get("Instagram Followers"))
            ig_ver = clean_str(row.get("Instagram Verified")).upper() == "YES"
            if ig_url:
                accounts.append({
                    "platform": "instagram",
                    "profileUrl": ig_url,
                    "followers": ig_followers,
                    "verified": ig_ver,
                    "verificationStatus": "VERIFIED" if ig_ver else "PENDING"
                })

            # X / Twitter
            x_url = clean_str(row.get("X (Twitter) Profile URL") or row.get("X Profile URL"))
            x_followers = parse_num(row.get("X Followers"))
            x_ver = clean_str(row.get("X Verified")).upper() == "YES"
            if x_url:
                accounts.append({
                    "platform": "x",
                    "profileUrl": x_url,
                    "followers": x_followers,
                    "verified": x_ver,
                    "verificationStatus": "VERIFIED" if x_ver else "PENDING"
                })

            # YouTube
            yt_url = clean_str(row.get("YouTube Channel URL"))
            yt_followers = parse_num(row.get("YouTube Subscribers") or row.get("YouTube Followers"))
            yt_ver = clean_str(row.get("YouTube Verified")).upper() == "YES"
            if yt_url:
                accounts.append({
                    "platform": "youtube",
                    "profileUrl": yt_url,
                    "followers": yt_followers,
                    "verified": yt_ver,
                    "verificationStatus": "VERIFIED" if yt_ver else "PENDING"
                })

            # Determine acId / pcId / zoneId
            ac_id = ac_name
            pc_id = pc_name
            zone_id = zone_name

            leader_payload = {
                "name": name,
                "partyId": party,
                "representativeType": rep_type,
                "politicalRole": pol_role,
                "roles": [{"politicalRole": pol_role, "status": "CURRENT"}],
                "leaderKind": leader_status,
                "currentFormerStatus": "CURRENT",
                "stateId": state_id,
                "districtId": district,
                "assemblyConstituencyId": ac_id or (f"PC-{pc_id}" if rep_type == "MP" else f"ZONE-{zone_id}" if rep_type == "MLC" else "UNKNOWN"),
                "parliamentConstituencyId": pc_id,
                "zoneId": zone_id,
                "remarks": remarks,
                "dataSource": "CSV_IMPORT",
                "accounts": accounts
            }

            try:
                save_res = client.post(
                    f"{server_url}/api/pi/leaders?userId={user_id}",
                    json=leader_payload
                )
                if save_res.status_code in (200, 201):
                    leader_data = save_res.json()
                    person_id = leader_data.get("id")
                    print(f"    ✓ Saved leader {name} (id: {person_id})")

                    # Also save individual social accounts
                    for acc in accounts:
                        acc["personId"] = person_id
                        acc_res = client.post(
                            f"{server_url}/api/pi/social-accounts?userId={user_id}",
                            json=acc
                        )
                        if acc_res.status_code in (200, 201):
                            print(f"      ✓ Added {acc['platform']}: {acc['followers']} followers")

                    # Also save monthly metrics if provided
                    posts = parse_num(row.get("Monthly Posts"))
                    ads = parse_num(row.get("Monthly Ads"))
                    reach = parse_num(row.get("Monthly Reach"))
                    if posts or ads or reach:
                        m_payload = {
                            "leaderId": person_id,
                            "month": "2026-11",
                            "postsCount": posts,
                            "adsCount": ads,
                            "totalReach": reach,
                        }
                        client.post(
                            f"{server_url}/api/pi/monthly-ads-metrics?userId={user_id}",
                            json=m_payload
                        )
                        print(f"      ✓ Added monthly metrics (Posts: {posts}, Ads: {ads}, Reach: {reach})")

                    success_count += 1
                else:
                    print(f"    ✗ Server returned {save_res.status_code}: {save_res.text[:120]}")
                    error_count += 1
            except Exception as e:
                print(f"    ✗ Error saving leader: {e}")
                error_count += 1

    print(f"\nImport Finished: {success_count} succeeded, {error_count} failed.")
    return error_count == 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk CSV Importer for Leaders Lens")
    parser.add_argument("file", help="Path to CSV file")
    parser.add_argument("--server", default=DEFAULT_SERVER, help="Backend API server URL")
    parser.add_argument("--user", default="usr-smm", help="User ID for actor context")
    args = parser.parse_args()
    run_import(args.file, server_url=args.server, user_id=args.user)
