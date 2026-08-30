import React, { useState, useEffect } from "react";
import {
  FieldIssue,
  WorkUpdateRecord,
  UserProfile,
  IssueStatus
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
  ShieldCheck,
  FileText,
  Camera,
  Send,
  Lock,
  ArrowRight,
  Sparkles
} from "lucide-react";

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

  const isVolunteer =
    currentUser.primaryRole === "VOLUNTEER" || currentUser.role === "volunteer";
  const isDirector =
    currentUser.primaryRole === "DIRECTOR" ||
    currentUser.role === "campaign_manager" ||
    currentUser.role === "party_admin";
  const isAdmin =
    currentUser.primaryRole === "ADMIN" ||
    currentUser.roleId === "SUPER_ADMIN" ||
    currentUser.roleId === "ADMIN" ||
    currentUser.role === "super_admin";

  const canUpdateWork =
    isAdmin ||
    isDirector ||
    (isVolunteer && issue.assignedVolunteerId === currentUser.id);

  useEffect(() => {
    if (isOpen && issue?.id) {
      loadTimeline();
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
        return "bg-blue-900/40 text-blue-300 border-blue-600/40";
      case "ASSIGNED":
        return "bg-indigo-900/40 text-indigo-300 border-indigo-600/40";
      case "IN_PROGRESS":
        return "bg-amber-900/40 text-amber-300 border-amber-600/40";
      case "COMPLETED":
      case "RESOLVED":
        return "bg-emerald-900/40 text-emerald-300 border-emerald-600/40";
      case "OVERDUE":
        return "bg-rose-900/50 text-rose-300 border-rose-600/50 animate-pulse";
      case "ON_HOLD":
        return "bg-zinc-800 text-zinc-300 border-zinc-600/40";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B1A2C] border border-[#D4A24C]/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#F5EFE0] animate-fadeIn">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#22405E] bg-gradient-to-r from-[#0F2338] to-[#0B1A2C] flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#122A44] text-[#D4A24C] border border-[#D4A24C]/30">
                #{issue.id}
              </span>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                  issue.status
                )}`}
              >
                {issue.status}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getPriorityBadge(
                  issue.priority
                )}`}
              >
                {issue.priority} Priority
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#1A3654] text-[#D8CFB8]">
                {issue.category}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#071322] text-[#A69B80]">
                {issue.issueType || "COMPLAINT"}
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl text-[#F5EFE0] font-normal leading-snug">
              {issue.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-[#9BA3AF] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Immutability Banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0F2338]/90 border border-[#D4A24C]/25 text-[12px] text-[#D8CFB8]">
            <Lock className="w-4 h-4 text-[#D4A24C] shrink-0" />
            <span>
              <strong className="text-[#F5EFE0]">Audit Integrity:</strong> Original
              complaint record is immutable. All field actions and progress are
              recorded sequentially in the status history timeline below.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Description & Location */}
            <div className="md:col-span-2 space-y-5">
              <div>
                <h4 className="text-[11px] uppercase tracking-widest text-[#D4A24C] font-semibold mb-2">
                  Original Complaint Description
                </h4>
                <p className="text-[13px] text-[#E2DCBE] bg-[#071322]/70 p-4 rounded-xl border border-[#22405E] leading-relaxed whitespace-pre-wrap">
                  {issue.description || "No description provided."}
                </p>
              </div>

              {/* Geographic Scope */}
              <div>
                <h4 className="text-[11px] uppercase tracking-widest text-[#D4A24C] font-semibold mb-2">
                  Geographic Location
                </h4>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="p-3 bg-[#0F2338] rounded-lg border border-[#22405E]">
                    <span className="text-[#8E9CAE] block text-[10px] uppercase">
                      Mandal
                    </span>
                    <span className="font-semibold text-[#F5EFE0]">
                      {issue.mandalName || issue.mandalId}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0F2338] rounded-lg border border-[#22405E]">
                    <span className="text-[#8E9CAE] block text-[10px] uppercase">
                      Village / Ward
                    </span>
                    <span className="font-semibold text-[#F5EFE0]">
                      {issue.villageName || issue.villageId}
                    </span>
                  </div>
                  {issue.placeName && (
                    <div className="col-span-2 p-3 bg-[#0F2338] rounded-lg border border-[#22405E] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#D4A24C]" />
                      <span className="text-[#F5EFE0]">{issue.placeName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reporter Info */}
              <div className="p-4 bg-[#0F2338] rounded-xl border border-[#22405E] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8E9CAE] block">
                    Reported By
                  </span>
                  <span className="font-semibold text-[13px] text-[#F5EFE0] flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#D4A24C]" />
                    {issue.reportedBy}
                  </span>
                </div>
                {issue.reporterPhone && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8E9CAE] block">
                      Citizen Contact
                    </span>
                    <a
                      href={`tel:${issue.reporterPhone}`}
                      className="font-mono text-[13px] text-[#D4A24C] hover:underline flex items-center gap-1.5 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {issue.reporterPhone}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8E9CAE] block">
                    Reported Date
                  </span>
                  <span className="text-[12px] text-[#E2DCBE] flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8E9CAE]" />
                    {issue.reportedDate}
                  </span>
                </div>
              </div>

              {/* Initial Photos if any */}
              {issue.attachments && issue.attachments.length > 0 && (
                <div>
                  <h4 className="text-[11px] uppercase tracking-widest text-[#D4A24C] font-semibold mb-2">
                    Original Citizen Attachments
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {issue.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative rounded-lg overflow-hidden border border-[#22405E] bg-black/40 aspect-video block"
                      >
                        <img
                          src={url}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[11px] font-medium text-white transition-opacity">
                          View Full Image
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Responsibility, Deadlines & Work Action */}
            <div className="space-y-5">
              <div className="p-4 bg-[#0F2338] rounded-xl border border-[#22405E] space-y-4">
                <h4 className="text-[11px] uppercase tracking-widest text-[#D4A24C] font-semibold">
                  Field Responsibility
                </h4>

                <div>
                  <span className="text-[10px] uppercase text-[#8E9CAE] block">
                    Responsible Volunteer
                  </span>
                  <span className="font-semibold text-[13px] text-[#F5EFE0] block mt-0.5">
                    {issue.assignedVolunteerName || "Unassigned"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-[#8E9CAE] block">
                    Supervising Director
                  </span>
                  <span className="text-[12px] text-[#D8CFB8] block mt-0.5">
                    {issue.directorName || "Constituency Director"}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#22405E]">
                  <span className="text-[10px] uppercase text-[#8E9CAE] block">
                    Target Due Date
                  </span>
                  <span
                    className={`text-[12px] font-semibold block mt-0.5 ${
                      issue.status === "OVERDUE"
                        ? "text-rose-400"
                        : "text-[#F5EFE0]"
                    }`}
                  >
                    {issue.dueDate || "No Due Date Set"}
                  </span>
                </div>

                {issue.lastStatusUpdateAt && (
                  <div className="pt-2 border-t border-[#22405E]">
                    <span className="text-[10px] uppercase text-[#8E9CAE] block">
                      Last Field Update
                    </span>
                    <span className="text-[11px] text-[#B5ADC8] block mt-0.5">
                      {new Date(issue.lastStatusUpdateAt).toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button: Update Work */}
              {canUpdateWork && (
                <button
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4A24C] to-[#B38332] text-[#071322] font-semibold text-[13px] hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Update Status & Upload Proof
                </button>
              )}
            </div>
          </div>

          {/* Chronological Status History Timeline */}
          <div className="pt-6 border-t border-[#22405E]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[13px] font-semibold text-[#F5EFE0] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4A24C]" />
                Field Activity & Status Timeline
              </h4>
              <span className="text-[11px] text-[#8E9CAE]">
                {history.length} record{history.length === 1 ? "" : "s"} logged
              </span>
            </div>

            {loadingHistory ? (
              <div className="p-8 text-center text-sm text-[#8E9CAE]">
                Loading timeline...
              </div>
            ) : history.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#071322]/50 border border-[#22405E] text-center text-sm text-[#8E9CAE]">
                No field updates recorded yet.
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#22405E]">
                {history.map((record, index) => (
                  <div key={record.id || index} className="relative pl-10">
                    <div className="absolute left-2.5 top-1.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#D4A24C] border-2 border-[#0B1A2C]" />
                    <div className="p-4 rounded-xl bg-[#0F2338] border border-[#22405E] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[13px] text-[#F5EFE0]">
                            {record.volunteerName || "Field Agent"}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                              record.newStatus
                            )}`}
                          >
                            {record.newStatus}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#8E9CAE] font-mono">
                          {record.updateDate} ·{" "}
                          {new Date(record.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>

                      <p className="text-[12px] text-[#E2DCBE] leading-relaxed">
                        {record.remarks}
                      </p>

                      {/* Photo / Document Proof Attachment */}
                      {record.attachments && record.attachments.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] uppercase text-[#8E9CAE] block mb-1">
                            Verified Ground Proof
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {record.attachments.map((attUrl, pIdx) => (
                              <a
                                key={pIdx}
                                href={attUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="relative rounded-lg overflow-hidden border border-[#D4A24C]/40 block w-28 h-20 bg-black/50"
                              >
                                <img
                                  src={attUrl}
                                  alt="Work Proof"
                                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submodal: Submit Work Update & Upload Proof */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0F2338] border border-[#D4A24C] rounded-2xl w-full max-w-lg p-6 shadow-2xl text-[#F5EFE0] space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#22405E] pb-3">
              <h3 className="font-display text-lg text-[#F5EFE0] flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#D4A24C]" />
                Update Work Status & Ground Proof
              </h3>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="text-[#9BA3AF] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-[12px] text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleWorkUpdateSubmit} className="space-y-4 text-[12px]">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                  New Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as IssueStatus)}
                  className="w-full bg-[#071322] border border-[#22405E] rounded-lg px-3 py-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                >
                  <option value="IN_PROGRESS">IN_PROGRESS (Work Active on Site)</option>
                  <option value="COMPLETED">COMPLETED (Work Finished & Verified)</option>
                  <option value="RESOLVED">RESOLVED (Complaint Addressed)</option>
                  <option value="ON_HOLD">ON_HOLD (Awaiting Department Approval)</option>
                  <option value="REJECTED">REJECTED (Invalid / Duplicate)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                  Update Date
                </label>
                <input
                  type="date"
                  value={updateDate}
                  onChange={(e) => setUpdateDate(e.target.value)}
                  className="w-full bg-[#071322] border border-[#22405E] rounded-lg px-3 py-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                  Ground Remarks / Action Taken *
                </label>
                <textarea
                  rows={3}
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  placeholder="Describe specific actions taken at site, department coordination, or completion details..."
                  className="w-full bg-[#071322] border border-[#22405E] rounded-lg p-3 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#D4A24C] font-semibold mb-1">
                  Ground Photo / Proof URL (Optional)
                </label>
                <input
                  type="url"
                  value={updateProofUrl}
                  onChange={(e) => setUpdateProofUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or uploaded photo link"
                  className="w-full bg-[#071322] border border-[#22405E] rounded-lg px-3 py-2.5 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                />
                <span className="text-[10px] text-[#8E9CAE] mt-1 block">
                  Paste high-resolution photo URL or site completion document link.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#22405E]">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="px-5 py-2 rounded-lg bg-[#D4A24C] text-[#071322] font-semibold hover:brightness-110 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingUpdate ? "Saving Update..." : "Submit Work Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
