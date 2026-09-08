import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ISSUES_PATH = ROOT / "backend" / "data" / "field_issues.json"

LIVE_PHONES = {"9885765672", "8985216765"}
LIVE_CONTACT_IDS = {"cnt-live-001", "cnt-live-002"}
LIVE_OFFICER_NAMES = {
    "N. Palle (Senior Executive Officer)",
    "K. Reddy (RWS Executive Engineer)",
}
OPEN_STATUSES = {"NEW", "OPEN", "PENDING", "UNRESOLVED"}


def _digits(value: str) -> str:
    return "".join(ch for ch in str(value or "") if ch.isdigit())[-10:]


def test_seed_catalog_matches_two_live_officers():
    issues = json.loads(ISSUES_PATH.read_text(encoding="utf-8"))
    assert len(issues) == 7
    ids = [i["id"] for i in issues]
    assert ids == [
        "iss-ll-sec-open-01",
        "iss-ll-sec-open-02",
        "iss-ll-sec-asg-01",
        "iss-ll-sec-prg-01",
        "iss-ll-sec-ovd-01",
        "iss-ll-sec-res-01",
        "iss-ll-sec-rej-01",
    ]
    numbers = [i["ticketNumber"] for i in issues]
    assert numbers == [f"LL-MLA-AC140-26-{n:06d}" for n in range(1, 8)]

    for issue in issues:
        assert issue["parliamentConstituencyId"] == "NDL-PC"
        assert issue["parliamentConstituencyName"] == "Nandyala PC"
        assert issue["assemblyConstituencyId"] == "BNG-AC"
        assert issue["schemeSubDetail"]
        assert issue["citizenGender"] in {"Male", "Female", "Other"}
        assert int(issue["citizenAge"]) > 0
        assert issue["initialRemarks"]
        assert issue["villageName"]
        assert issue["placeName"]
        assert issue["reporterPhone"]
        assert "(" not in issue["ticketNumber"]

        status = str(issue.get("status") or "").upper()
        if status in OPEN_STATUSES:
            assert not issue.get("assignedOfficialName")
            assert not issue.get("assignedOfficialPhone")
            assert not issue.get("departmentContactId")
            continue

        assert issue["assignedOfficialName"] in LIVE_OFFICER_NAMES
        assert _digits(issue["assignedOfficialPhone"]) in LIVE_PHONES
        assert issue["departmentContactId"] in LIVE_CONTACT_IDS
        if issue["departmentContactId"] == "cnt-live-001":
            assert issue["mandalId"] == "MDL-BNG-RUR"
            assert issue["villageId"] == "VIL-BNG-YGT"
            assert "Panchayat Raj" in issue["department"]
            assert "Panchayat Buildings" in issue["schemeSubDetail"]
        else:
            assert issue["mandalId"] == "MDL-BNG-TWN"
            assert issue["villageId"] == "VIL-BNG-TWN-02"
            assert "Rural Water Supply" in issue["department"]
            assert "Drains and Pipe lines" in issue["schemeSubDetail"]


def test_catalog_overlay_replaces_stale_mongo_officers():
    from backend.server import apply_live_officer_catalog

    stale = [
        {
            "id": "iss-ll-sec-open-01",
            "title": "Potholes on Koilakuntla bus-stand approach",
            "status": "NEW",
            "villageName": "Koilakuntla Town Wards 1-15",
        },
        {
            "id": "iss-ll-sec-ovd-02",
            "title": "Broken street slab on Temple Road Ward 2",
            "status": "OVERDUE",
            "assignedOfficialName": "R&B Section Officer",
            "assignedOfficialPhone": "+91 98492 44556",
        },
        {
            "id": "iss-ll-sec-asg-01",
            "title": "Broken cement drain on Ward 3 bazaar lane",
            "status": "IN_PROGRESS",
            "assignedOfficialName": "N. Palle",
            "lastStatusRemarks": "Crew already on the compound wall.",
            "lastStatusUpdateAt": "2026-09-08T10:00:00Z",
        },
    ]
    cleaned = apply_live_officer_catalog(stale)
    ids = {i["id"] for i in cleaned}
    assert "iss-ll-sec-ovd-02" not in ids
    assert "iss-ll-sec-open-01" in ids
    open_ticket = next(i for i in cleaned if i["id"] == "iss-ll-sec-open-01")
    assert open_ticket["title"] == "Pipeline leak on Ward 14 crossroads"
    assert open_ticket["villageName"] == "Banaganapalle Town Wards 11-20"
    assert not open_ticket.get("assignedOfficialName")
    assigned = next(i for i in cleaned if i["id"] == "iss-ll-sec-asg-01")
    assert assigned["assignedOfficialName"] == "N. Palle (Senior Executive Officer)"
    assert assigned["departmentContactId"] == "cnt-live-001"
    assert assigned["status"] == "IN_PROGRESS"
    assert assigned["lastStatusRemarks"] == "Crew already on the compound wall."
