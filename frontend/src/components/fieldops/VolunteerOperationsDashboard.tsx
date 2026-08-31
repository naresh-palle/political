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
import { IssueDetailModal } from "./IssueDetailModal";
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
  Eye
} from "lucide-react";

interface VolunteerDashboardProps {
  currentUser: UserProfile;
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
  "Roads & Buildings": "Roads & Buildings (R&B)",
  "Water Supply": "Panchayat Raj & Rural Water Supply (RWS)",
  "Electricity": "APCPDCL Electricity Board",
  "Sanitation & Garbage": "Municipal Administration & Urban Development",
  "Drainage & Sewage": "Municipal Administration & Urban Development",
  "Healthcare": "Health & Family Welfare (PHC / Hospital)",
  "Agriculture & Irrigation": "Irrigation & Water Resources",
  "Education": "School Education & Anganwadi",
  "Revenue & Land Issues": "Revenue & Land Administration",
  "Welfare Schemes": "Social & Tribal Welfare",
  "Law & Order": "Police & Law Enforcement",
  "Other": "Other Department"
};

const DEPARTMENTS = [
  "Roads & Buildings (R&B)",
  "Panchayat Raj & Rural Water Supply (RWS)",
  "APCPDCL Electricity Board",
  "Municipal Administration & Urban Development",
  "Health & Family Welfare (PHC / Hospital)",
  "Irrigation & Water Resources",
  "Agriculture & Horticulture",
  "School Education & Anganwadi",
  "Revenue & Land Administration",
  "Police & Law Enforcement",
  "Social & Tribal Welfare",
  "Other Department"
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
  currentUser
}) => {
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Issue for Detail Modal
  const [selectedIssue, setSelectedIssue] = useState<FieldIssue | null>(null);

  // View Mode: GRID vs TABLE
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  // Date Filter & Search
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "7DAYS" | "THIS_MONTH" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Complaint Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<string>("Roads & Buildings");
  const [newDepartment, setNewDepartment] = useState<string>("Roads & Buildings (R&B)");
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
      const issueList = await politicalApiService.getFieldIssues({
        userId: currentUser.id,
        userRole: "VOLUNTEER"
      });
      setIssues(issueList);
    } catch (e) {
      console.error(e);
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

    try {
      const payload: Partial<FieldIssue> = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        department: newDepartment,
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
        reportedDate: new Date().toISOString().split("T")[0],
        assignedVolunteerId: currentUser.id,
        assignedVolunteerName: assignedPersonName.trim() || currentUser.name,
        assignedVolunteerPhone: assignedPersonPhone.trim() ? `+91 ${assignedPersonPhone.trim()}` : (currentUser.phone || ""),
        directorId: currentUser.directorId || "usr-demo-director",
        directorName: currentUser.directorName || "Demo Director",
        initialRemarks: `Reported by ${reporterType} ${reporterType === "CITIZEN" && citizenAge ? `(Age: ${citizenAge}, Gender: ${citizenGender}) ` : ""}${reporterDesignation ? `(${reporterDesignation})` : ""}. Assigned to ${assignedPersonName}.`,
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
          message: `Volunteer ${currentUser.name} logged [${newPriority}] issue: "${newTitle.trim()}" in ${mandalObj.name} (${villageWardText.trim()}). Assigned to ${assignedPersonName}.`,
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
      }, 2000);
    } catch (err: any) {
      setFormError(err?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter issues by date & search query
  const filteredIssues = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonthPrefix = todayStr.slice(0, 7); // "YYYY-MM"

    return issues.filter((item) => {
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
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchLoc = (item.villageName || "").toLowerCase().includes(q) || (item.placeName || "").toLowerCase().includes(q);
        const matchMandal = (item.mandalName || "").toLowerCase().includes(q);
        const matchRep = (item.reportedBy || "").toLowerCase().includes(q);
        const matchDept = (item.department || "").toLowerCase().includes(q);
        return matchTitle || matchDesc || matchLoc || matchMandal || matchRep || matchDept;
      }

      return true;
    });
  }, [issues, dateFilter, startDate, endDate, searchQuery]);

  return (
    <div className="w-full max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6 space-y-5 text-[#F5EFE0]">
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
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#071322] font-bold text-xs sm:text-sm hover:brightness-110 transition-all shadow-[0_6px_25px_-5px_rgba(224,122,31,0.6)] cursor-pointer self-start lg:self-center"
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
            <span>Supervising Director:</span>
            <strong className="text-[#D4A24C]">{currentUser.directorName || "Demo Director"}</strong>
          </div>
        </div>
      </div>

      {/* 2. Streamlined KPI Strip: ONLY "Total Issues Submitted" with Date Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#071322]/45 backdrop-blur-xl border border-[#22405E]/80">
        {/* Total Issues Submitted Counter */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#142B45] border border-[#D4A24C]/40 flex items-center justify-center text-[#D4A24C]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#8E9CAE] font-semibold block">
              Total Issues Submitted
            </span>
            <div className="font-display text-2xl sm:text-3xl font-bold text-[#F5EFE0] leading-none mt-0.5">
              {issues.length}
            </div>
          </div>
        </div>

        {/* Date Filter, View Mode & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Grid vs Table View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#071322] border border-[#22405E] text-xs">
            <button
              onClick={() => setViewMode("GRID")}
              title="Grid Cards View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "GRID"
                  ? "bg-[#D4A24C] text-[#071322] font-bold shadow-sm"
                  : "text-[#B9AF95] hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              title="Data Table View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "TABLE"
                  ? "bg-[#D4A24C] text-[#071322] font-bold shadow-sm"
                  : "text-[#B9AF95] hover:text-white"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Date Filter Buttons */}
          <div className="flex flex-wrap items-center p-1 rounded-xl bg-[#071322] border border-[#22405E] text-xs gap-1">
            <span className="px-2 text-[10.5px] uppercase font-semibold text-[#8E9CAE] hidden md:inline">
              Date:
            </span>
            {(
              [
                { id: "ALL", label: "All Time" },
                { id: "TODAY", label: "Today" },
                { id: "7DAYS", label: "Past 7 Days" },
                { id: "THIS_MONTH", label: "This Month" },
                { id: "CUSTOM", label: "Custom Range" }
              ] as const
            ).map((df) => (
              <button
                key={df.id}
                onClick={() => setDateFilter(df.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  dateFilter === df.id
                    ? "bg-[#D4A24C] text-[#071322] shadow-sm font-bold"
                    : "text-[#B9AF95] hover:text-white"
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker when CUSTOM is active */}
          {dateFilter === "CUSTOM" && (
            <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-xl bg-[#071322] border border-[#D4A24C]/40 text-xs animate-fadeIn">
              <span className="text-[10px] uppercase text-[#D4A24C] font-semibold">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#0B1A2C] border border-[#22405E] focus:border-[#D4A24C] text-[#F5EFE0] px-2 py-1 rounded-lg text-xs outline-none"
              />
              <span className="text-[10px] uppercase text-[#D4A24C] font-semibold">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#0B1A2C] border border-[#22405E] focus:border-[#D4A24C] text-[#F5EFE0] px-2 py-1 rounded-lg text-xs outline-none"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-rose-400 hover:text-rose-200 text-[10px] font-semibold underline ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Quick Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-[#8E9CAE] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search issues, citizens, villages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5EFE0] placeholder-[#5F6875] outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Submitted Issues Feed: Grid or Table View */}
      {loading ? (
        <div className="p-12 text-center text-sm text-[#8E9CAE] bg-[#0B1A2C] rounded-2xl border border-[#22405E]">
          Loading submitted complaints...
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-12 text-center text-sm text-[#8E9CAE] bg-[#0B1A2C] rounded-2xl border border-[#22405E] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#142B45] text-[#D4A24C] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-base text-[#F5EFE0] font-semibold">No complaints found for the selected filter</p>
          <p className="text-xs text-[#8E9CAE]">
            Click "+ Add Complaint / Requirement" to log a new issue from your assigned area.
          </p>
        </div>
      ) : viewMode === "GRID" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => setSelectedIssue(issue)}
              className="p-5 rounded-2xl bg-[#071322]/45 backdrop-blur-xl border border-[#22405E]/80 hover:border-[#D4A24C]/60 hover:bg-[#071322]/65 transition-all space-y-3.5 cursor-pointer shadow-lg group"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-[#D4A24C] font-semibold">
                  #{issue.id}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#142B45] text-[#D4A24C] border border-[#D4A24C]/25">
                    {issue.category}
                  </span>
                  {issue.department && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#071322] text-[#8E9CAE] border border-[#22405E]">
                      {issue.department.split("(")[0]}
                    </span>
                  )}
                  <span
                    className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      issue.priority === "URGENT" || issue.priority === "HIGH"
                        ? "bg-rose-950/80 text-rose-300 border border-rose-600/40"
                        : "bg-[#071322] text-[#B9AF95] border border-[#22405E]"
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
              </div>

              {/* Location & Reporter Details */}
              <div className="pt-2.5 border-t border-[#22405E]/60 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[#8E9CAE]">
                  <span className="flex items-center gap-1.5 text-[#F5EFE0] truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                    <strong>{issue.mandalName}</strong> · {issue.villageName}
                  </span>
                  <span className="text-[11px] text-[#B9AF95] font-mono shrink-0">
                    {issue.reportedDate}
                  </span>
                </div>

                {issue.placeName && (
                  <p className="text-[11px] text-[#8E9CAE] pl-5 truncate">
                    📍 Landmark: {issue.placeName}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-[#8E9CAE] pt-1">
                  <span>
                    Reported by: <strong className="text-[#D8CFB8]">{issue.reportedBy}</strong>
                    {issue.reporterDesignation ? ` (${issue.reporterDesignation})` : ""}
                  </span>
                  {issue.attachments && issue.attachments.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[#D4A24C] font-mono">
                      <Paperclip className="w-3 h-3" />
                      {issue.attachments.length} {issue.attachments.length === 1 ? "Proof" : "Proofs"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-[#071322]/45 backdrop-blur-xl border border-[#22405E]/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#071322] border-b border-[#22405E] text-[#D4A24C] uppercase text-[10.5px] font-semibold tracking-wider">
                  <th className="py-3.5 px-4 font-mono">ID</th>
                  <th className="py-3.5 px-4">Issue Title & Scope</th>
                  <th className="py-3.5 px-4">Category / Dept</th>
                  <th className="py-3.5 px-4">Mandal / Town</th>
                  <th className="py-3.5 px-4">Village / Ward</th>
                  <th className="py-3.5 px-4">Reported By</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-center">Proofs</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22405E]/50">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="hover:bg-[#122A44]/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#D4A24C] whitespace-nowrap">
                      #{issue.id}
                    </td>
                    <td className="py-3 px-4 max-w-[240px]">
                      <div className="font-semibold text-[#F5EFE0] group-hover:text-[#D4A24C] transition-colors truncate">
                        {issue.title}
                      </div>
                      <div className="text-[11px] text-[#8E9CAE] truncate mt-0.5">
                        {issue.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-[#D8CFB8]">{issue.category}</div>
                      {issue.department && (
                        <div className="text-[10.5px] text-[#8E9CAE]">{issue.department.split("(")[0]}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#F5EFE0]">
                      {issue.mandalName}
                    </td>
                    <td className="py-3 px-4 max-w-[160px]">
                      <div className="text-[#F5EFE0] truncate font-medium">{issue.villageName}</div>
                      {issue.placeName && (
                        <div className="text-[10.5px] text-[#8E9CAE] truncate">📍 {issue.placeName}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-[#F5EFE0] font-medium">{issue.reportedBy}</div>
                      <div className="text-[10.5px] text-[#D4A24C]">
                        {issue.reporterType === "LEADER" ? "Leader" : issue.reporterType === "CADRE" ? "Cadre" : "Citizen"}
                        {issue.reporterDesignation ? ` · ${issue.reporterDesignation}` : ""}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#B9AF95] whitespace-nowrap">
                      {issue.reportedDate}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {issue.attachments && issue.attachments.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#142B45] text-[#D4A24C] border border-[#D4A24C]/30 text-[10.5px] font-mono">
                          <Paperclip className="w-3 h-3" />
                          {issue.attachments.length}
                        </span>
                      ) : (
                        <span className="text-[#5F6875]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssue(issue);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#142B45] hover:bg-[#1E3A5A] text-[#D4A24C] text-[11px] font-semibold border border-[#D4A24C]/30 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#071322] border border-[#22405E] rounded-xl px-3.5 py-2.5 text-sm text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                  />
                </div>

                {/* 2 & 3. Category & Department (Department auto-fetched from Category) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Category *
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setNewCategory(cat);
                        if (CATEGORY_TO_DEPARTMENT[cat]) {
                          setNewDepartment(CATEGORY_TO_DEPARTMENT[cat]);
                        }
                      }}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none font-medium cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Department *
                    </label>
                    <select
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none font-medium cursor-pointer"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
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
                        value={villageWardText}
                        onChange={(e) => setVillageWardText(e.target.value)}
                        className="w-full bg-[#0B1A2C] border border-[#22405E] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                      />
                    </div>

                    {/* Place / Landmark */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                        Place / Specific Landmark (Optional)
                      </label>
                      <input
                        type="text"
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
                      Detailed Description *
                    </label>
                    <span className="text-[10px] text-[#8E9CAE] font-mono">
                      {newDescription.length}/300
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    maxLength={300}
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
                      Personal Details
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
                        value={reporterDesignation}
                        onChange={(e) => setReporterDesignation(e.target.value)}
                        className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newReportedBy}
                        onChange={(e) => setNewReportedBy(e.target.value)}
                        className="w-full bg-[#0B1A2C] border border-[#22405E] focus:border-[#D4A24C] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                        Contact Number / Mobile *
                      </label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-[#142B45] text-[#D4A24C] font-mono font-bold text-xs border border-r-0 border-[#22405E] rounded-l-lg select-none shrink-0">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
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

                {/* 12. Assigned Ticket Hierarchy Details */}
                <div className="p-4 rounded-xl bg-[#071322]/80 border border-[#22405E] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#22405E] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D4A24C] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Assigned Ticket Hierarchy
                    </span>
                    <span className="text-[10px] text-[#8E9CAE] font-mono">Field Routing</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                        Assigned Ticket: Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={assignedPersonName}
                        onChange={(e) => setAssignedPersonName(e.target.value)}
                        className="w-full bg-[#0B1A2C] border border-[#22405E] focus:border-[#D4A24C] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] uppercase tracking-wider text-[#B9AF95] font-semibold mb-1">
                        Assigned Person Contact: Number *
                      </label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-[#142B45] text-[#D4A24C] font-mono font-bold text-xs border border-r-0 border-[#22405E] rounded-l-lg select-none shrink-0">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={assignedPersonPhone}
                          onChange={(e) => setAssignedPersonPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          className="w-full bg-[#0B1A2C] border border-[#22405E] focus:border-[#D4A24C] rounded-r-lg rounded-l-none px-3 py-2 text-xs text-[#F5EFE0] outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
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

      {/* Selected Issue Detail & Update Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          currentUser={currentUser}
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onIssueUpdated={loadVolunteerData}
        />
      )}
    </div>
  );
};
