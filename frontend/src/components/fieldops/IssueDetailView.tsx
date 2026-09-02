import React, { useState, useEffect } from "react";
import {
  FieldIssue,
  WorkUpdateRecord,
  UserProfile,
  IssueStatus
} from "../../types";
import { politicalApiService } from "../../services/api";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  Phone,
  Camera,
  Send,
  Eye,
  ChevronRight,
  X
} from "lucide-react";

interface IssueDetailViewProps {
  issue: FieldIssue;
  currentUser: UserProfile;
  onBack: () => void;
  onIssueUpdated?: () => void;
}

export const IssueDetailView: React.FC<IssueDetailViewProps> = ({
  issue,
  currentUser,
  onBack,
  onIssueUpdated
}) => {
  const [history, setHistory] = useState<WorkUpdateRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Update Form State
  const [updateStatus, setUpdateStatus] = useState<IssueStatus>(
    (issue.status as IssueStatus) || "IN_PROGRESS"
  );
  const [updateRemarks, setUpdateRemarks] = useState("");
  const [updateProofUrl, setUpdateProofUrl] = useState("");
  const [updateDate, setUpdateDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (issue?.id) {
      loadTimeline();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [issue?.id]);

  const loadTimeline = async () => {
    setLoadingHistory(true);
    try {
      const records = await politicalApiService.getIssueHistory(issue.id);
      setHistory(records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleWorkUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateRemarks.trim()) {
      setErrorMsg("Please provide detailed remarks about the ground progress.");
      return;
    }

    setSubmittingUpdate(true);
    setErrorMsg("");
    try {
      const payload: Partial<WorkUpdateRecord> = {
        newStatus: updateStatus,
        remarks: updateRemarks.trim(),
        updateDate: new Date(updateDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric"
        }),
        volunteerId: currentUser.id,
        volunteerName: currentUser.name,
        attachments: updateProofUrl ? [updateProofUrl] : []
      };

      await politicalApiService.addWorkUpdate(issue.id, payload);
      setIsUpdateModalOpen(false);
      setUpdateRemarks("");
      setUpdateProofUrl("");
      await loadTimeline();
      if (onIssueUpdated) onIssueUpdated();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit work update.");
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const getTicketTimingDetails = (item: FieldIssue) => {
    const regDateRaw = item.createdAt || item.reportedDate;
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
      : item.reportedDate;

    const isClosed = item.status === "COMPLETED" || item.status === "RESOLVED";
    const closeDateRaw = item.completedDate || item.updatedDate || item.updatedAt || item.lastStatusUpdateAt;
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
        : item.completedDate || "Resolved"
      : "In Progress";

    const startTime = isValidReg ? regDateObj.getTime() : new Date(item.reportedDate).getTime();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "ASSIGNED":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "IN_PROGRESS":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "COMPLETED":
      case "RESOLVED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "OVERDUE":
      case "ESCALATED":
        return "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-600/40";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  const isVolunteer =
    currentUser.primaryRole === "VOLUNTEER" || currentUser.role === "volunteer";
  const isDirector =
    currentUser.primaryRole === "DIRECTOR" ||
    currentUser.role === "campaign_manager" ||
    currentUser.role === "party_admin";
  const isAdmin =
    currentUser.primaryRole === "SUPER_ADMIN" ||
    currentUser.primaryRole === "POLITICAL_ADMIN" ||
    currentUser.isPlatformAdmin ||
    currentUser.isPoliticalAdmin ||
    currentUser.roleId === "SUPER_ADMIN" ||
    currentUser.roleId === "ADMIN" ||
    currentUser.role === "super_admin";

  const canUpdateWork = isAdmin || isDirector || isVolunteer;

  return (
    <div className="w-full max-w-7xl mx-auto py-2 sm:py-4 space-y-4 animate-fadeIn text-[#F5EFE0]">
      {/* Navigation Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#0E1724]/85 backdrop-blur-xl border border-[#223348] shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#131E2D] hover:bg-[#1C2C42] text-[#D4A24C] hover:text-[#F5EFE0] border border-[#223348] text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Grievances</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-[#8E9CAE]">
            <span>Grievance Desk</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#D4A24C] font-mono font-bold">#{issue.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canUpdateWork && (
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] font-bold text-xs hover:brightness-110 transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Update Status & Proof</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Detail Header Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#D4A24C]/40 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-lg bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30">
              #{issue.id}
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                issue.issueType === "GRIEVANCE"
                  ? "bg-amber-950/70 text-amber-300 border-amber-500/40"
                  : "bg-sky-950/70 text-sky-300 border-sky-500/40"
              }`}
            >
              {issue.issueType === "GRIEVANCE" ? "Grievance Petition" : "Field Issue"}
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusBadge(
                issue.status
              )}`}
            >
              {issue.status}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded border ${getPriorityBadge(
                issue.priority
              )}`}
            >
              {issue.priority} Priority
            </span>
          </div>

          <div className="text-xs text-[#8E9CAE] font-mono">
            Recorded On: <strong className="text-[#F5EFE0]">{issue.reportedDate}</strong>
          </div>
        </div>

        <h1 className="font-display text-xl sm:text-2xl lg:text-3xl text-[#F5EFE0] font-semibold leading-snug">
          {issue.title}
        </h1>

        {/* Turnaround & Timestamp Intelligence Banner */}
        {(() => {
          const timing = getTicketTimingDetails(issue);
          return (
            <div className="p-4 rounded-2xl bg-[#070D15] border border-[#D4A24C]/40 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <span className="text-[10px] text-[#8E9CAE] block uppercase font-semibold">Registered Timestamp</span>
                    <strong className="text-[#F5EFE0]">{timing.registeredTimeFormatted}</strong>
                  </div>
                  <div className="border-l border-[#223348] pl-4">
                    <span className="text-[10px] text-[#8E9CAE] block uppercase font-semibold font-mono">Closing Timestamp</span>
                    {timing.isClosed ? (
                      <strong className="text-emerald-400 font-mono">{timing.closedTimeFormatted}</strong>
                    ) : (
                      <strong className="text-amber-400 font-mono">In Progress (Open)</strong>
                    )}
                  </div>
                </div>

                <div className={`px-3 py-1.5 rounded-xl font-bold tracking-wide uppercase border text-xs flex items-center gap-1.5 ${
                  timing.isClosed
                    ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                    : issue.status === "OVERDUE"
                    ? "bg-rose-950 text-rose-300 border-rose-500/40 animate-pulse"
                    : "bg-blue-950 text-blue-300 border-blue-500/40"
                }`}>
                  <span>⏱️</span>
                  <span>{timing.isClosed ? `Total Resolution Time: ${timing.durationText}` : `Time Open: ${timing.durationText}`}</span>
                </div>
              </div>

              {/* Explicit Completed/Resolved Person & Department Banner */}
              <div className="p-3 rounded-xl bg-[#0E1B2B] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏛️</span>
                  <div>
                    <span className="text-[10px] uppercase text-[#8E9CAE] block font-semibold">Assigned / Resolving Department</span>
                    <strong className="text-[#D4A24C] font-semibold text-sm">
                      {issue.completedDepartment || issue.department || "General Administration"}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-[#223348] pt-2 sm:pt-0 sm:pl-4">
                  <span className="text-base">👤</span>
                  <div>
                    <span className="text-[10px] uppercase text-[#8E9CAE] block font-semibold">
                      {timing.isClosed ? "Completed / Resolved By Person" : "Assigned Official / Agent"}
                    </span>
                    <strong className="text-[#F5EFE0] font-semibold text-sm">
                      {issue.completedByPerson || issue.assignedVolunteerName || currentUser.name}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#0B131E]/90 border border-[#223348] text-xs">
          <div className="space-y-1">
            <span className="text-[10.5px] uppercase text-[#8E9CAE] block font-semibold">Category & Dept</span>
            <span className="font-medium text-[#D4A24C] block truncate">
              {issue.department || issue.category}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10.5px] uppercase text-[#8E9CAE] block font-semibold">Mandal & Location</span>
            <span className="font-medium text-[#F5EFE0] flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
              {issue.mandalName} · {issue.villageName}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10.5px] uppercase text-[#8E9CAE] block font-semibold">Reporter Details</span>
            <span className="font-medium text-[#F5EFE0] flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
              {issue.reportedBy} ({issue.reporterType === "LEADER" ? "Leader" : issue.reporterType === "CADRE" ? "Cadre" : "Citizen"})
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10.5px] uppercase text-[#8E9CAE] block font-semibold">
              {issue.status === "COMPLETED" || issue.status === "RESOLVED" ? "Completed By Person" : "Assigned Person"}
            </span>
            <span className="font-mono text-emerald-400 flex items-center gap-1.5 font-semibold truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {issue.completedByPerson || issue.assignedVolunteerName || currentUser.name}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Executive Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7/12): Scope, Description, Proofs */}
        <div className="lg:col-span-7 space-y-5">
          {/* Ground Scope & Description */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#223348] space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#223348]/70 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D4A24C]">
                Issue Scope & Ground Description
              </h3>
              <span className="text-xs text-[#8E9CAE] font-mono">Constituency Banaganapalle</span>
            </div>

            <p className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap pt-1">
              {issue.description || "No specific detailed description recorded during ground intake."}
            </p>

            {issue.placeName && (
              <div className="p-3 rounded-xl bg-[#0B131E] border border-[#223348] flex items-center gap-2 text-xs text-[#8E9CAE] mt-3">
                <MapPin className="w-4 h-4 text-[#D4A24C] shrink-0" />
                <span>Exact Location Landmark: <strong className="text-[#F5EFE0]">{issue.placeName}</strong></span>
              </div>
            )}
          </div>

          {/* Reporter Contact & Identification */}
          <div className="p-5 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#223348] space-y-3 shadow-lg">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D4A24C] border-b border-[#223348]/70 pb-2">
              Citizen / Reporter Identification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <span className="text-[#8E9CAE] block text-[10.5px] uppercase font-semibold">Reporter Name</span>
                <strong className="text-[#F5EFE0] text-sm block mt-0.5">{issue.reportedBy}</strong>
                <span className="text-[11px] text-[#D4A24C] block mt-0.5">
                  {issue.reporterType === "LEADER" ? "Party Leader" : issue.reporterType === "CADRE" ? "Party Cadre" : "Citizen"}
                  {issue.reporterDesignation ? ` · ${issue.reporterDesignation}` : ""}
                </span>
              </div>

              {issue.reporterPhone && (
                <div>
                  <span className="text-[#8E9CAE] block text-[10.5px] uppercase font-semibold">Direct Phone Contact</span>
                  <a
                    href={`tel:${issue.reporterPhone}`}
                    className="inline-flex items-center gap-2 mt-1 px-3.5 py-1.5 rounded-xl bg-[#131E2D] hover:bg-[#1E3048] border border-[#D4A24C]/40 text-[#D4A24C] font-mono text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {issue.reporterPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Photos & Verified Proof Documents */}
          {issue.attachments && issue.attachments.length > 0 && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#223348] space-y-4 shadow-lg">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D4A24C] flex items-center gap-2 border-b border-[#223348]/70 pb-2">
                <Camera className="w-4 h-4 text-[#D4A24C]" />
                Uploaded Proof Documents & Photos ({issue.attachments.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {issue.attachments.map((url, idx) => (
                  <div
                    key={idx}
                    className="group rounded-2xl overflow-hidden border border-[#223348] bg-[#0B131E] relative aspect-video"
                  >
                    <img
                      src={url}
                      alt={`Proof Document ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-[#D4A24C] transition-opacity"
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> View Full Image
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5/12): Assignment, Resolution & History Timeline */}
        <div className="lg:col-span-5 space-y-5">
          {/* Assignment & Operational Controls */}
          <div className="p-5 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#223348] space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#223348]/70 pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D4A24C]">
                Field Squad Assignment
              </h3>
              <span className="text-xs text-emerald-400 font-semibold">Active Ticket</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[#8E9CAE]">Assigned Department:</span>
                <strong className="text-[#D4A24C] text-right truncate max-w-[200px]">
                  {issue.completedDepartment || issue.department || "General Administration"}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[#8E9CAE]">
                  {issue.status === "COMPLETED" || issue.status === "RESOLVED" ? "Completed / Resolved By:" : "Assigned Field Agent:"}
                </span>
                <strong className="text-[#F5EFE0] text-right">
                  {issue.completedByPerson || issue.assignedVolunteerName || currentUser.name}
                </strong>
              </div>

              {issue.assignedVolunteerPhone && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                  <span className="text-[#8E9CAE]">Agent Contact:</span>
                  <a href={`tel:${issue.assignedVolunteerPhone}`} className="text-[#D4A24C] font-mono font-bold hover:underline">
                    {issue.assignedVolunteerPhone}
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[#8E9CAE]">Target Due Date:</span>
                <span className={`font-semibold ${issue.status === "OVERDUE" ? "text-rose-400" : "text-[#F5EFE0]"}`}>
                  {issue.dueDate || "Within 72 Hours"}
                </span>
              </div>
            </div>

            {canUpdateWork && (
              <button
                onClick={() => setIsUpdateModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2"
              >
                <Camera className="w-4 h-4" />
                <span>Update Status & Upload Proof</span>
              </button>
            )}
          </div>

          {/* Chronological Audit & Activity Timeline */}
          <div className="p-5 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#223348] space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#223348]/70 pb-2">
              <h3 className="text-sm font-semibold text-[#F5EFE0] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4A24C]" />
                Audit & Activity Timeline
              </h3>
              <span className="text-xs text-[#8E9CAE] font-mono">
                {history.length} record{history.length === 1 ? "" : "s"}
              </span>
            </div>

            {loadingHistory ? (
              <div className="p-6 text-center text-xs text-[#8E9CAE]">Loading timeline updates...</div>
            ) : history.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#0B131E] text-center text-xs text-[#8E9CAE] border border-[#223348]">
                Intake registered on {issue.reportedDate}. No additional ground actions logged yet.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-xl bg-[#0B131E] border border-[#223348] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getStatusBadge(record.newStatus)}`}>
                        {record.newStatus}
                      </span>
                      <span className="text-[11px] text-[#8E9CAE] font-mono">{record.updateDate}</span>
                    </div>

                    <p className="text-xs text-[#CBD5E1] leading-relaxed">{record.remarks}</p>

                    {record.volunteerName && (
                      <div className="text-[10px] text-[#8E9CAE] pt-1.5 border-t border-[#223348]/60">
                        Logged by: <span className="text-[#D4A24C] font-semibold">{record.volunteerName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submodal: Submit Work Update & Upload Proof */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0E1724] border border-[#D4A24C]/60 rounded-2xl w-full max-w-md p-6 shadow-2xl text-[#F5EFE0] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#223348] pb-3">
              <h3 className="font-display text-base font-semibold text-[#F5EFE0] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#D4A24C]" />
                Update Work Status & Ground Proof
              </h3>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#131E2D] hover:bg-rose-950 text-[#CBD5E1] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleWorkUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#BCA37F] font-semibold mb-1">
                  New Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as IssueStatus)}
                  className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-3 py-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                >
                  <option value="IN_PROGRESS">IN_PROGRESS (Work Active on Site)</option>
                  <option value="COMPLETED">COMPLETED (Work Finished & Verified)</option>
                  <option value="RESOLVED">RESOLVED (Complaint Addressed)</option>
                  <option value="ON_HOLD">ON_HOLD (Awaiting Department Approval)</option>
                  <option value="REJECTED">REJECTED (Invalid / Duplicate)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#BCA37F] font-semibold mb-1">
                  Update Date
                </label>
                <input
                  type="date"
                  value={updateDate}
                  onChange={(e) => setUpdateDate(e.target.value)}
                  className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-3 py-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#BCA37F] font-semibold mb-1">
                  Ground Remarks / Action Taken *
                </label>
                <textarea
                  rows={3}
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  placeholder="Describe actions taken, coordination, or site completion notes..."
                  className="w-full bg-[#0B131E] border border-[#223348] rounded-xl p-3 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#BCA37F] font-semibold mb-1">
                  Photo / Proof Document URL (Optional)
                </label>
                <input
                  type="url"
                  value={updateProofUrl}
                  onChange={(e) => setUpdateProofUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or image URL"
                  className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-3 py-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#223348]">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#131E2D] text-[#CBD5E1] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingUpdate ? "Saving..." : "Submit Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
