import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FieldIssue,
  WorkUpdateRecord,
  UserProfile,
  IssueStatus
} from "../../types";
import { politicalApiService } from "../../services/api";
import { formatIssueStatus } from "../../utils/statusLabels";
import { formatTicketDisplay } from "../../utils/ticketNumberDisplay";
import {
  ArrowLeft,
  Clock,
  Phone,
  Camera,
  Send,
  Eye,
  X,
  MessageCircle,
  Upload,
  FileText
} from "lucide-react";
import { AssignComplaintModal } from "./AssignComplaintModal";
import { canVolunteerAssignOrResend, isRejectedTicket, isTicketOpenForAssign } from "../../utils/ticketActions";
import { exportTicketPdf, TicketPdfLang } from "../../utils/exportTicketPdf";
import { ExportPdfLangButtons } from "./ExportPdfLangButtons";

const CHIP =
  "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-[#D4A24C]/35 bg-[#0B131E] text-[#D4A24C]";
const SECTION = "p-4 rounded-xl bg-[#0E1724] border border-[#223348] space-y-2";
const BTN =
  "h-9 px-3 rounded-lg bg-[#131E2D] hover:bg-[#1C2C42] text-[#D4A24C] border border-[#223348] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer";

const DetailField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <span className="text-[10px] uppercase tracking-wider text-[#8E9CAE] font-semibold block">{label}</span>
    <div className="text-sm text-[#F5EFE0] mt-0.5 break-words">{children}</div>
  </div>
);

interface IssueDetailViewProps {
  issue: FieldIssue;
  currentUser: UserProfile;
  onBack: () => void;
  onIssueUpdated?: () => void;
}

