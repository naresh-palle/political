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
