export type ConfidenceLevel = "Verified" | "Estimated" | "Manual" | "Derived" | "Live" | "Mixed";

export type PlatformType = "facebook" | "instagram" | "youtube" | "x";

export type UserRole = 
  | "super_admin"
  | "campaign_director" 
  | "field_strategist" 
  | "media_analyst" 
  | "candidate_executive" 
  | "volunteer_lead"
  | "booth_coordinator";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department?: string;
  demoPassword?: string;
  avatar: string;
  assignedConstituency: string;
  clearanceLevel: "Tier 0 (Master Admin Clearance)" | "Level 1 (Full Access)" | "Level 2 (Operations)" | "Level 3 (Field Only)" | "Executive Briefing Only";
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

export interface StateInfo {
  id: string;
  name: string;
  code: string;
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

export interface Candidate {
  id: string;
  name: string;
  party: string;
  partyAbbr: string;
  partyColor: string;
  isClient: boolean;
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
export type GrievanceUrgency = "Emergency" | "High" | "Normal" | "Low";
export type GrievanceStatus = "Open" | "Assigned" | "In_Progress" | "Resolved" | "Escalated";

export interface GrievanceItem {
  id: string;
  ticketNumber: string;
  citizenName: string;
  citizenPhone: string;
  wardNumber: string;
  boothNumber: string;
  category: "Water Supply" | "Roads & Transit" | "Electricity" | "Healthcare" | "Welfare Pension" | "Sanitation";
  subject: string;
  description: string;
  urgency: GrievanceUrgency;
  status: GrievanceStatus;
  receivedVia: "WhatsApp" | "TollFree" | "Field Worker App" | "Web Portal" | "Janata Darbar";
  submittedDate: string;
  slaHoursRemaining: number;
  assignedOfficer: string;
  notes: string[];
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
