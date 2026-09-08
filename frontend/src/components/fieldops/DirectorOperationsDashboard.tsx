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
import { getAssignTicketsParamsFromHash, getTicketIdFromHash, clearTicketIdFromHash } from "../../utils/ticketHash";
import { IssueDetailView } from "./IssueDetailView";
import {
  Users,
  Search,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Phone,
  Eye,
  Building2,
  MessageCircle,
  Mail
} from "lucide-react";
import { PGRS_DEPARTMENTS_LIST, resolveDeptValue } from "./VolunteerOperationsDashboard";
import { AssignComplaintModal } from "./AssignComplaintModal";
import { TicketGridCard } from "./TicketGridCard";
import { OfficerStatusComments } from "./OfficerStatusComments";
import { isTicketOpenForAssign } from "../../utils/ticketActions";
import { formatIssueStatus } from "../../utils/statusLabels";
import { formatTicketDisplay, ticketSearchHaystack, rawTicketNumber, constituencyShortName } from "../../utils/ticketNumberDisplay";
import { assignmentSafeStatus, countByKpi, formatDashboardCount, kpiBucket, UNIQUE_TICKET_SURFACE } from "../../utils/ticketKpi";

export interface DirectorDashboardProps {
  currentUser: UserProfile;
  initialFilterStatus?: string;
}

const DEPARTMENTS = [
  ...PGRS_DEPARTMENTS_LIST.map((d) => d.name),
  "Other Government Department (ఇతర ప్రభుత్వ శాఖ)"
];

const ASSIGN_FILTER_CLASS =
  "min-w-0 w-full h-9 bg-transparent border-0 border-b border-[#223348] rounded-none px-0.5 text-xs text-[#F5EFE0] focus:border-[#D4A24C] outline-none [color-scheme:dark]";
const ASSIGN_TABLE_CLASS =
  "w-full max-w-full table-fixed text-left text-xs border-collapse [&_select]:min-w-0 [&_select]:max-w-full";
const ASSIGN_TH =
  "py-2 px-2 min-w-0 text-[#8E9CAE] font-semibold uppercase tracking-wider text-[10px] border-b border-[#223348] whitespace-normal break-words";
const ASSIGN_TD =
  "py-2.5 px-2 align-top min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] border-b border-[#223348]";
const ASSIGN_TR = "cursor-pointer hover:bg-[#0E1724]/50";
const ASSIGN_GRID_CLASS = "grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible";
const ASSIGN_OPTION_CLASS = "bg-[#0B131E] text-[#F5EFE0]";

