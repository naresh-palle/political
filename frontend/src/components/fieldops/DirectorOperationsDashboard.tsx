import React, { useState, useEffect, useMemo } from "react";
import {
  FieldIssue,
  GrievanceItem,
  UserProfile,
  MandalInfo,
  VillageInfo,
  IssueStatus,
  WorkUpdateRecord
} from "../../types";
import { politicalApiService } from "../../services/api";
import { IssueDetailView } from "./IssueDetailView";
import {
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  MapPin,
  Calendar,
  AlertCircle,
  Camera,
  Layers,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Phone,
  UserCheck,
  Flame,
  FileCheck,
  LayoutGrid,
  List,
  Eye,
  ClipboardList,
  Building2,
  Sparkles
} from "lucide-react";
import { AiTicketsPdfReportModal } from "./AiTicketsPdfReportModal";

interface DirectorDashboardProps {
  currentUser: UserProfile;
}

export const DirectorOperationsDashboard: React.FC<DirectorDashboardProps> = ({
  currentUser
}) => {
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [mandals, setMandals] = useState<MandalInfo[]>([]);
  const [villages, setVillages] = useState<VillageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [operationsStream, setOperationsStream] = useState<"ALL" | "FIELD_ISSUES" | "GRIEVANCES">("ALL");
  const [isAiPdfModalOpen, setIsAiPdfModalOpen] = useState(false);

  // Selected Issue for Full-Page Detail View
  const [selectedIssue, setSelectedIssue] = useState<FieldIssue | null>(null);

  // Filters & Sorting State
  const [activeTab, setActiveTab] = useState<"ALL" | "OVERDUE" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANT_BE_DONE">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterDepartment, setFilterDepartment] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterReporterType, setFilterReporterType] = useState<string>("ALL");
  const [filterVolunteerId, setFilterVolunteerId] = useState<string>("ALL");
  const [filterMandalId, setFilterMandalId] = useState<string>("ALL");
  const [filterGender, setFilterGender] = useState<string>("ALL");
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "DUE_DATE" | "PRIORITY" | "STATUS" | "TITLE">("NEWEST");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    loadDirectorData();
  }, [currentUser.id]);

  // Reset pagination to Page 1 when any filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    filterCategory,
    filterDepartment,
    filterType,
    filterPriority,
    filterReporterType,
    filterVolunteerId,
    filterMandalId,
    filterGender,
    filterAgeGroup,
    searchQuery,
    sortBy,
    pageSize,
    operationsStream
  ]);

  const loadDirectorData = async () => {
    setLoading(true);
    try {
      const [allUsers, issueList, grievanceList, mandalList, villageList] = await Promise.all([
        politicalApiService.getUsers(),
        politicalApiService.getFieldIssues({
          directorId: currentUser.id,
          userRole: "DIRECTOR"
        }),
        politicalApiService.getGrievances(),
        politicalApiService.getMandals(
          currentUser.assemblyConstituencyId || "BNG-AC",
          currentUser.stateId || "AP"
        ),
        politicalApiService.getVillages(undefined, currentUser.assemblyConstituencyId || "BNG-AC")
      ]);

      // Filter volunteers assigned to this director
      const assignedVols = allUsers.filter(
        (u) =>
          (u.primaryRole === "VOLUNTEER" || u.roleId === "VOLUNTEER" || u.role === "volunteer") &&
          (u.directorId === currentUser.id ||
            u.directorName === currentUser.name ||
            (u.partyId && currentUser.partyId && u.partyId === currentUser.partyId) ||
            !u.directorId)
      );

      setVolunteers(assignedVols);
      setIssues(issueList);
      setGrievances(grievanceList);
      setMandals(mandalList);
      setVillages(villageList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract or deterministically compute citizen demographics (Gender & Age)
  const getItemDemographics = (item: FieldIssue) => {
    let gender = (item.citizenGender || "Male") as "Male" | "Female" | "Other";
    let age = item.citizenAge || 0;

    if (!age && item.reporterDesignation) {
      const m = item.reporterDesignation.match(/Age\s*(\d+)/i);
      if (m) age = parseInt(m[1], 10);
      if (/Female/i.test(item.reporterDesignation)) gender = "Female";
      else if (/Male/i.test(item.reporterDesignation)) gender = "Male";
    }

    if (!age) {
      let hash = 0;
      for (let i = 0; i < item.id.length; i++) hash = (hash << 5) - hash + item.id.charCodeAt(i);
      const absHash = Math.abs(hash);
      age = 22 + (absHash % 48); // 22 to 70
      if (!item.citizenGender) {
        gender = absHash % 3 === 0 ? "Female" : "Male";
      }
    }

    return { gender, age };
  };

  // Helper to extract or classify Department
  const getItemDepartment = (item: FieldIssue) => {
    if (item.department && !["Public Works", "General"].includes(item.department)) {
      return item.department;
    }
    const cat = (item.category || "").toLowerCase();
    const title = (item.title || "").toLowerCase();
    if (cat.includes("water") || title.includes("water") || title.includes("pipeline")) return "Water Supply (RWS)";
    if (cat.includes("road") || title.includes("road") || title.includes("pothole") || title.includes("transit")) return "Roads & Buildings";
    if (cat.includes("pension") || cat.includes("welfare") || title.includes("pension") || title.includes("dbt")) return "Social Welfare";
    if (cat.includes("electric") || title.includes("power") || title.includes("voltage") || title.includes("transformer")) return "Energy (Discom)";
    if (cat.includes("revenue") || title.includes("passbook") || title.includes("land") || title.includes("patta")) return "Revenue & Land";
    if (cat.includes("health") || title.includes("doctor") || title.includes("phc") || title.includes("hospital")) return "Health & Medical";
    if (cat.includes("panchayat") || cat.includes("drain") || title.includes("sanitation") || title.includes("garbage")) return "Panchayat Raj";
    return item.department || "Public Works";
  };

  // Helper to extract or classify Type
  const getItemType = (item: FieldIssue) => {
    if (item.issueType && !["COMPLAINT", "REQUIREMENT", "GRIEVANCE"].includes(item.issueType.toUpperCase())) {
      return item.issueType;
    }
    const cat = (item.category || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const title = (item.title || "").toLowerCase();

    if (cat.includes("pension") || desc.includes("pension") || desc.includes("scheme") || title.includes("dbt")) {
      return "Welfare Scheme";
    }
    if (cat.includes("road") || cat.includes("water") || cat.includes("transformer") || title.includes("pothole") || title.includes("pipeline")) {
      return "Infrastructure";
    }
    if (desc.includes("urgent") || cat.includes("urgent") || item.priority === "URGENT") {
      return "Urgent Aid";
    }
    if (cat.includes("passbook") || desc.includes("certificate") || desc.includes("seva") || title.includes("passbook")) {
      return "Documentation";
    }
    if (cat.includes("garbage") || cat.includes("sanitation") || title.includes("doctor")) {
      return "Public Service";
    }
    return item.reporterType === "CITIZEN" ? "Citizen Petition" : "Public Works";
  };

  // Convert GrievanceItems to normalized FieldIssue structure for unified rendering
  const normalizedGrievances: FieldIssue[] = useMemo(() => {
    return grievances.map((g) => ({
      id: g.id || g.ticketNumber || `GRV-${Math.floor(Math.random() * 9000 + 1000)}`,
      title: g.subject || "Citizen Grievance Petition",
      description: g.description || "No detailed description provided.",
      category: g.category || "General Administration",
      department: g.department || "Public Works",
      priority: (g.priority?.toUpperCase() as any) || "HIGH",
      status: (g.status === "Completed" || g.status === "Resolved"
        ? "RESOLVED"
        : g.status === "In_Progress" || g.status === "Assigned"
        ? "IN_PROGRESS"
        : g.status === "Can't be done"
        ? "OVERDUE"
        : "NEW") as IssueStatus,
      issueType: "GRIEVANCE",
      stateId: "AP",
      assemblyConstituencyId: "BNG-AC",
      assemblyConstituencyName: "Banaganapalle AC (AC-140)",
      mandalId: g.address?.townMandal || "MDL-BNG-TWN",
      mandalName: g.address?.townMandal || "Banaganapalle Town",
      villageId: g.address?.wardVillage || "Ward 1",
      villageName: g.address?.wardVillage || "Ward 1",
      placeName: g.location || g.address?.doorNo || "Constituency Area",
      reportedBy: g.citizenName || "Citizen Petitioner",
      reporterType: (g.citizenType?.toUpperCase() as any) || "CITIZEN",
      reporterDesignation: g.citizenAge ? `Age ${g.citizenAge} · ${g.citizenGender}` : undefined,
      reporterPhone: g.citizenPhone || "+91 98850 00000",
      citizenGender: g.citizenGender || "Male",
      citizenAge: g.citizenAge || 35,
      reportedDate: g.timestamp ? g.timestamp.split("T")[0] : "2026-08-28",
      completedDate: g.status === "Completed" || g.status === "Resolved" ? "2026-08-30" : undefined,
      assignedVolunteerName: g.assignee || g.submittedByVolunteer?.name,
      assignedVolunteerPhone: g.assigneeContact || g.submittedByVolunteer?.phone,
      attachments: (g as any).attachments || [],
      createdBy: g.citizenName || "Citizen",
      createdByRole: "CITIZEN",
      createdAt: g.timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }, [grievances]);

  // Unified Operations Stream (Field Issues + Grievances)
  const allOperationsList = useMemo(() => {
    if (operationsStream === "FIELD_ISSUES") return issues;
    if (operationsStream === "GRIEVANCES") return normalizedGrievances;
    return [...issues, ...normalizedGrievances];
  }, [issues, normalizedGrievances, operationsStream]);

  // Unique Categories Available in Stream
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    allOperationsList.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [allOperationsList]);

  // Top Tickets Metrics
  const totalOperationsCount = allOperationsList.length;
  const pendingCount = allOperationsList.filter((i) => ["NEW", "ASSIGNED", "IN_PROGRESS"].includes(i.status)).length;
  const inProgressCount = allOperationsList.filter((i) => i.status === "IN_PROGRESS").length;
  const completedCount = allOperationsList.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
  const cantBeDoneCount = allOperationsList.filter((i) => i.status === "OVERDUE" || (i as any).status === "Can't be done").length;
  const overdueCount = cantBeDoneCount;

  // Granular Breakdown Metrics (Exact match for the handwritten schema)
  const analyticsMatrix = useMemo(() => {
    // 1. Priority Counts
    const priorityCounts = {
      LOW: allOperationsList.filter((i) => i.priority === "LOW").length,
      MEDIUM: allOperationsList.filter((i) => i.priority === "MEDIUM").length,
      HIGH: allOperationsList.filter((i) => i.priority === "HIGH").length,
      URGENT: allOperationsList.filter((i) => i.priority === "URGENT").length
    };

    // 2. Gender Counts
    let maleCount = 0;
    let femaleCount = 0;
    let otherGenderCount = 0;

    // 3. Age Group Counts
    let age20_30 = 0;
    let age30_40 = 0;
    let age40_50 = 0;
    let age50Plus = 0;

    allOperationsList.forEach((item) => {
      const { gender, age } = getItemDemographics(item);
      if (gender === "Female") femaleCount++;
      else if (gender === "Other") otherGenderCount++;
      else maleCount++;

      if (age >= 20 && age <= 30) age20_30++;
      else if (age > 30 && age <= 40) age30_40++;
      else if (age > 40 && age <= 50) age40_50++;
      else age50Plus++;
    });

    // 4. Mandal-wise Counts (BPL, KKL, OWK, SJM, KLM)
    const mandalCounts: { key: string; name: string; id: string; count: number }[] = [
      {
        key: "BPL",
        name: "Banaganapalle",
        id: "MDL-BNG-TWN",
        count: allOperationsList.filter((i) => (i.mandalName || "").toLowerCase().includes("banaganapalle")).length
      },
      {
        key: "KKL",
        name: "Koilakuntla",
        id: "MDL-KKL-TWN",
        count: allOperationsList.filter((i) => (i.mandalName || "").toLowerCase().includes("koilakuntla")).length
      },
      {
        key: "OWK",
        name: "Owk",
        id: "MDL-OWK-RUR",
        count: allOperationsList.filter((i) => (i.mandalName || "").toLowerCase().includes("owk")).length
      },
      {
        key: "SJM",
        name: "Sanjamala",
        id: "MDL-SJM-RUR",
        count: allOperationsList.filter((i) => (i.mandalName || "").toLowerCase().includes("sanjamala")).length
      },
      {
        key: "KLM",
        name: "Kolimigundla",
        id: "MDL-KLM-RUR",
        count: allOperationsList.filter((i) => (i.mandalName || "").toLowerCase().includes("kolimigundla")).length
      }
    ];

    // 5. Department Counts
    const deptMap = new Map<string, number>();
    const typeMap = new Map<string, number>();

    allOperationsList.forEach((item) => {
      const dept = getItemDepartment(item);
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);

      const itype = getItemType(item);
      typeMap.set(itype, (typeMap.get(itype) || 0) + 1);
    });

    const departmentCounts = Array.from(deptMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const typeCounts = Array.from(typeMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 6. Dept / Category Counts
    const categoryCounts: { category: string; count: number }[] = availableCategories.map((cat) => ({
      category: cat,
      count: allOperationsList.filter((i) => i.category === cat).length
    }));

    return {
      priorityCounts,
      genderCounts: { male: maleCount, female: femaleCount, other: otherGenderCount },
      ageCounts: { "20-30": age20_30, "30-40": age30_40, "40-50": age40_50, "50+": age50Plus },
      mandalCounts,
      departmentCounts,
      typeCounts,
      categoryCounts
    };
  }, [allOperationsList, availableCategories]);

  // Inactivity / "No Work Done" Detection
  const inactiveVolunteerWarnings = useMemo(() => {
    const warnings: { volunteer: UserProfile; pendingCount: number; overdueCount: number; reason: string }[] = [];
    volunteers.forEach((vol) => {
      const volIssues = issues.filter((i) => i.assignedVolunteerId === vol.id);
      const volOverdue = volIssues.filter((i) => i.status === "OVERDUE").length;
      const volPending = volIssues.filter((i) => ["NEW", "ASSIGNED", "IN_PROGRESS"].includes(i.status)).length;

      if (volOverdue > 0) {
        warnings.push({
          volunteer: vol,
          pendingCount: volPending,
          overdueCount: volOverdue,
          reason: `Has ${volOverdue} overdue work item${volOverdue > 1 ? "s" : ""} pending urgent field follow-up.`
        });
      }
    });
    return warnings;
  }, [volunteers, issues]);

  // Filtered & Sorted Operations
  const sortedAndFilteredOperations = useMemo(() => {
    let list = allOperationsList.filter((item) => {
      // Status Tabs
      if (activeTab === "OVERDUE" && item.status !== "OVERDUE") return false;
      if (activeTab === "CANT_BE_DONE" && item.status !== "OVERDUE" && (item as any).status !== "Can't be done") return false;
      if (activeTab === "PENDING" && !["NEW", "ASSIGNED"].includes(item.status)) return false;
      if (activeTab === "IN_PROGRESS" && item.status !== "IN_PROGRESS") return false;
      if (activeTab === "COMPLETED" && !["COMPLETED", "RESOLVED"].includes(item.status)) return false;

      // Category, Department, Type Filters
      if (filterCategory !== "ALL" && item.category !== filterCategory) return false;
      if (filterDepartment !== "ALL" && getItemDepartment(item) !== filterDepartment) return false;
      if (filterType !== "ALL" && getItemType(item) !== filterType) return false;
      if (filterPriority !== "ALL" && item.priority !== filterPriority) return false;
      if (filterReporterType !== "ALL" && item.reporterType !== filterReporterType) return false;
      if (filterVolunteerId !== "ALL" && item.assignedVolunteerId !== filterVolunteerId) return false;
      if (filterMandalId !== "ALL" && item.mandalId !== filterMandalId && !item.mandalName?.toLowerCase().includes(filterMandalId.toLowerCase())) return false;

      // Gender Filter
      if (filterGender !== "ALL") {
        const { gender } = getItemDemographics(item);
        if (gender.toLowerCase() !== filterGender.toLowerCase()) return false;
      }

      // Age Group Filter
      if (filterAgeGroup !== "ALL") {
        const { age } = getItemDemographics(item);
        if (filterAgeGroup === "20-30" && (age < 20 || age > 30)) return false;
        if (filterAgeGroup === "30-40" && (age < 30 || age > 40)) return false;
        if (filterAgeGroup === "40-50" && (age < 40 || age > 50)) return false;
        if (filterAgeGroup === "50+" && age < 50) return false;
      }

      // Search Query Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.villageName || "").toLowerCase().includes(q) ||
          (item.mandalName || "").toLowerCase().includes(q) ||
          (item.assignedVolunteerName || "").toLowerCase().includes(q) ||
          item.reportedBy.toLowerCase().includes(q) ||
          (item.reporterPhone || "").includes(q)
        );
      }
      return true;
    });

    // Apply Sort
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
    allOperationsList,
    activeTab,
    filterCategory,
    filterDepartment,
    filterType,
    filterPriority,
    filterReporterType,
    filterVolunteerId,
    filterMandalId,
    filterGender,
    filterAgeGroup,
    searchQuery,
    sortBy
  ]);

  // Paginated Slicing
  const totalPages = Math.ceil(sortedAndFilteredOperations.length / pageSize) || 1;
  const paginatedOperations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAndFilteredOperations.slice(start, start + pageSize);
  }, [sortedAndFilteredOperations, currentPage, pageSize]);

  const hasActiveFilters =
    activeTab !== "ALL" ||
    filterCategory !== "ALL" ||
    filterDepartment !== "ALL" ||
    filterType !== "ALL" ||
    filterPriority !== "ALL" ||
    filterReporterType !== "ALL" ||
    filterVolunteerId !== "ALL" ||
    filterMandalId !== "ALL" ||
    filterGender !== "ALL" ||
    filterAgeGroup !== "ALL" ||
    searchQuery.trim().length > 0 ||
    sortBy !== "NEWEST";

  const clearAllFilters = () => {
    setActiveTab("ALL");
    setFilterCategory("ALL");
    setFilterDepartment("ALL");
    setFilterType("ALL");
    setFilterPriority("ALL");
    setFilterReporterType("ALL");
    setFilterVolunteerId("ALL");
    setFilterMandalId("ALL");
    setFilterGender("ALL");
    setFilterAgeGroup("ALL");
    setSearchQuery("");
    setSortBy("NEWEST");
  };

  // If an issue is selected, display the full-page dedicated IssueDetailView
  if (selectedIssue) {
    return (
      <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6">
        <IssueDetailView
          issue={selectedIssue}
          currentUser={currentUser}
          onBack={() => setSelectedIssue(null)}
          onIssueUpdated={loadDirectorData}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6 space-y-4 sm:space-y-6 animate-fadeIn text-[#F5EFE0] overflow-x-hidden">
      {/* Manager Command Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#0E1724] border border-[#D4A24C]/40 shadow-2xl">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4A24C] shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#071322] text-[#D4A24C] border border-[#D4A24C]/40 font-mono">
                Campaign Manager
              </span>
              <span className="text-xs text-[#D8CFB8]">{currentUser.assignedConstituency || "Constituency Grievance Command"}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-[#F5EFE0] font-normal mt-0.5">
              {currentUser.name}
            </h1>
            <p className="text-xs text-[#8E9CAE] mt-0.5">
              Supervising Ground Grievance Intake & Resolutions across {mandals.length} Mandals
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#070D15] border border-[#223348] text-right">
            <span className="text-[10px] uppercase text-[#8E9CAE] block font-semibold">Cadre Strength</span>
            <span className="font-display text-lg font-bold text-[#D4A24C]">
              {volunteers.length} Active Field Agents
            </span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[#070D15] border border-[#223348] text-right">
            <span className="text-[10px] uppercase text-[#8E9CAE] block font-semibold">Resolution Rate</span>
            <span className="font-display text-lg font-bold text-emerald-400">
              {totalOperationsCount > 0 ? Math.round((completedCount / totalOperationsCount) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* "No Work Done" Inactivity Alert Banner */}
      {inactiveVolunteerWarnings.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-500/50 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Grievance Alert: Overdue Issues Require Manager Intervention</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {inactiveVolunteerWarnings.map((w, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#0B131E] border border-rose-500/30 flex items-center justify-between text-[11px]"
              >
                <div>
                  <strong className="text-[#F5EFE0] block">{w.volunteer.name}</strong>
                  <span className="text-rose-300 text-[10px]">{w.reason}</span>
                </div>
                <button
                  onClick={() => setFilterVolunteerId(w.volunteer.id)}
                  className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 text-[10px] font-semibold cursor-pointer"
                >
                  View Tasks
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Official Tickets Master Summary Header Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1724] border border-[#D4A24C]/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#223348]/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#131E2D] border border-[#D4A24C]/40 flex items-center justify-center text-[#D4A24C]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg text-[#F5EFE0] font-semibold flex items-center gap-2">
                Tickets Operational Overview
              </h2>
              <span className="text-[11px] text-[#8E9CAE]">
                Constituency AC-140 · Live Real-time Ground Intelligence ({sortedAndFilteredOperations.length} Records)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#CBD5E1] font-mono">
            <span className="text-[#8E9CAE]">Stream:</span>
            <strong className="text-[#D4A24C]">All Operations</strong>
          </div>
        </div>

        {/* Tickets Top Row: Total / Completed / Pending / Can't be done */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setActiveTab("ALL")}
            className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-[#131E2D] border-[#D4A24C] shadow-lg ring-1 ring-[#D4A24C]/50"
                : "bg-[#0B131E] border-[#223348] hover:border-[#D4A24C]/40"
            }`}
          >
            <span className="text-[10.5px] uppercase tracking-wider text-[#8E9CAE] block font-semibold">
              Tickets — Total
            </span>
            <div className="font-display text-2xl sm:text-3xl font-bold text-[#F5EFE0] mt-1">
              {totalOperationsCount}
            </div>
            <span className="text-[10px] text-[#8E9CAE] block mt-0.5">100% Volume</span>
          </div>

          <div
            onClick={() => setActiveTab("COMPLETED")}
            className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === "COMPLETED"
                ? "bg-[#131E2D] border-[#D4A24C] shadow-lg ring-1 ring-[#D4A24C]/50"
                : "bg-[#0B131E] border-[#223348] hover:border-emerald-500/40"
            }`}
          >
            <span className="text-[10.5px] uppercase tracking-wider text-emerald-300 block font-semibold">
              Completed / Resolved
            </span>
            <div className="font-display text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
              {completedCount}
            </div>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">
              {totalOperationsCount > 0 ? Math.round((completedCount / totalOperationsCount) * 100) : 100}% Resolved
            </span>
          </div>

          <div
            onClick={() => setActiveTab("PENDING")}
            className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === "PENDING"
                ? "bg-[#131E2D] border-[#D4A24C] shadow-lg ring-1 ring-[#D4A24C]/50"
                : "bg-[#0B131E] border-[#223348] hover:border-blue-500/40"
            }`}
          >
            <span className="text-[10.5px] uppercase tracking-wider text-blue-300 block font-semibold">
              Pending / In Progress
            </span>
            <div className="font-display text-2xl sm:text-3xl font-bold text-blue-400 mt-1">
              {pendingCount}
            </div>
            <span className="text-[10px] text-blue-300/80 block mt-0.5">Active on Ground</span>
          </div>

          <div
            onClick={() => setActiveTab("CANT_BE_DONE")}
            className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === "CANT_BE_DONE" || activeTab === "OVERDUE"
                ? "bg-rose-950 border-rose-500 shadow-lg ring-1 ring-rose-500/50"
                : "bg-[#0B131E] border-[#223348] hover:border-rose-500/40"
            }`}
          >
            <span className="text-[10.5px] uppercase tracking-wider text-rose-300 block font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> Can&apos;t be done / Overdue
            </span>
            <div className="font-display text-2xl sm:text-3xl font-bold text-rose-400 mt-1">
              {cantBeDoneCount}
            </div>
            <span className="text-[10px] text-rose-300/80 block mt-0.5">SLA Escalations</span>
          </div>
        </div>

        {/* 2. Demographic, Regional & Type Breakdown Matrix (5 Pillars) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* Card 1: Priority Breakdown */}
          <div className="p-3.5 rounded-xl bg-[#0E1724] border border-[#223348] flex flex-col justify-between min-h-[150px]">
            <div className="flex items-center justify-between border-b border-[#223348]/70 pb-1.5 mb-2">
              <span className="text-[11px] uppercase font-bold text-[#D4A24C] tracking-wider">
                Priority
              </span>
              <span className="text-[9.5px] text-[#8E9CAE]">SLA Tiers</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs flex-1">
              <button
                onClick={() => setFilterPriority(filterPriority === "LOW" ? "ALL" : "LOW")}
                className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-center ${
                  filterPriority === "LOW"
                    ? "bg-[#131E2D] border-[#D4A24C] text-[#F5EFE0]"
                    : "bg-[#070D15] border-[#223348]/60 text-[#CBD5E1] hover:border-[#D4A24C]/40"
                }`}
              >
                <span className="text-[9.5px] text-[#8E9CAE] block">Low</span>
                <strong className="text-xs text-[#F5EFE0] font-mono font-bold mt-0.5">
                  {analyticsMatrix.priorityCounts.LOW}
                </strong>
              </button>

              <button
                onClick={() => setFilterPriority(filterPriority === "MEDIUM" ? "ALL" : "MEDIUM")}
                className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-center ${
                  filterPriority === "MEDIUM"
                    ? "bg-[#131E2D] border-[#D4A24C] text-[#F5EFE0]"
                    : "bg-[#070D15] border-[#223348]/60 text-[#CBD5E1] hover:border-[#D4A24C]/40"
                }`}
              >
                <span className="text-[9.5px] text-amber-300/80 block">Medium</span>
                <strong className="text-xs text-amber-400 font-mono font-bold mt-0.5">
                  {analyticsMatrix.priorityCounts.MEDIUM}
                </strong>
              </button>

              <button
                onClick={() => setFilterPriority(filterPriority === "HIGH" ? "ALL" : "HIGH")}
                className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-center ${
                  filterPriority === "HIGH"
                    ? "bg-[#131E2D] border-[#D4A24C] text-[#F5EFE0]"
                    : "bg-[#070D15] border-[#223348]/60 text-[#CBD5E1] hover:border-[#D4A24C]/40"
                }`}
              >
                <span className="text-[9.5px] text-orange-300/80 block">High</span>
                <strong className="text-xs text-orange-400 font-mono font-bold mt-0.5">
                  {analyticsMatrix.priorityCounts.HIGH}
                </strong>
              </button>

              <button
                onClick={() => setFilterPriority(filterPriority === "URGENT" ? "ALL" : "URGENT")}
                className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-center ${
                  filterPriority === "URGENT"
                    ? "bg-[#131E2D] border-red-500 text-[#F5EFE0]"
                    : "bg-[#070D15] border-[#223348]/60 text-[#CBD5E1] hover:border-red-500/40"
                }`}
              >
                <span className="text-[9.5px] text-red-400/90 block">Urgent</span>
                <strong className="text-xs text-red-400 font-mono font-bold mt-0.5">
                  {analyticsMatrix.priorityCounts.URGENT}
                </strong>
              </button>
            </div>
          </div>

          {/* Card 2: Gender Breakdown */}
          <div className="p-3.5 rounded-xl bg-[#0E1724] border border-[#223348] flex flex-col justify-between min-h-[150px]">
            <div className="flex items-center justify-between border-b border-[#223348]/70 pb-1.5 mb-2">
              <span className="text-[11px] uppercase font-bold text-[#D4A24C] tracking-wider">
                Gender
              </span>
              <span className="text-[9.5px] text-[#8E9CAE]">Citizen Demo</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs flex-1">
              <button
                onClick={() => setFilterGender(filterGender === "Male" ? "ALL" : "Male")}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  filterGender === "Male"
                    ? "bg-[#131E2D] border-[#D4A24C] text-[#F5EFE0] ring-1 ring-[#D4A24C]/40"
                    : "bg-[#070D15] border-[#223348]/60 text-[#CBD5E1] hover:border-[#D4A24C]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8E9CAE] font-semibold">M (Male)</span>
                  <span className="text-xs">👨</span>
                </div>
                <strong className="text-sm text-[#F5EFE0] font-mono font-bold block mt-1">
                  {analyticsMatrix.genderCounts.male}
                </strong>
              </button>

              <button
                onClick={() => setFilterGender(filterGender === "Female" ? "ALL" : "Female")}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  filterGender === "Female"
                    ? "bg-[#131E2D] border-[#D4A24C] text-[#F5EFE0] ring-1 ring-[#D4A24C]/40"
                    : "bg-[#070D15] border-[#223348]/60 text-[#CBD5E1] hover:border-[#D4A24C]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-pink-300/90 font-semibold">F (Female)</span>
                  <span className="text-xs">👩</span>
                </div>
                <strong className="text-sm text-pink-300 font-mono font-bold block mt-1">
                  {analyticsMatrix.genderCounts.female}
                </strong>
              </button>
            </div>
          </div>

          {/* Card 3: Age Groups Breakdown */}
          <div className="p-3.5 rounded-xl bg-[#0E1724] border border-[#223348] flex flex-col justify-between min-h-[150px]">
            <div className="flex items-center justify-between border-b border-[#223348]/70 pb-1.5 mb-2">
              <span className="text-[11px] uppercase font-bold text-[#D4A24C] tracking-wider">
                Age
              </span>
              <span className="text-[9.5px] text-[#8E9CAE]">Cohorts</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs flex-1">
              {(["20-30", "30-40", "40-50", "50+"] as const).map((ageGroup) => (
                <button
                  key={ageGroup}
                  onClick={() => setFilterAgeGroup(filterAgeGroup === ageGroup ? "ALL" : ageGroup)}
                  className={`p-1.5 px-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                    filterAgeGroup === ageGroup
                      ? "bg-[#131E2D] border-[#D4A24C] text-[#F5EFE0]"
                      : "bg-[#070D15] border-[#223348]/60 text-[#CBD5E1] hover:border-[#D4A24C]/40"
                  }`}
                >
                  <span className="text-[9.5px] text-[#8E9CAE] font-medium">{ageGroup}</span>
                  <strong className="text-[11px] text-[#F5EFE0] font-mono font-bold">
                    {analyticsMatrix.ageCounts[ageGroup]}
                  </strong>
                </button>
              ))}
            </div>
          </div>

          {/* Card 4: Mandal-wise Breakdown */}
          <div className="p-3.5 rounded-xl bg-[#0E1724] border border-[#223348] flex flex-col justify-between min-h-[150px]">
            <div className="flex items-center justify-between border-b border-[#223348]/70 pb-1.5 mb-2">
              <span className="text-[11px] uppercase font-bold text-[#D4A24C] tracking-wider">
                Mandal Wise
              </span>
              <span className="text-[9.5px] text-[#8E9CAE]">5 Sectors</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-xs flex-1">
              {analyticsMatrix.mandalCounts.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setFilterMandalId(filterMandalId === m.id ? "ALL" : m.id)}
                  className={`p-1 rounded-lg border text-center transition-all cursor-pointer flex flex-col justify-center ${
                    filterMandalId === m.id
                      ? "bg-[#131E2D] border-[#D4A24C] text-[#F5EFE0]"
                      : "bg-[#070D15] border-[#223348]/60 text-[#CBD5E1] hover:border-[#D4A24C]/40"
                  }`}
                >
                  <span className="text-[9px] text-[#8E9CAE] block font-bold truncate">{m.key}</span>
                  <strong className="text-[11px] text-[#D4A24C] font-mono font-bold block mt-0.5">
                    {m.count}
                  </strong>
                </button>
              ))}
            </div>
          </div>

          {/* Card 5: Type Breakdown */}
          <div className="p-3.5 rounded-xl bg-[#0E1724] border border-[#223348] flex flex-col justify-between min-h-[150px]">
            <div className="flex items-center justify-between border-b border-[#223348]/70 pb-1.5 mb-1.5 shrink-0">
              <span className="text-[11px] uppercase font-bold text-[#D4A24C] tracking-wider">
                Type
              </span>
              <span className="text-[9.5px] text-[#8E9CAE]">Nature of Issues</span>
            </div>
            <div className="max-h-[105px] overflow-y-auto space-y-1 text-xs pr-1 flex-1 no-scrollbar">
              {analyticsMatrix.typeCounts.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setFilterType(filterType === t.name ? "ALL" : t.name)}
                  title={t.name}
                  className={`w-full p-1 px-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-1 ${
                    filterType === t.name
                      ? "bg-[#131E2D] border-[#D4A24C] text-[#F5EFE0] ring-1 ring-[#D4A24C]/40"
                      : "bg-[#070D15] border-[#223348]/60 text-[#CBD5E1] hover:border-[#D4A24C]/40"
                  }`}
                >
                  <span className="text-[10px] text-[#CBD5E1] truncate block">{t.name}</span>
                  <strong className="text-[11px] text-[#D4A24C] font-mono font-bold shrink-0">{t.count}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Full Department Roster & Civic Intelligence Distribution */}
        <div className="pt-3 border-t border-[#223348]/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4A24C] flex items-center gap-1.5">
              <span>🏛️</span> DEPARTMENT
            </span>
            <span className="text-[11px] text-[#8E9CAE]">
              {analyticsMatrix.departmentCounts.length} active department categories across constituency
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterDepartment("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                filterDepartment === "ALL"
                  ? "bg-[#D4A24C] text-[#0B131E] font-bold border-[#D4A24C] shadow-sm"
                  : "bg-[#0B131E]/80 border-[#223348] text-[#CBD5E1] hover:border-[#D4A24C]/50"
              }`}
            >
              All Grievances ({totalOperationsCount})
            </button>

            {analyticsMatrix.departmentCounts.map((dept) => {
              const deptItems = allOperationsList.filter((i) => getItemDepartment(i) === dept.name);
              const resolved = deptItems.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
              const isSelected = filterDepartment === dept.name;

              return (
                <button
                  key={dept.name}
                  onClick={() => setFilterDepartment(isSelected ? "ALL" : dept.name)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#131E2D] border-[#D4A24C] text-[#F5EFE0] ring-1 ring-[#D4A24C]/40 shadow-sm"
                      : "bg-[#0B131E]/80 border-[#223348] text-[#CBD5E1] hover:border-[#D4A24C]/40"
                  }`}
                >
                  <span className="font-medium text-[#F5EFE0]">{dept.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#070D15] text-[#D4A24C] font-mono text-[10.5px] font-bold">
                    {dept.count}
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    ({resolved}/{dept.count} fixed)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Volunteer Force Management Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-[#F5EFE0] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4A24C]" />
            Assigned Volunteer Squads & Field Force
          </h2>
          <div className="flex items-center gap-2">
            {filterVolunteerId !== "ALL" && (
              <button
                onClick={() => setFilterVolunteerId("ALL")}
                className="px-2.5 py-1 rounded-lg bg-[#D4A24C]/20 hover:bg-[#D4A24C]/30 text-[#D4A24C] text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Clear Filter (Show All)
              </button>
            )}
            <span className="text-xs text-[#CBD5E1]">
              {volunteers.length} field agents reporting to you
            </span>
          </div>
        </div>

        {volunteers.length === 1 ? (
          /* Single Volunteer Full-Width Command Card (Zero Blank Squeeze) */
          <div
            onClick={() => setFilterVolunteerId(filterVolunteerId === volunteers[0].id ? "ALL" : volunteers[0].id)}
            className={`p-5 rounded-2xl border backdrop-blur-xl transition-all cursor-pointer shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
              filterVolunteerId === volunteers[0].id
                ? "bg-[#131E2D] border-[#D4A24C] ring-2 ring-[#D4A24C]/40"
                : "bg-[#0E1724]/75 border-[#223348]/80 hover:border-[#D4A24C]/60 hover:bg-[#131E2D]/85"
            }`}
          >
            {/* Left: Volunteer Info */}
            <div className="flex items-center gap-4 min-w-0">
              <img
                src={volunteers[0].avatar}
                alt={volunteers[0].name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4A24C] shadow-md shrink-0"
              />
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg text-[#F5EFE0] font-semibold">
                    {volunteers[0].name}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    Active On Field
                  </span>
                  {filterVolunteerId === volunteers[0].id && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#D4A24C] text-[#0B131E]">
                      Filtered
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#CBD5E1]">
                  {volunteers[0].designation || volunteers[0].roleTitle || "Booth & Village Field Volunteer"}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8E9CAE] pt-0.5">
                  <span className="flex items-center gap-1 text-[#D8CFB8]">
                    <Building2 className="w-3.5 h-3.5 text-[#D4A24C]" />
                    {volunteers[0].assignedMandalName || "Banaganapalle Town (Town)"}
                  </span>
                  <span className="flex items-center gap-1 text-[#D8CFB8]">
                    <MapPin className="w-3.5 h-3.5 text-[#D4A24C]" />
                    {volunteers[0].assignedVillageNames?.join(", ") || "Wards 1-10, Yaganti Sector"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Performance KPIs */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#223348]/60">
              <div className="p-2.5 px-4 rounded-xl bg-[#0B131E]/90 border border-[#223348] text-center min-w-[80px]">
                <span className="text-[10px] text-[#8E9CAE] uppercase block font-semibold">Total Assigned</span>
                <strong className="font-display text-base text-[#F5EFE0]">{allOperationsList.length}</strong>
              </div>
              <div className="p-2.5 px-4 rounded-xl bg-[#0B131E]/90 border border-[#223348] text-center min-w-[80px]">
                <span className="text-[10px] text-emerald-300 uppercase block font-semibold">Resolved</span>
                <strong className="font-display text-base text-emerald-400">{completedCount}</strong>
              </div>
              <div className="p-2.5 px-4 rounded-xl bg-[#0B131E]/90 border border-[#223348] text-center min-w-[80px]">
                <span className="text-[10px] text-rose-300 uppercase block font-semibold">Overdue</span>
                <strong className="font-display text-base text-rose-400">{overdueCount}</strong>
              </div>
              <div className="p-2.5 px-4 rounded-xl bg-[#0B131E]/90 border border-[#223348] text-center min-w-[80px] hidden sm:block">
                <span className="text-[10px] text-[#D4A24C] uppercase block font-semibold">Efficiency</span>
                <strong className="font-display text-base text-[#D4A24C]">
                  {allOperationsList.length > 0 ? Math.round((completedCount / allOperationsList.length) * 100) : 100}%
                </strong>
              </div>
            </div>
          </div>
        ) : (
          /* Multi-volunteer grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {volunteers.map((vol) => {
              const volIssues = allOperationsList.filter((i) => i.assignedVolunteerName === vol.name || i.assignedVolunteerId === vol.id);
              const volCompleted = volIssues.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
              const volOverdue = volIssues.filter((i) => i.status === "OVERDUE").length;

              return (
                <div
                  key={vol.id}
                  onClick={() => setFilterVolunteerId(filterVolunteerId === vol.id ? "ALL" : vol.id)}
                  className={`p-4 rounded-xl border backdrop-blur-xl transition-all cursor-pointer space-y-3 flex flex-col justify-between ${
                    filterVolunteerId === vol.id
                      ? "bg-[#131E2D] border-[#D4A24C] ring-2 ring-[#D4A24C]/40"
                      : "bg-[#0E1724]/75 border-[#223348]/80 hover:border-[#D4A24C]/50 hover:bg-[#131E2D]/85"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={vol.avatar}
                      alt={vol.name}
                      className="w-10 h-10 rounded-xl object-cover border border-[#D4A24C]/40 shadow-sm shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-[13px] text-[#F5EFE0] truncate">
                        {vol.name}
                      </h4>
                      <span className="text-[10px] text-[#CBD5E1] block truncate">
                        {vol.assignedConstituency || "Village Agent"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#223348]/60 text-center text-[10px]">
                    <div className="p-1 rounded bg-[#0B131E]/80">
                      <span className="text-[#8E9CAE] block font-semibold">Total</span>
                      <strong className="text-[#F5EFE0]">{volIssues.length}</strong>
                    </div>
                    <div className="p-1 rounded bg-[#0B131E]/80">
                      <span className="text-emerald-300 block font-semibold">Done</span>
                      <strong className="text-emerald-400">{volCompleted}</strong>
                    </div>
                    <div className="p-1 rounded bg-[#0B131E]/80">
                      <span className="text-rose-300 block font-semibold">Overdue</span>
                      <strong className={volOverdue > 0 ? "text-rose-400" : "text-[#8E9CAE]"}>
                        {volOverdue}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter & Sort Master Command Strip */}
      <div className="p-4 rounded-2xl bg-[#0E1724] border border-[#223348] shadow-lg space-y-3">
        {/* Row 1: Search, Sort & View Mode */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
            <input
              type="text"
              placeholder="Search by ID, title, village, citizen, phone..."
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

            {/* Grid vs Table View Toggle */}
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

            {/* Export to PDF Button */}
            <button
              onClick={() => setIsAiPdfModalOpen(true)}
              className="p-1.5 px-3 rounded-xl bg-[#131E2D] border border-[#D4A24C]/50 hover:border-[#D4A24C] text-[#D4A24C] hover:text-[#F5EFE0] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Generate & Export Tickets PDF Report"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" />
              <span className="text-[11px]">Export to PDF</span>
            </button>
          </div>
        </div>

        {/* Row 2: Granular Filter Dropdowns (Status, Department, Type, Category, Priority, Gender, Age, Mandal, Assignee) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-2 pt-1 text-xs">
          {/* Status Filter */}
          <div>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Status: All</option>
              <option value="PENDING">Status: 🟡 Pending</option>
              <option value="IN_PROGRESS">Status: 🔵 In Progress</option>
              <option value="COMPLETED">Status: 🟢 Resolved</option>
              <option value="CANT_BE_DONE">Status: 🔴 Can't be done</option>
              <option value="OVERDUE">Status: ⚠️ Overdue</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Dept: All</option>
              {analyticsMatrix.departmentCounts.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Type: All</option>
              {analyticsMatrix.typeCounts.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Category: All</option>
              {availableCategories.map((c) => (
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
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Priority: All</option>
              <option value="URGENT">🔴 Urgent</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🟢 Low</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Gender: All</option>
              <option value="Male">👨 Male (M)</option>
              <option value="Female">👩 Female (F)</option>
            </select>
          </div>

          {/* Age Group Filter */}
          <div>
            <select
              value={filterAgeGroup}
              onChange={(e) => setFilterAgeGroup(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Age: All</option>
              <option value="20-30">Age: 20-30</option>
              <option value="30-40">Age: 30-40</option>
              <option value="40-50">Age: 40-50</option>
              <option value="50+">Age: 50+</option>
            </select>
          </div>

          {/* Mandal Filter */}
          <div>
            <select
              value={filterMandalId}
              onChange={(e) => setFilterMandalId(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Mandal: All</option>
              {mandals.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <select
              value={filterVolunteerId}
              onChange={(e) => setFilterVolunteerId(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Assignee: All</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Active Filter Chips & Clear All */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#223348]/70 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-semibold text-[#8E9CAE]">Active Filters:</span>
              {activeTab !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Status: {activeTab}
                </span>
              )}
              {filterDepartment !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Dept: {filterDepartment}
                </span>
              )}
              {filterType !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Type: {filterType}
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
              {filterGender !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Gender: {filterGender}
                </span>
              )}
              {filterAgeGroup !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Age: {filterAgeGroup}
                </span>
              )}
              {filterReporterType !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Reporter: {filterReporterType}
                </span>
              )}
              {filterMandalId !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Mandal Filtered
                </span>
              )}
              {filterVolunteerId !== "ALL" && (
                <span className="px-2 py-0.5 rounded-md bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[11px]">
                  Volunteer Filtered
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

      {/* Issues Master Table / Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#8E9CAE]">Loading operational grid...</div>
        ) : sortedAndFilteredOperations.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0E1724]/75 backdrop-blur-xl border border-[#223348]/80 text-center space-y-3">
            <h3 className="text-base font-semibold text-[#F5EFE0]">No operational records match selected filters</h3>
            <p className="text-xs text-[#8E9CAE]">Try adjusting your search keyword, category, or status criteria.</p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] font-bold text-xs cursor-pointer shadow-md"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === "GRID" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedOperations.map((issue) => (
              <div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="p-5 rounded-2xl bg-[#0E1724] border border-[#223348] hover:border-[#D4A24C]/60 hover:bg-[#131E2D] transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-sm hover:shadow-md"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-[#D4A24C] bg-[#070D15] px-1.5 py-0.5 rounded border border-[#D4A24C]/30 font-bold">
                        #{issue.id}
                      </span>
                      <span
                        className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          issue.issueType === "GRIEVANCE"
                            ? "bg-amber-950/70 text-amber-300 border-amber-500/40"
                            : "bg-sky-950/70 text-sky-300 border-sky-500/40"
                        }`}
                      >
                        {issue.issueType === "GRIEVANCE" ? "Grievance" : "Field Issue"}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          issue.status === "COMPLETED" || issue.status === "RESOLVED"
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                            : issue.status === "IN_PROGRESS"
                            ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                            : issue.status === "OVERDUE"
                            ? "bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse"
                            : "bg-blue-950/60 text-blue-300 border-blue-500/40"
                        }`}
                      >
                        {issue.status}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        issue.priority === "URGENT"
                          ? "text-red-400 bg-red-950/60 border border-red-500/40"
                          : issue.priority === "HIGH"
                          ? "text-orange-400 bg-orange-950/60 border border-orange-500/40"
                          : "text-[#D8CFB8] bg-[#070D15]"
                      }`}
                    >
                      {issue.priority}
                    </span>
                  </div>

                  <h3 className="font-display text-[15px] font-semibold text-[#F5EFE0] line-clamp-1 group-hover:text-[#D4A24C] transition-colors">
                    {issue.title}
                  </h3>
                  <p className="text-[12px] text-[#A69B80] line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#223348]/60 text-[11px]">
                  <div className="flex items-center justify-between text-[#D8CFB8]">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                      <strong>{issue.mandalName}</strong> · {issue.villageName}
                    </span>
                    <span className="text-[#8E9CAE] font-mono text-[10px] shrink-0">AC-140</span>
                  </div>

                  <div className="flex items-center justify-between text-[#CBD5E1]">
                    <span>Created: <strong className="font-mono text-[#F5EFE0]">{issue.reportedDate}</strong></span>
                    <span>Complete: <strong className="font-mono text-emerald-400">{issue.completedDate || (issue.status === "COMPLETED" || issue.status === "RESOLVED" ? (issue.updatedDate || issue.reportedDate) : "In Progress")}</strong></span>
                  </div>

                  <div className="flex items-center justify-between text-[#8E9CAE]">
                    <span>Reporter: <strong className="text-[#F5EFE0]">{issue.reportedBy}</strong></span>
                    <span>Agent: <strong className="text-[#D4A24C]">{issue.assignedVolunteerName || "Unassigned"}</strong></span>
                  </div>

                  {issue.lastStatusRemarks && (
                    <div className="p-2 rounded bg-[#070D15] text-[10px] text-[#E2DCBE] line-clamp-1 border border-[#223348]/50">
                      <strong className="text-[#D4A24C]">Update: </strong>{issue.lastStatusRemarks}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW WITH WORDWRAP - ZERO HORIZONTAL SCROLL */
          <div className="rounded-2xl bg-[#0E1724] border border-[#223348] overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0B131E] border-b border-[#223348] text-[#D4A24C] uppercase text-[10.5px] font-semibold tracking-wider">
                  <th className="py-3 px-3 w-[11%]">ID & Type</th>
                  <th className="py-3 px-3 w-[29%]">Issue Title & Scope</th>
                  <th className="py-3 px-3 w-[15%]">Category / Dept</th>
                  <th className="py-3 px-3 w-[15%]">Mandal / Location</th>
                  <th className="py-3 px-3 w-[14%]">Reported By</th>
                  <th className="py-3 px-3 w-[10%]">Timeline</th>
                  <th className="py-3 px-3 w-[6%] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#223348]/50">
                {paginatedOperations.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="hover:bg-[#131E2D]/70 transition-colors cursor-pointer group"
                  >
                    {/* 1. ID & Type */}
                    <td className="py-3 px-3 align-top">
                      <div className="font-mono font-bold text-[#D4A24C] text-[11px]">
                        #{issue.id}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block ${
                            issue.issueType === "GRIEVANCE"
                              ? "bg-amber-950/70 text-amber-300 border-amber-500/40"
                              : "bg-sky-950/70 text-sky-300 border-sky-500/40"
                          }`}
                        >
                          {issue.issueType === "GRIEVANCE" ? "Grievance" : "Field Issue"}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block ${
                            issue.status === "COMPLETED" || issue.status === "RESOLVED"
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                              : issue.status === "IN_PROGRESS"
                              ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                              : issue.status === "OVERDUE" || (issue as any).status === "Can't be done"
                              ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                              : "bg-blue-950/60 text-blue-300 border-blue-500/40"
                          }`}
                        >
                          {issue.status}
                        </span>
                      </div>
                    </td>

                    {/* 2. Title & Scope (Word-wrapped) */}
                    <td className="py-3 px-3 align-top">
                      <div className="font-semibold text-[#F5EFE0] group-hover:text-[#D4A24C] transition-colors break-words leading-snug">
                        {issue.title}
                      </div>
                      <div className="text-[11px] text-[#8E9CAE] break-words mt-1 leading-relaxed">
                        {issue.description}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                            issue.priority === "URGENT"
                              ? "text-red-400 bg-red-950/60 border border-red-500/40"
                              : issue.priority === "HIGH"
                              ? "text-orange-400 bg-orange-950/60 border border-orange-500/40"
                              : "text-[#CBD5E1] bg-[#0B131E]"
                          }`}
                        >
                          Priority: {issue.priority}
                        </span>
                      </div>
                    </td>

                    {/* 3. Category & Department (Word-wrapped) */}
                    <td className="py-3 px-3 align-top">
                      <div className="font-medium text-[#F5EFE0] break-words">{issue.category}</div>
                      {issue.department && (
                        <div className="text-[10.5px] text-[#D4A24C] break-words mt-0.5">
                          {issue.department}
                        </div>
                      )}
                    </td>

                    {/* 4. Mandal & Location (Word-wrapped) */}
                    <td className="py-3 px-3 align-top">
                      <div className="font-medium text-[#F5EFE0] break-words">{issue.mandalName}</div>
                      <div className="text-[10.5px] text-[#8E9CAE] break-words mt-0.5">
                        📍 {issue.villageName || issue.placeName || "Sector Ward"}
                      </div>
                    </td>

                    {/* 5. Reported By (Word-wrapped) */}
                    <td className="py-3 px-3 align-top">
                      <div className="font-medium text-[#F5EFE0] break-words">{issue.reportedBy}</div>
                      <div className="text-[10.5px] text-[#D4A24C] break-words mt-0.5">
                        {issue.reporterType === "LEADER" ? "Leader" : issue.reporterType === "CADRE" ? "Cadre" : "Citizen"}
                        {issue.reporterPhone ? ` · ${issue.reporterPhone}` : ""}
                      </div>
                      <div className="text-[10px] text-[#8E9CAE] break-words mt-0.5">
                        Agent: <strong className="text-[#CBD5E1]">{issue.assignedVolunteerName || "Unassigned"}</strong>
                      </div>
                    </td>

                    {/* 6. Timeline Dates (Word-wrapped) */}
                    <td className="py-3 px-3 align-top font-mono text-[10.5px]">
                      <div className="text-[#CBD5E1]">
                        <span className="text-[#8E9CAE]">Rep: </span>
                        {issue.reportedDate}
                      </div>
                      <div className="mt-1">
                        {issue.completedDate ? (
                          <span className="text-emerald-400 font-semibold">Done: {issue.completedDate}</span>
                        ) : issue.status === "COMPLETED" || issue.status === "RESOLVED" ? (
                          <span className="text-emerald-400 font-semibold">Resolved</span>
                        ) : (
                          <span className="text-amber-400/90">Pending</span>
                        )}
                      </div>
                    </td>

                    {/* 7. Action */}
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Global Pagination Bar */}
        {sortedAndFilteredOperations.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:px-5 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#223348] text-xs">
            <div className="text-[#8E9CAE] font-mono text-center sm:text-left">
              Showing{" "}
              <strong className="text-[#F5EFE0]">
                {(currentPage - 1) * pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-[#F5EFE0]">
                {Math.min(currentPage * pageSize, sortedAndFilteredOperations.length)}
              </strong>{" "}
              of{" "}
              <strong className="text-[#D4A24C]">
                {sortedAndFilteredOperations.length}
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

      {/* Tickets Table PDF Export Modal */}
      {isAiPdfModalOpen && (
        <AiTicketsPdfReportModal
          isOpen={isAiPdfModalOpen}
          onClose={() => setIsAiPdfModalOpen(false)}
          issues={sortedAndFilteredOperations}
          currentUser={currentUser}
          constituencyName="Banaganapalle AC (AC-140)"
        />
      )}
    </div>
  );
};
