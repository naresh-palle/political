import {
  StateInfo,
  ParliamentInfo,
  AssemblyInfo,
  AuditReport,
  Candidate,
  PlatformAudienceDetail,
  IssueItem,
  DataConfidenceRecord,
  UserProfile,
  GrievanceItem,
  VolunteerSquad,
  VolunteerTask,
  CampaignLandingConfig
} from "../types";
import {
  calculateVoterCoverage,
  calculateDigitalCoverage,
  calculateReachGap,
  calculateScorecard,
  generateSmartRecommendations,
  rankCandidates
} from "../calculations";

export const USER_PROFILES: UserProfile[] = [
  {
    id: "user-dir",
    name: "Naresh Palle",
    email: "naresh@leaderslens.ai",
    role: "campaign_director",
    roleTitle: "Principal Campaign Director",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    assignedConstituency: "Kadapa AC (AC-132)",
    clearanceLevel: "Level 1 (Full Access)",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true
    }
  },
  {
    id: "user-cand",
    name: "Hon. Candidate Executive",
    email: "mla.candidate@constituency.in",
    role: "candidate_executive",
    roleTitle: "Nominated Candidate / Client",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    assignedConstituency: "Kadapa AC",
    clearanceLevel: "Executive Briefing Only",
    permissions: {
      canExportReports: true,
      canEditStrategy: false,
      canManageVolunteers: false,
      canResolveGrievances: false,
      canPublishLandingPage: false,
      canViewConfidentialMetrics: true
    }
  },
  {
    id: "user-field",
    name: "Venkatesh Rao",
    email: "venkat.field@leaderslens.ai",
    role: "field_strategist",
    roleTitle: "Senior Field Strategist",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    assignedConstituency: "Kadapa & Kamalapuram",
    clearanceLevel: "Level 2 (Operations)",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: false,
      canViewConfidentialMetrics: true
    }
  },
  {
    id: "user-media",
    name: "Ananya Sharma",
    email: "ananya.media@leaderslens.ai",
    role: "media_analyst",
    roleTitle: "Digital Media & NLP Analyst",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    assignedConstituency: "Statewide Digital Command",
    clearanceLevel: "Level 2 (Operations)",
    permissions: {
      canExportReports: true,
      canEditStrategy: false,
      canManageVolunteers: false,
      canResolveGrievances: false,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true
    }
  },
  {
    id: "user-vol",
    name: "Ramesh Babu",
    email: "ramesh.kadapa@volunteers.in",
    role: "volunteer_lead",
    roleTitle: "Constituency Volunteer Lead",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    assignedConstituency: "Kadapa AC (Wards 1-28)",
    clearanceLevel: "Level 3 (Field Only)",
    permissions: {
      canExportReports: false,
      canEditStrategy: false,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: false,
      canViewConfidentialMetrics: false
    }
  }
];

export const MOCK_STATES: StateInfo[] = [
  { id: "AP", name: "Andhra Pradesh", code: "AP" },
  { id: "TS", name: "Telangana", code: "TS" },
  { id: "KA", name: "Karnataka", code: "KA" },
  { id: "TN", name: "Tamil Nadu", code: "TN" }
];

export const MOCK_PARLIAMENTS: ParliamentInfo[] = [
  { id: "KDP-PC", stateId: "AP", name: "Kadapa", code: "PC-21" },
  { id: "TPT-PC", stateId: "AP", name: "Tirupati", code: "PC-23" },
  { id: "RJP-PC", stateId: "AP", name: "Rajampet", code: "PC-22" },
  { id: "GNT-PC", stateId: "AP", name: "Guntur", code: "PC-13" },
  { id: "VSKP-PC", stateId: "AP", name: "Visakhapatnam", code: "PC-04" }
];

