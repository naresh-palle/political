import React, { useState, useMemo } from "react";
import {
  FieldIssue,
  GrievanceItem,
  GrievanceContact,
  DesignatedVolunteer,
  GrievancePriority,
  GrievanceStatus,
  GrievanceCitizenType,
  UserProfile
} from "../../types";
import { AssignComplaintModal } from "../fieldops/AssignComplaintModal";
import {
  MOCK_GRIEVANCES,
  MOCK_GRIEVANCE_CONTACTS,
  DESIGNATED_VOLUNTEERS
} from "../../services/mockData";
import {
  Search,
  Plus,
  Phone,
  MapPin,
  Send,
  UserCheck,
  Sparkles,
  Shield,
  User,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  FileText,
  Filter,
  Check,
  ChevronRight,
  Lock,
  Smartphone,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Edit3,
  Trash2,
  Briefcase,
  Eye,
  Info,
  MessageCircle
} from "lucide-react";

export interface MlaMinisterialInfo {
  name: string;
  constituency: string;
  constituencyCode: string;
  partyId: string;
  partyName: string;
  partyEmoji: string;
  partyColor: string;
  role: string;
  isMinister: boolean;
  ministerialDepartments?: string[];
  photoUrl: string;
  contactOffice: string;
}

export const MLA_MINISTERIAL_REGISTRY: Record<string, MlaMinisterialInfo> = {
  "BNG_BANAGANAPALLE": {
    name: "B. C. Janardhan Reddy",
    constituency: "Banaganapalle Assembly Constituency",
    constituencyCode: "AC-140",
    partyId: "TDP",
    partyName: "Telugu Desam Party",
    partyEmoji: "🏛️",
    partyColor: "#D4A24C",
    role: "Minister for Roads & Buildings and Infrastructure | MLA Banaganapalle",
    isMinister: true,
    ministerialDepartments: [
      "Roads & Buildings Infrastructure (R&B)",
      "Rural Water Supply & Sanitation",
      "Yaganti & Owk Irrigation & Tourism"
    ],
    photoUrl: "./images/mla/bc_janardhan_reddy.jpg",
    contactOffice: "MLA Camp Office, RTC Bus Stand Road, Banaganapalle Town, AP"
  },
  "TDP_KADAPA": {
    name: "R. Madhavi Reddy",
    constituency: "Kadapa Assembly Constituency",
    constituencyCode: "AC-132",
    partyId: "TDP",
    partyName: "Telugu Desam Party",
    partyEmoji: "🚲",
    partyColor: "#FFD200",
    role: "Member of the Legislative Assembly (MLA)",
    isMinister: false,
    ministerialDepartments: [
      "Civic Infrastructure & Urban Drainage",
      "Drinking Water Pipeline Augmentation",
      "Public Health & Hospital Empanelment"
    ],
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    contactOffice: "MLA Camp Office, 7-Roads Junction, Kadapa, AP"
  },
  "JSP_PITHAPURAM": {
    name: "Konidela Pawan Kalyan",
    constituency: "Pithapuram Assembly Constituency",
    constituencyCode: "AC-041",
    partyId: "JSP",
    partyName: "Jana Sena Party",
    partyEmoji: "⭐",
    partyColor: "#DC2626",
    role: "Deputy Chief Minister of Andhra Pradesh",
    isMinister: true,
    ministerialDepartments: [
      "Panchayat Raj & Rural Development",
      "Rural Water Supply & Sanitation",
      "Environment, Forest, Science & Technology"
    ],
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    contactOffice: "Deputy CM Secretariat, Amaravati / Pithapuram Camp Office"
  },
  "YSRCP_PULIVENDULA": {
    name: "Y. S. Jagan Mohan Reddy",
    constituency: "Pulivendula Assembly Constituency",
    constituencyCode: "AC-133",
    partyId: "YSRCP",
    partyName: "Yuvajana Sramika Rythu Congress Party",
    partyEmoji: "🚁",
    partyColor: "#15803D",
    role: "Member of the Legislative Assembly (MLA) · Leader of YSRCP",
    isMinister: false,
    ministerialDepartments: [
      "Irrigation & Canal Water Distribution",
      "Rythu Bharosa & Farmer Welfare",
      "Pension & DBT Entitlements"
    ],
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    contactOffice: "YSRCP Central Office, Tadepalli / Pulivendula Camp Office"
  },
  "TDP_MANGALAGIRI": {
    name: "Nara Lokesh",
    constituency: "Mangalagiri Assembly Constituency",
    constituencyCode: "AC-087",
    partyId: "TDP",
    partyName: "Telugu Desam Party",
    partyEmoji: "🚲",
    partyColor: "#FFD200",
    role: "Minister for Human Resources Development (HRD), IT & Electronics, RTGS",
    isMinister: true,
    ministerialDepartments: [
      "Human Resources Development (Education)",
      "Information Technology, Electronics & Communications (IT&E)",
      "Real Time Governance Society (RTGS)"
    ],
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    contactOffice: "Ministerial Chamber, 4th Block, AP Secretariat, Velagapudi"
  },
  "TDP_KUPPAM": {
    name: "N. Chandrababu Naidu",
    constituency: "Kuppam Assembly Constituency",
    constituencyCode: "AC-175",
    partyId: "TDP",
    partyName: "Telugu Desam Party",
    partyEmoji: "🚲",
    partyColor: "#FFD200",
    role: "Hon'ble Chief Minister of Andhra Pradesh",
    isMinister: true,
    ministerialDepartments: [
      "General Administration Department (GAD)",
      "Law & Order and Home Affairs",
      "Public Policy, Investment Promotion & Capital Region"
    ],
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    contactOffice: "Chief Minister's Office (CMO), 1st Block, AP Secretariat, Velagapudi"
  }
};

// Department & Category Tree for Andhra Pradesh / Constituency Grievances
export const DEPARTMENT_CATEGORIES: Record<string, string[]> = {
  "Water Supply": [
    "Drinking Water Pipeline Leak / Contamination",
    "Low Pressure / Irregular Supply Schedule",
    "Borewell & Handpump Repair",
    "Water Tanker Dispatch Request",
    "Overhead Tank Cleaning & Silt Removal"
  ],
  "Electricity": [
    "Transformer Overload / Low Voltage",
    "Streetlight Failure & Damaged Poles",
    "Power Outage & Loose High-Tension Wires",
    "Agricultural Feeder Meter Issue",
    "Frequent Phase Drop / Tripping"
  ],
  "Roads & Transit": [
    "Pothole Clusters & Road Damage",
    "Speed Breakers & Zebra Crossing Installation",
    "Culvert & Storm Water Drain Repair",
    "RTC Bus Frequency & Route Extension",
    "Street Paving in Residential Colonies"
  ],
  "Sanitation": [
    "Garbage Waste Accumulation / Drainage Overflow",
    "Public Toilet Maintenance & Sanitation",
    "Mosquito Fogging & Larvicide Spray",
    "Underground Drainage Blockage",
    "Desilting of Open Side Drains"
  ],
  "Welfare Pension": [
    "DBT Pension Disbursal / e-KYC Issue",
    "New Pension Application (Widow / Old Age / Disabled)",
    "Aadhaar Biometric Linking Mismatch",
    "Disability Certificate Verification",
    "Pension Amount Deduction Grievance"
  ],
  "Healthcare": [
    "PHC Doctor Availability & Medicine Stock",
    "Emergency Ambulance (108/104) Response",
    "Maternal & Child Health Kiosk",
    "Diagnostic Lab Testing Facility",
    "Arogyasri Hospital Empanelment Query"
  ],
  "Agriculture & Irrigation": [
    "Canal Silt Removal / Subsidized Fertilizer",
    "Crop Damage Compensation / Rythu Bharosa",
    "Micro-Irrigation Drip Equipment",
    "Minimum Support Price (MSP) Procurement Issue",
    "Electricity Subsidy for Borewells"
  ],
  "Revenue & Land Administration": [
    "Passbook e-Seva / Boundary Dispute",
    "Caste / Income Certificate Delay",
    "House Site Patta Grievance",
    "Webland Digitization Record Correction",
    "Encroachment of Common Village Land"
  ]
};

const MANDALS_LIST = [
  "Banaganapalle Town",
  "Koilakuntla Town",
  "Banaganapalle Mandal",
  "Koilakuntla Mandal",
  "Owk Mandal",
  "Sanjamala Mandal",
  "Kolimigundla Mandal"
];

interface GrievanceManagementProps {
  currentProfile?: UserProfile;
}

