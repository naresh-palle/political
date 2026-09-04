import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FieldIssue,
  UserProfile,
  IssueCategory,
  IssuePriority,
  VillageInfo,
  MandalInfo
} from "../../types";
import { politicalApiService } from "../../services/api";
import { IssueDetailView } from "./IssueDetailView";
import {
  Plus,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Send,
  Lock,
  Search,
  Calendar,
  Layers,
  Sparkles,
  User,
  Phone,
  Building2,
  FileText,
  Upload,
  X,
  Tag,
  Shield,
  Briefcase,
  Paperclip,
  Check,
  LayoutGrid,
  List,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle
} from "lucide-react";
import { AssignComplaintModal } from "./AssignComplaintModal";

export interface VolunteerDashboardProps {
  currentUser: UserProfile;
  initialFilterStatus?: string;
}

const CATEGORIES = [
  "Roads & Buildings",
  "Water Supply",
  "Electricity",
  "Sanitation & Garbage",
  "Drainage & Sewage",
  "Healthcare",
  "Agriculture & Irrigation",
  "Education",
  "Revenue & Land Issues",
  "Welfare Schemes",
  "Law & Order",
  "Other"
];

const CATEGORY_TO_DEPARTMENT: Record<string, string> = {
  "Roads & Buildings": "8. Roads & Buildings (R&B) Department",
  "Water Supply": "2. Rural Water Supply Scheme Department (RWS)",
  "Electricity": "14. Electricity Department (విద్యుత్ శాఖ - APCPDCL)",
  "Sanitation & Garbage": "6. MGNREGS – Employment Guarantee Scheme",
  "Drainage & Sewage": "1. Panchayat Raj – Engineering Department",
  "Healthcare": "10. Health Department (ఆరోగ్య శాఖ)",
  "Agriculture & Irrigation": "7. Agriculture Department (వ్యవసాయ శాఖ)",
  "Education": "13. Education Department (విద్యా శాఖ)",
  "Revenue & Land Issues": "11. Revenue Department (రెవెన్యూ శాఖ)",
  "Welfare Schemes": "3. Rural Development – NTR Bharosa Pensions Department",
  "Law & Order": "17. Law & Order & Police Services (శాంతి భద్రతలు)",
  "Other": "Other Government Department (ఇతర ప్రభుత్వ శాఖ)"
};

export interface PgrsDepartmentItem {
  id: number;
  name: string;
  teluguName: string;
  subDetails: string[];
}

export const PGRS_DEPARTMENTS_LIST: PgrsDepartmentItem[] = [
  {
    id: 1,
    name: "1. Panchayat Raj – Engineering Department",
    teluguName: "పంచాయతీ రాజ్ – ఇంజనీరింగ్ విభాగం",
    subDetails: [
      "Cement Roads (సిమెంట్ రోడ్లు)",
      "Panchayat Buildings Department (పంచాయతీ భవనాలు)",
      "Village Organisation (VO) Building (విలేజ్ ఆర్గనైజేషన్ భవనం)"
    ]
  },
  {
    id: 2,
    name: "2. Rural Water Supply Scheme Department (RWS)",
    teluguName: "గ్రామీణ తాగునీటి సరఫరా పథకం (RWS)",
    subDetails: [
      "Swachh Bharat Mission – Toilets & Works (స్వచ్ఛ భారత్ మిషన్ – మరుగుదొడ్లు)",
      "Modernization of Filter Beds (ఫిల్టర్ బెడ్స్ ఆధునీకరణ)",
      "Drains and Pipe lines (డ్రైన్లు మరియు పైప్‌లైన్లు)"
    ]
  },
  {
    id: 3,
    name: "3. Rural Development – NTR Bharosa Pensions Department",
    teluguName: "ఎన్టీఆర్ భరోసా పింఛన్ల శాఖ",
    subDetails: [
      "Old Age pensions (వృద్ధాప్య పింఛన్లు)",
      "Widow Pensions (వితంతు పింఛన్లు)",
      "Persons with Disabilities / Divyangulu (దివ్యాంగుల పింఛన్లు)",
      "Dappu Artists Pensions (డప్పు కళాకారుల పింఛన్లు)",
      "Leather Artisans Pensions (చర్మాకార వృత్తిదారుల పింఛన్లు)",
      "Handloom Weavers Pensions (చేనేత కార్మికుల పింఛన్లు)",
      "Toddy Tappers Pensions (గీత కార్మికుల పింఛన్లు)",
      "Destitute Women / Single Women (ఒంటరి మహిళా పింఛన్లు)",
      "Abhaya Hastham (అభయ హస్తం)",
      "CKDU Pensions (సికెడియు పింఛన్లు)",
      "DMHO / Medical Pensions (వైద్య పింఛన్లు)",
      "Other Pensions (ఇతర పింఛన్లు)",
      "New Pensions Application (కొత్త పింఛను)"
    ]
  },
  {
    id: 4,
    name: "4. Self-Employment Scheme (స్వయం ఉపాధి పథకాలు)",
    teluguName: "స్వయం ఉపాధి పథకాల కార్పొరేషన్",
    subDetails: [
      "SC Corporation / Scheduled Castes (షెడ్యూల్డ్ కులాల కార్పొరేషన్)",
      "బి.సి కార్పొరేషన్ (BC Corporation)",
      "EBC Corporation / Economically Backward Classes (ఈబీసీ కార్పొరేషన్)"
    ]
  },
  {
    id: 5,
    name: "5. VELUGU – Rural Development & SHG Programme",
    teluguName: "వెలుగు – స్వయం సహాయక సంఘాలు",
    subDetails: [
      "Bank Linkage (బ్యాంక్ లింకేజి)",
      "Interest Subsidy / పావలా వడ్డీ (వడ్డీ రాయితీ)",
      "Stree Nidhi (స్త్రీ నిధి)",
      "Chandranna Pelli Kanuka (చంద్రన్న పెళ్లి కానుక)"
    ]
  },
  {
    id: 6,
    name: "6. MGNREGS – Employment Guarantee Scheme",
    teluguName: "ఉపాధి హామీ పథకం (MGNREGS)",
    subDetails: [
      "Employment Guarantee – Workdays (ఉపాధి హామీ పనిదినాలు)",
      "Solid Waste Management (SWM / చెత్త సంపద కేంద్రాలు)",
      "Form Ponds (ఫామ్ పాండ్స్)",
      "Play Fields (క్రీడా మైదానాలు)",
      "Vermi / NADEP Pits (వర్మీ / నాడెప్ గుంతలు)",
      "Horticulture Development (తోటపెంపకం)",
      "Soak Pits (ఇకుడు గుంతలు)"
    ]
  },
  {
    id: 7,
    name: "7. Agriculture Department (వ్యవసాయ శాఖ)",
    teluguName: "వ్యవసాయ శాఖ",
    subDetails: [
      "Farmer Loan Waiver (రైతు రుణమాఫీ)",
      "Soil Health Cards for Farmers (నేల ఆరోగ్య కార్డులు)",
      "Rythu Radham (రైతు రథం)",
      "Power Tillers (పవర్ టిల్లర్లు)",
      "Other Agricultural Machinery & Equipment (ఇతర వ్యవసాయ యంత్రాలు & పరికరాలు)"
    ]
  },
  {
    id: 8,
    name: "8. Roads & Buildings (R&B) Department",
    teluguName: "రోడ్లు మరియు భవనాల శాఖ (R&B)",
    subDetails: [
      "Cement Roads & Bridges (సిమెంట్ రోడ్లు & వంతెనలు)",
      "Road Repairs & Maintenance (రోడ్డు మరమ్మత్తులు)"
    ]
  },
  {
    id: 9,
    name: "9. Housing Department (గృహ నిర్మాణ శాఖ)",
    teluguName: "గృహ నిర్మాణ శాఖ",
    subDetails: [
      "గృహ నిర్మాణం (Housing Construction / PMAY)",
      "House Pattas / Sites Allotment (ఇళ్ల పట్టాల పంపిణీ)"
    ]
  },
  {
    id: 10,
    name: "10. Health Department (ఆరోగ్య శాఖ)",
    teluguName: "వైద్య మరియు ఆరోగ్య శాఖ",
    subDetails: [
      "యన్.టి.ఆర్ ఆరోగ్య సేవ (NTR Arogya Seva)",
      "తల్లి బిడ్డ ఎక్స్ ప్రెస్ (Thalli Bidda Express 102)"
    ]
  },
  {
    id: 11,
    name: "11. Revenue Department (రెవెన్యూ శాఖ)",
    teluguName: "రెవెన్యూ శాఖ",
    subDetails: [
      "రేషన్ కార్డులు (Ration Cards / PDS)",
      "దీపం పధకం (Deepam Gas Connection)",
      "NFBS పధకం (National Family Benefit Scheme)"
    ]
  },
  {
    id: 12,
    name: "12. Neeru-Chettu / Minor Irrigation Dept (నీరు-చెట్టు)",
    teluguName: "చిన్న నీటిపారుదల శాఖ (నీరు-చెట్టు)",
    subDetails: [
      "కాలువల ఆధునీకరణ & వంతెనల వర్క్స్ (Canal Modernization & Bridges Works)",
      "Watershed Development (వాటర్‌షెడ్ అభివృద్ది)",
      "Check Dams Construction (చెక్‌డామ్‌ల నిర్మాణం)"
    ]
  },
  {
    id: 13,
    name: "13. Education Department (విద్యా శాఖ)",
    teluguName: "పాఠశాల విద్యా శాఖ",
    subDetails: [
      "Extra Classrooms (అదనపు తరగతి గదులు)",
      "Toilets Facilities (పాఠశాల మరుగుదొడ్లు)",
      "Compound Wall Construction (రక్షణ గోడ)",
      "సైకిల్స్ పంపిణీ (Bicycle Distribution Scheme)"
    ]
  },
  {
    id: 14,
    name: "14. Electricity Department (విద్యుత్ శాఖ - APCPDCL)",
    teluguName: "విద్యుత్ శాఖ (APCPDCL)",
    subDetails: [
      "Electric Poles Replacement (విద్యుత్ స్థంభాలు)",
      "ట్రాన్స్ ఫార్మార్లు (Transformers Installation / Repairs)",
      "SC & ST Subsidy Plan (ఎస్సీ & ఎస్టీ విద్యుత్ సబ్సిడీ)",
      "PM Surya Ghar Solar Scheme (పిఎం సూర్య ఘర్ ఉచిత సోలార్)",
      "Rs. 125/- Category Services (రూ. 125 సేవలు)"
    ]
  },
  {
    id: 15,
    name: "15. ICDS – Women & Child Development (ఐసిడిఎస్)",
    teluguName: "మహిళా మరియు శిశు సంక్షేమ శాఖ (ICDS)",
    subDetails: [
      "ఆంగన్వాడీ భవనాలు (Anganwadi Buildings & Centers)",
      "అన్న అమృత హస్తం (Anna Amrutha Hastham Nutritional Scheme)"
    ]
  },
  {
    id: 16,
    name: "16. Aadarana – 3 Scheme (ఆదరణ – 3 పథకం)",
    teluguName: "ఆదరణ – 3 పథకం (వృత్తిదారుల ఆదరణ పరికరాలు)",
    subDetails: [
      "రజక (Washermen / Laundry Tools & Iron Boxes)",
      "Carpentry Tools (వడ్రంగి పనిముట్లు)",
      "Tailoring Machines (కుట్టు మిషన్లు)",
      "Weaving Tools & Handloom Equipment (చేనేత పరికరాలు)",
      "Blacksmith Tools (కమ్మరి పరికరాలు)",
      "Milk Business Equipment (పాల వ్యాపార పరికరాలు)",
      "Naynee Brahmin / Barber Kits (నాయీ బ్రాహ్మణ పరికరాలు)",
      "Stone Cutting Tools (రాతి పని పరికరాలు)"
    ]
  },
  {
    id: 17,
    name: "17. Law & Order & Police Services (శాంతి భద్రతలు)",
    teluguName: "పోలీస్ మరియు శాంతి భద్రతల శాఖ",
    subDetails: [
      "Police Help & Protection (పోలీస్ సాయం & రక్షణ)",
      "Community Law & Order (సముదాయ శాంతి భద్రతలు)"
    ]
  }
];

