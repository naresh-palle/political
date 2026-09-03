from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

class Mandal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    stateId: str
    assemblyConstituencyId: str
    name: str
    code: str
    totalVillages: int = 0
    totalVoters: Optional[int] = 0
    isActive: bool = True

class Village(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    mandalId: str
    assemblyConstituencyId: str
    stateId: str
    name: str
    code: str
    totalVoters: Optional[int] = 0
    assignedVolunteerId: Optional[str] = None
    assignedVolunteerName: Optional[str] = None
    isActive: bool = True

class WorkUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"upd-{uuid.uuid4().hex[:8]}")
    issueId: str
    volunteerId: str
    volunteerName: str
    previousStatus: str
    newStatus: str
    updateDate: str
    remarks: str
    attachments: List[str] = Field(default_factory=list)
    proofLocation: Optional[Dict[str, Any]] = None
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FieldIssue(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"iss-{uuid.uuid4().hex[:8]}")
    title: str
    description: str
    category: str  # Road, Water Supply, Electricity, Welfare, Revenue, Healthcare, Sanitation, Drainage, Education, Other
    priority: str = "MEDIUM"  # LOW, MEDIUM, HIGH, URGENT
    status: str = "NEW"  # NEW, ACKNOWLEDGED, ASSIGNED, IN_PROGRESS, ON_HOLD, RESOLVED, COMPLETED, REJECTED, OVERDUE
    issueType: str = "COMPLAINT"  # COMPLAINT, REQUIREMENT, CIVIC_ISSUE

    stateId: str
    districtId: Optional[str] = None
    parliamentConstituencyId: Optional[str] = None
    assemblyConstituencyId: str
    mandalId: str
    mandalName: str
    villageId: str
    villageName: str
    placeName: Optional[str] = None

    reportedBy: str
    reporterPhone: Optional[str] = None
    reportedDate: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    dueDate: Optional[str] = None

    assignedVolunteerId: Optional[str] = None
    assignedVolunteerName: Optional[str] = None
    directorId: Optional[str] = None
    directorName: Optional[str] = None

    initialRemarks: Optional[str] = None
    attachments: List[str] = Field(default_factory=list)
    isImmutable: bool = True  # Original submission cannot be edited by volunteer
    
    lastStatusUpdateAt: Optional[str] = None
    lastStatusRemarks: Optional[str] = None
    lastStatusProof: Optional[str] = None

    createdBy: str
    createdByRole: str
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FieldNotification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"notif-{uuid.uuid4().hex[:8]}")
    recipientUserId: str
    recipientRole: str
    type: str  # NEW_COMPLAINT, WORK_ASSIGNED, WORK_COMPLETED, WORK_OVERDUE, PROOF_UPLOADED, INACTIVITY_WARNING
    title: str
    message: str
    issueId: Optional[str] = None
    workId: Optional[str] = None
    volunteerId: Optional[str] = None
    priority: str = "NORMAL"  # LOW, NORMAL, HIGH, URGENT
    isRead: bool = False
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FieldAuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"aud-{uuid.uuid4().hex[:8]}")
    actorUserId: str
    actorName: str
    actorRole: str
    action: str
    entityType: str
    entityId: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NotificationAudit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"wa-{uuid.uuid4().hex[:8]}")
    issueId: str
    leaderId: Optional[str] = None
    leaderName: str
    organizationId: Optional[str] = None
    departmentId: Optional[str] = None
    departmentName: str
    officerName: str
    officerDesignation: Optional[str] = None
    officerPhone: str
    channel: str = "WHATSAPP"
    templateName: str = "ticket_assignment_alert"
    providerMessageId: Optional[str] = None
    status: str = "DELIVERED"  # SENT, DELIVERED, FAILED
    sentAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    errorCode: Optional[str] = None
    errorMessage: Optional[str] = None
    messageContent: str

class AssignAndNotifyPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    departmentId: Optional[Any] = None
    departmentContactId: Optional[str] = None
    assignedOfficialName: Optional[str] = None
    assignedOfficialRole: Optional[str] = None
    assignedOfficialPhone: Optional[str] = None

