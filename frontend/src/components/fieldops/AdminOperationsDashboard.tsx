import React, { useState, useEffect, useMemo } from "react";
import {
  FieldIssue,
  UserProfile,
  MandalInfo,
  VillageInfo,
  GeographicDrilldownNode
} from "../../types";
import { politicalApiService } from "../../services/api";
import { IssueDetailModal } from "./IssueDetailModal";
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
  ChevronRight,
  Eye,
  Camera,
  Layers,
  Sparkles,
  UserCheck,
  Building2,
  Flame,
  FileText,
  Phone,
  Calendar
} from "lucide-react";

interface AdminDashboardProps {
  currentUser: UserProfile;
}

export const AdminOperationsDashboard: React.FC<AdminDashboardProps> = ({
  currentUser
}) => {
  const [drilldownData, setDrilldownData] = useState<any>(null);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [mandals, setMandals] = useState<MandalInfo[]>([]);
  const [villages, setVillages] = useState<VillageInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const isPlatformSuperAdmin = currentUser.primaryRole === "SUPER_ADMIN" || currentUser.isPlatformAdmin;
  const [selectedConstituencyId, setSelectedConstituencyId] = useState<string>(
    currentUser.assemblyConstituencyId || "KDP-AC"
  );

  // Selected Issue for Modal
  const [selectedIssue, setSelectedIssue] = useState<FieldIssue | null>(null);

  // Expanded Nodes in Geographic Tree
  const [expandedMandals, setExpandedMandals] = useState<Record<string, boolean>>({
    "MDL-KDP-URB": true
  });
  const [expandedVillages, setExpandedVillages] = useState<Record<string, boolean>>({
    "VIL-CCK": true
  });

  // View Mode: Geographic Tree vs Master Table vs Director Command vs Political Admins
  const [viewMode, setViewMode] = useState<"DRILLDOWN" | "ALL_ISSUES" | "DIRECTORS" | "VOLUNTEERS" | "POLITICAL_ADMINS">("DRILLDOWN");

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterMandal, setFilterMandal] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAdminData();
  }, [currentUser.assemblyConstituencyId]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [drilldown, issueList, userList, mandalList, villageList] = await Promise.all([
        politicalApiService.getGeographicDrilldown(
          currentUser.assemblyConstituencyId || "KDP-AC",
          currentUser.stateId || "AP"
        ),
        politicalApiService.getFieldIssues(),
        politicalApiService.getUsers(),
        politicalApiService.getMandals(
          currentUser.assemblyConstituencyId || "KDP-AC",
          currentUser.stateId || "AP"
        ),
        politicalApiService.getVillages(undefined, currentUser.assemblyConstituencyId || "KDP-AC")
      ]);

      setDrilldownData(drilldown);
      setIssues(issueList);
      setUsers(userList);
      setMandals(mandalList);
      setVillages(villageList);
    } catch (e) {
      console.error(e);
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

  // Metrics
  const directors = users.filter((u) => u.primaryRole === "DIRECTOR");
  const volunteers = users.filter((u) => u.primaryRole === "VOLUNTEER");
  const totalIssues = issues.length;
  const pendingCount = issues.filter((i) => ["NEW", "ASSIGNED"].includes(i.status)).length;
  const inProgressCount = issues.filter((i) => i.status === "IN_PROGRESS").length;
  const completedCount = issues.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
  const overdueCount = issues.filter((i) => i.status === "OVERDUE").length;

  const filteredIssues = useMemo(() => {
    return issues.filter((item) => {
      if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
      if (filterPriority !== "ALL" && item.priority !== filterPriority) return false;
      if (filterMandal !== "ALL" && item.mandalId !== filterMandal) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.villageName || "").toLowerCase().includes(q) ||
          (item.assignedVolunteerName || "").toLowerCase().includes(q) ||
          item.reportedBy.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [issues, filterStatus, filterPriority, filterMandal, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn text-[#F5EFE0]">
      {/* MLA / PA Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B1A2C] via-[#122A44] to-[#0F2338] border border-[#D4A24C]/40 shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4A24C]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#071322] text-[#D4A24C] border border-[#D4A24C]/40">
                {isPlatformSuperAdmin ? "Level 1: Platform Super Admin" : "Level 2: Political Admin (MLA)"}
              </span>
              <span className="text-xs text-[#D8CFB8]">{currentUser.assignedConstituency}</span>
              {currentUser.partyAbbr && (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#071322] text-[#D4A24C]">
                  {currentUser.partyEmoji} {currentUser.partyAbbr}
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-[#F5EFE0] font-normal mt-0.5">
              {currentUser.name}
            </h1>
            <p className="text-xs text-[#8E9CAE] mt-0.5">
              {isPlatformSuperAdmin
                ? `Platform Owner Multi-Constituency Command · ${directors.length} Directors · ${volunteers.length} Field Volunteers`
                : `Constituency Ground Visibility · ${directors.length} Directors · ${volunteers.length} Field Volunteers · ${mandals.length} Mandals`}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {isPlatformSuperAdmin && (
            <button
              onClick={() => setViewMode("POLITICAL_ADMINS")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                viewMode === "POLITICAL_ADMINS"
                  ? "bg-[#D4A24C] text-[#071322] shadow-md"
                  : "bg-[#071322] text-[#D8CFB8] hover:text-white border border-[#22405E]"
              }`}
            >
              Constituency Admins (MLAs)
            </button>
          )}
          <button
            onClick={() => setViewMode("DRILLDOWN")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
              viewMode === "DRILLDOWN"
                ? "bg-[#D4A24C] text-[#071322] shadow-md"
                : "bg-[#071322] text-[#D8CFB8] hover:text-white border border-[#22405E]"
            }`}
          >
            Geographic Tree
          </button>
          <button
            onClick={() => setViewMode("ALL_ISSUES")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
              viewMode === "ALL_ISSUES"
                ? "bg-[#D4A24C] text-[#071322] shadow-md"
                : "bg-[#071322] text-[#D8CFB8] hover:text-white border border-[#22405E]"
            }`}
          >
            Master Issues ({totalIssues})
          </button>
          <button
            onClick={() => setViewMode("DIRECTORS")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
              viewMode === "DIRECTORS"
                ? "bg-[#D4A24C] text-[#071322] shadow-md"
                : "bg-[#071322] text-[#D8CFB8] hover:text-white border border-[#22405E]"
            }`}
          >
            Directors ({directors.length})
          </button>
          <button
            onClick={() => setViewMode("VOLUNTEERS")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
              viewMode === "VOLUNTEERS"
                ? "bg-[#D4A24C] text-[#071322] shadow-md"
                : "bg-[#071322] text-[#D8CFB8] hover:text-white border border-[#22405E]"
            }`}
          >
            Volunteers ({volunteers.length})
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-[#0B1A2C] border border-[#22405E]">
          <span className="text-[10px] uppercase tracking-wider text-[#8E9CAE] block">Total Issues</span>
          <div className="font-display text-2xl font-bold text-[#F5EFE0] mt-1">{totalIssues}</div>
          <span className="text-[10px] text-[#8E9CAE] mt-0.5 block">{mandals.length} Mandals covered</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1A2C] border border-[#22405E]">
          <span className="text-[10px] uppercase tracking-wider text-blue-300 block">Pending Intake</span>
          <div className="font-display text-2xl font-bold text-blue-400 mt-1">{pendingCount}</div>
          <span className="text-[10px] text-[#8E9CAE] mt-0.5 block">Awaiting action</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1A2C] border border-[#22405E]">
          <span className="text-[10px] uppercase tracking-wider text-amber-300 block">In Progress</span>
          <div className="font-display text-2xl font-bold text-amber-400 mt-1">{inProgressCount}</div>
          <span className="text-[10px] text-[#8E9CAE] mt-0.5 block">Field work active</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1A2C] border border-[#22405E]">
          <span className="text-[10px] uppercase tracking-wider text-emerald-300 block">Verified Resolved</span>
          <div className="font-display text-2xl font-bold text-emerald-400 mt-1">{completedCount}</div>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">With proof photos</span>
        </div>

        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase tracking-wider text-rose-400 block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Overdue Work
          </span>
          <div className="font-display text-2xl font-bold text-rose-400 mt-1">{overdueCount}</div>
          <span className="text-[10px] text-rose-300 mt-0.5 block">Needs MLA review</span>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE MLA GEOGRAPHIC DRILLDOWN TREE */}
      {viewMode === "DRILLDOWN" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0F2338]/80 border border-[#22405E]">
            <div>
              <h2 className="font-display text-base text-[#F5EFE0] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D4A24C]" />
                Constituency Ground Hierarchy: State → AC → Mandal → Village → Volunteer → Issues
              </h2>
              <p className="text-xs text-[#8E9CAE] mt-0.5">
                Click any Mandal or Village node to expand real-time status and proof records.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-[#071322] border border-[#22405E] text-[#D4A24C]">
                Kadapa AC (AC-132)
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
            <div className="space-y-3">
              {drilldownData.mandals.map((mandal: any) => {
                const isMandalExpanded = !!expandedMandals[mandal.mandalId];
                return (
                  <div
                    key={mandal.mandalId}
                    className="rounded-2xl bg-[#0B1A2C] border border-[#22405E] overflow-hidden shadow-sm transition-all"
                  >
                    {/* Mandal Node Header */}
                    <div
                      onClick={() => toggleMandal(mandal.mandalId)}
                      className="p-4 sm:p-5 bg-gradient-to-r from-[#0F2338] to-[#0B1A2C] hover:bg-[#122A44] transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-3 border-b border-[#22405E]/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#071322] border border-[#D4A24C]/40 text-[#D4A24C]">
                          {isMandalExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#071322] text-[#D4A24C]">
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
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="px-2.5 py-1 rounded bg-[#071322] border border-[#22405E] text-[#D8CFB8]">
                          Total: <strong className="text-[#F5EFE0]">{mandal.issueSummary.total}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded bg-amber-950/50 border border-amber-500/30 text-amber-300">
                          In Progress: <strong>{mandal.issueSummary.inProgress}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">
                          Resolved: <strong>{mandal.issueSummary.completed}</strong>
                        </span>
                        {mandal.issueSummary.overdue > 0 && (
                          <span className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 animate-pulse">
                            Overdue: <strong>{mandal.issueSummary.overdue}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Village Nodes List */}
                    {isMandalExpanded && (
                      <div className="p-4 sm:p-5 space-y-3 bg-[#071322]/50">
                        {mandal.villages.map((village: any) => {
                          const isVillageExpanded = !!expandedVillages[village.villageId];
                          return (
                            <div
                              key={village.villageId}
                              className="rounded-xl bg-[#0F2338] border border-[#22405E] overflow-hidden"
                            >
                              {/* Village Node Row */}
                              <div
                                onClick={() => toggleVillage(village.villageId)}
                                className="p-3.5 hover:bg-[#122A44] transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-3"
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

                                {/* Responsible Volunteer Pill */}
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071322] border border-[#22405E] text-[11px]">
                                    {village.volunteer?.avatar && (
                                      <img
                                        src={village.volunteer.avatar}
                                        alt={village.volunteer.name}
                                        className="w-5 h-5 rounded-full object-cover"
                                      />
                                    )}
                                    <span>
                                      Volunteer: <strong className="text-[#D4A24C]">{village.volunteer?.name}</strong>
                                    </span>
                                    {village.volunteer?.phone && (
                                      <a
                                        href={`tel:${village.volunteer.phone}`}
                                        className="text-[#8E9CAE] hover:text-white"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Phone className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="px-2 py-0.5 rounded bg-[#071322] text-[#D8CFB8]">
                                      {village.issueSummary.total} Issues
                                    </span>
                                    {village.issueSummary.overdue > 0 && (
                                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                                        {village.issueSummary.overdue} Overdue
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Village Issues Drilldown */}
                              {isVillageExpanded && (
                                <div className="p-3 border-t border-[#22405E] bg-[#071322] space-y-2">
                                  {village.issues.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-[#8E9CAE]">
                                      No issues logged in {village.villageName}. Ground reports clear.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                      {village.issues.map((iss: FieldIssue) => (
                                        <div
                                          key={iss.id}
                                          onClick={() => setSelectedIssue(iss)}
                                          className="p-3 rounded-lg bg-[#0F2338] border border-[#22405E] hover:border-[#D4A24C]/60 transition-all cursor-pointer space-y-1.5"
                                        >
                                          <div className="flex items-center justify-between text-[10px]">
                                            <span className="font-mono text-[#D4A24C]">#{iss.id}</span>
                                            <span
                                              className={`font-bold uppercase px-2 py-0.2 rounded-full border ${
                                                iss.status === "COMPLETED"
                                                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                                  : iss.status === "OVERDUE"
                                                  ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                                                  : "bg-amber-950/60 text-amber-300 border-amber-500/40"
                                              }`}
                                            >
                                              {iss.status}
                                            </span>
                                          </div>
                                          <h5 className="font-semibold text-xs text-[#F5EFE0] line-clamp-1">
                                            {iss.title}
                                          </h5>
                                          <div className="flex items-center justify-between text-[10px] text-[#8E9CAE]">
                                            <span>By {iss.reportedBy}</span>
                                            {iss.lastStatusProof && (
                                              <span className="text-emerald-400 flex items-center gap-1">
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

      {/* VIEW 2: MASTER ISSUES GRID & SEARCH */}
      {viewMode === "ALL_ISSUES" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
              <input
                type="text"
                placeholder="Search across all mandals, issues, citizens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F2338] border border-[#22405E] rounded-xl pl-9 pr-3 py-2 text-[12px] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#0F2338] border border-[#22405E] rounded-xl px-3 py-2 text-[12px] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-[#0F2338] border border-[#22405E] rounded-xl px-3 py-2 text-[12px] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIssues.map((iss) => (
              <div
                key={iss.id}
                onClick={() => setSelectedIssue(iss)}
                className="p-5 rounded-2xl bg-[#0B1A2C] border border-[#22405E] hover:border-[#D4A24C]/60 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-sm hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-[#D4A24C] bg-[#071322] px-1.5 py-0.5 rounded border border-[#D4A24C]/30">
                        #{iss.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          iss.status === "COMPLETED"
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                            : iss.status === "OVERDUE"
                            ? "bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse"
                            : "bg-amber-950/60 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        {iss.status}
                      </span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1A3654] text-[#D8CFB8]">
                      {iss.category}
                    </span>
                  </div>

                  <h3 className="font-display text-[15px] font-semibold text-[#F5EFE0] line-clamp-1 group-hover:text-[#D4A24C] transition-colors">
                    {iss.title}
                  </h3>
                  <p className="text-[12px] text-[#A69B80] line-clamp-2 leading-relaxed">
                    {iss.description}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#22405E]/60 text-[11px]">
                  <div className="flex items-center justify-between text-[#D8CFB8]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D4A24C]" />
                      {iss.mandalName} · {iss.villageName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#8E9CAE]">
                    <span>Volunteer: <strong className="text-[#F5EFE0]">{iss.assignedVolunteerName || "Unassigned"}</strong></span>
                    <span>Due: {iss.dueDate || "Not set"}</span>
                  </div>

                  {iss.lastStatusRemarks && (
                    <div className="p-2 rounded bg-[#071322]/80 text-[10px] text-[#E2DCBE] line-clamp-1">
                      <strong className="text-[#D4A24C]">Update: </strong>{iss.lastStatusRemarks}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                          {polAdminDirectors.length || 2}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#071322] border border-[#22405E]">
                        <span className="text-[#8E9CAE] block uppercase">Volunteers</span>
                        <strong className="text-base text-[#D4A24C] font-display">
                          {polAdminVolunteers.length || 4}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#071322] border border-[#22405E]">
                        <span className="text-[#8E9CAE] block uppercase">Field Issues</span>
                        <strong className="text-base text-blue-400 font-display">
                          {polAdminIssues.length || issues.length}
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

      {/* VIEW 3: DIRECTORS MANAGEMENT */}
      {viewMode === "DIRECTORS" && (
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

      {/* VIEW 4: VOLUNTEERS MASTER GRID */}
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
                      {vol.assignedMandalName || "Kadapa Urban"}
                    </span>
                    <span className="text-[10px] text-[#8E9CAE] block truncate">
                      {vol.assignedVillageNames?.join(", ") || "Chinna Chowk"}
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

      {/* Selected Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          currentUser={currentUser}
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onIssueUpdated={loadAdminData}
        />
      )}

      {/* Footer Attribution */}
      <div className="text-center py-4 border-t border-[#22405E]/40 text-xs text-[#8E9CAE]">
        Developed and Maintained by{" "}
        <a
          href="https://palramai.in"
          target="_blank"
          rel="noreferrer"
          className="text-[#D4A24C] font-semibold hover:underline"
        >
          palramai.in
        </a>
      </div>
    </div>
  );
};
