import React, { useState, useEffect } from "react";
import { FieldIssue, IssueStatus } from "../../types";
import { politicalApiService } from "../../services/api";
import { PGRS_CONTACT_DATABASE } from "./AssignComplaintModal";
import {
  ShieldCheck,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  User,
  Phone,
  FileText,
  Send,
  Upload,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X
} from "lucide-react";
import {
  defaultOfficerActionStatus,
  formatIssueStatus,
  nextOfficerActionStatuses,
  OFFICER_STATUS_OPTION_LABELS,
  OfficerActionStatus
} from "../../utils/statusLabels";
import { formatTicketDisplay } from "../../utils/ticketNumberDisplay";

export const OfficerTicketPortal: React.FC = () => {
  const [issueId, setIssueId] = useState<string>("");
  const [issue, setIssue] = useState<FieldIssue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // OTP Verification State
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [otpInput, setOtpInput] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string>("");
  const [verifying, setVerifying] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [officerInfo, setOfficerInfo] = useState<{ name: string; role: string; phone: string } | null>(null);

  // Resolution Form State
  const [newStatus, setNewStatus] = useState<IssueStatus>("IN_PROGRESS");
  const [remarks, setRemarks] = useState<string>("");
  const [proofFiles, setProofFiles] = useState<{ name: string; url: string; type: "image" | "pdf" }[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [complainantWaNote, setComplainantWaNote] = useState<string>("");
  const [complainantWaLink, setComplainantWaLink] = useState<string>("");
  const [showStatusForm, setShowStatusForm] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);

  // Parse ticket ID from URL hash or query string
  useEffect(() => {
    const parseTicketId = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      let tid = "";

      const hashMatch = hash.match(/ticket=([^&]+)/i);
      if (hashMatch && hashMatch[1]) {
        tid = decodeURIComponent(hashMatch[1]);
      } else {
        const searchMatch = search.match(/ticket=([^&]+)/i);
        if (searchMatch && searchMatch[1]) {
          tid = decodeURIComponent(searchMatch[1]);
        }
      }

      if (tid) {
        const path = (window.location.pathname || "/").replace(/\/login\/?$/i, "/");
        const canonical = `${path}#/officer-portal?ticket=${encodeURIComponent(tid)}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (current !== canonical) {
          window.history.replaceState(null, "", canonical);
        }
      }

      if (!tid) {
        tid = "iss-ll-sec-asg-01";
      }
      setIssueId(tid);
    };

    parseTicketId();
    window.addEventListener("hashchange", parseTicketId);
    return () => window.removeEventListener("hashchange", parseTicketId);
  }, []);

  // Fetch issue details
  useEffect(() => {
    if (!issueId) return;
    setLoading(true);
    setError("");

    politicalApiService
      .getFieldIssueById(issueId)
      .then((data) => {
        if (data) {
          setIssue(data);
          setNewStatus(defaultOfficerActionStatus(data.status));
        } else {
          setError("Grievance Ticket not found. Please verify the ticket link.");
        }
      })
      .catch((err) => {
        setError(err?.message || "Failed to load grievance ticket details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [issueId]);

  useEffect(() => {
    setShowStatusForm(false);
    setSubmitSuccess(false);
    setComplainantWaLink("");
    setComplainantWaNote("");
    if (!issueId) return;
    politicalApiService.getIssueHistory(issueId).then((rows) => {
      if (Array.isArray(rows)) setHistory(rows);
    }).catch(() => setHistory([]));
  }, [issueId]);

  // Resend Timer Countdown
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Validate phone number against database
  const findAuthorizedContact = (inputPhone: string) => {
    const rawDigits = inputPhone.replace(/\D/g, "").slice(-10);
    if (!rawDigits || rawDigits.length < 10) return null;

    // 1. Check ticket's explicitly assigned official phone
    if (issue?.assignedOfficialPhone) {
      const assignedDigits = issue.assignedOfficialPhone.replace(/\D/g, "").slice(-10);
      if (assignedDigits === rawDigits) {
        return {
          name: issue.assignedOfficialName || "Assigned Officer",
          role: issue.department || "Department Nodal Officer",
          phone: issue.assignedOfficialPhone
        };
      }
    }

    // 2. Check PGRS Contact Database
    const matched = PGRS_CONTACT_DATABASE.find((c) => {
      const cDigits = c.phone.replace(/\D/g, "").slice(-10);
      return cDigits === rawDigits;
    });

    if (matched) {
      return {
        name: matched.name,
        role: matched.designation || matched.category,
        phone: matched.phone
      };
    }

    // 3. Fallback demo numbers (9885765672, 9848033441, 9849244556, etc.)
    if (rawDigits === "9885765672") {
      return {
        name: "N. Palle",
        role: issue?.department || "Panchayat Raj – Engineering",
        phone: "+91 98857 65672"
      };
    }
    if (rawDigits === "8985216765") {
      return {
        name: "K. Reddy",
        role: issue?.department || "Rural Water Supply (RWS)",
        phone: "+91 89852 16765"
      };
    }

    return null;
  };

  // Request WhatsApp OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOtpMessage("");

    const cleanPhone = phoneInput.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const authContact = findAuthorizedContact(cleanPhone);
    if (!authContact) {
      setError(`⛔ Mobile number (+91 ${cleanPhone.slice(-10)}) is NOT registered in the Official Contact Database for this department. Access restricted.`);
      return;
    }

    setOfficerInfo(authContact);
    setVerifying(true);

    try {
      const res = await politicalApiService.sendWhatsAppOTP(cleanPhone, issueId);
      if (res.success) {
        setOtpSent(true);
        setOtpMessage(`✓ 6-Digit WhatsApp OTP (${res.otp || "482910"}) dispatched to +91 ${cleanPhone.slice(-10)} via WhatsApp Cloud API!`);
        setResendTimer(45);
      } else {
        setError(res.message || "Failed to send WhatsApp OTP.");
      }
    } catch (err: any) {
      setError("Error dispatching WhatsApp OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otpInput.trim() || otpInput.trim().length < 6) {
      setError("Please enter the 6-digit WhatsApp OTP code.");
      return;
    }

    setVerifying(true);
    try {
      const res = await politicalApiService.verifyWhatsAppOTP(phoneInput, otpInput.trim());
      if (res.success) {
        setIsVerified(true);
        setOtpMessage("✓ WhatsApp Identity Verified Successfully! Ticket Details Unlocked.");
      } else {
        setError(res.message || "Invalid 6-digit OTP code.");
      }
    } catch (err: any) {
      setError("Failed to verify OTP.");
    } finally {
      setVerifying(false);
    }
  };

  // Handle Multi-Photo & PDF File Upload
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
          setProofFiles((prev) => [
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
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Official Resolution Update
  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    const allowedNext = nextOfficerActionStatuses(issue?.status);
    if (!allowedNext.includes(newStatus as OfficerActionStatus)) {
      setError("This status is no longer available for this ticket. Choose the next status in the list.");
      return;
    }
    if (!remarks.trim()) {
      setError("Please enter official resolution remarks / field notes.");
      return;
    }
    if (newStatus === "REJECTED" && !remarks.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    const uploadedUrls = proofFiles.map((f) => f.url);
    const primaryProofUrl = uploadedUrls[0] || "";

    const updatePayload = {
      status: newStatus,
      remarks: remarks.trim(),
      proofUrl: primaryProofUrl,
      proofFiles: uploadedUrls,
      completedByPerson: officerInfo?.name || "Official Department Officer",
      completedDepartment: issue?.department || "Assigned Department",
      department: issue?.department,
      assignedDepartment: issue?.assignedDepartment || issue?.department,
      assignedVolunteerId: issue?.assignedVolunteerId,
      assignedVolunteerName: issue?.assignedVolunteerName,
      assignedOfficialName: officerInfo?.name || issue?.assignedOfficialName,
      assignedOfficialPhone: officerInfo?.phone || issue?.assignedOfficialPhone,
      title: issue?.title,
      description: issue?.description,
      category: issue?.category,
      reportedBy: issue?.reportedBy,
      reporterPhone: issue?.reporterPhone || (issue as any)?.citizenPhone,
      reporterType: issue?.reporterType,
      mandalName: issue?.mandalName,
      villageName: issue?.villageName,
      placeName: issue?.placeName,
      ticket: issue
        ? {
            ...issue,
            assignedOfficialName: officerInfo?.name || issue.assignedOfficialName,
            assignedOfficialPhone: officerInfo?.phone || issue.assignedOfficialPhone,
            attachments: (issue.attachments || []).filter((u) => typeof u === "string" && !u.startsWith("data:"))
          }
        : undefined,
      updatedAt: new Date().toISOString()
    };

    try {
      const result = await politicalApiService.updateFieldIssueStatus(issueId, updatePayload);
      const authoritative = result?.ticket?.status || result?.status || newStatus;
      const waStatus = result?.complainantNotification?.status;
      const waErr = result?.complainantNotification?.errorMessage;
      const waCode = String(result?.complainantNotification?.errorCode || "");
      const waLink = String(result?.complainantNotification?.clickToChatUrl || "");

      setSubmitSuccess(true);
      setIssue((prev) =>
        prev
          ? {
              ...prev,
              status: authoritative,
              lastStatusRemarks: remarks.trim(),
              lastStatusProof: primaryProofUrl,
              attachments: Array.from(new Set([...(prev.attachments || []), ...uploadedUrls]))
            }
          : prev
      );
      setComplainantWaLink(waLink);
      if (waStatus === "SENT" || waStatus === "DELIVERED") {
        setComplainantWaNote("Complainant WhatsApp sent with template complainant_status_update_v1.");
        setError("");
      } else if (waCode === "131030" || /allowed list/i.test(waErr || "")) {
        setComplainantWaNote(
          "Walk-in complainant numbers are not stored in any directory. Send the status from this ticket WhatsApp link."
        );
        setError("");
      } else {
        setComplainantWaNote(
          `Complainant WhatsApp did not send${waErr ? `: ${waErr}` : ". Check the reporter phone on this ticket."}`
        );
        setError(
          `Ticket updated and volunteer notified. Complaint WhatsApp failed${waErr ? `: ${waErr}` : "."}`
        );
      }
    } catch (err: any) {
      setError("Failed to submit resolution update: " + (err?.message || "Server connection error"));
    } finally {
      setSubmitting(false);
    }
  };

  const nextStatuses = nextOfficerActionStatuses(issue?.status);
  const statusLocked = Boolean(issue && nextStatuses.length === 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071322] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#D4A24C] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs uppercase tracking-widest text-[#D8CFB8] font-mono">
            Loading Grievance Action Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071322] text-[#F5EFE0] selection:bg-[#D4A24C] selection:text-[#071322]">
      {/* Top Banner Header */}
      <header className="border-b border-[#22405E] bg-[#0B1A2C] sticky top-0 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#142B45] border border-[#D4A24C]/40 flex items-center justify-center text-[#D4A24C] shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A24C] font-mono block">
                GOVERNMENT DEPARTMENT ACTION PORTAL · AC-140 BANAGANAPALLE
              </span>
              <h1 className="font-display text-sm sm:text-lg font-bold text-[#F5EFE0] leading-tight">
                Grievance Resolution & Field Response Portal
              </h1>
            </div>
          </div>
          {isVerified && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Officer Access
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3 animate-fadeIn shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-300">Access / Security Alert</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* STEP 1: WhatsApp OTP Verification (If not verified yet) */}
        {!isVerified ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0B1A2C] border border-[#D4A24C]/40 shadow-2xl space-y-6 animate-fadeIn">
            <div className="text-center max-w-md mx-auto space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#142B45] border border-[#D4A24C]/50 flex items-center justify-center text-[#D4A24C] mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-[#F5EFE0]">
                Official WhatsApp Identity Verification
              </h2>
              <p className="text-xs text-[#D8CFB8]">
                To view citizen grievance details and update ticket resolution status, please enter your registered 10-digit WhatsApp mobile number.
              </p>
            </div>

            {/* Ticket Preview Card */}
            {issue && (
              <div className="p-4 rounded-xl bg-[#071322] border border-[#22405E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#D4A24C] uppercase tracking-wider block mb-0.5">
                    ASSIGNED TICKET {formatTicketDisplay(issue)}
                  </span>
                  <h3 className="font-bold text-sm text-[#F5EFE0]">{issue.title}</h3>
                  <p className="text-zinc-400 text-[11px]">
                    Department: <strong className="text-zinc-200">{issue.department || issue.category}</strong> · Mandal: <strong className="text-zinc-200">{issue.mandalName}</strong>
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider self-start sm:self-center select-none ${
                  issue.priority === "URGENT" || issue.priority === "HIGH"
                    ? "bg-rose-950/80 text-rose-300 border border-rose-500/40"
                    : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                }`}>
                  Priority: {issue.priority}
                </span>
              </div>
            )}

            {/* OTP Flow Form */}
            {!otpSent ? (
              <form onSubmit={handleRequestOTP} className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#D4A24C] font-semibold mb-1.5">
                    Officer WhatsApp Mobile Number *
                  </label>
                  <div className="flex items-center">
                    <span className="px-3.5 py-2.5 bg-[#142B45] text-[#D4A24C] font-mono font-bold text-xs border border-r-0 border-[#22405E] rounded-l-xl select-none shrink-0">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="Enter 10-digit WhatsApp phone number..."
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] rounded-r-xl px-3.5 py-2.5 text-sm text-[#F5EFE0] outline-none font-mono tracking-wider"
                    />
                  </div>
                  <p className="text-[11px] text-[#B9AF95] mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4A24C]" />
                    WhatsApp OTP will be sent only to numbers registered in the Official Contact Database.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#071322] font-bold text-sm hover:brightness-110 flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Smartphone className="w-4 h-4" />
                  {verifying ? "Dispatching WhatsApp OTP..." : "Send WhatsApp OTP Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="max-w-md mx-auto space-y-4 animate-fadeIn">
                {otpMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono text-center">
                    {otpMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#D4A24C] font-semibold mb-1.5">
                    Enter 6-Digit WhatsApp OTP Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP (e.g. 482910)..."
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-[0.4em] text-[#F5EFE0] outline-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#B9AF95] mt-2">
                    <span>Sent to: +91 {phoneInput.slice(-10)}</span>
                    {resendTimer > 0 ? (
                      <span className="font-mono text-[#D4A24C]">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestOTP}
                        className="text-[#D4A24C] hover:underline font-semibold"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                  >
                    Change Number
                  </button>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#071322] font-bold text-sm hover:brightness-110 flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {verifying ? "Verifying..." : "Verify OTP & Unlock Ticket"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* STEP 2: Unlocked Officer Action Interface */
          <div className="space-y-6 animate-fadeIn">
            {/* Officer Identification Badge */}
            {officerInfo && (
              <div className="p-4 rounded-xl bg-[#0B1A2C] border border-[#D4A24C]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#142B45] border border-[#D4A24C]/40 flex items-center justify-center text-[#D4A24C] shrink-0 font-bold font-mono">
                    {officerInfo.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] font-mono block">
                      AUTHENTICATED OFFICER
                    </span>
                    <h3 className="font-bold text-sm text-[#F5EFE0]">{officerInfo.name}</h3>
                    <p className="text-xs text-zinc-400">{officerInfo.role} ({officerInfo.phone})</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  Authorized Session Active
                </div>
              </div>
            )}

            {/* Grievance Ticket Unlocked Details */}
            {issue && (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#0B1A2C] border border-[#22405E] space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22405E] pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#D4A24C] uppercase tracking-wider">
                        TICKET {formatTicketDisplay(issue)}
                      </span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-xs text-zinc-400">
                        Log Date: {issue.reportedDate || issue.createdAt?.split("T")[0]}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#F5EFE0] mt-1 leading-tight">
                      {issue.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      issue.status === "RESOLVED"
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                        : issue.status === "IN_PROGRESS"
                        ? "bg-blue-950/80 text-blue-300 border border-blue-500/40"
                        : issue.status === "REJECTED"
                        ? "bg-rose-950/80 text-rose-300 border border-rose-500/40"
                        : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                    }`}>
                      Status: {formatIssueStatus(issue.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      issue.priority === "URGENT" || issue.priority === "HIGH"
                        ? "bg-rose-950/80 text-rose-300 border border-rose-500/40"
                        : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                    }`}>
                      Priority: {issue.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-[#071322] border border-[#22405E]">
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block">Type</span>
                    <p className="font-semibold text-[#F5EFE0] mt-1">{issue.issueType === "GRIEVANCE" ? "Grievance Petition" : "Field Issue"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#071322] border border-[#22405E]">
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block">Due Date</span>
                    <p className="font-semibold text-[#F5EFE0] mt-1">{issue.dueDate || "Within 72 Hours"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#071322] border border-[#22405E]">
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block">Constituency</span>
                    <p className="font-semibold text-[#F5EFE0] mt-1 truncate">{issue.assemblyConstituencyName || "Banaganapalle AC"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#071322] border border-[#22405E]">
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block">Category</span>
                    <p className="font-semibold text-[#F5EFE0] mt-1 truncate">{issue.category || issue.department || "General"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#071322] border border-[#22405E] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block">
                      DEPARTMENT & LOCATION
                    </span>
                    <p className="font-semibold text-[#F5EFE0]">{issue.department || issue.assignedDepartment || issue.category}</p>
                    <p className="text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D4A24C]" />
                      {[issue.mandalName, issue.villageName, issue.placeName].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071322] border border-[#22405E] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block">
                      FIELD ASSIGNMENT
                    </span>
                    <p className="text-zinc-400">Volunteer: <strong className="text-[#F5EFE0]">{issue.assignedVolunteerName || "Not assigned"}</strong></p>
                    <p className="text-zinc-400">Officer: <strong className="text-[#F5EFE0]">{issue.assignedOfficialName || officerInfo?.name || "Department Officer"}</strong></p>
                    {issue.assignedVolunteerPhone ? (
                      <p className="text-zinc-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#D4A24C]" />
                        {issue.assignedVolunteerPhone}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#071322] border border-[#22405E] space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block">
                    LATEST OFFICER COMMENT
                  </span>
                  <p className="text-[#F5EFE0] leading-relaxed whitespace-pre-wrap">
                    {issue.lastStatusRemarks?.trim() || "No officer comment yet. Review the ticket below, then proceed to update status."}
                  </p>
                  {issue.lastStatusUpdateAt ? (
                    <p className="text-[11px] font-mono text-zinc-500">{String(issue.lastStatusUpdateAt).replace("T", " ").slice(0, 19)}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#071322] border border-[#22405E] space-y-3">
                    <div className="flex items-start justify-between gap-3 border-b border-[#22405E] pb-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D4A24C]">
                        Issue Scope & Ground Description
                      </h3>
                      <span className="text-[11px] text-[#8E9CAE] font-mono shrink-0 text-right">
                        {issue.assemblyConstituencyName || "Constituency"}
                      </span>
                    </div>
                    <p className="text-sm text-[#D8CFB8] leading-relaxed whitespace-pre-wrap">
                      {issue.description || "No specific detailed description recorded during ground intake."}
                    </p>
                    <div className="p-3 rounded-xl bg-[#0B1A2C] border border-[#22405E] text-xs text-[#8E9CAE] space-y-1.5">
                      <p className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#D4A24C] shrink-0 mt-0.5" />
                        <span>
                          {[issue.mandalName, issue.villageName].filter(Boolean).join(" · ") || "Location not recorded"}
                        </span>
                      </p>
                      {issue.placeName ? (
                        <p>
                          Exact Location Landmark: <strong className="text-[#F5EFE0]">{issue.placeName}</strong>
                        </p>
                      ) : null}
                      {issue.initialRemarks ? (
                        <p>
                          Ground intake notes: <strong className="text-[#F5EFE0]">{issue.initialRemarks}</strong>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#071322] border border-[#22405E] space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D4A24C] border-b border-[#22405E] pb-2">
                      Reported Person Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="min-w-0">
                        <span className="text-[#8E9CAE] block text-[10.5px] uppercase font-semibold">Reporter Name</span>
                        <strong className="text-[#F5EFE0] text-sm mt-0.5 break-words flex items-start gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#D4A24C] shrink-0 mt-0.5" />
                          <span>{issue.reportedBy || "Not recorded"}</span>
                        </strong>
                        <span className="text-[11px] text-[#D4A24C] block mt-0.5">
                          {issue.reporterType === "LEADER" ? "Party Leader" : issue.reporterType === "CADRE" ? "Party Cadre" : "Citizen"}
                          {issue.reporterDesignation ? ` · ${issue.reporterDesignation}` : ""}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[#8E9CAE] block text-[10.5px] uppercase font-semibold">Direct Phone Contact</span>
                        {issue.reporterPhone ? (
                          <a
                            href={`tel:${issue.reporterPhone}`}
                            className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-xl bg-[#0B1A2C] hover:bg-[#142B45] border border-[#D4A24C]/40 text-[#D4A24C] font-mono text-xs font-bold"
                          >
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {issue.reporterPhone}
                          </a>
                        ) : (
                          <p className="text-[#8E9CAE] mt-1">Contact provided during intake</p>
                        )}
                      </div>
                      {issue.secondaryContactName ? (
                        <div className="min-w-0">
                          <span className="text-[#8E9CAE] block text-[10.5px] uppercase font-semibold">
                            {issue.reporterType === "CITIZEN" ? "Secondary Name" : "Citizen Name"}
                          </span>
                          <strong className="text-[#F5EFE0] text-sm block mt-0.5 break-words">{issue.secondaryContactName}</strong>
                        </div>
                      ) : null}
                      {issue.secondaryContactPhone ? (
                        <div className="min-w-0">
                          <span className="text-[#8E9CAE] block text-[10.5px] uppercase font-semibold">
                            {issue.reporterType === "CITIZEN" ? "Secondary Phone" : "Citizen Phone"}
                          </span>
                          <a
                            href={`tel:${issue.secondaryContactPhone}`}
                            className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-xl bg-[#0B1A2C] hover:bg-[#142B45] border border-[#D4A24C]/40 text-[#D4A24C] font-mono text-xs font-bold"
                          >
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {issue.secondaryContactPhone}
                          </a>
                        </div>
                      ) : null}
                      {issue.citizenGender ? (
                        <div className="min-w-0">
                          <span className="text-[#8E9CAE] block text-[10.5px] uppercase font-semibold">Gender</span>
                          <strong className="text-[#F5EFE0] block mt-0.5">{issue.citizenGender}</strong>
                        </div>
                      ) : null}
                      {issue.citizenAge ? (
                        <div className="min-w-0">
                          <span className="text-[#8E9CAE] block text-[10.5px] uppercase font-semibold">Age</span>
                          <strong className="text-[#F5EFE0] block mt-0.5">{issue.citizenAge}</strong>
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        <span className="text-[#8E9CAE] block text-[10.5px] uppercase font-semibold">Reported On</span>
                        <strong className="text-[#F5EFE0] block mt-0.5">{issue.reportedDate || issue.createdAt?.split("T")[0] || "Not recorded"}</strong>
                      </div>
                      {issue.schemeSubDetail ? (
                        <div className="min-w-0">
                          <span className="text-[#8E9CAE] block text-[10.5px] uppercase font-semibold">Scheme / Sub-detail</span>
                          <strong className="text-[#F5EFE0] block mt-0.5 break-words">{issue.schemeSubDetail}</strong>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {history.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block mb-1.5">
                      TICKET TIMELINE ({history.length})
                    </span>
                    <div className="space-y-2">
                      {history.slice(-8).map((record: any) => (
                        <div key={record.id || `${record.updateDate}-${record.newStatus}`} className="p-3 rounded-xl bg-[#071322] border border-[#22405E] text-xs space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase text-[#D4A24C]">{formatIssueStatus(record.newStatus || record.status)}</span>
                            <span className="text-[11px] font-mono text-zinc-500">{record.updateDate || record.createdAt}</span>
                          </div>
                          {record.remarks ? <p className="text-[#D8CFB8] leading-relaxed">{record.remarks}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {issue.attachments && issue.attachments.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block mb-1.5">
                      ATTACHED INTAKE PROOF & DOCUMENTS ({issue.attachments.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {issue.attachments.map((att, idx) => {
                        const isPdf = String(att).toLowerCase().includes("application/pdf") || String(att).toLowerCase().includes(".pdf");
                        const isImage = String(att).startsWith("data:image") || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(String(att));
                        return (
                          <a
                            key={idx}
                            href={att}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl overflow-hidden border border-[#D4A24C]/40 bg-[#142B45] min-h-24 flex items-center justify-center"
                          >
                            {isImage && !isPdf ? (
                              <img src={att} alt={`Proof ${idx + 1}`} className="w-full h-24 object-cover" />
                            ) : (
                              <span className="flex items-center gap-2 px-3 py-2 text-xs text-[#F5EFE0]">
                                <FileText className="w-3.5 h-3.5 text-[#D4A24C]" />
                                Proof #{idx + 1}
                                <ExternalLink className="w-3 h-3 text-zinc-400" />
                              </span>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {statusLocked && !submitSuccess && (
              <div className="p-5 rounded-2xl bg-[#0B1A2C] border border-emerald-500/40 text-center space-y-2">
                <p className="text-sm font-bold text-emerald-300">
                  Status locked: {formatIssueStatus(issue?.status)}
                </p>
                <p className="text-xs text-[#D8CFB8]">
                  This ticket already has a final officer status. Reopening the same link will not offer In Progress, Resolved, or Rejected again.
                </p>
              </div>
            )}

            {!statusLocked && !showStatusForm && !submitSuccess && (
              <div className="p-5 rounded-2xl bg-[#0B1A2C] border border-[#D4A24C]/50 text-center space-y-3">
                <p className="text-xs text-[#D8CFB8]">
                  Review the full ticket above, then proceed to record the official status update.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewStatus(defaultOfficerActionStatus(issue?.status));
                    setShowStatusForm(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#071322] font-bold text-sm hover:brightness-110 inline-flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  Proceed to Status Update
                </button>
              </div>
            )}

            {((showStatusForm && !statusLocked) || submitSuccess) && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0B1A2C] border border-[#D4A24C]/50 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-[#22405E] pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#142B45] border border-[#D4A24C]/40 flex items-center justify-center text-[#D4A24C]">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#F5EFE0]">
                    Submit Official Officer Resolution Update
                  </h3>
                  <p className="text-xs text-[#B9AF95]">
                    Update the grievance status and submit field notes. Updates instantly sync back to Leaders Lens Command Center.
                  </p>
                </div>
              </div>

              {submitSuccess ? (
                <div className="p-5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs space-y-2.5 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Resolution Update Successfully Submitted & Synced!
                  </div>
                  <p>• Grievance Status updated to: <strong className="text-white">{newStatus}</strong></p>
                  <p>• Official Remarks: "{remarks}"</p>
                  <p>
                    •{" "}
                    {complainantWaNote ||
                      "Complainant WhatsApp uses template complainant_status_update_v1."}
                  </p>
                  {complainantWaLink ? (
                    <a
                      href={complainantWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4A24C] text-[#071322] text-xs font-bold cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Send complainant WhatsApp
                    </a>
                  ) : null}
                  <p className="text-[11px] text-emerald-300/80 font-mono italic">
                    ⏳ Auto-reverting to Grievance Dashboard in 3.5 seconds...
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = `#/assign-tickets?status=${newStatus}`;
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Return to Grievance Dashboard ({newStatus})
                    </button>
                    {nextStatuses.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setNewStatus(defaultOfficerActionStatus(issue?.status));
                        setSubmitSuccess(false);
                        setShowStatusForm(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 text-xs font-bold cursor-pointer"
                    >
                      Submit Follow-up Update
                    </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitResolution} className="space-y-4 text-xs">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#D4A24C] font-semibold mb-1.5">
                      Grievance Resolution Status *
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                      className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5EFE0] outline-none font-semibold cursor-pointer"
                    >
                      {nextStatuses.map((status) => (
                        <option key={status} value={status}>
                          {OFFICER_STATUS_OPTION_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    {issue?.status === "IN_PROGRESS" ? (
                      <p className="mt-1.5 text-[11px] text-[#B9AF95]">
                        In Progress is already recorded. Next choices are Resolved or Rejected.
                      </p>
                    ) : null}
                  </div>

                  {!String(issue?.reporterPhone || (issue as any)?.citizenPhone || "").replace(/\D/g, "") ? (
                    <p className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/40 rounded-xl px-3 py-2">
                      This ticket has no reporter phone, so complainant WhatsApp cannot be delivered.
                    </p>
                  ) : null}

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#D4A24C] font-semibold mb-1.5">
                      Official Officer Remarks & Action Taken Details *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe action taken, department repair unit dispatched, timeline, or completion notes..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] rounded-xl p-3 text-xs text-[#F5EFE0] outline-none leading-relaxed"
                    />
                  </div>

                  {/* Resolution Proof Multi-Photo & PDF Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-wider text-[#D4A24C] font-semibold">
                      Attach Resolution Proof Files (Photos & PDF Documents Allowed)
                    </label>
                    <div className="p-4 rounded-xl bg-[#071322] border border-[#22405E] space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <label
                          htmlFor="officer-proof-file-input"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#142B45] hover:bg-[#1C3B5E] border border-[#D4A24C]/50 text-[#D4A24C] text-xs font-bold cursor-pointer transition-all shadow-md"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Photos / PDF Reports</span>
                        </label>
                        <input
                          id="officer-proof-file-input"
                          type="file"
                          accept="image/*,.pdf,application/pdf"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        {proofFiles.length > 0 && (
                          <span className="text-xs text-emerald-400 font-mono font-semibold">
                            ✓ {proofFiles.length} file{proofFiles.length > 1 ? "s" : ""} selected
                          </span>
                        )}
                      </div>

                      {/* File Thumbnails / PDF Badges Grid */}
                      {proofFiles.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                          {proofFiles.map((file, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#D4A24C]/40 bg-[#0B1A2C] aspect-square flex flex-col items-center justify-center p-2">
                              {file.type === "pdf" ? (
                                <div className="flex flex-col items-center justify-center p-2 text-center">
                                  <FileText className="w-8 h-8 text-rose-400 mb-1" />
                                  <span className="text-[10px] text-[#F5EFE0] font-mono line-clamp-2 px-1 text-center">
                                    {file.name}
                                  </span>
                                  <span className="text-[9px] text-rose-300 font-bold uppercase tracking-wider mt-0.5">PDF Doc</span>
                                </div>
                              ) : (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                                <button
                                  type="button"
                                  onClick={() => removeProofFile(idx)}
                                  className="self-end p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-lg cursor-pointer"
                                  title="Remove file"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[9px] text-white truncate px-1 font-mono bg-black/70 rounded">
                                  {file.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#071322] font-bold text-xs sm:text-sm hover:brightness-110 flex items-center justify-center gap-2 shadow-xl cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? "Submitting Resolution Update..." : "Submit Official Resolution & Sync to Command Center"}
                  </button>
                </form>
              )}
            </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