export const MOCK_ASSEMBLIES: AssemblyInfo[] = [
  {
    id: "KDP-AC",
    parliamentId: "KDP-PC",
    stateId: "AP",
    name: "Kadapa",
    code: "AC-132",
    totalVoters: 285000,
    candidateCount: 4,
    estimatedDigitalAudience: 502000
  },
  {
    id: "KML-AC",
    parliamentId: "KDP-PC",
    stateId: "AP",
    name: "Kamalapuram",
    code: "AC-133",
    totalVoters: 215000,
    candidateCount: 4,
    estimatedDigitalAudience: 380000
  },
  {
    id: "PRD-AC",
    parliamentId: "KDP-PC",
    stateId: "AP",
    name: "Proddatur",
    code: "AC-134",
    totalVoters: 245000,
    candidateCount: 5,
    estimatedDigitalAudience: 420000
  },
  {
    id: "JMM-AC",
    parliamentId: "KDP-PC",
    stateId: "AP",
    name: "Jammalamadugu",
    code: "AC-135",
    totalVoters: 230000,
    candidateCount: 4,
    estimatedDigitalAudience: 390000
  },
  {
    id: "PLV-AC",
    parliamentId: "KDP-PC",
    stateId: "AP",
    name: "Pulivendula",
    code: "AC-136",
    totalVoters: 225000,
    candidateCount: 3,
    estimatedDigitalAudience: 410000
  }
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: "cand-client",
    name: "Candidate A",
    party: "Party A (Ruling Coalition)",
    partyAbbr: "Party A",
    partyColor: "#0F766E",
    isClient: true,
    role: "Incumbent MLA Candidate",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    socialStrengthScore: 72,
    rank: 1,
    combinedFollowing: 125000,
    verifiedPlatformsCount: 4,
    totalPlatformsCount: 4,
    postingFrequencyMonthly: 138,
    avgEngagementRate: 4.1,
    estimatedReach: 98000,
    issueCoverageScore: 84,
    socials: [
      {
        platform: "facebook",
        handle: "candidate.a.official",
        url: "https://facebook.com",
        verified: true,
        audience: 52000,
        engagementRate: 4.8,
        activityLevel: "High",
        monthlyPosts: 42,
        estimatedReach: 45000,
        lastActive: "Today, 14:30"
      },
      {
        platform: "instagram",
        handle: "@candidate_a_kadapa",
        url: "https://instagram.com",
        verified: true,
        audience: 31000,
        engagementRate: 6.2,
        activityLevel: "High",
        monthlyPosts: 58,
        estimatedReach: 38000,
        lastActive: "Today, 11:15"
      },
      {
        platform: "youtube",
        handle: "CandidateAOfficial",
        url: "https://youtube.com",
        verified: true,
        audience: 44000,
        engagementRate: 3.1,
        activityLevel: "Medium",
        monthlyPosts: 16,
        estimatedReach: 32000,
        lastActive: "Yesterday"
      },
      {
        platform: "x",
        handle: "@CandidateA_AP",
        url: "https://x.com",
        verified: true,
        audience: 8000,
        engagementRate: 2.4,
        activityLevel: "Low",
        monthlyPosts: 22,
        estimatedReach: 6000,
        lastActive: "3 days ago"
      }
    ]
  },
  {
    id: "cand-opp-1",
    name: "Candidate B",
    party: "Party B (Principal Opposition)",
    partyAbbr: "Party B",
    partyColor: "#B45309",
    isClient: false,
    role: "Challenger Nominee",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    socialStrengthScore: 61,
    rank: 2,
    combinedFollowing: 88000,
    verifiedPlatformsCount: 3,
    totalPlatformsCount: 4,
    postingFrequencyMonthly: 94,
    avgEngagementRate: 3.2,
    estimatedReach: 64000,
    issueCoverageScore: 71,
    socials: [
      {
        platform: "facebook",
        handle: "candidate.b.kdp",
        url: "https://facebook.com",
        verified: true,
        audience: 41000,
        engagementRate: 3.5,
        activityLevel: "High",
        monthlyPosts: 38,
        estimatedReach: 34000,
        lastActive: "Yesterday"
      },
      {
        platform: "instagram",
        handle: "@cand_b_official",
        url: "https://instagram.com",
        verified: true,
        audience: 24000,
        engagementRate: 4.1,
        activityLevel: "Medium",
        monthlyPosts: 32,
        estimatedReach: 20000,
        lastActive: "2 days ago"
      },
      {
        platform: "youtube",
        handle: "CandidateBNews",
        url: "https://youtube.com",
        verified: false,
        audience: 18000,
        engagementRate: 2.2,
        activityLevel: "Low",
        monthlyPosts: 8,
        estimatedReach: 12000,
        lastActive: "4 days ago"
      },
      {
        platform: "x",
        handle: "@CandidateB_KDP",
        url: "https://x.com",
        verified: true,
        audience: 5000,
        engagementRate: 1.8,
        activityLevel: "Low",
        monthlyPosts: 16,
        estimatedReach: 38000,
        lastActive: "5 days ago"
      }
    ]
  },
  {
    id: "cand-opp-2",
    name: "Candidate C",
    party: "Party C (National Alliance)",
    partyAbbr: "Party C",
    partyColor: "#1D4ED8",
    isClient: false,
    role: "Alliance Candidate",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    socialStrengthScore: 48,
    rank: 3,
    combinedFollowing: 42000,
    verifiedPlatformsCount: 2,
    totalPlatformsCount: 4,
    postingFrequencyMonthly: 46,
    avgEngagementRate: 2.1,
    estimatedReach: 31000,
    issueCoverageScore: 56,
    socials: [
      {
        platform: "facebook",
        handle: "candidate.c.party",
        url: "https://facebook.com",
        verified: true,
        audience: 22000,
        engagementRate: 2.4,
        activityLevel: "Medium",
        monthlyPosts: 20,
        estimatedReach: 16000,
        lastActive: "3 days ago"
      },
      {
        platform: "instagram",
        handle: "@candidate_c",
        url: "https://instagram.com",
        verified: true,
        audience: 12000,
        engagementRate: 2.8,
        activityLevel: "Low",
        monthlyPosts: 14,
        estimatedReach: 9000,
        lastActive: "5 days ago"
      },
      {
        platform: "youtube",
        handle: "CandidateCSpeaks",
        url: "https://youtube.com",
        verified: false,
        audience: 6000,
        engagementRate: 1.6,
        activityLevel: "Inactive",
        monthlyPosts: 2,
        estimatedReach: 4000,
        lastActive: "2 weeks ago"
      },
      {
        platform: "x",
        handle: "@CandC_Official",
        url: "https://x.com",
        verified: false,
        audience: 2000,
        engagementRate: 1.1,
        activityLevel: "Low",
        monthlyPosts: 10,
        estimatedReach: 1500,
        lastActive: "1 week ago"
      }
    ]
  },
  {
    id: "cand-opp-3",
    name: "Candidate D",
    party: "Party D (Independent / Regional)",
    partyAbbr: "Party D",
    partyColor: "#6B7280",
    isClient: false,
    role: "Independent Candidate",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
    socialStrengthScore: 35,
    rank: 4,
    combinedFollowing: 18000,
    verifiedPlatformsCount: 0,
    totalPlatformsCount: 3,
    postingFrequencyMonthly: 22,
    avgEngagementRate: 1.5,
    estimatedReach: 12000,
    issueCoverageScore: 38,
    socials: [
      {
        platform: "facebook",
        handle: "candidate.d.social",
        url: "https://facebook.com",
        verified: false,
        audience: 10000,
        engagementRate: 1.6,
        activityLevel: "Low",
        monthlyPosts: 12,
        estimatedReach: 7000,
        lastActive: "4 days ago"
      },
      {
        platform: "instagram",
        handle: "@candidate_d_kdp",
        url: "https://instagram.com",
        verified: false,
        audience: 6000,
        engagementRate: 1.8,
        activityLevel: "Low",
        monthlyPosts: 8,
        estimatedReach: 4000,
        lastActive: "6 days ago"
      },
      {
        platform: "youtube",
        handle: "CandidateDDirect",
        url: "https://youtube.com",
        verified: false,
        audience: 2000,
        engagementRate: 1.2,
        activityLevel: "Inactive",
        monthlyPosts: 2,
        estimatedReach: 1000,
        lastActive: "3 weeks ago"
      }
    ]
  }
];

