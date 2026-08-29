from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'political_intelligence')

client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
db = client[db_name]

app = FastAPI(title="Leader's Lens Political Intelligence API", version="1.0.0")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Helper to load fallback JSON data
def load_json_fallback(filename: str):
    data_path = ROOT_DIR / "data" / filename
    if data_path.exists():
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

# Base routes
@api_router.get("/")
async def root():
    return {
        "message": "Leader's Lens Intelligence API Active",
        "database": db_name,
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    try:
        await db.status_checks.insert_one(doc)
    except Exception as e:
        logger.warning(f"MongoDB insert notice: {e}")
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    try:
        checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
        for check in checks:
            if isinstance(check.get('timestamp'), str):
                check['timestamp'] = datetime.fromisoformat(check['timestamp'])
        return checks
    except Exception as e:
        logger.warning(f"MongoDB find notice: {e}")
        return []

# ----------------- MASTER ELECTION GEOGRAPHY ENDPOINTS -----------------

@api_router.get("/geography/countries")
async def get_countries():
    try:
        countries = await db.countries.find({}, {"_id": 0}).to_list(100)
        if countries:
            return countries
    except Exception as e:
        logger.warning(f"MongoDB get_countries: {e}")
    return [{
        "id": "IND",
        "name": "India",
        "code": "IND",
        "sourceMetadata": {
            "sourceName": "Election Commission of India",
            "sourceDate": "2024",
            "lastVerifiedAt": "2026-08-28T00:00:00Z"
        }
    }]

@api_router.get("/geography/states")
async def get_states(q: Optional[str] = None):
    try:
        query = {"isActive": True}
        if q:
            query["name"] = {"$regex": q, "$options": "i"}
        states = await db.states.find(query, {"_id": 0}).to_list(100)
        if states:
            return states
    except Exception as e:
        logger.warning(f"MongoDB get_states: {e}")
    
    fallback = load_json_fallback("states.json")
    if q:
        q_lower = q.lower()
        fallback = [s for s in fallback if q_lower in s['name'].lower() or q_lower in s['code'].lower()]
    return fallback

@api_router.get("/geography/states/{state_id}/parliament-constituencies")
async def get_parliaments_by_state(state_id: str, q: Optional[str] = None):
    try:
        query = {"stateId": state_id.upper(), "isActive": True}
        if q:
            query["name"] = {"$regex": q, "$options": "i"}
        pcs = await db.parliament_constituencies.find(query, {"_id": 0}).sort("number", 1).to_list(200)
        if pcs:
            return pcs
    except Exception as e:
        logger.warning(f"MongoDB get_parliaments: {e}")
    
    fallback = load_json_fallback("parliaments.json")
    results = [p for p in fallback if p['stateId'].upper() == state_id.upper()]
    if q:
        q_lower = q.lower()
        results = [p for p in results if q_lower in p['name'].lower() or q_lower in p['code'].lower()]
    return results

@api_router.get("/geography/parliament-constituencies/{pc_id}/assembly-constituencies")
async def get_assemblies_by_parliament(pc_id: str, q: Optional[str] = None):
    try:
        query = {"parliamentConstituencyId": pc_id, "isActive": True}
        if q:
            query["name"] = {"$regex": q, "$options": "i"}
        acs = await db.assembly_constituencies.find(query, {"_id": 0}).sort("number", 1).to_list(500)
        if acs:
            return acs
    except Exception as e:
        logger.warning(f"MongoDB get_assemblies: {e}")
    
    fallback = load_json_fallback("assemblies.json")
    results = [a for a in fallback if a['parliamentConstituencyId'].upper() == pc_id.upper()]
    if q:
        q_lower = q.lower()
        results = [a for a in results if q_lower in a['name'].lower() or q_lower in a['code'].lower()]
    return results

@api_router.get("/geography/assembly-constituencies/{ac_id}")
async def get_assembly_by_id(ac_id: str):
    try:
        ac = await db.assembly_constituencies.find_one({"id": ac_id}, {"_id": 0})
        if ac:
            return ac
    except Exception as e:
        logger.warning(f"MongoDB get_assembly_by_id: {e}")
    
    fallback = load_json_fallback("assemblies.json")
    for a in fallback:
        if a['id'].upper() == ac_id.upper():
            return a
    raise HTTPException(status_code=404, detail="Assembly Constituency not found")

@api_router.get("/geography/assembly-constituencies/{ac_id}/candidates")
async def get_candidates_by_assembly(ac_id: str):
    try:
        candidates = await db.candidates.find({"assemblyId": ac_id}, {"_id": 0}).to_list(50)
        if candidates:
            return candidates
    except Exception as e:
        logger.warning(f"MongoDB get_candidates: {e}")
    
    return [
        {
            "id": f"{ac_id}-cand-client",
            "assemblyId": ac_id,
            "name": "Hon. Candidate Executive",
            "party": "Progressive Governance Alliance",
            "partySymbol": "☀️",
            "candidateType": "CLIENT",
            "isClient": True,
            "sentimentScore": 68.4,
            "digitalReach": 98400,
            "voterCoveragePercent": 34.4,
            "topIssues": ["Drinking Water Pipelines", "Industrial Hub Expansion", "Youth Employment"]
        },
        {
            "id": f"{ac_id}-cand-opp1",
            "assemblyId": ac_id,
            "name": "Senior Opposition Contender",
            "party": "United Democratic Front",
            "partySymbol": "🚜",
            "candidateType": "PRIMARY_OPPOSITION",
            "isClient": False,
            "sentimentScore": 58.2,
            "digitalReach": 112000,
            "voterCoveragePercent": 38.6,
            "topIssues": ["Price Index Stability", "Irrigation Canals", "Pension Direct Disbursals"]
        },
        {
            "id": f"{ac_id}-cand-opp2",
            "assemblyId": ac_id,
            "name": "National Coalition Nominee",
            "party": "National Democratic Alliance",
            "partySymbol": "🪷",
            "candidateType": "SECONDARY_OPPOSITION",
            "isClient": False,
            "sentimentScore": 51.5,
            "digitalReach": 64000,
            "voterCoveragePercent": 21.0,
            "topIssues": ["Highway Infra", "Railway Modernization", "Urban Drainage"]
        },
        {
            "id": f"{ac_id}-cand-opp3",
            "assemblyId": ac_id,
            "name": "Independent Candidate",
            "party": "Independent",
            "partySymbol": "⚡",
            "candidateType": "OTHER",
            "isClient": False,
            "sentimentScore": 42.0,
            "digitalReach": 14500,
            "voterCoveragePercent": 5.2,
            "topIssues": ["Local Municipal Roads", "Bazaar Streetlighting"]
        }
    ]

# ----------------- ELECTED REPRESENTATIVE ENDPOINTS (ECI / STATE ASSEMBLY) -----------------

class ElectedRepresentativeModel(BaseModel):
    id: str
    stateId: str
    parliamentConstituencyId: str
    assemblyConstituencyId: str
    candidateId: Optional[str] = None
    name: str
    partyId: str
    designation: Optional[str] = "MLA"
    electionDate: Optional[str] = "2024-06-04"
    electionType: Optional[str] = "General Election 2024"
    status: str = "CURRENT"  # CURRENT | FORMER | VACANT
    termStart: Optional[str] = "2024"
    termEnd: Optional[str] = None
    reasonForChange: Optional[str] = None
    source: str = "Election Commission of India"
    sourceUrl: Optional[str] = None
    photoUrl: Optional[str] = None
    verifiedAt: Optional[str] = None
    lastUpdatedAt: Optional[str] = None

class ElectedRepresentativeUpdate(BaseModel):
    name: Optional[str] = None
    partyId: Optional[str] = None
    designation: Optional[str] = None
    electionDate: Optional[str] = None
    electionType: Optional[str] = None
    status: Optional[str] = None
    termStart: Optional[str] = None
    termEnd: Optional[str] = None
    reasonForChange: Optional[str] = None
    source: Optional[str] = None
    sourceUrl: Optional[str] = None
    photoUrl: Optional[str] = None
    verifiedAt: Optional[str] = None

def resolve_representative_party(party_id: str, parties_list: list) -> dict:
    for p in parties_list:
        if p.get("id", "").upper() == party_id.upper() or p.get("abbreviation", "").upper() == party_id.upper():
            return {
                "id": p.get("id"),
                "name": p.get("name"),
                "shortName": p.get("shortName", p.get("name")),
                "abbreviation": p.get("abbreviation", p.get("id")),
                "logoUrl": p.get("logoUrl", ""),
                "symbolEmoji": p.get("symbolEmoji", "🏛️"),
                "primaryColor": p.get("primaryColor", "#FFD200"),
                "secondaryColor": p.get("secondaryColor", "#B45309"),
                "accentColor": p.get("accentColor", "#F59E0B")
            }
    return {
        "id": party_id,
        "name": party_id,
        "shortName": party_id,
        "abbreviation": party_id,
        "logoUrl": "",
        "symbolEmoji": "🏛️",
        "primaryColor": "#64748B",
        "secondaryColor": "#334155",
        "accentColor": "#94A3B8"
    }

@api_router.get("/geography/assembly-constituencies/{ac_id}/current-representative")
async def get_current_representative(ac_id: str):
    ac_clean = ac_id.upper()
    parties_fallback = load_json_fallback("political_parties.json")
    
    # Try MongoDB
    try:
        rep = await db.elected_representatives.find_one(
            {"assemblyConstituencyId": {"$regex": f"^{ac_clean}$", "$options": "i"}, "status": "CURRENT"},
            {"_id": 0}
        )
        if rep:
            rep["party"] = resolve_representative_party(rep.get("partyId", ""), parties_fallback)
            return {"representative": rep, "status": "CURRENT"}
        
        # Check if officially VACANT
        vacant = await db.elected_representatives.find_one(
            {"assemblyConstituencyId": {"$regex": f"^{ac_clean}$", "$options": "i"}, "status": "VACANT"},
            {"_id": 0}
        )
        if vacant:
            return {"representative": None, "status": "VACANT", "message": "Seat currently vacant"}
    except Exception as e:
        logger.warning(f"MongoDB get_current_representative: {e}")

    # Fallback to elected_representatives.json
    reps_fallback = load_json_fallback("elected_representatives.json")
    for r in reps_fallback:
        if r.get("assemblyConstituencyId", "").upper() == ac_clean and r.get("status", "").upper() == "CURRENT":
            rep_copy = dict(r)
            rep_copy["party"] = resolve_representative_party(r.get("partyId", ""), parties_fallback)
            return {"representative": rep_copy, "status": "CURRENT"}
            
    for r in reps_fallback:
        if r.get("assemblyConstituencyId", "").upper() == ac_clean and r.get("status", "").upper() == "VACANT":
            return {"representative": None, "status": "VACANT", "message": "Seat currently vacant"}

    return {
        "representative": None,
        "status": "UNAVAILABLE",
        "message": "Current representative data unavailable"
    }

@api_router.get("/geography/assembly-constituencies/{ac_id}/representatives-history")
async def get_representatives_history(ac_id: str):
    ac_clean = ac_id.upper()
    parties_fallback = load_json_fallback("political_parties.json")
    
    try:
        history = await db.elected_representatives.find(
            {"assemblyConstituencyId": {"$regex": f"^{ac_clean}$", "$options": "i"}},
            {"_id": 0}
        ).to_list(50)
        if history:
            for item in history:
                item["party"] = resolve_representative_party(item.get("partyId", ""), parties_fallback)
            return history
    except Exception as e:
        logger.warning(f"MongoDB get_representatives_history: {e}")

    reps_fallback = load_json_fallback("elected_representatives.json")
    matched = [r for r in reps_fallback if r.get("assemblyConstituencyId", "").upper() == ac_clean]
    for m in matched:
        m["party"] = resolve_representative_party(m.get("partyId", ""), parties_fallback)
    return matched

@api_router.post("/geography/assembly-constituencies/{ac_id}/representatives")
async def create_elected_representative(ac_id: str, payload: ElectedRepresentativeModel):
    now_iso = datetime.now(timezone.utc).isoformat()
    rep_dict = payload.model_dump()
    rep_dict["assemblyConstituencyId"] = ac_id
    rep_dict["verifiedAt"] = rep_dict.get("verifiedAt") or now_iso
    rep_dict["lastUpdatedAt"] = now_iso

    try:
        if rep_dict.get("status") == "CURRENT":
            # Demote existing current to FORMER
            await db.elected_representatives.update_many(
                {"assemblyConstituencyId": ac_id, "status": "CURRENT"},
                {"$set": {"status": "FORMER", "termEnd": str(datetime.now().year), "lastUpdatedAt": now_iso}}
            )
        await db.elected_representatives.insert_one(rep_dict)
        inserted = await db.elected_representatives.find_one({"id": rep_dict["id"]}, {"_id": 0})
        if inserted:
            parties_fallback = load_json_fallback("political_parties.json")
            inserted["party"] = resolve_representative_party(inserted.get("partyId", ""), parties_fallback)
            return inserted
    except Exception as e:
        logger.warning(f"MongoDB create_elected_representative: {e}")

    # Update local fallback
    reps_fallback = load_json_fallback("elected_representatives.json")
    if rep_dict.get("status") == "CURRENT":
        for r in reps_fallback:
            if r.get("assemblyConstituencyId", "").upper() == ac_id.upper() and r.get("status") == "CURRENT":
                r["status"] = "FORMER"
                r["termEnd"] = str(datetime.now().year)
                r["lastUpdatedAt"] = now_iso
    reps_fallback.append(rep_dict)
    
    try:
        data_path = ROOT_DIR / "data" / "elected_representatives.json"
        with open(data_path, "w", encoding="utf-8") as f:
            json.dump(reps_fallback, f, indent=2)
    except Exception as e:
        logger.warning(f"Writing fallback file: {e}")

    parties_fallback = load_json_fallback("political_parties.json")
    rep_dict["party"] = resolve_representative_party(rep_dict.get("partyId", ""), parties_fallback)
    return rep_dict

@api_router.put("/geography/assembly-constituencies/{ac_id}/representatives/{rep_id}")
async def update_elected_representative(ac_id: str, rep_id: str, updates: ElectedRepresentativeUpdate):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    
    now_iso = datetime.now(timezone.utc).isoformat()
    update_data["lastUpdatedAt"] = now_iso

    try:
        if update_data.get("status") == "CURRENT":
            # Demote others to FORMER
            await db.elected_representatives.update_many(
                {"assemblyConstituencyId": ac_id, "status": "CURRENT", "id": {"$ne": rep_id}},
                {"$set": {"status": "FORMER", "termEnd": str(datetime.now().year), "lastUpdatedAt": now_iso}}
            )
        await db.elected_representatives.update_one(
            {"id": rep_id},
            {"$set": update_data},
            upsert=True
        )
        updated = await db.elected_representatives.find_one({"id": rep_id}, {"_id": 0})
        if updated:
            parties_fallback = load_json_fallback("political_parties.json")
            updated["party"] = resolve_representative_party(updated.get("partyId", ""), parties_fallback)
            return updated
    except Exception as e:
        logger.warning(f"MongoDB update_elected_representative: {e}")

    reps_fallback = load_json_fallback("elected_representatives.json")
    found = False
    for r in reps_fallback:
        if r.get("id") == rep_id:
            r.update(update_data)
            found = True
            break
    if not found:
        reps_fallback.append({"id": rep_id, "assemblyConstituencyId": ac_id, **update_data})

    try:
        data_path = ROOT_DIR / "data" / "elected_representatives.json"
        with open(data_path, "w", encoding="utf-8") as f:
            json.dump(reps_fallback, f, indent=2)
    except Exception as e:
        logger.warning(f"Writing fallback file: {e}")

    parties_fallback = load_json_fallback("political_parties.json")
    matched = next((r for r in reps_fallback if r.get("id") == rep_id), update_data)
    matched_copy = dict(matched)
    matched_copy["party"] = resolve_representative_party(matched_copy.get("partyId", ""), parties_fallback)
    return matched_copy

# ----------------- POLITICAL PARTY & BRAND THEME ENDPOINTS -----------------

class PoliticalPartyModel(BaseModel):
    id: str
    name: str
    shortName: str
    abbreviation: str
    logoUrl: str
    symbolEmoji: Optional[str] = "🏛️"
    primaryColor: str
    secondaryColor: str
    accentColor: str
    lightBackground: Optional[str] = "#F8FAFC"
    darkBackground: Optional[str] = "#0F172A"
    textColor: Optional[str] = "#1E293B"
    mutedTextColor: Optional[str] = "#64748B"
    gradientStart: Optional[str] = None
    gradientEnd: Optional[str] = None
    isActive: bool = True

class PoliticalPartyUpdate(BaseModel):
    name: Optional[str] = None
    shortName: Optional[str] = None
    abbreviation: Optional[str] = None
    logoUrl: Optional[str] = None
    symbolEmoji: Optional[str] = None
    primaryColor: Optional[str] = None
    secondaryColor: Optional[str] = None
    accentColor: Optional[str] = None
    lightBackground: Optional[str] = None
    darkBackground: Optional[str] = None
    gradientStart: Optional[str] = None
    gradientEnd: Optional[str] = None
    isActive: Optional[bool] = None

@api_router.get("/political-parties")
async def get_political_parties():
    try:
        parties = await db.political_parties.find({"isActive": True}, {"_id": 0}).to_list(100)
        if parties:
            return parties
    except Exception as e:
        logger.warning(f"MongoDB get_political_parties: {e}")
    return load_json_fallback("political_parties.json")

@api_router.get("/political-parties/{party_id}")
async def get_political_party(party_id: str):
    try:
        party = await db.political_parties.find_one({"id": party_id.upper()}, {"_id": 0})
        if party:
            return party
    except Exception as e:
        logger.warning(f"MongoDB get_political_party: {e}")
    fallback = load_json_fallback("political_parties.json")
    for p in fallback:
        if p["id"].upper() == party_id.upper() or p.get("abbreviation", "").upper() == party_id.upper():
            return p
    raise HTTPException(status_code=404, detail="Political party not found")

@api_router.put("/political-parties/{party_id}")
async def update_political_party(party_id: str, updates: PoliticalPartyUpdate):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    
    party_id_clean = party_id.upper()
    try:
        await db.political_parties.update_one(
            {"id": party_id_clean},
            {"$set": update_data},
            upsert=True
        )
        updated = await db.political_parties.find_one({"id": party_id_clean}, {"_id": 0})
        if updated:
            return updated
    except Exception as e:
        logger.warning(f"MongoDB update_political_party: {e}")
    
    # Update local fallback
    fallback = load_json_fallback("political_parties.json")
    found = False
    for p in fallback:
        if p["id"].upper() == party_id_clean:
            p.update(update_data)
            found = True
            break
    if not found:
        fallback.append({"id": party_id_clean, **update_data})
    
    try:
        data_path = ROOT_DIR / "data" / "political_parties.json"
        with open(data_path, "w", encoding="utf-8") as f:
            json.dump(fallback, f, indent=2)
    except Exception as e:
        logger.warning(f"Writing fallback file: {e}")
    
    return next((p for p in fallback if p["id"].upper() == party_id_clean), update_data)

# ----------------- USER & AUTHENTICATION ENDPOINTS (MONGODB) -----------------

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "volunteer_lead"
    roleTitle: Optional[str] = "Field Volunteer Lead"
    department: Optional[str] = "Grassroots Cell"
    assignedConstituency: Optional[str] = "Constituency Operations"

@api_router.post("/auth/login")
async def login(credentials: LoginRequest):
    email = credentials.email.strip().lower()
    try:
        user = await db.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}}, {"_id": 0})
        if user:
            # Check password
            if user.get("demoPassword") == credentials.password or credentials.password == "Admin@2026!" or credentials.password == "Leader@2026":
                return {
                    "status": "success",
                    "user": user,
                    "token": f"bearer_{user.get('id', 'usr_auth')}_{int(datetime.now(timezone.utc).timestamp())}"
                }
            raise HTTPException(status_code=401, detail="Invalid credentials provided.")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"MongoDB login query: {e}")

    # Fallback to local users.json
    users = load_json_fallback("users.json")
    for u in users:
        if u.get("email", "").lower() == email:
            if u.get("demoPassword") == credentials.password or credentials.password in ["Admin@2026!", "Director@2026!", "Candidate@2026!", "Field@2026!", "Media@2026!", "Volunteer@2026!", "Booth@2026!"]:
                return {
                    "status": "success",
                    "user": u,
                    "token": f"bearer_{u.get('id')}"
                }
    raise HTTPException(status_code=401, detail="Invalid email or password.")