export const DirectorOperationsDashboard: React.FC<DirectorDashboardProps> = ({
  currentUser,
  initialFilterStatus
}) => {
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [mandals, setMandals] = useState<MandalInfo[]>([]);
  const [villages, setVillages] = useState<VillageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleDashboard, setRoleDashboard] = useState<any>(null);
  const [dashboardError, setDashboardError] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("TABLE");
  const [operationsStream] = useState<"ALL" | "FIELD_ISSUES" | "GRIEVANCES">("FIELD_ISSUES");

  const getStatusFromUrl = (): string => {
    const hash = window.location.hash;
    if (hash.includes("status=")) {
      const match = hash.match(/status=([A-Z_]+)/i);
      if (match && match[1]) {
        const val = match[1].toUpperCase();
        if (val === "UNRESOLVED" || val === "PENDING") return "OPEN_UNASSIGNED";
        if (val === "RESOLVED") return "COMPLETED";
        return val;
      }
    }
    return "ALL";
  };

  // Active Status Tab State
  const [activeTab, setActiveTab] = useState<string>(() => getStatusFromUrl() || (initialFilterStatus === "NEW" ? "OPEN_UNASSIGNED" : initialFilterStatus || "ALL"));
  const getAssignedOnlyFromUrl = () => getAssignTicketsParamsFromHash().assignedOnly;
  const getVolunteerFromUrl = () => getAssignTicketsParamsFromHash().volunteerId;
  const [assignedOnly, setAssignedOnly] = useState(() => getAssignedOnlyFromUrl());

  useEffect(() => {
    const syncStatus = () => {
      const fromUrl = getStatusFromUrl();
      if (fromUrl) {
        setActiveTab(fromUrl);
      }
      setAssignedOnly(getAssignedOnlyFromUrl());
      const volunteerFromUrl = getVolunteerFromUrl();
      if (volunteerFromUrl) setFilterVolunteerId(volunteerFromUrl);
    };
    syncStatus();
    window.addEventListener("hashchange", syncStatus);
    return () => window.removeEventListener("hashchange", syncStatus);
  }, []);

  // Selected Issue for Full-Page Detail View & Assign WhatsApp Modal
  const [selectedIssue, setSelectedIssue] = useState<FieldIssue | null>(null);
  const [assignModalIssue, setAssignModalIssue] = useState<FieldIssue | null>(null);

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

  // Filters & Sorting State
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterDepartment, setFilterDepartment] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterReporterType, setFilterReporterType] = useState<string>("ALL");
  const [filterVolunteerId, setFilterVolunteerId] = useState<string>(() => getVolunteerFromUrl());
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
      const [allUsers, issueList, grievanceList, mandalList, villageList, dash] = await Promise.all([
        politicalApiService.getUsers(),
        politicalApiService.getFieldIssues({
          userId: currentUser.id,
          directorId: currentUser.id,
          userRole: "DIRECTOR"
        }),
        politicalApiService.getGrievances(),
        politicalApiService.getMandals(currentUser.assemblyConstituencyId, currentUser.stateId),
        politicalApiService.getVillages(undefined, currentUser.assemblyConstituencyId),
        politicalApiService.getManagerDashboard(currentUser.id).catch((err) => {
          console.warn("Manager dashboard API unavailable; using scoped ticket fallback.", err);
          return null;
        })
      ]);

      const assignedVols = allUsers.filter(
        (u) =>
          (u.primaryRole === "VOLUNTEER" || u.roleId === "VOLUNTEER" || u.role === "volunteer") &&
          u.directorId === currentUser.id
      );

      setVolunteers(assignedVols);
      setIssues(issueList);
      setGrievances(grievanceList);
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

  // Top Tickets Metrics (pending/open does not include in progress)
  const kpiCounts = countByKpi(allOperationsList);
  const dashStats = roleDashboard?.stats;
  const assignedTicketIds = new Set<string>(roleDashboard?.assignedTicketIds || []);
  const assignedTickets = allOperationsList.filter((item) => {
    if (assignedTicketIds.size > 0) return assignedTicketIds.has(item.id);
    return volunteers.some(
      (v) =>
        (item.assignedVolunteerId && v.id === item.assignedVolunteerId) ||
        (item.assignedVolunteerName && v.name === item.assignedVolunteerName)
    );
  });
  const goAssignTickets = (status = "ALL", volunteerId?: string, volunteerAssignedOnly = false) => {
    if (volunteerId) setFilterVolunteerId(volunteerId);
    else setFilterVolunteerId("ALL");
    setAssignedOnly(volunteerAssignedOnly);
    const params = new URLSearchParams();
    params.set("status", status);
    if (volunteerAssignedOnly) params.set("assigned", "1");
    if (volunteerId) params.set("volunteer", volunteerId);
    window.location.hash = `#/assign-tickets?${params.toString()}`;
  };
  const volunteerSummaries = roleDashboard?.volunteers || [];

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

  // Filtered & Sorted Operations
  const sortedAndFilteredOperations = useMemo(() => {
    let list = allOperationsList.filter((item) => {
      // Status Tabs
      const bucket = kpiBucket(item);
      if (activeTab === "OVERDUE" && bucket !== "OVERDUE") return false;
      if (activeTab === "CANT_BE_DONE" && bucket !== "OVERDUE" && (item as any).status !== "Can't be done") return false;
      if ((activeTab === "PENDING" || activeTab === "OPEN_UNASSIGNED") && bucket !== "OPEN_UNASSIGNED") return false;
      if (activeTab === "ASSIGNED" && bucket !== "ASSIGNED") return false;
      if (activeTab === "IN_PROGRESS" && bucket !== "IN_PROGRESS") return false;
      if (activeTab === "COMPLETED" && bucket !== "RESOLVED") return false;
      if (activeTab === "REJECTED" && bucket !== "REJECTED") return false;

      // Category, Department, Type Filters
      if (filterCategory !== "ALL" && item.category !== filterCategory) return false;
      if (filterDepartment !== "ALL" && getItemDepartment(item) !== filterDepartment) return false;
      if (filterType !== "ALL" && getItemType(item) !== filterType) return false;
      if (filterPriority !== "ALL" && item.priority !== filterPriority) return false;
      if (filterReporterType !== "ALL" && item.reporterType !== filterReporterType) return false;
      if (assignedOnly && !assignedTickets.some((ticket) => ticket.id === item.id)) return false;
      if (
        filterVolunteerId !== "ALL" &&
        item.assignedVolunteerId !== filterVolunteerId &&
        item.assignedVolunteerName !== volunteers.find((v) => v.id === filterVolunteerId)?.name
      ) {
        return false;
      }
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
    sortBy,
    assignedOnly,
    assignedTickets,
    volunteers
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

  const handleAssignVolunteer = async (issueId: string, newVolunteerId: string) => {
    const selectedVol = volunteers.find((v) => v.id === newVolunteerId);
    const newVolName = selectedVol ? selectedVol.name : "Unassigned";
    const newVolPhone = selectedVol ? selectedVol.phone : undefined;

    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === issueId) {
          return {
            ...item,
            assignedVolunteerId: newVolunteerId || undefined,
            assignedVolunteerName: newVolName,
            assignedVolunteerPhone: newVolPhone,
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
        assignedVolunteerPhone: newVolPhone,
        status: assignmentSafeStatus(issues.find((i) => i.id === issueId)?.status),
        remarks: `Assigned to ${newVolName} by Campaign Manager`
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
            status: assignmentSafeStatus(item.status),
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
              status: assignmentSafeStatus(i.status),
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
        status: assignmentSafeStatus(issues.find((i) => i.id === issueId)?.status),
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
          onBack={() => {
            setSelectedIssue(null);
            clearTicketIdFromHash();
          }}
          onIssueUpdated={loadDirectorData}
        />
      </div>
    );
  }

  const isAssignTicketsMode = window.location.hash.toLowerCase().includes("assign");

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6 space-y-4 sm:space-y-6 animate-fadeIn text-[#F5EFE0] overflow-x-clip">
      {!isAssignTicketsMode && (
      <>
      {/* Manager Command Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#0E1724] border border-[#D4A24C]/40 shadow-2xl">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#071322] text-[#D4A24C] border border-[#D4A24C]/40 font-mono">
                Campaign Manager
              </span>
              {currentUser.assignedConstituency && (
              <span className="text-xs text-[#D8CFB8]">{currentUser.assignedConstituency}</span>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-[#F5EFE0] font-normal mt-0.5">
              {currentUser.name}
            </h1>
            <p className="text-xs text-[#8E9CAE] mt-0.5 flex flex-wrap items-center gap-x-3">
              <span>{currentUser.designation || currentUser.roleTitle || "Campaign Manager"}</span>
              {currentUser.email && <span>✉️ {currentUser.email}</span>}
              {currentUser.phone && <span>📞 {currentUser.phone}</span>}
            </p>
          </div>
        </div>
      </div>

      </>
      )}


      {!isAssignTicketsMode && (
      <>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 p-4 rounded-2xl bg-[#091422] border border-[#22354D] shadow-xl">
        {(
          [
            { label: "Total Tickets", hint: "All", value: kpiCounts.total, status: "ALL" },
            { label: "Open / Unassigned", hint: "Pending", value: kpiCounts.openUnassigned, status: "OPEN_UNASSIGNED" },
            { label: "Assigned", hint: "Officer", value: kpiCounts.assigned, status: "ASSIGNED" },
            { label: "In Progress", hint: "Ground", value: kpiCounts.inProgress, status: "IN_PROGRESS" },
            { label: "Overdue Alerts", hint: "Urgent", value: kpiCounts.overdue, status: "OVERDUE" },
            { label: "Resolved / Closed", hint: "Closed", value: kpiCounts.resolvedClosed, status: "RESOLVED" },
            { label: "Rejected", hint: "Closed", value: kpiCounts.rejected, status: "REJECTED" }
          ] as const
        ).map((card) => (
          <button
            key={card.status}
            type="button"
            onClick={() => goAssignTickets(card.status)}
            title={`${card.label}: ${Number(card.value || 0).toLocaleString("en-IN")}`}
            className={`p-3.5 rounded-xl border ${UNIQUE_TICKET_SURFACE.kpi} space-y-1 text-left cursor-pointer`}
          >
            <span className="text-[10.5px] font-mono font-semibold uppercase text-[#D4A24C] block whitespace-normal break-words">
              {card.label}
            </span>
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-2xl font-bold font-mono text-[#D4A24C]">{formatDashboardCount(card.value)}</span>
              <span className="text-[10px] text-[#D4A24C]/80 font-mono font-semibold">{card.hint}</span>
            </div>
          </button>
        ))}
      </div>

      {dashboardError && (
        <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 text-xs">
          {dashboardError}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-[#F5EFE0] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4A24C]" />
            My Volunteers
          </h2>
          <span className="text-xs text-[#CBD5E1]">{volunteers.length} reporting to you</span>
        </div>
        {volunteers.length === 0 ? (
          <div className="p-6 rounded-xl border border-[#223348] bg-[#0E1724] text-sm text-[#8E9CAE]">
            No volunteers are assigned to this manager.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 items-stretch">
            {volunteers.map((vol) => {
              const summary = volunteerSummaries.find((s: any) => s.id === vol.id);
              const volIssues = assignedTickets.filter((i) => i.assignedVolunteerId === vol.id);
              const assignedCount = summary?.assignedTickets ?? volIssues.length;
              const pendingCountVol = summary?.pendingTickets ?? volIssues.filter((i) => kpiBucket(i) === "OPEN_UNASSIGNED" || kpiBucket(i) === "ASSIGNED").length;
              const volOverdue = summary?.overdueTickets ?? volIssues.filter((i) => i.status === "OVERDUE").length;
              const volCompleted = summary?.completedTickets ?? volIssues.filter((i) => ["COMPLETED", "RESOLVED"].includes(String(i.status))).length;
              const phone = summary?.phone || vol.phone || "";
              const email = summary?.email || vol.email || "";
              const area = summary?.area || vol.assignedMandalName || vol.assignedConstituency || "";
              const villages = (summary?.villages || vol.assignedVillageNames || []).filter(Boolean);
              return (
                <div
                  key={vol.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => goAssignTickets("ALL", vol.id, true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") goAssignTickets("ALL", vol.id, true);
                  }}
                  className="h-full p-3 rounded-xl bg-[#0E1724]/90 border border-[#223348] hover:border-[#D4A24C]/60 transition-all shadow-md backdrop-blur-xl flex flex-col justify-between space-y-2 cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-[#F5EFE0] truncate">{vol.name}</h3>
                        <p className="text-xs text-[#CBD5E1] truncate">
                          {vol.designation || vol.roleTitle || "Field Volunteer"}
                        </p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold uppercase">
                        {vol.status || "ACTIVE"}
                      </span>
                    </div>

                    <div className="pt-2 space-y-1 text-xs text-[#8E9CAE]">
                      {area ? (
                        <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                          <Building2 className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                          <span className="truncate">{area}</span>
                        </div>
                      ) : null}
                      {villages.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                          <MapPin className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                          <span className="truncate">{villages.join(", ")}</span>
                        </div>
                      ) : null}
                      {email ? (
                        <a
                          href={`mailto:${email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-[#CBD5E1] hover:text-[#D4A24C] truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                          <span className="truncate">{email}</span>
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1 pt-2 border-t border-[#223348]/60 text-center text-[10px]">
                    <div className="p-1 rounded bg-[#0B131E]/80">
                      <span className="text-[#8E9CAE] block font-semibold">Assigned</span>
                      <strong className="text-[#F5EFE0]">{assignedCount}</strong>
                    </div>
                    <div className="p-1 rounded bg-[#0B131E]/80">
                      <span className="text-amber-300 block font-semibold">Pending</span>
                      <strong className="text-amber-200">{pendingCountVol}</strong>
                    </div>
                    <div className="p-1 rounded bg-[#0B131E]/80">
                      <span className="text-rose-300 block font-semibold">Overdue</span>
                      <strong className={volOverdue > 0 ? "text-rose-400" : "text-[#8E9CAE]"}>{volOverdue}</strong>
                    </div>
                    <div className="p-1 rounded bg-[#0B131E]/80">
                      <span className="text-emerald-300 block font-semibold">Done</span>
                      <strong className="text-emerald-400">{volCompleted}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#223348]/70 flex flex-wrap items-center gap-1.5">
                    {phone ? (
                      <>
                        <a
                          href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=Namaste%20${encodeURIComponent(vol.name)}%20garu,%20greetings%20from%20Leader%27s%20Lens%20Office.`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                          title="Send WhatsApp Message"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="text-[11px] hidden sm:inline">WhatsApp</span>
                        </a>
                        <a
                          href={`tel:${phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-xl bg-[#131E2D] hover:bg-[#1E3048] border border-[#223348] text-[#D4A24C] text-xs font-semibold flex items-center gap-1.5 transition-all"
                          title="Direct Phone Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-mono">{phone}</span>
                        </a>
                      </>
                    ) : (
                      <span className="text-[11px] text-[#8E9CAE]">No phone on file</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OfficerStatusComments issues={issues} onOpen={setSelectedIssue} />

      </>
      )}

      {isAssignTicketsMode && (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl text-[#F5EFE0]">Assign Tickets</h1>
            <p className="text-xs text-[#8E9CAE] mt-0.5">
              {sortedAndFilteredOperations.length} tickets · assign departments and inspect records
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
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[#F5EFE0] text-xs focus:outline-none cursor-pointer border-0 border-b border-[#223348] focus:border-[#D4A24C] h-9 [color-scheme:dark]"
              >
                <option value="NEWEST" className="bg-[#0B131E]">Newest first</option>
                <option value="OLDEST" className="bg-[#0B131E]">Oldest first</option>
                <option value="DUE_DATE" className="bg-[#0B131E]">Earliest due</option>
                <option value="PRIORITY" className="bg-[#0B131E]">Highest priority</option>
                <option value="STATUS" className="bg-[#0B131E]">By status</option>
                <option value="TITLE" className="bg-[#0B131E]">Title A–Z</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-1.5 text-[#8E9CAE] shrink-0">
              Show
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-transparent text-[#F5EFE0] text-xs focus:outline-none cursor-pointer border-0 border-b border-[#223348] focus:border-[#D4A24C] h-9 [color-scheme:dark]"
              >
                <option value={10} className="bg-[#0B131E]">10 / page</option>
                <option value={25} className="bg-[#0B131E]">25 / page</option>
                <option value={50} className="bg-[#0B131E]">50 / page</option>
                <option value={100} className="bg-[#0B131E]">100 / page</option>
              </select>
            </label>
            <div className="inline-flex items-center gap-3 text-[#8E9CAE] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                className={`cursor-pointer ${viewMode === "TABLE" ? "text-[#D4A24C] font-semibold" : "hover:text-[#F5EFE0]"}`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`cursor-pointer ${viewMode === "GRID" ? "text-[#D4A24C] font-semibold" : "hover:text-[#F5EFE0]"}`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-x-3 gap-y-2 text-xs">
          <select value={activeTab} onChange={(e) => setActiveTab(e.target.value as any)} className={ASSIGN_FILTER_CLASS}>
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
            <option value="ALL">Dept: All</option>
            {analyticsMatrix.departmentCounts.map((d) => (
              <option key={d.name} value={d.name} className={ASSIGN_OPTION_CLASS}>{d.name}</option>
            ))}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL">Type: All</option>
            {analyticsMatrix.typeCounts.map((t) => (
              <option key={t.name} value={t.name} className={ASSIGN_OPTION_CLASS}>{t.name}</option>
            ))}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL">Category: All</option>
            {availableCategories.map((c) => (
              <option key={c} value={c} className={ASSIGN_OPTION_CLASS}>{c}</option>
            ))}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL">Priority: All</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL">Gender: All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select value={filterAgeGroup} onChange={(e) => setFilterAgeGroup(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL">Age: All</option>
            <option value="20-30">Age: 20-30</option>
            <option value="30-40">Age: 30-40</option>
            <option value="40-50">Age: 40-50</option>
            <option value="50+">Age: 50+</option>
          </select>
          <select value={filterMandalId} onChange={(e) => setFilterMandalId(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL">Mandal: All</option>
            {mandals.map((m) => (
              <option key={m.id} value={m.id} className={ASSIGN_OPTION_CLASS}>{m.name}</option>
            ))}
          </select>
          <select value={filterVolunteerId} onChange={(e) => setFilterVolunteerId(e.target.value)} className={ASSIGN_FILTER_CLASS}>
            <option value="ALL">Assignee: All</option>
            {volunteers.map((v) => (
              <option key={v.id} value={v.id} className={ASSIGN_OPTION_CLASS}>{v.name}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8E9CAE]">
            <p className="min-w-0 whitespace-normal break-words">
              {[
                activeTab !== "ALL" ? `Status ${activeTab}` : "",
                filterDepartment !== "ALL" ? `Dept ${filterDepartment}` : "",
                filterType !== "ALL" ? `Type ${filterType}` : "",
                filterCategory !== "ALL" ? `Category ${filterCategory}` : "",
                filterPriority !== "ALL" ? `Priority ${filterPriority}` : "",
                filterGender !== "ALL" ? `Gender ${filterGender}` : "",
                filterAgeGroup !== "ALL" ? `Age ${filterAgeGroup}` : "",
                filterReporterType !== "ALL" ? `Reporter ${filterReporterType}` : "",
                filterMandalId !== "ALL" ? "Mandal filtered" : "",
                filterVolunteerId !== "ALL" ? "Volunteer filtered" : "",
                searchQuery ? `Search “${searchQuery}”` : ""
              ].filter(Boolean).join(" · ")}
            </p>
            <button type="button" onClick={clearAllFilters} className="text-[#D4A24C] hover:underline font-semibold shrink-0 cursor-pointer">
              Clear filters
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-[#8E9CAE]">Loading tickets…</div>
        ) : sortedAndFilteredOperations.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <h3 className="text-base font-semibold text-[#F5EFE0]">No tickets match these filters</h3>
            <p className="text-xs text-[#8E9CAE]">Try a different search, category, or status.</p>
            <button type="button" onClick={clearAllFilters} className="text-xs font-semibold text-[#D4A24C] hover:underline cursor-pointer">
              Clear filters
            </button>
          </div>
        ) : viewMode === "GRID" ? (
          <div className={ASSIGN_GRID_CLASS}>
            {paginatedOperations.map((issue) => {
              const timing = getTicketTimingDetails(issue);
              const showAssign = isTicketOpenForAssign(issue.status);
              return (
                <TicketGridCard
                  key={issue.id}
                  issue={issue}
                  timing={timing}
                  departments={DEPARTMENTS}
                  resolveDeptValue={resolveDeptValue}
                  showAssignControls={showAssign}
                  showProofCount={false}
                  showAcCode
                  plain
                  extraBadges={
                    <span>
                      {" · "}
                      {issue.issueType === "GRIEVANCE" ? "Grievance" : "Field Issue"}
                    </span>
                  }
                  onOpen={() => setSelectedIssue(issue)}
                  onAssignDepartment={(id, dept) => handleAssignDepartment(id, dept)}
                  onOpenWhatsAppAssign={() => setAssignModalIssue(issue)}
                />
              );
            })}
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-hidden">
            <table className={ASSIGN_TABLE_CLASS}>
              <thead>
                <tr>
                  <th className={`${ASSIGN_TH} w-[12%]`}>ID & Status</th>
                  <th className={`${ASSIGN_TH} w-[22%]`}>Issue Title</th>
                  <th className={`${ASSIGN_TH} w-[12%]`}>Category / Dept</th>
                  <th className={`${ASSIGN_TH} w-[12%]`}>Mandal / Location</th>
                  <th className={`${ASSIGN_TH} w-[10%]`}>Reported By</th>
                  <th className={`${ASSIGN_TH} w-[14%]`}>Assign & Notify</th>
                  <th className={`${ASSIGN_TH} w-[10%]`}>Timeline</th>
                  <th className={`${ASSIGN_TH} w-[8%] text-right whitespace-nowrap`}>View</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOperations.map((issue) => {
                  const timing = getTicketTimingDetails(issue);
                  const officerComment = issue.lastStatusRemarks?.trim();
                  const canAssign = isTicketOpenForAssign(issue.status);
                  return (
                    <tr key={issue.id} onClick={() => setSelectedIssue(issue)} className={ASSIGN_TR}>
                      <td className={ASSIGN_TD}>
                        <div className="font-mono font-semibold text-[#D4A24C] text-[11px]" title={formatTicketDisplay(issue)}>
                          <div>{rawTicketNumber(issue)}</div>
                          {constituencyShortName(issue) ? (
                            <div className="text-[10px] text-[#8E9CAE] font-normal">({constituencyShortName(issue)})</div>
                          ) : null}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#CBD5E1]">{formatIssueStatus(issue.status)}</div>
                      </td>
                      <td className={ASSIGN_TD}>
                        <div className="font-semibold text-[#F5EFE0]">{issue.title}</div>
                        {issue.description ? (
                          <div className="text-[11px] text-[#8E9CAE] mt-0.5">{issue.description}</div>
                        ) : null}
                        {officerComment ? (
                          <div className="mt-1 text-[11px] text-[#CBD5E1]">Officer: {officerComment}</div>
                        ) : null}
                      </td>
                      <td className={ASSIGN_TD}>
                        <div className="text-[#F5EFE0]">{issue.category}</div>
                        {issue.department ? (
                          <div className="text-[10.5px] text-[#8E9CAE] mt-0.5">{issue.department.split("(")[0]}</div>
                        ) : null}
                      </td>
                      <td className={ASSIGN_TD}>
                        <div className="text-[#F5EFE0]">{issue.mandalName}</div>
                        {(issue.villageName || issue.placeName) ? (
                          <div className="text-[10.5px] text-[#8E9CAE] mt-0.5">{issue.villageName || issue.placeName}</div>
                        ) : null}
                      </td>
                      <td className={ASSIGN_TD}>
                        <div className="text-[#F5EFE0]">{issue.reportedBy}</div>
                        <div className="text-[10.5px] text-[#8E9CAE] mt-0.5">
                          {issue.reporterType === "LEADER" ? "Leader" : issue.reporterType === "CADRE" ? "Cadre" : "Citizen"}
                        </div>
                      </td>
                      <td className={ASSIGN_TD} onClick={(e) => e.stopPropagation()}>
                        {!canAssign ? (
                          <div className="text-[11px] text-[#F5EFE0]">{issue.department || "General Administration"}</div>
                        ) : (
                          <div className="space-y-1">
                            <select
                              value={resolveDeptValue(issue.department)}
                              onChange={(e) => handleAssignDepartment(issue.id, e.target.value)}
                              className="w-full min-w-0 bg-[#0B131E] text-[#F5EFE0] text-[11px] border-0 rounded-none px-1 py-1 outline-none cursor-pointer [color-scheme:dark]"
                            >
                              <option value="" className={ASSIGN_OPTION_CLASS}>-- Select Department --</option>
                              {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept} className={ASSIGN_OPTION_CLASS}>{dept}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignModalIssue(issue);
                              }}
                              className="text-[11px] font-semibold text-[#D4A24C] hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <MessageCircle className="w-3 h-3 shrink-0" />
                              WhatsApp
                            </button>
                          </div>
                        )}
                      </td>
                      <td className={`${ASSIGN_TD} font-mono text-[10px] text-[#8E9CAE]`}>
                        <div>Reg {timing.registeredTimeFormatted}</div>
                        <div className="mt-0.5 text-[#CBD5E1]">
                          {timing.isClosed ? `Done ${timing.closedTimeFormatted}` : `Open ${timing.durationText}`}
                        </div>
                      </td>
                      <td className={`${ASSIGN_TD} text-right whitespace-nowrap [overflow-wrap:normal]`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssue(issue);
                          }}
                          className="text-[11px] font-semibold text-[#D4A24C] hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
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

        {sortedAndFilteredOperations.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs text-[#8E9CAE]">
            <div className="font-mono text-center sm:text-left">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedAndFilteredOperations.length)} of {sortedAndFilteredOperations.length}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} title="First Page" className="disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:text-[#F5EFE0]">
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} title="Previous Page" className="disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:text-[#F5EFE0]">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={p}>
                        {prev && p - prev > 1 ? <span>…</span> : null}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[1.5rem] cursor-pointer ${currentPage === p ? "text-[#D4A24C] font-bold" : "hover:text-[#F5EFE0]"}`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>
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
      )}


      {/* Assign Complaint & WhatsApp Modal */}
      <AssignComplaintModal
        isOpen={!!assignModalIssue}
        issue={assignModalIssue}
        onClose={() => setAssignModalIssue(null)}
        onConfirmAssign={(issueId, deptName, officialName, officialPhone) => handleAssignDepartment(issueId, deptName, officialName, officialPhone)}
      />
    </div>
  );
};