export const MOCK_PLATFORM_AUDIENCES: PlatformAudienceDetail[] = [
  {
    platform: "youtube",
    displayName: "YouTube",
    estimatedAudience: 150000,
    clientReach: 44000,
    coveragePercentage: 29.3,
    reachGap: 106000,
    overlapFactor: 0.65,
    confidence: "Estimated",
    methodologyNotes: "Geo-fenced device IP activity and monthly active video streaming metrics."
  },
  {
    platform: "facebook",
    displayName: "Facebook",
    estimatedAudience: 120000,
    clientReach: 52000,
    coveragePercentage: 43.3,
    reachGap: 68000,
    overlapFactor: 0.72,
    confidence: "Estimated",
    methodologyNotes: "Meta Ads Manager geo-targeted monthly active user distribution (18+)."
  },
  {
    platform: "instagram",
    displayName: "Instagram",
    estimatedAudience: 90000,
    clientReach: 31000,
    coveragePercentage: 34.4,
    reachGap: 59000,
    overlapFactor: 0.81,
    confidence: "Estimated",
    methodologyNotes: "Meta Ads Manager active youth & urban demographic index."
  },
  {
    platform: "x",
    displayName: "X (Twitter)",
    estimatedAudience: 25000,
    clientReach: 8000,
    coveragePercentage: 32.0,
    reachGap: 17000,
    overlapFactor: 0.54,
    confidence: "Estimated",
    methodologyNotes: "X Ads targeting estimate for location tag and regional language handle graph."
  }
];

