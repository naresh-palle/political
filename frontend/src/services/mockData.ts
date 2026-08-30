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
  GrievanceContact,
  DesignatedVolunteer,
  VolunteerSquad,
  VolunteerTask,
  CampaignLandingConfig,
  PoliticalParty,
  ElectedRepresentative,
  CandidateType
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
    id: "usr-superadmin",
    name: "Srikar Varma",
    email: "admin@leaderslens.ai",
    phone: "+91 98850 12340",
    demoPassword: "SuperAdmin@2026",
    primaryRole: "SUPER_ADMIN",
    isPlatformAdmin: true,
    isPoliticalAdmin: false,
    roleId: "SUPER_ADMIN",
    role: "super_admin",
    roleTitle: "LeaderLens Platform Owner & Super Admin",
    designation: "Chief System Administrator",
    department: "LeaderLens Platform Governance & Core Security",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80",
    assignedConstituency: "LeaderLens National Command Center",
    clearanceLevel: "LEVEL 5 — FULL PLATFORM OWNER",
    status: "ACTIVE",
    partyId: null,
    partyColor: "#D4A24C",
    partyEmoji: "🏛️",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: true
    }
  },
  {
    id: "usr-admin",
    name: "Ananya Rao",
    email: "support@leaderslens.ai",
    phone: "+91 98850 12341",
    demoPassword: "Admin@2026",
    primaryRole: "SUPER_ADMIN",
    isPlatformAdmin: true,
    isPoliticalAdmin: false,
    roleId: "SUPER_ADMIN",
    role: "super_admin",
    roleTitle: "Platform Operations Administrator",
    designation: "System Operations Lead",
    department: "Platform Operations",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80",
    assignedConstituency: "LeaderLens Operations Center",
    clearanceLevel: "LEVEL 5 — PLATFORM OPERATIONS",
    status: "ACTIVE",
    partyId: null,
    partyColor: "#D4A24C",
    partyEmoji: "🏛️",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: true
    }
  },
  {
    id: "usr-mla-kadapa",
    name: "R. Madhavi Reddy (MLA Office)",
    email: "mla.kadapa@leaderslens.ai",
    phone: "+91 98850 22331",
    demoPassword: "MlaKadapa@2026",
    primaryRole: "POLITICAL_ADMIN",
    isPlatformAdmin: false,
    isPoliticalAdmin: true,
    roleId: "ADMIN",
    role: "admin",
    roleTitle: "Kadapa Constituency Political Admin (MLA)",
    designation: "MLA / PA to MLA Political Command",
    department: "Kadapa Constituency Political Office",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80",
    partyId: "TDP",
    partyName: "Telugu Desam Party",
    partyAbbr: "TDP",
    partyColor: "#FFD200",
    partyEmoji: "🚲",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    parliamentConstituencyId: "KDP-PC",
    parliamentConstituencyName: "Kadapa PC",
    assemblyConstituencyId: "KDP-AC",
    assemblyConstituencyName: "Kadapa AC (AC-132)",
    assignedConstituency: "Kadapa AC (AC-132)",
    clearanceLevel: "LEVEL 4 — CONSTITUENCY COMMAND",
    status: "ACTIVE",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-mla-pulivendula",
    name: "Y. S. Jagan Mohan Reddy (MLA Office)",
    email: "mla.pulivendula@leaderslens.ai",
    phone: "+91 98850 22332",
    demoPassword: "MlaPulivendula@2026",
    primaryRole: "POLITICAL_ADMIN",
    isPlatformAdmin: false,
    isPoliticalAdmin: true,
    roleId: "ADMIN",
    role: "admin",
    roleTitle: "Pulivendula Constituency Political Admin (MLA)",
    designation: "MLA Political Command",
    department: "Pulivendula Constituency Political Office",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80",
    partyId: "YSRCP",
    partyName: "YSR Congress Party",
    partyAbbr: "YSRCP",
    partyColor: "#15803D",
    partyEmoji: "🚁",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    parliamentConstituencyId: "KDP-PC",
    parliamentConstituencyName: "Kadapa PC",
    assemblyConstituencyId: "PLV-AC",
    assemblyConstituencyName: "Pulivendula AC (AC-133)",
    assignedConstituency: "Pulivendula AC (AC-133)",
    clearanceLevel: "LEVEL 4 — CONSTITUENCY COMMAND",
    status: "ACTIVE",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-mla-pithapuram",
    name: "Pawan Kalyan (MLA Office)",
    email: "mla.pithapuram@leaderslens.ai",
    phone: "+91 98850 22333",
    demoPassword: "MlaPithapuram@2026",
    primaryRole: "POLITICAL_ADMIN",
    isPlatformAdmin: false,
    isPoliticalAdmin: true,
    roleId: "ADMIN",
    role: "admin",
    roleTitle: "Pithapuram Constituency Political Admin (MLA)",
    designation: "MLA Political Command",
    department: "Pithapuram Constituency Political Office",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80",
    partyId: "JSP",
    partyName: "Jana Sena Party",
    partyAbbr: "JSP",
    partyColor: "#DC2626",
    partyEmoji: "⭐",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    parliamentConstituencyId: "KKD-PC",
    parliamentConstituencyName: "Kakinada PC",
    assemblyConstituencyId: "PTH-AC",
    assemblyConstituencyName: "Pithapuram AC (AC-041)",
    assignedConstituency: "Pithapuram AC (AC-041)",
    clearanceLevel: "LEVEL 4 — CONSTITUENCY COMMAND",
    status: "ACTIVE",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-tdp-ap",
    name: "Naresh Palle",
    email: "tdp.campaign@leaderslens.ai",
    demoPassword: "Tdp@2026",
    roleId: "CAMPAIGN_MANAGER",
    role: "campaign_manager",
    roleTitle: "AP Principal Campaign Director",
    designation: "Principal Campaign Director",
    department: "Executive Strategy",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80",
    partyId: "TDP",
    partyName: "Telugu Desam Party",
    partyAbbr: "TDP",
    partyColor: "#FFD200",
    partyEmoji: "🚲",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    parliamentConstituencyId: "KDP-PC",
    parliamentConstituencyName: "Kadapa PC",
    assemblyConstituencyId: "KDP-AC",
    assemblyConstituencyName: "Kadapa AC (AC-132)",
    assignedConstituency: "Kadapa AC (AC-132)",
    clearanceLevel: "LEVEL 3 — STRATEGY",
    status: "ACTIVE",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-ysrcp-ap",
    name: "Y. S. Avinash Reddy",
    email: "ysrcp.strategist@leaderslens.ai",
    demoPassword: "Ysrcp@2026",
    roleId: "CAMPAIGN_MANAGER",
    role: "campaign_manager",
    roleTitle: "Rayalaseema Strategic Director",
    designation: "Strategic Director",
    department: "Ground Campaign",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80",
    partyId: "YSRCP",
    partyName: "YSR Congress Party",
    partyAbbr: "YSRCP",
    partyColor: "#15803D",
    partyEmoji: "🚁",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    parliamentConstituencyId: "KDP-PC",
    parliamentConstituencyName: "Kadapa PC",
    assemblyConstituencyId: "PLV-AC",
    assemblyConstituencyName: "Pulivendula AC (AC-133)",
    assignedConstituency: "Pulivendula AC (AC-133)",
    clearanceLevel: "LEVEL 3 — STRATEGY",
    status: "ACTIVE",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-jsp-ap",
    name: "Kalyan Babu",
    email: "jsp.lead@leaderslens.ai",
    demoPassword: "Jsp@2026",
    roleId: "PARTY_ADMIN",
    role: "party_admin",
    roleTitle: "AP State Cadre In-Charge",
    designation: "Cadre In-Charge",
    department: "Field Coordination",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80",
    partyId: "JSP",
    partyName: "Jana Sena Party",
    partyAbbr: "JSP",
    partyColor: "#DC2626",
    partyEmoji: "⭐",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    parliamentConstituencyId: "KKD-PC",
    parliamentConstituencyName: "Kakinada PC",
    assemblyConstituencyId: "PTH-AC",
    assemblyConstituencyName: "Pithapuram AC (AC-041)",
    assignedConstituency: "Pithapuram AC (AC-041)",
    clearanceLevel: "LEVEL 4 — OPERATIONS",
    status: "ACTIVE",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-brs-tg",
    name: "K. T. Rama Rao",
    email: "brs.director@leaderslens.ai",
    demoPassword: "Brs@2026",
    roleId: "CAMPAIGN_MANAGER",
    role: "campaign_manager",
    roleTitle: "Telangana Digital Campaign Lead",
    designation: "Campaign Lead",
    department: "Digital Outreach",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80",
    partyId: "BRS",
    partyName: "Bharat Rashtra Samithi",
    partyAbbr: "BRS",
    partyColor: "#EC4899",
    partyEmoji: "🚗",
    stateId: "TG",
    stateName: "Telangana",
    parliamentConstituencyId: "MDL-PC",
    parliamentConstituencyName: "Medak PC",
    assemblyConstituencyId: "GJW-AC",
    assemblyConstituencyName: "Gajwel AC (AC-040)",
    assignedConstituency: "Gajwel AC (AC-040)",
    clearanceLevel: "LEVEL 3 — STRATEGY",
    status: "ACTIVE",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-inc-tg",
    name: "A. Revanth Reddy",
    email: "congress.digital@leaderslens.ai",
    demoPassword: "Congress@2026",
    roleId: "CAMPAIGN_MANAGER",
    role: "campaign_manager",
    roleTitle: "PCC Strategy & Outreach Director",
    designation: "Outreach Director",
    department: "Campaign Strategy",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80",
    partyId: "INC",
    partyName: "Indian National Congress",
    partyAbbr: "INC",
    partyColor: "#0284C7",
    partyEmoji: "✋",
    stateId: "TG",
    stateName: "Telangana",
    parliamentConstituencyId: "MBN-PC",
    parliamentConstituencyName: "Mahbubnagar PC",
    assemblyConstituencyId: "KDG-AC",
    assemblyConstituencyName: "Kodangal AC (AC-072)",
    assignedConstituency: "Kodangal AC (AC-072)",
    clearanceLevel: "LEVEL 3 — STRATEGY",
    status: "ACTIVE",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-bjp-tg",
    name: "Bandi Sanjay Kumar",
    email: "bjp.coordinator@leaderslens.ai",
    demoPassword: "Bjp@2026",
    roleId: "CAMPAIGN_MANAGER",
    role: "campaign_manager",
    roleTitle: "Telangana Electoral Operations Lead",
    designation: "Operations Lead",
    department: "Ground Operations",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&auto=format&fit=crop&q=80",
    partyId: "BJP",
    partyName: "Bharatiya Janata Party",
    partyAbbr: "BJP",
    partyColor: "#FF671F",
    partyEmoji: "🪷",
    stateId: "TG",
    stateName: "Telangana",
    parliamentConstituencyId: "HYD-PC",
    parliamentConstituencyName: "Hyderabad PC",
    assemblyConstituencyId: "GSM-AC",
    assemblyConstituencyName: "Goshamahal AC (AC-065)",
    assignedConstituency: "Goshamahal AC (AC-065)",
    clearanceLevel: "LEVEL 3 — STRATEGY",
    status: "ACTIVE",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-aimim-tg",
    name: "Asaduddin Owaisi",
    email: "aimim.field@leaderslens.ai",
    demoPassword: "Aimim@2026",
    roleId: "PARTY_ADMIN",
    role: "party_admin",
    roleTitle: "Old City Electoral Command Lead",
    designation: "Electoral Command Lead",
    department: "Field Coordination",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=250&auto=format&fit=crop&q=80",
    partyId: "AIMIM",
    partyName: "All India Majlis-e-Ittehadul Muslimeen",
    partyAbbr: "AIMIM",
    partyColor: "#047857",
    partyEmoji: "🪁",
    stateId: "TG",
    stateName: "Telangana",
    parliamentConstituencyId: "HYD-PC",
    parliamentConstituencyName: "Hyderabad PC",
    assemblyConstituencyId: "CRY-AC",
    assemblyConstituencyName: "Chandrayangutta AC (AC-067)",
    assignedConstituency: "Chandrayangutta AC (AC-067)",
    clearanceLevel: "LEVEL 4 — OPERATIONS",
    status: "ACTIVE",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-dir-south",
    name: "Venkatesh Rao",
    email: "director.south@leaderslens.ai",
    demoPassword: "Director@2026",
    primaryRole: "DIRECTOR",
    roleId: "CAMPAIGN_MANAGER",
    role: "campaign_manager",
    roleTitle: "Volunteer Manager (Rural & South Mandals)",
    designation: "Volunteer Manager (Rural & South Mandals)",
    department: "Ground Operations",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80",
    partyId: "TDP",
    partyName: "Telugu Desam Party",
    partyAbbr: "TDP",
    partyColor: "#FFD200",
    partyEmoji: "🚲",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    parliamentConstituencyId: "KDP-PC",
    parliamentConstituencyName: "Kadapa PC",
    assemblyConstituencyId: "KDP-AC",
    assemblyConstituencyName: "Kadapa AC (AC-132)",
    assignedConstituency: "Kadapa Rural & Chennur",
    assignedMandalIds: ["MDL-KDP-RUR", "MDL-KDP-CNR"],
    clearanceLevel: "LEVEL 3 — STRATEGY",
    status: "ACTIVE",
    permissions: {
      canExportReports: true,
      canEditStrategy: true,
      canManageVolunteers: true,
      canResolveGrievances: true,
      canPublishLandingPage: true,
      canViewConfidentialMetrics: true,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-vol-ramesh",
    name: "Ramesh Babu",
    email: "ramesh.vol1@leaderslens.ai",
    demoPassword: "Volunteer@2026",
    primaryRole: "VOLUNTEER",
    roleId: "VOLUNTEER",
    role: "volunteer",
    roleTitle: "Booth & Village Field Volunteer",
    designation: "Booth & Village Field Volunteer",
    department: "Grassroots Field Force",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80",
    partyId: "TDP",
    partyName: "Telugu Desam Party",
    partyAbbr: "TDP",
    partyColor: "#FFD200",
    partyEmoji: "🚲",
    directorId: "usr-tdp-ap",
    directorName: "Naresh Palle",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    parliamentConstituencyId: "KDP-PC",
    parliamentConstituencyName: "Kadapa PC",
    assemblyConstituencyId: "KDP-AC",
    assemblyConstituencyName: "Kadapa AC (AC-132)",
    assignedMandalId: "MDL-KDP-URB",
    assignedMandalName: "Kadapa Urban",
    assignedVillageIds: ["VIL-CCK", "VIL-UTK"],
    assignedVillageNames: ["Chinna Chowk", "Utukur"],
    assignedConstituency: "Kadapa AC · Chinna Chowk & Utukur",
    clearanceLevel: "LEVEL 1 — FIELD ONLY",
    status: "ACTIVE",
    permissions: {
      canExportReports: false,
      canEditStrategy: false,
      canManageVolunteers: false,
      canResolveGrievances: true,
      canPublishLandingPage: false,
      canViewConfidentialMetrics: false,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-vol-srinivas",
    name: "K. Srinivas Reddy",
    email: "srinivas.vol2@leaderslens.ai",
    demoPassword: "Volunteer@2026",
    primaryRole: "VOLUNTEER",
    roleId: "VOLUNTEER",
    role: "volunteer",
    roleTitle: "Booth & Village Field Volunteer",
    designation: "Booth & Village Field Volunteer",
    department: "Grassroots Field Force",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=250&auto=format&fit=crop&q=80",
    partyId: "TDP",
    partyName: "Telugu Desam Party",
    partyAbbr: "TDP",
    partyColor: "#FFD200",
    partyEmoji: "🚲",
    directorId: "usr-tdp-ap",
    directorName: "Naresh Palle",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    parliamentConstituencyId: "KDP-PC",
    parliamentConstituencyName: "Kadapa PC",
    assemblyConstituencyId: "KDP-AC",
    assemblyConstituencyName: "Kadapa AC (AC-132)",
    assignedMandalId: "MDL-KDP-URB",
    assignedMandalName: "Kadapa Urban",
    assignedVillageIds: ["VIL-RMN", "VIL-AKP"],
    assignedVillageNames: ["Ramanjaneya Nagar", "Akkayapalli"],
    assignedConstituency: "Kadapa AC · Ramanjaneya Nagar & Akkayapalli",
    clearanceLevel: "LEVEL 1 — FIELD ONLY",
    status: "ACTIVE",
    permissions: {
      canExportReports: false,
      canEditStrategy: false,
      canManageVolunteers: false,
      canResolveGrievances: true,
      canPublishLandingPage: false,
      canViewConfidentialMetrics: false,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-vol-lakshmi",
    name: "Lakshmi Devi",
    email: "lakshmi.vol3@leaderslens.ai",
    demoPassword: "Volunteer@2026",
    primaryRole: "VOLUNTEER",
    roleId: "VOLUNTEER",
    role: "volunteer",
    roleTitle: "Village Field Coordinator",
    designation: "Village Field Coordinator",
    department: "Grassroots Field Force",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80",
    partyId: "TDP",
    partyName: "Telugu Desam Party",
    partyAbbr: "TDP",
    partyColor: "#FFD200",
    partyEmoji: "🚲",
    directorId: "usr-dir-south",
    directorName: "Venkatesh Rao",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    parliamentConstituencyId: "KDP-PC",
    parliamentConstituencyName: "Kadapa PC",
    assemblyConstituencyId: "KDP-AC",
    assemblyConstituencyName: "Kadapa AC (AC-132)",
    assignedMandalId: "MDL-KDP-CNR",
    assignedMandalName: "Chennur",
    assignedVillageIds: ["VIL-CNR", "VIL-VLR"],
    assignedVillageNames: ["Chennur Village", "Vallur Cross"],
    assignedConstituency: "Kadapa AC · Chennur & Vallur",
    clearanceLevel: "LEVEL 1 — FIELD ONLY",
    status: "ACTIVE",
    permissions: {
      canExportReports: false,
      canEditStrategy: false,
      canManageVolunteers: false,
      canResolveGrievances: true,
      canPublishLandingPage: false,
      canViewConfidentialMetrics: false,
      canManageSystemUsers: false
    }
  },
  {
    id: "usr-vol-suresh",
    name: "Suresh Kumar",
    email: "suresh.vol4@leaderslens.ai",
    demoPassword: "Volunteer@2026",
    primaryRole: "VOLUNTEER",
    roleId: "VOLUNTEER",
    role: "volunteer",
    roleTitle: "Rural Field Volunteer",
    designation: "Rural Field Volunteer",
    department: "Grassroots Field Force",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80",
    partyId: "TDP",
    partyName: "Telugu Desam Party",
    partyAbbr: "TDP",
    partyColor: "#FFD200",
    partyEmoji: "🚲",
    directorId: "usr-dir-south",
    directorName: "Venkatesh Rao",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    parliamentConstituencyId: "KDP-PC",
    parliamentConstituencyName: "Kadapa PC",
    assemblyConstituencyId: "KDP-AC",
    assemblyConstituencyName: "Kadapa AC (AC-132)",
    assignedMandalId: "MDL-KDP-RUR",
    assignedMandalName: "Kadapa Rural",
    assignedVillageIds: ["VIL-PDL", "VIL-KPN"],
    assignedVillageNames: ["Pendlimarri Road", "Kopparthi Sector"],
    assignedConstituency: "Kadapa AC · Pendlimarri & Kopparthi",
    clearanceLevel: "LEVEL 1 — FIELD ONLY",
    status: "ACTIVE",
    permissions: {
      canExportReports: false,
      canEditStrategy: false,
      canManageVolunteers: false,
      canResolveGrievances: true,
      canPublishLandingPage: false,
      canViewConfidentialMetrics: false,
      canManageSystemUsers: false
    }
  }
];

export const MOCK_POLITICAL_PARTIES: PoliticalParty[] = [
  {
    id: "TDP",
    name: "Telugu Desam Party",
    shortName: "TDP",
    abbreviation: "TDP",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Telugu_Desam_Party_flag.svg/240px-Telugu_Desam_Party_flag.svg.png",
    symbolEmoji: "🚲",
    primaryColor: "#FFD200",
    secondaryColor: "#B45309",
    accentColor: "#F59E0B",
    lightBackground: "#FEFCE8",
    darkBackground: "#18181B",
    backgroundImageUrl: "./images/party-backgrounds/tdp-bg.jpg",
    textColor: "#1E293B",
    mutedTextColor: "#71717A",
    gradientStart: "#FFD200",
    gradientEnd: "#EAB308",
    isActive: true
  },
  {
    id: "BJP",
    name: "Bharatiya Janata Party",
    shortName: "BJP",
    abbreviation: "BJP",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Bharatiya_Janata_Party_logo.svg/240px-Bharatiya_Janata_Party_logo.svg.png",
    symbolEmoji: "🪷",
    primaryColor: "#FF671F",
    secondaryColor: "#046A38",
    accentColor: "#F97316",
    lightBackground: "#FFF7ED",
    darkBackground: "#18181B",
    backgroundImageUrl: "./images/party-backgrounds/bjp-bg.jpg",
    textColor: "#1E293B",
    mutedTextColor: "#71717A",
    gradientStart: "#FF671F",
    gradientEnd: "#C2410C",
    isActive: true
  },
  {
    id: "INC",
    name: "Indian National Congress",
    shortName: "Congress",
    abbreviation: "INC",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Indian_National_Congress_hand_logo.svg/240px-Indian_National_Congress_hand_logo.svg.png",
    symbolEmoji: "✋",
    primaryColor: "#0099FF",
    secondaryColor: "#138808",
    accentColor: "#0284C7",
    lightBackground: "#F0F9FF",
    darkBackground: "#18181B",
    backgroundImageUrl: "./images/party-backgrounds/inc-bg.jpg",
    textColor: "#1E293B",
    mutedTextColor: "#71717A",
    gradientStart: "#0099FF",
    gradientEnd: "#0369A1",
    isActive: true
  },
  {
    id: "YSRCP",
    name: "Yuvajana Sramika Rythu Congress Party",
    shortName: "YSRCP",
    abbreviation: "YSRCP",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/YSR_Congress_Party_Flag.svg/240px-YSR_Congress_Party_Flag.svg.png",
    symbolEmoji: "🚁",
    primaryColor: "#15803D",
    secondaryColor: "#1D4ED8",
    accentColor: "#16A34A",
    lightBackground: "#F0FDF4",
    darkBackground: "#18181B",
    backgroundImageUrl: "./images/party-backgrounds/ysrcp-bg.jpg",
    textColor: "#1E293B",
    mutedTextColor: "#71717A",
    gradientStart: "#15803D",
    gradientEnd: "#1D4ED8",
    isActive: true
  },
  {
    id: "BRS",
    name: "Bharat Rashtra Samithi",
    shortName: "BRS",
    abbreviation: "BRS",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bharat_Rashtra_Samithi_flag.svg/240px-Bharat_Rashtra_Samithi_flag.svg.png",
    symbolEmoji: "🚗",
    primaryColor: "#EC4899",
    secondaryColor: "#BE185D",
    accentColor: "#F472B6",
    lightBackground: "#FDF2F8",
    darkBackground: "#18181B",
    backgroundImageUrl: "./images/party-backgrounds/brs-bg.jpg",
    textColor: "#1E293B",
    mutedTextColor: "#71717A",
    gradientStart: "#EC4899",
    gradientEnd: "#9D174D",
    isActive: true
  },
  {
    id: "JSP",
    name: "Jana Sena Party",
    shortName: "JSP",
    abbreviation: "JSP",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Jana_Sena_Party_Flag.svg/240px-Jana_Sena_Party_Flag.svg.png",
    symbolEmoji: "⭐",
    primaryColor: "#DC2626",
    secondaryColor: "#1E293B",
    accentColor: "#EF4444",
    lightBackground: "#FEF2F2",
    darkBackground: "#18181B",
    backgroundImageUrl: "./images/party-backgrounds/jsp-bg.jpg",
    textColor: "#1E293B",
    mutedTextColor: "#71717A",
    gradientStart: "#DC2626",
    gradientEnd: "#991B1B",
    isActive: true
  },
  {
    id: "AAP",
    name: "Aam Aadmi Party",
    shortName: "AAP",
    abbreviation: "AAP",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Aam_Aadmi_Party_flag_%28India%29.svg/240px-Aam_Aadmi_Party_flag_%28India%29.svg.png",
    symbolEmoji: "🧹",
    primaryColor: "#0284C7",
    secondaryColor: "#F59E0B",
    accentColor: "#38BDF8",
    lightBackground: "#F0F9FF",
    darkBackground: "#18181B",
    backgroundImageUrl: "./images/party-backgrounds/aap-bg.jpg",
    textColor: "#1E293B",
    mutedTextColor: "#71717A",
    gradientStart: "#0284C7",
    gradientEnd: "#075985",
    isActive: true
  }
];

export const MOCK_ELECTED_REPRESENTATIVES: ElectedRepresentative[] = [
  {
    id: "REP-AP-AC132-2024",
    stateId: "AP",
    parliamentConstituencyId: "KDP-PC",
    assemblyConstituencyId: "KDP-AC",
    candidateId: "cand-kdp-1",
    name: "R. Madhavi Reddy",
    partyId: "TDP",
    designation: "MLA",
    electionDate: "2024-06-04",
    electionType: "General Election 2024",
    status: "CURRENT",
    termStart: "2024",
    termEnd: undefined,
    reasonForChange: undefined,
    source: "Election Commission of India",
    sourceUrl: "https://results.eci.gov.in/AcResultGenJune2024/candidateswise-S01132.htm",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    verifiedAt: "2026-08-28T10:00:00Z",
    lastUpdatedAt: "2026-08-28T10:00:00Z"
  },
  {
    id: "REP-AP-AC132-2019",
    stateId: "AP",
    parliamentConstituencyId: "KDP-PC",
    assemblyConstituencyId: "KDP-AC",
    candidateId: "cand-kdp-former",
    name: "Amzath Basha S. B.",
    partyId: "YSRCP",
    designation: "Former MLA & Deputy CM",
    electionDate: "2019-05-23",
    electionType: "General Election 2019",
    status: "FORMER",
    termStart: "2019",
    termEnd: "2024",
    reasonForChange: "Term completed; defeated in 2024 General Election",
    source: "Official Andhra Pradesh Legislative Assembly",
    sourceUrl: "https://aplegislature.org",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    verifiedAt: "2024-06-05T00:00:00Z",
    lastUpdatedAt: "2024-06-05T00:00:00Z"
  },
  {
    id: "REP-AP-AC133-2024",
    stateId: "AP",
    parliamentConstituencyId: "KDP-PC",
    assemblyConstituencyId: "KML-AC",
    candidateId: "cand-kml-1",
    name: "Putha Krishna Chaitanya Reddy",
    partyId: "TDP",
    designation: "MLA",
    electionDate: "2024-06-04",
    electionType: "General Election 2024",
    status: "CURRENT",
    termStart: "2024",
    termEnd: undefined,
    reasonForChange: undefined,
    source: "Election Commission of India",
    sourceUrl: "https://results.eci.gov.in/AcResultGenJune2024/candidateswise-S01133.htm",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    verifiedAt: "2026-08-28T10:00:00Z",
    lastUpdatedAt: "2026-08-28T10:00:00Z"
  },
  {
    id: "REP-AP-AC130-2024",
    stateId: "AP",
    parliamentConstituencyId: "KDP-PC",
    assemblyConstituencyId: "PLV-AC",
    candidateId: "cand-plv-1",
    name: "Y. S. Jagan Mohan Reddy",
    partyId: "YSRCP",
    designation: "MLA (Former Chief Minister)",
    electionDate: "2024-06-04",
    electionType: "General Election 2024",
    status: "CURRENT",
    termStart: "2024",
    termEnd: undefined,
    reasonForChange: undefined,
    source: "Official Andhra Pradesh Legislative Assembly",
    sourceUrl: "https://aplegislature.org",
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    verifiedAt: "2026-08-28T10:00:00Z",
    lastUpdatedAt: "2026-08-28T10:00:00Z"
  },
  {
    id: "REP-AP-AC167-2024",
    stateId: "AP",
    parliamentConstituencyId: "TPT-PC",
    assemblyConstituencyId: "TPT-AC",
    candidateId: "cand-tpt-1",
    name: "Arani Srinivasulu",
    partyId: "JSP",
    designation: "MLA",
    electionDate: "2024-06-04",
    electionType: "General Election 2024",
    status: "CURRENT",
    termStart: "2024",
    termEnd: undefined,
    reasonForChange: undefined,
    source: "Election Commission of India",
    sourceUrl: "https://results.eci.gov.in/AcResultGenJune2024/candidateswise-S01167.htm",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    verifiedAt: "2026-08-28T10:00:00Z",
    lastUpdatedAt: "2026-08-28T10:00:00Z"
  }
];

export const MOCK_STATES: StateInfo[] = [
  { id: "AP", name: "Andhra Pradesh", code: "AP", totalAssemblyConstituencies: 175, totalParliamentaryConstituencies: 25 },
  { id: "AR", name: "Arunachal Pradesh", code: "AR", totalAssemblyConstituencies: 60, totalParliamentaryConstituencies: 2 },
  { id: "AS", name: "Assam", code: "AS", totalAssemblyConstituencies: 126, totalParliamentaryConstituencies: 14 },
  { id: "BR", name: "Bihar", code: "BR", totalAssemblyConstituencies: 243, totalParliamentaryConstituencies: 40 },
  { id: "CG", name: "Chhattisgarh", code: "CG", totalAssemblyConstituencies: 90, totalParliamentaryConstituencies: 11 },
  { id: "GA", name: "Goa", code: "GA", totalAssemblyConstituencies: 40, totalParliamentaryConstituencies: 2 },
  { id: "GJ", name: "Gujarat", code: "GJ", totalAssemblyConstituencies: 182, totalParliamentaryConstituencies: 26 },
  { id: "HR", name: "Haryana", code: "HR", totalAssemblyConstituencies: 90, totalParliamentaryConstituencies: 10 },
  { id: "HP", name: "Himachal Pradesh", code: "HP", totalAssemblyConstituencies: 68, totalParliamentaryConstituencies: 4 },
  { id: "JH", name: "Jharkhand", code: "JH", totalAssemblyConstituencies: 81, totalParliamentaryConstituencies: 14 },
  { id: "KA", name: "Karnataka", code: "KA", totalAssemblyConstituencies: 224, totalParliamentaryConstituencies: 28 },
  { id: "KL", name: "Kerala", code: "KL", totalAssemblyConstituencies: 140, totalParliamentaryConstituencies: 20 },
  { id: "MP", name: "Madhya Pradesh", code: "MP", totalAssemblyConstituencies: 230, totalParliamentaryConstituencies: 29 },
  { id: "MH", name: "Maharashtra", code: "MH", totalAssemblyConstituencies: 288, totalParliamentaryConstituencies: 48 },
  { id: "MN", name: "Manipur", code: "MN", totalAssemblyConstituencies: 60, totalParliamentaryConstituencies: 2 },
  { id: "ML", name: "Meghalaya", code: "ML", totalAssemblyConstituencies: 60, totalParliamentaryConstituencies: 2 },
  { id: "MZ", name: "Mizoram", code: "MZ", totalAssemblyConstituencies: 40, totalParliamentaryConstituencies: 1 },
  { id: "NL", name: "Nagaland", code: "NL", totalAssemblyConstituencies: 60, totalParliamentaryConstituencies: 1 },
  { id: "OD", name: "Odisha", code: "OD", totalAssemblyConstituencies: 147, totalParliamentaryConstituencies: 21 },
  { id: "PB", name: "Punjab", code: "PB", totalAssemblyConstituencies: 117, totalParliamentaryConstituencies: 13 },
  { id: "RJ", name: "Rajasthan", code: "RJ", totalAssemblyConstituencies: 200, totalParliamentaryConstituencies: 25 },
  { id: "SK", name: "Sikkim", code: "SK", totalAssemblyConstituencies: 32, totalParliamentaryConstituencies: 1 },
  { id: "TN", name: "Tamil Nadu", code: "TN", totalAssemblyConstituencies: 234, totalParliamentaryConstituencies: 39 },
  { id: "TS", name: "Telangana", code: "TS", totalAssemblyConstituencies: 119, totalParliamentaryConstituencies: 17 },
  { id: "TR", name: "Tripura", code: "TR", totalAssemblyConstituencies: 60, totalParliamentaryConstituencies: 2 },
  { id: "UP", name: "Uttar Pradesh", code: "UP", totalAssemblyConstituencies: 403, totalParliamentaryConstituencies: 80 },
  { id: "UK", name: "Uttarakhand", code: "UK", totalAssemblyConstituencies: 70, totalParliamentaryConstituencies: 5 },
  { id: "WB", name: "West Bengal", code: "WB", totalAssemblyConstituencies: 294, totalParliamentaryConstituencies: 42 },
  { id: "AN", name: "Andaman and Nicobar Islands", code: "AN", totalAssemblyConstituencies: 0, totalParliamentaryConstituencies: 1 },
  { id: "CH", name: "Chandigarh", code: "CH", totalAssemblyConstituencies: 0, totalParliamentaryConstituencies: 1 },
  { id: "DN", name: "Dadra & Nagar Haveli and Daman & Diu", code: "DN", totalAssemblyConstituencies: 0, totalParliamentaryConstituencies: 2 },
  { id: "DL", name: "Delhi (NCT)", code: "DL", totalAssemblyConstituencies: 70, totalParliamentaryConstituencies: 7 },
  { id: "JK", name: "Jammu and Kashmir", code: "JK", totalAssemblyConstituencies: 90, totalParliamentaryConstituencies: 5 },
  { id: "LA", name: "Ladakh", code: "LA", totalAssemblyConstituencies: 0, totalParliamentaryConstituencies: 1 },
  { id: "LD", name: "Lakshadweep", code: "LD", totalAssemblyConstituencies: 0, totalParliamentaryConstituencies: 1 },
  { id: "PY", name: "Puducherry", code: "PY", totalAssemblyConstituencies: 30, totalParliamentaryConstituencies: 1 }
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

// Designated Volunteers allowed to log in via mobile OTP
export const DESIGNATED_VOLUNTEERS: DesignatedVolunteer[] = [
  {
    id: "vol-001",
    name: "Ramesh Babu",
    mobile: "9848012345",
    constituency: "Kadapa AC",
    mandal: "Kadapa Urban",
    active: true
  },
  {
    id: "vol-002",
    name: "Suresh Reddy",
    mobile: "9440156789",
    constituency: "Kadapa AC",
    mandal: "Kadapa Rural",
    active: true
  },
  {
    id: "vol-003",
    name: "Lakshmi Prasanna",
    mobile: "9989023456",
    constituency: "Kadapa AC",
    mandal: "Chinthakommadinne",
    active: true
  },
  {
    id: "vol-004",
    name: "K. Mohan Kumar",
    mobile: "9701234567",
    constituency: "Kadapa AC",
    mandal: "Pendlimarri",
    active: true
  },
  {
    id: "vol-005",
    name: "Field Test Volunteer",
    mobile: "123456",
    constituency: "Kadapa AC",
    mandal: "Kadapa Central",
    active: true
  }
];

// Manager Contact Database (Point of Contacts for auto-assigning & escalation)
export const MOCK_GRIEVANCE_CONTACTS: GrievanceContact[] = [
  {
    id: "cnt-01",
    department: "Water Supply",
    category: "Drinking Water Pipeline Leak / Contamination",
    village: "Chinna Chowk",
    mandal: "Kadapa Urban",
    assembly: "Kadapa AC",
    pocName: "M. Ramesh (Irrigation & Water Works EE)",
    designation: "Executive Engineer - Municipal Water Supply",
    phone: "+91 94408 11223",
    email: "ee.water.kdp@ap.gov.in"
  },
  {
    id: "cnt-02",
    department: "Electricity",
    category: "Transformer Overload / Low Voltage",
    village: "Railway Colony",
    mandal: "Kadapa Urban",
    assembly: "Kadapa AC",
    pocName: "B. Venkatesh (APCPDCL Assistant Engineer)",
    designation: "Assistant Engineer (Town Operations)",
    phone: "+91 94408 22334",
    email: "ae.elec.kdp@apcpdcl.in"
  },
  {
    id: "cnt-03",
    department: "Welfare Pension",
    category: "DBT Pension Disbursal / e-KYC Issue",
    village: "Gandhi Nagar",
    mandal: "Kadapa Urban",
    assembly: "Kadapa AC",
    pocName: "P. Vani (Social Welfare Liaison Officer)",
    designation: "Mandal Social Welfare Officer",
    phone: "+91 94408 33445",
    email: "mswo.kdp@ap.gov.in"
  },
  {
    id: "cnt-04",
    department: "Roads & Transit",
    category: "Pothole Clusters & Road Damage",
    village: "Industrial Bypass",
    mandal: "Kadapa Rural",
    assembly: "Kadapa AC",
    pocName: "K. Suresh (R&B Assistant Executive Engineer)",
    designation: "AEE - Roads & Buildings Division",
    phone: "+91 94408 44556",
    email: "aee.rb.kdp@ap.gov.in"
  },
  {
    id: "cnt-05",
    department: "Sanitation",
    category: "Garbage Waste Accumulation / Drainage Overflow",
    village: "Old Bus Stand",
    mandal: "Kadapa Urban",
    assembly: "Kadapa AC",
    pocName: "Dr. G. Prabhakar (Municipal Health Officer)",
    designation: "Chief Sanitary Inspector",
    phone: "+91 94408 55667",
    email: "sanitary.kdp@cdma.gov.in"
  },
  {
    id: "cnt-06",
    department: "Healthcare",
    category: "PHC Doctor Availability & Medicine Stock",
    village: "Rami Reddy Nagar",
    mandal: "Kadapa Rural",
    assembly: "Kadapa AC",
    pocName: "Dr. K. Sujatha (District Medical & Health Officer)",
    designation: "DM&HO Liaison Kadapa",
    phone: "+91 94408 66778",
    email: "dmho.kdp@ap.gov.in"
  },
  {
    id: "cnt-07",
    department: "Agriculture & Irrigation",
    category: "Canal Silt Removal / Subsidized Fertilizer",
    village: "Utukur",
    mandal: "Chinthakommadinne",
    assembly: "Kadapa AC",
    pocName: "Ch. Anjaneyulu (Assistant Director of Agriculture)",
    designation: "ADA - Kadapa Division",
    phone: "+91 94408 77889",
    email: "ada.agri.kdp@ap.gov.in"
  },
  {
    id: "cnt-08",
    department: "Revenue & Land Administration",
    category: "Passbook e-Seva / Boundary Dispute",
    village: "Nagarajupalle",
    mandal: "Pendlimarri",
    assembly: "Kadapa AC",
    pocName: "S. Chennaiah (Mandal Revenue Officer)",
    designation: "MRO / Tahsildar",
    phone: "+91 94408 88990",
    email: "mro.kdp@ap.gov.in"
  }
];

// Mock Grievances List for Grievance Management CRM
export const MOCK_GRIEVANCES: GrievanceItem[] = [
  {
    id: "grv-101",
    ticketNumber: "KDP-GRV-2026-0891",
    citizenType: "Voter",
    citizenName: "K. Sudhakar Reddy",
    citizenAge: 46,
    citizenGender: "Male",
    citizenPhone: "+91 98480 12345",
    address: {
      doorNo: "D.No 14/231-A",
      wardVillage: "Ward 14 (Chinna Chowk)",
      townMandal: "Kadapa Urban",
      assembly: "Kadapa AC",
      parliament: "Kadapa PC",
      state: "Andhra Pradesh"
    },
    subject: "Broken drinking water pipeline near Ambedkar Circle causing muddy water supply",
    department: "Water Supply",
    category: "Drinking Water Pipeline Leak / Contamination",
    description: "Main municipal 4-inch supply line ruptured yesterday evening. Mud and drainage seepage entering residential sumps on Street 4.",
    location: "Near Ambedkar Circle, Street 4, Chinna Chowk",
    priority: "High",
    assignee: "M. Ramesh (Irrigation & Water Works EE)",
    assigneeContact: "+91 94408 11223",
    assigneeDesignation: "Executive Engineer - Municipal Water Supply",
    status: "Pending",
    submittedByVolunteer: {
      name: "Ramesh Babu",
      phone: "9848012345",
      constituency: "Kadapa AC"
    },
    submittedDate: "Today, 09:15 AM",
    timestamp: new Date().toISOString(),
    slaHoursRemaining: 6,
    notes: [
      "09:20 AM: Ticket assigned automatically to Water Supply PoC.",
      "10:45 AM: Field technician team dispatched with pipe clamp weld kit."
    ]
  },
  {
    id: "grv-102",
    ticketNumber: "KDP-GRV-2026-0892",
    citizenType: "Voter",
    citizenName: "S. Fatima Begum",
    citizenAge: 62,
    citizenGender: "Female",
    citizenPhone: "+91 94401 56789",
    address: {
      doorNo: "D.No 7/89",
      wardVillage: "Ward 07 (Gandhi Nagar)",
      townMandal: "Kadapa Urban",
      assembly: "Kadapa AC",
      parliament: "Kadapa PC",
      state: "Andhra Pradesh"
    },
    subject: "Widow pension DBT disbursement delayed for 2 consecutive months",
    department: "Welfare Pension",
    category: "DBT Pension Disbursal / e-KYC Issue",
    description: "Biometric e-KYC device error at the local ward secretariat preventing pension credit. Beneficiary has no other financial support.",
    location: "Gandhi Nagar 3rd Cross, near Urdu Primary School",
    priority: "Medium",
    assignee: "P. Vani (Social Welfare Liaison Officer)",
    assigneeContact: "+91 94408 33445",
    assigneeDesignation: "Mandal Social Welfare Officer",
    status: "Pending",
    submittedByVolunteer: {
      name: "Lakshmi Prasanna",
      phone: "9989023456",
      constituency: "Kadapa AC"
    },
    submittedDate: "Today, 11:30 AM",
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    slaHoursRemaining: 18,
    notes: [
      "11:35 AM: Auto-routed to Social Welfare Officer.",
      "12:10 PM: Doorstep biometric re-scan scheduled with secretariat volunteer."
    ]
  },
  {
    id: "grv-103",
    ticketNumber: "KDP-GRV-2026-0893",
    citizenType: "Cadre",
    citizenName: "T. Narayana Murthy",
    citizenAge: 52,
    citizenGender: "Male",
    citizenPhone: "+91 99890 23456",
    address: {
      doorNo: "D.No 22/104",
      wardVillage: "Ward 22 (Industrial Bypass)",
      townMandal: "Kadapa Rural",
      assembly: "Kadapa AC",
      parliament: "Kadapa PC",
      state: "Andhra Pradesh"
    },
    subject: "Pothole clusters causing bike skids near Kopparthy Industrial junction",
    department: "Roads & Transit",
    category: "Pothole Clusters & Road Damage",
    description: "Heavy monsoons washed away top asphalt over 150m. Two motorcycle riders injured yesterday evening.",
    location: "Kopparthy Junction to NH-40 connector",
    priority: "High",
    assignee: "K. Suresh (R&B Assistant Executive Engineer)",
    assigneeContact: "+91 94408 44556",
    assigneeDesignation: "AEE - Roads & Buildings Division",
    status: "Completed",
    submittedByVolunteer: {
      name: "Suresh Reddy",
      phone: "9440156789",
      constituency: "Kadapa AC"
    },
    submittedDate: "Yesterday, 04:20 PM",
    timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    slaHoursRemaining: 0,
    notes: [
      "Yesterday: Emergency inspection logged.",
      "Today 08:30 AM: Cold asphalt bitumen patching completed. Verified by volunteer."
    ]
  },
  {
    id: "grv-104",
    ticketNumber: "KDP-GRV-2026-0894",
    citizenType: "Leader",
    citizenName: "G. Venkateswarlu",
    citizenAge: 58,
    citizenGender: "Male",
    citizenPhone: "+91 97000 88990",
    address: {
      doorNo: "D.No 3/44",
      wardVillage: "Ward 03 (Railway Colony)",
      townMandal: "Kadapa Urban",
      assembly: "Kadapa AC",
      parliament: "Kadapa PC",
      state: "Andhra Pradesh"
    },
    subject: "Severe low voltage and frequent transformer trips during evening peak hours",
    department: "Electricity",
    category: "Transformer Overload / Low Voltage",
    description: "Transformer overloaded with 35 new connections. Voltage dropping to 140V, damaging water pumps and appliances.",
    location: "Railway Colony D-Block, Opposite Community Hall",
    priority: "High",
    assignee: "B. Venkatesh (APCPDCL Assistant Engineer)",
    assigneeContact: "+91 94408 22334",
    assigneeDesignation: "Assistant Engineer (Town Operations)",
    status: "Completed",
    submittedByVolunteer: {
      name: "Ramesh Babu",
      phone: "9848012345",
      constituency: "Kadapa AC"
    },
    submittedDate: "3 days ago",
    timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    slaHoursRemaining: 0,
    notes: [
      "3 days ago: APCPDCL team arrived for load assessment.",
      "2 days ago: Additional 100kVA transformer installed and phase load balanced."
    ]
  },
  {
    id: "grv-105",
    ticketNumber: "KDP-GRV-2026-0895",
    citizenType: "Voter",
    citizenName: "Dr. S. K. Basha",
    citizenAge: 49,
    citizenGender: "Male",
    citizenPhone: "+91 97012 34567",
    address: {
      doorNo: "D.No 3/112",
      wardVillage: "Old Bus Stand Area",
      townMandal: "Kadapa Urban",
      assembly: "Kadapa AC",
      parliament: "Kadapa PC",
      state: "Andhra Pradesh"
    },
    subject: "Commercial vegetable market garbage accumulation near Primary Health Centre",
    department: "Sanitation",
    category: "Garbage Waste Accumulation / Drainage Overflow",
    description: "Daily market waste not cleared by tractor for 48 hours. Strong stench entering OPD ward of health centre.",
    location: "Behind Vegetable Market, PHC Lane",
    priority: "Medium",
    assignee: "Dr. G. Prabhakar (Municipal Health Officer)",
    assigneeContact: "+91 94408 55667",
    assigneeDesignation: "Chief Sanitary Inspector",
    status: "Pending",
    submittedByVolunteer: {
      name: "K. Mohan Kumar",
      phone: "9701234567",
      constituency: "Kadapa AC"
    },
    submittedDate: "4 days ago",
    timestamp: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    slaHoursRemaining: 12,
    notes: [
      "4 days ago: Sanitary Inspector notified.",
      "Compactor truck deployed for immediate clearing."
    ]
  },
  {
    id: "grv-106",
    citizenType: "Voter",
    ticketNumber: "KDP-GRV-2026-0896",
    citizenName: "B. Anjamma",
    citizenAge: 55,
    citizenGender: "Female",
    citizenPhone: "+91 96521 44556",
    address: {
      doorNo: "D.No 5/12",
      wardVillage: "Utukur Village",
      townMandal: "Chinthakommadinne",
      assembly: "Kadapa AC",
      parliament: "Kadapa PC",
      state: "Andhra Pradesh"
    },
    subject: "Subsidized DAP fertilizer quota shortage at Rythu Bharosa Kendra",
    department: "Agriculture & Irrigation",
    category: "Canal Silt Removal / Subsidized Fertilizer",
    description: "RBK received only 80 bags against demand of 400 bags for groundnut sowing season.",
    location: "Utukur RBK Centre, Main Road",
    priority: "Low",
    assignee: "Ch. Anjaneyulu (Assistant Director of Agriculture)",
    assigneeContact: "+91 94408 77889",
    assigneeDesignation: "ADA - Kadapa Division",
    status: "Can't be done",
    submittedByVolunteer: {
      name: "Lakshmi Prasanna",
      phone: "9989023456",
      constituency: "Kadapa AC"
    },
    submittedDate: "6 days ago",
    timestamp: new Date(Date.now() - 144 * 3600 * 1000).toISOString(),
    slaHoursRemaining: 0,
    notes: [
      "6 days ago: Inquired with Markfed district godown.",
      "Closed with note: Central fertilizer rake delivery delayed statewide. Direct retail distribution advised as interim."
    ]
  },
  {
    id: "grv-107",
    citizenType: "Cadre",
    ticketNumber: "KDP-GRV-2026-0897",
    citizenName: "M. Chenna Kesavulu",
    citizenAge: 39,
    citizenGender: "Male",
    citizenPhone: "+91 99632 11223",
    address: {
      doorNo: "D.No 12/90",
      wardVillage: "Nagarajupalle",
      townMandal: "Pendlimarri",
      assembly: "Kadapa AC",
      parliament: "Kadapa PC",
      state: "Andhra Pradesh"
    },
    subject: "Agricultural land 1B record name error in Webland portal",
    department: "Revenue & Land Administration",
    category: "Passbook e-Seva / Boundary Dispute",
    description: "Survey Number 184/2 name mismatch after digital re-survey. Requesting rectification file forwarding to RDO.",
    location: "Nagarajupalle Tahsildar Jurisdiction",
    priority: "Medium",
    assignee: "S. Chennaiah (Mandal Revenue Officer)",
    assigneeContact: "+91 94408 88990",
    assigneeDesignation: "MRO / Tahsildar",
    status: "Pending",
    submittedByVolunteer: {
      name: "K. Mohan Kumar",
      phone: "9701234567",
      constituency: "Kadapa AC"
    },
    submittedDate: "12 days ago",
    timestamp: new Date(Date.now() - 280 * 3600 * 1000).toISOString(),
    slaHoursRemaining: 24,
    notes: [
      "12 days ago: Document copies collected.",
      "Deputy Tahsildar scheduled field inspection."
    ]
  },
  {
    id: "grv-108",
    citizenType: "Voter",
    ticketNumber: "KDP-GRV-2026-0898",
    citizenName: "K. Sugunamma",
    citizenAge: 42,
    citizenGender: "Female",
    citizenPhone: "+91 98855 66778",
    address: {
      doorNo: "D.No 8/45",
      wardVillage: "Rami Reddy Nagar",
      townMandal: "Kadapa Rural",
      assembly: "Kadapa AC",
      parliament: "Kadapa PC",
      state: "Andhra Pradesh"
    },
    subject: "Shortage of anti-venom and diabetes medicines in local Urban PHC",
    department: "Healthcare",
    category: "PHC Doctor Availability & Medicine Stock",
    description: "Elderly patients turned away without regular insulin and metformin stock for past two weeks.",
    location: "Rami Reddy Nagar Urban PHC, Sector 2",
    priority: "High",
    assignee: "Dr. K. Sujatha (District Medical & Health Officer)",
    assigneeContact: "+91 94408 66778",
    assigneeDesignation: "DM&HO Liaison Kadapa",
    status: "Pending",
    submittedByVolunteer: {
      name: "Suresh Reddy",
      phone: "9440156789",
      constituency: "Kadapa AC"
    },
    submittedDate: "18 days ago",
    timestamp: new Date(Date.now() - 430 * 3600 * 1000).toISOString(),
    slaHoursRemaining: 8,
    notes: [
      "18 days ago: Escalated to Central Drug Stores Kadapa.",
      "Emergency batch indent approved."
    ]
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
  assemblyId = "KDP-AC",
  customAssembly?: AssemblyInfo | null,
  customStateName?: string,
  customParliamentName?: string,
  representative?: ElectedRepresentative | null,
  clientType?: CandidateType
): AuditReport {
  // Resolve State
  const state: StateInfo = customStateName
    ? { id: stateId, name: customStateName, code: stateId }
    : MOCK_STATES.find((s) => s.id === stateId) || {
        id: stateId,
        name: stateId === "TS" ? "Telangana" : stateId === "KA" ? "Karnataka" : stateId === "TN" ? "Tamil Nadu" : stateId === "MH" ? "Maharashtra" : stateId === "UP" ? "Uttar Pradesh" : stateId === "DL" ? "Delhi" : "Andhra Pradesh",
        code: stateId
      };

  // Resolve Parliament
  const parliament: ParliamentInfo = customParliamentName
    ? { id: parliamentId, stateId, name: customParliamentName, code: parliamentId }
    : MOCK_PARLIAMENTS.find((p) => p.id === parliamentId) || {
        id: parliamentId,
        stateId,
        name: parliamentId.replace(/-PC$/i, "").replace(/^.*-/, ""),
        code: parliamentId
      };

  // Resolve Assembly
  let assembly: AssemblyInfo;
  if (customAssembly) {
    assembly = customAssembly;
  } else {
    const found = MOCK_ASSEMBLIES.find((a) => a.id === assemblyId);
    if (found) {
      assembly = found;
    } else {
      const cleanName = assemblyId.replace(/-AC$/i, "").replace(/^.*-/, "") || "Constituency";
      assembly = {
        id: assemblyId,
        parliamentId,
        stateId,
        name: cleanName,
        code: assemblyId.toUpperCase(),
        totalVoters: 245000,
        candidateCount: 4,
        estimatedDigitalAudience: 420000
      };
    }
  }

  let candList: Candidate[] = [...MOCK_CANDIDATES];

  if (representative && representative.status === "CURRENT") {
    const isClientCurrentMla = clientType === "CURRENT_MLA" || !clientType;
    const repParty = representative.party || {
      id: representative.partyId,
      name: representative.partyId,
      shortName: representative.partyId,
      abbreviation: representative.partyId,
      primaryColor: "#FFD200"
    };

    const repCand: Candidate = {
      id: `cand-${representative.id}`,
      name: representative.name,
      party: repParty.name,
      partyAbbr: repParty.abbreviation || repParty.shortName,
      partyColor: repParty.primaryColor || "#FFD200",
      partyId: representative.partyId,
      isClient: isClientCurrentMla,
      isCurrentRepresentative: true,
      candidateType: "CURRENT_MLA",
      role: representative.designation || "Current MLA",
      avatarUrl: representative.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      socialStrengthScore: isClientCurrentMla ? 78.4 : 76.2,
      rank: isClientCurrentMla ? 1 : 2,
      combinedFollowing: 142500,
      verifiedPlatformsCount: 4,
      totalPlatformsCount: 4,
      postingFrequencyMonthly: 128,
      avgEngagementRate: 5.4,
      estimatedReach: 98400,
      issueCoverageScore: 82,
      socials: MOCK_CANDIDATES[0].socials
    };

    if (isClientCurrentMla) {
      candList = [
        repCand,
        {
          ...MOCK_CANDIDATES[1],
          isClient: false,
          isCurrentRepresentative: false,
          candidateType: "PRIMARY_OPPOSITION"
        },
        {
          ...MOCK_CANDIDATES[2],
          isClient: false,
          isCurrentRepresentative: false,
          candidateType: "SECONDARY_OPPOSITION"
        },
        {
          ...MOCK_CANDIDATES[3],
          isClient: false,
          isCurrentRepresentative: false,
          candidateType: "OTHER"
        }
      ];
    } else {
      const clientCand: Candidate = {
        id: "cand-challenger-client",
        name: "Hon. Candidate Executive",
        party: "People's Progressive Alliance",
        partyAbbr: "PPA",
        partyColor: "#0284C7",
        isClient: true,
        isCurrentRepresentative: false,
        candidateType: clientType || "PROSPECTIVE_CANDIDATE",
        role: clientType === "MLA_IN_CHARGE" ? "MLA-in-Charge" : "Prospective MLA Candidate",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
        socialStrengthScore: 79.8,
        rank: 1,
        combinedFollowing: 154000,
        verifiedPlatformsCount: 4,
        totalPlatformsCount: 4,
        postingFrequencyMonthly: 142,
        avgEngagementRate: 6.1,
        estimatedReach: 104500,
        issueCoverageScore: 86,
        socials: MOCK_CANDIDATES[0].socials
      };

      candList = [
        clientCand,
        {
          ...repCand,
          isClient: false,
          rank: 2,
          socialStrengthScore: 74.5
        },
        {
          ...MOCK_CANDIDATES[1],
          isClient: false,
          isCurrentRepresentative: false,
          candidateType: "PRIMARY_OPPOSITION"
        },
        {
          ...MOCK_CANDIDATES[2],
          isClient: false,
          isCurrentRepresentative: false,
          candidateType: "SECONDARY_OPPOSITION"
        }
      ];
    }
  }

  const rankedCandList = rankCandidates(candList);
  const client = rankedCandList.find((c) => c.isClient) || rankedCandList[0];

  const totalVoters = assembly.totalVoters || 250000;
  const estimatedUniqueClientReach = Math.min(client.estimatedReach, Math.round(totalVoters * 0.42));
  const voterCoverage = calculateVoterCoverage(estimatedUniqueClientReach, totalVoters);
  const voterReachGap = calculateReachGap(totalVoters, estimatedUniqueClientReach);

  const deduplicatedDigitalAudience = assembly.estimatedDigitalAudience || Math.round(totalVoters * 0.75);
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

  // Dynamically tailor issues and hashtags for this specific constituency
  const cleanTag = assembly.name.replace(/[^a-zA-Z0-9]/g, "");
  const dynamicIssues: IssueItem[] = [
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
      topHashtags: [`#${cleanTag}WaterProject`, `#${parliament.name.replace(/[^a-zA-Z0-9]/g, "")}Canal`, "#FarmerSupport"]
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
      topHashtags: [`#${cleanTag}Roads`, `#${cleanTag}RingRoad`, "#SmartStreetLights"]
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
      topHashtags: [`#${cleanTag}Youth`, `#${cleanTag}GovtColleges`, "#DigitalClassrooms"]
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
      topHashtags: [`#${cleanTag}Growth`, `#${cleanTag}Jobs`, "#IndustrialHub"]
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
      topHashtags: [`#${cleanTag}Health`, `#${cleanTag}Clinics`, "#FreeHealthCamps"]
    }
  ];

  const recommendations = generateSmartRecommendations(
    MOCK_PLATFORM_AUDIENCES,
    voterCoverage,
    digitalCoverage,
    dynamicIssues
  );

  const dynamicConfidence: DataConfidenceRecord[] = [
    {
      metric: `Voter Population (${(totalVoters / 100000).toFixed(2)}L)`,
      source: "Election Commission of India (ECI) Final Electoral Rolls",
      date: "January 2026",
      confidence: "Verified",
      notes: `Official published electoral statistics for ${assembly.name} AC.`
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
      metric: `Platform Audience Estimates (${(deduplicatedDigitalAudience / 100000).toFixed(2)}L)`,
      source: "Meta Ads & Google Campaign Manager Geo-Targeting Index",
      date: "August 2026",
      confidence: "Estimated",
      notes: `Audience models geo-fenced to ${assembly.name} AC postal codes. Non-unique across platforms.`
    },
    {
      metric: `Client Estimated Reach (${(estimatedUniqueClientReach / 100000).toFixed(2)}L)`,
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
      notes: `Derived from localized social posts, comments, and regional news citations across ${assembly.name}.`
    }
  ];

  return {
    id: `audit-${(assembly.code || assembly.name).toLowerCase()}-20260828`,
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
    issues: dynamicIssues,
    recommendations,
    scorecard,
    overallStrengthScore: client.socialStrengthScore,
    dataConfidence: dynamicConfidence,
    headline: `Client currently leads the competitive social landscape in ${assembly.name} AC, but significant voter reach remains untapped.`,
    keyObservations: [
      `Client holds #1 rank in overall Social Strength (${client.socialStrengthScore}/100) across ${assembly.name} AC, leading nearest opposition candidate by +11 points.`,
      `Verified digital presence across 4 major platforms achieves ${voterCoverage}% estimated coverage of the ${assembly.name} electorate.`,
      `A significant untapped opportunity of ${((totalVoters - estimatedUniqueClientReach) / 100000).toFixed(2)}L potential audience exists on key digital channels.`
    ]
  };
}