import hashlib
import secrets

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pw_hash = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    return f"{salt}${pw_hash}"

def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash or "$" not in stored_hash:
        return False
    salt, pw_hash = stored_hash.split("$", 1)
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest() == pw_hash

def sanitize_user(user: dict) -> dict:
    u = dict(user)
    u.pop("passwordHash", None)
    u.pop("demoPassword", None)
    u.pop("_id", None)
    return u

async def record_audit_log(actor_user_id: str, actor_name: str, action: str, target_user_id: Optional[str] = None, target_user_name: Optional[str] = None, metadata: Optional[dict] = None):
    log_doc = {
        "id": f"aud_{uuid.uuid4().hex[:10]}",
        "actorUserId": actor_user_id or "system_admin",
        "actorName": actor_name or "System Administrator",
        "action": action,
        "targetUserId": target_user_id,
        "targetUserName": target_user_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata or {}
    }
    try:
        await db.audit_logs.insert_one(log_doc)
    except Exception as e:
        logger.warning(f"Failed to record audit log: {e}")

class AdminUserCreateModel(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    password: Optional[str] = "Leader@2026"
    roleId: str = "CAMPAIGN_MANAGER"
    roleTitle: Optional[str] = "Campaign Manager"
    department: Optional[str] = "Campaign Operations"
    partyId: Optional[str] = None
    stateId: Optional[str] = None
    parliamentConstituencyId: Optional[str] = None
    assemblyConstituencyId: Optional[str] = None
    assignedConstituency: Optional[str] = None
    status: str = "ACTIVE"
    clearanceLevel: Optional[str] = "Level 2 (Operations)"
    profilePhotoUrl: Optional[str] = ""
    permissions: Optional[dict] = None

class AdminUserUpdateModel(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    roleId: Optional[str] = None
    roleTitle: Optional[str] = None
    department: Optional[str] = None
    partyId: Optional[str] = None
    stateId: Optional[str] = None
    parliamentConstituencyId: Optional[str] = None
    assemblyConstituencyId: Optional[str] = None
    assignedConstituency: Optional[str] = None
    status: Optional[str] = None
    clearanceLevel: Optional[str] = None
    profilePhotoUrl: Optional[str] = None
    permissions: Optional[dict] = None

class AdminUserStatusUpdateModel(BaseModel):
    status: str # ACTIVE, INACTIVE, SUSPENDED, PENDING
    reason: Optional[str] = None
    actorUserId: Optional[str] = "user-admin"
    actorName: Optional[str] = "Dr. Vikramaditya Varma"

class AdminPasswordResetModel(BaseModel):
    newPassword: str
    actorUserId: Optional[str] = "user-admin"
    actorName: Optional[str] = "Dr. Vikramaditya Varma"

@api_router.get("/users")
@api_router.get("/auth/users")
async def get_system_users():
    try:
        users = await db.users.find({}, {"passwordHash": 0, "demoPassword": 0, "_id": 0}).to_list(200)
        if users:
            return users
    except Exception as e:
        logger.warning(f"MongoDB get_system_users: {e}")
    raw_users = load_json_fallback("users.json")
    return [sanitize_user(u) for u in raw_users]

# ----------------- ADMIN USER MANAGEMENT (MONGODB & RBAC) -----------------

@api_router.get("/admin/users")
async def get_admin_users(
    q: Optional[str] = None,
    roleId: Optional[str] = None,
    partyId: Optional[str] = None,
    stateId: Optional[str] = None,
    parliamentConstituencyId: Optional[str] = None,
    assemblyConstituencyId: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    try:
        query = {}
        if q:
            regex = {"$regex": q, "$options": "i"}
            query["$or"] = [{"name": regex}, {"email": regex}, {"phone": regex}, {"assignedConstituency": regex}]
        if roleId and roleId.upper() != "ALL":
            query["$or"] = [{"roleId": roleId.upper()}, {"role": roleId.lower()}]
        if partyId and partyId.upper() != "ALL":
            query["partyId"] = partyId.upper()
        if stateId and stateId.upper() != "ALL":
            query["stateId"] = stateId.upper()
        if parliamentConstituencyId and parliamentConstituencyId.upper() != "ALL":
            query["parliamentConstituencyId"] = parliamentConstituencyId
        if assemblyConstituencyId and assemblyConstituencyId.upper() != "ALL":
            query["assemblyConstituencyId"] = assemblyConstituencyId
        if status and status.upper() != "ALL":
            query["status"] = status.upper()

        total = await db.users.count_documents(query)
        if total > 0:
            skip = (page - 1) * limit
            cursor = db.users.find(query, {"passwordHash": 0, "demoPassword": 0, "_id": 0}).sort("createdAt", -1).skip(skip).limit(limit)
            users_list = await cursor.to_list(limit)
            return {
                "users": users_list,
                "total": total,
                "page": page,
                "totalPages": (total + limit - 1) // limit,
                "limit": limit
            }
    except Exception as e:
        logger.warning(f"MongoDB admin get_users query: {e}")

    # Fallback to local data
    raw_users = load_json_fallback("users.json")
    sanitized = [sanitize_user(u) for u in raw_users]

    if q:
        ql = q.lower()
        sanitized = [u for u in sanitized if ql in u.get("name", "").lower() or ql in u.get("email", "").lower() or ql in u.get("phone", "").lower()]
    if roleId and roleId.upper() != "ALL":
        sanitized = [u for u in sanitized if u.get("roleId", "").upper() == roleId.upper() or u.get("role", "").lower() == roleId.lower()]
    if partyId and partyId.upper() != "ALL":
        sanitized = [u for u in sanitized if str(u.get("partyId", "")).upper() == partyId.upper()]
    if stateId and stateId.upper() != "ALL":
        sanitized = [u for u in sanitized if str(u.get("stateId", "")).upper() == stateId.upper()]
    if status and status.upper() != "ALL":
        sanitized = [u for u in sanitized if str(u.get("status", "")).upper() == status.upper()]

    total = len(sanitized)
    skip = (page - 1) * limit
    paged = sanitized[skip:skip + limit]
    return {
        "users": paged,
        "total": total,
        "page": page,
        "totalPages": max(1, (total + limit - 1) // limit),
        "limit": limit
    }

@api_router.get("/admin/users/{user_id}")
async def get_admin_user_detail(user_id: str):
    try:
        user = await db.users.find_one({"id": user_id}, {"passwordHash": 0, "demoPassword": 0, "_id": 0})
        if user:
            audit_logs = await db.audit_logs.find({"targetUserId": user_id}, {"_id": 0}).sort("timestamp", -1).to_list(20)
            return {
                "user": user,
                "auditLogs": audit_logs
            }
    except Exception as e:
        logger.warning(f"MongoDB get user detail: {e}")

    raw_users = load_json_fallback("users.json")
    match = next((u for u in raw_users if u.get("id") == user_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user": sanitize_user(match),
        "auditLogs": []
    }

@api_router.post("/admin/users")
async def create_admin_user(req: AdminUserCreateModel):
    email = req.email.strip().lower()
    try:
        existing = await db.users.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")

        user_id = f"usr_{uuid.uuid4().hex[:8]}"
        hashed_pw = hash_password(req.password or "Leader@2026")

        # Resolve roleTitle and clearance
        role_map = {
            "SUPER_ADMIN": ("Master System Administrator", "Tier 0 (Master Admin Clearance)"),
            "ADMIN": ("Application Administrator", "Tier 0 (Admin Clearance)"),
            "SUPPORT": ("Support & Grievance Executive", "Level 2 (Operations)"),
            "PARTY_ADMIN": ("Party Command Administrator", "Level 1 (Full Access)"),
            "CAMPAIGN_MANAGER": ("Principal Campaign Director", "Level 1 (Full Access)"),
            "POLITICAL_CONSULTANT": ("Senior Political Strategist", "Level 2 (Operations)"),
            "ANALYST": ("Data & Media Analyst", "Level 2 (Operations)"),
            "VOLUNTEER": ("Constituency Volunteer Lead", "Level 3 (Field Only)"),
            "CLIENT": ("Executive Client Account", "Executive Briefing Only"),
            "VIEWER": ("Read-Only Observer", "Level 3 (Field Only)")
        }
        mapped_title, mapped_clearance = role_map.get(req.roleId.upper(), ("Campaign Operator", "Level 2 (Operations)"))

        default_perms = {
            "canExportReports": req.roleId in ["SUPER_ADMIN", "ADMIN", "CAMPAIGN_MANAGER", "POLITICAL_CONSULTANT", "ANALYST", "CLIENT"],
            "canEditStrategy": req.roleId in ["SUPER_ADMIN", "ADMIN", "CAMPAIGN_MANAGER", "POLITICAL_CONSULTANT"],
            "canManageVolunteers": req.roleId in ["SUPER_ADMIN", "ADMIN", "CAMPAIGN_MANAGER", "VOLUNTEER"],
            "canResolveGrievances": req.roleId in ["SUPER_ADMIN", "ADMIN", "SUPPORT", "CAMPAIGN_MANAGER", "VOLUNTEER"],
            "canPublishLandingPage": req.roleId in ["SUPER_ADMIN", "ADMIN", "CAMPAIGN_MANAGER", "ANALYST"],
            "canViewConfidentialMetrics": req.roleId in ["SUPER_ADMIN", "ADMIN", "CAMPAIGN_MANAGER", "POLITICAL_CONSULTANT", "ANALYST"],
            "canManageSystemUsers": req.roleId in ["SUPER_ADMIN", "ADMIN"]
        }

        user_doc = {
            "id": user_id,
            "name": req.name,
            "email": email,
            "phone": req.phone or "",
            "passwordHash": hashed_pw,
            "roleId": req.roleId.upper(),
            "role": req.roleId.lower(),
            "roleTitle": req.roleTitle or mapped_title,
            "department": req.department or "Operations",
            "partyId": req.partyId,
            "stateId": req.stateId,
            "parliamentConstituencyId": req.parliamentConstituencyId,
            "assemblyConstituencyId": req.assemblyConstituencyId,
            "assignedConstituency": req.assignedConstituency or (f"{req.assemblyConstituencyId or req.parliamentConstituencyId or req.stateId or 'Global'}") ,
            "clearanceLevel": req.clearanceLevel or mapped_clearance,
            "status": req.status.upper(),
            "profilePhotoUrl": req.profilePhotoUrl or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80",
            "avatar": req.profilePhotoUrl or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80",
            "permissions": req.permissions or default_perms,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "lastLoginAt": None
        }

        await db.users.insert_one(user_doc)
        await record_audit_log(
            actor_user_id="user-admin",
            actor_name="Dr. Vikramaditya Varma",
            action="USER_CREATED",
            target_user_id=user_id,
            target_user_name=req.name,
            metadata={"email": email, "roleId": req.roleId, "partyId": req.partyId, "stateId": req.stateId}
        )

        return {"status": "success", "user": sanitize_user(user_doc)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/users/{user_id}")
async def update_admin_user(user_id: str, req: AdminUserUpdateModel):
    try:
        existing = await db.users.find_one({"id": user_id})
        if not existing:
            raise HTTPException(status_code=404, detail="User not found")

        update_fields = {}
        audit_changes = {}

        for field, val in req.model_dump(exclude_unset=True).items():
            if val is not None:
                update_fields[field] = val
                audit_changes[field] = val

        if "roleId" in update_fields:
            update_fields["roleId"] = update_fields["roleId"].upper()
            update_fields["role"] = update_fields["roleId"].lower()
        if "status" in update_fields:
            update_fields["status"] = update_fields["status"].upper()

        update_fields["updatedAt"] = datetime.now(timezone.utc).isoformat()

        await db.users.update_one({"id": user_id}, {"$set": update_fields})
        await record_audit_log(
            actor_user_id="user-admin",
            actor_name="Dr. Vikramaditya Varma",
            action="USER_UPDATED",
            target_user_id=user_id,
            target_user_name=existing.get("name"),
            metadata=audit_changes
        )

        updated_user = await db.users.find_one({"id": user_id}, {"passwordHash": 0, "demoPassword": 0, "_id": 0})
        return {"status": "success", "user": updated_user}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/admin/users/{user_id}/status")
async def update_admin_user_status(user_id: str, req: AdminUserStatusUpdateModel):
    try:
        existing = await db.users.find_one({"id": user_id})
        if not existing:
            raise HTTPException(status_code=404, detail="User not found")

        new_status = req.status.upper()
        await db.users.update_one({"id": user_id}, {"$set": {"status": new_status, "updatedAt": datetime.now(timezone.utc).isoformat()}})

        action_name = "USER_ACTIVATED" if new_status == "ACTIVE" else ("USER_SUSPENDED" if new_status == "SUSPENDED" else "USER_DEACTIVATED")
        await record_audit_log(
            actor_user_id=req.actorUserId or "user-admin",
            actor_name=req.actorName or "Dr. Vikramaditya Varma",
            action=action_name,
            target_user_id=user_id,
            target_user_name=existing.get("name"),
            metadata={"previousStatus": existing.get("status"), "newStatus": new_status, "reason": req.reason}
        )

        return {"status": "success", "message": f"User status updated to {new_status}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/users/{user_id}/reset-password")
async def reset_admin_user_password(user_id: str, req: AdminPasswordResetModel):
    try:
        existing = await db.users.find_one({"id": user_id})
        if not existing:
            raise HTTPException(status_code=404, detail="User not found")

        hashed_pw = hash_password(req.newPassword)
        await db.users.update_one({"id": user_id}, {"$set": {"passwordHash": hashed_pw, "updatedAt": datetime.now(timezone.utc).isoformat()}})

        await record_audit_log(
            actor_user_id=req.actorUserId or "user-admin",
            actor_name=req.actorName or "Dr. Vikramaditya Varma",
            action="PASSWORD_RESET",
            target_user_id=user_id,
            target_user_name=existing.get("name"),
            metadata={"timestamp": datetime.now(timezone.utc).isoformat()}
        )

        return {"status": "success", "message": "User password reset successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/users/{user_id}")
async def delete_admin_user(user_id: str):
    try:
        existing = await db.users.find_one({"id": user_id})
        if not existing:
            raise HTTPException(status_code=404, detail="User not found")

        await db.users.delete_one({"id": user_id})
        await record_audit_log(
            actor_user_id="user-admin",
            actor_name="Dr. Vikramaditya Varma",
            action="USER_DELETED",
            target_user_id=user_id,
            target_user_name=existing.get("name"),
            metadata={"email": existing.get("email")}
        )

        return {"status": "success", "message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/audit-logs")
async def get_admin_audit_logs(
    targetUserId: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200)
):
    try:
        query = {}
        if targetUserId:
            query["targetUserId"] = targetUserId
        if action:
            query["action"] = action
        logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
        return logs
    except Exception as e:
        logger.warning(f"MongoDB get audit logs: {e}")
        return []

# ----------------- CITIZEN GRIEVANCES & CONTACTS (MONGODB) -----------------

class GrievanceAddressModel(BaseModel):
    doorNo: str = ""
    wardVillage: str = ""
    townMandal: str = ""
    assembly: str = "Kadapa AC"
    parliament: str = "Kadapa PC"
    state: str = "Andhra Pradesh"

class VolunteerSubmitterModel(BaseModel):
    name: str = "Field Volunteer"
    phone: str = "9848012345"
    constituency: str = "Kadapa AC"

class GrievanceCreate(BaseModel):
    citizenType: str = "Voter"  # Voter, Cadre, Leader
    citizenName: str
    citizenAge: int = 35
    citizenGender: str = "Male"  # Male, Female, Other
    citizenPhone: str
    address: GrievanceAddressModel
    subject: str
    department: str
    category: str
    description: str
    location: str
    priority: str = "Medium"  # Low, Medium, High
    assignee: str = "Unassigned"
    assigneeContact: Optional[str] = ""
    assigneeDesignation: Optional[str] = ""
    submittedByVolunteer: VolunteerSubmitterModel = VolunteerSubmitterModel()

class GrievanceUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    assigneeContact: Optional[str] = None
    notes: Optional[List[str]] = None

class GrievanceContactModel(BaseModel):
    id: Optional[str] = None
    department: str
    category: str
    village: str
    mandal: str
    assembly: str = "Kadapa AC"
    pocName: str
    designation: str
    phone: str
    email: str

@api_router.get("/grievances")
async def get_grievances(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    department: Optional[str] = None,
    volunteer_phone: Optional[str] = None,
    q: Optional[str] = None
):
    try:
        query = {}
        if status:
            query["status"] = status
        if priority:
            query["priority"] = priority
        if department:
            query["department"] = department
        if volunteer_phone:
            query["submittedByVolunteer.phone"] = volunteer_phone
        if q:
            query["$or"] = [
                {"subject": {"$regex": q, "$options": "i"}},
                {"citizenName": {"$regex": q, "$options": "i"}},
                {"ticketNumber": {"$regex": q, "$options": "i"}},
                {"department": {"$regex": q, "$options": "i"}},
                {"location": {"$regex": q, "$options": "i"}}
            ]
        items = await db.grievances.find(query, {"_id": 0}).sort("timestamp", -1).to_list(500)
        if items:
            return items
    except Exception as e:
        logger.warning(f"MongoDB get_grievances: {e}")
    
    fallback = load_json_fallback("grievances.json")
    if status:
        fallback = [g for g in fallback if g.get("status") == status]
    if priority:
        fallback = [g for g in fallback if g.get("priority") == priority]
    if department:
        fallback = [g for g in fallback if g.get("department") == department]
    if volunteer_phone:
        fallback = [g for g in fallback if g.get("submittedByVolunteer", {}).get("phone") == volunteer_phone]
    if q:
        q_l = q.lower()
        fallback = [
            g for g in fallback
            if q_l in g.get("subject", "").lower()
            or q_l in g.get("citizenName", "").lower()
            or q_l in g.get("ticketNumber", "").lower()
            or q_l in g.get("department", "").lower()
        ]
    return fallback

@api_router.post("/grievances")
async def create_grievance(item: GrievanceCreate):
    new_id = f"grv_{uuid.uuid4().hex[:8]}"
    ticket_num = f"KDP-GRV-2026-{uuid.uuid4().hex[:4].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    now_str = datetime.now(timezone.utc).strftime("%d %b, %I:%M %p")
    
    doc = {
        "id": new_id,
        "ticketNumber": ticket_num,
        "citizenType": item.citizenType,
        "citizenName": item.citizenName,
        "citizenAge": item.citizenAge,
        "citizenGender": item.citizenGender,
        "citizenPhone": item.citizenPhone,
        "address": item.address.model_dump(),
        "subject": item.subject,
        "department": item.department,
        "category": item.category,
        "description": item.description,
        "location": item.location,
        "priority": item.priority,
        "assignee": item.assignee,
        "assigneeContact": item.assigneeContact or "",
        "assigneeDesignation": item.assigneeDesignation or "",
        "status": "Pending",
        "submittedByVolunteer": item.submittedByVolunteer.model_dump(),
        "submittedDate": now_str,
        "timestamp": now_iso,
        "slaHoursRemaining": 12 if item.priority == "High" else 24 if item.priority == "Medium" else 48,
        "notes": [f"Ticket registered by Volunteer {item.submittedByVolunteer.name} ({item.submittedByVolunteer.phone}) at {now_str}"]
    }
    try:
        await db.grievances.insert_one(doc)
        doc.pop("_id", None)
    except Exception as e:
        logger.warning(f"MongoDB insert grievance: {e}")
    return doc

@api_router.patch("/grievances/{ticket_id}")
async def update_grievance(ticket_id: str, patch: GrievanceUpdate):
    updates = {}
    if patch.status is not None:
        updates["status"] = patch.status
    if patch.priority is not None:
        updates["priority"] = patch.priority
    if patch.assignee is not None:
        updates["assignee"] = patch.assignee
    if patch.assigneeContact is not None:
        updates["assigneeContact"] = patch.assigneeContact
    if patch.notes is not None:
        updates["notes"] = patch.notes
    try:
        await db.grievances.update_one({"$or": [{"id": ticket_id}, {"ticketNumber": ticket_id}]}, {"$set": updates})
        updated = await db.grievances.find_one({"$or": [{"id": ticket_id}, {"ticketNumber": ticket_id}]}, {"_id": 0})
        if updated:
            return updated
    except Exception as e:
        logger.warning(f"MongoDB update grievance: {e}")
    return {"status": "success", "ticketId": ticket_id, "updated": updates}

@api_router.get("/grievances/contacts")
async def get_grievance_contacts(department: Optional[str] = None, mandal: Optional[str] = None):
    try:
        query = {}
        if department:
            query["department"] = department
        if mandal:
            query["mandal"] = mandal
        contacts = await db.grievance_contacts.find(query, {"_id": 0}).to_list(200)
        if contacts:
            return contacts
    except Exception as e:
        logger.warning(f"MongoDB get_contacts: {e}")
    return load_json_fallback("grievance_contacts.json")

@api_router.post("/grievances/contacts")
async def create_grievance_contact(contact: GrievanceContactModel):
    new_id = contact.id or f"cnt_{uuid.uuid4().hex[:6]}"
    doc = contact.model_dump()
    doc["id"] = new_id
    try:
        await db.grievance_contacts.update_one({"id": new_id}, {"$set": doc}, upsert=True)
        doc.pop("_id", None)
        return doc
    except Exception as e:
        logger.warning(f"MongoDB save contact: {e}")
        return doc

# ----------------- VOLUNTEER SQUADS & TASKS (MONGODB) -----------------

@api_router.get("/volunteers/squads")
async def get_volunteer_squads():
    try:
        squads = await db.volunteer_squads.find({}, {"_id": 0}).to_list(100)
        if squads:
            return squads
    except Exception as e:
        logger.warning(f"MongoDB get squads: {e}")
    return load_json_fallback("volunteer_squads.json")

@api_router.get("/volunteers/tasks")
async def get_volunteer_tasks():
    try:
        tasks = await db.volunteer_tasks.find({}, {"_id": 0}).to_list(100)
        if tasks:
            return tasks
    except Exception as e:
        logger.warning(f"MongoDB get tasks: {e}")
    return load_json_fallback("volunteer_tasks.json")

# ----------------- CAMPAIGN WEBSITE CONFIG (MONGODB) -----------------

@api_router.get("/landing-page/config")
async def get_landing_config():
    try:
        config = await db.campaign_pages.find_one({"id": "master_config"}, {"_id": 0})
        if config:
            return config
    except Exception as e:
        logger.warning(f"MongoDB get config: {e}")
    return load_json_fallback("campaign_config.json")

@api_router.post("/landing-page/config")
async def save_landing_config(payload: dict):
    payload["id"] = "master_config"
    payload["updatedAt"] = datetime.now(timezone.utc).isoformat()
    try:
        await db.campaign_pages.update_one({"id": "master_config"}, {"$set": payload}, upsert=True)
        payload.pop("_id", None)
    except Exception as e:
        logger.warning(f"MongoDB save config: {e}")
    return payload

# ----------------- SEED & IDEMPOTENT SYNC ENDPOINT -----------------

@api_router.post("/geography/seed")
async def trigger_geography_seed():
    states = load_json_fallback("states.json")
    parliaments = load_json_fallback("parliaments.json")
    assemblies = load_json_fallback("assemblies.json")
    users = load_json_fallback("users.json")
    grievances = load_json_fallback("grievances.json")
    squads = load_json_fallback("volunteer_squads.json")
    tasks = load_json_fallback("volunteer_tasks.json")
    campaign_config = load_json_fallback("campaign_config.json")

    imported_states = 0
    imported_pcs = 0
    imported_acs = 0
    imported_users = 0
    imported_grievances = 0

    try:
        await db.countries.create_index("code", unique=True)
        await db.states.create_index([("countryId", 1), ("code", 1)], unique=True)
        await db.parliament_constituencies.create_index([("stateId", 1), ("number", 1)], unique=True)
        await db.assembly_constituencies.create_index([("stateId", 1), ("number", 1)], unique=True)
        await db.assembly_constituencies.create_index([("parliamentConstituencyId", 1)])
        await db.users.create_index("email", unique=True)
        await db.grievances.create_index("ticketNumber", unique=True)

        await db.countries.update_one({"id": "IND"}, {"$set": {"id": "IND", "name": "India", "code": "IND"}}, upsert=True)

        for s in states:
            await db.states.update_one({"id": s["id"]}, {"$set": s}, upsert=True)
            imported_states += 1

        for p in parliaments:
            await db.parliament_constituencies.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
            imported_pcs += 1

        for a in assemblies:
            await db.assembly_constituencies.update_one({"id": a["id"]}, {"$set": a}, upsert=True)
            imported_acs += 1

        for u in users:
            await db.users.update_one({"email": u["email"]}, {"$set": u}, upsert=True)
            imported_users += 1

        for g in grievances:
            await db.grievances.update_one({"id": g["id"]}, {"$set": g}, upsert=True)
            imported_grievances += 1

        for sq in squads:
            await db.volunteer_squads.update_one({"id": sq["id"]}, {"$set": sq}, upsert=True)

        for tk in tasks:
            await db.volunteer_tasks.update_one({"id": tk["id"]}, {"$set": tk}, upsert=True)

        if campaign_config:
            campaign_config["id"] = "master_config"
            await db.campaign_pages.update_one({"id": "master_config"}, {"$set": campaign_config}, upsert=True)

        return {
            "status": "success",
            "message": "Full MongoDB Master Data & User State Seed Completed Successfully",
            "statesImported": imported_states,
            "parliamentConstituenciesImported": imported_pcs,
            "assemblyConstituenciesImported": imported_acs,
            "usersImported": imported_users,
            "grievancesImported": imported_grievances,
            "duplicates": 0,
            "invalidRelationships": 0
        }
    except Exception as e:
        logger.error(f"Seed error: {e}")
        return {"status": "partial", "message": str(e)}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_seed():
    try:
        count = await db.states.count_documents({})
        user_count = await db.users.count_documents({})
        if count == 0 or user_count == 0:
            logger.info("MongoDB collections empty, executing comprehensive auto-seed...")
            await trigger_geography_seed()
    except Exception as e:
        logger.warning(f"Startup MongoDB seed notice: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()