export const MOCK_ISSUES: IssueItem[] = [
  {
    id: "issue-1",
    rank: 1,
    name: "Water Supply & Irrigation",
    category: "Infrastructure",
    mentionsCount: 9420,
    engagementScore: 84,
    contentActivity: "High",
    relativeStrength: 88,
    clientLead: true,
    sentimentScore: 0.42,
    topHashtags: ["#KadapaWaterProject", "#PennaRiverCanal", "#FarmerSupport"]
  },
  {
    id: "issue-2",
    rank: 2,
    name: "Roads & Urban Infrastructure",
    category: "Urban Development",
    mentionsCount: 7850,
    engagementScore: 72,
    contentActivity: "High",
    relativeStrength: 79,
    clientLead: true,
    sentimentScore: 0.18,
    topHashtags: ["#KadapaRoads", "#RingRoadExpansion", "#SmartStreetLights"]
  },
  {
    id: "issue-3",
    rank: 3,
    name: "Education & Skill Centers",
    category: "Social Welfare",
    mentionsCount: 5210,
    engagementScore: 66,
    contentActivity: "Medium",
    relativeStrength: 71,
    clientLead: true,
    sentimentScore: 0.65,
    topHashtags: ["#YouthSkillHub", "#KadapaGovtColleges", "#DigitalClassrooms"]
  },
  {
    id: "issue-4",
    rank: 4,
    name: "Industrial Employment & SEZ",
    category: "Economy",
    mentionsCount: 4890,
    engagementScore: 61,
    contentActivity: "Moderate",
    relativeStrength: 64,
    clientLead: false,
    sentimentScore: -0.12,
    topHashtags: ["#KadapaSteelPlant", "#JobsForYouth", "#KopparthyMegaHub"]
  },
  {
    id: "issue-5",
    rank: 5,
    name: "Healthcare & Primary Clinics",
    category: "Health",
    mentionsCount: 3940,
    engagementScore: 58,
    contentActivity: "Low",
    relativeStrength: 59,
    clientLead: true,
    sentimentScore: 0.38,
    topHashtags: ["#RIMSUpdate", "#VillageHealthClinics", "#FreeHealthCamps"]
  }
];

