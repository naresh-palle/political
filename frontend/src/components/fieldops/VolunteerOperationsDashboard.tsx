import React, { useState, useEffect, useMemo } from "react";
import {
  FieldIssue,
  UserProfile,
  IssueCategory,
  IssuePriority,
  IssueStatus,
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
  AlertCircle,
  Camera,
  Send,
  Lock,
  Search,
  Filter,
  User,
  Phone,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  Shield
} from "lucide-react";

interface VolunteerDashboardProps {
  currentUser: UserProfile;
}

export const VolunteerOperationsDashboard: React.FC<VolunteerDashboardProps> = ({
  currentUser
}) => {
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [villages, setVillages] = useState<VillageInfo[]>([]);
  const [mandals, setMandals] = useState<MandalInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Issue for Detail Modal
  const [selectedIssue, setSelectedIssue] = useState<FieldIssue | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Complaint Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<IssueCategory>("Water Supply");
  const [newPriority, setNewPriority] = useState<IssuePriority>("MEDIUM");
  const [newIssueType, setNewIssueType] = useState<"COMPLAINT" | "REQUIREMENT">("COMPLAINT");
  const [newVillageId, setNewVillageId] = useState("");
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newReportedBy, setNewReportedBy] = useState("");
  const [newReporterPhone, setNewReporterPhone] = useState("");
  const [newInitialRemarks, setNewInitialRemarks] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  useEffect(() => {
    loadVolunteerData();
  }, [currentUser.id]);

  const loadVolunteerData = async () => {
    setLoading(true);
    try {
      const [issueList, villageList, mandalList] = await Promise.all([
        politicalApiService.getFieldIssues({
          userId: currentUser.id,
          userRole: "VOLUNTEER"
        }),
        politicalApiService.getVillages(
          currentUser.assignedMandalId || undefined,
          currentUser.assemblyConstituencyId || "KDP-AC"
        ),
        politicalApiService.getMandals(
          currentUser.assemblyConstituencyId || "KDP-AC",
          currentUser.stateId || "AP"
        )
      ]);

      setIssues(issueList);
      setVillages(villageList);
      setMandals(mandalList);

      if (villageList.length > 0 && !newVillageId) {
        setNewVillageId(villageList[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newReportedBy.trim()) {
      setFormError("Please fill out Title, Description, and Reporter Name.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const selectedVillage = villages.find((v) => v.id === newVillageId) || villages[0];
    const selectedMandal = mandals.find((m) => m.id === (selectedVillage?.mandalId || currentUser.assignedMandalId));

    try {
      const payload: Partial<FieldIssue> = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        priority: newPriority,
        issueType: newIssueType,
        status: "NEW",
        stateId: currentUser.stateId || "AP",
        assemblyConstituencyId: currentUser.assemblyConstituencyId || "KDP-AC",
        mandalId: selectedMandal?.id || currentUser.assignedMandalId || "MDL-KDP-URB",
        mandalName: selectedMandal?.name || currentUser.assignedMandalName || "Kadapa Urban",
        villageId: selectedVillage?.id || "VIL-CCK",
        villageName: selectedVillage?.name || "Chinna Chowk",
        placeName: newPlaceName.trim(),
        reportedBy: newReportedBy.trim(),
        reporterPhone: newReporterPhone.trim(),
        reportedDate: new Date().toISOString().split("T")[0],
        assignedVolunteerId: currentUser.id,
        assignedVolunteerName: currentUser.name,
        directorId: currentUser.directorId || "usr-tdp-ap",
        directorName: currentUser.directorName || "Constituency Director",
        initialRemarks: newInitialRemarks.trim(),
        attachments: newAttachmentUrl ? [newAttachmentUrl] : [],
        createdBy: currentUser.id,
        createdByRole: "VOLUNTEER"
      };

      const created = await politicalApiService.createFieldIssue(payload);
      setIssues([created, ...issues]);
      setSubmissionSuccess(true);
      setTimeout(() => {
        setSubmissionSuccess(false);
        setIsAddModalOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewPlaceName("");
        setNewReportedBy("");
        setNewReporterPhone("");
        setNewInitialRemarks("");
        setNewAttachmentUrl("");
      }, 1500);
    } catch (err: any) {
      setFormError(err?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalCount = issues.length;
  const pendingCount = issues.filter((i) => ["NEW", "ASSIGNED"].includes(i.status)).length;
  const inProgressCount = issues.filter((i) => i.status === "IN_PROGRESS").length;
  const completedCount = issues.filter((i) => ["COMPLETED", "RESOLVED"].includes(i.status)).length;
  const overdueCount = issues.filter((i) => i.status === "OVERDUE").length;

  const filteredIssues = useMemo(() => {
    return issues.filter((item) => {
      if (activeTab === "PENDING" && !["NEW", "ASSIGNED"].includes(item.status)) return false;
      if (activeTab === "IN_PROGRESS" && item.status !== "IN_PROGRESS") return false;
      if (activeTab === "COMPLETED" && !["COMPLETED", "RESOLVED"].includes(item.status)) return false;
      if (activeTab === "OVERDUE" && item.status !== "OVERDUE") return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchLoc = (item.villageName || "").toLowerCase().includes(q) || (item.placeName || "").toLowerCase().includes(q);
        const matchRep = item.reportedBy.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchLoc || matchRep;
      }
      return true;
    });
  }, [issues, activeTab, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn text-[#F5EFE0]">
      {/* Volunteer Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0F2338] via-[#122A44] to-[#0B1A2C] border border-[#D4A24C]/30 shadow-xl">
        <div className="flex items-center gap-3.5">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-12 h-12 rounded-xl object-cover border-2 border-[#D4A24C]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#071322] text-[#D4A24C] border border-[#D4A24C]/40">
                Field Volunteer
              </span>
              <span className="text-xs text-[#D8CFB8]">{currentUser.assignedConstituency}</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl text-[#F5EFE0] font-normal mt-0.5">
              {currentUser.name}
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A24C] to-[#B38332] text-[#071322] font-semibold text-xs sm:text-sm hover:brightness-110 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Complaint / Requirement
        </button>
      </div>

      {/* Assigned Geography Card */}
      <div className="p-4 rounded-xl bg-[#0F2338]/80 border border-[#22405E] flex flex-wrap items-center justify-between gap-3 text-[12px]">
        <div className="flex items-center gap-2 text-[#D4A24C]">
          <MapPin className="w-4 h-4" />
          <span className="font-semibold uppercase tracking-wider text-[11px] text-[#F5EFE0]">
            My Assigned Area:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-[#071322] border border-[#22405E] text-[#F5EFE0]">
            Mandal: <strong className="text-[#D4A24C]">{currentUser.assignedMandalName || "Kadapa Urban"}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-[#071322] border border-[#22405E] text-[#F5EFE0]">
            Villages: <strong className="text-[#D4A24C]">{currentUser.assignedVillageNames?.join(", ") || "Chinna Chowk, Utukur"}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-[#071322] border border-[#22405E] text-[#F5EFE0]">
            Director: <strong className="text-[#D8CFB8]">{currentUser.directorName || "Naresh Palle"}</strong>
          </span>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab("ALL")}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === "ALL"
              ? "bg-[#122A44] border-[#D4A24C] shadow-md"
              : "bg-[#0B1A2C] border-[#22405E] hover:border-[#D4A24C]/40"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-[#8E9CAE] block">Total Work</span>
          <div className="font-display text-2xl font-bold text-[#F5EFE0] mt-1">{totalCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("PENDING")}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === "PENDING"
              ? "bg-[#122A44] border-[#D4A24C] shadow-md"
              : "bg-[#0B1A2C] border-[#22405E] hover:border-[#D4A24C]/40"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-blue-300 block">Pending</span>
          <div className="font-display text-2xl font-bold text-blue-400 mt-1">{pendingCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("IN_PROGRESS")}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === "IN_PROGRESS"
              ? "bg-[#122A44] border-[#D4A24C] shadow-md"
              : "bg-[#0B1A2C] border-[#22405E] hover:border-[#D4A24C]/40"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-amber-300 block">In Progress</span>
          <div className="font-display text-2xl font-bold text-amber-400 mt-1">{inProgressCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("COMPLETED")}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === "COMPLETED"
              ? "bg-[#122A44] border-[#D4A24C] shadow-md"
              : "bg-[#0B1A2C] border-[#22405E] hover:border-[#D4A24C]/40"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-emerald-300 block">Completed</span>
          <div className="font-display text-2xl font-bold text-emerald-400 mt-1">{completedCount}</div>
        </div>

        <div
          onClick={() => setActiveTab("OVERDUE")}
          className={`p-4 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            activeTab === "OVERDUE"
              ? "bg-rose-950/60 border-rose-500 shadow-md"
              : "bg-[#0B1A2C] border-[#22405E] hover:border-rose-500/50"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-rose-400 block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
          <div className="font-display text-2xl font-bold text-rose-400 mt-1">{overdueCount}</div>
        </div>
      </div>

      {/* Action Bar: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
          <input
            type="text"
            placeholder="Search my issues, citizens, villages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F2338] border border-[#22405E] rounded-xl pl-9 pr-4 py-2 text-[12px] text-[#F5EFE0] focus:outline-none focus:border-[#D4A24C]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider transition-all cursor-pointer shrink-0 ${
                activeTab === tab
                  ? "bg-[#D4A24C] text-[#071322]"
                  : "bg-[#0F2338] text-[#D8CFB8] hover:text-white border border-[#22405E]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Issues Grid / Mobile Task Cards */}
      {loading ? (
        <div className="p-12 text-center text-sm text-[#8E9CAE]">Loading assigned field work...</div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0B1A2C] border border-[#22405E] text-center space-y-3">
          <FileText className="w-8 h-8 text-[#8E9CAE] mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-[#F5EFE0]">No issues found in this category</h3>
          <p className="text-xs text-[#8E9CAE]">
            {searchQuery
              ? "Try adjusting your search terms."
              : "Use the button above to log a new complaint from local citizens."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => setSelectedIssue(issue)}
              className="p-5 rounded-2xl bg-[#0B1A2C] border border-[#22405E] hover:border-[#D4A24C]/60 transition-all cursor-pointer space-y-3 relative group shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#D4A24C] bg-[#071322] px-1.5 py-0.5 rounded border border-[#D4A24C]/30">
                    #{issue.id}
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
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1A3654] text-[#D8CFB8]">
                    {issue.category}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    issue.priority === "URGENT"
                      ? "text-red-400 bg-red-950/60 border border-red-500/40"
                      : issue.priority === "HIGH"
                      ? "text-orange-400 bg-orange-950/60 border border-orange-500/40"
                      : "text-[#D8CFB8] bg-[#0F2338]"
                  }`}
                >
                  {issue.priority}
                </span>
              </div>

              <div>
                <h3 className="font-display text-[15px] font-semibold text-[#F5EFE0] line-clamp-1 group-hover:text-[#D4A24C] transition-colors">
                  {issue.title}
                </h3>
                <p className="text-[12px] text-[#A69B80] line-clamp-2 mt-1 leading-relaxed">
                  {issue.description}
                </p>
              </div>

              {/* Location & Reporter Strip */}
              <div className="pt-2 border-t border-[#22405E]/60 flex items-center justify-between text-[11px] text-[#8E9CAE]">
                <span className="flex items-center gap-1 text-[#D8CFB8]">
                  <MapPin className="w-3.5 h-3.5 text-[#D4A24C]" />
                  {issue.villageName} {issue.placeName ? `· ${issue.placeName}` : ""}
                </span>
                <span>By {issue.reportedBy}</span>
              </div>

              {/* Latest update preview if exists */}
              {issue.lastStatusRemarks && (
                <div className="p-2.5 rounded-lg bg-[#071322]/80 border border-[#22405E] text-[11px] text-[#E2DCBE]">
                  <span className="text-[9px] uppercase text-[#D4A24C] font-semibold block">
                    Latest Progress Remark
                  </span>
                  <p className="line-clamp-1 mt-0.5">{issue.lastStatusRemarks}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add New Complaint / Requirement */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0B1A2C] border border-[#D4A24C] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-[#F5EFE0] overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-[#22405E] bg-[#0F2338] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C]">
                  Ground Field Intake
                </span>
                <h3 className="font-display text-xl text-[#F5EFE0]">
                  Log New Citizen Complaint / Requirement
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8E9CAE] hover:text-white p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-[12px]">
              {/* Immutability Notice */}
              <div className="p-3 rounded-xl bg-[#0F2338] border border-[#D4A24C]/30 flex items-center gap-2.5 text-[11px] text-[#D8CFB8]">
                <Lock className="w-4 h-4 text-[#D4A24C] shrink-0" />
                <span>
                  <strong>Important:</strong> Once submitted, the original complaint details
                  become permanently locked to maintain audit integrity.
                </span>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/40 text-red-300">
                  {formError}
                </div>
              )}

              {submissionSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Complaint recorded and locked successfully!
                </div>
              )}

              <form onSubmit={handleCreateComplaint} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Issue Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Drinking Water Pipeline Burst at Main Bazar"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-lg p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Type
                    </label>
                    <select
                      value={newIssueType}
                      onChange={(e) => setNewIssueType(e.target.value as any)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-lg p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                    >
                      <option value="COMPLAINT">COMPLAINT (Grievance / Broken Civic Asset)</option>
                      <option value="REQUIREMENT">REQUIREMENT (New Need / Community Proposal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-lg p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                    >
                      <option value="Water Supply">Water Supply</option>
                      <option value="Road">Road & Potholes</option>
                      <option value="Electricity">Electricity & Streetlights</option>
                      <option value="Sanitation">Sanitation & Garbage</option>
                      <option value="Drainage">Drainage & Sewage</option>
                      <option value="Healthcare">Healthcare & PHC</option>
                      <option value="Welfare">Welfare Schemes</option>
                      <option value="Revenue">Revenue & Land Issues</option>
                      <option value="Education">Schools & Education</option>
                      <option value="Other">Other Community Matter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Priority
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-lg p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT (Affecting school / hospital / safety)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Assigned Village / Ward *
                    </label>
                    <select
                      value={newVillageId}
                      onChange={(e) => setNewVillageId(e.target.value)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-lg p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                    >
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Place / Specific Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Ramalayam Temple Ward 4"
                      value={newPlaceName}
                      onChange={(e) => setNewPlaceName(e.target.value)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-lg p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Detailed Description *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe the ground situation, how many households affected, and urgency..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-lg p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Reported By (Citizen / Group Leader) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. P. Sudhakar Reddy"
                      value={newReportedBy}
                      onChange={(e) => setNewReportedBy(e.target.value)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-lg p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Citizen Contact Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98480 12345"
                      value={newReporterPhone}
                      onChange={(e) => setNewReporterPhone(e.target.value)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-lg p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                      Initial Ground Photo / Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or uploaded photo link"
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      className="w-full bg-[#071322] border border-[#22405E] rounded-lg p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#22405E]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-[#D4A24C] text-[#071322] font-semibold hover:brightness-110 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? "Submitting & Locking..." : "Submit Complaint (Locked)"}
                  </button>
                </div>
              </form>
            </div>
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
