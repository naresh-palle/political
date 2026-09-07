"""Role-scoped access and dashboard KPI helpers.

Scope is derived from the actor stored in the database, never from
geography/org IDs supplied by the client.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional


ASSIGNED_STATUSES = frozenset({"ASSIGNED", "ACKNOWLEDGED", "ASSIGNED_TO_DEPARTMENT"})
IN_PROGRESS_STATUSES = frozenset({"IN_PROGRESS"})
OVERDUE_STATUSES = frozenset({"OVERDUE"})
RESOLVED_STATUSES = frozenset({"RESOLVED", "COMPLETED", "CLOSED"})
REJECTED_STATUSES = frozenset({"REJECTED"})


def normalize_status(status: Optional[str]) -> str:
    return (
        str(status or "")
        .strip()
        .upper()
        .replace("'", "")
        .replace("’", "")
        .replace(" ", "_")
    )


def normalize_role(value: Optional[str]) -> str:
    return str(value or "").strip().upper().replace(" ", "_")


def actor_role(user: Optional[Dict[str, Any]]) -> str:
    if not user:
        return ""
    if user.get("isPlatformAdmin") or normalize_role(user.get("primaryRole")) == "SUPER_ADMIN":
        return "SUPER_ADMIN"
    if user.get("isPoliticalAdmin") or normalize_role(user.get("primaryRole")) == "POLITICAL_ADMIN":
        return "POLITICAL_ADMIN"
    role = normalize_role(user.get("primaryRole") or user.get("roleId") or user.get("role"))
    if role in {"DIRECTOR", "CAMPAIGN_MANAGER"}:
        return "DIRECTOR"
    if role == "VOLUNTEER":
        return "VOLUNTEER"
    return role


def is_volunteer_user(user: Dict[str, Any]) -> bool:
    return actor_role(user) == "VOLUNTEER"


def is_director_user(user: Dict[str, Any]) -> bool:
    return actor_role(user) == "DIRECTOR"


def is_active_account(user: Dict[str, Any]) -> bool:
    return normalize_role(user.get("status")) in {"", "ACTIVE"}


def _has_assignee(issue: Dict[str, Any]) -> bool:
    status = normalize_status(issue.get("status"))
    if status in ASSIGNED_STATUSES:
        return True
    official = str(issue.get("assignedOfficialName") or "").strip()
    if official and official.lower() != "unassigned":
        return True
    return bool(
        issue.get("assignedOfficialPhone")
        or issue.get("assignedDepartment")
        or issue.get("departmentContactId")
    )


def kpi_bucket(issue: Dict[str, Any]) -> str:
    status = normalize_status(issue.get("status"))
    if status in REJECTED_STATUSES:
        return "REJECTED"
    if status in RESOLVED_STATUSES:
        return "RESOLVED"
    if status in OVERDUE_STATUSES:
        return "OVERDUE"
    if status in IN_PROGRESS_STATUSES:
        return "IN_PROGRESS"
    if _has_assignee(issue):
        return "ASSIGNED"
    return "OPEN_UNASSIGNED"


def is_assigned_to_department(issue: Dict[str, Any]) -> bool:
    if normalize_status(issue.get("status")) == "ASSIGNED_TO_DEPARTMENT":
        return True
    if issue.get("departmentContactId"):
        return True
    official = str(issue.get("assignedOfficialName") or "").strip()
    return bool(official) and official.lower() != "unassigned"


def count_kpi(issues: Iterable[Dict[str, Any]]) -> Dict[str, int]:
    counts = {
        "total": 0,
        "openUnassigned": 0,
        "assigned": 0,
        "assignedToDepartment": 0,
        "inProgress": 0,
        "overdue": 0,
        "resolved": 0,
        "completed": 0,
        "closed": 0,
        "resolvedClosed": 0,
        "rejected": 0,
    }
    for issue in issues:
        counts["total"] += 1
        bucket = kpi_bucket(issue)
        status = normalize_status(issue.get("status"))
        if bucket == "OPEN_UNASSIGNED":
            counts["openUnassigned"] += 1
        elif bucket == "ASSIGNED":
            counts["assigned"] += 1
        elif bucket == "IN_PROGRESS":
            counts["inProgress"] += 1
        elif bucket == "OVERDUE":
            counts["overdue"] += 1
        elif bucket == "RESOLVED":
            counts["resolvedClosed"] += 1
            if status == "COMPLETED":
                counts["completed"] += 1
            elif status == "CLOSED":
                counts["closed"] += 1
            else:
                counts["resolved"] += 1
        elif bucket == "REJECTED":
            counts["rejected"] += 1
        if is_assigned_to_department(issue) and bucket not in {"RESOLVED", "REJECTED"}:
            counts["assignedToDepartment"] += 1
    return counts


def issue_in_scope(actor: Dict[str, Any], issue: Dict[str, Any]) -> bool:
    role = actor_role(actor)
    actor_id = actor.get("id")
    if role == "SUPER_ADMIN":
        return True
    if role == "POLITICAL_ADMIN":
        ac = str(actor.get("assemblyConstituencyId") or "").strip()
        issue_ac = str(issue.get("assemblyConstituencyId") or "").strip()
        if not ac or not issue_ac or issue_ac != ac:
            return False
        party = str(actor.get("partyId") or "").strip()
        issue_party = str(issue.get("partyId") or "").strip()
        if party and issue_party and issue_party != party:
            return False
        return True
    if role == "DIRECTOR":
        return str(issue.get("directorId") or "") == str(actor_id or "")
    if role == "VOLUNTEER":
        return (
            str(issue.get("assignedVolunteerId") or "") == str(actor_id or "")
            or str(issue.get("createdBy") or "") == str(actor_id or "")
        )
    return False


def user_in_scope(actor: Dict[str, Any], target: Dict[str, Any]) -> bool:
    role = actor_role(actor)
    if role == "SUPER_ADMIN":
        return True
    if str(target.get("id") or "") == str(actor.get("id") or ""):
        return True
    if role == "POLITICAL_ADMIN":
        ac = str(actor.get("assemblyConstituencyId") or "").strip()
        target_ac = str(target.get("assemblyConstituencyId") or "").strip()
        if not ac or not target_ac or target_ac != ac:
            return False
        party = str(actor.get("partyId") or "").strip()
        target_party = str(target.get("partyId") or "").strip()
        if party and target_party and target_party != party:
            return False
        return True
    if role == "DIRECTOR":
        return str(target.get("directorId") or "") == str(actor.get("id") or "")
    return False


def issue_mongo_query(actor: Dict[str, Any]) -> Dict[str, Any]:
    role = actor_role(actor)
    actor_id = actor.get("id")
    if role == "SUPER_ADMIN":
        return {}
    if role == "POLITICAL_ADMIN":
        ac = str(actor.get("assemblyConstituencyId") or "").strip()
        query: Dict[str, Any] = {"assemblyConstituencyId": ac} if ac else {"assemblyConstituencyId": {"$in": []}}
        party = str(actor.get("partyId") or "").strip()
        if party:
            query["$or"] = [{"partyId": party}, {"partyId": {"$exists": False}}, {"partyId": None}, {"partyId": ""}]
        return query
    if role == "DIRECTOR":
        return {"directorId": actor_id}
    if role == "VOLUNTEER":
        return {"$or": [{"assignedVolunteerId": actor_id}, {"createdBy": actor_id}]}
    return {"id": {"$in": []}}


def volunteer_summaries(
    actor: Dict[str, Any],
    users: List[Dict[str, Any]],
    issues: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    volunteers = [u for u in users if is_volunteer_user(u) and user_in_scope(actor, u)]
    summaries = []
    for vol in volunteers:
        vol_issues = [
            i for i in issues if str(i.get("assignedVolunteerId") or "") == str(vol.get("id") or "")
        ]
        kpi = count_kpi(vol_issues)
        pending = kpi["openUnassigned"] + kpi["assigned"]
        last_update = ""
        for issue in vol_issues:
            stamp = str(issue.get("updatedAt") or issue.get("lastStatusUpdateAt") or "")
            if stamp > last_update:
                last_update = stamp
        summaries.append(
            {
                "id": vol.get("id"),
                "name": vol.get("name"),
                "status": vol.get("status") or "ACTIVE",
                "area": vol.get("assignedMandalName") or vol.get("assignedConstituency") or "",
                "villages": vol.get("assignedVillageNames") or [],
                "phone": vol.get("phone"),
                "email": vol.get("email"),
                "assignedTickets": kpi["total"],
                "pendingTickets": pending,
                "overdueTickets": kpi["overdue"],
                "completedTickets": kpi["resolvedClosed"],
                "lastActivity": last_update,
            }
        )
    return summaries


def assigned_tickets_for_manager(
    actor: Dict[str, Any],
    users: List[Dict[str, Any]],
    issues: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    volunteer_ids = {
        str(u.get("id"))
        for u in users
        if is_volunteer_user(u) and user_in_scope(actor, u) and u.get("id")
    }
    scoped = [i for i in issues if issue_in_scope(actor, i)]
    return [
        i
        for i in scoped
        if str(i.get("assignedVolunteerId") or "") in volunteer_ids
    ]


def build_political_admin_dashboard(
    actor: Dict[str, Any],
    users: List[Dict[str, Any]],
    issues: List[Dict[str, Any]],
) -> Dict[str, Any]:
    scoped_issues = [i for i in issues if issue_in_scope(actor, i)]
    volunteers = volunteer_summaries(actor, users, scoped_issues)
    kpi = count_kpi(scoped_issues)
    active_vols = [v for v in volunteers if normalize_role(v.get("status")) == "ACTIVE"]
    return {
        "role": "POLITICAL_ADMIN",
        "scope": {
            "assemblyConstituencyId": actor.get("assemblyConstituencyId"),
            "stateId": actor.get("stateId"),
            "partyId": actor.get("partyId") or None,
        },
        "stats": {
            "totalVolunteers": len(volunteers),
            "activeVolunteers": len(active_vols),
            "volunteersWithAssigned": len([v for v in volunteers if v["assignedTickets"] > 0]),
            "volunteersWithPending": len([v for v in volunteers if v["pendingTickets"] > 0]),
            "volunteersWithOverdue": len([v for v in volunteers if v["overdueTickets"] > 0]),
            "volunteersWithCompleted": len([v for v in volunteers if v["completedTickets"] > 0]),
            "totalIssues": kpi["total"],
            "newIssues": kpi["openUnassigned"],
            "assigned": kpi["assigned"],
            "assignedToDepartment": kpi["assignedToDepartment"],
            "inProgress": kpi["inProgress"],
            "resolved": kpi["resolved"],
            "rejected": kpi["rejected"],
            "completed": kpi["completed"],
            "overdue": kpi["overdue"],
            "closed": kpi["closed"],
            "resolvedClosed": kpi["resolvedClosed"],
        },
        "volunteers": volunteers,
    }


def build_manager_dashboard(
    actor: Dict[str, Any],
    users: List[Dict[str, Any]],
    issues: List[Dict[str, Any]],
) -> Dict[str, Any]:
    scoped_issues = [i for i in issues if issue_in_scope(actor, i)]
    assigned = assigned_tickets_for_manager(actor, users, scoped_issues)
    volunteers = volunteer_summaries(actor, users, scoped_issues)
    kpi = count_kpi(scoped_issues)
    assigned_kpi = count_kpi(assigned)
    active_vols = [v for v in volunteers if normalize_role(v.get("status")) == "ACTIVE"]
    return {
        "role": "DIRECTOR",
        "scope": {
            "directorId": actor.get("id"),
            "assemblyConstituencyId": actor.get("assemblyConstituencyId"),
        },
        "stats": {
            "myVolunteers": len(volunteers),
            "activeVolunteers": len(active_vols),
            "totalAssignedTickets": assigned_kpi["total"],
            "pendingTickets": assigned_kpi["openUnassigned"] + assigned_kpi["assigned"],
            "newTickets": assigned_kpi["openUnassigned"],
            "inProgress": kpi["inProgress"],
            "assignedToDepartment": kpi["assignedToDepartment"],
            "resolved": kpi["resolved"],
            "rejected": kpi["rejected"],
            "completed": kpi["completed"],
            "overdue": kpi["overdue"],
            "resolvedClosed": kpi["resolvedClosed"],
            "totalTickets": kpi["total"],
            "openUnassigned": kpi["openUnassigned"],
            "assigned": kpi["assigned"],
        },
        "volunteers": volunteers,
        "assignedTicketIds": [i.get("id") for i in assigned if i.get("id")],
    }