const DEPARTMENTS = [
  ...PGRS_DEPARTMENTS_LIST.map((d) => d.name),
  "Other Government Department (ఇతర ప్రభుత్వ శాఖ)"
];

const FIXED_MANDALS_TOWNS = [
  { id: "MDL-BNG-TWN", name: "Banaganapalle Town (Town)", type: "TOWN" },
  { id: "MDL-KKL-TWN", name: "Koilakuntla Town (Town)", type: "TOWN" },
  { id: "MDL-BNG-RUR", name: "Banaganapalle Mandal (Rural)", type: "MANDAL" },
  { id: "MDL-KKL-RUR", name: "Koilakuntla Mandal (Rural)", type: "MANDAL" },
  { id: "MDL-OWK-RUR", name: "Owk Mandal (Rural)", type: "MANDAL" },
  { id: "MDL-SJM-RUR", name: "Sanjamala Mandal (Rural)", type: "MANDAL" },
  { id: "MDL-KLM-RUR", name: "Kolimigundla Mandal (Rural)", type: "MANDAL" }
];

export const VolunteerOperationsDashboard: React.FC<VolunteerDashboardProps> = ({
  currentUser,
  initialFilterStatus
}) => {
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Issue for Full-Page Detail View
  const [selectedIssue, setSelectedIssue] = useState<FieldIssue | null>(null);

  // View Mode: GRID vs TABLE
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  const getStatusFromUrl = (): string => {
    const hash = window.location.hash;
    if (hash.includes("status=")) {
      const match = hash.match(/status=([A-Z_]+)/i);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
    return "ALL";
  };

  // Filters & Sorting State
  const [filterStatus, setFilterStatus] = useState<string>(() => getStatusFromUrl() || initialFilterStatus || "ALL");

  useEffect(() => {
    const syncStatus = () => {
      const fromUrl = getStatusFromUrl();
      if (fromUrl) {
        setFilterStatus(fromUrl);
      }
    };
    syncStatus();
    window.addEventListener("hashchange", syncStatus);
    return () => window.removeEventListener("hashchange", syncStatus);
  }, []);

  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterReporterType, setFilterReporterType] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "7DAYS" | "THIS_MONTH" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "DUE_DATE" | "PRIORITY" | "STATUS" | "TITLE">("NEWEST");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Create Complaint Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assignModalIssue, setAssignModalIssue] = useState<FieldIssue | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<string>("Roads & Buildings");
  const [newDepartment, setNewDepartment] = useState<string>("8. Roads & Buildings (R&B) Department");
  const [otherDepartmentText, setOtherDepartmentText] = useState("");
  const [newSchemeSubDetail, setNewSchemeSubDetail] = useState("");
  const [newAadharNumber, setNewAadharNumber] = useState("");
  const [newPriority, setNewPriority] = useState<IssuePriority>("HIGH");
  const [newIssueType, setNewIssueType] = useState<"COMPLAINT" | "REQUIREMENT">("COMPLAINT");
  
  // Geography fields
  const [selectedMandalId, setSelectedMandalId] = useState<string>(
    currentUser.assignedMandalId || "MDL-BNG-TWN"
  );
  const [villageWardText, setVillageWardText] = useState(
    currentUser.assignedVillageNames?.[0] || ""
  );
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Reporter & Cadre fields
  const [reporterType, setReporterType] = useState<"CITIZEN" | "CADRE" | "LEADER">("CITIZEN");
  const [reporterDesignation, setReporterDesignation] = useState("");
  const [newReportedBy, setNewReportedBy] = useState("");
  const [newReporterPhone, setNewReporterPhone] = useState("");
  const [citizenAge, setCitizenAge] = useState("");
  const [citizenGender, setCitizenGender] = useState("Male");

  // Assigned Ticket Person Details (Dynamic from current logged in user)
  const [assignedPersonName, setAssignedPersonName] = useState(currentUser.name || "");
  const [assignedPersonPhone, setAssignedPersonPhone] = useState(
    currentUser.phone ? currentUser.phone.replace(/^\+91\s*/, "") : ""
  );

  // Multi-Proof attachments (Photos & Documents)
  const [proofFiles, setProofFiles] = useState<{ name: string; url: string; type: "image" | "document" }[]>([]);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [dispatchedNotifs, setDispatchedNotifs] = useState<string[]>([]);

  useEffect(() => {
    loadVolunteerData();
  }, [currentUser.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isAddModalOpen) setIsAddModalOpen(false);
        if (selectedIssue) setSelectedIssue(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddModalOpen, selectedIssue]);

  const loadVolunteerData = async () => {
    setLoading(true);
    try {
      const [allUsers, issueList] = await Promise.all([
        politicalApiService.getUsers(),
        politicalApiService.getFieldIssues({
          userId: currentUser.id,
          userRole: "VOLUNTEER"
        })
      ]);

      const volList = allUsers.filter(
        (u) =>
          (u.primaryRole === "VOLUNTEER" || u.roleId === "VOLUNTEER" || u.role === "volunteer") &&
          u.status === "ACTIVE"
      );
      setVolunteers(volList.length > 0 ? volList : [currentUser]);
      setIssues(issueList);
    } catch (e) {
      console.error(e);
      setVolunteers([currentUser]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is larger than 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const isImg = file.type.startsWith("image/");
          setProofFiles((prev) => [
            ...prev,
            {
              name: file.name,
              url: event.target?.result as string,
              type: isImg ? "image" : "document"
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddUrlAttachment = () => {
    if (!newAttachmentUrl.trim()) return;
    setProofFiles((prev) => [
      ...prev,
      {
        name: `Web Link (${new URL(newAttachmentUrl).hostname || "Photo"})`,
        url: newAttachmentUrl.trim(),
        type: "image"
      }
    ]);
    setNewAttachmentUrl("");
  };

  const handleRemoveProof = (index: number) => {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newReportedBy.trim() || !villageWardText.trim()) {
      setFormError("Please fill out Title, Description, Mandal/Town, Village/Ward, and Reporter Name.");
      return;
    }

    if ((reporterType === "CADRE" || reporterType === "LEADER") && !reporterDesignation.trim()) {
      setFormError("Please specify the Leader or Cadre position/designation.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const mandalObj = FIXED_MANDALS_TOWNS.find((m) => m.id === selectedMandalId) || FIXED_MANDALS_TOWNS[0];
    const allAttachments = proofFiles.map((p) => p.url);
    if (newAttachmentUrl.trim() && !allAttachments.includes(newAttachmentUrl.trim())) {
      allAttachments.push(newAttachmentUrl.trim());
    }

    const finalDepartment = newDepartment.includes("Other")
      ? (otherDepartmentText.trim() ? `Other: ${otherDepartmentText.trim()}` : "Other Government Department")
      : newDepartment;

    try {
      const payload: Partial<FieldIssue> = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        department: finalDepartment,
        priority: newPriority,
        issueType: newIssueType,
        status: "NEW",
        stateId: currentUser.stateId || "AP",
        assemblyConstituencyId: currentUser.assemblyConstituencyId || "BNG-AC",
        assemblyConstituencyName: "Banaganapalle Assembly (AC-140)",
        mandalId: mandalObj.id,
        mandalName: mandalObj.name,
        villageId: `VIL-${mandalObj.id.replace("MDL-", "")}-${Date.now().toString().slice(-3)}`,
        villageName: villageWardText.trim(),
        placeName: newPlaceName.trim(),
        reportedBy: newReportedBy.trim(),
        reporterType: reporterType,
        reporterDesignation: reporterDesignation.trim(),
        reporterPhone: newReporterPhone.trim(),
        aadharNumber: newAadharNumber.trim(),
        schemeSubDetail: newSchemeSubDetail.trim(),
        reportedDate: new Date().toISOString().split("T")[0],
        assignedVolunteerId: currentUser.id,
        assignedVolunteerName: currentUser.name,
        assignedVolunteerPhone: currentUser.phone || "",
        directorId: currentUser.directorId || "usr-demo-director",
        directorName: currentUser.directorName || "Demo Director",
        initialRemarks: `Reported by ${reporterType} ${reporterType === "CITIZEN" && citizenAge ? `(Age: ${citizenAge}, Gender: ${citizenGender}) ` : ""}${reporterDesignation ? `(${reporterDesignation})` : ""}. Assigned to ${currentUser.name}.`,
        attachments: allAttachments,
        createdBy: currentUser.id,
        createdByRole: "VOLUNTEER"
      };

      const created = await politicalApiService.createFieldIssue(payload);
      setIssues([created, ...issues]);

      // 3. Automated Notification Dispatch: Director, MLA, and Relevant Department Person
      const notifTasks = [
        // 1. To Campaign Director
        politicalApiService.createNotification({
          recipientUserId: currentUser.directorId || "usr-demo-director",
          recipientRole: "DIRECTOR",
          type: "NEW_COMPLAINT",
          title: `New Ground ${newIssueType === "COMPLAINT" ? "Complaint" : "Requirement"} Logged`,
          message: `Volunteer ${currentUser.name} logged [${newPriority}] issue: "${newTitle.trim()}" in ${mandalObj.name} (${villageWardText.trim()}). Assigned to ${currentUser.name}.`,
          issueId: created.id,
          priority: newPriority === "URGENT" || newPriority === "HIGH" ? "HIGH" : "NORMAL"
        }),
        // 2. To Political Admin / MLA
        politicalApiService.createNotification({
          recipientUserId: "usr-demo-admin",
          recipientRole: "POLITICAL_ADMIN",
          type: "NEW_COMPLAINT",
          title: `Constituency Alert: ${newDepartment} (${newPriority})`,
          message: `[${newPriority}] ${newIssueType} recorded in ${mandalObj.name}, ${villageWardText.trim()}. Department: ${newDepartment}. Reporter: ${newReportedBy.trim()} (${reporterType}).`,
          issueId: created.id,
          priority: newPriority === "URGENT" || newPriority === "HIGH" ? "HIGH" : "NORMAL"
        }),
        // 3. To Relevant Department Person / Authority
        politicalApiService.createNotification({
          recipientUserId: `dept-officer-${newDepartment.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          recipientRole: "DEPARTMENT_OFFICER",
          type: "NEW_COMPLAINT",
          title: `Department Forwarding: ${newDepartment}`,
          message: `Official grievance ticket #${created.id} forwarded to ${newDepartment} for ground resolution in ${mandalObj.name}. Contact: ${newReporterPhone || assignedPersonPhone}.`,
          issueId: created.id,
          priority: newPriority === "URGENT" || newPriority === "HIGH" ? "HIGH" : "NORMAL"
        })
      ];

      await Promise.allSettled(notifTasks);
      setDispatchedNotifs([
        `Campaign Director (${currentUser.directorName || "Demo Director"})`,
        "Political Admin / MLA Office (B. C. Janardhan Reddy)",
        `Department Authority (${newDepartment})`
      ]);
      setSubmissionSuccess(true);

      setTimeout(() => {
        setSubmissionSuccess(false);
        setIsAddModalOpen(false);
        setDispatchedNotifs([]);
        // Reset form
        setNewTitle("");
        setNewDescription("");
        setNewPlaceName("");
        setNewReportedBy("");
        setNewReporterPhone("");
        setReporterDesignation("");
        setReporterType("CITIZEN");
        setCitizenAge("");
        setCitizenGender("Male");
        setProofFiles([]);
        setNewAttachmentUrl("");

        // Automatically open Assign & WhatsApp Notify modal for the newly created complaint!
        setAssignModalIssue(created);
      }, 1200);
    } catch (err: any) {
      setFormError(err?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset pagination to Page 1 when any filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterStatus,
    filterCategory,
    filterPriority,
    filterReporterType,
    dateFilter,
    startDate,
    endDate,
    searchQuery,
    sortBy,
    pageSize
  ]);

  // Filter & Sort issues
  const sortedAndFilteredIssues = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonthPrefix = todayStr.slice(0, 7); // "YYYY-MM"

    let list = issues.filter((item) => {
      // Status filter
      if (filterStatus === "OVERDUE" && item.status !== "OVERDUE") return false;
      if ((filterStatus === "UNRESOLVED" || filterStatus === "PENDING") && ["COMPLETED", "RESOLVED"].includes(item.status)) return false;
      if (filterStatus === "NEW" && item.status !== "NEW") return false;
      if (filterStatus === "IN_PROGRESS" && item.status !== "IN_PROGRESS") return false;
      if (filterStatus === "RESOLVED" && !["COMPLETED", "RESOLVED"].includes(item.status)) return false;

      // Category filter
      if (filterCategory !== "ALL" && item.category !== filterCategory) return false;

      // Priority filter
      if (filterPriority !== "ALL" && item.priority !== filterPriority) return false;

      // Reporter type filter
      if (filterReporterType !== "ALL" && item.reporterType !== filterReporterType) return false;

      // Date filter
      const itemDate = item.reportedDate || (item.createdAt ? item.createdAt.split("T")[0] : "");

      if (dateFilter === "TODAY") {
        if (itemDate !== todayStr) return false;
      } else if (dateFilter === "7DAYS") {
        const d = new Date(itemDate || item.createdAt);
        if (d < sevenDaysAgo) return false;
      } else if (dateFilter === "THIS_MONTH") {
        if (!itemDate.startsWith(thisMonthPrefix)) return false;
      } else if (dateFilter === "CUSTOM") {
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.villageName || "").toLowerCase().includes(q) ||
          (item.placeName || "").toLowerCase().includes(q) ||
          (item.mandalName || "").toLowerCase().includes(q) ||
          item.reportedBy.toLowerCase().includes(q) ||
          (item.reporterPhone || "").includes(q) ||
          (item.department || "").toLowerCase().includes(q)
        );
      }

      return true;
    });

    // Apply Sorting
    return list.sort((a, b) => {
      if (sortBy === "NEWEST") {
        return new Date(b.createdAt || b.reportedDate).getTime() - new Date(a.createdAt || a.reportedDate).getTime();
      }
      if (sortBy === "OLDEST") {
        return new Date(a.createdAt || a.reportedDate).getTime() - new Date(b.createdAt || b.reportedDate).getTime();
      }
      if (sortBy === "DUE_DATE") {
        return new Date(a.dueDate || "9999-12-31").getTime() - new Date(b.dueDate || "9999-12-31").getTime();
      }
      if (sortBy === "PRIORITY") {
        const weights: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (weights[b.priority] || 0) - (weights[a.priority] || 0);
      }
      if (sortBy === "TITLE") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "STATUS") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  }, [
    issues,
    filterStatus,
    filterCategory,
    filterPriority,
    filterReporterType,
    dateFilter,
    startDate,
    endDate,
    searchQuery,
    sortBy
  ]);

  // Paginated Slicing
  const totalPages = Math.ceil(sortedAndFilteredIssues.length / pageSize) || 1;
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAndFilteredIssues.slice(start, start + pageSize);
  }, [sortedAndFilteredIssues, currentPage, pageSize]);

  const hasActiveFilters =
    filterStatus !== "ALL" ||
    filterCategory !== "ALL" ||
    filterPriority !== "ALL" ||
    filterReporterType !== "ALL" ||
    dateFilter !== "ALL" ||
    searchQuery.trim().length > 0 ||
    sortBy !== "NEWEST";

  const clearAllFilters = () => {
    setFilterStatus("ALL");
    setFilterCategory("ALL");
    setFilterPriority("ALL");
    setFilterReporterType("ALL");
    setDateFilter("ALL");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setSortBy("NEWEST");
  };

  const handleAssignVolunteer = async (issueId: string, newVolunteerId: string) => {
    const selectedVol = volunteers.find((v) => v.id === newVolunteerId);
    const newVolName = selectedVol ? selectedVol.name : newVolunteerId === currentUser.id ? currentUser.name : "Unassigned";

    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          return {
            ...item,
            assignedVolunteerId: newVolunteerId || undefined,
            assignedVolunteerName: newVolName,
            status: item.status === "NEW" && newVolunteerId ? "ASSIGNED" : item.status,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      })
    );

    try {
      await politicalApiService.updateFieldIssueStatus(issueId, {
        assignedVolunteerId: newVolunteerId || undefined,
        assignedVolunteerName: newVolName,
        status: "ASSIGNED",
        remarks: `Assigned to ${newVolName}`
      });
    } catch (e) {
      console.warn("Assignment update fallback handled locally", e);
    }
  };

  const handleAssignDepartment = async (issueId: string, newDept: string, officialName?: string, officialPhone?: string) => {
    let finalDept = newDept;
    if (newDept === "Other Government Department") {
      const customText = prompt("Specify custom Government Department details:");
      if (customText && customText.trim()) {
        finalDept = `Other: ${customText.trim()}`;
      }
    }

    const baseDeptObj = PGRS_DEPARTMENTS_LIST.find((d: any) =>
      typeof d === "string"
        ? d.toLowerCase().includes(finalDept.toLowerCase())
        : (d.name || "").toLowerCase().includes(finalDept.toLowerCase()) || finalDept.toLowerCase().includes((d.name || "").split("(")[0].trim().toLowerCase())
    );
    const baseDept = baseDeptObj ? (typeof baseDeptObj === "string" ? baseDeptObj : baseDeptObj.name) : finalDept;

    setIssues((prev: FieldIssue[]) =>
      prev.map((item: FieldIssue) => {
        if (item.id === issueId) {
          return {
            ...item,
            department: baseDept,
            assignedDepartment: baseDept,
            assignedOfficialName: officialName || item.assignedOfficialName || "",
            assignedOfficialPhone: officialPhone || item.assignedOfficialPhone || "",
            status: "ASSIGNED",
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      })
    );

    try {
      const savedRaw = localStorage.getItem("leaders_lens_created_field_issues");
      if (savedRaw) {
        const savedList = JSON.parse(savedRaw);
        const updated = savedList.map((i: any) => {
          if (i.id === issueId) {
            return {
              ...i,
              department: baseDept,
              assignedDepartment: baseDept,
              assignedOfficialName: officialName || i.assignedOfficialName || "",
              assignedOfficialPhone: officialPhone || i.assignedOfficialPhone || "",
              status: "ASSIGNED",
              updatedAt: new Date().toISOString()
            };
          }
          return i;
        });
        localStorage.setItem("leaders_lens_created_field_issues", JSON.stringify(updated));
      }
    } catch (e) {}

    try {
      await politicalApiService.updateFieldIssueStatus(issueId, {
        department: baseDept,
        status: "ASSIGNED",
        assignedOfficialName: officialName,
        assignedOfficialPhone: officialPhone,
        remarks: `Department assigned to ${baseDept}`
      });
    } catch (e) {
      console.warn("Department update error", e);
    }
  };

  const getTicketTimingDetails = (issue: FieldIssue) => {
    const regDateRaw = issue.createdAt || issue.reportedDate;
    const regDateObj = new Date(regDateRaw);
    const isValidReg = !isNaN(regDateObj.getTime());

    const registeredTimeFormatted = isValidReg
      ? regDateObj.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        })
      : issue.reportedDate;

    const isClosed = issue.status === "COMPLETED" || issue.status === "RESOLVED";
    const closeDateRaw = issue.completedDate || issue.updatedDate || issue.updatedAt || issue.lastStatusUpdateAt;
    const closeDateObj = closeDateRaw ? new Date(closeDateRaw) : new Date();
    const isValidClose = !isNaN(closeDateObj.getTime());

    const closedTimeFormatted = isClosed
      ? isValidClose
        ? closeDateObj.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })
        : issue.completedDate || "Resolved"
      : "In Progress";

    const startTime = isValidReg ? regDateObj.getTime() : new Date(issue.reportedDate).getTime();
    const endTime = isClosed
      ? isValidClose
        ? closeDateObj.getTime()
        : Date.now()
      : Date.now();

    const diffMs = Math.max(0, endTime - startTime);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    let durationText = "";
    if (diffDays > 0) {
      durationText = `${diffDays}d ${remainingHours}h`;
    } else if (diffHours > 0) {
      durationText = `${diffHours} hrs`;
    } else {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      durationText = `${diffMins} mins`;
    }

    return {
      registeredTimeFormatted,
      closedTimeFormatted,
      isClosed,
      durationText,
      totalHours: diffHours
    };
  };

  // If an issue is selected, display the full-page dedicated IssueDetailView
  if (selectedIssue) {
    return (
      <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6">
        <IssueDetailView
          issue={selectedIssue}
          currentUser={currentUser}
          onBack={() => setSelectedIssue(null)}
          onIssueUpdated={loadVolunteerData}
        />
      </div>
    );
  }

  const isAssignTicketsMode = window.location.hash.toLowerCase().includes("assign");

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6 space-y-5 text-[#F5EFE0]">
      {!isAssignTicketsMode ? (
        /* SCREENSHOT 1 ONLY: Ground Intake View */
        <div className="space-y-5">
          {/* 1. Volunteer Header Strip with all Assigned Geography Details moved to Top */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#071322]/45 backdrop-blur-xl border border-[#D4A24C]/40 shadow-2xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Volunteer Avatar & Main Name */}
              <div className="flex items-start sm:items-center gap-4">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#D4A24C] shadow-lg flex-shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#071322]/70 text-[#D4A24C] border border-[#D4A24C]/40 font-mono">
                      FIELD VOLUNTEER
                    </span>
                    <span className="text-xs font-semibold text-[#D4A24C] bg-[#142B45]/70 px-2.5 py-0.5 rounded-full border border-[#D4A24C]/25">
                      Banaganapalle AC (AC-140) · Nandyala PC
                    </span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl text-[#F5EFE0] font-normal leading-tight">
                    {currentUser.name}
                  </h1>
                </div>
              </div>

              {/* "+ Add Complaint / Requirement" Primary Action Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                data-testid="add-complaint-btn"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] font-bold text-xs sm:text-sm hover:brightness-110 transition-all shadow-[0_6px_25px_-5px_rgba(224,122,31,0.6)] cursor-pointer self-start lg:self-center"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Complaint / Requirement</span>
              </button>
            </div>

            {/* Assigned Details integrated directly at the top */}
            <div className="pt-3 border-t border-[#22405E]/60 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#071322]/60 border border-[#22405E] text-[#D8CFB8]">
                <Building2 className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span>Mandal / Town:</span>
                <strong className="text-[#F5EFE0]">{currentUser.assignedMandalName || "Banaganapalle Town"}</strong>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#071322]/60 border border-[#22405E] text-[#D8CFB8]">
                <MapPin className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span>Assigned Wards / Villages:</span>
                <strong className="text-[#F5EFE0]">
                  {currentUser.assignedVillageNames?.join(", ") || "Banaganapalle Town Wards 1-10, Yaganti Sector"}
                </strong>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#071322]/60 border border-[#22405E] text-[#D8CFB8]">
                <User className="w-3.5 h-3.5 text-[#D4A24C]" />
                <span>Supervising Manager:</span>
                <strong className="text-[#D4A24C]">{currentUser.directorName?.replace("Director", "Manager") || "Demo Manager"}</strong>
              </div>
            </div>
          </div>

          {/* 📊 Ticket Assignment & Status Metric Summary Bar (KPI Counters - Screenshot 1) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-2xl bg-[#091422] border border-[#22354D] shadow-xl">
            <div
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("ALL");
                setFilterPriority("ALL");
                setFilterReporterType("ALL");
                setDateFilter("ALL");
                setFilterStatus("ALL");
                window.location.hash = "#/assign-tickets?status=ALL";
              }}
              className="p-3.5 rounded-xl border border-[#22354D] bg-[#0F1E30] hover:border-[#D4A24C]/60 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10.5px] font-mono font-semibold uppercase text-[#8E9CAE] block truncate">
                Total Tickets
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[#D4A24C]">{issues.length}</span>
                <span className="text-[10px] text-[#8E9CAE] font-mono font-semibold">All</span>
              </div>
            </div>

            <div
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("ALL");
                setFilterPriority("ALL");
                setFilterReporterType("ALL");
                setDateFilter("ALL");
                setFilterStatus("UNRESOLVED");
                window.location.hash = "#/assign-tickets?status=UNRESOLVED";
              }}
              className="p-3.5 rounded-xl border border-[#22354D] bg-[#0F1E30] hover:border-amber-500/60 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10.5px] font-mono font-semibold uppercase text-amber-400 block truncate">
                Unresolved / Pending
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-amber-300">
                  {issues.filter((i) => ["NEW", "ASSIGNED", "ACKNOWLEDGED", "OVERDUE"].includes(i.status)).length}
                </span>
                <span className="text-[10px] text-amber-400/80 font-mono font-semibold">Action</span>
              </div>
            </div>

            <div
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("ALL");
                setFilterPriority("ALL");
                setFilterReporterType("ALL");
                setDateFilter("ALL");
                setFilterStatus("NEW");
                window.location.hash = "#/assign-tickets?status=NEW";
              }}
              className="p-3.5 rounded-xl border border-[#22354D] bg-[#0F1E30] hover:border-yellow-500/60 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10.5px] font-mono font-semibold uppercase text-yellow-400 block truncate">
                🟡 New Complaints
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-yellow-300">
                  {issues.filter((i) => i.status === "NEW").length}
                </span>
                <span className="text-[10px] text-yellow-400/80 font-mono font-semibold">New</span>
              </div>
            </div>

            <div
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("ALL");
                setFilterPriority("ALL");
                setFilterReporterType("ALL");
                setDateFilter("ALL");
                setFilterStatus("IN_PROGRESS");
                window.location.hash = "#/assign-tickets?status=IN_PROGRESS";
              }}
              className="p-3.5 rounded-xl border border-[#22354D] bg-[#0F1E30] hover:border-sky-500/60 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10.5px] font-mono font-semibold uppercase text-sky-400 block truncate">
                🔵 In Progress
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-sky-300">
                  {issues.filter((i) => i.status === "IN_PROGRESS").length}
                </span>
                <span className="text-[10px] text-sky-400/80 font-mono font-semibold">Ground</span>
              </div>
            </div>

            <div
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("ALL");
                setFilterPriority("ALL");
                setFilterReporterType("ALL");
                setDateFilter("ALL");
                setFilterStatus("OVERDUE");
                window.location.hash = "#/assign-tickets?status=OVERDUE";
              }}
              className="p-3.5 rounded-xl border border-[#22354D] bg-[#0F1E30] hover:border-rose-500/60 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10.5px] font-mono font-semibold uppercase text-rose-400 block truncate">
                🔴 Overdue Alerts
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-rose-300">
                  {issues.filter((i) => i.status === "OVERDUE").length}
                </span>
                <span className="text-[10px] text-rose-400/80 font-mono font-semibold">Urgent</span>
              </div>
            </div>

            <div
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("ALL");
                setFilterPriority("ALL");
                setFilterReporterType("ALL");
                setDateFilter("ALL");
                setFilterStatus("RESOLVED");
                window.location.hash = "#/assign-tickets?status=RESOLVED";
              }}
              className="p-3.5 rounded-xl border border-[#22354D] bg-[#0F1E30] hover:border-emerald-500/60 cursor-pointer space-y-1 transition-all"
            >
              <span className="text-[10.5px] font-mono font-semibold uppercase text-emerald-400 block truncate">
                🟢 Resolved / Closed
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-emerald-300">
                  {issues.filter((i) => i.status === "COMPLETED" || i.status === "RESOLVED").length}
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono font-semibold">Closed</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SCREENSHOT 2: Full Assign Tickets / Complaints Stream */
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#091422] border border-[#22354D]">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D4A24C]" />
              <h2 className="text-base font-bold font-display text-[#F5EFE0]">🏛️ Assign Tickets / Complaints</h2>
            </div>
            <button
              onClick={() => {
                setFilterStatus("ALL");
                window.location.hash = "#/field-ops";
              }}
              className="text-xs text-[#D4A24C] hover:underline font-semibold cursor-pointer"
            >
              ← Back to Ground Intake
            </button>
          </div>

          {/* 2. Filter & Sort Master Toolbar */}
          <div className="p-4 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#223348] shadow-lg space-y-3">
        {/* Row 1: Search, Sort & View Mode */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
            <input
              type="text"
              placeholder="Search by ID, title, citizen, village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] focus:border-[#D4A24C] rounded-xl pl-9 pr-8 py-2.5 text-xs text-[#F5EFE0] placeholder-[#5F6875] outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E9CAE] hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 w-full lg:w-auto">
            {/* Sort Options Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#0B131E] border border-[#223348] rounded-xl px-3 py-1.5 text-xs">
              <span className="text-[10.5px] uppercase font-semibold text-[#8E9CAE] hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[#F5EFE0] text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="NEWEST" className="bg-[#0B131E]">Newest Reported First</option>
                <option value="OLDEST" className="bg-[#0B131E]">Oldest Reported First</option>
                <option value="DUE_DATE" className="bg-[#0B131E]">Earliest Due (Urgent SLA)</option>
                <option value="PRIORITY" className="bg-[#0B131E]">Highest Priority (Urgent → Low)</option>
                <option value="STATUS" className="bg-[#0B131E]">By Lifecycle Status</option>
                <option value="TITLE" className="bg-[#0B131E]">Alphabetical Title (A → Z)</option>
              </select>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 bg-[#0B131E] border border-[#223348] rounded-xl px-3 py-1.5 text-xs">
              <span className="text-[10.5px] uppercase font-semibold text-[#8E9CAE] hidden sm:inline">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-transparent text-[#D4A24C] font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value={10} className="bg-[#0B131E]">10 / page</option>
                <option value={25} className="bg-[#0B131E]">25 / page</option>
                <option value={50} className="bg-[#0B131E]">50 / page</option>
                <option value={100} className="bg-[#0B131E]">100 / page</option>
              </select>
            </div>

            {/* Grid vs Table View Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-[#0B131E] border border-[#223348] text-xs">
              <button
                onClick={() => setViewMode("GRID")}
                title="Grid Cards View"
                className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "GRID"
                    ? "bg-[#D4A24C] text-[#0B131E] font-bold shadow-sm"
                    : "text-[#CBD5E1] hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("TABLE")}
                title="Data Table View"
                className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "TABLE"
                    ? "bg-[#D4A24C] text-[#0B131E] font-bold shadow-sm"
                    : "text-[#CBD5E1] hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Granular Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                const val = e.target.value;
                setFilterStatus(val);
                if (isAssignTicketsMode) {
                  window.location.hash = `#/assign-tickets?status=${val}`;
                }
              }}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Status: All (Total Records)</option>
              <option value="UNRESOLVED">Status: 🟠 Unresolved / Pending</option>
              <option value="NEW">Status: 🟡 New Only</option>
              <option value="IN_PROGRESS">Status: 🔵 In Progress</option>
              <option value="RESOLVED">Status: 🟢 Resolved / Completed</option>
              <option value="OVERDUE">Status: 🔴 Overdue</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Category: All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Priority: All</option>
              <option value="URGENT">🔴 Urgent</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🟢 Low</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Date: All Time</option>
              <option value="TODAY">Date: Today</option>
              <option value="7DAYS">Date: Past 7 Days</option>
              <option value="THIS_MONTH">Date: This Month</option>
              <option value="CUSTOM">Date: Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker when CUSTOM is active */}
        {dateFilter === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-[#0B131E] border border-[#D4A24C]/40 text-xs animate-fadeIn">
            <span className="text-[10px] uppercase text-[#D4A24C] font-semibold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#070D15] border border-[#223348] focus:border-[#D4A24C] text-[#F5EFE0] px-2.5 py-1.5 rounded-lg text-xs outline-none"
            />
            <span className="text-[10px] uppercase text-[#D4A24C] font-semibold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#070D15] border border-[#223348] focus:border-[#D4A24C] text-[#F5EFE0] px-2.5 py-1.5 rounded-lg text-xs outline-none"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-rose-400 hover:text-rose-200 text-xs font-semibold underline ml-1"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}

        {/* Row 3: Active Filter Chips & Clear All */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#223348]/70 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-semibold text-[#8E9CAE]">Active Filters:</span>
              {filterStatus !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Status: {filterStatus}
                </span>
              )}
              {filterCategory !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Category: {filterCategory}
                </span>
              )}
              {filterPriority !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Priority: {filterPriority}
                </span>
              )}
              {dateFilter !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Date: {dateFilter}
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Query: &quot;{searchQuery}&quot;
                </span>
              )}
            </div>

            <button
              onClick={clearAllFilters}
              className="text-[#D4A24C] hover:underline font-semibold text-[11px] cursor-pointer"
            >
              Reset / Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Submitted Issues Feed: Grid or Table View */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#8E9CAE] bg-[#0E1724]/75 rounded-2xl border border-[#223348]">
            Loading submitted complaints...
          </div>
        ) : sortedAndFilteredIssues.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#8E9CAE] bg-[#0E1724]/75 rounded-2xl border border-[#223348] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#131E2D] text-[#D4A24C] flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-base text-[#F5EFE0] font-semibold">No complaints found matching current filters</p>
            <p className="text-xs text-[#8E9CAE]">
              Try clearing filters or click &quot;+ Add Complaint / Requirement&quot; to log a new issue.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] font-bold text-xs cursor-pointer shadow-md"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === "GRID" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedIssues.map((issue) => {
              const timing = getTicketTimingDetails(issue);

              return (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className="p-5 rounded-2xl bg-[#0E1724] border border-[#223348] hover:border-[#D4A24C]/60 hover:bg-[#131E2D] transition-all space-y-3 cursor-pointer shadow-lg group"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[#D4A24C] font-semibold">
                      #{issue.id}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/25">
                        {issue.category}
                      </span>
                      {issue.department && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#0B131E] text-[#8E9CAE] border border-[#223348]">
                          {issue.department.split("(")[0]}
                        </span>
                      )}
                      <span
                        className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          issue.priority === "URGENT" || issue.priority === "HIGH"
                            ? "bg-rose-950/80 text-rose-300 border border-rose-600/40"
                            : "bg-[#0B131E] text-[#B9AF95] border border-[#223348]"
                        }`}
                      >
                        {issue.priority}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#F5EFE0] line-clamp-1 group-hover:text-[#D4A24C] transition-colors">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-[#A69B80] line-clamp-2 mt-1 leading-relaxed">
                      {issue.description}
                    </p>
                    {issue.schemeSubDetail && (
                      <div className="text-[11px] font-semibold text-[#D4A24C] bg-[#142B45]/80 border border-[#D4A24C]/30 px-2.5 py-0.5 rounded-md inline-block mt-1.5">
                        📋 Scheme Details: {issue.schemeSubDetail}
                      </div>
                    )}
                  </div>

                  {/* Registered & Closed Timestamps + Duration Chip */}
                  <div className="p-2 rounded bg-[#070D15] border border-[#223348] flex items-center justify-between text-[10.5px] font-mono">
                    <div>
                      <span className="text-[#8E9CAE] block text-[9.5px]">Reg: {timing.registeredTimeFormatted}</span>
                      {timing.isClosed ? (
                        <span className="text-emerald-400 font-semibold block text-[9.5px]">Done: {timing.closedTimeFormatted}</span>
                      ) : (
                        <span className="text-amber-400 block font-semibold text-[9.5px]">Status: Open</span>
                      )}
                    </div>
                    <div
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                        timing.isClosed
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                          : issue.status === "OVERDUE"
                          ? "bg-rose-950/80 text-rose-300 border-rose-500/40 animate-pulse"
                          : "bg-blue-950/80 text-blue-300 border-blue-500/40"
                      }`}
                    >
                      {timing.isClosed ? `⏱️ Closed in ${timing.durationText}` : `⏱️ Open ${timing.durationText}`}
                    </div>
                  </div>

                  {/* Location & Reporter Details */}
                  <div className="pt-2 border-t border-[#223348]/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[#8E9CAE]">
                      <span className="flex items-center gap-1.5 text-[#F5EFE0] truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                        <strong>{issue.mandalName}</strong> · {issue.villageName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8E9CAE] pt-1">
                      <div>
                        <span>
                          Reported by: <strong className="text-[#D8CFB8]">{issue.reportedBy}</strong>
                          {issue.reporterDesignation ? ` (${issue.reporterDesignation})` : ""}
                        </span>
                      </div>
                      {issue.attachments && issue.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[#D4A24C] font-mono shrink-0">
                          <Paperclip className="w-3 h-3" />
                          {issue.attachments.length} {issue.attachments.length === 1 ? "Proof" : "Proofs"}
                        </span>
                      )}
                    </div>

                    {/* Direct Assign Complaint (Government Department) */}
                    {(() => {
                      const isAssignmentDisabled =
                        issue.status === "IN_PROGRESS" ||
                        issue.status === "COMPLETED" ||
                        issue.status === "RESOLVED" ||
                        issue.status === "CANT_BE_DONE" ||
                        (issue as any).status === "Can't be done";

                      const isAssignTabActive = filterStatus === "NEW" || window.location.hash.includes("assign-tickets");

                      if (!isAssignTabActive || isAssignmentDisabled) {
                        const isUnresolved = issue.status !== "COMPLETED" && issue.status !== "RESOLVED";
                        return (
                          <div className="space-y-1.5 pt-2 border-t border-[#223348]/40">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#8E9CAE]">Category: <strong className="text-[#D4A24C] font-semibold">{issue.category}</strong></span>
                              <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded ${
                                isUnresolved ? "bg-amber-950/80 text-amber-300 border border-amber-500/40" : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                              }`}>
                                {isUnresolved ? "🟡 Unresolved" : "🟢 Resolved"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[#8E9CAE] gap-2 pt-1">
                              <span className="text-[10.5px] font-bold text-[#D4A24C] shrink-0 flex items-center gap-1">
                                <span>🏛️</span> Assigned Dept:
                              </span>
                              <span className="text-[11px] font-semibold text-[#F5EFE0] bg-[#070D15] border border-[#223348] rounded-lg px-2.5 py-1 truncate max-w-[200px]" title={issue.department || "General Administration"}>
                                {issue.department || "General Administration"}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1.5 pt-1 border-t border-[#223348]/40" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between text-[10.5px] text-[#8E9CAE]">
                            <span>Category: <strong className="text-[#D4A24C] font-semibold">{issue.category}</strong></span>
                            <span className="text-[10px] text-amber-400 font-mono font-bold">Unresolved</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10.5px] font-bold text-[#D4A24C] shrink-0 flex items-center gap-1">
                              <span>🏛️</span> Assign Complaint:
                            </span>
                            <select
                              value={issue.department || ""}
                              onChange={(e) => handleAssignDepartment(issue.id, e.target.value)}
                              className="bg-[#070D15] text-[#F5EFE0] text-[11px] font-medium border border-[#223348] focus:border-[#D4A24C] rounded-lg px-2 py-1 outline-none cursor-pointer truncate max-w-[190px]"
                            >
                              <option value="">-- Select Department --</option>
                              {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAssignModalIssue(issue)}
                            className="w-full mt-1.5 py-1.5 px-3 rounded-xl bg-[#4A3D22] hover:bg-[#5E4D2B] text-[#F5EFE0] text-[11px] font-bold border border-[#D4A24C]/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                            Assign & Notify on WhatsApp
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-2xl bg-[#0E1724] border border-[#223348] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B131E] border-b border-[#223348] text-[#D4A24C] uppercase text-[10.5px] font-semibold tracking-wider">
                    <th className="py-3.5 px-3 w-[10%] font-mono">ID & Status</th>
                    <th className="py-3.5 px-3 w-[24%]">Issue Title & Scope</th>
                    <th className="py-3.5 px-3 w-[13%]">Category / Dept</th>
                    <th className="py-3.5 px-3 w-[13%]">Mandal / Location</th>
                    <th className="py-3.5 px-3 w-[12%]">Reported By</th>
                    <th className="py-3.5 px-3 w-[16%]">Assign & Notify (WhatsApp)</th>
                    <th className="py-3.5 px-3 w-[14%]">Timeline & Duration</th>
                    <th className="py-3.5 px-3 w-[0%] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#223348]/50">
                  {paginatedIssues.map((issue) => {
                    const timing = getTicketTimingDetails(issue);
                    const isAssignmentDisabled =
                      issue.status === "IN_PROGRESS" ||
                      issue.status === "COMPLETED" ||
                      issue.status === "RESOLVED" ||
                      issue.status === "CANT_BE_DONE" ||
                      (issue as any).status === "Can't be done";

                    return (
                      <tr
                        key={issue.id}
                        onClick={() => setSelectedIssue(issue)}
                        className="hover:bg-[#131E2D]/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-3 align-top font-mono">
                          <div className="font-bold text-[#D4A24C]">#{issue.id}</div>
                          <div className="mt-1">
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block ${
                                issue.status === "COMPLETED" || issue.status === "RESOLVED"
                                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                  : issue.status === "IN_PROGRESS"
                                  ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                                  : issue.status === "OVERDUE"
                                  ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                                  : "bg-blue-950/60 text-blue-300 border-blue-500/40"
                              }`}
                            >
                              {issue.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="font-semibold text-[#F5EFE0] group-hover:text-[#D4A24C] transition-colors break-words leading-snug">
                            {issue.title}
                          </div>
                          <div className="text-[11px] text-[#8E9CAE] break-words mt-1 leading-relaxed">
                            {issue.description}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="font-medium text-[#D8CFB8] break-words">{issue.category}</div>
                          {issue.department && (
                            <div className="text-[10.5px] text-[#8E9CAE] break-words mt-0.5">{issue.department.split("(")[0]}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="text-[#F5EFE0] font-medium break-words">{issue.mandalName}</div>
                          <div className="text-[10.5px] text-[#8E9CAE] break-words mt-0.5">📍 {issue.villageName}</div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="text-[#F5EFE0] font-medium break-words">{issue.reportedBy}</div>
                          <div className="text-[10.5px] text-[#D4A24C] break-words mt-0.5">
                            {issue.reporterType === "LEADER" ? "Leader" : issue.reporterType === "CADRE" ? "Cadre" : "Citizen"}
                          </div>
                        </td>
                        {/* Assign Complaint / Resolved Department & WhatsApp Action */}
                        <td className="py-3 px-3 align-top" onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const isAssignTabActive = filterStatus === "NEW" || window.location.hash.includes("assign-tickets");
                            const isUnresolved = issue.status !== "COMPLETED" && issue.status !== "RESOLVED";

                            if (!isAssignTabActive || isAssignmentDisabled) {
                              return (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                                      <span>🏛️</span> Assigned Dept
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                      isUnresolved ? "bg-amber-950 text-amber-300 border border-amber-500/40" : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                                    }`}>
                                      {isUnresolved ? "Unresolved" : "Resolved"}
                                    </span>
                                  </div>
                                  <div className="text-[11.5px] font-semibold text-[#F5EFE0] bg-[#070D15] border border-[#223348] rounded-lg px-2.5 py-1.5 break-words">
                                    {issue.department || "General Administration"}
                                  </div>
                                  <div className="text-[10px] text-[#8E9CAE] mt-1">
                                    Category: <span className="text-[#CBD5E1] font-medium">{issue.category}</span>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-1">
                                <select
                                  value={issue.department || ""}
                                  onChange={(e) => handleAssignDepartment(issue.id, e.target.value)}
                                  className="w-full bg-[#070D15] text-[#F5EFE0] text-[11px] font-medium border border-[#223348] focus:border-[#D4A24C] rounded-lg px-1.5 py-1 outline-none cursor-pointer"
                                >
                                  <option value="">-- Select Department --</option>
                                  {DEPARTMENTS.map((dept) => (
                                    <option key={dept} value={dept}>
                                      {dept}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => setAssignModalIssue(issue)}
                                  className="w-full py-1 px-2 rounded-lg bg-[#4A3D22] hover:bg-[#5E4D2B] text-[#F5EFE0] text-[10.5px] font-bold border border-[#D4A24C]/40 flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                                  Assign & WhatsApp
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                        {/* Timeline & Duration */}
                        <td className="py-3 px-3 align-top font-mono text-[10.5px]">
                          <div className="text-[#CBD5E1]">
                            <span className="text-[#8E9CAE]">Reg: </span>
                            {timing.registeredTimeFormatted}
                          </div>
                          <div className="mt-0.5">
                            {timing.isClosed ? (
                              <span className="text-emerald-400 font-semibold">Done: {timing.closedTimeFormatted}</span>
                            ) : (
                              <span className="text-amber-400/90 font-semibold">Status: Open</span>
                            )}
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase border ${
                                timing.isClosed
                                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                                  : issue.status === "OVERDUE"
                                  ? "bg-rose-950/80 text-rose-300 border-rose-500/40 animate-pulse"
                                  : "bg-blue-950/80 text-blue-300 border-blue-500/40"
                              }`}
                            >
                              ⏱️ {timing.isClosed ? `Closed in ${timing.durationText}` : `Open ${timing.durationText}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIssue(issue);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#131E2D] hover:bg-[#1E3048] text-[#D4A24C] text-[11px] font-semibold border border-[#D4A24C]/30 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Global Pagination Bar */}
        {sortedAndFilteredIssues.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:px-5 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#223348] text-xs">
            <div className="text-[#8E9CAE] font-mono text-center sm:text-left">
              Showing{" "}
              <strong className="text-[#F5EFE0]">
                {(currentPage - 1) * pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-[#F5EFE0]">
                {Math.min(currentPage * pageSize, sortedAndFilteredIssues.length)}
              </strong>{" "}
              of{" "}
              <strong className="text-[#D4A24C]">
                {sortedAndFilteredIssues.length}
              </strong>{" "}
              records
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First Page"
                className="p-1.5 px-2.5 rounded-lg bg-[#0B131E] border border-[#223348] text-[#CBD5E1] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Previous Page"
                className="p-1.5 px-2.5 rounded-lg bg-[#0B131E] border border-[#223348] text-[#CBD5E1] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={p}>
                        {prev && p - prev > 1 && (
                          <span className="px-1 text-[#8E9CAE]">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
                            currentPage === p
                              ? "bg-[#D4A24C] text-[#0B131E] shadow-sm"
                              : "bg-[#0B131E] border border-[#223348] text-[#CBD5E1] hover:text-white"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Next Page"
                className="p-1.5 px-2.5 rounded-lg bg-[#0B131E] border border-[#223348] text-[#CBD5E1] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Last Page"
                className="p-1.5 px-2.5 rounded-lg bg-[#0B131E] border border-[#223348] text-[#CBD5E1] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
      )}

      {/* 4. Complete Intake Modal: "Log New Citizen Complaint / Requirement" */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="relative bg-[#0B1A2C] border border-[#D4A24C]/50 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-[#F5EFE0] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#22405E] bg-[#0F2338] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#142B45] border border-[#D4A24C]/40 flex items-center justify-center text-[#D4A24C] shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] font-mono block">
                    GROUND FIELD INTAKE · {currentUser.assignedConstituency || "CONSTITUENCY FIELD FORCE"}
                  </span>
                  <h3 className="font-display text-base sm:text-xl text-[#F5EFE0] leading-tight">
                    Log New Citizen Complaint / Requirement
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 rounded-full bg-[#142B45] hover:bg-rose-950/80 border border-[#22405E] hover:border-rose-500 text-[#D8CFB8] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ml-2"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form with Scrollable Body & Sticky Footer */}
            <form onSubmit={handleCreateComplaint} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
                {/* Immutability Notice */}
                <div className="p-3 rounded-xl bg-[#071322] border border-[#D4A24C]/30 flex items-center gap-2.5 text-[11.5px] text-[#D8CFB8]">
                  <Lock className="w-4 h-4 text-[#D4A24C] shrink-0" />
                  <span>
                    <strong>Important:</strong> Once submitted, the original complaint details become permanently locked to maintain audit integrity.
                  </span>
                </div>

                {formError && (
                  <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/40 text-red-300 text-xs">
                    {formError}
                  </div>
                )}

                {submissionSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs space-y-1 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Complaint Recorded & Locked Successfully!
                    </div>
                    <div className="text-[11px] text-emerald-300/90 pl-6 space-y-0.5">
                      <p className="font-semibold text-[#D4A24C]">🔔 Instant Notifications Dispatched To:</p>
                      <p>• Campaign Director ({currentUser.directorName || "Demo Director"})</p>
                      <p>• MLA & Political Admin (B. C. Janardhan Reddy)</p>
                      <p>• Relevant Department Authority ({newDepartment})</p>
                    </div>
                  </div>
                )}

                {/* 1. Issue Title */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                    Issue Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter issue headline (e.g. Drinking Water Pipeline Leakage)..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#071322] border border-[#22405E] rounded-xl px-3.5 py-2.5 text-sm text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                  />
                </div>

                {/* 2. Department Selection (PGRS 17 Departments + Other) */}
                <div className="space-y-3 p-4 rounded-xl bg-[#071322]/80 border border-[#22405E]">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Department / శాఖ (PGRS 17 Departments) *
                    </label>
                    <select
                      value={newDepartment}
                      onChange={(e) => {
                        const dept = e.target.value;
                        setNewDepartment(dept);
                        setNewCategory(dept.split(".")[1]?.trim() || dept);
                        const foundItem = PGRS_DEPARTMENTS_LIST.find((d) => d.name === dept);
                        if (foundItem && foundItem.subDetails.length > 0) {
                          setNewSchemeSubDetail(foundItem.subDetails[0]);
                        } else {
                          setNewSchemeSubDetail("");
                        }
                      }}
                      className="w-full bg-[#0B1A2C] border border-[#22405E] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none font-medium cursor-pointer"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>

                    {/* Dynamic Scheme / Work Sub-Details Dropdown */}
                    {(() => {
                      const foundItem = PGRS_DEPARTMENTS_LIST.find((d) => d.name === newDepartment);
                      if (foundItem && foundItem.subDetails.length > 0) {
                        return (
                          <div className="mt-2.5 animate-fadeIn">
                            <label className="block text-[10.5px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                              Scheme / Work Sub-Details / పథకం వివరాలు *
                            </label>
                            <select
                              value={newSchemeSubDetail}
                              onChange={(e) => setNewSchemeSubDetail(e.target.value)}
                              className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] outline-none font-medium cursor-pointer"
                            >
                              {foundItem.subDetails.map((sub) => (
                                <option key={sub} value={sub}>
                                  {sub}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {newDepartment.includes("Other") && (
                      <div className="mt-2.5 animate-fadeIn">
                        <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                          Specify Other Government Department Details / ఇతర వివరాలు *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter specific department / office name in English or Telugu..."
                          value={otherDepartmentText}
                          onChange={(e) => setOtherDepartmentText(e.target.value)}
                          className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Priority & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Priority *
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none cursor-pointer"
                    >
                      <option value="LOW">LOW — Minor maintenance</option>
                      <option value="MEDIUM">MEDIUM — Normal community matter</option>
                      <option value="HIGH">HIGH — Critical public disruption</option>
                      <option value="URGENT">URGENT — Affecting hospital / school / safety</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Intake Type
                    </label>
                    <select
                      value={newIssueType}
                      onChange={(e) => setNewIssueType(e.target.value as any)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none cursor-pointer"
                    >
                      <option value="COMPLAINT">COMPLAINT (Grievance / Broken Civic Asset)</option>
                      <option value="REQUIREMENT">REQUIREMENT (New Need / Community Proposal)</option>
                    </select>
                  </div>
                </div>

                {/* 5, 6, 7 & 8. Location */}
                <div className="p-4 rounded-xl bg-[#071322]/80 border border-[#22405E] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#22405E] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D4A24C] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Location
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Fixed Mandal / Town Selector */}
                    <div>
                      <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                        Mandal / Town *
                      </label>
                      <select
                        value={selectedMandalId}
                        onChange={(e) => setSelectedMandalId(e.target.value)}
                        className="w-full bg-[#0B1A2C] border border-[#22405E] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none font-semibold cursor-pointer"
                      >
                        {FIXED_MANDALS_TOWNS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Village / Ward (Option to write/edit) */}
                    <div>
                      <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                        Village / Ward *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="In English or Telugu..."
                        value={villageWardText}
                        onChange={(e) => setVillageWardText(e.target.value)}
                        className="w-full bg-[#0B1A2C] border border-[#22405E] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                      />
                    </div>

                    {/* Place / Landmark */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                        Place / Specific Landmark (Optional - English or Telugu)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Near Bus Stand, పంచాయతీ కార్యాలయం వద్ద..."
                        value={newPlaceName}
                        onChange={(e) => setNewPlaceName(e.target.value)}
                        className="w-full bg-[#0B1A2C] border border-[#22405E] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Detailed Description (Supports 300 characters with counter) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold">
                      Detailed Description / సమస్య వివరాలు * (English or Telugu)
                    </label>
                    <span className="text-[10px] text-[#8E9CAE] font-mono">
                      {newDescription.length}/300
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    maxLength={300}
                    placeholder="Enter issue details in English or Telugu (తెలుగులో వివరాలు నమోదు చేయండి)..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-[#071322] border border-[#22405E] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none leading-relaxed"
                  />
                </div>

                {/* 9 & 10. Personal Details (Citizen / Cadre / Leader) */}
                <div className="p-4 rounded-xl bg-[#071322]/80 border border-[#22405E] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#22405E] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D4A24C] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Complainant Personal Details / ఫిర్యాదుదారు వివరాలు
                    </span>
                    <span className="text-[10.5px] text-[#8E9CAE]">Citizen / Cadre / Leader</span>
                  </div>

                  {/* Segmented Choice: Citizen / Cadre / Leader */}
                  <div>
                    <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1.5">
                      Source Category *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: "CITIZEN", label: "Citizen" },
                          { id: "CADRE", label: "Party Cadre" },
                          { id: "LEADER", label: "Party Leader" }
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setReporterType(item.id)}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            reporterType === item.id
                              ? "bg-[#D4A24C] text-[#071322] border-[#D4A24C] font-bold shadow-sm"
                              : "bg-[#0B1A2C] text-[#B9AF95] border-[#22405E] hover:border-[#D4A24C]/40"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* If Cadre or Leader is selected, pop up designation input */}
                  {(reporterType === "CADRE" || reporterType === "LEADER") && (
                    <div className="p-3 rounded-lg bg-[#142B45]/60 border border-[#D4A24C]/40 animate-fadeIn space-y-1">
                      <label className="block text-[10.5px] uppercase tracking-wider text-[#D4A24C] font-semibold">
                        {reporterType === "LEADER" ? "Leader Position / Official Designation *" : "Cadre Role / Booth Responsibility *"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mandal Convener, Booth Agent..."
                        value={reporterDesignation}
                        onChange={(e) => setReporterDesignation(e.target.value)}
                        className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                        Complainant Name / పేరు *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name (English or Telugu)..."
                        value={newReportedBy}
                        onChange={(e) => setNewReportedBy(e.target.value)}
                        className="w-full bg-[#0B1A2C] border border-[#22405E] focus:border-[#D4A24C] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                        Phone Number / ఫోన్ సంఖ్య *
                      </label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-[#142B45] text-[#D4A24C] font-mono font-bold text-xs border border-r-0 border-[#22405E] rounded-l-lg select-none shrink-0">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="10 Digits..."
                          value={newReporterPhone}
                          onChange={(e) => setNewReporterPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          className="w-full bg-[#0B1A2C] border border-[#22405E] focus:border-[#D4A24C] rounded-r-lg rounded-l-none px-3 py-2 text-xs text-[#F5EFE0] outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Age and Gender (for Citizen) */}
                  {reporterType === "CITIZEN" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fadeIn">
                      <div>
                        <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={citizenAge}
                          onChange={(e) => setCitizenAge(e.target.value)}
                          className="w-full bg-[#0B1A2C] border border-[#22405E] focus:border-[#D4A24C] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                          Gender
                        </label>
                        <select
                          value={citizenGender}
                          onChange={(e) => setCitizenGender(e.target.value)}
                          className="w-full bg-[#0B1A2C] border border-[#22405E] focus:border-[#D4A24C] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] outline-none cursor-pointer"
                        >
                          <option value="Male" className="bg-[#0B1A2C] text-[#F5EFE0]">Male</option>
                          <option value="Female" className="bg-[#0B1A2C] text-[#F5EFE0]">Female</option>
                          <option value="Other" className="bg-[#0B1A2C] text-[#F5EFE0]">Other</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 11. Multi-Proof (Photos & Documents) Upload (Not Mandatory) */}
                <div className="p-4 rounded-xl bg-[#071322]/80 border border-[#22405E] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#22405E] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D4A24C] flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      Proof Photos & Documents (Not Mandatory)
                    </span>
                    <span className="text-[10.5px] text-[#8E9CAE]">Upload multiple photos or PDFs</span>
                  </div>

                  {/* Upload controls */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center px-4 py-2.5 bg-[#142B45] hover:bg-[#1E3A5A] border border-[#D4A24C]/40 text-[#D4A24C] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-1.5" />
                      Upload Photos / Document Files
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*,application/pdf"
                      className="hidden"
                    />

                    <div className="flex-1 flex gap-2">
                      <input
                        type="url"
                        value={newAttachmentUrl}
                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                        className="flex-1 bg-[#0B1A2C] border border-[#22405E] focus:border-[#D4A24C] rounded-xl px-3 py-2 text-xs text-[#F5EFE0] outline-none"
                      />
                      {newAttachmentUrl.trim() && (
                        <button
                          type="button"
                          onClick={handleAddUrlAttachment}
                          className="px-3 py-2 bg-[#D4A24C] text-[#071322] text-xs font-bold rounded-xl"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Uploaded Proof Badges / Previews */}
                  {proofFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {proofFiles.map((proof, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#142B45] border border-[#D4A24C]/40 text-xs text-[#F5EFE0]"
                        >
                          {proof.type === "image" ? (
                            <img src={proof.url} alt="Proof" className="w-5 h-5 rounded object-cover" />
                          ) : (
                            <Paperclip className="w-4 h-4 text-[#D4A24C]" />
                          )}
                          <span className="max-w-[150px] truncate">{proof.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProof(idx)}
                            className="text-rose-400 hover:text-rose-200 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Modal Footer with Cancel & Submit Buttons */}
              <div className="p-3.5 sm:p-4 border-t border-[#22405E] bg-[#071322] flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel / Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#071322] text-xs sm:text-sm font-bold hover:brightness-110 flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Submitting & Locking..." : "Submit Complaint (Locked)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Assign Complaint & Notify WhatsApp Modal */}
      <AssignComplaintModal
        isOpen={!!assignModalIssue}
        issue={assignModalIssue}
        onClose={() => setAssignModalIssue(null)}
        onConfirmAssign={(issueId, deptName, officialName, officialPhone) => handleAssignDepartment(issueId, deptName, officialName, officialPhone)}
      />
    </div>
  );
};
