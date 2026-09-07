from backend.services.role_scope import (
    actor_role,
    assigned_tickets_for_manager,
    build_manager_dashboard,
    build_political_admin_dashboard,
    issue_in_scope,
    issue_mongo_query,
    kpi_bucket,
    user_in_scope,
)


PA = {
    "id": "usr-demo-admin",
    "primaryRole": "POLITICAL_ADMIN",
    "isPoliticalAdmin": True,
    "assemblyConstituencyId": "BNG-AC",
    "stateId": "AP",
    "partyId": None,
}

OTHER_PA = {
    "id": "usr-other-admin",
    "primaryRole": "POLITICAL_ADMIN",
    "isPoliticalAdmin": True,
    "assemblyConstituencyId": "KDP-AC",
    "stateId": "AP",
}

DIRECTOR = {
    "id": "usr-demo-director",
    "primaryRole": "DIRECTOR",
    "assemblyConstituencyId": "BNG-AC",
}

OTHER_DIRECTOR = {
    "id": "usr-other-director",
    "primaryRole": "DIRECTOR",
    "assemblyConstituencyId": "BNG-AC",
}

VOLUNTEER = {
    "id": "usr-demo-volunteer",
    "primaryRole": "VOLUNTEER",
    "status": "ACTIVE",
    "directorId": "usr-demo-director",
    "assemblyConstituencyId": "BNG-AC",
    "assignedMandalName": "Banaganapalle Town",
    "name": "Volunteer1",
}

OTHER_VOLUNTEER = {
    "id": "usr-other-vol",
    "primaryRole": "VOLUNTEER",
    "status": "ACTIVE",
    "directorId": "usr-other-director",
    "assemblyConstituencyId": "BNG-AC",
    "name": "Other Vol",
}

FOREIGN_VOLUNTEER = {
    "id": "usr-kdp-vol",
    "primaryRole": "VOLUNTEER",
    "status": "ACTIVE",
    "directorId": "usr-kdp-director",
    "assemblyConstituencyId": "KDP-AC",
    "name": "Kadapa Vol",
}

OWN_ISSUE = {
    "id": "iss-own",
    "status": "ASSIGNED",
    "assemblyConstituencyId": "BNG-AC",
    "directorId": "usr-demo-director",
    "assignedVolunteerId": "usr-demo-volunteer",
}

FOREIGN_ISSUE = {
    "id": "iss-foreign",
    "status": "IN_PROGRESS",
    "assemblyConstituencyId": "KDP-AC",
    "directorId": "usr-kdp-director",
    "assignedVolunteerId": "usr-kdp-vol",
}

OTHER_MGR_ISSUE = {
    "id": "iss-other-mgr",
    "status": "NEW",
    "assemblyConstituencyId": "BNG-AC",
    "directorId": "usr-other-director",
    "assignedVolunteerId": "usr-other-vol",
}


def test_actor_role_mapping():
    assert actor_role(PA) == "POLITICAL_ADMIN"
    assert actor_role(DIRECTOR) == "DIRECTOR"
    assert actor_role({"primaryRole": "SUPER_ADMIN", "isPlatformAdmin": True}) == "SUPER_ADMIN"


def test_kpi_bucket_matches_frontend_priority():
    assert kpi_bucket({"status": "IN_PROGRESS", "assignedOfficialName": "Officer"}) == "IN_PROGRESS"
    assert kpi_bucket({"status": "NEW"}) == "OPEN_UNASSIGNED"
    assert kpi_bucket({"status": "NEW", "assignedOfficialName": "Ramesh"}) == "ASSIGNED"
    assert kpi_bucket({"status": "RESOLVED"}) == "RESOLVED"
    assert kpi_bucket({"status": "REJECTED"}) == "REJECTED"


def test_political_admin_cannot_see_other_ac_issue():
    assert issue_in_scope(PA, OWN_ISSUE) is True
    assert issue_in_scope(PA, FOREIGN_ISSUE) is False
    assert issue_in_scope(OTHER_PA, OWN_ISSUE) is False


def test_manager_cannot_see_other_manager_issue():
    assert issue_in_scope(DIRECTOR, OWN_ISSUE) is True
    assert issue_in_scope(DIRECTOR, OTHER_MGR_ISSUE) is False
    assert issue_in_scope(DIRECTOR, FOREIGN_ISSUE) is False


def test_volunteer_scope():
    assert issue_in_scope(VOLUNTEER, OWN_ISSUE) is True
    assert issue_in_scope(VOLUNTEER, OTHER_MGR_ISSUE) is False


def test_pa_user_scope_is_ac_only():
    assert user_in_scope(PA, VOLUNTEER) is True
    assert user_in_scope(PA, FOREIGN_VOLUNTEER) is False
    assert user_in_scope(DIRECTOR, VOLUNTEER) is True
    assert user_in_scope(DIRECTOR, OTHER_VOLUNTEER) is False


def test_issue_mongo_query_ignores_client_geography():
    query = issue_mongo_query(PA)
    assert query["assemblyConstituencyId"] == "BNG-AC"
    director_query = issue_mongo_query(DIRECTOR)
    assert director_query == {"directorId": "usr-demo-director"}


def test_manager_assigned_tickets_only_own_volunteers():
    issues = [OWN_ISSUE, OTHER_MGR_ISSUE, FOREIGN_ISSUE]
    users = [VOLUNTEER, OTHER_VOLUNTEER, FOREIGN_VOLUNTEER]
    assigned = assigned_tickets_for_manager(DIRECTOR, users, issues)
    assert [i["id"] for i in assigned] == ["iss-own"]


def test_dashboard_stats_are_zero_when_empty():
    dash = build_political_admin_dashboard(PA, [], [])
    assert dash["stats"]["totalIssues"] == 0
    assert dash["stats"]["totalVolunteers"] == 0
    mgr = build_manager_dashboard(DIRECTOR, [], [])
    assert mgr["stats"]["myVolunteers"] == 0
    assert mgr["stats"]["totalAssignedTickets"] == 0


def test_political_admin_dashboard_counts():
    dash = build_political_admin_dashboard(
        PA,
        [VOLUNTEER, FOREIGN_VOLUNTEER],
        [OWN_ISSUE, FOREIGN_ISSUE],
    )
    assert dash["stats"]["totalIssues"] == 1
    assert dash["stats"]["assigned"] == 1
    assert dash["stats"]["totalVolunteers"] == 1
    assert dash["volunteers"][0]["id"] == "usr-demo-volunteer"


def test_manager_dashboard_assigned_stat():
    dash = build_manager_dashboard(
        DIRECTOR,
        [VOLUNTEER, OTHER_VOLUNTEER],
        [OWN_ISSUE, OTHER_MGR_ISSUE],
    )
    assert dash["stats"]["myVolunteers"] == 1
    assert dash["stats"]["totalAssignedTickets"] == 1
    assert dash["assignedTicketIds"] == ["iss-own"]
