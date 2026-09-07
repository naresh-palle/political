from backend.server import apply_canonical_demo_names


def test_demo_volunteer_name_is_volunteer1():
    assert apply_canonical_demo_names({"id": "usr-demo-volunteer", "name": "Demo Volunteer"})["name"] == "Volunteer1"


def test_demo_director_name_is_manager1():
    assert apply_canonical_demo_names({"id": "usr-demo-director", "name": "Demo Director"})["name"] == "Manager1"


def test_issue_volunteer_label_rewritten():
    doc = apply_canonical_demo_names(
        {"assignedVolunteerId": "usr-demo-volunteer", "assignedVolunteerName": "Demo Volunteer", "directorName": "Demo Director"}
    )
    assert doc["assignedVolunteerName"] == "Volunteer1"
    assert doc["directorName"] == "Manager1"