export const GrievanceManagement: React.FC<GrievanceManagementProps> = ({ currentProfile }) => {
  // Global Active Role: Manager vs Volunteer
  const [activeRole, setActiveRole] = useState<"manager" | "volunteer">("manager");

  // Active MLA Profile Resolution
  const activeMla: MlaMinisterialInfo = useMemo(() => {
    if (currentProfile) {
      if (currentProfile.partyId === "JSP" || currentProfile.assignedConstituency?.toLowerCase().includes("pithapuram")) {
        return MLA_MINISTERIAL_REGISTRY["JSP_PITHAPURAM"];
      }
      if (currentProfile.partyId === "YSRCP" || currentProfile.assignedConstituency?.toLowerCase().includes("pulivendula")) {
        return MLA_MINISTERIAL_REGISTRY["YSRCP_PULIVENDULA"];
      }
      if (currentProfile.assignedConstituency?.toLowerCase().includes("mangalagiri")) {
        return MLA_MINISTERIAL_REGISTRY["TDP_MANGALAGIRI"];
      }
      if (currentProfile.assignedConstituency?.toLowerCase().includes("kuppam")) {
        return MLA_MINISTERIAL_REGISTRY["TDP_KUPPAM"];
      }
      if (currentProfile.assignedConstituency?.toLowerCase().includes("kadapa") && !currentProfile.assignedConstituency?.toLowerCase().includes("banaganapalle")) {
        return MLA_MINISTERIAL_REGISTRY["TDP_KADAPA"];
      }
      // If currentProfile has custom or political admin details, overlay them
      const base = MLA_MINISTERIAL_REGISTRY["BNG_BANAGANAPALLE"];
      return {
        ...base,
        name: currentProfile.primaryRole === "POLITICAL_ADMIN" ? currentProfile.name : base.name,
        photoUrl: (currentProfile.primaryRole === "POLITICAL_ADMIN" && currentProfile.avatar) ? currentProfile.avatar : base.photoUrl,
        contactOffice: currentProfile.primaryRole === "POLITICAL_ADMIN" ? `MLA Camp Office, RTC Bus Stand Road, ${currentProfile.assignedConstituency || "Banaganapalle"}, AP` : base.contactOffice
      };
    }
    return MLA_MINISTERIAL_REGISTRY["BNG_BANAGANAPALLE"];
  }, [currentProfile]);

  // Master Data State
  const [grievances, setGrievances] = useState<GrievanceItem[]>(MOCK_GRIEVANCES);
  const [contacts, setContacts] = useState<GrievanceContact[]>(MOCK_GRIEVANCE_CONTACTS);
  const [designatedVolunteers, setDesignatedVolunteers] = useState<DesignatedVolunteer[]>(DESIGNATED_VOLUNTEERS);

  // Active Navigation Tab for Manager: "overview" | "tickets" | "contacts" | "volunteers"
  const [managerTab, setManagerTab] = useState<"overview" | "tickets" | "contacts" | "volunteers">("overview");

  // Volunteer Authentication State
  const [volunteerMobileInput, setVolunteerMobileInput] = useState<string>("9848012345");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [enteredOtp, setEnteredOtp] = useState<string>("");
  const [simulatedOtp, setSimulatedOtp] = useState<string>("");
  const [volunteerAuthError, setVolunteerAuthError] = useState<string>("");
  const [loggedVolunteer, setLoggedVolunteer] = useState<DesignatedVolunteer | null>(null);

  // Volunteer Submission Form State
  // Section 1: Personal Details
  const [citizenType, setCitizenType] = useState<GrievanceCitizenType>("Voter");
  const [citizenName, setCitizenName] = useState<string>("");
  const [citizenAge, setCitizenAge] = useState<string>("38");
  const [citizenGender, setCitizenGender] = useState<"Male" | "Female" | "Other">("Male");
  const [citizenPhone, setCitizenPhone] = useState<string>("");
  const [doorNo, setDoorNo] = useState<string>("");
  const [wardVillage, setWardVillage] = useState<string>("");
  const [townMandal, setTownMandal] = useState<string>("Kadapa Urban");
  const [assembly, setAssembly] = useState<string>("Kadapa AC");
  const [parliament, setParliament] = useState<string>("Kadapa PC");
  const [stateName, setStateName] = useState<string>("Andhra Pradesh");

  // Section 2: Issue Details
  const [issueSubject, setIssueSubject] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("Water Supply");
  const [selectedCat, setSelectedCat] = useState<string>(DEPARTMENT_CATEGORIES["Water Supply"][0]);
  const [issueDescription, setIssueDescription] = useState<string>("");
  const [issueLocation, setIssueLocation] = useState<string>("");
  const [issuePriority, setIssuePriority] = useState<GrievancePriority>("Medium");
  const [assigneeName, setAssigneeName] = useState<string>("");
  const [assigneeContact, setAssigneeContact] = useState<string>("");
  const [assigneeDesignation, setAssigneeDesignation] = useState<string>("");
  const [autoMatchedPoC, setAutoMatchedPoC] = useState<GrievanceContact | null>(null);
  const [assignModalIssue, setAssignModalIssue] = useState<FieldIssue | null>(null);

  // Volunteer Submission Receipt Modal
  const [submittedReceipt, setSubmittedReceipt] = useState<GrievanceItem | null>(null);
  const [showVolunteerReceiptList, setShowVolunteerReceiptList] = useState<boolean>(false);

  // Manager Master Ticket Explorer State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterDepartment, setFilterDepartment] = useState<string>("All");
  const [filterVolunteer, setFilterVolunteer] = useState<string>("All");
  const [activeTicket, setActiveTicket] = useState<GrievanceItem | null>(MOCK_GRIEVANCES[0]);
  const [resolutionNoteInput, setResolutionNoteInput] = useState<string>("");

  // Contact Database Modal State
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState<boolean>(false);
  const [newContactDept, setNewContactDept] = useState<string>("Water Supply");
  const [newContactCat, setNewContactCat] = useState<string>(DEPARTMENT_CATEGORIES["Water Supply"][0]);
  const [newContactVillage, setNewContactVillage] = useState<string>("");
  const [newContactMandal, setNewContactMandal] = useState<string>("Kadapa Urban");
  const [newContactAssembly, setNewContactAssembly] = useState<string>("Kadapa AC");
  const [newContactName, setNewContactName] = useState<string>("");
  const [newContactDesignation, setNewContactDesignation] = useState<string>("");
  const [newContactPhone, setNewContactPhone] = useState<string>("");
  const [newContactEmail, setNewContactEmail] = useState<string>("");

  // New Designated Volunteer Modal State
  const [isAddVolunteerModalOpen, setIsAddVolunteerModalOpen] = useState<boolean>(false);
  const [newVolName, setNewVolName] = useState<string>("");
  const [newVolMobile, setNewVolMobile] = useState<string>("");
  const [newVolMandal, setNewVolMandal] = useState<string>("Kadapa Urban");

  // ----------------- AUTO-FETCH ASSIGNEE LOGIC -----------------
  const handleAutoLookupAssignee = (dept: string, cat: string, mandal: string, village: string) => {
    const match = contacts.find((c) => {
      const deptMatch = c.department.toLowerCase() === dept.toLowerCase();
      const mandalMatch = !mandal || c.mandal.toLowerCase() === mandal.toLowerCase();
      const villageMatch = !village || c.village.toLowerCase().includes(village.toLowerCase()) || village.toLowerCase().includes(c.village.toLowerCase());
      const catMatch = !cat || c.category.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(c.category.toLowerCase());
      return deptMatch && (catMatch || mandalMatch || villageMatch);
    }) || contacts.find((c) => c.department.toLowerCase() === dept.toLowerCase());

    if (match) {
      setAutoMatchedPoC(match);
      setAssigneeName(match.pocName);
      setAssigneeContact(match.phone);
      setAssigneeDesignation(match.designation);
    } else {
      setAutoMatchedPoC(null);
      setAssigneeName("Assigned to Mandal Nodal Officer");
      setAssigneeContact("+91 94408 00000");
      setAssigneeDesignation("Constituency Grievance Liaison");
    }
  };

  const handleDeptChange = (dept: string) => {
    setSelectedDept(dept);
    const firstCat = DEPARTMENT_CATEGORIES[dept]?.[0] || "";
    setSelectedCat(firstCat);
    handleAutoLookupAssignee(dept, firstCat, townMandal, wardVillage);
  };

  const handleCatChange = (cat: string) => {
    setSelectedCat(cat);
    handleAutoLookupAssignee(selectedDept, cat, townMandal, wardVillage);
  };

  const handleMandalChange = (mandal: string) => {
    setTownMandal(mandal);
    handleAutoLookupAssignee(selectedDept, selectedCat, mandal, wardVillage);
  };

  const handleVillageChange = (village: string) => {
    setWardVillage(village);
    handleAutoLookupAssignee(selectedDept, selectedCat, townMandal, village);
  };

  // ----------------- VOLUNTEER AUTHENTICATION -----------------
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setVolunteerAuthError("");
    const cleanedMobile = volunteerMobileInput.trim().replace(/\D/g, "");

    const matchedVol = designatedVolunteers.find(
      (v) => v.mobile === cleanedMobile && v.active
    );

    if (!matchedVol) {
      setVolunteerAuthError(
        `Mobile number "${volunteerMobileInput}" is not in the designated volunteer registry. Only authorized volunteer numbers can receive OTP and access the portal.`
      );
      return;
    }

    const generatedOtp = "4826";
    setSimulatedOtp(generatedOtp);
    setEnteredOtp(generatedOtp);
    setOtpSent(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp !== simulatedOtp && enteredOtp !== "1234") {
      setVolunteerAuthError("Invalid OTP. Please enter the verification code sent to your mobile.");
      return;
    }

    const matchedVol = designatedVolunteers.find(
      (v) => v.mobile === volunteerMobileInput.trim().replace(/\D/g, "")
    );
    if (matchedVol) {
      setLoggedVolunteer(matchedVol);
      setOtpSent(false);
      setVolunteerAuthError("");
      handleAutoLookupAssignee(selectedDept, selectedCat, townMandal, wardVillage);
    }
  };

  const handleVolunteerLogout = () => {
    setLoggedVolunteer(null);
    setOtpSent(false);
    setEnteredOtp("");
  };

  // ----------------- SUBMIT GRIEVANCE TICKET -----------------
  const handleVolunteerSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenName || !issueSubject) {
      alert("Please fill in all mandatory Citizen and Issue fields.");
      return;
    }

    const uniqueRandom = Math.floor(1000 + Math.random() * 9000);
    const ticketNum = `KDP-GRV-2026-${uniqueRandom}`;
    const nowIso = new Date().toISOString();
    const nowFormatted = "Today, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newTicket: GrievanceItem = {
      id: `grv-${Date.now()}`,
      ticketNumber: ticketNum,
      citizenType,
      citizenName,
      citizenAge: parseInt(citizenAge) || 35,
      citizenGender,
      citizenPhone: citizenPhone || "+91 98480 00000",
      address: {
        doorNo: doorNo || "N/A",
        wardVillage: wardVillage || "Ward Center",
        townMandal,
        assembly,
        parliament,
        state: stateName
      },
      subject: issueSubject,
      department: selectedDept,
      category: selectedCat,
      description: issueDescription || issueSubject,
      location: issueLocation || `${wardVillage}, ${townMandal}`,
      priority: issuePriority,
      assignee: assigneeName || "Unassigned Officer",
      assigneeContact,
      assigneeDesignation,
      status: "Pending",
      submittedByVolunteer: {
        name: loggedVolunteer?.name || "Designated Volunteer",
        phone: loggedVolunteer?.mobile || "9848012345",
        constituency: loggedVolunteer?.constituency || assembly
      },
      submittedDate: nowFormatted,
      timestamp: nowIso,
      slaHoursRemaining: issuePriority === "High" ? 12 : issuePriority === "Medium" ? 24 : 48,
      notes: [
        `Intake logged by Volunteer ${loggedVolunteer?.name || "Field Agent"} (${loggedVolunteer?.mobile || ""}) at ${nowFormatted}.`,
        `Automatically routed to ${assigneeName} (${assigneeDesignation || "Point of Contact"}).`
      ]
    };

    setGrievances([newTicket, ...grievances]);
    setActiveTicket(newTicket);
    setSubmittedReceipt(newTicket);

    // Reset Form Fields
    setCitizenName("");
    setCitizenPhone("");
    setDoorNo("");
    setWardVillage("");
    setIssueSubject("");
    setIssueDescription("");
    setIssueLocation("");
  };

  // ----------------- MANAGER ACTIONS -----------------
  const handleUpdateTicketStatus = (ticketId: string, status: GrievanceStatus) => {
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === ticketId) {
          const updated = {
            ...g,
            status,
            notes: [
              ...g.notes,
              `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}: Status updated to "${status}" by Campaign Manager.`
            ]
          };
          if (activeTicket?.id === ticketId) setActiveTicket(updated);
          return updated;
        }
        return g;
      })
    );
  };

  const handleAddResolutionNote = (ticketId: string) => {
    if (!resolutionNoteInput.trim()) return;
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === ticketId) {
          const updated = {
            ...g,
            notes: [
              ...g.notes,
              `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}: ${resolutionNoteInput.trim()}`
            ]
          };
          if (activeTicket?.id === ticketId) setActiveTicket(updated);
          return updated;
        }
        return g;
      })
    );
    setResolutionNoteInput("");
  };

  const handleReassignTicket = (ticketId: string, contact: GrievanceContact) => {
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === ticketId) {
          const updated = {
            ...g,
            assignee: contact.pocName,
            assigneeContact: contact.phone,
            assigneeDesignation: contact.designation,
            notes: [
              ...g.notes,
              `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}: Reassigned to ${contact.pocName} (${contact.designation}).`
            ]
          };
          if (activeTicket?.id === ticketId) setActiveTicket(updated);
          return updated;
        }
        return g;
      })
    );
  };

  // Contact Directory Actions
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    const newEntry: GrievanceContact = {
      id: `cnt-${Date.now()}`,
      department: newContactDept,
      category: newContactCat,
      village: newContactVillage || "General Area",
      mandal: newContactMandal,
      assembly: newContactAssembly,
      pocName: newContactName,
      designation: newContactDesignation || "Department Liaison Officer",
      phone: newContactPhone,
      email: newContactEmail || "poc@kadapa.gov.in"
    };

    setContacts([newEntry, ...contacts]);
    setIsAddContactModalOpen(false);
    setNewContactName("");
    setNewContactDesignation("");
    setNewContactPhone("");
    setNewContactEmail("");
    setNewContactVillage("");
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(contacts.filter((c) => c.id !== contactId));
  };

  // Volunteer Registry Actions
  const handleAddVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolName || !newVolMobile) return;

    const cleanMobile = newVolMobile.trim().replace(/\D/g, "");
    const newVol: DesignatedVolunteer = {
      id: `vol-${Date.now()}`,
      name: newVolName,
      mobile: cleanMobile,
      constituency: "Kadapa AC",
      mandal: newVolMandal,
      active: true
    };

    setDesignatedVolunteers([...designatedVolunteers, newVol]);
    setIsAddVolunteerModalOpen(false);
    setNewVolName("");
    setNewVolMobile("");
  };

  const handleToggleVolunteerStatus = (volId: string) => {
    setDesignatedVolunteers(
      designatedVolunteers.map((v) => (v.id === volId ? { ...v, active: !v.active } : v))
    );
  };

  // ----------------- MANAGER METRICS & ANALYTICS CALCULATIONS -----------------
  const totalTickets = grievances.length;
  const highPriorityCount = grievances.filter((g) => g.priority === "High").length;
  const mediumPriorityCount = grievances.filter((g) => g.priority === "Medium").length;
  const lowPriorityCount = grievances.filter((g) => g.priority === "Low").length;

  const completedCount = grievances.filter(
    (g) => g.status === "Completed" || g.status === "Resolved"
  ).length;
  const pendingCount = grievances.filter(
    (g) => g.status === "Pending" || g.status === "Open" || g.status === "In_Progress" || g.status === "Assigned"
  ).length;
  const cantBeDoneCount = grievances.filter(
    (g) => g.status === "Can't be done"
  ).length;

  // Department-wise distribution
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(DEPARTMENT_CATEGORIES).forEach((d) => (counts[d] = 0));
    grievances.forEach((g) => {
      counts[g.department] = (counts[g.department] || 0) + 1;
    });
    return counts;
  }, [grievances]);

  // Area-wise distribution (by Mandal)
  const mandalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MANDALS_LIST.forEach((m) => (counts[m] = 0));
    grievances.forEach((g) => {
      const mandal = g.address?.townMandal || "Kadapa Urban";
      counts[mandal] = (counts[mandal] || 0) + 1;
    });
    return counts;
  }, [grievances]);

  // Gender & Citizen Type Breakdown
  const genderStats = useMemo(() => {
    const counts = { Male: 0, Female: 0, Other: 0 };
    grievances.forEach((g) => {
      const gender = g.citizenGender || "Male";
      if (gender in counts) counts[gender as keyof typeof counts]++;
      else counts.Male++;
    });
    return counts;
  }, [grievances]);

  const citizenTypeStats = useMemo(() => {
    const counts = { Voter: 0, Cadre: 0, Leader: 0 };
    grievances.forEach((g) => {
      const t = g.citizenType || "Voter";
      if (t in counts) counts[t as keyof typeof counts]++;
      else counts.Voter++;
    });
    return counts;
  }, [grievances]);

  // Volunteer Performance Analytics (Daily / Weekly / Monthly / Total)
  const volunteerAnalytics = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 3600 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    return designatedVolunteers.map((vol) => {
      const volTickets = grievances.filter(
        (g) =>
          g.submittedByVolunteer?.phone === vol.mobile ||
          g.submittedByVolunteer?.name.toLowerCase() === vol.name.toLowerCase()
      );

      const dayCount = volTickets.filter((g) => {
        const t = g.timestamp ? new Date(g.timestamp).getTime() : now;
        return now - t <= oneDay;
      }).length;

      const weekCount = volTickets.filter((g) => {
        const t = g.timestamp ? new Date(g.timestamp).getTime() : now;
        return now - t <= oneWeek;
      }).length;

      const monthCount = volTickets.filter((g) => {
        const t = g.timestamp ? new Date(g.timestamp).getTime() : now;
        return now - t <= oneMonth;
      }).length;

      return {
        ...vol,
        totalFiled: volTickets.length,
        dayCount,
        weekCount,
        monthCount,
        resolvedCount: volTickets.filter((g) => g.status === "Completed" || g.status === "Resolved").length
      };
    });
  }, [designatedVolunteers, grievances]);

  // Assignee workload distribution
  const assigneeStats = useMemo(() => {
    const counts: Record<string, { count: number; contact: string; designation: string }> = {};
    grievances.forEach((g) => {
      const name = g.assignee || "Unassigned";
      if (!counts[name]) {
        counts[name] = {
          count: 0,
          contact: g.assigneeContact || "",
          designation: g.assigneeDesignation || "Officer"
        };
      }
      counts[name].count++;
    });
    return Object.entries(counts).map(([name, data]) => ({
      name,
      ...data
    }));
  }, [grievances]);

  // Filtered grievances for Manager master list
  const filteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      const matchesSearch =
        searchQuery === "" ||
        g.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = filterPriority === "All" || g.priority === filterPriority;
      const matchesStatus =
        filterStatus === "All" ||
        (filterStatus === "Completed" && (g.status === "Completed" || g.status === "Resolved")) ||
        (filterStatus === "Pending" && (g.status === "Pending" || g.status === "Open" || g.status === "In_Progress" || g.status === "Assigned")) ||
        (filterStatus === "Can't be done" && g.status === "Can't be done");

      const matchesDept = filterDepartment === "All" || g.department === filterDepartment;
      const matchesVol =
        filterVolunteer === "All" ||
        g.submittedByVolunteer?.phone === filterVolunteer ||
        g.submittedByVolunteer?.name === filterVolunteer;

      return matchesSearch && matchesPriority && matchesStatus && matchesDept && matchesVol;
    });
  }, [grievances, searchQuery, filterPriority, filterStatus, filterDepartment, filterVolunteer]);

  // Helpers for Badges
  const getPriorityBadge = (priority: GrievancePriority | string) => {
    switch (priority) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-300 font-bold";
      case "Medium":
        return "bg-amber-50 text-amber-800 border-amber-300 font-semibold";
      case "Low":
        return "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (status: GrievanceStatus | string) => {
    switch (status) {
      case "Completed":
      case "Resolved":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Pending":
      case "Open":
      case "In_Progress":
      case "Assigned":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Can't be done":
        return "bg-slate-200 text-slate-800 border-slate-400 font-medium";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6 space-y-6 sm:space-y-8 animate-fadeIn overflow-x-hidden">
      {/* Executive MLA & Ministerial Leadership Banner */}
      <div className="bg-gradient-to-r from-[#0B1A2C] via-[#122A44] to-[#0F2338] text-[#F5EFE0] p-5 sm:p-6 rounded-2xl border border-[#D4A24C]/40 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* MLA Identity & Photo */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <img
                src={activeMla.photoUrl}
                alt={activeMla.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#D4A24C] shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 text-base bg-[#071322] px-1.5 py-0.5 rounded-full border border-[#D4A24C]/50">
                {activeMla.partyEmoji}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#071322] text-[#D4A24C] border border-[#D4A24C]/40">
                  {activeMla.partyEmoji} {activeMla.partyName} ({activeMla.partyId})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#142B45] text-[#8E9CAE] border border-[#22405E]">
                  {activeMla.constituencyCode}
                </span>
                {activeMla.isMinister && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-[#D4A24C] text-[#0B1A2C] shadow-xs">
                    ★ Ministerial Office
                  </span>
                )}
              </div>

              <h1 className="font-display text-xl sm:text-2xl text-[#F5EFE0] font-normal">
                {activeMla.name}
              </h1>

              <div className="text-xs text-[#D8CFB8] font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span>{activeMla.constituency}, Andhra Pradesh</span>
              </div>

              <div className="text-xs text-[#D4A24C] font-semibold">
                {activeMla.role}
              </div>
            </div>
          </div>

          {/* Role Toggle Switch */}
          <div className="flex items-center self-start lg:self-center bg-[#071322] p-1.5 rounded-xl border border-[#22405E]">
            <button
              onClick={() => setActiveRole("manager")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeRole === "manager"
                  ? "bg-[#D4A24C] text-[#0B1A2C] shadow-md font-bold"
                  : "text-[#B9AF95] hover:text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>1. Manager Section</span>
            </button>
            <button
              onClick={() => setActiveRole("volunteer")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeRole === "volunteer"
                  ? "bg-[#D4A24C] text-[#0B1A2C] shadow-md font-bold"
                  : "text-[#B9AF95] hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>2. Volunteer Section</span>
            </button>
          </div>
        </div>

        {/* Ministerial Portfolios Strip (if Minister or MLA Department Focus) */}
        {activeMla.ministerialDepartments && activeMla.ministerialDepartments.length > 0 && (
          <div className="pt-3 border-t border-[#22405E]/60 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4A24C] flex items-center gap-1 flex-shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
              {activeMla.isMinister ? "Ministerial Portfolios:" : "Key Department Focus:"}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {activeMla.ministerialDepartments.map((dept, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-[#071322] border border-[#22405E] text-[11px] text-[#F5EFE0] font-medium"
                >
                  {dept}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          ROLE 2: VOLUNTEER SECTION (Submission Portal Only)
          ========================================================================= */}
      {activeRole === "volunteer" && (
        <div className="space-y-6 animate-fadeIn text-[#F5EFE0]">
          {/* Volunteer Not Logged In -> Designated Mobile Login Flow */}
          {!loggedVolunteer ? (
            <div className="max-w-xl mx-auto bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#071322] border border-[#D4A24C]/40 text-[#D4A24C] flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-6 h-6 text-[#D4A24C]" />
                </div>
                <h2 className="font-display text-2xl font-normal text-[#F5EFE0]">
                  Volunteer Field Access
                </h2>
                <p className="text-xs text-[#8E9CAE] max-w-sm mx-auto">
                  Enter your designated mobile number. Only authorized constituency volunteers are permitted to log in and submit grievances.
                </p>
              </div>

              {/* Sample Registered Numbers Notice for quick reference */}
              <div className="bg-[#071322] border border-[#22405E] rounded-xl p-3.5 text-xs text-[#8E9CAE] space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-[#D4A24C] text-[11px] uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5 text-[#D4A24C]" />
                  <span>Designated Authorized Numbers:</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                  {designatedVolunteers.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVolunteerMobileInput(v.mobile)}
                      className="px-2.5 py-1 bg-[#0B1A2C] border border-[#22405E] hover:border-[#D4A24C] rounded-lg text-[#F5EFE0] transition-colors"
                    >
                      {v.name}: <strong className="text-[#D4A24C]">{v.mobile}</strong>
                    </button>
                  ))}
                </div>
              </div>

              {volunteerAuthError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{volunteerAuthError}</span>
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider block">
                      Designated Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#8E9CAE] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9848012345 or 123456"
                        value={volunteerMobileInput}
                        onChange={(e) => setVolunteerMobileInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-sm font-mono text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] hover:brightness-110 text-[#0B1A2C] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Request Authentication OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>OTP sent to <strong>+91 {volunteerMobileInput}</strong></span>
                    </span>
                    <span className="font-mono font-bold bg-emerald-900/60 border border-emerald-700 text-emerald-200 px-2 py-0.5 rounded text-[11px]">
                      OTP: {simulatedOtp}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider block">
                      Enter 4-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-center text-lg tracking-widest font-mono text-[#D4A24C] focus:outline-none focus:border-[#D4A24C]"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-1/3 py-2.5 bg-[#071322] hover:bg-[#142B45] border border-[#22405E] text-[#8E9CAE] text-xs font-semibold rounded-xl transition-colors"
                    >
                      Change Number
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-2.5 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] hover:brightness-110 text-[#0B1A2C] text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>Verify & Enter Field Intake</span>
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Logged In Volunteer Intake Experience */
            <div className="space-y-6">
              {/* Volunteer Active Session Header */}
              <div className="bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#071322] border border-[#D4A24C]/40 text-[#D4A24C] flex items-center justify-center font-bold font-display text-lg">
                    {loggedVolunteer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#F5EFE0]">{loggedVolunteer.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#142B45] text-[#D4A24C] border border-[#D4A24C]/40">
                        Designated Field Volunteer
                      </span>
                    </div>
                    <div className="text-xs text-[#8E9CAE] flex items-center space-x-2 mt-0.5">
                      <span className="font-mono text-[#D8CFB8]">Mobile: +91 {loggedVolunteer.mobile}</span>
                      <span>·</span>
                      <span>{loggedVolunteer.constituency} ({loggedVolunteer.mandal})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowVolunteerReceiptList(!showVolunteerReceiptList)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#F5EFE0] bg-[#071322] border border-[#22405E] rounded-lg hover:border-[#D4A24C] transition-colors"
                  >
                    {showVolunteerReceiptList ? "Back to Intake Form" : "My Logged Receipts"}
                  </button>
                  <button
                    type="button"
                    onClick={handleVolunteerLogout}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800 rounded-lg hover:bg-rose-900/60 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>

              {/* Notice of Restrictions */}
              <div className="bg-[#071322] border border-[#22405E] rounded-xl p-3.5 text-xs text-[#D8CFB8] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-[#D4A24C] flex-shrink-0" />
                  <span>
                    <strong className="text-[#D4A24C]">Field Security Policy:</strong> Volunteers have submission clearance only. You can register citizen grievances and receive receipt IDs. Executive dashboards and editing of submitted tickets are restricted to Managers.
                  </span>
                </div>
              </div>

              {showVolunteerReceiptList ? (
                /* Volunteer's Personal Submitted Receipts Log */
                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="font-display text-xl font-normal text-[#F5EFE0]">
                    My Submitted Tickets ({grievances.filter((g) => g.submittedByVolunteer?.phone === loggedVolunteer.mobile).length})
                  </h3>
                  <div className="space-y-3">
                    {grievances
                      .filter((g) => g.submittedByVolunteer?.phone === loggedVolunteer.mobile)
                      .map((item) => (
                        <div key={item.id} className="p-4 rounded-xl border border-[#22405E] bg-[#071322] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs bg-[#142B45] text-[#D4A24C] border border-[#D4A24C]/40 px-2 py-0.5 rounded">
                                {item.ticketNumber}
                              </span>
                              <span className="text-xs font-semibold text-[#F5EFE0]">{item.citizenName} ({item.citizenType})</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#D8CFB8] line-clamp-1">{item.subject}</p>
                            <div className="text-[11px] text-[#8E9CAE]">
                              <span>{item.department} · {item.address?.townMandal}</span>
                              <span className="mx-1.5">·</span>
                              <span className="font-mono text-[#D8CFB8]">{item.submittedDate}</span>
                            </div>
                          </div>
                          <div className="text-right sm:border-l border-[#22405E] sm:pl-4 text-xs">
                            <span className="text-[10px] uppercase text-[#8E9CAE] font-bold block">Assigned PoC</span>
                            <span className="font-semibold text-[#F5EFE0] block">{item.assignee}</span>
                            <span className="font-mono text-[11px] text-[#D4A24C]">{item.assigneeContact}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                /* Volunteer 2-Section Intake Registration Form */
                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
                  <div className="border-b border-[#22405E] pb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] block">
                      Fast-Track Field Intake
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#F5EFE0]">
                      Log Citizen Grievance
                    </h2>
                    <p className="text-xs text-[#8E9CAE] mt-1">
                      Complete Personal Details and Issue Details. Assignee Point of Contact is auto-fetched directly from the central directory.
                    </p>
                  </div>

                  <form onSubmit={handleVolunteerSubmitTicket} className="space-y-8">
                    {/* =========================================
                        SECTION 1: PERSONAL DETAILS
                        ========================================= */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 border-b border-[#22405E] pb-2">
                        <span className="w-6 h-6 rounded-full bg-[#D4A24C] text-[#0B1A2C] flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                        <h3 className="font-display text-xl font-normal text-[#F5EFE0]">
                          Personal Details Section
                        </h3>
                      </div>

                      {/* Citizen Classification Option: Voter / Cadre / Leader */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider block">
                          Citizen Classification <span className="text-rose-400">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-3 max-w-md">
                          {(["Voter", "Cadre", "Leader"] as GrievanceCitizenType[]).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setCitizenType(type)}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                citizenType === type
                                  ? "bg-[#D4A24C] text-[#0B1A2C] border-[#D4A24C] shadow-md"
                                  : "bg-[#071322] border-[#22405E] text-[#8E9CAE] hover:text-[#F5EFE0] hover:border-[#D4A24C]/40"
                              }`}
                            >
                              {type === "Voter" ? "🗳️ Voter" : type === "Cadre" ? "🚩 Cadre" : "⭐ Leader"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                        {/* 1. Name */}
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider">
                            1. Citizen Name <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. K. Sudhakar Reddy"
                            value={citizenName}
                            onChange={(e) => setCitizenName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-xs text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                          />
                        </div>

                        {/* 2. Age */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider">
                            2. Age <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="number"
                            min="18"
                            max="110"
                            required
                            placeholder="e.g. 45"
                            value={citizenAge}
                            onChange={(e) => setCitizenAge(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-xs font-mono text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                          />
                        </div>

                        {/* 3. Gender */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider">
                            3. Gender <span className="text-rose-400">*</span>
                          </label>
                          <select
                            value={citizenGender}
                            onChange={(e) => setCitizenGender(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-xs text-[#F5EFE0] cursor-pointer focus:border-[#D4A24C]"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* 4. Mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider">
                            4. Citizen Mobile Number <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98480 12345"
                            value={citizenPhone}
                            onChange={(e) => setCitizenPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-xs font-mono text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                          />
                        </div>

                        {/* 5. Address - Door No */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider">
                            5. Address (D.No)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. D.No 14/231-A"
                            value={doorNo}
                            onChange={(e) => setDoorNo(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-xs text-[#F5EFE0] focus:border-[#D4A24C]"
                          />
                        </div>
                      </div>

                      {/* Address Hierarchy Sub-fields: Ward/Village, Town/Mandal, Assembly, Parliament, State */}
                      <div className="p-4 bg-[#071322] rounded-xl border border-[#22405E] space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                          Hierarchical Administrative Jurisdiction:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#8E9CAE]">Ward / Village</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Chinna Chowk"
                              value={wardVillage}
                              onChange={(e) => handleVillageChange(e.target.value)}
                              className="w-full px-3 py-2 bg-[#0B1A2C] border border-[#22405E] rounded-lg text-xs text-[#F5EFE0] focus:border-[#D4A24C]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#8E9CAE]">Town / Mandal</label>
                            <select
                              value={townMandal}
                              onChange={(e) => handleMandalChange(e.target.value)}
                              className="w-full px-3 py-2 bg-[#0B1A2C] border border-[#22405E] rounded-lg text-xs text-[#F5EFE0] cursor-pointer focus:border-[#D4A24C]"
                            >
                              {MANDALS_LIST.map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#8E9CAE]">Assembly</label>
                            <input
                              type="text"
                              value={assembly}
                              onChange={(e) => setAssembly(e.target.value)}
                              className="w-full px-3 py-2 bg-[#142B45] border border-[#22405E] rounded-lg text-xs font-semibold text-[#D4A24C]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#8E9CAE]">Parliament</label>
                            <input
                              type="text"
                              value={parliament}
                              onChange={(e) => setParliament(e.target.value)}
                              className="w-full px-3 py-2 bg-[#142B45] border border-[#22405E] rounded-lg text-xs font-semibold text-[#D4A24C]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#8E9CAE]">State</label>
                            <input
                              type="text"
                              value={stateName}
                              onChange={(e) => setStateName(e.target.value)}
                              className="w-full px-3 py-2 bg-[#142B45] border border-[#22405E] rounded-lg text-xs font-semibold text-[#D4A24C]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* =========================================
                        SECTION 2: ISSUE DETAILS
                        ========================================= */}
                    <div className="space-y-4 pt-4 border-t border-[#22405E]">
                      <div className="flex items-center space-x-2 border-b border-[#22405E] pb-2">
                        <span className="w-6 h-6 rounded-full bg-[#D4A24C] text-[#0B1A2C] flex items-center justify-center text-xs font-bold">
                          2
                        </span>
                        <h3 className="font-display text-xl font-normal text-[#F5EFE0]">
                          Issue Details Section
                        </h3>
                      </div>

                      {/* 1. Issue Subject */}
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider">
                          1. Issue Title / Subject <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Broken drinking water pipeline causing contamination on Street 4"
                          value={issueSubject}
                          onChange={(e) => setIssueSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-xs font-semibold text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 2. Department */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider">
                            2. Department <span className="text-rose-400">*</span>
                          </label>
                          <select
                            value={selectedDept}
                            onChange={(e) => handleDeptChange(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-xs font-semibold text-[#F5EFE0] cursor-pointer focus:border-[#D4A24C]"
                          >
                            {Object.keys(DEPARTMENT_CATEGORIES).map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Category */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider">
                            3. Category <span className="text-rose-400">*</span>
                          </label>
                          <select
                            value={selectedCat}
                            onChange={(e) => handleCatChange(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-xs text-[#F5EFE0] cursor-pointer focus:border-[#D4A24C]"
                          >
                            {(DEPARTMENT_CATEGORIES[selectedDept] || []).map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 4. Description */}
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider">
                          4. Description / Citizen Voice Transcript <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Provide full description of the grievance, affected households, background observations, and urgency notes..."
                          value={issueDescription}
                          onChange={(e) => setIssueDescription(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-xs text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 5. Location */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider">
                            5. Specific Location / Landmark <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Opposite Community Hall, Street 4, Chinna Chowk"
                            value={issueLocation}
                            onChange={(e) => setIssueLocation(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#071322] border border-[#22405E] rounded-xl text-xs text-[#F5EFE0] focus:border-[#D4A24C]"
                          />
                        </div>

                        {/* 6. Priority */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#8E9CAE] tracking-wider">
                            6. Priority (Urgency Level) <span className="text-rose-400">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["Low", "Medium", "High"] as GrievancePriority[]).map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setIssuePriority(p)}
                                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                                  issuePriority === p
                                    ? p === "High"
                                      ? "bg-rose-600 text-white border-rose-500 shadow-md"
                                      : p === "Medium"
                                      ? "bg-amber-600 text-white border-amber-500 shadow-md"
                                      : "bg-emerald-600 text-white border-emerald-500 shadow-md"
                                    : "bg-[#071322] border-[#22405E] text-[#8E9CAE] hover:text-[#F5EFE0]"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 7. Assignee (Auto-Fetched from Central Contact Database) */}
                      <div className="p-4 bg-[#071322] rounded-xl border border-emerald-800/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <label className="text-xs uppercase font-bold text-emerald-300 tracking-wider">
                              7. Assignee Point of Contact (Auto-Fetched Live)
                            </label>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                            ✓ Auto-Matched from Manager Directory
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#8E9CAE]">Assignee Officer Name</label>
                            <input
                              type="text"
                              value={assigneeName}
                              onChange={(e) => setAssigneeName(e.target.value)}
                              className="w-full px-3 py-2 bg-[#0B1A2C] border border-[#22405E] rounded-lg text-xs font-semibold text-[#F5EFE0]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#8E9CAE]">Official Designation</label>
                            <input
                              type="text"
                              value={assigneeDesignation}
                              onChange={(e) => setAssigneeDesignation(e.target.value)}
                              className="w-full px-3 py-2 bg-[#0B1A2C] border border-[#22405E] rounded-lg text-xs text-[#F5EFE0]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#8E9CAE]">Official Contact Phone</label>
                            <input
                              type="text"
                              value={assigneeContact}
                              onChange={(e) => setAssigneeContact(e.target.value)}
                              className="w-full px-3 py-2 bg-[#0B1A2C] border border-[#22405E] rounded-lg text-xs font-mono text-[#D4A24C]"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] text-emerald-400/80 pt-1">
                          Auto-linked based on Department: <strong className="text-emerald-300">{selectedDept}</strong> · Jurisdiction: <strong className="text-emerald-300">{townMandal}</strong>.
                        </div>
                      </div>
                    </div>

                    {/* Submit Action */}
                    <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#22405E]">
                      <button
                        type="submit"
                        className="px-8 py-3 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] hover:brightness-110 text-[#0B1A2C] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-[#0B1A2C]" />
                        <span>Submit Ticket (Generate ID)</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Ticket Registration Success Modal */}
          {submittedReceipt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-[#0B1A2C] border border-[#D4A24C]/40 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-[#F5EFE0]">
                <div className="text-center space-y-2 border-b border-[#22405E] pb-5">
                  <div className="w-14 h-14 rounded-full bg-emerald-950/40 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] block">
                    Submission Confirmed
                  </span>
                  <h3 className="font-display text-2xl font-normal text-[#F5EFE0]">
                    Ticket Registered Successfully
                  </h3>
                  <div className="pt-1">
                    <span className="px-4 py-1.5 bg-[#142B45] text-[#D4A24C] border border-[#D4A24C]/40 font-mono font-bold text-sm rounded-lg tracking-wider">
                      {submittedReceipt.ticketNumber}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-[#071322] p-4 rounded-xl border border-[#22405E]">
                  <div className="flex justify-between border-b border-[#22405E] pb-1.5">
                    <span className="text-[#8E9CAE]">Citizen Name:</span>
                    <strong className="text-[#F5EFE0]">{submittedReceipt.citizenName} ({submittedReceipt.citizenType})</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#22405E] pb-1.5">
                    <span className="text-[#8E9CAE]">Department:</span>
                    <strong className="text-[#F5EFE0]">{submittedReceipt.department}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#22405E] pb-1.5">
                    <span className="text-[#8E9CAE]">Priority:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(submittedReceipt.priority)}`}>
                      {submittedReceipt.priority} Priority
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#22405E] pb-1.5">
                    <span className="text-[#8E9CAE]">Assigned Officer:</span>
                    <strong className="text-[#F5EFE0]">{submittedReceipt.assignee}</strong>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-[#8E9CAE]">Initial Status:</span>
                    <span className="font-bold text-blue-400">Pending (Under Triage)</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedReceipt(null);
                      setShowVolunteerReceiptList(true);
                    }}
                    className="px-4 py-2.5 bg-[#071322] border border-[#22405E] text-xs font-semibold rounded-xl text-[#F5EFE0] hover:border-[#D4A24C] transition-colors"
                  >
                    View All My Receipts
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmittedReceipt(null)}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-xs font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer"
                  >
                    Log Another Grievance
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ROLE 1: MANAGER SECTION (Executive Command Center & Full Control)
          ========================================================================= */}
      {activeRole === "manager" && (
        <div className="space-y-8 animate-fadeIn text-[#F5EFE0]">
          {/* Manager Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#22405E] pb-4">
            <div className="flex items-center space-x-2 bg-[#071322] p-1.5 rounded-xl border border-[#22405E] overflow-x-auto">
              <button
                onClick={() => setManagerTab("overview")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  managerTab === "overview"
                    ? "bg-[#D4A24C] text-[#071322] font-bold shadow-md"
                    : "text-[#B9AF95] hover:text-white hover:bg-[#142B45]/50"
                }`}
              >
                1. KPI Overview & Analytics
              </button>
              <button
                onClick={() => setManagerTab("tickets")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  managerTab === "tickets"
                    ? "bg-[#D4A24C] text-[#071322] font-bold shadow-md"
                    : "text-[#B9AF95] hover:text-white hover:bg-[#142B45]/50"
                }`}
              >
                2. Master Ticket Explorer ({grievances.length})
              </button>
              <button
                onClick={() => setManagerTab("contacts")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  managerTab === "contacts"
                    ? "bg-[#D4A24C] text-[#071322] font-bold shadow-md"
                    : "text-[#B9AF95] hover:text-white hover:bg-[#142B45]/50"
                }`}
              >
                3. Contact Database ({contacts.length} PoCs)
              </button>
              <button
                onClick={() => setManagerTab("volunteers")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  managerTab === "volunteers"
                    ? "bg-[#D4A24C] text-[#071322] font-bold shadow-md"
                    : "text-[#B9AF95] hover:text-white hover:bg-[#142B45]/50"
                }`}
              >
                4. Volunteer Whitelist Access ({designatedVolunteers.length})
              </button>
            </div>

            <button
              onClick={() => {
                setActiveRole("volunteer");
                setLoggedVolunteer(designatedVolunteers[0]);
              }}
              className="inline-flex items-center px-4 py-2.5 bg-[#142B45] border border-[#D4A24C]/40 hover:bg-[#D4A24C] hover:text-[#0B1A2C] rounded-xl text-xs font-bold text-[#D4A24C] transition-all shadow-md cursor-pointer"
            >
              <Smartphone className="w-4 h-4 mr-1.5 text-[#D4A24C] group-hover:text-[#0B1A2C]" />
              <span>Test Field Volunteer Submission Form →</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {managerTab === "overview" && (
            <div className="space-y-8 animate-fadeIn">
              {/* 8 Essential Executive KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {/* 1. Total Logged Tickets */}
                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors col-span-2 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9CAE] block">
                    1. Total Logged Tickets
                  </span>
                  <div className="font-display text-3xl font-bold text-[#F5EFE0] mt-1 font-mono">
                    {totalTickets}
                  </div>
                  <span className="text-[11px] text-[#8E9CAE] mt-1 block">
                    Constituency-Wide Intake
                  </span>
                </div>

                {/* 2. Priority: High */}
                <div className="bg-[#0B1A2C] border border-rose-900/50 bg-rose-950/20 rounded-xl p-4 shadow-sm hover:border-rose-500/50 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block">
                    High Priority
                  </span>
                  <div className="font-display text-2xl font-bold text-rose-400 mt-1 font-mono">
                    {highPriorityCount}
                  </div>
                  <span className="text-[10px] text-rose-400 mt-0.5 block font-semibold">
                    Fast-Track Escalation
                  </span>
                </div>

                {/* 3. Priority: Medium */}
                <div className="bg-[#0B1A2C] border border-amber-900/50 bg-amber-950/20 rounded-xl p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                    Medium Priority
                  </span>
                  <div className="font-display text-2xl font-bold text-amber-400 mt-1 font-mono">
                    {mediumPriorityCount}
                  </div>
                  <span className="text-[10px] text-amber-400 mt-0.5 block font-semibold">
                    Standard 24h SLA
                  </span>
                </div>

                {/* 4. Priority: Low */}
                <div className="bg-[#0B1A2C] border border-emerald-900/50 bg-emerald-950/20 rounded-xl p-4 shadow-sm hover:border-emerald-500/50 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Low Priority
                  </span>
                  <div className="font-display text-2xl font-bold text-emerald-400 mt-1 font-mono">
                    {lowPriorityCount}
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-0.5 block font-semibold">
                    Scheduled Works
                  </span>
                </div>

                {/* 5. Completed Tickets */}
                <div className="bg-[#0B1A2C] border border-emerald-800/60 rounded-xl p-4 shadow-sm hover:border-emerald-400/60 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    6. Completed
                  </span>
                  <div className="font-display text-2xl font-bold text-emerald-400 mt-1 font-mono">
                    {completedCount}
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-0.5 block font-semibold">
                    {((completedCount / (totalTickets || 1)) * 100).toFixed(1)}% Resolution
                  </span>
                </div>

                {/* 6. Pending Tickets */}
                <div className="bg-[#0B1A2C] border border-blue-800/60 rounded-xl p-4 shadow-sm hover:border-blue-400/60 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">
                    7. Pending
                  </span>
                  <div className="font-display text-2xl font-bold text-blue-400 mt-1 font-mono">
                    {pendingCount}
                  </div>
                  <span className="text-[10px] text-blue-400 mt-0.5 block font-semibold">
                    In Field Triage
                  </span>
                </div>

                {/* 7. Can't be done */}
                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-xl p-4 shadow-sm hover:border-[#D4A24C]/40 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    8. Can't Be Done
                  </span>
                  <div className="font-display text-2xl font-bold text-slate-300 mt-1 font-mono">
                    {cantBeDoneCount}
                  </div>
                  <span className="text-[10px] text-[#8E9CAE] mt-0.5 block font-medium">
                    Policy Restricted
                  </span>
                </div>
              </div>

              {/* Volunteer Activity & Time-Series Intake Analytics */}
              <div className="bg-gradient-to-r from-[#0B1A2C] via-[#122A44] to-[#0F2338] border border-[#22405E] rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22405E] pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] block">
                      Volunteer Filing Performance
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-normal text-[#F5EFE0]">
                      Volunteer Activity: Daily, Weekly & Monthly Breakdown
                    </h3>
                    <p className="text-xs text-[#8E9CAE]">
                      Track which volunteers have filed citizen requests across day, week, and monthly intervals.
                    </p>
                  </div>
                </div>

                {/* Volunteer Metrics Table */}
                <div className="overflow-x-auto rounded-xl border border-[#22405E]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#22405E] bg-[#071322] text-[#8E9CAE] uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-3.5 px-4">Volunteer Name</th>
                        <th className="py-3.5 px-4">Designated Mobile</th>
                        <th className="py-3.5 px-4">Assigned Mandal</th>
                        <th className="py-3.5 px-4 text-center bg-blue-950/40 text-blue-300">Today (Day)</th>
                        <th className="py-3.5 px-4 text-center bg-indigo-950/40 text-indigo-300">This Week</th>
                        <th className="py-3.5 px-4 text-center bg-amber-950/40 text-amber-300">This Month</th>
                        <th className="py-3.5 px-4 text-center bg-[#142B45] text-[#D4A24C]">Total Filed</th>
                        <th className="py-3.5 px-4 text-center text-emerald-400">Resolved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#22405E]/40">
                      {volunteerAnalytics.map((v) => (
                        <tr key={v.id} className="hover:bg-[#142B45]/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#F5EFE0] flex items-center space-x-2.5">
                            <span className="w-7 h-7 rounded-full bg-[#D4A24C] text-[#0B1A2C] flex items-center justify-center text-[10px] font-bold shadow-xs">
                              {v.name.charAt(0)}
                            </span>
                            <span>{v.name}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#D8CFB8]">+91 {v.mobile}</td>
                          <td className="py-3 px-4 text-[#D8CFB8]">{v.mandal}</td>
                          <td className="py-3 px-4 text-center font-bold font-mono bg-blue-950/20 text-blue-400">
                            {v.dayCount}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono bg-indigo-950/20 text-indigo-400">
                            {v.weekCount}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono bg-amber-950/20 text-amber-400">
                            {v.monthCount}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-sm bg-[#142B45]/40 text-[#D4A24C]">
                            {v.totalFiled}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-emerald-400">
                            {v.resolvedCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Two-Column Analytics: 3. Department Wise & 4. Area Wise */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 3. Department Wise Issues */}
                <div className="lg:col-span-6 bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#22405E] pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                        Pillar 3
                      </span>
                      <h4 className="font-display text-lg font-normal text-[#F5EFE0]">
                        3. Department Wise Issues
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-[#8E9CAE]">
                      {Object.keys(departmentCounts).length} Departments
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {Object.entries(departmentCounts).map(([dept, count]) => {
                      const pct = ((count / (totalTickets || 1)) * 100).toFixed(0);
                      return (
                        <div key={dept} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#F5EFE0]">{dept}</span>
                            <span className="font-mono text-[#8E9CAE]">
                              <strong className="text-[#D4A24C]">{count}</strong> tickets ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#071322] border border-[#22405E] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#D4A24C] to-[#E07A1F] rounded-full transition-all"
                              style={{ width: `${Math.max(Number(pct), 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Area Wise Issues */}
                <div className="lg:col-span-6 bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#22405E] pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                        Pillar 4
                      </span>
                      <h4 className="font-display text-lg font-normal text-[#F5EFE0]">
                        4. Area Wise Issues (Mandals & Wards)
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-[#8E9CAE]">
                      {activeMla.constituency}
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {Object.entries(mandalCounts).map(([mandal, count]) => {
                      const pct = ((count / (totalTickets || 1)) * 100).toFixed(0);
                      return (
                        <div key={mandal} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#F5EFE0]">{mandal}</span>
                            <span className="font-mono text-[#8E9CAE]">
                              <strong className="text-blue-400">{count}</strong> tickets ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#071322] border border-[#22405E] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                              style={{ width: `${Math.max(Number(pct), 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Demographics Strip: Gender & Classification Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-5 shadow-xl space-y-3">
                  <h4 className="font-display text-base font-normal text-[#F5EFE0]">
                    Citizen Gender Intake Ratio
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-[#071322] rounded-xl border border-[#22405E]">
                      <span className="text-[10px] uppercase font-bold text-[#8E9CAE] block">Male</span>
                      <div className="font-display text-xl font-bold text-blue-400 mt-1 font-mono">{genderStats.Male}</div>
                      <span className="text-[10px] text-[#8E9CAE]">{((genderStats.Male / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="p-3 bg-[#071322] rounded-xl border border-[#22405E]">
                      <span className="text-[10px] uppercase font-bold text-[#8E9CAE] block">Female</span>
                      <div className="font-display text-xl font-bold text-rose-400 mt-1 font-mono">{genderStats.Female}</div>
                      <span className="text-[10px] text-[#8E9CAE]">{((genderStats.Female / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="p-3 bg-[#071322] rounded-xl border border-[#22405E]">
                      <span className="text-[10px] uppercase font-bold text-[#8E9CAE] block">Other</span>
                      <div className="font-display text-xl font-bold text-amber-400 mt-1 font-mono">{genderStats.Other}</div>
                      <span className="text-[10px] text-[#8E9CAE]">{((genderStats.Other / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-5 shadow-xl space-y-3">
                  <h4 className="font-display text-base font-normal text-[#F5EFE0]">
                    Citizen Type Distribution
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-[#071322] rounded-xl border border-[#22405E]">
                      <span className="text-[10px] uppercase font-bold text-[#8E9CAE] block">🗳️ Voter</span>
                      <div className="font-display text-xl font-bold text-emerald-400 mt-1 font-mono">{citizenTypeStats.Voter}</div>
                      <span className="text-[10px] text-[#8E9CAE]">{((citizenTypeStats.Voter / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="p-3 bg-[#071322] rounded-xl border border-[#22405E]">
                      <span className="text-[10px] uppercase font-bold text-[#8E9CAE] block">🚩 Cadre</span>
                      <div className="font-display text-xl font-bold text-[#D4A24C] mt-1 font-mono">{citizenTypeStats.Cadre}</div>
                      <span className="text-[10px] text-[#8E9CAE]">{((citizenTypeStats.Cadre / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="p-3 bg-[#071322] rounded-xl border border-[#22405E]">
                      <span className="text-[10px] uppercase font-bold text-[#8E9CAE] block">⭐ Leader</span>
                      <div className="font-display text-xl font-bold text-purple-400 mt-1 font-mono">{citizenTypeStats.Leader}</div>
                      <span className="text-[10px] text-[#8E9CAE]">{((citizenTypeStats.Leader / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Ticket Assigned Persons Workload */}
              <div className="bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#22405E] pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                      Pillar 5
                    </span>
                    <h4 className="font-display text-lg font-normal text-[#F5EFE0]">
                      5. Ticket Assigned Persons & Officers Workload
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assigneeStats.map((a) => (
                    <div key={a.name} className="p-3.5 bg-[#071322] border border-[#22405E] rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs text-[#F5EFE0] block">{a.name}</span>
                        <span className="text-[10px] text-[#8E9CAE] block">{a.designation}</span>
                        <span className="font-mono text-[10px] text-[#D4A24C]">{a.contact}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-display font-bold text-[#F5EFE0] font-mono">{a.count}</span>
                        <span className="text-[9px] uppercase font-bold text-[#8E9CAE] block">Active Tickets</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER TICKET EXPLORER & DETAIL INSPECTOR */}
          {managerTab === "tickets" && (
            <div className="space-y-6 animate-fadeIn text-[#F5EFE0]">
              {/* Filter Bar */}
              <div className="bg-[#0F2338] border border-[#22405E] rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-[#8E9CAE] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ticket #, citizen name, phone, issue, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl focus:outline-none focus:border-[#D4A24C]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {/* Priority Filter */}
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer focus:border-[#D4A24C]"
                  >
                    <option value="All">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer focus:border-[#D4A24C]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Can't be done">Can't be done</option>
                  </select>

                  {/* Department Filter */}
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer focus:border-[#D4A24C]"
                  >
                    <option value="All">All Departments</option>
                    {Object.keys(DEPARTMENT_CATEGORIES).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Master-Detail Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Ticket List (Left 5 Cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#8E9CAE] px-1">
                    <span>Grievance Inflow ({filteredGrievances.length})</span>
                    <span className="font-mono text-[11px] text-[#D4A24C]">Live Redressal Stream</span>
                  </div>

                  <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                    {filteredGrievances.map((item) => {
                      const isSelected = activeTicket?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setActiveTicket(item)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#142B45] border-2 border-[#D4A24C] shadow-lg"
                              : "bg-[#0B1A2C] border-[#22405E] hover:border-[#D4A24C]/60"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-mono font-bold text-[#D4A24C]">
                              {item.ticketNumber}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(item.priority)}`}>
                                {item.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                                {item.status}
                              </span>
                            </div>
                          </div>

                          <h4 className="text-xs sm:text-sm font-semibold text-[#F5EFE0] line-clamp-1">
                            {item.subject}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-[#8E9CAE] mt-2 pt-2 border-t border-[#22405E]/60">
                            <span>{item.citizenName} ({item.citizenType})</span>
                            <span className="font-mono text-[#D8CFB8]">{item.submittedDate}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Detail Inspector (Right 7 Cols) */}
                <div className="lg:col-span-7">
                  {activeTicket ? (
                    <div className="bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-6 shadow-xl space-y-6">
                      {/* Ticket Header & Status Management Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22405E] pb-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#142B45] text-[#D4A24C] border border-[#D4A24C]/40 rounded">
                              {activeTicket.ticketNumber}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(activeTicket.priority)}`}>
                              {activeTicket.priority} Priority
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(activeTicket.status)}`}>
                              {activeTicket.status}
                            </span>
                          </div>
                          <h3 className="font-display text-xl sm:text-2xl font-normal text-[#F5EFE0] mt-2">
                            {activeTicket.subject}
                          </h3>
                        </div>

                        {/* Status Change Dropdown / Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateTicketStatus(activeTicket.id, "Completed")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center cursor-pointer ${
                              activeTicket.status === "Completed"
                                ? "bg-emerald-600 text-white font-bold shadow-sm"
                                : "bg-emerald-950/40 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Completed
                          </button>
                          <button
                            onClick={() => handleUpdateTicketStatus(activeTicket.id, "Pending")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center cursor-pointer ${
                              activeTicket.status === "Pending"
                                ? "bg-blue-600 text-white font-bold shadow-sm"
                                : "bg-blue-950/40 text-blue-300 border border-blue-800 hover:bg-blue-900/60"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Pending
                          </button>
                          <button
                            onClick={() => handleUpdateTicketStatus(activeTicket.id, "Can't be done")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center cursor-pointer ${
                              activeTicket.status === "Can't be done"
                                ? "bg-slate-700 text-white font-bold shadow-sm"
                                : "bg-slate-800/40 text-slate-300 border border-slate-700 hover:bg-slate-700/60"
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Can't be done
                          </button>
                        </div>
                      </div>

                      {/* Citizen Personal Details Section */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                          1. Citizen Personal Profile & Classification
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#071322] rounded-xl border border-[#22405E] text-xs">
                          <div>
                            <span className="text-[10px] uppercase text-[#8E9CAE] font-bold block">Citizen Name</span>
                            <span className="font-semibold text-[#F5EFE0]">{activeTicket.citizenName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#8E9CAE] font-bold block">Option / Type</span>
                            <span className="font-bold text-[#D4A24C]">{activeTicket.citizenType}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#8E9CAE] font-bold block">Age & Gender</span>
                            <span className="text-[#F5EFE0]">{activeTicket.citizenAge} yrs · {activeTicket.citizenGender}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#8E9CAE] font-bold block">Mobile</span>
                            <span className="font-mono text-[#D8CFB8]">{activeTicket.citizenPhone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Address Hierarchy Breakdown */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                          Citizen Address Details
                        </span>
                        <div className="p-3.5 bg-[#071322] rounded-xl border border-[#22405E] text-xs space-y-1.5">
                          <div className="flex items-center space-x-2 text-[#F5EFE0]">
                            <MapPin className="w-4 h-4 text-[#D4A24C] flex-shrink-0" />
                            <span className="font-semibold text-[#D8CFB8]">
                              {activeTicket.address?.doorNo ? `${activeTicket.address.doorNo}, ` : ""}
                              {activeTicket.address?.wardVillage}, {activeTicket.address?.townMandal}, {activeTicket.address?.assembly}, {activeTicket.address?.parliament}, {activeTicket.address?.state}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Issue Description */}
                      <div className="space-y-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C]">
                          2. Issue Description & Location
                        </span>
                        <div className="p-4 bg-[#071322] rounded-xl border border-[#22405E] space-y-2">
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8E9CAE] border-b border-[#22405E] pb-2">
                            <span>Department: <strong className="text-[#F5EFE0]">{activeTicket.department}</strong></span>
                            <span>·</span>
                            <span>Category: <strong className="text-[#F5EFE0]">{activeTicket.category}</strong></span>
                            <span>·</span>
                            <span>Location: <strong className="text-[#F5EFE0]">{activeTicket.location}</strong></span>
                          </div>
                          <p className="text-[#D8CFB8] leading-relaxed pt-1">
                            {activeTicket.description}
                          </p>
                        </div>
                      </div>

                      {/* Assignee Information & Reassignment Option */}
                      <div className="p-4 bg-[#071322] rounded-xl border border-[#22405E] space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                              Assigned Officer / PoC
                            </span>
                            <span className="font-bold text-sm text-[#F5EFE0]">{activeTicket.assignee}</span>
                            <span className="text-xs text-[#8E9CAE] block">{activeTicket.assigneeDesignation} · {activeTicket.assigneeContact}</span>
                          </div>

                          {/* Reassign dropdown & WhatsApp Action */}
                          <div className="flex flex-col items-end gap-2">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-[#8E9CAE] block mb-1 text-right">Reassign PoC</label>
                              <select
                                onChange={(e) => {
                                  const selected = contacts.find((c) => c.id === e.target.value);
                                  if (selected) handleReassignTicket(activeTicket.id, selected);
                                }}
                                className="bg-[#0B1A2C] border border-[#22405E] text-[#F5EFE0] rounded-lg px-2.5 py-1 text-xs cursor-pointer focus:border-[#D4A24C]"
                              >
                                <option value="">Choose new PoC...</option>
                                {contacts.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.pocName} ({c.department} - {c.mandal})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const converted: FieldIssue = {
                                  id: activeTicket.id,
                                  title: activeTicket.subject || `Grievance Petition #${activeTicket.id}`,
                                  description: activeTicket.description || activeTicket.subject || "",
                                  category: activeTicket.category || "General Grievance",
                                  department: activeTicket.department || activeTicket.category || "Panchayat Raj",
                                  priority: (activeTicket.priority?.toUpperCase() as any) || "HIGH",
                                  status: (activeTicket.status?.toUpperCase() as any) || "NEW",
                                  issueType: "GRIEVANCE",
                                  stateId: "AP",
                                  assemblyConstituencyId: "BNG-AC",
                                  mandalId: "MDL-BNG-TWN",
                                  mandalName: activeTicket.address?.townMandal || "Banaganapalle Mandal",
                                  villageId: "VIL-BNG-TWN-01",
                                  villageName: activeTicket.address?.wardVillage || "Banaganapalle Town",
                                  reportedBy: activeTicket.citizenName || "Citizen Petitioner",
                                  reporterPhone: activeTicket.citizenPhone || "+91 98850 00000",
                                  assignedOfficialName: activeTicket.assignee,
                                  assignedOfficialPhone: activeTicket.assigneeContact,
                                  reportedDate: activeTicket.submittedDate || new Date().toISOString().split("T")[0],
                                  attachments: [],
                                  createdBy: activeTicket.submittedByVolunteer?.name || "Volunteer",
                                  createdByRole: "VOLUNTEER",
                                  createdAt: activeTicket.timestamp || new Date().toISOString(),
                                  updatedAt: new Date().toISOString()
                                };
                                setAssignModalIssue(converted);
                              }}
                              className="py-1 px-2.5 rounded-lg bg-[#4A3D22] hover:bg-[#5E4D2B] text-[#F5EFE0] text-[11px] font-bold border border-[#D4A24C]/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                              Assign & Notify on WhatsApp
                            </button>
                          </div>
                        </div>

                        {/* Volunteer Submitter Tag */}
                        <div className="pt-2 border-t border-[#22405E] flex items-center justify-between text-[11px] text-[#8E9CAE]">
                          <span>Logged by Volunteer: <strong className="text-[#D4A24C]">{activeTicket.submittedByVolunteer?.name}</strong> (+91 {activeTicket.submittedByVolunteer?.phone})</span>
                          <span className="font-mono text-[#D8CFB8]">{activeTicket.submittedDate}</span>
                        </div>
                      </div>

                      {/* Liaison Notes & Action Trail */}
                      <div className="space-y-3 pt-2 border-t border-[#22405E] text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
                          Field Liaison Resolution Log & Notes
                        </span>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {activeTicket.notes.map((note, idx) => (
                            <div key={idx} className="flex items-start space-x-2 text-xs text-[#D8CFB8] bg-[#071322] p-2.5 rounded-lg border border-[#22405E]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A24C] mt-1.5 flex-shrink-0" />
                              <span>{note}</span>
                            </div>
                          ))}
                        </div>

                        {/* Add Note Input */}
                        <div className="flex items-center space-x-2 pt-2">
                          <input
                            type="text"
                            placeholder="Add official resolution update or citizen callback note..."
                            value={resolutionNoteInput}
                            onChange={(e) => setResolutionNoteInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddResolutionNote(activeTicket.id)}
                            className="flex-1 px-3 py-2 text-xs bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-lg focus:outline-none focus:border-[#D4A24C]"
                          />
                          <button
                            onClick={() => handleAddResolutionNote(activeTicket.id)}
                            className="px-3.5 py-2 bg-[#D4A24C] text-[#0B1A2C] text-xs font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-12 text-center text-xs text-[#8E9CAE]">
                      Select a grievance ticket to inspect details and assign field officers.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT DATABASE (POINT OF CONTACTS DIRECTORY) */}
          {managerTab === "contacts" && (
            <div className="bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn text-[#F5EFE0]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22405E] pb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] block">
                    Central PoC Registry
                  </span>
                  <h3 className="font-display text-2xl font-normal text-[#F5EFE0]">
                    Constituency Contact Database
                  </h3>
                  <p className="text-xs text-[#8E9CAE] mt-0.5">
                    Department, category, village, mandal, and assembly level point of contacts. Field volunteers automatically fetch these contacts during grievance intake.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddContactModalOpen(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-xs font-bold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add New Contact PoC
                </button>
              </div>

              {/* Contacts Table */}
              <div className="overflow-x-auto rounded-xl border border-[#22405E]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#22405E] bg-[#071322] text-[#8E9CAE] uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3.5 px-4">Officer / PoC Name</th>
                      <th className="py-3.5 px-4">Department & Category</th>
                      <th className="py-3.5 px-4">Jurisdiction (Village/Mandal/Assembly)</th>
                      <th className="py-3.5 px-4">Designation</th>
                      <th className="py-3.5 px-4">Phone & Email</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22405E]/40">
                    {contacts.map((c) => (
                      <tr key={c.id} className="hover:bg-[#142B45]/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#F5EFE0]">
                          {c.pocName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#142B45] text-[#D4A24C] border border-[#D4A24C]/40 block w-fit">
                            {c.department}
                          </span>
                          <span className="text-[11px] text-[#8E9CAE] mt-0.5 block">{c.category}</span>
                        </td>
                        <td className="py-3 px-4 text-[#D8CFB8]">
                          <span className="font-semibold text-[#F5EFE0]">{c.village}</span>, {c.mandal} ({c.assembly})
                        </td>
                        <td className="py-3 px-4 text-[#8E9CAE]">{c.designation}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[#D4A24C] font-semibold block">{c.phone}</span>
                          <span className="text-[10px] text-[#8E9CAE]">{c.email}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/40 cursor-pointer"
                            title="Delete Contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Contact Modal */}
              {isAddContactModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                  <div className="bg-[#0B1A2C] border border-[#D4A24C]/40 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 text-[#F5EFE0]">
                    <div className="flex items-center justify-between border-b border-[#22405E] pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C]">
                          Directory Entry
                        </span>
                        <h3 className="font-display text-2xl font-normal text-[#F5EFE0]">
                          Add New Point of Contact
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsAddContactModalOpen(false)}
                        className="text-xs font-bold text-[#8E9CAE] hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddContact} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Officer / PoC Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. M. Ramesh (Irrigation Liaison)"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl focus:border-[#D4A24C]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Department</label>
                          <select
                            value={newContactDept}
                            onChange={(e) => {
                              setNewContactDept(e.target.value);
                              setNewContactCat(DEPARTMENT_CATEGORIES[e.target.value]?.[0] || "");
                            }}
                            className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl cursor-pointer focus:border-[#D4A24C]"
                          >
                            {Object.keys(DEPARTMENT_CATEGORIES).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Category</label>
                          <select
                            value={newContactCat}
                            onChange={(e) => setNewContactCat(e.target.value)}
                            className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl cursor-pointer focus:border-[#D4A24C]"
                          >
                            {(DEPARTMENT_CATEGORIES[newContactDept] || []).map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Village / Ward</label>
                          <input
                            type="text"
                            placeholder="e.g. Chinna Chowk"
                            value={newContactVillage}
                            onChange={(e) => setNewContactVillage(e.target.value)}
                            className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl focus:border-[#D4A24C]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Mandal</label>
                          <select
                            value={newContactMandal}
                            onChange={(e) => setNewContactMandal(e.target.value)}
                            className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl cursor-pointer focus:border-[#D4A24C]"
                          >
                            {MANDALS_LIST.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Assembly</label>
                          <input
                            type="text"
                            value={newContactAssembly}
                            onChange={(e) => setNewContactAssembly(e.target.value)}
                            className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl focus:border-[#D4A24C]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Official Designation</label>
                          <input
                            type="text"
                            placeholder="e.g. Executive Engineer Water Works"
                            value={newContactDesignation}
                            onChange={(e) => setNewContactDesignation(e.target.value)}
                            className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl focus:border-[#D4A24C]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Official Phone</label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 94408 11223"
                            value={newContactPhone}
                            onChange={(e) => setNewContactPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl font-mono focus:border-[#D4A24C]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Email</label>
                        <input
                          type="email"
                          placeholder="poc@kadapa.gov.in"
                          value={newContactEmail}
                          onChange={(e) => setNewContactEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl focus:border-[#D4A24C]"
                        />
                      </div>

                      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#22405E]">
                        <button
                          type="button"
                          onClick={() => setIsAddContactModalOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-[#8E9CAE] hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-xs font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer"
                        >
                          Save Contact PoC
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VOLUNTEER WHITELIST & ACCESS MANAGEMENT */}
          {managerTab === "volunteers" && (
            <div className="bg-[#0B1A2C] border border-[#22405E] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn text-[#F5EFE0]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22405E] pb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] block">
                    Access Control Registry
                  </span>
                  <h3 className="font-display text-2xl font-normal text-[#F5EFE0]">
                    Designated Volunteer Mobile Whitelist
                  </h3>
                  <p className="text-xs text-[#8E9CAE] mt-0.5">
                    Only these designated mobile numbers can receive OTP authentication and file grievances for this constituency.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddVolunteerModalOpen(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-xs font-bold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Designated Volunteer
                </button>
              </div>

              {/* Volunteers Table */}
              <div className="overflow-x-auto rounded-xl border border-[#22405E]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#22405E] bg-[#071322] text-[#8E9CAE] uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3.5 px-4">Volunteer Name</th>
                      <th className="py-3.5 px-4">Designated Mobile (OTP Whitelist)</th>
                      <th className="py-3.5 px-4">Assigned Constituency</th>
                      <th className="py-3.5 px-4">Mandal Assignment</th>
                      <th className="py-3.5 px-4">Access Status</th>
                      <th className="py-3.5 px-4 text-right">Toggle Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22405E]/40">
                    {designatedVolunteers.map((v) => (
                      <tr key={v.id} className="hover:bg-[#142B45]/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#F5EFE0]">
                          {v.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm font-bold text-[#D4A24C]">
                          +91 {v.mobile}
                        </td>
                        <td className="py-3 px-4 text-[#D8CFB8]">{v.constituency}</td>
                        <td className="py-3 px-4 text-[#D8CFB8]">{v.mandal}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              v.active
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                                : "bg-rose-950/40 text-rose-400 border-rose-800"
                            }`}
                          >
                            {v.active ? "Authorized Active" : "Suspended"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleVolunteerStatus(v.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#22405E] bg-[#071322] text-[#F5EFE0] hover:border-[#D4A24C] transition-colors cursor-pointer"
                          >
                            {v.active ? "Revoke Access" : "Grant Access"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Volunteer Modal */}
              {isAddVolunteerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                  <div className="bg-[#0B1A2C] border border-[#D4A24C]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#F5EFE0]">
                    <div className="flex items-center justify-between border-b border-[#22405E] pb-3">
                      <h3 className="font-display text-xl font-normal text-[#F5EFE0]">
                        Add Designated Volunteer
                      </h3>
                      <button
                        onClick={() => setIsAddVolunteerModalOpen(false)}
                        className="text-xs font-bold text-[#8E9CAE] hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddVolunteer} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Volunteer Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. M. Chenna Kesavulu"
                          value={newVolName}
                          onChange={(e) => setNewVolName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl focus:border-[#D4A24C]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Designated Mobile Number</label>
                        <input
                          type="tel"
                          required
                          placeholder="9848012345"
                          value={newVolMobile}
                          onChange={(e) => setNewVolMobile(e.target.value)}
                          className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl font-mono focus:border-[#D4A24C]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#8E9CAE]">Assigned Mandal</label>
                        <select
                          value={newVolMandal}
                          onChange={(e) => setNewVolMandal(e.target.value)}
                          className="w-full px-3 py-2 bg-[#071322] border border-[#22405E] text-[#F5EFE0] rounded-xl cursor-pointer focus:border-[#D4A24C]"
                        >
                          {MANDALS_LIST.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#22405E]">
                        <button
                          type="button"
                          onClick={() => setIsAddVolunteerModalOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-[#8E9CAE] hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#0B1A2C] text-xs font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer"
                        >
                          Authorize Volunteer
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Assign Complaint & WhatsApp Modal */}
      {assignModalIssue && (
        <AssignComplaintModal
          isOpen={!!assignModalIssue}
          issue={assignModalIssue}
          onClose={() => setAssignModalIssue(null)}
          onConfirmAssign={(issueId, deptName, officialName, officialPhone) => {
            if (activeTicket && activeTicket.id === issueId) {
              setActiveTicket((prev) =>
                prev
                  ? {
                      ...prev,
                      department: deptName,
                      assignee: officialName || prev.assignee,
                      assigneeContact: officialPhone || prev.assigneeContact,
                      status: "Assigned"
                    }
                  : null
              );
            }
          }}
        />
      )}
    </div>
  );
};

