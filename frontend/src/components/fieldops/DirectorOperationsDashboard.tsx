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
  Paperclip,
  Inbox,
  ClipboardList
} from "lucide-react";

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

  // Selected Issue for Full-Page Detail View
  const [selectedIssue, setSelectedIssue] = useState<FieldIssue | null>(null);

  // Filters & Sorting State
  const [activeTab, setActiveTab] = useState<"ALL" | "OVERDUE" | "PENDING" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterReporterType, setFilterReporterType] = useState<string>("ALL");
  const [filterVolunteerId, setFilterVolunteerId] = useState<string>("ALL");
  const [filterMandalId, setFilterMandalId] = useState<string>("ALL");
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
    filterPriority,
    filterReporterType,
    filterVolunteerId,
    filterMandalId,
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

  // Metrics
  const totalOperationsCount = allOperationsList.length;
  const pendingCount = allOperationsList.filter((i) => ["NEW", "ASSIGNED"].includes(i.status)).length;
  const inProgressCount = allOperationsList.filter((i) => i.status === "IN_PROGRESS").length;
  const completedCount = allOperationsList.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
  const overdueCount = allOperationsList.filter((i) => i.status === "OVERDUE").length;

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
      if (activeTab === "OVERDUE" && item.status !== "OVERDUE") return false;
      if (activeTab === "PENDING" && !["NEW", "ASSIGNED"].includes(item.status)) return false;
      if (activeTab === "IN_PROGRESS" && item.status !== "IN_PROGRESS") return false;
      if (activeTab === "COMPLETED" && !["COMPLETED", "RESOLVED"].includes(item.status)) return false;

      if (filterCategory !== "ALL" && item.category !== filterCategory) return false;
      if (filterPriority !== "ALL" && item.priority !== filterPriority) return false;
      if (filterReporterType !== "ALL" && item.reporterType !== filterReporterType) return false;
      if (filterVolunteerId !== "ALL" && item.assignedVolunteerId !== filterVolunteerId) return false;
      if (filterMandalId !== "ALL" && item.mandalId !== filterMandalId) return false;

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
    filterPriority,
    filterReporterType,
    filterVolunteerId,
    filterMandalId,
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
    filterPriority !== "ALL" ||
    filterReporterType !== "ALL" ||
    filterVolunteerId !== "ALL" ||
    filterMandalId !== "ALL" ||
    searchQuery.trim().length > 0 ||
    sortBy !== "NEWEST";

  const clearAllFilters = () => {
    setActiveTab("ALL");
    setFilterCategory("ALL");
    setFilterPriority("ALL");
    setFilterReporterType("ALL");
    setFilterVolunteerId("ALL");
    setFilterMandalId("ALL");
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#071322]/45 backdrop-blur-xl border border-[#D4A24C]/40 shadow-2xl">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4A24C] shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#071322]/70 text-[#D4A24C] border border-[#D4A24C]/40 font-mono">
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
          <div className="px-4 py-2 rounded-xl bg-[#0B131E]/80 border border-[#223348] text-right">
            <span className="text-[10px] uppercase text-[#8E9CAE] block font-semibold">Cadre Strength</span>
            <span className="font-display text-lg font-bold text-[#D4A24C]">
              {volunteers.length} Active Field Agents
            </span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[#0B131E]/80 border border-[#223348] text-right">
            <span className="text-[10px] uppercase text-[#8E9CAE] block font-semibold">Resolution Rate</span>
            <span className="font-display text-lg font-bold text-emerald-400">
              {totalOperationsCount > 0 ? Math.round((completedCount / totalOperationsCount) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* "No Work Done" Inactivity Alert Banner */}
      {inactiveVolunteerWarnings.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 backdrop-blur-md border border-rose-500/50 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Grievance Alert: Overdue Issues Require Manager Intervention</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {inactiveVolunteerWarnings.map((w, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#0B131E]/90 border border-rose-500/30 flex items-center justify-between text-[11px]"
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

      {/* 1. Merged Operations Stream Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#0E1724]/80 backdrop-blur-xl border border-[#223348]">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setOperationsStream("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              operationsStream === "ALL"
                ? "bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] shadow-md font-bold"
                : "bg-[#0B131E]/80 text-[#CBD5E1] hover:text-[#F5EFE0] border border-[#223348]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Grievances ({issues.length + normalizedGrievances.length})</span>
          </button>

          <button
            onClick={() => setOperationsStream("FIELD_ISSUES")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              operationsStream === "FIELD_ISSUES"
                ? "bg-[#D4A24C] text-[#0B131E] shadow-md font-bold"
                : "bg-[#0B131E]/80 text-[#CBD5E1] hover:text-[#F5EFE0] border border-[#223348]"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Field Grievances ({issues.length})</span>
          </button>

          <button
            onClick={() => setOperationsStream("GRIEVANCES")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              operationsStream === "GRIEVANCES"
                ? "bg-[#D4A24C] text-[#0B131E] shadow-md font-bold"
                : "bg-[#0B131E]/80 text-[#CBD5E1] hover:text-[#F5EFE0] border border-[#223348]"
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Citizen Petitions ({normalizedGrievances.length})</span>
          </button>
        </div>

        <div className="text-xs text-[#CBD5E1] font-mono">
          Showing <strong className="text-[#D4A24C]">{sortedAndFilteredOperations.length}</strong> active grievance records
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab("ALL")}
          className={`p-4 rounded-xl border backdrop-blur-xl transition-all cursor-pointer ${
            activeTab === "ALL"
              ? "bg-[#131E2D] border-[#D4A24C] shadow-md"
              : "bg-[#0E1724]/75 border-[#223348]/80 hover:border-[#D4A24C]/40"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-[#8E9CAE] block font-semibold">Total Grievances</span>
          <div className="font-display text-2xl font-bold text-[#F5EFE0] mt-1">{totalOperationsCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("PENDING")}
          className={`p-4 rounded-xl border backdrop-blur-xl transition-all cursor-pointer ${
            activeTab === "PENDING"
              ? "bg-[#131E2D] border-[#D4A24C] shadow-md"
              : "bg-[#0E1724]/75 border-[#223348]/80 hover:border-[#D4A24C]/40"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-blue-300 block font-semibold">Pending Intake</span>
          <div className="font-display text-2xl font-bold text-blue-400 mt-1">{pendingCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("IN_PROGRESS")}
          className={`p-4 rounded-xl border backdrop-blur-xl transition-all cursor-pointer ${
            activeTab === "IN_PROGRESS"
              ? "bg-[#131E2D] border-[#D4A24C] shadow-md"
              : "bg-[#0E1724]/75 border-[#223348]/80 hover:border-[#D4A24C]/40"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-amber-300 block font-semibold">In Progress</span>
          <div className="font-display text-2xl font-bold text-amber-400 mt-1">{inProgressCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("COMPLETED")}
          className={`p-4 rounded-xl border backdrop-blur-xl transition-all cursor-pointer ${
            activeTab === "COMPLETED"
              ? "bg-[#131E2D] border-[#D4A24C] shadow-md"
              : "bg-[#0E1724]/75 border-[#223348]/80 hover:border-[#D4A24C]/40"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-emerald-300 block font-semibold">Verified Resolved</span>
          <div className="font-display text-2xl font-bold text-emerald-400 mt-1">{completedCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("OVERDUE")}
          className={`p-4 rounded-xl border backdrop-blur-xl transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            activeTab === "OVERDUE"
              ? "bg-rose-950/70 border-rose-500 shadow-md"
              : "bg-[#0E1724]/75 border-[#223348]/80 hover:border-rose-500/40"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-rose-400 block font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Overdue Work
          </span>
          <div className="font-display text-2xl font-bold text-rose-400 mt-1">{overdueCount}</div>
        </div>
      </div>

      {/* Volunteer Team Grid */}
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
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#D4A24C]" />
                    {volunteers[0].phone || "+91 98850 44003"}
                  </span>
                  <span className="hidden sm:inline">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#D4A24C]" />
                    {volunteers[0].assignedConstituency || "Banaganapalle AC · Banaganapalle Town & Yaganti"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Operational Metrics Strip */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#223348]/60">
              <div className="p-2.5 px-4 rounded-xl bg-[#0B131E]/90 border border-[#223348] text-center min-w-[80px]">
                <span className="text-[10px] text-[#8E9CAE] uppercase block font-semibold">Total Intake</span>
                <strong className="font-display text-base text-[#F5EFE0]">{allOperationsList.length}</strong>
              </div>
              <div className="p-2.5 px-4 rounded-xl bg-[#0B131E]/90 border border-[#223348] text-center min-w-[80px]">
                <span className="text-[10px] text-emerald-300 uppercase block font-semibold">Resolved</span>
                <strong className="font-display text-base text-emerald-400">{completedCount}</strong>
              </div>
              <div className="p-2.5 px-4 rounded-xl bg-[#0B131E]/90 border border-[#223348] text-center min-w-[80px]">
                <span className="text-[10px] text-rose-300 uppercase block font-semibold">Overdue</span>
                <strong className={`font-display text-base ${overdueCount > 0 ? "text-rose-400" : "text-[#8E9CAE]"}`}>
                  {overdueCount}
                </strong>
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
      <div className="p-4 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#223348] shadow-lg space-y-3">
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
          </div>
        </div>

        {/* Row 2: Granular Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-xs">
          {/* Status Tabs / Filter */}
          <div>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Status: All</option>
              <option value="OVERDUE">Status: 🔴 Overdue</option>
              <option value="PENDING">Status: 🟡 Pending Intake</option>
              <option value="IN_PROGRESS">Status: 🔵 In Progress</option>
              <option value="COMPLETED">Status: 🟢 Resolved</option>
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
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Priority: All</option>
              <option value="URGENT">🔴 Urgent</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🟢 Low</option>
            </select>
          </div>

          {/* Reporter Type Filter */}
          <div>
            <select
              value={filterReporterType}
              onChange={(e) => setFilterReporterType(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Reporter: All</option>
              <option value="CITIZEN">👤 Citizen</option>
              <option value="LEADER">⭐ Party Leader</option>
              <option value="CADRE">🛡️ Party Cadre</option>
            </select>
          </div>

          {/* Mandal Filter */}
          <div>
            <select
              value={filterMandalId}
              onChange={(e) => setFilterMandalId(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
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
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
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
                className="p-5 rounded-2xl bg-[#0E1724]/75 backdrop-blur-xl border border-[#223348]/80 hover:border-[#D4A24C]/60 hover:bg-[#131E2D]/85 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-sm hover:shadow-md"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-[#D4A24C] bg-[#0B131E] px-1.5 py-0.5 rounded border border-[#D4A24C]/30 font-bold">
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
                          : "text-[#D8CFB8] bg-[#0B131E]"
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
                    <div className="p-2 rounded bg-[#0B131E]/90 text-[10px] text-[#E2DCBE] line-clamp-1 border border-[#223348]/50">
                      <strong className="text-[#D4A24C]">Update: </strong>{issue.lastStatusRemarks}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-2xl bg-[#0E1724]/75 backdrop-blur-xl border border-[#223348]/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B131E] border-b border-[#223348] text-[#D4A24C] uppercase text-[10.5px] font-semibold tracking-wider">
                    <th className="py-3.5 px-4 font-mono">ID</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Issue Title & Scope</th>
                    <th className="py-3.5 px-4">Category / Dept</th>
                    <th className="py-3.5 px-4">Mandal / Town</th>
                    <th className="py-3.5 px-4">Village / Ward</th>
                    <th className="py-3.5 px-4">Reported By</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4">Complete Date</th>
                    <th className="py-3.5 px-4 text-center">Proofs</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#223348]/50">
                  {paginatedOperations.map((issue) => (
                    <tr
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="hover:bg-[#131E2D]/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#D4A24C] whitespace-nowrap">
                        #{issue.id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            issue.issueType === "GRIEVANCE"
                              ? "bg-amber-950/70 text-amber-300 border-amber-500/40"
                              : "bg-sky-950/70 text-sky-300 border-sky-500/40"
                          }`}
                        >
                          {issue.issueType === "GRIEVANCE" ? "Grievance" : "Field Issue"}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[220px]">
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
                      <td className="py-3 px-4 max-w-[150px]">
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
                      <td className="py-3 px-4 font-mono text-[#CBD5E1] whitespace-nowrap">
                        {issue.reportedDate}
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        {issue.completedDate ? (
                          <span className="text-emerald-400 font-semibold">{issue.completedDate}</span>
                        ) : issue.status === "COMPLETED" || issue.status === "RESOLVED" ? (
                          <span className="text-emerald-400 font-semibold">{issue.updatedDate || issue.reportedDate}</span>
                        ) : (
                          <span className="text-amber-400/90 text-[11px] font-sans">In Progress</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {issue.attachments && issue.attachments.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30 text-[10.5px] font-mono">
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
    </div>
  );
};
