from backend.services.ticket_number_display import (
    allocate_ticket_number,
    constituency_short_name,
    format_ticket_display,
    geo_code_from_issue,
    raw_ticket_number,
    strip_ticket_number_parens,
)


MLA = {
    "id": "iss-ll-sec-open-01",
    "ticketNumber": "LL-MLA-AC140-26-000001",
    "assemblyConstituencyId": "BNG-AC",
    "assemblyConstituencyName": "Banaganapalle Assembly (AC-140)",
}

MP = {
    "id": "iss-mp-demo-1",
    "ticketNumber": "LL-MP-PC08-26-000456",
    "parliamentConstituencyId": "NDL-PC",
    "parliamentConstituencyName": "Visakhapatnam (PC-08)",
}

MINISTER = {
    "id": "iss-min-demo-1",
    "ticketNumber": "LL-MIN-AC140-26-000789",
    "assemblyConstituencyId": "BNG-AC",
    "assemblyConstituencyName": "Banaganapalle Assembly (AC-140)",
}


def test_display_appends_constituency_from_ticket_geography():
    assert format_ticket_display(MLA) == "LL-MLA-AC140-26-000001 (Banaganapalle)"
    assert format_ticket_display(MP) == "LL-MP-PC08-26-000456 (Visakhapatnam)"
    assert format_ticket_display(MINISTER) == "LL-MIN-AC140-26-000789 (Banaganapalle)"


def test_raw_ticket_number_never_includes_parens():
    stuffed = {**MLA, "ticketNumber": "LL-MLA-AC140-26-000001 (Gajuwaka)"}
    assert raw_ticket_number(stuffed) == "LL-MLA-AC140-26-000001"
    assert strip_ticket_number_parens(stuffed["ticketNumber"]) == "LL-MLA-AC140-26-000001"


def test_missing_geography_does_not_guess():
    issue = {"id": "iss-orphan", "ticketNumber": "LL-MLA-AC140-26-000099"}
    assert constituency_short_name(issue) == ""
    assert format_ticket_display(issue) == "LL-MLA-AC140-26-000099"
    assert geo_code_from_issue(issue) == ""


def test_allocate_does_not_overwrite_existing_ticket_number():
    assert allocate_ticket_number(dict(MLA)) == "LL-MLA-AC140-26-000001"


def test_allocate_uses_ticket_geography_not_hardcoded_map():
    fresh = {
        "id": "iss-new",
        "assemblyConstituencyId": "BNG-AC",
        "assemblyConstituencyName": "Banaganapalle Assembly (AC-140)",
        "reportedDate": "2026-09-08",
    }
    number = allocate_ticket_number(fresh, sequence=123)
    assert number == "LL-MLA-AC140-26-000123"
    assert "(" not in number


def test_next_sequence_starts_at_one_not_timestamp():
    from backend.services.ticket_number_display import INITIAL_TICKET_SEQUENCE, next_ticket_sequence

    fresh = {
        "assemblyConstituencyId": "BNG-AC",
        "assemblyConstituencyName": "Banaganapalle Assembly (AC-140)",
        "reportedDate": "2026-09-08",
    }
    assert INITIAL_TICKET_SEQUENCE == 1
    assert next_ticket_sequence([], fresh) == 1
    assert allocate_ticket_number(fresh) == "LL-MLA-AC140-26-000001"


def test_next_sequence_follows_existing_catalog():
    from backend.services.ticket_number_display import next_ticket_sequence

    catalog = [dict(MLA), {**MLA, "ticketNumber": "LL-MLA-AC140-26-000012"}]
    fresh = {
        "assemblyConstituencyId": "BNG-AC",
        "assemblyConstituencyName": "Banaganapalle Assembly (AC-140)",
        "reportedDate": "2026-09-08",
    }
    assert next_ticket_sequence(catalog, fresh) == 13
    assert allocate_ticket_number(fresh, existing_numbers=catalog) == "LL-MLA-AC140-26-000013"


def test_legacy_id_still_displays_with_constituency():
    legacy = {
        "id": "iss-ll-sec-asg-01",
        "assemblyConstituencyId": "BNG-AC",
        "assemblyConstituencyName": "Banaganapalle Assembly (AC-140)",
    }
    assert raw_ticket_number(legacy) == "LL-ll-sec-asg-01"
    assert format_ticket_display(legacy) == "LL-ll-sec-asg-01 (Banaganapalle)"
