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

export interface UserProfile {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
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
  stateId?: string | null;
  stateName?: string;
  parliamentConstituencyId?: string | null;
  parliamentConstituencyName?: string;
  assemblyConstituencyId?: string | null;
  assemblyConstituencyName?: string;
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