export const IssueDetailView: React.FC<IssueDetailViewProps> = ({
  issue: issueProp,
  currentUser,
  onBack,
  onIssueUpdated
}) => {
  const [history, setHistory] = useState<WorkUpdateRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Update Form State
  const [updateStatus, setUpdateStatus] = useState<IssueStatus>(
    (issueProp.status as IssueStatus) || "IN_PROGRESS"
  );
  const [updateRemarks, setUpdateRemarks] = useState("");
  const [updateProofFiles, setUpdateProofFiles] = useState<{ name: string; url: string; type: "image" | "pdf" }[]>([]);
  const [updateDate, setUpdateDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [exportingPdf, setExportingPdf] = useState<TicketPdfLang | null>(null);
  const [liveIssue, setLiveIssue] = useState<FieldIssue>(issueProp);
  const issue = liveIssue;

  useEffect(() => {
    setLiveIssue(issueProp);
    let cancelled = false;
    const loadLive = async () => {
      try {
        const fresh = await politicalApiService.getFieldIssueById(
          issueProp.id,
          currentUser.id,
          currentUser.primaryRole
        );
        if (!cancelled && fresh) {
          setLiveIssue({ ...issueProp, ...fresh, status: fresh.status || issueProp.status });
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadLive();
    return () => {
      cancelled = true;
    };
  }, [issueProp.id, issueProp.status, issueProp.updatedAt, issueProp.lastStatusRemarks]);

  useEffect(() => {
    if (!isUpdateModalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isUpdateModalOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is larger than 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
          setUpdateProofFiles((prev) => [
            ...prev,
            {
              name: file.name,
              url: event.target?.result as string,
              type: isPdf ? "pdf" : "image"
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeProofFile = (index: number) => {
    setUpdateProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (issue?.id) {
      loadTimeline();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [issue?.id, issue?.status, issue?.updatedAt]);

  const loadTimeline = async () => {
    setLoadingHistory(true);
    try {
      const records = await politicalApiService.getIssueHistory(issueProp.id);
      const list = Array.isArray(records) ? records : [];
      const remarks = (liveIssue.lastStatusRemarks || issueProp.lastStatusRemarks || "").trim();
      const status = liveIssue.status || issueProp.status;
      const alreadyHasRemarks = list.some(
        (r: WorkUpdateRecord) => (r.remarks || "").trim() === remarks && remarks.length > 0
      );
      if (remarks && !alreadyHasRemarks && ["IN_PROGRESS", "RESOLVED", "REJECTED", "ASSIGNED"].includes(String(status).toUpperCase())) {
        list.push({
          id: `officer-${issueProp.id}-${status}`,
          issueId: issueProp.id,
          volunteerId: "dept-officer",
          volunteerName: liveIssue.completedByPerson || liveIssue.assignedOfficialName || "Department Officer",
          previousStatus: "ASSIGNED",
          newStatus: status,
          updateDate: (liveIssue.lastStatusUpdateAt || liveIssue.updatedAt || "").slice(0, 10),
          remarks,
          attachments: [],
          createdAt: liveIssue.lastStatusUpdateAt || liveIssue.updatedAt || new Date().toISOString()
        } as WorkUpdateRecord);
      }
      setHistory(list);
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
        attachments: updateProofFiles.map((f) => f.url)
      };

      await politicalApiService.addWorkUpdate(issue.id, payload);
      setIsUpdateModalOpen(false);
      setUpdateRemarks("");
      setUpdateProofFiles([]);
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

  const reporterKind =
    issue.reporterType === "LEADER" ? "Leader" : issue.reporterType === "CADRE" ? "Cadre" : "Citizen";
  const timing = getTicketTimingDetails(issue);
  const isVolunteer =
    currentUser.primaryRole === "VOLUNTEER" || currentUser.role === "volunteer";
  const assignedAgentName =
    issue.assignedVolunteerName && !["Demo Volunteer", "Demo Volunteer (Field Agent)"].includes(issue.assignedVolunteerName)
      ? issue.assignedVolunteerName
      : currentUser.name;
  const assignedOfficialDisplay =
    issue.completedByPerson || issue.assignedOfficialName || "";
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
  const canAssign =
    ((isAdmin || isDirector) && isTicketOpenForAssign(liveIssue.status)) ||
    (isVolunteer && canVolunteerAssignOrResend(liveIssue.status));
  const canUpdateProof = isAdmin || isDirector;

  const handleExportPdf = async (lang: TicketPdfLang) => {
    setExportingPdf(lang);
    try {
      await exportTicketPdf(issue, history, lang);
    } finally {
      setExportingPdf(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3 animate-fadeIn text-[#F5EFE0]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onBack} className={BTN}>
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Grievances</span>
          </button>
          <span className="text-xs text-[#8E9CAE] font-mono">{formatTicketDisplay(issue)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportPdfLangButtons onExport={handleExportPdf} exporting={exportingPdf} />
          {canAssign && (
            <button type="button" onClick={() => setIsAssignModalOpen(true)} className={BTN}>
              <MessageCircle className="w-4 h-4" />
              <span>
                {isVolunteer && isRejectedTicket(liveIssue.status)
                  ? "Resend to Officer via WhatsApp"
                  : "Assign & Notify via WhatsApp"}
              </span>
            </button>
          )}
          {canUpdateProof && (
            <button type="button" onClick={() => setIsUpdateModalOpen(true)} className={BTN}>
              <Camera className="w-4 h-4" />
              <span>Update Status & Proof</span>
            </button>
          )}
        </div>
      </div>

      <div className={SECTION}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={CHIP}>{formatTicketDisplay(issue)}</span>
          <span className={CHIP}>{issue.issueType === "GRIEVANCE" ? "Grievance Petition" : "Field Issue"}</span>
          <span className={CHIP}>{formatIssueStatus(issue.status)}</span>
          <span className={CHIP}>{issue.priority} Priority</span>
          <span className="text-xs text-[#8E9CAE] font-mono ml-auto">Recorded On: {issue.reportedDate}</span>
        </div>
        <h1 className="font-display text-xl sm:text-2xl text-[#F5EFE0] font-semibold leading-snug">{issue.title}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
          <DetailField label="Registered Timestamp">{timing.registeredTimeFormatted}</DetailField>
          <DetailField label="Closing Timestamp">
            {timing.isClosed ? timing.closedTimeFormatted : formatIssueStatus(issue.status) || "Open"}
          </DetailField>
          <DetailField label={timing.isClosed ? "Total Resolution Time" : "Time Open"}>{timing.durationText}</DetailField>
          <DetailField label="Category & Dept">{issue.department || issue.category}</DetailField>
          <DetailField label="Mandal & Location">
            {issue.mandalName} · {issue.villageName}
          </DetailField>
          <DetailField label="Reporter Details">
            {issue.reportedBy} ({reporterKind}
            {issue.citizenAge ? ` · ${issue.citizenAge}` : ""}
            {issue.citizenGender ? ` · ${issue.citizenGender}` : ""})
          </DetailField>
          <DetailField label={timing.isClosed ? "Completed / Resolved By Person" : "Assigned Official"}>
            {assignedOfficialDisplay || "Unassigned"}
            {issue.assignedOfficialPhone ? (
              <span className="block font-mono text-xs text-[#D4A24C]">{issue.assignedOfficialPhone}</span>
            ) : null}
          </DetailField>
          <DetailField label="Assigned / Resolving Department">
            {issue.completedDepartment || issue.department || "General Administration"}
          </DetailField>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#8E9CAE] font-semibold block">
            Officer status comment · {formatIssueStatus(issue.status)}
          </span>
          <p className="text-sm text-[#F5EFE0] leading-relaxed whitespace-pre-wrap break-words mt-0.5">
            {issue.lastStatusRemarks?.trim()
              || (issue as any).rejectionReason
              || "Waiting for the department officer to add a status comment."}
          </p>
          {issue.lastStatusUpdateAt ? (
            <span className="text-[11px] font-mono text-[#8E9CAE] block mt-1">
              Last officer update: {issue.lastStatusUpdateAt.replace("T", " ").slice(0, 19)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={SECTION}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#D4A24C]">Issue Scope & Ground Description</h3>
            <span className="text-xs text-[#8E9CAE] font-mono shrink-0 text-right">
              {issue.assemblyConstituencyName || issue.parliamentConstituencyName || "Constituency Banaganapalle"}
            </span>
          </div>
          <p className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
            {issue.description || "No specific detailed description recorded during ground intake."}
          </p>
          {issue.schemeSubDetail ? (
            <p className="text-xs text-[#8E9CAE]">
              Scheme / Work: <span className="text-[#F5EFE0]">{issue.schemeSubDetail}</span>
            </p>
          ) : null}
          {issue.placeName ? (
            <p className="text-xs text-[#8E9CAE]">
              Exact Location Landmark: <strong className="text-[#F5EFE0] font-medium">{issue.placeName}</strong>
            </p>
          ) : null}
          {issue.initialRemarks ? (
            <p className="text-xs text-[#8E9CAE]">
              Ground intake notes: <strong className="text-[#F5EFE0] font-medium">{issue.initialRemarks}</strong>
            </p>
          ) : null}
        </div>

        <div className={SECTION}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#D4A24C]">Field Squad Assignment</h3>
            <span className="text-xs text-[#8E9CAE] shrink-0">Active Ticket</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <DetailField label="Assigned Department">
              {issue.completedDepartment || issue.department || "General Administration"}
            </DetailField>
            <DetailField label={issue.status === "COMPLETED" || issue.status === "RESOLVED" ? "Completed / Resolved By" : "Assigned Official"}>
              {assignedOfficialDisplay || "Unassigned"}
            </DetailField>
            {issue.assignedOfficialPhone ? (
              <DetailField label="Official Contact">
                <a href={`tel:${issue.assignedOfficialPhone}`} className="font-mono text-[#D4A24C] hover:underline">
                  {issue.assignedOfficialPhone}
                </a>
              </DetailField>
            ) : null}
            <DetailField label="Field Volunteer">{assignedAgentName}</DetailField>
            {issue.assignedVolunteerPhone ? (
              <DetailField label="Volunteer Contact">
                <a href={`tel:${issue.assignedVolunteerPhone}`} className="font-mono text-[#D4A24C] hover:underline">
                  {issue.assignedVolunteerPhone}
                </a>
              </DetailField>
            ) : null}
            <DetailField label="Target Due Date">{issue.dueDate || "Within 72 Hours"}</DetailField>
          </div>
          {canUpdateProof ? (
            <button type="button" onClick={() => setIsUpdateModalOpen(true)} className={`${BTN} w-full justify-center`}>
              <Camera className="w-4 h-4" />
              <span>Update Status & Upload Proof</span>
            </button>
          ) : null}
        </div>

        <div className={SECTION}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#D4A24C]">Citizen / Reporter Identification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <DetailField label="Reporter Name">
              {issue.reportedBy}
              <span className="block text-xs text-[#D4A24C] mt-0.5">
                {issue.reporterType === "LEADER" ? "Party Leader" : issue.reporterType === "CADRE" ? "Party Cadre" : "Citizen"}
                {issue.reporterDesignation ? ` · ${issue.reporterDesignation}` : ""}
              </span>
            </DetailField>
            {issue.citizenGender ? <DetailField label="Gender">{issue.citizenGender}</DetailField> : null}
            {issue.citizenAge ? <DetailField label="Age">{issue.citizenAge}</DetailField> : null}
            {issue.reporterPhone ? (
              <DetailField label="Direct Phone Contact">
                <a href={`tel:${issue.reporterPhone}`} className="inline-flex items-center gap-1.5 font-mono text-[#D4A24C] hover:underline">
                  <Phone className="w-3.5 h-3.5" />
                  {issue.reporterPhone}
                </a>
              </DetailField>
            ) : null}
            {issue.secondaryContactName ? (
              <DetailField label={issue.reporterType === "CITIZEN" ? "Secondary Name" : "Citizen Name"}>
                {issue.secondaryContactName}
              </DetailField>
            ) : null}
            {issue.secondaryContactPhone ? (
              <DetailField label={issue.reporterType === "CITIZEN" ? "Secondary Phone" : "Citizen Phone"}>
                <a href={`tel:${issue.secondaryContactPhone}`} className="inline-flex items-center gap-1.5 font-mono text-[#D4A24C] hover:underline">
                  <Phone className="w-3.5 h-3.5" />
                  {issue.secondaryContactPhone}
                </a>
              </DetailField>
            ) : null}
          </div>
        </div>

        <div className={SECTION}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#D4A24C] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Audit & Activity Timeline
            </h3>
            <span className="text-xs text-[#8E9CAE] font-mono">
              {loadingHistory ? "Loading…" : `${history.length} record${history.length === 1 ? "" : "s"}`}
            </span>
          </div>
          {loadingHistory ? (
            <p className="text-xs text-[#8E9CAE]">Loading timeline updates...</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-[#8E9CAE]">
              Intake registered on {issue.reportedDate}. No additional ground actions logged yet.
            </p>
          ) : (
            <div className={`space-y-2 ${history.length > 6 ? "max-h-[50vh] overflow-y-auto pr-1" : ""}`}>
              {history.map((record) => (
                <div key={record.id} className="text-xs space-y-1 py-2 border-t border-[#223348] first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={CHIP}>{formatIssueStatus(record.newStatus)}</span>
                    <span className="text-[11px] text-[#8E9CAE] font-mono">{record.updateDate}</span>
                  </div>
                  <p className="text-[#CBD5E1] leading-relaxed">{record.remarks}</p>
                  {record.volunteerName ? (
                    <p className="text-[10px] text-[#8E9CAE]">
                      Logged by: <span className="text-[#D4A24C] font-semibold">{record.volunteerName}</span>
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {issue.attachments && issue.attachments.length > 0 && (
        <div className="p-4 rounded-xl bg-[#0E1724] border border-[#223348] space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#D4A24C] flex items-center gap-2">
            <Camera className="w-4 h-4" />
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

      {/* Submodal: Submit Work Update & Upload Proof */}
      {isUpdateModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[400000] flex items-center justify-center p-3 sm:p-4 bg-[#071322]/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsUpdateModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden bg-[#0E1724] border border-[#D4A24C]/60 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] text-[#F5EFE0] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#223348] bg-[#071322]/60">
              <h3 className="min-w-0 font-display text-base font-semibold text-[#F5EFE0] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#D4A24C] shrink-0" />
                <span className="truncate">Update Work Status & Ground Proof</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="w-8 h-8 shrink-0 rounded-xl bg-[#131E2D] hover:bg-rose-950 text-[#CBD5E1] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWorkUpdateSubmit} className="flex min-h-0 flex-1 flex-col text-xs">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {errorMsg && (
                  <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300">
                    {errorMsg}
                  </div>
                )}

                <div className="min-w-0">
                  <label className="block text-[11px] uppercase tracking-wider text-[#BCA37F] font-semibold mb-1">
                    New Status
                  </label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value as IssueStatus)}
                    className="w-full min-w-0 h-10 bg-[#0B131E] border border-[#223348] rounded-xl px-3 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                  >
                    <option value="IN_PROGRESS">IN_PROGRESS (Work Active on Site)</option>
                    <option value="COMPLETED">COMPLETED (Work Finished & Verified)</option>
                    <option value="RESOLVED">RESOLVED (Complaint Addressed)</option>
                    <option value="ON_HOLD">ON_HOLD (Awaiting Department Approval)</option>
                    <option value="REJECTED">REJECTED (Invalid / Duplicate)</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] uppercase tracking-wider text-[#BCA37F] font-semibold mb-1">
                    Update Date
                  </label>
                  <input
                    type="date"
                    value={updateDate}
                    onChange={(e) => setUpdateDate(e.target.value)}
                    className="w-full min-w-0 h-10 bg-[#0B131E] border border-[#223348] rounded-xl px-3 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] uppercase tracking-wider text-[#BCA37F] font-semibold mb-1">
                    Ground Remarks / Action Taken *
                  </label>
                  <textarea
                    rows={3}
                    value={updateRemarks}
                    onChange={(e) => setUpdateRemarks(e.target.value)}
                    placeholder="Describe actions taken, coordination, or site completion notes..."
                    className="w-full min-w-0 bg-[#0B131E] border border-[#223348] rounded-xl p-3 text-[#F5EFE0] focus:border-[#D4A24C] focus:outline-none leading-relaxed resize-y"
                  />
                </div>

                <div className="min-w-0 space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-[#BCA37F] font-semibold">
                    Proof Attachments (Photos & PDF Documents)
                  </label>
                  <div className="p-3.5 rounded-xl bg-[#0B131E] border border-[#223348] space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="issue-detail-file-input"
                        className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-[#142B45] hover:bg-[#1C3B5E] border border-[#D4A24C]/40 text-[#D4A24C] text-xs font-bold cursor-pointer transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select Photos / PDFs</span>
                      </label>
                      <input
                        id="issue-detail-file-input"
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {updateProofFiles.length > 0 && (
                        <span className="text-xs text-emerald-400 font-mono font-semibold">
                          ✓ {updateProofFiles.length} file{updateProofFiles.length > 1 ? "s" : ""} selected
                        </span>
                      )}
                    </div>

                    {updateProofFiles.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {updateProofFiles.map((file, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#223348] bg-[#071322] aspect-square flex flex-col items-center justify-center p-1">
                            {file.type === "pdf" ? (
                              <div className="flex flex-col items-center justify-center text-center p-1">
                                <FileText className="w-6 h-6 text-rose-400 mb-0.5" />
                                <span className="text-[9px] text-[#F5EFE0] line-clamp-1 font-mono">{file.name}</span>
                              </div>
                            ) : (
                              <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                            )}
                            <button
                              type="button"
                              onClick={() => removeProofFile(idx)}
                              className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-[#223348] bg-[#071322]/40">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="h-10 px-4 rounded-xl bg-[#131E2D] text-[#CBD5E1] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingUpdate ? "Saving..." : "Submit Update"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Assign Complaint & WhatsApp Modal */}
      <AssignComplaintModal
        isOpen={isAssignModalOpen}
        issue={liveIssue}
        onClose={() => setIsAssignModalOpen(false)}
        onConfirmAssign={() => {
          if (onIssueUpdated) onIssueUpdated();
        }}
      />
    </div>
  );
};
