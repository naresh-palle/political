import React, { useState, useEffect, useMemo } from "react";
import {
  FieldIssue,
  UserProfile,
  MandalInfo,
  VillageInfo,
  GeographicDrilldownNode
} from "../../types";
import { politicalApiService } from "../../services/api";
import { getAssignTicketsParamsFromHash, getTicketIdFromHash, clearTicketIdFromHash } from "../../utils/ticketHash";
import { IssueDetailView } from "./IssueDetailView";
import { EditProfileModal } from "../common/EditProfileModal";
import { AssignComplaintModal } from "./AssignComplaintModal";
import { TicketGridCard } from "./TicketGridCard";
import { OfficerStatusComments } from "./OfficerStatusComments";
import { assignmentSafeStatus, countByKpi, formatDashboardCount, kpiBucket, TICKET_TABLE_CELL, TICKET_TABLE_CLASS, TICKET_TABLE_HEAD_CELL, TICKET_TABLE_ROW_CLASS, TICKET_TABLE_SHELL, UNIQUE_TICKET_SURFACE } from "../../utils/ticketKpi";
import { formatIssueStatus } from "../../utils/statusLabels";
import { formatTicketDisplay, ticketSearchHaystack, rawTicketNumber, constituencyShortName } from "../../utils/ticketNumberDisplay";
import { findVolunteerForVillage } from "../../utils/villageVolunteers";
import {
  ShieldCheck,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Camera,
  Layers,
  Sparkles,
  UserCheck,
  Building2,
  Flame,
  FileText,
  Phone,
  Calendar,
  Edit3,
  MessageCircle,
} from "lucide-react";

interface AdminDashboardProps {
  currentUser: UserProfile;
  onUpdateProfile?: (updated: UserProfile) => void;
  initialFilterStatus?: string;
}

const ASSIGN_FILTER_CLASS =
  "min-w-0 w-full h-9 bg-transparent border-0 border-b border-[#223348] rounded-none px-0.5 text-xs text-[#F5EFE0] focus:border-[#D4A24C] outline-none [color-scheme:dark]";
const ASSIGN_OPTION_CLASS = "bg-[#0B131E] text-[#F5EFE0]";
const ASSIGN_GRID_CLASS = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-visible";
const HIERARCHY_CHIP =
  "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#071322] text-[#D4A24C] border border-[#D4A24C]/70";

