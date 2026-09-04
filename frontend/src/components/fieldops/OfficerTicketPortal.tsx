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
  ChevronRight
} from "lucide-react";

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
  const [proofUrl, setProofUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

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

      if (!tid) {
        tid = "iss-1002";
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
          if (data.status === "RESOLVED") {
            setNewStatus("RESOLVED");
          } else if (data.status === "REJECTED") {
            setNewStatus("REJECTED");
          } else {
            setNewStatus("IN_PROGRESS");
          }
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
    if (["9885765672", "9848033441", "9849244556", "9848012345"].includes(rawDigits)) {
      return {
        name: "Senior Department Officer",
        role: issue?.department || "Nodal Department Executive",
        phone: `+91 ${rawDigits}`
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

  // Submit Official Resolution Update
  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError("Please enter official resolution remarks / field notes.");
      return;
    }

    setSubmitting(true);
    setError("");

    const updatePayload = {
      status: newStatus,
      remarks: remarks.trim(),
      proofUrl: proofUrl.trim(),
      completedByPerson: officerInfo?.name || "Official Department Officer",
      completedDepartment: issue?.department || "Assigned Department",
      updatedAt: new Date().toISOString()
    };

    try {
      await politicalApiService.updateFieldIssueStatus(issueId, updatePayload);

      await politicalApiService.createNotification({
        recipientUserId: issue?.assignedVolunteerId || "usr-demo-volunteer",
        recipientRole: "VOLUNTEER",
        type: "STATUS_UPDATE",
        title: `Officer Update: Grievance #${issueId} marked ${newStatus}`,
        message: `Officer ${officerInfo?.name || "Department Officer"} (${officerInfo?.role || "Nodal Executive"}) updated ticket #${issueId} to ${newStatus}. Remarks: "${remarks.trim()}"`,
        issueId: issueId,
        priority: newStatus === "RESOLVED" ? "HIGH" : "NORMAL"
      });

      setSubmitSuccess(true);
      setIssue((prev) => (prev ? { ...prev, status: newStatus, lastStatusRemarks: remarks.trim(), lastStatusProof: proofUrl.trim() } : prev));
    } catch (err: any) {
      setError("Failed to submit resolution update: " + (err?.message || "Server connection error"));
    } finally {
      setSubmitting(false);
    }
  };

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
                    ASSIGNED TICKET #{issue.id}
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
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22405E] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#D4A24C] uppercase tracking-wider">
                        TICKET #{issue.id}
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

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      issue.status === "RESOLVED"
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                        : issue.status === "IN_PROGRESS"
                        ? "bg-blue-950/80 text-blue-300 border border-blue-500/40"
                        : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                    }`}>
                      Status: {issue.status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#071322] border border-[#22405E] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block">
                      DEPARTMENT & LOCATION
                    </span>
                    <p className="font-semibold text-[#F5EFE0]">{issue.department || issue.category}</p>
                    <p className="text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D4A24C]" />
                      {issue.mandalName}, {issue.villageName} {issue.placeName ? `(${issue.placeName})` : ""}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071322] border border-[#22405E] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block">
                      COMPLAINANT / CITIZEN DETAILS
                    </span>
                    <p className="font-semibold text-[#F5EFE0]">{issue.reportedBy} ({issue.reporterType || "CITIZEN"})</p>
                    <p className="text-zinc-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#D4A24C]" />
                      {issue.reporterPhone || "Contact provided during intake"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block mb-1.5">
                    DETAILED DESCRIPTION OF ISSUE
                  </span>
                  <div className="p-4 rounded-xl bg-[#071322] border border-[#22405E] text-xs text-[#D8CFB8] leading-relaxed">
                    {issue.description}
                  </div>
                </div>

                {/* Attached Proof Files */}
                {issue.attachments && issue.attachments.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#D4A24C] tracking-wider block mb-1.5">
                      ATTACHED INTAKE PROOF & DOCUMENTS ({issue.attachments.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {issue.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#142B45] border border-[#D4A24C]/40 text-xs text-[#F5EFE0] hover:brightness-125 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#D4A24C]" />
                          Proof Document #{idx + 1}
                          <ExternalLink className="w-3 h-3 text-zinc-400 ml-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Officer Response / Resolution Update Form */}
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
                    Update the grievance status and submit field notes. Updates instantly sync back to Leader's Lens Command Center.
                  </p>
                </div>
              </div>

              {submitSuccess ? (
                <div className="p-5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Resolution Update Successfully Submitted & Synced!
                  </div>
                  <p>• Grievance Status updated to: <strong className="text-white">{newStatus}</strong></p>
                  <p>• Official Remarks: "{remarks}"</p>
                  <p>• Automated notification dispatched to Field Volunteer & Campaign Director.</p>
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-3 px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs font-bold cursor-pointer"
                  >
                    Submit Follow-up Update
                  </button>
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
                      <option value="IN_PROGRESS">IN_PROGRESS — Field work / team dispatched</option>
                      <option value="RESOLVED">RESOLVED — Grievance completely fixed & closed</option>
                      <option value="REJECTED">REJECTED — Invalid / Duplicate / Outside Scope</option>
                    </select>
                  </div>

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

                  {/* Resolution Proof Upload / URL */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#D4A24C] font-semibold mb-1.5">
                      Resolution Proof Photo / Work Completion Link (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="Paste image URL (e.g. https://... photo of completed work)..."
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] rounded-xl px-3.5 py-2.5 text-xs text-[#F5EFE0] outline-none"
                    />
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
          </div>
        )}
      </main>
    </div>
  );
};