export const MOCK_DATA_CONFIDENCE: DataConfidenceRecord[] = [
  {
    metric: "Voter Population (2.85L)",
    source: "Election Commission of India (ECI) Final Electoral Rolls",
    date: "January 2026",
    confidence: "Verified",
    notes: "Official published electoral statistics per polling station boundary map."
  },
  {
    metric: "Candidate Details & Affidavits",
    source: "ECI Candidate Declarations & Statutory Filings",
    date: "Updated February 2026",
    confidence: "Verified",
    notes: "Verified against officially filed nominations."
  },
  {
    metric: "Candidate Social Handles & Audience",
    source: "Direct Meta Graph API, Google Data API & X Dev Platform",
    date: "Live (28 Aug 2026)",
    confidence: "Verified",
    notes: "Real-time verified handle discovery and engagement rate sampling."
  },
  {
    metric: "Platform Audience Estimates (2.10L)",
    source: "Meta Ads & Google Campaign Manager Geo-Targeting Index",
    date: "August 2026",
    confidence: "Estimated",
    notes: "Audience models geo-fenced to Kadapa AC postal codes. Non-unique across platforms."
  },
  {
    metric: "Client Estimated Reach (0.98L)",
    source: "Bayesian Overlap Model & Follower Cluster Deduplication",
    date: "August 2026",
    confidence: "Derived",
    notes: "Estimated deduplicated unique citizen reach after factoring platform cross-follow overlap."
  },
  {
    metric: "Issue Intelligence & Narrative Ranks",
    source: "NLP Constituency Linguistic Model & Social Listening Pipeline",
    date: "Last 30 Days",
    confidence: "Derived",
    notes: "Derived from 31,310 localized social posts, comments, and local news citations."
  }
];

// Mock Grievances List for Grievance Management CRM
export const MOCK_GRIEVANCES: GrievanceItem[] = [
  {
    id: "grv-101",
    ticketNumber: "KDP-GRV-2026-891",
    citizenName: "K. Sudhakar Reddy",
    citizenPhone: "+91 98480 *****",
    wardNumber: "Ward 14 (Old City)",
    boothNumber: "Booth 112",
    category: "Water Supply",
    urgency: "Emergency",
    status: "In_Progress",
    receivedVia: "WhatsApp",
    submittedDate: "28 Aug, 09:15 AM",
    slaHoursRemaining: 4,
    assignedOfficer: "M. Ramesh (Irrigation Liaison)",
    subject: "Broken pipeline near Ambedkar Circle causing drinking water contamination",
    description: "Main municipal pipeline burst since yesterday evening. Contaminated muddy water entering households in Street 4.",
    notes: ["Team dispatched with replacement seal pipe.", "Water tanker sent as interim relief at 11:30 AM."]
  },
  {
    id: "grv-102",
    ticketNumber: "KDP-GRV-2026-892",
    citizenName: "S. Fatima Begum",
    citizenPhone: "+91 94401 *****",
    wardNumber: "Ward 07 (Gandhi Nagar)",
    boothNumber: "Booth 058",
    category: "Welfare Pension",
    urgency: "High",
    status: "Open",
    receivedVia: "Janata Darbar",
    submittedDate: "28 Aug, 10:45 AM",
    slaHoursRemaining: 18,
    assignedOfficer: "P. Vani (Social Welfare Desk)",
    subject: "Widow pension DBT disbursement delayed for 2 consecutive months",
    description: "Aadhaar e-KYC mismatch showing at local secretariat center preventing monthly disbursement.",
    notes: ["Biometric re-verification scheduled with field volunteer."]
  },
  {
    id: "grv-103",
    ticketNumber: "KDP-GRV-2026-893",
    citizenName: "T. Narayana Murthy",
    citizenPhone: "+91 99890 *****",
    wardNumber: "Ward 22 (Industrial Bypass)",
    boothNumber: "Booth 184",
    category: "Roads & Transit",
    urgency: "Normal",
    status: "Assigned",
    receivedVia: "Field Worker App",
    submittedDate: "27 Aug, 04:20 PM",
    slaHoursRemaining: 32,
    assignedOfficer: "K. Suresh (R&B Division)",
    subject: "Pothole clusters causing bike accidents near Kopparthy junction",
    description: "Monsoon runoff eroded asphalt over 200m stretch. Needs cold patch asphalt repair before market day.",
    notes: ["Inspection logged. Work order submitted to municipal engineer."]
  },
  {
    id: "grv-104",
    ticketNumber: "KDP-GRV-2026-894",
    citizenName: "G. Venkateswarlu",
    citizenPhone: "+91 97000 *****",
    wardNumber: "Ward 03 (Railway Colony)",
    boothNumber: "Booth 024",
    category: "Electricity",
    urgency: "High",
    status: "Resolved",
    receivedVia: "TollFree",
    submittedDate: "27 Aug, 11:10 AM",
    slaHoursRemaining: 0,
    assignedOfficer: "APCPDCL Quick Response",
    subject: "Low voltage and frequent transformer trips in evening peak hours",
    description: "Transformer overload due to new apartment connections causing pump failures.",
    notes: ["New 100kVA transformer installed and load balanced on 28 Aug 08:00 AM. Ticket resolved."]
  }
];

