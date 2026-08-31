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
import { IssueDetailModal } from "./IssueDetailModal";
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

  // Selected Issue for Modal
  const [selectedIssue, setSelectedIssue] = useState<FieldIssue | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<"ALL" | "OVERDUE" | "PENDING" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [filterVolunteerId, setFilterVolunteerId] = useState<string>("ALL");
  const [filterMandalId, setFilterMandalId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDirectorData();
  }, [currentUser.id]);

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

  // Filtered Operations
  const filteredOperations = useMemo(() => {
    return allOperationsList.filter((item) => {
      if (activeTab === "OVERDUE" && item.status !== "OVERDUE") return false;
      if (activeTab === "PENDING" && !["NEW", "ASSIGNED"].includes(item.status)) return false;
      if (activeTab === "IN_PROGRESS" && item.status !== "IN_PROGRESS") return false;
      if (activeTab === "COMPLETED" && !["COMPLETED", "RESOLVED"].includes(item.status)) return false;

      if (filterVolunteerId !== "ALL" && item.assignedVolunteerId !== filterVolunteerId) return false;
      if (filterMandalId !== "ALL" && item.mandalId !== filterMandalId) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.villageName || "").toLowerCase().includes(q) ||
          (item.mandalName || "").toLowerCase().includes(q) ||
          (item.assignedVolunteerName || "").toLowerCase().includes(q) ||
          item.reportedBy.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allOperationsList, activeTab, filterVolunteerId, filterMandalId, searchQuery]);

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
              <span className="text-xs text-[#D8CFB8]">{currentUser.assignedConstituency || "Constituency Field Command"}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-[#F5EFE0] font-normal mt-0.5">
              {currentUser.name}
            </h1>
            <p className="text-xs text-[#8E9CAE] mt-0.5">
              Managing {volunteers.length} Field Volunteers across {mandals.length} Mandals
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#0B131E]/80 border border-[#223348] text-right">
            <span className="text-[10px] uppercase text-[#8E9CAE] block font-semibold">Cadre Strength</span>
            <span className="font-display text-lg font-bold text-[#D4A24C]">
              {volunteers.length} Active Agents
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
            <span>Field Work Alert: Overdue Issues Require Manager Intervention</span>
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
            <span>All Operations ({issues.length + normalizedGrievances.length})</span>
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
            <span>Field Complaints ({issues.length})</span>
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
            <span>Citizen Grievance Desk ({normalizedGrievances.length})</span>
          </button>
        </div>

        <div className="text-xs text-[#CBD5E1] font-mono">
          Showing <strong className="text-[#D4A24C]">{filteredOperations.length}</strong> active stream items
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
          <span className="text-[10px] uppercase tracking-wider text-[#8E9CAE] block font-semibold">Total Operations</span>
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
          <span className="text-xs text-[#8E9CAE]">
            {volunteers.length} field agents reporting to you
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {volunteers.map((vol) => {
            const volIssues = issues.filter((i) => i.assignedVolunteerId === vol.id);
            const volCompleted = volIssues.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
            const volOverdue = volIssues.filter((i) => i.status === "OVERDUE").length;

            return (
              <div
                key={vol.id}
                onClick={() => setFilterVolunteerId(filterVolunteerId === vol.id ? "ALL" : vol.id)}
                className={`p-4 rounded-xl border backdrop-blur-xl transition-all cursor-pointer space-y-3 ${
                  filterVolunteerId === vol.id
                    ? "bg-[#131E2D] border-[#D4A24C] ring-2 ring-[#D4A24C]/40"
                    : "bg-[#0E1724]/75 border-[#223348]/80 hover:border-[#D4A24C]/50 hover:bg-[#131E2D]/85"
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={vol.avatar}
                    alt={vol.name}
                    className="w-10 h-10 rounded-xl object-cover border border-[#D4A24C]/40 shadow-sm"
                  />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[13px] text-[#F5EFE0] truncate">
                      {vol.name}
                    </h4>
                    <span className="text-[10px] text-[#8E9CAE] block truncate">
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
      </div>

      {/* Filter & Search Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
            <input
              type="text"
              placeholder="Search issues, grievances, citizen names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl pl-9 pr-3 py-2 text-[12px] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
            />
          </div>

          <select
            value={filterVolunteerId}
            onChange={(e) => setFilterVolunteerId(e.target.value)}
            className="bg-[#0B131E] border border-[#223348] rounded-xl px-3 py-2 text-[12px] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
          >
            <option value="ALL">All Assignees / Volunteers</option>
            {volunteers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <select
            value={filterMandalId}
            onChange={(e) => setFilterMandalId(e.target.value)}
            className="bg-[#0B131E] border border-[#223348] rounded-xl px-3 py-2 text-[12px] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
          >
            <option value="ALL">All Mandals / Sectors</option>
            {mandals.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Grid vs Table View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#0B131E] border border-[#223348] text-xs">
            <button
              onClick={() => setViewMode("GRID")}
              title="Grid Cards View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "GRID"
                  ? "bg-[#D4A24C] text-[#0B131E] font-bold shadow-sm"
                  : "text-[#CBD5E1] hover:text-white"
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
                  ? "bg-[#D4A24C] text-[#0B131E] font-bold shadow-sm"
                  : "text-[#CBD5E1] hover:text-white"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Table</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            {(["ALL", "OVERDUE", "PENDING", "IN_PROGRESS", "COMPLETED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider transition-all cursor-pointer shrink-0 ${
                  activeTab === tab
                    ? "bg-[#D4A24C] text-[#0B131E] font-bold"
                    : "bg-[#0B131E]/80 text-[#CBD5E1] hover:text-white border border-[#223348]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Issues Master Table / Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#8E9CAE]">Loading operational grid...</div>
        ) : filteredOperations.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0E1724]/75 backdrop-blur-xl border border-[#223348]/80 text-center space-y-2">
            <h3 className="text-sm font-semibold text-[#F5EFE0]">No operational items match criteria</h3>
            <p className="text-xs text-[#8E9CAE]">Try clearing active filters or selecting another operations stream.</p>
          </div>
        ) : viewMode === "GRID" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOperations.map((issue) => (
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
                  {filteredOperations.map((issue) => (
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#131E2D] hover:bg-[#1E3048] text-[#D4A24C] text-[11px] font-semibold border border-[#D4A24C]/30 transition-colors"
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
      </div>

      {/* Selected Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          currentUser={currentUser}
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onIssueUpdated={loadDirectorData}
        />
      )}
    </div>
  );
};
