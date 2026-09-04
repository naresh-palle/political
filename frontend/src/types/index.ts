export type ConfidenceLevel = "Verified" | "Estimated" | "Manual" | "Derived" | "Live" | "Mixed";

export type PlatformType = "facebook" | "instagram" | "youtube" | "x";

export type AdminUserRole = 
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SUPPORT"
  | "PARTY_ADMIN"
  | "CAMPAIGN_MANAGER"
  | "POLITICAL_CONSULTANT"
  | "ANALYST"
  | "VOLUNTEER"
  | "CLIENT"
  | "VIEWER";

export type UserRole = 
  | AdminUserRole
  | "super_admin"
  | "admin"
  | "support"
  | "party_admin"
  | "campaign_manager"
  | "political_consultant"
  | "analyst"
  | "volunteer"
  | "client"
  | "viewer"
  | "campaign_director" 
  | "field_strategist" 
  | "media_analyst" 
  | "candidate_executive" 
  | "volunteer_lead"
  | "booth_coordinator";

export type UserAccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

export type PrimaryRole = "SUPER_ADMIN" | "POLITICAL_ADMIN" | "DIRECTOR" | "VOLUNTEER";

export interface UserProfile {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  primaryRole?: PrimaryRole;
  isPlatformAdmin?: boolean;
  isPoliticalAdmin?: boolean;
  role: UserRole;
  roleId?: AdminUserRole | string;
  roleTitle: string;
  designation?: string;
  department?: string;
  demoPassword?: string;
  avatar: string;
  profilePhotoUrl?: string;
  assignedConstituency: string;
  clearanceLevel: string;
  partyId?: string | null;
  partyName?: string;
  partyAbbr?: string;
  partyColor?: string;
  partyEmoji?: string;
  directorId?: string | null;
  directorName?: string | null;
  stateId?: string | null;
  stateName?: string;
  parliamentConstituencyId?: string | null;
  parliamentConstituencyName?: string;
  assemblyConstituencyId?: string | null;
  assemblyConstituencyName?: string;
  assignedMandalId?: string | null;
  assignedMandalName?: string | null;
  assignedMandalIds?: string[];
  assignedVillageIds?: string[];
  assignedVillageNames?: string[];
  status?: UserAccountStatus;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  permissions: {
    canExportReports: boolean;
    canEditStrategy: boolean;
    canManageVolunteers: boolean;
    canResolveGrievances: boolean;
    canPublishLandingPage: boolean;
    canViewConfidentialMetrics: boolean;
    canManageSystemUsers?: boolean;
  };
}