// Mock Volunteer Squads for Volunteer Monitoring
export const MOCK_VOLUNTEER_SQUADS: VolunteerSquad[] = [
  {
    id: "sq-1",
    name: "Kadapa North Digital Command",
    leaderName: "Ramesh Babu",
    wardZone: "Wards 01 to 08",
    activeMembersCount: 142,
    targetVoterHouseholds: 18500,
    reachedHouseholds: 14200,
    dailyWhatsAppShares: 3420,
    amplificationEfficiency: 88,
    status: "Operational"
  },
  {
    id: "sq-2",
    name: "Central Bazaar Grassroots Unit",
    leaderName: "K. Madhavi",
    wardZone: "Wards 09 to 18",
    activeMembersCount: 215,
    targetVoterHouseholds: 24000,
    reachedHouseholds: 20100,
    dailyWhatsAppShares: 5120,
    amplificationEfficiency: 92,
    status: "High Surge"
  },
  {
    id: "sq-3",
    name: "South Industrial & Kopparthy Wing",
    leaderName: "B. Chennaiah",
    wardZone: "Wards 19 to 28",
    activeMembersCount: 98,
    targetVoterHouseholds: 16000,
    reachedHouseholds: 9800,
    dailyWhatsAppShares: 2100,
    amplificationEfficiency: 74,
    status: "Standby"
  }
];

export const MOCK_VOLUNTEER_TASKS: VolunteerTask[] = [
  {
    id: "tsk-1",
    title: "Broadcast 'Penna River Project Milestone' 90-sec video to all ward resident groups",
    type: "WhatsApp Dispatch",
    assignedSquad: "Central Bazaar Grassroots Unit",
    deadline: "Today, 06:00 PM",
    targetCount: 500,
    completedCount: 420,
    priority: "Urgent"
  },
  {
    id: "tsk-2",
    title: "Door-to-door welfare beneficiary verification in Ward 14 & 15",
    type: "Door-to-Door Canvassing",
    assignedSquad: "Kadapa North Digital Command",
    deadline: "Tomorrow, 01:00 PM",
    targetCount: 1200,
    completedCount: 850,
    priority: "High"
  },
  {
    id: "tsk-3",
    title: "Distribute youth sports tournament registration flyers & portal QR codes",
    type: "Rally Mobilization",
    assignedSquad: "South Industrial & Kopparthy Wing",
    deadline: "30 Aug, 05:00 PM",
    targetCount: 800,
    completedCount: 310,
    priority: "Medium"
  }
];