const DashboardKpi = ({
  label,
  value,
  tone,
  onClick,
  icon
}: {
  label: string;
  value: number;
  tone: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}) => {
  const full = Number(value || 0).toLocaleString("en-IN");
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label}: ${full}`}
      className={`min-w-0 px-2 py-1.5 rounded-lg border text-left transition-all ${
        onClick ? "cursor-pointer" : "cursor-default"
      } ${tone}`}
    >
      <span className="flex items-center gap-1 text-[9px] uppercase tracking-wide font-semibold leading-tight whitespace-normal break-words">
        {icon}
        <span className="whitespace-normal break-words">{label}</span>
      </span>
      <span className="block font-display text-base font-bold tabular-nums leading-tight whitespace-normal break-words">
        {formatDashboardCount(value)}
      </span>
    </button>
  );
};

export const AdminOperationsDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onUpdateProfile,
  initialFilterStatus
}) => {
  const [drilldownData, setDrilldownData] = useState<any>(null);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roleDashboard, setRoleDashboard] = useState<any>(null);
  const [mandals, setMandals] = useState<MandalInfo[]>([]);
  const [villages, setVillages] = useState<VillageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const isPlatformSuperAdmin =
    currentUser.email === "admin@leaderslens.ai" ||
    currentUser.email === "support@leaderslens.ai" ||
    (currentUser.primaryRole === "SUPER_ADMIN" && !!currentUser.isPlatformAdmin && !currentUser.partyId);
  const [selectedConstituencyId, setSelectedConstituencyId] = useState<string>(
    currentUser.assemblyConstituencyId || "BNG-AC"
  );

  // Selected Issue for Modal
  const [selectedIssue, setSelectedIssue] = useState<FieldIssue | null>(null);
  const [assignModalIssue, setAssignModalIssue] = useState<FieldIssue | null>(null);

  const handleAssignDepartment = async (issueId: string, newDept: string, officialName?: string, officialPhone?: string) => {
    setIssues((prev: FieldIssue[]) =>
      prev.map((item: FieldIssue) => {
        if (item.id === issueId) {
          return {
            ...item,
            department: newDept,
            assignedDepartment: newDept,
            assignedOfficialName: officialName || item.assignedOfficialName || "",
            assignedOfficialPhone: officialPhone || item.assignedOfficialPhone || "",
            status: assignmentSafeStatus(item.status),
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      })
    );

    try {
      await politicalApiService.updateFieldIssueStatus(issueId, {
        department: newDept,
        status: assignmentSafeStatus(issues.find((i) => i.id === issueId)?.status),
        assignedOfficialName: officialName,
        assignedOfficialPhone: officialPhone,
        remarks: `Department assigned to ${newDept}`
      });
    } catch (e) {
      console.warn("Department update error", e);
    }
  };

  // Constituency operational tree starts fully collapsed.
  const [expandedMandals, setExpandedMandals] = useState<Record<string, boolean>>({});
  const [expandedVillages, setExpandedVillages] = useState<Record<string, boolean>>({});

  // View Mode: Geographic Tree vs Master Table vs Director Command vs Political Admins
  const [viewMode, setViewMode] = useState<"DRILLDOWN" | "ALL_ISSUES" | "DIRECTORS" | "VOLUNTEERS" | "POLITICAL_ADMINS">("DRILLDOWN");
  const [ticketLayout, setTicketLayout] = useState<"GRID" | "TABLE">("GRID");

  const getStatusFromUrl = (): string => {
    const hash = window.location.hash;
    if (hash.includes("status=")) {
      const match = hash.match(/status=([A-Z_]+)/i);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
    return "";
  };

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>(
    () => getStatusFromUrl() || initialFilterStatus || "ALL"
  );
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterMandal, setFilterMandal] = useState<string>("ALL");
  const [filterDepartment, setFilterDepartment] = useState<string>("ALL");
  const [filterVolunteer, setFilterVolunteer] = useState<string>(
    () => getAssignTicketsParamsFromHash().volunteerId
  );
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterGender, setFilterGender] = useState<string>("ALL");
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "DUE_DATE" | "PRIORITY" | "STATUS" | "TITLE">("NEWEST");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    const syncStatus = () => {
      const fromUrl = getStatusFromUrl();
      if (fromUrl) setFilterStatus(fromUrl);
      const volunteerFromUrl = getAssignTicketsParamsFromHash().volunteerId;
      if (volunteerFromUrl) setFilterVolunteer(volunteerFromUrl);
    };
    syncStatus();
    window.addEventListener("hashchange", syncStatus);
    return () => window.removeEventListener("hashchange", syncStatus);
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [currentUser.assemblyConstituencyId]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const acId = currentUser.assemblyConstituencyId;
      const role = currentUser.primaryRole || (currentUser.isPoliticalAdmin ? "POLITICAL_ADMIN" : "SUPER_ADMIN");
      const [drilldown, issueList, userList, mandalList, villageList, dash] = await Promise.all([
        politicalApiService.getGeographicDrilldown(acId, currentUser.stateId, currentUser.id),
        politicalApiService.getFieldIssues({
          userId: currentUser.id,
          userRole: role,
          assemblyConstituencyId: acId
        }),
        politicalApiService.getUsers(),
        politicalApiService.getMandals(acId, currentUser.stateId),
        politicalApiService.getVillages(undefined, acId),
        isPlatformSuperAdmin
          ? Promise.resolve(null)
          : politicalApiService.getPoliticalAdminDashboard(currentUser.id).catch(() => null)
      ]);

      setDrilldownData(drilldown);
      setIssues(issueList);
      setUsers(userList);
      setMandals(mandalList);
      setVillages(villageList);
      setRoleDashboard(dash);
      setDashboardError("");
    } catch (e) {
      console.error(e);
      setDashboardError("Dashboard data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMandal = (mandalId: string) => {
    setExpandedMandals((prev) => ({ ...prev, [mandalId]: !prev[mandalId] }));
  };

  const toggleVillage = (villageId: string) => {
    setExpandedVillages((prev) => ({ ...prev, [villageId]: !prev[villageId] }));
  };

  const scopedUsers = users.filter((u) => {
    if (isPlatformSuperAdmin) return true;
    const ac = currentUser.assemblyConstituencyId;
    return !ac || u.assemblyConstituencyId === ac;
  });
  const directors = scopedUsers.filter((u) => u.primaryRole === "DIRECTOR");
  const volunteers = scopedUsers.filter((u) => u.primaryRole === "VOLUNTEER");
  const kpiCounts = countByKpi(issues);
  const dashStats = roleDashboard?.stats;
  const totalIssues = dashStats?.totalIssues ?? kpiCounts.total;
  const pendingCount = dashStats?.newIssues ?? kpiCounts.openUnassigned;
  const assignedCount = dashStats?.assigned ?? kpiCounts.assigned;
  const assignedToDeptCount = dashStats?.assignedToDepartment ?? 0;
  const inProgressCount = dashStats?.inProgress ?? kpiCounts.inProgress;
  const completedCount = dashStats?.resolvedClosed ?? kpiCounts.resolvedClosed;
  const overdueCount = dashStats?.overdue ?? kpiCounts.overdue;
  const rejectedCount = dashStats?.rejected ?? kpiCounts.rejected;
  const volunteerCount = dashStats?.totalVolunteers ?? volunteers.length;
  const activeVolunteerCount = dashStats?.activeVolunteers ?? volunteers.filter((v) => !v.status || v.status === "ACTIVE").length;

  useEffect(() => {
    const openTicketFromHash = async () => {
      const ticketId = getTicketIdFromHash();
      if (!ticketId) return;
      const found = issues.find((i) => i.id === ticketId);
      if (found) {
        setSelectedIssue(found);
        return;
      }
      try {
        const remote = await politicalApiService.getFieldIssueById(
          ticketId,
          currentUser.id,
          currentUser.primaryRole
        );
        if (remote) setSelectedIssue(remote);
      } catch (e) {
        console.error(e);
      }
    };
    openTicketFromHash();
    window.addEventListener("hashchange", openTicketFromHash);
    return () => window.removeEventListener("hashchange", openTicketFromHash);
  }, [issues]);

  const goAssignTickets = (status: string, volunteerId?: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
    if (volunteerId) setFilterVolunteer(volunteerId);
    const params = new URLSearchParams();
    params.set("status", status);
    if (volunteerId) params.set("volunteer", volunteerId);
    window.location.hash = `#/assign-tickets?${params.toString()}`;
  };

  const getItemDepartment = (item: FieldIssue) => item.department || item.assignedDepartment || item.category || "General";
  const getItemType = (item: FieldIssue) => item.issueType || item.reporterType || "Field Issue";
  const getItemDemographics = (item: FieldIssue) => {
    const gender = String((item as any).citizenGender || "").trim();
    const age = Number((item as any).citizenAge || 0);
    return { gender, age };
  };

  const availableCategories = useMemo(
    () => Array.from(new Set(issues.map((i) => i.category).filter(Boolean))).sort() as string[],
    [issues]
  );
  const availableTypes = useMemo(
    () => Array.from(new Set(issues.map((i) => getItemType(i)).filter(Boolean))).sort(),
    [issues]
  );
  const availableDepartments = useMemo(
    () => Array.from(new Set(issues.map((i) => getItemDepartment(i)).filter(Boolean))).sort(),
    [issues]
  );

  const filteredIssues = useMemo(() => {
    const list = issues.filter((item) => {
      const bucket = kpiBucket(item);
      if (filterStatus !== "ALL") {
        if (
          (filterStatus === "OPEN_UNASSIGNED" || filterStatus === "PENDING" || filterStatus === "NEW") &&
          bucket !== "OPEN_UNASSIGNED"
        ) {
          return false;
        } else if (filterStatus === "ASSIGNED" && bucket !== "ASSIGNED") {
          return false;
        } else if (filterStatus === "IN_PROGRESS" && bucket !== "IN_PROGRESS") {
          return false;
        } else if (filterStatus === "OVERDUE" && bucket !== "OVERDUE") {
          return false;
        } else if (
          (filterStatus === "RESOLVED" || filterStatus === "COMPLETED") &&
          bucket !== "RESOLVED"
        ) {
          return false;
        } else if (filterStatus === "REJECTED" && bucket !== "REJECTED") {
          return false;
        } else if (filterStatus === "CANT_BE_DONE" && bucket !== "OVERDUE" && (item as any).status !== "Can't be done") {
          return false;
        } else if (
          ![
            "OPEN_UNASSIGNED",
            "PENDING",
            "NEW",
            "ASSIGNED",
            "IN_PROGRESS",
            "OVERDUE",
            "RESOLVED",
            "COMPLETED",
            "REJECTED",
            "CANT_BE_DONE"
          ].includes(filterStatus) &&
          item.status !== filterStatus
        ) {
          return false;
        }
      }
      if (filterPriority !== "ALL" && item.priority !== filterPriority) return false;
      if (filterMandal !== "ALL" && item.mandalId !== filterMandal) return false;
      if (filterDepartment !== "ALL" && getItemDepartment(item) !== filterDepartment) return false;
      if (
        filterVolunteer !== "ALL" &&
        item.assignedVolunteerId !== filterVolunteer &&
        item.assignedVolunteerName !== volunteers.find((v) => v.id === filterVolunteer)?.name
      ) {
        return false;
      }
      if (filterType !== "ALL" && getItemType(item) !== filterType) return false;
      if (filterCategory !== "ALL" && item.category !== filterCategory) return false;
      if (filterGender !== "ALL") {
        const { gender } = getItemDemographics(item);
        if (gender.toLowerCase() !== filterGender.toLowerCase()) return false;
      }
      if (filterAgeGroup !== "ALL") {
        const { age } = getItemDemographics(item);
        if (!age) return false;
        if (filterAgeGroup === "20-30" && (age < 20 || age > 30)) return false;
        if (filterAgeGroup === "30-40" && (age < 30 || age > 40)) return false;
        if (filterAgeGroup === "40-50" && (age < 40 || age > 50)) return false;
        if (filterAgeGroup === "50+" && age < 50) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          ticketSearchHaystack(item).includes(q) ||
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
      if (sortBy === "TITLE") return a.title.localeCompare(b.title);
      if (sortBy === "STATUS") return a.status.localeCompare(b.status);
      return 0;
    });
  }, [
    issues,
    filterStatus,
    filterPriority,
    filterMandal,
    filterDepartment,
    filterVolunteer,
    filterType,
    filterCategory,
    filterGender,
    filterAgeGroup,
    searchQuery,
    sortBy,
    volunteers
  ]);

  const hasActiveFilters =
    filterStatus !== "ALL" ||
    filterPriority !== "ALL" ||
    filterMandal !== "ALL" ||
    filterDepartment !== "ALL" ||
    filterVolunteer !== "ALL" ||
    filterType !== "ALL" ||
    filterCategory !== "ALL" ||
    filterGender !== "ALL" ||
    filterAgeGroup !== "ALL" ||
    Boolean(searchQuery.trim());

  const clearAllFilters = () => {
    setFilterStatus("ALL");
    setFilterPriority("ALL");
    setFilterMandal("ALL");
    setFilterDepartment("ALL");
    setFilterVolunteer("ALL");
    setFilterType("ALL");
    setFilterCategory("ALL");
    setFilterGender("ALL");
    setFilterAgeGroup("ALL");
    setSearchQuery("");
  };

  const totalPages = Math.ceil(filteredIssues.length / pageSize) || 1;
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredIssues.slice(start, start + pageSize);
  }, [filteredIssues, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterPriority, filterMandal, filterDepartment, filterVolunteer, filterType, filterCategory, filterGender, filterAgeGroup, searchQuery, sortBy, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  if (selectedIssue) {
    return (
      <div className="w-full max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-4 lg:px-6">
        <IssueDetailView
          issue={selectedIssue}
          currentUser={currentUser}
          onBack={() => {
            setSelectedIssue(null);
            clearTicketIdFromHash();
          }}
          onIssueUpdated={loadAdminData}
        />
      </div>
    );
  }

  const isAssignTicketsMode = window.location.hash.toLowerCase().includes("assign");

  return (
    <div className="w-full max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-4 lg:px-6 space-y-3 animate-fadeIn text-[#F5EFE0] overflow-x-hidden">
      {!isAssignTicketsMode && (
      <>
      {/* Executive Command Header */}
      {isPlatformSuperAdmin ? (
        /* LEVEL 1: SUPER ADMIN MASTER BANNER */
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#071322]/45 backdrop-blur-xl border border-[#D4A24C]/40 shadow-2xl">
          <div className="flex items-center gap-4">
            <div
              className="relative group cursor-pointer flex-shrink-0"
              onClick={() => setIsEditProfileOpen(true)}
              title="Click to edit profile"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4A24C] shadow-lg group-hover:brightness-90 transition-all"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-semibold transition-opacity">
                <Camera className="w-3.5 h-3.5 text-[#D4A24C]" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#071322]/70 text-[#D4A24C] border border-[#D4A24C]/40 font-mono">
                  Level 1: Platform Super Admin
                </span>
                <span className="text-xs text-[#D8CFB8]">{currentUser.assignedConstituency || "National Command Center"}</span>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#142B45] hover:bg-[#1E3A5A] text-[#D4A24C] border border-[#D4A24C]/40 text-[10.5px] font-semibold transition-all cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl text-[#F5EFE0] font-normal mt-0.5">
                {currentUser.name}
              </h1>
              <p className="text-xs text-[#8E9CAE] mt-0.5 flex flex-wrap items-center gap-x-3">
                <span>✉️ {currentUser.email}</span>
                <span>📞 {currentUser.phone || "+91 98850 12340"}</span>
                <span>· {directors.length} Managers · {volunteers.length} Field Volunteers</span>
              </p>
            </div>
          </div>

          {/* View Switcher Tabs (Super Admin) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setViewMode("POLITICAL_ADMINS")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                viewMode === "POLITICAL_ADMINS"
                  ? "bg-[#D4A24C] text-[#071322] shadow-md font-bold"
                  : "bg-[#071322]/60 text-[#D8CFB8] hover:text-white border border-[#22405E]"
              }`}
            >
              Constituency Admins (MLAs)
            </button>
            <button
              onClick={() => setViewMode("DRILLDOWN")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                viewMode === "DRILLDOWN"
                  ? "bg-[#D4A24C] text-[#071322] shadow-md font-bold"
                  : "bg-[#071322]/60 text-[#D8CFB8] hover:text-white border border-[#22405E]"
              }`}
            >
              Geographic Tree
            </button>
            <button
              onClick={() => goAssignTickets("ALL")}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer bg-[#071322]/60 text-[#D8CFB8] hover:text-white border border-[#22405E]"
            >
              Master Issues ({totalIssues})
            </button>
            <button
              onClick={() => setViewMode("DIRECTORS")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                viewMode === "DIRECTORS"
                  ? "bg-[#D4A24C] text-[#071322] shadow-md font-bold"
                  : "bg-[#071322]/60 text-[#D8CFB8] hover:text-white border border-[#22405E]"
              }`}
            >
              Managers ({directors.length})
            </button>
            <button
              onClick={() => setViewMode("VOLUNTEERS")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                viewMode === "VOLUNTEERS"
                  ? "bg-[#D4A24C] text-[#071322] shadow-md font-bold"
                  : "bg-[#071322]/60 text-[#D8CFB8] hover:text-white border border-[#22405E]"
              }`}
            >
              Volunteers ({volunteers.length})
            </button>
          </div>
        </div>
      ) : (
        /* LEVEL 2: POLITICAL ADMIN (MLA) MASTER BANNER */
        <div className="p-3.5 rounded-2xl bg-[#071322]/45 backdrop-blur-xl border border-[#D4A24C]/40 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className="relative cursor-pointer"
                onClick={() => setIsEditProfileOpen(true)}
                title="Click to change profile picture"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-[#D4A24C] shadow-lg hover:brightness-90 transition-all"
                />
                <span className="absolute -bottom-1 -right-1 z-10 px-1 py-0.5 rounded-full bg-[#071322] border border-[#D4A24C] text-[10px] font-mono leading-none">
                  {currentUser.partyEmoji || "🏛️"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#142B45] hover:bg-[#1E3A5A] text-[#D4A24C] border border-[#D4A24C]/40 text-[10px] font-semibold transition-all cursor-pointer"
                title="Edit profile photo"
              >
                <Camera className="w-3 h-3" />
                <span>Edit Photo</span>
              </button>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#071322]/70 text-[#D4A24C] border border-[#D4A24C]/40 font-mono">
                  POLITICAL ADMIN
                </span>
                {currentUser.partyName && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#071322]/70 text-[#D4A24C] border border-[#D4A24C]/30 flex items-center gap-1">
                    <span>{currentUser.partyEmoji}</span>
                    <span>{currentUser.partyName} ({currentUser.partyAbbr})</span>
                  </span>
                )}
                {currentUser.assignedConstituency && (
                <span className="text-[10px] font-medium text-[#8E9CAE] bg-[#071322]/70 px-2 py-0.5 rounded-full border border-[#22405E]">
                  {currentUser.assignedConstituency}
                </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#142B45] hover:bg-[#1E3A5A] text-[#D4A24C] border border-[#D4A24C]/40 text-[10px] font-semibold transition-all cursor-pointer"
                  title="Edit Profile Details"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("DRILLDOWN")}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider transition-all cursor-pointer ${
                    viewMode === "DRILLDOWN"
                      ? "bg-[#D4A24C] text-[#071322] shadow-sm font-bold"
                      : "bg-[#071322]/60 text-[#D8CFB8] hover:text-white border border-[#22405E]"
                  }`}
                >
                  Constituency Tree
                </button>
              </div>

              <h1 className="font-display text-xl sm:text-2xl text-[#F5EFE0] font-normal leading-tight">
                {currentUser.name}
              </h1>

              {currentUser.designation && (
              <p className="text-xs text-[#D8CFB8] leading-snug line-clamp-1">
                {currentUser.designation}
              </p>
              )}
              <p className="text-[11px] text-[#8E9CAE] flex flex-wrap items-center gap-x-3">
                {currentUser.email && <span>✉️ {currentUser.email}</span>}
                {currentUser.phone && <span>📞 {currentUser.phone}</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Overview Strip — compact so million-scale counts stay on one line */}
      <div className="space-y-1.5 p-2 rounded-xl bg-[#091422] border border-[#22354D] shadow-xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-1.5">
          <DashboardKpi
            label="Total Tickets"
            value={totalIssues}
            onClick={() => goAssignTickets("ALL")}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
          <DashboardKpi
            label="Open / Unassigned"
            value={pendingCount}
            onClick={() => goAssignTickets("OPEN_UNASSIGNED")}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
          <DashboardKpi
            label="Assigned"
            value={assignedCount}
            onClick={() => goAssignTickets("ASSIGNED")}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
          <DashboardKpi
            label="In Progress"
            value={inProgressCount}
            onClick={() => goAssignTickets("IN_PROGRESS")}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
          <DashboardKpi
            label="Overdue"
            value={overdueCount}
            onClick={() => goAssignTickets("OVERDUE")}
            icon={<AlertTriangle className="w-2.5 h-2.5 shrink-0" />}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
          <DashboardKpi
            label="Resolved / Closed"
            value={completedCount}
            onClick={() => goAssignTickets("RESOLVED")}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
          <DashboardKpi
            label="Rejected"
            value={rejectedCount}
            onClick={() => goAssignTickets("REJECTED")}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-1.5">
          <DashboardKpi
            label="Total Volunteers"
            value={volunteerCount}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
          <DashboardKpi
            label="Active Volunteers"
            value={activeVolunteerCount}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
          <DashboardKpi
            label="Assigned to Dept"
            value={assignedToDeptCount}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
          <DashboardKpi
            label="Pending Work"
            value={dashStats?.volunteersWithPending ?? 0}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
          <DashboardKpi
            label="Overdue Work"
            value={dashStats?.volunteersWithOverdue ?? 0}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
          <DashboardKpi
            label="Completed Work"
            value={dashStats?.volunteersWithCompleted ?? 0}
            tone={UNIQUE_TICKET_SURFACE.kpi}
          />
        </div>
      </div>

      {dashboardError && (
        <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 text-xs">
          {dashboardError}
        </div>
      )}

      {viewMode === "DRILLDOWN" && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#0E1724] border border-[#D4A24C]/40">
            <div>
              <h2 className="font-display text-base text-[#F5EFE0] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D4A24C]" />
                {isPlatformSuperAdmin
                  ? "Constituency Ground Hierarchy: State → AC → Mandal → Village → Volunteer → Issues"
                  : "Constituency Operational Hierarchy · Ground Verification Tree"}
              </h2>
              <p className="text-xs text-[#8E9CAE] mt-0.5">
                {isPlatformSuperAdmin
                  ? "Click any Mandal or Village node to expand real-time status and proof records."
                  : "Real-time status, verified field records, and photo proofs across all constituent mandals."}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`${HIERARCHY_CHIP} px-2.5 py-1`}>
                {currentUser.assignedConstituency || currentUser.assemblyConstituencyName || "Constituency"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-[#8E9CAE]">
              Loading interactive geographic hierarchy...
            </div>
          ) : !drilldownData || !drilldownData.mandals ? (
            <div className="p-8 text-center text-sm text-[#8E9CAE]">
              No geography drilldown data available.
            </div>
          ) : (
            <div className="space-y-2">
              {drilldownData.mandals.map((mandal: any) => {
                const isMandalExpanded = !!expandedMandals[mandal.mandalId];
                return (
                  <div
                    key={mandal.mandalId}
                    className="rounded-xl bg-[#0E1724] border border-[#D4A24C]/40 overflow-hidden"
                  >
                    {/* Mandal Node Header */}
                    <div
                      onClick={() => toggleMandal(mandal.mandalId)}
                      className="p-3 hover:bg-[#131E2D] transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-2 border-b border-[#D4A24C]/25"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-[#071322] border border-[#D4A24C]/40 text-[#D4A24C]">
                          {isMandalExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#071322] text-[#D4A24C] border border-[#D4A24C]/35">
                              {mandal.code}
                            </span>
                            <span className="text-xs text-[#8E9CAE]">
                              {mandal.totalVillages} Villages · {mandal.totalVoters.toLocaleString("en-IN")} Voters
                            </span>
                          </div>
                          <h3 className="font-display text-lg font-semibold text-[#F5EFE0] mt-0.5">
                            {mandal.mandalName}
                          </h3>
                        </div>
                      </div>

                      {/* Mandal Issue Summary Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className={HIERARCHY_CHIP}>
                          Total: <strong>{mandal.issueSummary.total}</strong>
                        </span>
                        <span className={HIERARCHY_CHIP}>
                          In Progress: <strong>{mandal.issueSummary.inProgress}</strong>
                        </span>
                        <span className={HIERARCHY_CHIP}>
                          Resolved: <strong>{mandal.issueSummary.completed}</strong>
                        </span>
                        {mandal.issueSummary.overdue > 0 && (
                          <span className={HIERARCHY_CHIP}>
                            Overdue: <strong>{mandal.issueSummary.overdue}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Village Nodes List */}
                    {isMandalExpanded && (
                      <div className="p-2.5 space-y-2 bg-[#071322]/40">
                        {mandal.villages.map((village: any) => {
                          const isVillageExpanded = !!expandedVillages[village.villageId];
                          return (
                            <div
                              key={village.villageId}
                              className="rounded-lg bg-[#0B131E] border border-[#D4A24C]/30 overflow-hidden"
                            >
                              {/* Village Node Row */}
                              <div
                                onClick={() => toggleVillage(village.villageId)}
                                className="p-2.5 hover:bg-[#131E2D] transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-[#D4A24C]">
                                    {isVillageExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono text-[#8E9CAE]">
                                        {village.code}
                                      </span>
                                      <h4 className="font-semibold text-sm text-[#F5EFE0]">
                                        {village.villageName}
                                      </h4>
                                    </div>
                                    <span className="text-[11px] text-[#8E9CAE]">
                                      {village.totalVoters.toLocaleString("en-IN")} registered voters
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {(() => {
                                    const assigned = findVolunteerForVillage(scopedUsers, village.villageId);
                                    if (!assigned) {
                                      return (
                                        <div className="px-2.5 py-1 rounded-lg bg-[#071322] border border-dashed border-[#D4A24C]/30 text-[11px] text-[#8E9CAE]">
                                          No volunteer assigned
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#071322] border border-[#D4A24C]/35 text-[11px]">
                                        <span>
                                          Volunteer: <strong className="text-[#D4A24C]">{assigned.name}</strong>
                                        </span>
                                        {assigned.phone && (
                                          <a
                                            href={`tel:${assigned.phone}`}
                                            className="text-[#8E9CAE] hover:text-[#D4A24C]"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Phone className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                    <span className={HIERARCHY_CHIP}>
                                      {village.issueSummary.total} Issues
                                    </span>
                                    {village.issueSummary.overdue > 0 && (
                                      <span className={HIERARCHY_CHIP}>
                                        {village.issueSummary.overdue} Overdue
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Village Issues Drilldown */}
                              {isVillageExpanded && (
                                <div className="p-2 border-t border-[#D4A24C]/25 bg-[#071322] space-y-1.5">
                                  {village.issues.length === 0 ? (
                                    <div className="p-2.5 text-center text-xs text-[#8E9CAE]">
                                      No issues logged in {village.villageName}. Ground reports clear.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {village.issues.map((iss: FieldIssue) => (
                                        <div
                                          key={iss.id}
                                          onClick={() => setSelectedIssue(iss)}
                                          className="p-2.5 rounded-lg bg-[#0E1724] border border-[#D4A24C]/35 hover:border-[#D4A24C]/80 transition-all cursor-pointer space-y-1"
                                        >
                                          <div className="flex items-center justify-between gap-2 text-[10px]">
                                            <span className="font-mono text-[#D4A24C]">{formatTicketDisplay(iss)}</span>
                                            <span className={`${HIERARCHY_CHIP} uppercase text-[10px]`}>
                                              {formatIssueStatus(iss.status)}
                                            </span>
                                          </div>
                                          <h5 className="font-semibold text-xs text-[#F5EFE0] line-clamp-1">
                                            {iss.title}
                                          </h5>
                                          <div className="flex items-center justify-between text-[10px] text-[#8E9CAE]">
                                            <span>By {iss.reportedBy}</span>
                                            {iss.lastStatusProof && (
                                              <span className="text-[#D4A24C] flex items-center gap-1">
                                                <Camera className="w-3 h-3" /> Proof Verified
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      </>
      )}

      {isAssignTicketsMode && (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl text-[#F5EFE0]">Assign Tickets</h1>
            <p className="text-xs text-[#8E9CAE] mt-0.5">
              {filteredIssues.length} tickets · assign departments and inspect records
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs min-w-0">
            <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-0 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
              <input
                type="text"
                placeholder="Search ID, title, village, citizen, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-transparent border-0 border-b border-[#223348] focus:border-[#D4A24C] pl-6 pr-6 text-xs text-[#F5EFE0] placeholder-[#5F6875] outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#8E9CAE] hover:text-white text-xs"
                >
                  ✕
                </button>
              ) : null}
            </div>
            <label className="inline-flex items-center gap-1.5 text-[#8E9CAE] shrink-0">
              Sort
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-[#F5EFE0] text-xs focus:outline-none cursor-pointer border-0 border-b border-[#223348] focus:border-[#D4A24C] h-9 [color-scheme:dark]"
              >
                <option value="NEWEST" className={ASSIGN_OPTION_CLASS}>Newest first</option>
                <option value="OLDEST" className={ASSIGN_OPTION_CLASS}>Oldest first</option>
                <option value="DUE_DATE" className={ASSIGN_OPTION_CLASS}>Earliest due</option>
                <option value="PRIORITY" className={ASSIGN_OPTION_CLASS}>Highest priority</option>
                <option value="STATUS" className={ASSIGN_OPTION_CLASS}>By status</option>
                <option value="TITLE" className={ASSIGN_OPTION_CLASS}>Title A–Z</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-1.5 text-[#8E9CAE] shrink-0">
              Show
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-transparent text-[#F5EFE0] text-xs focus:outline-none cursor-pointer border-0 border-b border-[#223348] focus:border-[#D4A24C] h-9 [color-scheme:dark]"
              >
                <option value={10} className={ASSIGN_OPTION_CLASS}>10 / page</option>
                <option value={25} className={ASSIGN_OPTION_CLASS}>25 / page</option>
                <option value={50} className={ASSIGN_OPTION_CLASS}>50 / page</option>
                <option value={100} className={ASSIGN_OPTION_CLASS}>100 / page</option>
              </select>
            </label>
            <div className="inline-flex items-center gap-3 text-[#8E9CAE] shrink-0">
              <button
                type="button"
                onClick={() => setTicketLayout("GRID")}
                className={`cursor-pointer ${ticketLayout === "GRID" ? "text-[#D4A24C] font-semibold" : "hover:text-[#F5EFE0]"}`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setTicketLayout("TABLE")}
                className={`cursor-pointer ${ticketLayout === "TABLE" ? "text-[#D4A24C] font-semibold" : "hover:text-[#F5EFE0]"}`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-x-3 gap-y-2 text-xs">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL" className={ASSIGN_OPTION_CLASS}>Status: All</option>
            <option value="OPEN_UNASSIGNED" className={ASSIGN_OPTION_CLASS}>Status: Open / Unassigned</option>
            <option value="ASSIGNED" className={ASSIGN_OPTION_CLASS}>Status: Assigned</option>
            <option value="IN_PROGRESS" className={ASSIGN_OPTION_CLASS}>Status: In Progress</option>
            <option value="OVERDUE" className={ASSIGN_OPTION_CLASS}>Status: Overdue</option>
            <option value="COMPLETED" className={ASSIGN_OPTION_CLASS}>Status: Resolved / Closed</option>
            <option value="REJECTED" className={ASSIGN_OPTION_CLASS}>Status: Rejected</option>
            <option value="CANT_BE_DONE" className={ASSIGN_OPTION_CLASS}>Status: Can't be done</option>
          </select>
          <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL" className={ASSIGN_OPTION_CLASS}>Dept: All</option>
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept} className={ASSIGN_OPTION_CLASS}>{dept}</option>
            ))}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL" className={ASSIGN_OPTION_CLASS}>Type: All</option>
            {availableTypes.map((t) => (
              <option key={t} value={t} className={ASSIGN_OPTION_CLASS}>{t}</option>
            ))}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL" className={ASSIGN_OPTION_CLASS}>Category: All</option>
            {availableCategories.map((c) => (
              <option key={c} value={c} className={ASSIGN_OPTION_CLASS}>{c}</option>
            ))}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL" className={ASSIGN_OPTION_CLASS}>Priority: All</option>
            <option value="URGENT" className={ASSIGN_OPTION_CLASS}>Urgent</option>
            <option value="HIGH" className={ASSIGN_OPTION_CLASS}>High</option>
            <option value="MEDIUM" className={ASSIGN_OPTION_CLASS}>Medium</option>
            <option value="LOW" className={ASSIGN_OPTION_CLASS}>Low</option>
          </select>
          <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL" className={ASSIGN_OPTION_CLASS}>Gender: All</option>
            <option value="Male" className={ASSIGN_OPTION_CLASS}>Male</option>
            <option value="Female" className={ASSIGN_OPTION_CLASS}>Female</option>
          </select>
          <select value={filterAgeGroup} onChange={(e) => setFilterAgeGroup(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL" className={ASSIGN_OPTION_CLASS}>Age: All</option>
            <option value="20-30" className={ASSIGN_OPTION_CLASS}>Age: 20-30</option>
            <option value="30-40" className={ASSIGN_OPTION_CLASS}>Age: 30-40</option>
            <option value="40-50" className={ASSIGN_OPTION_CLASS}>Age: 40-50</option>
            <option value="50+" className={ASSIGN_OPTION_CLASS}>Age: 50+</option>
          </select>
          <select value={filterMandal} onChange={(e) => setFilterMandal(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL" className={ASSIGN_OPTION_CLASS}>Mandal: All</option>
            {mandals.map((m) => (
              <option key={m.id} value={m.id} className={ASSIGN_OPTION_CLASS}>{m.name}</option>
            ))}
          </select>
          <select value={filterVolunteer} onChange={(e) => setFilterVolunteer(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL" className={ASSIGN_OPTION_CLASS}>Assignee: All</option>
            {volunteers.map((vol) => (
              <option key={vol.id} value={vol.id} className={ASSIGN_OPTION_CLASS}>{vol.name}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8E9CAE]">
            <p className="min-w-0 whitespace-normal break-words">
              {[
                filterStatus !== "ALL" ? `Status ${filterStatus}` : "",
                filterDepartment !== "ALL" ? `Dept ${filterDepartment}` : "",
                filterType !== "ALL" ? `Type ${filterType}` : "",
                filterCategory !== "ALL" ? `Category ${filterCategory}` : "",
                filterPriority !== "ALL" ? `Priority ${filterPriority}` : "",
                filterGender !== "ALL" ? `Gender ${filterGender}` : "",
                filterAgeGroup !== "ALL" ? `Age ${filterAgeGroup}` : "",
                filterMandal !== "ALL" ? "Mandal filtered" : "",
                filterVolunteer !== "ALL" ? "Volunteer filtered" : "",
                searchQuery ? `Search “${searchQuery}”` : ""
              ].filter(Boolean).join(" · ")}
            </p>
            <button type="button" onClick={clearAllFilters} className="text-[#D4A24C] hover:underline font-semibold shrink-0 cursor-pointer">
              Clear filters
            </button>
          </div>
        )}

        <div className="space-y-3">

          {filteredIssues.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <h3 className="text-base font-semibold text-[#F5EFE0]">No tickets match these filters</h3>
              <p className="text-xs text-[#8E9CAE]">Try a different search, category, or status.</p>
              <button type="button" onClick={clearAllFilters} className="text-xs font-semibold text-[#D4A24C] hover:underline cursor-pointer">
                Clear filters
              </button>
            </div>
          ) : ticketLayout === "GRID" ? (
          <div className={ASSIGN_GRID_CLASS}>
            {paginatedIssues.map((iss) => {
              const isClosed = iss.status === "COMPLETED" || iss.status === "RESOLVED";
              return (
                <TicketGridCard
                  key={iss.id}
                  issue={iss}
                  timing={{
                    registeredTimeFormatted: iss.reportedDate || iss.createdAt || "",
                    closedTimeFormatted: iss.updatedAt || "",
                    isClosed,
                    durationText: iss.dueDate ? `Due ${iss.dueDate}` : "—"
                  }}
                  showAssignControls={false}
                  showAcCode
                  plain
                  volunteerName={iss.assignedVolunteerName || "Unassigned"}
                  extraBadges={
                    <span>
                      {" · "}
                      {formatIssueStatus(iss.status)}
                    </span>
                  }
                  onOpen={() => setSelectedIssue(iss)}
                  onOpenWhatsAppAssign={() => setAssignModalIssue(iss)}
                />
              );
            })}
          </div>
          ) : (
          <div className={TICKET_TABLE_SHELL}>
            <table className={TICKET_TABLE_CLASS}>
                <thead>
                  <tr className="text-[#D4A24C] uppercase text-[10px] font-semibold tracking-wider">
                    <th className={`${TICKET_TABLE_HEAD_CELL} w-[12%]`}>ID & Status</th>
                    <th className={`${TICKET_TABLE_HEAD_CELL} w-[26%]`}>Issue Title</th>
                    <th className={`${TICKET_TABLE_HEAD_CELL} w-[14%]`}>Category / Dept</th>
                    <th className={`${TICKET_TABLE_HEAD_CELL} w-[14%]`}>Mandal / Location</th>
                    <th className={`${TICKET_TABLE_HEAD_CELL} w-[12%]`}>Reported By</th>
                    <th className={`${TICKET_TABLE_HEAD_CELL} w-[12%]`}>Volunteer</th>
                    <th className={`${TICKET_TABLE_HEAD_CELL} w-[10%] text-right whitespace-nowrap`}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedIssues.map((iss) => {
                    return (
                      <tr
                        key={iss.id}
                        onClick={() => setSelectedIssue(iss)}
                        className={TICKET_TABLE_ROW_CLASS}
                      >
                        <td className={TICKET_TABLE_CELL}>
                          <div className="font-mono font-bold text-[#D4A24C] text-[11px]" title={formatTicketDisplay(iss)}>
                            <div>{rawTicketNumber(iss)}</div>
                            {constituencyShortName(iss) ? (
                              <div className="text-[10px] text-[#8E9CAE] font-normal">
                                ({constituencyShortName(iss)})
                              </div>
                            ) : null}
                          </div>
                          <span className={`mt-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded inline-block ${UNIQUE_TICKET_SURFACE.badge}`}>
                            {formatIssueStatus(iss.status)}
                          </span>
                        </td>
                        <td className={TICKET_TABLE_CELL}>
                          <div className="font-semibold text-[#F5EFE0] group-hover:text-[#D4A24C]">
                            {iss.title}
                          </div>
                        </td>
                        <td className={TICKET_TABLE_CELL}>
                          <div className="font-medium text-[#F5EFE0]">{iss.category}</div>
                          {iss.department && (
                            <div className="text-[10.5px] text-[#D4A24C] mt-0.5">{String(iss.department).split("(")[0]}</div>
                          )}
                        </td>
                        <td className={TICKET_TABLE_CELL}>
                          <div className="font-medium text-[#F5EFE0]">{iss.mandalName}</div>
                          {(iss.villageName || iss.placeName) && (
                            <div className="text-[10.5px] text-[#8E9CAE] mt-0.5">{iss.villageName || iss.placeName}</div>
                          )}
                        </td>
                        <td className={TICKET_TABLE_CELL}>
                          <div className="font-medium text-[#F5EFE0]">{iss.reportedBy}</div>
                        </td>
                        <td className={`${TICKET_TABLE_CELL} text-[#8E9CAE]`}>
                          {iss.assignedVolunteerName || "Unassigned"}
                        </td>
                        <td className={`${TICKET_TABLE_CELL} text-right whitespace-nowrap [overflow-wrap:normal]`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIssue(iss);
                            }}
                            className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-[#131E2D] hover:bg-[#1E3048] text-[#D4A24C] text-[10px] font-semibold border border-[#D4A24C]/30 cursor-pointer whitespace-nowrap shrink-0"
                            title="View ticket"
                          >
                            <Eye className="w-3 h-3 shrink-0" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
          )}

          {filteredIssues.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs text-[#8E9CAE]">
              <div className="font-mono text-center sm:text-left">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredIssues.length)} of {filteredIssues.length}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} title="First Page" className="disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:text-[#F5EFE0]">
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} title="Previous Page" className="disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:text-[#F5EFE0]">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-[#F5EFE0] font-semibold">
                  {currentPage} / {totalPages}
                </span>
                <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} title="Next Page" className="disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:text-[#F5EFE0]">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} title="Last Page" className="disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:text-[#F5EFE0]">
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {!isAssignTicketsMode && (
      <>
      {/* VIEW 0: POLITICAL ADMINS / CONSTITUENCIES HUB (PLATFORM SUPER ADMIN ONLY) */}
      {viewMode === "POLITICAL_ADMINS" && isPlatformSuperAdmin && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0F2338]/80 border border-[#22405E]">
            <h2 className="font-display text-base text-[#F5EFE0] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D4A24C]" />
              Level 2 Constituency Political Admins (MLAs & PAs)
            </h2>
            <p className="text-xs text-[#8E9CAE] mt-0.5">
              LeaderLens Platform Owner Tenant Control · Manage and monitor political administration by Assembly Constituency across parties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {users
              .filter((u) => u.primaryRole === "POLITICAL_ADMIN" || u.isPoliticalAdmin)
              .map((polAdmin) => {
                const polAdminIssues = issues.filter(
                  (i) => i.assemblyConstituencyId === polAdmin.assemblyConstituencyId
                );
                const polAdminVolunteers = users.filter(
                  (u) =>
                    u.primaryRole === "VOLUNTEER" &&
                    u.assemblyConstituencyId === polAdmin.assemblyConstituencyId
                );
                const polAdminDirectors = users.filter(
                  (u) =>
                    u.primaryRole === "DIRECTOR" &&
                    u.assemblyConstituencyId === polAdmin.assemblyConstituencyId
                );

                return (
                  <div
                    key={polAdmin.id}
                    className="p-5 rounded-2xl bg-[#0B1A2C] border border-[#22405E] hover:border-[#D4A24C]/60 transition-all space-y-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={polAdmin.avatar}
                        alt={polAdmin.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-[#D4A24C]"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#071322] text-[#D4A24C]">
                            {polAdmin.partyEmoji || "🏛️"} {polAdmin.partyAbbr || "PARTY"}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold">Active Tenant</span>
                        </div>
                        <h3 className="font-display text-base font-semibold text-[#F5EFE0] truncate mt-0.5">
                          {polAdmin.name}
                        </h3>
                        <span className="text-xs text-[#D8CFB8] block truncate">
                          {polAdmin.assignedConstituency}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="p-2 rounded-xl bg-[#071322] border border-[#22405E]">
                        <span className="text-[#8E9CAE] block uppercase">Directors</span>
                        <strong className="text-base text-[#F5EFE0] font-display">
                          {polAdminDirectors.length}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#071322] border border-[#22405E]">
                        <span className="text-[#8E9CAE] block uppercase">Volunteers</span>
                        <strong className="text-base text-[#D4A24C] font-display">
                          {polAdminVolunteers.length}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#071322] border border-[#22405E]">
                        <span className="text-[#8E9CAE] block uppercase">Field Issues</span>
                        <strong className="text-base text-blue-400 font-display">
                          {polAdminIssues.length}
                        </strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#22405E] text-xs text-[#8E9CAE] flex items-center justify-between">
                      <span>Contact: {polAdmin.phone || "Official Office"}</span>
                      <span className="text-[#D4A24C] text-[10px] font-mono">{polAdmin.email}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* VIEW 3: DIRECTORS MANAGEMENT (Super Admin only) */}
      {isPlatformSuperAdmin && viewMode === "DIRECTORS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {directors.map((dir) => {
            const dirVolunteers = volunteers.filter((v) => v.directorId === dir.id);
            const dirIssues = issues.filter((i) => i.directorId === dir.id);
            const dirCompleted = dirIssues.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
            const dirOverdue = dirIssues.filter((i) => i.status === "OVERDUE").length;

            return (
              <div
                key={dir.id}
                className="p-5 rounded-2xl bg-[#0B1A2C] border border-[#22405E] space-y-4"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={dir.avatar}
                    alt={dir.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#D4A24C]"
                  />
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#F5EFE0]">
                      {dir.name}
                    </h3>
                    <span className="text-xs text-[#D4A24C]">{dir.designation}</span>
                    <span className="text-[11px] text-[#8E9CAE] block mt-0.5">
                      {dir.assignedConstituency}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2 rounded-xl bg-[#071322] border border-[#22405E]">
                    <span className="text-[#8E9CAE] block text-[10px] uppercase">Volunteers</span>
                    <strong className="text-base text-[#F5EFE0] font-display">{dirVolunteers.length}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#071322] border border-[#22405E]">
                    <span className="text-emerald-300 block text-[10px] uppercase">Resolved</span>
                    <strong className="text-base text-emerald-400 font-display">{dirCompleted}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#071322] border border-[#22405E]">
                    <span className="text-rose-300 block text-[10px] uppercase">Overdue</span>
                    <strong className={`text-base font-display ${dirOverdue > 0 ? "text-rose-400" : "text-[#8E9CAE]"}`}>
                      {dirOverdue}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#22405E] text-xs text-[#8E9CAE] flex items-center justify-between">
                  <span>Contact: {dir.phone}</span>
                  <a href={`mailto:${dir.email}`} className="text-[#D4A24C] hover:underline">
                    {dir.email}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isPlatformSuperAdmin && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base text-[#F5EFE0] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D4A24C]" />
              Squad Volunteers
            </h2>
            <span className="text-xs text-[#CBD5E1]">{volunteers.length} in constituency</span>
          </div>
          {volunteers.length === 0 ? (
            <div className="p-4 rounded-xl border border-[#22405E] bg-[#0F2338] text-sm text-[#8E9CAE]">
              No volunteers are assigned in this constituency.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {volunteers.map((vol) => {
                const volIssues = issues.filter(
                  (i) => i.assignedVolunteerId === vol.id || i.assignedVolunteerName === vol.name
                );
                const volCompleted = volIssues.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
                const volOverdue = volIssues.filter((i) => i.status === "OVERDUE").length;
                return (
                  <button
                    type="button"
                    key={vol.id}
                    onClick={() => goAssignTickets("ALL", vol.id)}
                    className="p-4 rounded-2xl bg-[#0B1A2C] border border-[#22405E] hover:border-[#D4A24C]/60 space-y-3 text-left cursor-pointer"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-[#F5EFE0] truncate">{vol.name}</h4>
                      <span className="text-[11px] text-[#D4A24C] block truncate">
                        {vol.assignedMandalName || vol.assignedConstituency || "Unassigned area"}
                      </span>
                      <span className="text-[10px] text-[#8E9CAE] block truncate">
                        {vol.assignedVillageNames?.join(", ") || ""}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-2 border-t border-[#22405E]">
                      <div className="p-1.5 rounded bg-[#071322]">
                        <span className="text-[#8E9CAE] block">Assigned</span>
                        <strong className="text-xs text-[#F5EFE0]">{volIssues.length}</strong>
                      </div>
                      <div className="p-1.5 rounded bg-[#071322]">
                        <span className="text-emerald-300 block">Done</span>
                        <strong className="text-xs text-emerald-400">{volCompleted}</strong>
                      </div>
                      <div className="p-1.5 rounded bg-[#071322]">
                        <span className="text-rose-300 block">Overdue</span>
                        <strong className={`text-xs ${volOverdue > 0 ? "text-rose-400" : "text-[#8E9CAE]"}`}>
                          {volOverdue}
                        </strong>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#22405E] flex items-center justify-between text-[11px] text-[#8E9CAE]">
                      <span>{vol.phone || "No phone"}</span>
                      <span className="text-[#D8CFB8] text-[10px]">Supervisor: {vol.directorName || "Director"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === "VOLUNTEERS" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {volunteers.map((vol) => {
            const volIssues = issues.filter((i) => i.assignedVolunteerId === vol.id);
            const volCompleted = volIssues.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
            const volOverdue = volIssues.filter((i) => i.status === "OVERDUE").length;

            return (
              <div
                key={vol.id}
                className="p-5 rounded-2xl bg-[#0B1A2C] border border-[#22405E] space-y-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={vol.avatar}
                    alt={vol.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#D4A24C]/50"
                  />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-[#F5EFE0] truncate">
                      {vol.name}
                    </h4>
                    <span className="text-[11px] text-[#D4A24C] block truncate">
                      {vol.assignedMandalName || vol.assignedConstituency || "Unassigned area"}
                    </span>
                    <span className="text-[10px] text-[#8E9CAE] block truncate">
                      {vol.assignedVillageNames?.join(", ") || ""}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-2 border-t border-[#22405E]">
                  <div className="p-1.5 rounded bg-[#071322]">
                    <span className="text-[#8E9CAE] block">Total</span>
                    <strong className="text-xs text-[#F5EFE0]">{volIssues.length}</strong>
                  </div>
                  <div className="p-1.5 rounded bg-[#071322]">
                    <span className="text-emerald-300 block">Done</span>
                    <strong className="text-xs text-emerald-400">{volCompleted}</strong>
                  </div>
                  <div className="p-1.5 rounded bg-[#071322]">
                    <span className="text-rose-300 block">Overdue</span>
                    <strong className={`text-xs ${volOverdue > 0 ? "text-rose-400" : "text-[#8E9CAE]"}`}>
                      {volOverdue}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#22405E] flex items-center justify-between text-[11px] text-[#8E9CAE]">
                  <span>{vol.phone}</span>
                  <span className="text-[#D8CFB8] text-[10px]">Supervisor: {vol.directorName || "Director"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OfficerStatusComments issues={issues} onOpen={setSelectedIssue} />

      </>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <EditProfileModal
          currentUser={currentUser}
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={(updated) => {
            if (onUpdateProfile) {
              onUpdateProfile(updated);
            }
          }}
        />
      )}
      {/* Assign Complaint & WhatsApp Modal */}
      {assignModalIssue && (
        <AssignComplaintModal
          isOpen={!!assignModalIssue}
          issue={assignModalIssue}
          onClose={() => setAssignModalIssue(null)}
          onConfirmAssign={(issueId, deptName, officialName, officialPhone) => {
            handleAssignDepartment(issueId, deptName, officialName, officialPhone);
          }}
        />
      )}
    </div>
  );
};