export interface AuditLogEntry {
  _id?: string;
  id: string;
  actorUserId: string;
  actorName: string;
  action: string;
  targetUserId?: string;
  targetUserName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface StateInfo {
  id: string;
  name: string;
  code: string;
  countryId?: string;
  type?: "STATE" | "UNION_TERRITORY" | string;
  totalParliamentaryConstituencies?: number;
  totalAssemblyConstituencies?: number;
  isActive?: boolean;
}

export interface PoliticalParty {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  logoUrl: string;
  symbolEmoji?: string;
  backgroundImageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  lightBackground?: string;
  darkBackground?: string;
  textColor?: string;
  mutedTextColor?: string;
  gradientStart?: string;
  gradientEnd?: string;
  isActive?: boolean;
}

export interface ParliamentInfo {
  id: string;
  stateId: string;
  name: string;
  code: string;
}

export interface AssemblyInfo {
  id: string;
  parliamentId: string;
  stateId: string;
  name: string;
  code: string;
  number?: number;
  reservedCategory?: string;
  totalVoters: number;
  candidateCount: number;
  estimatedDigitalAudience: number;
}

export interface SocialPlatformAccount {
  platform: PlatformType;
  handle: string;
  url: string;
  verified: boolean;
  audience: number;
  engagementRate: number;
  activityLevel: "High" | "Medium" | "Moderate" | "Low" | "Inactive";
  monthlyPosts: number;
  estimatedReach: number;
  lastActive: string;
}

export type RepresentativeStatus = "CURRENT" | "FORMER" | "VACANT";

export type CandidateType =
  | "CURRENT_MLA"
  | "PROSPECTIVE_CANDIDATE"
  | "MLA_IN_CHARGE"
  | "PRIMARY_OPPOSITION"
  | "SECONDARY_OPPOSITION"
  | "OTHER";

export interface ElectedRepresentative {
  id: string;
  stateId: string;
  parliamentConstituencyId: string;
  assemblyConstituencyId: string;
  candidateId?: string;
  name: string;
  partyId: string;
  designation: string;
  electionDate: string;
  electionType: string;
  status: RepresentativeStatus;
  termStart: string;
  termEnd?: string;
  reasonForChange?: string;
  source: string;
  sourceUrl?: string;
  photoUrl?: string;
  verifiedAt: string;
  lastUpdatedAt: string;
  party?: PoliticalParty;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  partyAbbr: string;
  partyColor: string;
  partyId?: string;
  isClient: boolean;
  isCurrentRepresentative?: boolean;
  candidateType?: CandidateType;
  role: string;
  avatarUrl: string;
  socialStrengthScore: number;
  rank: number;
  combinedFollowing: number;
  verifiedPlatformsCount: number;
  totalPlatformsCount: number;
  postingFrequencyMonthly: number;
  avgEngagementRate: number;
  estimatedReach: number;
  issueCoverageScore: number;
  socials: SocialPlatformAccount[];
}

export interface PlatformAudienceDetail {
  platform: PlatformType;
  displayName: string;
  estimatedAudience: number;
  clientReach: number;
  coveragePercentage: number;
  reachGap: number;
  overlapFactor: number;
  confidence: ConfidenceLevel;
  methodologyNotes: string;
}

export interface IssueItem {
  id: string;
  rank: number;
  name: string;
  category: string;
  mentionsCount: number;
  engagementScore: number;
  contentActivity: "High" | "Medium" | "Moderate" | "Low" | "Inactive";
  relativeStrength: number;
  clientLead: boolean;
  sentimentScore: number;
  topHashtags: string[];
}

export interface RecommendationItem {
  id: string;
  num: string;
  title: string;
  category: "Platform" | "Content" | "Field" | "Issue" | "Demographic";
  priority: "Critical" | "High" | "Medium";
  observation: string;
  implication: string;
  opportunity: string;
  targetPlatform?: PlatformType;
  expectedImpact: string;
}

export interface ScorecardDimension {
  id: string;
  name: string;
  score: number;
  benchmark: number;
  description: string;
  status: "Leading" | "Competitive" | "Lagging" | "Strong";
}

export interface DataConfidenceRecord {
  metric: string;
  source: string;
  date: string;
  confidence: ConfidenceLevel;
  notes: string;
}

export interface AuditReport {
  id: string;
  generatedAt: string;
  freshness: "Live" | "Estimated" | "Mixed";
  state: StateInfo;
  parliament: ParliamentInfo;
  assembly: AssemblyInfo;
  client: Candidate;
  candidates: Candidate[];
  voterStats: {
    totalVoters: number;
    estimatedUniqueClientReach: number;
    voterCoveragePercentage: number;
    voterReachGap: number;
  };
  digitalStats: {
    totalDigitalAudience: number;
    clientDigitalCoveragePercentage: number;
    combinedFollowing: number;
  };
  platformBreakdown: PlatformAudienceDetail[];
  issues: IssueItem[];
  recommendations: RecommendationItem[];
  scorecard: ScorecardDimension[];
  overallStrengthScore: number;
  dataConfidence: DataConfidenceRecord[];
  headline: string;
  keyObservations: string[];
}

// Grievance Module Types
export type GrievancePriority = "Low" | "Medium" | "High";
export type GrievanceStatus = "Pending" | "Completed" | "Can't be done" | "In_Progress" | "Open" | "Resolved" | "Assigned";
export type GrievanceCitizenType = "Voter" | "Cadre" | "Leader";

export interface GrievanceAddress {
  doorNo: string;
  wardVillage: string;
  townMandal: string;
  assembly: string;
  parliament: string;
  state: string;
}

export interface GrievanceItem {
  id: string;
  ticketNumber: string;
  // Personal details
  citizenType: GrievanceCitizenType;
  citizenName: string;
  citizenAge: number;
  citizenGender: "Male" | "Female" | "Other";
  citizenPhone: string;
  address: GrievanceAddress;
  // Issue details
  subject: string;
  department: string;
  category: string;
  description: string;
  location: string;
  priority: GrievancePriority;
  assignee: string;
  assigneeContact?: string;
  assigneeDesignation?: string;
  // Status & Metadata
  status: GrievanceStatus;
  submittedByVolunteer: {
    name: string;
    phone: string;
    constituency?: string;
  };
  submittedDate: string;
  timestamp: string; // ISO date string
  slaHoursRemaining?: number;
  notes: string[];
  // Backwards compatibility legacy fields
  wardNumber?: string;
  boothNumber?: string;
  urgency?: string;
  receivedVia?: string;
  assignedOfficer?: string;
}

export interface GrievanceContact {
  id: string;
  department: string;
  category: string;
  village: string;
  mandal: string;
  assembly: string;
  pocName: string;
  designation: string;
  phone: string;
  email: string;
}

export interface DesignatedVolunteer {
  id: string;
  name: string;
  mobile: string;
  constituency: string;
  mandal: string;
  active: boolean;
}

// Volunteer Module Types
export interface VolunteerSquad {
  id: string;
  name: string;
  leaderName: string;
  wardZone: string;
  activeMembersCount: number;
  targetVoterHouseholds: number;
  reachedHouseholds: number;
  dailyWhatsAppShares: number;
  amplificationEfficiency: number; // %
  status: "Operational" | "High Surge" | "Standby";
}

export interface VolunteerTask {
  id: string;
  title: string;
  type: "WhatsApp Dispatch" | "Door-to-Door Canvassing" | "Rally Mobilization" | "Misinformation Fact-Check";
  assignedSquad: string;
  deadline: string;
  targetCount: number;
  completedCount: number;
  priority: "High" | "Medium" | "Urgent";
}

// Website Landing Page Generator Types
export type WebsiteTheme = "regal_navy" | "civic_emerald" | "amber_sunset" | "modern_monochrome";

export interface CampaignLandingConfig {
  candidateName: string;
  tagline: string;
  subheadline: string;
  constituency: string;
  partyName: string;
  heroImageUrl: string;
  theme: WebsiteTheme;
  showManifesto: boolean;
  showTimeline: boolean;
  showVideoGallery: boolean;
  showVolunteerIntake: boolean;
  showGrievanceForm: boolean;
  showDonationBanner: boolean;
  manifestoPillars: { title: string; desc: string; icon: string }[];
  upcomingEvents: { date: string; title: string; location: string }[];
  contactEmail: string;
  socialLinks: { platform: string; url: string }[];
}

// ----------------- RBAC & FIELD OPERATIONS TYPES -----------------

export type IssueCategory =
  | "Road"
  | "Water Supply"
  | "Electricity"
  | "Welfare"
  | "Revenue"
  | "Healthcare"
  | "Sanitation"
  | "Drainage"
  | "Education"
  | "Civic Issue"
  | "Other";

export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type IssueStatus =
  | "NEW"
  | "ACKNOWLEDGED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "RESOLVED"
  | "COMPLETED"
  | "REJECTED"
  | "OVERDUE";

export type IssueType = "COMPLAINT" | "REQUIREMENT" | "CIVIC_ISSUE";

export interface MandalInfo {
  id: string;
  stateId: string;
  assemblyConstituencyId: string;
  name: string;
  code: string;
  totalVillages: number;
  totalVoters?: number;
  isActive?: boolean;
}

export interface VillageInfo {
  id: string;
  mandalId: string;
  assemblyConstituencyId: string;
  stateId: string;
  name: string;
  code: string;
  totalVoters?: number;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  isActive?: boolean;
}

export interface WorkUpdateRecord {
  id: string;
  issueId: string;
  volunteerId: string;
  volunteerName: string;
  previousStatus: string;
  newStatus: IssueStatus | string;
  updateDate: string;
  remarks: string;
  attachments: string[];
  proofLocation?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  createdAt: string;
}

export interface FieldIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory | string;
  department?: string;
  priority: IssuePriority | string;
  status: IssueStatus | string;
  issueType: IssueType | string;
  stateId: string;
  districtId?: string;
  parliamentConstituencyId?: string;
  assemblyConstituencyId: string;
  assemblyConstituencyName?: string;
  mandalId: string;
  mandalName: string;
  villageId: string;
  villageName: string;
  placeName?: string;
  reportedBy: string;
  reporterType?: "CITIZEN" | "CADRE" | "LEADER" | string;
  reporterDesignation?: string;
  reporterPhone?: string;
  aadharNumber?: string;
  schemeSubDetail?: string;
  citizenGender?: "Male" | "Female" | "Other" | string;
  citizenAge?: number;
  reportedDate: string;
  dueDate?: string;
  assignedDepartment?: string;
  assignedOfficialName?: string;
  assignedOfficialPhone?: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  assignedVolunteerPhone?: string;
  directorId?: string;
  directorName?: string;
  initialRemarks?: string;
  attachments: string[];
  isImmutable?: boolean;
  lastStatusUpdateAt?: string;
  lastStatusRemarks?: string;
  lastStatusProof?: string;
  completedDate?: string;
  completedByPerson?: string;
  completedDepartment?: string;
  updatedDate?: string;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "NEW_COMPLAINT"
  | "WORK_ASSIGNED"
  | "WORK_COMPLETED"
  | "WORK_OVERDUE"
  | "PROOF_UPLOADED"
  | "INACTIVITY_WARNING";

export interface FieldNotification {
  id: string;
  recipientUserId: string;
  recipientRole: PrimaryRole | string;
  type: NotificationType | string;
  title: string;
  message: string;
  issueId?: string;
  workId?: string;
  volunteerId?: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  isRead: boolean;
  createdAt: string;
}

export interface GeographicDrilldownNode {
  mandalId: string;
  mandalName: string;
  code: string;
  totalVillages: number;
  totalVoters: number;
  issueSummary: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  villages: {
    villageId: string;
    villageName: string;
    code: string;
    totalVoters: number;
    volunteer?: {
      id: string;
      name: string;
      phone?: string;
      avatar?: string;
    };
    issueSummary: {
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
      overdue: number;
    };
    issues: FieldIssue[];
  }[];
}

export interface NotificationAuditRecord {
  id: string;
  issueId: string;
  leaderId?: string;
  leaderName: string;
  organizationId?: string;
  departmentId?: string;
  departmentName: string;
  officerName: string;
  officerDesignation?: string;
  officerPhone: string;
  channel: "WHATSAPP" | "SMS" | "EMAIL" | string;
  templateName: string;
  providerMessageId?: string;
  status: "DELIVERED" | "SENT" | "FAILED" | string;
  sentAt: string;
  errorCode?: string;
  errorMessage?: string;
  messageContent: string;
}