// Default Campaign Landing Page Configuration
export const DEFAULT_CAMPAIGN_CONFIG: CampaignLandingConfig = {
  candidateName: "Candidate A",
  tagline: "Dedicated to Kadapa's Progress & People",
  subheadline: "Empowering every household with world-class water infrastructure, industrial employment, and transparent public welfare.",
  constituency: "Kadapa Assembly Constituency",
  partyName: "Party A (People's Coalition)",
  heroImageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
  theme: "civic_emerald",
  showManifesto: true,
  showTimeline: true,
  showVideoGallery: true,
  showVolunteerIntake: true,
  showGrievanceForm: true,
  showDonationBanner: true,
  manifestoPillars: [
    {
      title: "100% Piped Clean Water & Penna Irrigation",
      desc: "Completion of Penna Canal modern pipelines ensuring 24/7 drinking water supply to all 28 municipal wards.",
      icon: "Droplets"
    },
    {
      title: "10,000 Industrial Jobs at Kopparthy Hub",
      desc: "Fast-tracking electronic manufacturing clusters and textiles park with guaranteed local youth employment quota.",
      icon: "Briefcase"
    },
    {
      title: "Super-Specialty Healthcare for Every Village",
      desc: "Upgraded RIMS facility with free specialty clinics and direct citizen ambulance rapid response network.",
      icon: "HeartPulse"
    }
  ],
  upcomingEvents: [
    {
      date: "02 Sep 2026, 05:00 PM",
      title: "Mega Youth Townhall & Skill Certification Dispatch",
      location: "Municipal Grounds, Kadapa"
    },
    {
      date: "06 Sep 2026, 10:00 AM",
      title: "Women Entrepreneurs & Self-Help Group Conference",
      location: "RIMS Auditorium, Kadapa"
    }
  ],
  contactEmail: "office@candidatea.in",
  socialLinks: [
    { platform: "Facebook", url: "https://facebook.com/candidate.a.official" },
    { platform: "Instagram", url: "https://instagram.com/candidate_a_kadapa" },
    { platform: "YouTube", url: "https://youtube.com/CandidateAOfficial" },
    { platform: "X", url: "https://x.com/CandidateA_AP" }
  ]
};

export function buildCompleteAudit(
  stateId = "AP",
  parliamentId = "KDP-PC",
  assemblyId = "KDP-AC"
): AuditReport {
  const state = MOCK_STATES.find((s) => s.id === stateId) || MOCK_STATES[0];
  const parliament =
    MOCK_PARLIAMENTS.find((p) => p.id === parliamentId) || MOCK_PARLIAMENTS[0];
  const assembly =
    MOCK_ASSEMBLIES.find((a) => a.id === assemblyId) || MOCK_ASSEMBLIES[0];

  const rankedCandList = rankCandidates(MOCK_CANDIDATES);
  const client = rankedCandList.find((c) => c.isClient) || rankedCandList[0];

  const totalVoters = assembly.totalVoters;
  const estimatedUniqueClientReach = client.estimatedReach;
  const voterCoverage = calculateVoterCoverage(estimatedUniqueClientReach, totalVoters);
  const voterReachGap = calculateReachGap(totalVoters, estimatedUniqueClientReach);

  const deduplicatedDigitalAudience = 210000;
  const digitalCoverage = calculateDigitalCoverage(
    estimatedUniqueClientReach,
    deduplicatedDigitalAudience
  );

  const scorecard = calculateScorecard(
    client,
    rankedCandList,
    voterCoverage,
    digitalCoverage
  );
  const recommendations = generateSmartRecommendations(
    MOCK_PLATFORM_AUDIENCES,
    voterCoverage,
    digitalCoverage,
    MOCK_ISSUES
  );

  return {
    id: `audit-${assembly.code.toLowerCase()}-20260828`,
    generatedAt: "28 Aug 2026",
    freshness: "Mixed",
    state,
    parliament,
    assembly,
    client,
    candidates: rankedCandList,
    voterStats: {
      totalVoters,
      estimatedUniqueClientReach,
      voterCoveragePercentage: voterCoverage,
      voterReachGap
    },
    digitalStats: {
      totalDigitalAudience: deduplicatedDigitalAudience,
      clientDigitalCoveragePercentage: 19.5,
      combinedFollowing: client.combinedFollowing
    },
    platformBreakdown: MOCK_PLATFORM_AUDIENCES,
    issues: MOCK_ISSUES,
    recommendations,
    scorecard,
    overallStrengthScore: client.socialStrengthScore,
    dataConfidence: MOCK_DATA_CONFIDENCE,
    headline:
      "Client currently leads the competitive social landscape, but significant voter reach remains untapped.",
    keyObservations: [
      "Client holds #1 rank in overall Social Strength (72/100), leading nearest opposition candidate by +11 points.",
      "Verified digital presence across 4 major platforms achieves 34.4% estimated coverage of the total electorate.",
      "A significant untapped opportunity of 1.06L potential audience exists on YouTube, representing the largest single platform deficit."
    ]
  };
}
