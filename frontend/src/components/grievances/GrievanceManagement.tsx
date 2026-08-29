import React, { useState, useMemo } from "react";
import {
  GrievanceItem,
  GrievanceContact,
  DesignatedVolunteer,
  GrievancePriority,
  GrievanceStatus,
  GrievanceCitizenType
} from "../../types";
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
  Info
} from "lucide-react";

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
  "Kadapa Urban",
  "Kadapa Rural",
  "Chinthakommadinne",
  "Pendlimarri",
  "Kamalapuram",
  "Vallur"
];

export const GrievanceManagement: React.FC = () => {
  // Global Active Role: Manager vs Volunteer
  const [activeRole, setActiveRole] = useState<"manager" | "volunteer">("manager");

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
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Top Banner: Role Selection Ribbon */}
      <div className="bg-[#0B1A2C] text-[#F5EFE0] p-4 sm:p-5 rounded-2xl border border-[#D4A24C]/30 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#142B45] border border-[#D4A24C]/40 flex items-center justify-center text-[#D4A24C]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C]">
                Platform Pillar 2 · Constituency Grievance Command
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#142B45] text-[#D4A24C] border border-[#D4A24C]/30 font-mono-data">
                Kadapa AC
              </span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl text-white font-normal mt-0.5">
              Grievance Intelligence & Resolution
            </h1>
          </div>
        </div>

        {/* Role Toggle Switch */}
        <div className="flex items-center bg-[#071322] p-1.5 rounded-xl border border-[#22405E]">
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

      {/* =========================================================================
          ROLE 2: VOLUNTEER SECTION (Submission Portal Only)
          ========================================================================= */}
      {activeRole === "volunteer" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Volunteer Not Logged In -> Designated Mobile Login Flow */}
          {!loggedVolunteer ? (
            <div className="max-w-xl mx-auto bg-white border border-[#E0DED5] rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-[#D4A24C] flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-[#0B1A2C]" />
                </div>
                <h2 className="font-editorial text-2xl font-normal text-[#112233]">
                  Volunteer Field Access
                </h2>
                <p className="text-xs text-[#666A78] max-w-sm mx-auto">
                  Enter your designated mobile number. Only authorized constituency volunteers are permitted to log in and submit grievances.
                </p>
              </div>

              {/* Sample Registered Numbers Notice for quick reference */}
              <div className="bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl p-3.5 text-xs text-[#4A4E5C] space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-[#112233] text-[11px] uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5 text-[#D4A24C]" />
                  <span>Designated Authorized Numbers:</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 font-mono-data text-[11px]">
                  {designatedVolunteers.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVolunteerMobileInput(v.mobile)}
                      className="px-2 py-1 bg-white border border-[#D5D3C8] hover:border-[#D4A24C] rounded text-[#112233] transition-colors"
                    >
                      {v.name}: <strong className="text-[#0B1A2C]">{v.mobile}</strong>
                    </button>
                  ))}
                </div>
              </div>

              {volunteerAuthError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{volunteerAuthError}</span>
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider block">
                      Designated Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#8A8E9B] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9848012345 or 123456"
                        value={volunteerMobileInput}
                        onChange={(e) => setVolunteerMobileInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-sm font-mono-data text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#112233]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0B1A2C] hover:bg-[#142B45] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Request Authentication OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>OTP sent to <strong>+91 {volunteerMobileInput}</strong></span>
                    </span>
                    <span className="font-mono-data font-bold bg-emerald-200 px-2 py-0.5 rounded text-[11px]">
                      OTP: {simulatedOtp}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider block">
                      Enter 4-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-center text-lg tracking-widest font-mono-data text-[#112233] focus:outline-none focus:ring-2 focus:ring-[#112233]"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-1/3 py-2.5 bg-[#FAF9F5] hover:bg-[#ECEAE2] border border-[#D5D3C8] text-[#555866] text-xs font-semibold rounded-xl"
                    >
                      Change Number
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-2.5 bg-[#0B1A2C] hover:bg-[#142B45] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
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
              <div className="bg-white border border-[#E0DED5] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold font-editorial text-lg">
                    {loggedVolunteer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#112233]">{loggedVolunteer.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Designated Field Volunteer
                      </span>
                    </div>
                    <div className="text-xs text-[#666A78] flex items-center space-x-2 mt-0.5">
                      <span className="font-mono-data">Mobile: +91 {loggedVolunteer.mobile}</span>
                      <span>·</span>
                      <span>{loggedVolunteer.constituency} ({loggedVolunteer.mandal})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowVolunteerReceiptList(!showVolunteerReceiptList)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#112233] bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg hover:bg-[#ECEAE2] transition-colors"
                  >
                    {showVolunteerReceiptList ? "Back to Intake Form" : "My Logged Receipts"}
                  </button>
                  <button
                    type="button"
                    onClick={handleVolunteerLogout}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>

              {/* Notice of Restrictions */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>
                    <strong>Field Security Policy:</strong> Volunteers have submission clearance only. You can register citizen grievances and receive receipt IDs. Executive dashboards and editing of submitted tickets are restricted to Managers.
                  </span>
                </div>
              </div>

              {showVolunteerReceiptList ? (
                /* Volunteer's Personal Submitted Receipts Log */
                <div className="bg-white border border-[#E0DED5] rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="font-editorial text-xl font-normal text-[#112233]">
                    My Submitted Tickets ({grievances.filter((g) => g.submittedByVolunteer?.phone === loggedVolunteer.mobile).length})
                  </h3>
                  <div className="space-y-3">
                    {grievances
                      .filter((g) => g.submittedByVolunteer?.phone === loggedVolunteer.mobile)
                      .map((item) => (
                        <div key={item.id} className="p-4 rounded-xl border border-[#E0DED5] bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono-data font-bold text-xs bg-[#112233] text-white px-2 py-0.5 rounded">
                                {item.ticketNumber}
                              </span>
                              <span className="text-xs font-semibold text-[#112233]">{item.citizenName} ({item.citizenType})</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#4A4E5C] line-clamp-1">{item.subject}</p>
                            <div className="text-[11px] text-[#787C8A]">
                              <span>{item.department} · {item.address?.townMandal}</span>
                              <span className="mx-1.5">·</span>
                              <span className="font-mono-data">{item.submittedDate}</span>
                            </div>
                          </div>
                          <div className="text-right sm:border-l border-[#E5E3D8] sm:pl-4 text-xs">
                            <span className="text-[10px] uppercase text-[#8A8E9B] font-bold block">Assigned PoC</span>
                            <span className="font-semibold text-[#112233] block">{item.assignee}</span>
                            <span className="font-mono-data text-[11px] text-[#0F766E]">{item.assigneeContact}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                /* Volunteer 2-Section Intake Registration Form */
                <div className="bg-white border border-[#E0DED5] rounded-2xl p-6 sm:p-8 shadow-md space-y-8">
                  <div className="border-b border-[#ECEAE2] pb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] block">
                      Fast-Track Field Intake
                    </span>
                    <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-[#112233]">
                      Log Citizen Grievance
                    </h2>
                    <p className="text-xs text-[#666A78] mt-1">
                      Complete Personal Details and Issue Details. Assignee Point of Contact is auto-fetched directly from the central directory.
                    </p>
                  </div>

                  <form onSubmit={handleVolunteerSubmitTicket} className="space-y-8">
                    {/* =========================================
                        SECTION 1: PERSONAL DETAILS
                        ========================================= */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 border-b border-[#F0EFE8] pb-2">
                        <span className="w-6 h-6 rounded-full bg-[#112233] text-white flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                        <h3 className="font-editorial text-xl font-normal text-[#112233]">
                          Personal Details Section
                        </h3>
                      </div>

                      {/* Citizen Classification Option: Voter / Cadre / Leader */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider block">
                          Citizen Classification <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-3 max-w-md">
                          {(["Voter", "Cadre", "Leader"] as GrievanceCitizenType[]).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setCitizenType(type)}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                citizenType === type
                                  ? "bg-[#0B1A2C] text-[#F5EFE0] border-[#0B1A2C] shadow-xs"
                                  : "bg-[#FAF9F5] border-[#D5D3C8] text-[#555866] hover:bg-[#EFEFE8]"
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
                          <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider">
                            1. Citizen Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. K. Sudhakar Reddy"
                            value={citizenName}
                            onChange={(e) => setCitizenName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-xs text-[#112233] focus:outline-none focus:ring-1 focus:ring-[#112233]"
                          />
                        </div>

                        {/* 2. Age */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider">
                            2. Age <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="18"
                            max="110"
                            required
                            placeholder="e.g. 45"
                            value={citizenAge}
                            onChange={(e) => setCitizenAge(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-xs font-mono-data text-[#112233] focus:outline-none focus:ring-1 focus:ring-[#112233]"
                          />
                        </div>

                        {/* 3. Gender */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider">
                            3. Gender <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={citizenGender}
                            onChange={(e) => setCitizenGender(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-xs text-[#112233] cursor-pointer"
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
                          <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider">
                            4. Citizen Mobile Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98480 12345"
                            value={citizenPhone}
                            onChange={(e) => setCitizenPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-xs font-mono-data text-[#112233] focus:outline-none focus:ring-1 focus:ring-[#112233]"
                          />
                        </div>

                        {/* 5. Address - Door No */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider">
                            5. Address (D.No)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. D.No 14/231-A"
                            value={doorNo}
                            onChange={(e) => setDoorNo(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-xs text-[#112233]"
                          />
                        </div>
                      </div>

                      {/* Address Hierarchy Sub-fields: Ward/Village, Town/Mandal, Assembly, Parliament, State */}
                      <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#E5E3D8] space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B] block">
                          Hierarchical Administrative Jurisdiction:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#666A78]">Ward / Village</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Chinna Chowk"
                              value={wardVillage}
                              onChange={(e) => handleVillageChange(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#D5D3C8] rounded-lg text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#666A78]">Town / Mandal</label>
                            <select
                              value={townMandal}
                              onChange={(e) => handleMandalChange(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#D5D3C8] rounded-lg text-xs cursor-pointer"
                            >
                              {MANDALS_LIST.map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#666A78]">Assembly</label>
                            <input
                              type="text"
                              value={assembly}
                              onChange={(e) => setAssembly(e.target.value)}
                              className="w-full px-3 py-2 bg-[#F0EFE8] border border-[#D5D3C8] rounded-lg text-xs font-semibold text-[#112233]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#666A78]">Parliament</label>
                            <input
                              type="text"
                              value={parliament}
                              onChange={(e) => setParliament(e.target.value)}
                              className="w-full px-3 py-2 bg-[#F0EFE8] border border-[#D5D3C8] rounded-lg text-xs font-semibold text-[#112233]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#666A78]">State</label>
                            <input
                              type="text"
                              value={stateName}
                              onChange={(e) => setStateName(e.target.value)}
                              className="w-full px-3 py-2 bg-[#F0EFE8] border border-[#D5D3C8] rounded-lg text-xs font-semibold text-[#112233]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* =========================================
                        SECTION 2: ISSUE DETAILS
                        ========================================= */}
                    <div className="space-y-4 pt-4 border-t border-[#ECEAE2]">
                      <div className="flex items-center space-x-2 border-b border-[#F0EFE8] pb-2">
                        <span className="w-6 h-6 rounded-full bg-[#112233] text-white flex items-center justify-center text-xs font-bold">
                          2
                        </span>
                        <h3 className="font-editorial text-xl font-normal text-[#112233]">
                          Issue Details Section
                        </h3>
                      </div>

                      {/* 1. Issue Subject */}
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider">
                          1. Issue Title / Subject <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Broken drinking water pipeline causing contamination on Street 4"
                          value={issueSubject}
                          onChange={(e) => setIssueSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-xs font-semibold text-[#112233] focus:outline-none focus:ring-1 focus:ring-[#112233]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 2. Department */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider">
                            2. Department <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={selectedDept}
                            onChange={(e) => handleDeptChange(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-xs font-semibold text-[#112233] cursor-pointer"
                          >
                            {Object.keys(DEPARTMENT_CATEGORIES).map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Category */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider">
                            3. Category <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={selectedCat}
                            onChange={(e) => handleCatChange(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-xs text-[#112233] cursor-pointer"
                          >
                            {(DEPARTMENT_CATEGORIES[selectedDept] || []).map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 4. Description */}
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider">
                          4. Description / Citizen Voice Transcript <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Provide full description of the grievance, affected households, background observations, and urgency notes..."
                          value={issueDescription}
                          onChange={(e) => setIssueDescription(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-xs text-[#112233] focus:outline-none focus:ring-1 focus:ring-[#112233]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 5. Location */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider">
                            5. Specific Location / Landmark <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Opposite Community Hall, Street 4, Chinna Chowk"
                            value={issueLocation}
                            onChange={(e) => setIssueLocation(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] rounded-xl text-xs text-[#112233]"
                          />
                        </div>

                        {/* 6. Priority */}
                        <div className="space-y-1">
                          <label className="text-[11px] uppercase font-bold text-[#555866] tracking-wider">
                            6. Priority (Urgency Level) <span className="text-rose-500">*</span>
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
                                      ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                      : p === "Medium"
                                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                      : "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                    : "bg-[#FAF9F5] border-[#D5D3C8] text-[#666A78] hover:bg-[#EFEFE8]"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 7. Assignee (Auto-Fetched from Central Contact Database) */}
                      <div className="p-4 bg-[#F5F9F7] rounded-xl border border-emerald-300 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                            <label className="text-xs uppercase font-bold text-emerald-950 tracking-wider">
                              7. Assignee Point of Contact (Auto-Fetched Live)
                            </label>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            ✓ Auto-Matched from Manager Directory
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#555866]">Assignee Officer Name</label>
                            <input
                              type="text"
                              value={assigneeName}
                              onChange={(e) => setAssigneeName(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#D5D3C8] rounded-lg text-xs font-semibold text-[#112233]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#555866]">Official Designation</label>
                            <input
                              type="text"
                              value={assigneeDesignation}
                              onChange={(e) => setAssigneeDesignation(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#D5D3C8] rounded-lg text-xs text-[#112233]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#555866]">Official Contact Phone</label>
                            <input
                              type="text"
                              value={assigneeContact}
                              onChange={(e) => setAssigneeContact(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#D5D3C8] rounded-lg text-xs font-mono-data text-[#112233]"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] text-emerald-900/80 pt-1">
                          Auto-linked based on Department: <strong>{selectedDept}</strong> · Jurisdiction: <strong>{townMandal}</strong>.
                        </div>
                      </div>
                    </div>

                    {/* Submit Action */}
                    <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#ECEAE2]">
                      <button
                        type="submit"
                        className="px-8 py-3 bg-[#0B1A2C] hover:bg-[#142B45] text-[#F5EFE0] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-[#D4A24C]" />
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
              <div className="bg-white border border-[#D4A24C]/40 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-[#112233]">
                <div className="text-center space-y-2 border-b border-[#ECEAE2] pb-5">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] block">
                    Submission Confirmed
                  </span>
                  <h3 className="font-editorial text-2xl font-normal text-[#112233]">
                    Ticket Registered Successfully
                  </h3>
                  <div className="pt-1">
                    <span className="px-4 py-1.5 bg-[#0B1A2C] text-[#F5EFE0] font-mono-data font-bold text-sm rounded-lg tracking-wider">
                      {submittedReceipt.ticketNumber}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-[#FAF9F5] p-4 rounded-xl border border-[#E5E3D8]">
                  <div className="flex justify-between border-b border-[#ECEAE2] pb-1.5">
                    <span className="text-[#787C8A]">Citizen Name:</span>
                    <strong className="text-[#112233]">{submittedReceipt.citizenName} ({submittedReceipt.citizenType})</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#ECEAE2] pb-1.5">
                    <span className="text-[#787C8A]">Department:</span>
                    <strong className="text-[#112233]">{submittedReceipt.department}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#ECEAE2] pb-1.5">
                    <span className="text-[#787C8A]">Priority:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(submittedReceipt.priority)}`}>
                      {submittedReceipt.priority} Priority
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#ECEAE2] pb-1.5">
                    <span className="text-[#787C8A]">Assigned Officer:</span>
                    <strong className="text-[#112233]">{submittedReceipt.assignee}</strong>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-[#787C8A]">Initial Status:</span>
                    <span className="font-bold text-blue-700">Pending (Under Triage)</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedReceipt(null);
                      setShowVolunteerReceiptList(true);
                    }}
                    className="px-4 py-2.5 bg-[#FAF9F5] border border-[#D5D3C8] text-xs font-semibold rounded-xl text-[#112233] hover:bg-[#EFEFE8]"
                  >
                    View All My Receipts
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmittedReceipt(null)}
                    className="px-5 py-2.5 bg-[#0B1A2C] text-white text-xs font-bold rounded-xl hover:bg-[#142B45]"
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
        <div className="space-y-8 animate-fadeIn">
          {/* Manager Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E0DED5] pb-4">
            <div className="flex items-center space-x-2 bg-[#FAF9F5] p-1 rounded-xl border border-[#D5D3C8]">
              <button
                onClick={() => setManagerTab("overview")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  managerTab === "overview"
                    ? "bg-[#112233] text-white shadow-xs"
                    : "text-[#666A78] hover:text-[#112233]"
                }`}
              >
                1. KPI Overview & Analytics
              </button>
              <button
                onClick={() => setManagerTab("tickets")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  managerTab === "tickets"
                    ? "bg-[#112233] text-white shadow-xs"
                    : "text-[#666A78] hover:text-[#112233]"
                }`}
              >
                2. Master Ticket Explorer ({grievances.length})
              </button>
              <button
                onClick={() => setManagerTab("contacts")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  managerTab === "contacts"
                    ? "bg-[#112233] text-white shadow-xs"
                    : "text-[#666A78] hover:text-[#112233]"
                }`}
              >
                3. Contact Database ({contacts.length} PoCs)
              </button>
              <button
                onClick={() => setManagerTab("volunteers")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  managerTab === "volunteers"
                    ? "bg-[#112233] text-white shadow-xs"
                    : "text-[#666A78] hover:text-[#112233]"
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
              className="inline-flex items-center px-3.5 py-2 bg-[#FAF9F5] border border-[#D5D3C8] hover:border-[#112233] rounded-lg text-xs font-semibold text-[#112233] transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5 text-[#D4A24C]" />
              Test Field Volunteer Submission Form →
            </button>
          </div>

          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {managerTab === "overview" && (
            <div className="space-y-8 animate-fadeIn">
              {/* 8 Essential Executive KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {/* 1. Total Logged Tickets */}
                <div className="bg-white border border-[#E0DED5] rounded-xl p-4 shadow-xs col-span-2 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B] block">
                    1. Total Logged Tickets
                  </span>
                  <div className="font-editorial text-3xl font-bold text-[#112233] mt-1 font-mono-data">
                    {totalTickets}
                  </div>
                  <span className="text-[11px] text-[#717582] mt-1 block">
                    Constituency-Wide Intake
                  </span>
                </div>

                {/* 2. Priority: High */}
                <div className="bg-white border border-rose-200 bg-rose-50/30 rounded-xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                    High Priority
                  </span>
                  <div className="font-editorial text-2xl font-bold text-rose-700 mt-1 font-mono-data">
                    {highPriorityCount}
                  </div>
                  <span className="text-[10px] text-rose-600 mt-0.5 block">
                    Fast-Track Escalation
                  </span>
                </div>

                {/* 2. Priority: Medium */}
                <div className="bg-white border border-amber-200 bg-amber-50/30 rounded-xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Medium Priority
                  </span>
                  <div className="font-editorial text-2xl font-bold text-amber-700 mt-1 font-mono-data">
                    {mediumPriorityCount}
                  </div>
                  <span className="text-[10px] text-amber-600 mt-0.5 block">
                    Standard 24h SLA
                  </span>
                </div>

                {/* 2. Priority: Low */}
                <div className="bg-white border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Low Priority
                  </span>
                  <div className="font-editorial text-2xl font-bold text-emerald-700 mt-1 font-mono-data">
                    {lowPriorityCount}
                  </div>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">
                    Scheduled Works
                  </span>
                </div>

                {/* 6. Completed Tickets */}
                <div className="bg-white border border-emerald-300 rounded-xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                    6. Completed
                  </span>
                  <div className="font-editorial text-2xl font-bold text-emerald-800 mt-1 font-mono-data">
                    {completedCount}
                  </div>
                  <span className="text-[10px] text-emerald-700 mt-0.5 block font-semibold">
                    {((completedCount / (totalTickets || 1)) * 100).toFixed(1)}% Resolution
                  </span>
                </div>

                {/* 7. Pending Tickets */}
                <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                    7. Pending
                  </span>
                  <div className="font-editorial text-2xl font-bold text-blue-700 mt-1 font-mono-data">
                    {pendingCount}
                  </div>
                  <span className="text-[10px] text-blue-600 mt-0.5 block">
                    In Field Triage
                  </span>
                </div>

                {/* 8. Can't be done */}
                <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                    8. Can't Be Done
                  </span>
                  <div className="font-editorial text-2xl font-bold text-slate-800 mt-1 font-mono-data">
                    {cantBeDoneCount}
                  </div>
                  <span className="text-[10px] text-slate-600 mt-0.5 block">
                    Policy Restricted
                  </span>
                </div>
              </div>

              {/* Volunteer Activity & Time-Series Intake Analytics */}
              <div className="bg-white border border-[#E0DED5] rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECEAE2] pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] block">
                      Volunteer Filing Performance
                    </span>
                    <h3 className="font-editorial text-xl sm:text-2xl font-normal text-[#112233]">
                      Volunteer Activity: Daily, Weekly & Monthly Breakdown
                    </h3>
                    <p className="text-xs text-[#666A78]">
                      Track which volunteers have filed citizen requests across day, week, and monthly intervals.
                    </p>
                  </div>
                </div>

                {/* Volunteer Metrics Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E0DED5] bg-[#FAF9F5] text-[#555866] uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-3 px-4">Volunteer Name</th>
                        <th className="py-3 px-4">Designated Mobile</th>
                        <th className="py-3 px-4">Assigned Mandal</th>
                        <th className="py-3 px-4 text-center bg-blue-50 text-blue-900">Today (Day)</th>
                        <th className="py-3 px-4 text-center bg-indigo-50 text-indigo-900">This Week</th>
                        <th className="py-3 px-4 text-center bg-amber-50 text-amber-900">This Month</th>
                        <th className="py-3 px-4 text-center bg-[#112233] text-white">Total Filed</th>
                        <th className="py-3 px-4 text-center text-emerald-800">Resolved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EFE8]">
                      {volunteerAnalytics.map((v) => (
                        <tr key={v.id} className="hover:bg-[#FAF9F5] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#112233] flex items-center space-x-2">
                            <span className="w-7 h-7 rounded-full bg-[#112233] text-white flex items-center justify-center text-[10px] font-bold">
                              {v.name.charAt(0)}
                            </span>
                            <span>{v.name}</span>
                          </td>
                          <td className="py-3 px-4 font-mono-data text-[#555866]">+91 {v.mobile}</td>
                          <td className="py-3 px-4 text-[#555866]">{v.mandal}</td>
                          <td className="py-3 px-4 text-center font-bold font-mono-data bg-blue-50/50 text-blue-900">
                            {v.dayCount}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono-data bg-indigo-50/50 text-indigo-900">
                            {v.weekCount}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono-data bg-amber-50/50 text-amber-900">
                            {v.monthCount}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono-data text-sm text-[#112233]">
                            {v.totalFiled}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono-data text-emerald-700">
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
                <div className="lg:col-span-6 bg-white border border-[#E0DED5] rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B] block">
                        Pillar 3
                      </span>
                      <h4 className="font-editorial text-lg font-normal text-[#112233]">
                        3. Department Wise Issues
                      </h4>
                    </div>
                    <span className="text-xs font-mono-data text-[#787C8A]">
                      {Object.keys(departmentCounts).length} Departments
                    </span>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(departmentCounts).map(([dept, count]) => {
                      const pct = ((count / (totalTickets || 1)) * 100).toFixed(0);
                      return (
                        <div key={dept} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#112233]">{dept}</span>
                            <span className="font-mono-data text-[#666A78]">
                              <strong>{count}</strong> tickets ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#F2F0E8] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#112233] rounded-full transition-all"
                              style={{ width: `${Math.max(Number(pct), 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Area Wise Issues */}
                <div className="lg:col-span-6 bg-white border border-[#E0DED5] rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B] block">
                        Pillar 4
                      </span>
                      <h4 className="font-editorial text-lg font-normal text-[#112233]">
                        4. Area Wise Issues (Mandals & Wards)
                      </h4>
                    </div>
                    <span className="text-xs font-mono-data text-[#787C8A]">
                      Kadapa Assembly Constituency
                    </span>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(mandalCounts).map(([mandal, count]) => {
                      const pct = ((count / (totalTickets || 1)) * 100).toFixed(0);
                      return (
                        <div key={mandal} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#112233]">{mandal}</span>
                            <span className="font-mono-data text-[#666A78]">
                              <strong>{count}</strong> tickets ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#F2F0E8] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#D4A24C] rounded-full transition-all"
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
                <div className="bg-white border border-[#E0DED5] rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="font-editorial text-base font-normal text-[#112233]">
                    Citizen Gender Intake Ratio
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E5E3D8]">
                      <span className="text-[10px] uppercase font-bold text-[#787C8A] block">Male</span>
                      <div className="font-editorial text-xl font-bold text-[#112233] mt-1 font-mono-data">{genderStats.Male}</div>
                      <span className="text-[10px] text-[#787C8A]">{((genderStats.Male / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E5E3D8]">
                      <span className="text-[10px] uppercase font-bold text-[#787C8A] block">Female</span>
                      <div className="font-editorial text-xl font-bold text-[#112233] mt-1 font-mono-data">{genderStats.Female}</div>
                      <span className="text-[10px] text-[#787C8A]">{((genderStats.Female / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E5E3D8]">
                      <span className="text-[10px] uppercase font-bold text-[#787C8A] block">Other</span>
                      <div className="font-editorial text-xl font-bold text-[#112233] mt-1 font-mono-data">{genderStats.Other}</div>
                      <span className="text-[10px] text-[#787C8A]">{((genderStats.Other / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E0DED5] rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="font-editorial text-base font-normal text-[#112233]">
                    Citizen Type Distribution
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E5E3D8]">
                      <span className="text-[10px] uppercase font-bold text-[#787C8A] block">🗳️ Voter</span>
                      <div className="font-editorial text-xl font-bold text-[#112233] mt-1 font-mono-data">{citizenTypeStats.Voter}</div>
                      <span className="text-[10px] text-[#787C8A]">{((citizenTypeStats.Voter / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E5E3D8]">
                      <span className="text-[10px] uppercase font-bold text-[#787C8A] block">🚩 Cadre</span>
                      <div className="font-editorial text-xl font-bold text-[#112233] mt-1 font-mono-data">{citizenTypeStats.Cadre}</div>
                      <span className="text-[10px] text-[#787C8A]">{((citizenTypeStats.Cadre / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E5E3D8]">
                      <span className="text-[10px] uppercase font-bold text-[#787C8A] block">⭐ Leader</span>
                      <div className="font-editorial text-xl font-bold text-[#112233] mt-1 font-mono-data">{citizenTypeStats.Leader}</div>
                      <span className="text-[10px] text-[#787C8A]">{((citizenTypeStats.Leader / (totalTickets || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Ticket Assigned Persons Workload */}
              <div className="bg-white border border-[#E0DED5] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B] block">
                      Pillar 5
                    </span>
                    <h4 className="font-editorial text-lg font-normal text-[#112233]">
                      5. Ticket Assigned Persons & Officers Workload
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assigneeStats.map((a) => (
                    <div key={a.name} className="p-3.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs text-[#112233] block">{a.name}</span>
                        <span className="text-[10px] text-[#666A78] block">{a.designation}</span>
                        <span className="font-mono-data text-[10px] text-[#0F766E]">{a.contact}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-editorial font-bold text-[#112233] font-mono-data">{a.count}</span>
                        <span className="text-[9px] uppercase font-bold text-[#8A8E9B] block">Active Tickets</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER TICKET EXPLORER & DETAIL INSPECTOR */}
          {managerTab === "tickets" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filter Bar */}
              <div className="bg-white border border-[#E0DED5] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-[#8C909E] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ticket #, citizen name, phone, issue, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#112233]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {/* Priority Filter */}
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg px-2.5 py-1.5 text-xs text-[#112233] cursor-pointer"
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
                    className="bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg px-2.5 py-1.5 text-xs text-[#112233] cursor-pointer"
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
                    className="bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg px-2.5 py-1.5 text-xs text-[#112233] cursor-pointer"
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
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#797D8B] px-1">
                    <span>Grievance Inflow ({filteredGrievances.length})</span>
                    <span className="font-mono-data text-[11px] text-[#4A4E5C]">Showing live stream</span>
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
                              ? "bg-white border-2 border-[#112233] shadow-md ring-1 ring-[#112233]/10"
                              : "bg-white border-[#E0DED5] hover:border-[#CDC9BC]"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-mono-data font-bold text-[#112233]">
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

                          <h4 className="text-xs sm:text-sm font-semibold text-[#112233] line-clamp-1">
                            {item.subject}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-[#717582] mt-2 pt-2 border-t border-[#F2F1EA]">
                            <span>{item.citizenName} ({item.citizenType})</span>
                            <span className="font-mono-data">{item.submittedDate}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Detail Inspector (Right 7 Cols) */}
                <div className="lg:col-span-7">
                  {activeTicket ? (
                    <div className="bg-white border border-[#E0DED5] rounded-2xl p-6 shadow-xs space-y-6">
                      {/* Ticket Header & Status Management Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECEAE2] pb-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono-data text-xs font-bold px-2 py-0.5 bg-[#112233] text-white rounded">
                              {activeTicket.ticketNumber}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(activeTicket.priority)}`}>
                              {activeTicket.priority} Priority
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(activeTicket.status)}`}>
                              {activeTicket.status}
                            </span>
                          </div>
                          <h3 className="font-editorial text-xl sm:text-2xl font-normal text-[#112233] mt-2">
                            {activeTicket.subject}
                          </h3>
                        </div>

                        {/* Status Change Dropdown / Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateTicketStatus(activeTicket.id, "Completed")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center cursor-pointer ${
                              activeTicket.status === "Completed"
                                ? "bg-emerald-800 text-white font-bold"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Completed
                          </button>
                          <button
                            onClick={() => handleUpdateTicketStatus(activeTicket.id, "Pending")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center cursor-pointer ${
                              activeTicket.status === "Pending"
                                ? "bg-blue-800 text-white font-bold"
                                : "bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Pending
                          </button>
                          <button
                            onClick={() => handleUpdateTicketStatus(activeTicket.id, "Can't be done")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center cursor-pointer ${
                              activeTicket.status === "Can't be done"
                                ? "bg-slate-800 text-white font-bold"
                                : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Can't be done
                          </button>
                        </div>
                      </div>

                      {/* Citizen Personal Details Section */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B] block">
                          1. Citizen Personal Profile & Classification
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FAF9F5] rounded-xl border border-[#E5E3D8] text-xs">
                          <div>
                            <span className="text-[10px] uppercase text-[#888C99] font-bold block">Citizen Name</span>
                            <span className="font-semibold text-[#112233]">{activeTicket.citizenName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#888C99] font-bold block">Option / Type</span>
                            <span className="font-bold text-[#D4A24C]">{activeTicket.citizenType}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#888C99] font-bold block">Age & Gender</span>
                            <span className="text-[#112233]">{activeTicket.citizenAge} yrs · {activeTicket.citizenGender}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#888C99] font-bold block">Mobile</span>
                            <span className="font-mono-data text-[#112233]">{activeTicket.citizenPhone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Address Hierarchy Breakdown */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B] block">
                          Citizen Address Details
                        </span>
                        <div className="p-3.5 bg-[#FAF9F5] rounded-xl border border-[#ECEAE2] text-xs space-y-1.5">
                          <div className="flex items-center space-x-2 text-[#112233]">
                            <MapPin className="w-4 h-4 text-[#D4A24C] flex-shrink-0" />
                            <span className="font-semibold">
                              {activeTicket.address?.doorNo ? `${activeTicket.address.doorNo}, ` : ""}
                              {activeTicket.address?.wardVillage}, {activeTicket.address?.townMandal}, {activeTicket.address?.assembly}, {activeTicket.address?.parliament}, {activeTicket.address?.state}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Issue Description */}
                      <div className="space-y-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B]">
                          2. Issue Description & Location
                        </span>
                        <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#ECEAE2] space-y-2">
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#555866] border-b border-[#ECEAE2] pb-2">
                            <span>Department: <strong className="text-[#112233]">{activeTicket.department}</strong></span>
                            <span>·</span>
                            <span>Category: <strong className="text-[#112233]">{activeTicket.category}</strong></span>
                            <span>·</span>
                            <span>Location: <strong className="text-[#112233]">{activeTicket.location}</strong></span>
                          </div>
                          <p className="text-[#2F323E] leading-relaxed pt-1">
                            {activeTicket.description}
                          </p>
                        </div>
                      </div>

                      {/* Assignee Information & Reassignment Option */}
                      <div className="p-4 bg-[#FAF9F5] rounded-xl border border-[#E5E3D8] space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B] block">
                              Assigned Officer / PoC
                            </span>
                            <span className="font-bold text-sm text-[#112233]">{activeTicket.assignee}</span>
                            <span className="text-xs text-[#666A78] block">{activeTicket.assigneeDesignation} · {activeTicket.assigneeContact}</span>
                          </div>

                          {/* Reassign dropdown */}
                          <div className="text-right">
                            <label className="text-[10px] uppercase font-bold text-[#888C99] block mb-1">Reassign PoC</label>
                            <select
                              onChange={(e) => {
                                const selected = contacts.find((c) => c.id === e.target.value);
                                if (selected) handleReassignTicket(activeTicket.id, selected);
                              }}
                              className="bg-white border border-[#D5D3C8] rounded-lg px-2.5 py-1 text-xs text-[#112233] cursor-pointer"
                            >
                              <option value="">Choose new PoC...</option>
                              {contacts.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.pocName} ({c.department} - {c.mandal})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Volunteer Submitter Tag */}
                        <div className="pt-2 border-t border-[#ECEAE2] flex items-center justify-between text-[11px] text-[#666A78]">
                          <span>Logged by Volunteer: <strong className="text-[#112233]">{activeTicket.submittedByVolunteer?.name}</strong> (+91 {activeTicket.submittedByVolunteer?.phone})</span>
                          <span className="font-mono-data">{activeTicket.submittedDate}</span>
                        </div>
                      </div>

                      {/* Liaison Notes & Action Trail */}
                      <div className="space-y-3 pt-2 border-t border-[#ECEAE2] text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B] block">
                          Field Liaison Resolution Log & Notes
                        </span>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {activeTicket.notes.map((note, idx) => (
                            <div key={idx} className="flex items-start space-x-2 text-xs text-[#454957] bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E5E3D8]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#112233] mt-1.5 flex-shrink-0" />
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
                            className="flex-1 px-3 py-2 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#112233]"
                          />
                          <button
                            onClick={() => handleAddResolutionNote(activeTicket.id)}
                            className="px-3.5 py-2 bg-[#112233] text-white text-xs font-semibold rounded-lg hover:bg-[#07121F] transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#E0DED5] rounded-2xl p-12 text-center text-xs text-[#7A7E8C]">
                      Select a grievance ticket to inspect details and assign field officers.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT DATABASE (POINT OF CONTACTS DIRECTORY) */}
          {managerTab === "contacts" && (
            <div className="bg-white border border-[#E0DED5] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECEAE2] pb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] block">
                    Central PoC Registry
                  </span>
                  <h3 className="font-editorial text-2xl font-normal text-[#112233]">
                    Constituency Contact Database
                  </h3>
                  <p className="text-xs text-[#666A78] mt-0.5">
                    Department, category, village, mandal, and assembly level point of contacts. Field volunteers automatically fetch these contacts during grievance intake.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddContactModalOpen(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-[#112233] hover:bg-[#07121F] text-[#FBFBF9] text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add New Contact PoC
                </button>
              </div>

              {/* Contacts Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E0DED5] bg-[#FAF9F5] text-[#555866] uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Officer / PoC Name</th>
                      <th className="py-3 px-4">Department & Category</th>
                      <th className="py-3 px-4">Jurisdiction (Village/Mandal/Assembly)</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Phone & Email</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EFE8]">
                    {contacts.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FAF9F5] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#112233]">
                          {c.pocName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 block w-fit">
                            {c.department}
                          </span>
                          <span className="text-[11px] text-[#666A78] mt-0.5 block">{c.category}</span>
                        </td>
                        <td className="py-3 px-4 text-[#555866]">
                          <span className="font-semibold text-[#112233]">{c.village}</span>, {c.mandal} ({c.assembly})
                        </td>
                        <td className="py-3 px-4 text-[#555866]">{c.designation}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono-data text-[#0F766E] font-semibold block">{c.phone}</span>
                          <span className="text-[10px] text-[#787C8A]">{c.email}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                  <div className="bg-white border border-[#E0DED5] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
                    <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B]">
                          Directory Entry
                        </span>
                        <h3 className="font-editorial text-2xl font-normal text-[#112233]">
                          Add New Point of Contact
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsAddContactModalOpen(false)}
                        className="text-xs font-bold text-[#717582] hover:text-[#112233]"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddContact} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#555866]">Officer / PoC Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. M. Ramesh (Irrigation Liaison)"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#555866]">Department</label>
                          <select
                            value={newContactDept}
                            onChange={(e) => {
                              setNewContactDept(e.target.value);
                              setNewContactCat(DEPARTMENT_CATEGORIES[e.target.value]?.[0] || "");
                            }}
                            className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs cursor-pointer"
                          >
                            {Object.keys(DEPARTMENT_CATEGORIES).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#555866]">Category</label>
                          <select
                            value={newContactCat}
                            onChange={(e) => setNewContactCat(e.target.value)}
                            className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs cursor-pointer"
                          >
                            {(DEPARTMENT_CATEGORIES[newContactDept] || []).map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#555866]">Village / Ward</label>
                          <input
                            type="text"
                            placeholder="e.g. Chinna Chowk"
                            value={newContactVillage}
                            onChange={(e) => setNewContactVillage(e.target.value)}
                            className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#555866]">Mandal</label>
                          <select
                            value={newContactMandal}
                            onChange={(e) => setNewContactMandal(e.target.value)}
                            className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs cursor-pointer"
                          >
                            {MANDALS_LIST.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#555866]">Assembly</label>
                          <input
                            type="text"
                            value={newContactAssembly}
                            onChange={(e) => setNewContactAssembly(e.target.value)}
                            className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#555866]">Official Designation</label>
                          <input
                            type="text"
                            placeholder="e.g. Executive Engineer Water Works"
                            value={newContactDesignation}
                            onChange={(e) => setNewContactDesignation(e.target.value)}
                            className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#555866]">Official Phone</label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 94408 11223"
                            value={newContactPhone}
                            onChange={(e) => setNewContactPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs font-mono-data"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#555866]">Email</label>
                        <input
                          type="email"
                          placeholder="poc@kadapa.gov.in"
                          value={newContactEmail}
                          onChange={(e) => setNewContactEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#ECEAE2]">
                        <button
                          type="button"
                          onClick={() => setIsAddContactModalOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-[#5B5F6C]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-[#112233] text-white text-xs font-semibold rounded-lg hover:bg-[#07121F]"
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
            <div className="bg-white border border-[#E0DED5] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECEAE2] pb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] block">
                    Access Control Registry
                  </span>
                  <h3 className="font-editorial text-2xl font-normal text-[#112233]">
                    Designated Volunteer Mobile Whitelist
                  </h3>
                  <p className="text-xs text-[#666A78] mt-0.5">
                    Only these designated mobile numbers can receive OTP authentication and file grievances for this constituency.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddVolunteerModalOpen(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-[#112233] hover:bg-[#07121F] text-[#FBFBF9] text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Designated Volunteer
                </button>
              </div>

              {/* Volunteers Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E0DED5] bg-[#FAF9F5] text-[#555866] uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Volunteer Name</th>
                      <th className="py-3 px-4">Designated Mobile (OTP Whitelist)</th>
                      <th className="py-3 px-4">Assigned Constituency</th>
                      <th className="py-3 px-4">Mandal Assignment</th>
                      <th className="py-3 px-4">Access Status</th>
                      <th className="py-3 px-4 text-right">Toggle Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EFE8]">
                    {designatedVolunteers.map((v) => (
                      <tr key={v.id} className="hover:bg-[#FAF9F5] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#112233]">
                          {v.name}
                        </td>
                        <td className="py-3 px-4 font-mono-data text-sm font-bold text-[#112233]">
                          +91 {v.mobile}
                        </td>
                        <td className="py-3 px-4 text-[#555866]">{v.constituency}</td>
                        <td className="py-3 px-4 text-[#555866]">{v.mandal}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              v.active
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-rose-100 text-rose-800 border-rose-300"
                            }`}
                          >
                            {v.active ? "Authorized Active" : "Suspended"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleVolunteerStatus(v.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded border border-[#D5D3C8] hover:bg-[#ECEAE2] cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                  <div className="bg-white border border-[#E0DED5] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                      <h3 className="font-editorial text-xl font-normal text-[#112233]">
                        Add Designated Volunteer
                      </h3>
                      <button
                        onClick={() => setIsAddVolunteerModalOpen(false)}
                        className="text-xs font-bold text-[#717582] hover:text-[#112233]"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddVolunteer} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#555866]">Volunteer Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. M. Chenna Kesavulu"
                          value={newVolName}
                          onChange={(e) => setNewVolName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#555866]">Designated Mobile Number</label>
                        <input
                          type="tel"
                          required
                          placeholder="9848012345"
                          value={newVolMobile}
                          onChange={(e) => setNewVolMobile(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs font-mono-data"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-[#555866]">Assigned Mandal</label>
                        <select
                          value={newVolMandal}
                          onChange={(e) => setNewVolMandal(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs cursor-pointer"
                        >
                          {MANDALS_LIST.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#ECEAE2]">
                        <button
                          type="button"
                          onClick={() => setIsAddVolunteerModalOpen(false)}
                          className="px-4 py-2 text-xs font-semibold text-[#5B5F6C]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#112233] text-white text-xs font-semibold rounded-lg hover:bg-[#07121F]"
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
    </div>
  );
};
