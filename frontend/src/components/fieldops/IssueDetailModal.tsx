import React, { useState, useEffect } from "react";
import {
  FieldIssue,
  WorkUpdateRecord,
  UserProfile,
  IssueStatus,
  NotificationAuditRecord
} from "../../types";
import { politicalApiService } from "../../services/api";
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Phone,
  Camera,
  Send,
  Paperclip,
  Eye,
  Tag,
  MessageCircle,
  RotateCw,
  ShieldCheck
} from "lucide-react";
import { AssignComplaintModal } from "./AssignComplaintModal";

interface IssueDetailModalProps {
  issue: FieldIssue;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onIssueUpdated?: () => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  currentUser,
  isOpen,
  onClose,
  onIssueUpdated
}) => {
  const [history, setHistory] = useState<WorkUpdateRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [notificationAudits, setNotificationAudits] = useState<NotificationAuditRecord[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [assignModalIssue, setAssignModalIssue] = useState<FieldIssue | null>(null);

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

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && issue?.id) {
      loadTimeline();
      loadNotificationHistory();
    }
  }, [isOpen, issue?.id]);

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

  const loadNotificationHistory = async () => {
    setLoadingAudits(true);
    try {
      const audits = await politicalApiService.getIssueNotificationHistory(issue.id);
      setNotificationAudits(audits);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudits(false);
    }
  };

  const handleRetryWhatsApp = async (auditId: string) => {
    setRetryingId(auditId);
    try {
      await politicalApiService.retryWhatsAppNotification(issue.id, auditId);
      await loadNotificationHistory();
    } catch (e) {
      console.error("Retry error:", e);
    } finally {
      setRetryingId(null);
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

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0B131E] border border-[#D4A24C]/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden text-[#F5EFE0] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#223348] bg-[#0E1724] flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#131E2D] text-[#D4A24C] border border-[#D4A24C]/30">
                #{issue.id}
              </span>
              <span
                className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  issue.issueType === "GRIEVANCE"
                    ? "bg-amber-950/70 text-amber-300 border-amber-500/40"
                    : "bg-sky-950/70 text-sky-300 border-sky-500/40"
                }`}
              >
                {issue.issueType === "GRIEVANCE" ? "Grievance Petition" : "Field Issue"}
              </span>
              <span
                className={`text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                  issue.status
                )}`}
              >
                {issue.status}
              </span>
              <span
                className={`text-[9.5px] font-semibold px-2 py-0.5 rounded border ${getPriorityBadge(
                  issue.priority
                )}`}
              >
                {issue.priority} Priority
              </span>
            </div>
            <h2 className="font-display text-lg sm:text-xl text-[#F5EFE0] font-semibold leading-snug line-clamp-2">
              {issue.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => setAssignModalIssue(issue)}
              className="px-3 py-1.5 rounded-xl bg-[#4A3D22] hover:bg-[#5E4D2B] text-[#F5EFE0] text-xs font-bold border border-[#D4A24C]/40 flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              <span className="hidden sm:inline">Assign & WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#131E2D] hover:bg-rose-950/80 border border-[#223348] hover:border-rose-500 text-[#CBD5E1] hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:px-5 bg-[#070D15] border-b border-[#223348] text-xs shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase text-[#8E9CAE] block font-semibold">Category / Dept</span>
            <span className="font-medium text-[#F5EFE0] truncate block mt-0.5">
              {issue.category} {issue.department ? `· ${issue.department.split("(")[0]}` : ""}
            </span>
          </div>

          <div className="min-w-0">
            <span className="text-[10px] uppercase text-[#8E9CAE] block font-semibold">Location</span>
            <span className="font-medium text-[#F5EFE0] truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#D4A24C] shrink-0" />
              {issue.mandalName} · {issue.villageName}
            </span>
          </div>

          <div className="min-w-0">
            <span className="text-[10px] uppercase text-[#8E9CAE] block font-semibold">Reported By</span>
            <span className="font-medium text-[#F5EFE0] truncate flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-[#D4A24C] shrink-0" />
              {issue.reportedBy}
              {issue.reporterType && (
                <span className="text-[9.5px] text-[#D4A24C]">({issue.reporterType === "LEADER" ? "Leader" : issue.reporterType === "CADRE" ? "Cadre" : "Citizen"})</span>
              )}
            </span>
          </div>

          <div className="min-w-0">
            <span className="text-[10px] uppercase text-[#8E9CAE] block font-semibold">Dates</span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono mt-0.5 truncate">
              <span className="text-[#CBD5E1]">C: {issue.reportedDate}</span>
              <span>·</span>
              <span className="text-emerald-400">
                D: {issue.completedDate || (issue.status === "COMPLETED" || issue.status === "RESOLVED" ? (issue.updatedDate || issue.reportedDate) : "In Progress")}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Column (7/12): Description, Location details, Proofs */}
            <div className="md:col-span-7 space-y-4">
              {/* Description Block */}
              <div className="p-4 rounded-xl bg-[#0E1724]/90 border border-[#223348] space-y-2">
                <span className="text-[10.5px] uppercase tracking-wider text-[#D4A24C] font-semibold block">
                  Issue Scope & Ground Description
                </span>
                <p className="text-xs text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                  {issue.description || "No detailed description provided."}
                </p>
                {issue.placeName && (
                  <div className="pt-2 border-t border-[#223348]/60 flex items-center gap-1.5 text-[11px] text-[#8E9CAE]">
                    <MapPin className="w-3.5 h-3.5 text-[#D4A24C]" />
                    <span>Landmark / Specific Spot: <strong className="text-[#F5EFE0]">{issue.placeName}</strong></span>
                  </div>
                )}
              </div>

              {/* Reporter Contact Strip */}
              {issue.reporterPhone && (
                <div className="p-3 rounded-xl bg-[#0E1724]/90 border border-[#223348] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-[#8E9CAE] block">Reporter Contact Number</span>
                    <strong className="text-[#F5EFE0]">{issue.reportedBy} ({issue.reporterDesignation || "Citizen"})</strong>
                  </div>
                  <a
                    href={`tel:${issue.reporterPhone}`}
                    className="px-3 py-1.5 rounded-lg bg-[#131E2D] hover:bg-[#1E3048] border border-[#D4A24C]/30 text-[#D4A24C] font-mono text-xs flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {issue.reporterPhone}
                  </a>
                </div>
              )}

              {/* Uploaded Photos & Proofs */}
              {issue.attachments && issue.attachments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10.5px] uppercase tracking-wider text-[#D4A24C] font-semibold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    Uploaded Proof Documents & Photos ({issue.attachments.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {issue.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative rounded-xl overflow-hidden border border-[#223348] bg-[#070D15] aspect-video block"
                      >
                        <img
                          src={url}
                          alt={`Proof ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[11px] font-semibold text-[#D4A24C] transition-opacity">
                          View Proof ↗
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (5/12): Field Responsibility & Timeline */}
            <div className="md:col-span-5 space-y-4">
              {/* Responsibility Card & Action CTA */}
              <div className="p-4 rounded-xl bg-[#0E1724]/90 border border-[#223348] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase tracking-wider text-[#D4A24C] font-semibold">
                    Field Assignment
                  </span>
                  <span className="text-[10.5px] text-[#8E9CAE] font-mono">AC-140</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E9CAE]">Field Agent:</span>
                    <strong className="text-[#F5EFE0]">{issue.assignedVolunteerName || "Demo Volunteer"}</strong>
                  </div>
                  {issue.assignedVolunteerPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E9CAE]">Agent Contact:</span>
                      <a href={`tel:${issue.assignedVolunteerPhone}`} className="text-[#D4A24C] font-mono hover:underline">
                        {issue.assignedVolunteerPhone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E9CAE]">Target Due Date:</span>
                    <span className={`font-semibold ${issue.status === "OVERDUE" ? "text-rose-400" : "text-[#F5EFE0]"}`}>
                      {issue.dueDate || "Standard (3D)"}
                    </span>
                  </div>
                </div>

                {canUpdateWork && (
                  <button
                    onClick={() => setIsUpdateModalOpen(true)}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer mt-1"
                  >
                    <Camera className="w-4 h-4" />
                    Update Status & Proof
                  </button>
                )}
              </div>

              {/* Status & Activity Timeline */}
              <div className="p-4 rounded-xl bg-[#0E1724]/90 border border-[#223348] space-y-3">
                <div className="flex items-center justify-between border-b border-[#223348]/60 pb-2">
                  <h4 className="text-xs font-semibold text-[#F5EFE0] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D4A24C]" />
                    Activity & Audit Timeline
                  </h4>
                  <span className="text-[10px] text-[#8E9CAE]">
                    {history.length} log{history.length === 1 ? "" : "s"}
                  </span>
                </div>

                {loadingHistory ? (
                  <div className="p-4 text-center text-xs text-[#8E9CAE]">Loading timeline...</div>
                ) : history.length === 0 ? (
                  <div className="p-3 rounded-lg bg-[#070D15] text-center text-xs text-[#8E9CAE]">
                    Intake recorded. No additional progress updates logged yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {history.map((record) => (
                      <div
                        key={record.id}
                        className="p-2.5 rounded-lg bg-[#0B131E] border border-[#223348] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${getStatusBadge(record.newStatus)}`}>
                            {record.newStatus}
                          </span>
                          <span className="text-[10px] text-[#8E9CAE] font-mono">{record.updateDate}</span>
                        </div>
                        <p className="text-[11px] text-[#CBD5E1] leading-relaxed">{record.remarks}</p>
                        {record.volunteerName && (
                          <div className="text-[9.5px] text-[#8E9CAE] pt-1 border-t border-[#223348]/40">
                            Logged by: <span className="text-[#D4A24C]">{record.volunteerName}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WhatsApp Notification Audit History */}
              <div className="p-4 rounded-xl bg-[#0E1724]/90 border border-[#223348] space-y-3">
                <div className="flex items-center justify-between border-b border-[#223348]/60 pb-2">
                  <h4 className="text-xs font-semibold text-[#F5EFE0] flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    WhatsApp Cloud API History
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {notificationAudits.length} sent
                  </span>
                </div>

                {loadingAudits ? (
                  <div className="p-3 text-center text-xs text-[#8E9CAE]">Loading WhatsApp history...</div>
                ) : notificationAudits.length === 0 ? (
                  <div className="p-3 rounded-lg bg-[#070D15] text-center text-xs text-[#8E9CAE]">
                    No server-side WhatsApp dispatches recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {notificationAudits.map((audit) => (
                      <div
                        key={audit.id}
                        className="p-2.5 rounded-lg bg-[#0B131E] border border-[#223348] text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-300 text-[11px] flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            {audit.officerName} ({audit.officerPhone})
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            audit.status === "DELIVERED" || audit.status === "SENT"
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                              : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                          }`}>
                            {audit.status}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-[#CBD5E1]">
                          <span className="text-[#8E9CAE]">Leader: </span>
                          <strong className="text-[#D4A24C]">{audit.leaderName}</strong>
                          <span className="text-[#8E9CAE]"> · Dept: </span>
                          <span>{audit.departmentName}</span>
                        </div>
                        {audit.status === "FAILED" && (
                          <div className="pt-1 flex items-center justify-between text-[10px]">
                            <span className="text-rose-400 truncate max-w-[170px]">{audit.errorMessage || "Dispatch failed"}</span>
                            <button
                              disabled={retryingId === audit.id}
                              onClick={() => handleRetryWhatsApp(audit.id)}
                              className="px-2 py-0.5 rounded bg-rose-900/80 hover:bg-rose-800 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <RotateCw className={`w-2.5 h-2.5 ${retryingId === audit.id ? "animate-spin" : ""}`} />
                              Retry WhatsApp
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submodal: Submit Work Update & Upload Proof */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0E1724] border border-[#D4A24C]/60 rounded-2xl w-full max-w-md p-5 shadow-2xl text-[#F5EFE0] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#223348] pb-3">
              <h3 className="font-display text-base font-semibold text-[#F5EFE0] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#D4A24C]" />
                Update Status & Proof
              </h3>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#131E2D] hover:bg-rose-950 text-[#CBD5E1] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-950/60 border border-red-500/40 rounded-lg text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleWorkUpdateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-[#BCA37F] font-semibold mb-1">
                  New Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as IssueStatus)}
                  className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-3 py-2 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                >
                  <option value="IN_PROGRESS">IN_PROGRESS (Work Active on Site)</option>
                  <option value="COMPLETED">COMPLETED (Work Finished & Verified)</option>
                  <option value="RESOLVED">RESOLVED (Complaint Addressed)</option>
                  <option value="ON_HOLD">ON_HOLD (Awaiting Department Approval)</option>
                  <option value="REJECTED">REJECTED (Invalid / Duplicate)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-[#BCA37F] font-semibold mb-1">
                  Update Date
                </label>
                <input
                  type="date"
                  value={updateDate}
                  onChange={(e) => setUpdateDate(e.target.value)}
                  className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-3 py-2 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-[#BCA37F] font-semibold mb-1">
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
                <label className="block text-[10.5px] uppercase tracking-wider text-[#BCA37F] font-semibold mb-1">
                  Photo / Proof URL (Optional)
                </label>
                <input
                  type="url"
                  value={updateProofUrl}
                  onChange={(e) => setUpdateProofUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or image URL"
                  className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-3 py-2 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#223348]">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#131E2D] text-[#CBD5E1] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingUpdate ? "Saving..." : "Submit Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Complaint & WhatsApp Modal */}
      {assignModalIssue && (
        <AssignComplaintModal
          isOpen={!!assignModalIssue}
          issue={assignModalIssue}
          onClose={() => setAssignModalIssue(null)}
          onConfirmAssign={() => {
            if (onIssueUpdated) onIssueUpdated();
          }}
        />
      )}
    </div>
  );
};
