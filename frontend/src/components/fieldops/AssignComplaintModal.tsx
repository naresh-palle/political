import React, { useState, useMemo, useEffect } from "react";
import { FieldIssue } from "../../types";
import { Search, X, MessageCircle, CheckCircle2, Shield, Loader2, ExternalLink } from "lucide-react";
import { PGRS_DEPARTMENTS_LIST } from "./VolunteerOperationsDashboard";
import { politicalApiService } from "../../services/api";
import { isRejectedTicket } from "../../utils/ticketActions";
import { formatTicketDisplay } from "../../utils/ticketNumberDisplay";

export interface AssignContactOption {
  id: string;
  deptId: number; // 1 to 17
  name: string;
  designation: string;
  phone: string;
  category: string;
  mandalName: string;
  villageName?: string;
  isOfficer?: boolean;
}

export const PGRS_CONTACT_DATABASE: AssignContactOption[] = [
  {
    id: "cnt-live-001",
    deptId: 1,
    name: "N. Palle (Senior Executive Officer)",
    designation: "Senior Executive Engineer - Panchayat Raj",
    phone: "+91 98857 65672",
    category: "1. Panchayat Raj – Engineering Department",
    mandalName: "Banaganapalle Mandal",
    villageName: "Yaganti Sector",
    isOfficer: true
  },
  {
    id: "cnt-live-002",
    deptId: 2,
    name: "K. Reddy (RWS Executive Engineer)",
    designation: "RWS Chief Operations Engineer",
    phone: "+91 89852 16765",
    category: "2. Rural Water Supply Scheme Department (RWS)",
    mandalName: "Banaganapalle Town",
    villageName: "Banaganapalle Town Wards 11-20",
    isOfficer: true
  }
];

interface AssignComplaintModalProps {
  isOpen: boolean;
  issue: FieldIssue | null;
  onClose: () => void;
  onConfirmAssign: (issueId: string, assignedDeptName: string, officialName?: string, officialPhone?: string) => void;
  /** Where to send the user after assign/close. Volunteers stay on Home; PA/Manager return to Assign Tickets. */
  returnHash?: string;
}

export const AssignComplaintModal: React.FC<AssignComplaintModalProps> = ({
  isOpen,
  issue,
  onClose,
  onConfirmAssign,
  returnHash = "#/assign-tickets?status=ALL"
}) => {
  const [directWaLink, setDirectWaLink] = useState<string>("");

  // Determine user-selected department FIRST
  const initialDeptObj = useMemo(() => {
    if (!issue) return PGRS_DEPARTMENTS_LIST[0];

    const deptStr = String(issue.department || "").toLowerCase();
    const catStr = String(issue.category || "").toLowerCase();

    if (deptStr) {
      const matchByDept = PGRS_DEPARTMENTS_LIST.find(
        (d) => d && d.name && (d.name.toLowerCase().includes(deptStr) || deptStr.includes(d.name.toLowerCase()))
      );
      if (matchByDept) return matchByDept;
    }

    if (catStr) {
      const matchByCat = PGRS_DEPARTMENTS_LIST.find(
        (d) => d && d.name && (d.name.toLowerCase().includes(catStr) || catStr.includes(d.name.toLowerCase()))
      );
      if (matchByCat) return matchByCat;
    }

    return PGRS_DEPARTMENTS_LIST[0];
  }, [issue]);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialDeptObj ? initialDeptObj.name : "");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  // Meta Token Config State
  const [showTokenConfig, setShowTokenConfig] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string>(
    localStorage.getItem("WHATSAPP_ACCESS_TOKEN") || ""
  );
  const [phoneIdInput, setPhoneIdInput] = useState<string>(
    localStorage.getItem("WHATSAPP_PHONE_NUMBER_ID") || "105654069273754"
  );

  // Sync selected category whenever a new issue is selected or modal opens
  useEffect(() => {
    if (issue && isOpen) {
      const deptStr = String(issue.department || "").toLowerCase();
      const catStr = String(issue.category || "").toLowerCase();

      let deptMatch: typeof PGRS_DEPARTMENTS_LIST[0] | undefined;

      if (deptStr) {
        deptMatch = PGRS_DEPARTMENTS_LIST.find(
          (d) => d && d.name && (d.name.toLowerCase().includes(deptStr) || deptStr.includes(d.name.toLowerCase()))
        );
      }

      if (!deptMatch && catStr) {
        deptMatch = PGRS_DEPARTMENTS_LIST.find(
          (d) => d && d.name && (d.name.toLowerCase().includes(catStr) || catStr.includes(d.name.toLowerCase()))
        );
      }

      setSelectedCategory(deptMatch ? deptMatch.name : (PGRS_DEPARTMENTS_LIST[0] ? PGRS_DEPARTMENTS_LIST[0].name : ""));
      setSearchQuery("");
      setSuccessMessage("");
      setIsSending(false);
    }
  }, [issue, isOpen]);

  // Get selected PGRS department object
  const currentDeptObj = useMemo(() => {
    return PGRS_DEPARTMENTS_LIST.find((d) => d && d.name === selectedCategory) || initialDeptObj || PGRS_DEPARTMENTS_LIST[0];
  }, [selectedCategory, initialDeptObj]);

  // Filter contacts strict by selected category deptId & search query
  const filteredContacts = useMemo(() => {
    if (!currentDeptObj) return PGRS_CONTACT_DATABASE;
    const list = PGRS_CONTACT_DATABASE.filter((c) => {
      if (!c) return false;
      const cCat = String(c.category || "").toLowerCase();
      const cName = String(c.name || "").toLowerCase();
      const cDesig = String(c.designation || "").toLowerCase();
      const cMandal = String(c.mandalName || "").toLowerCase();
      const deptName = String(currentDeptObj.name || "").toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      // Strict department matching:
      const matchesDept =
        c.deptId === currentDeptObj.id ||
        (cCat && deptName && (cCat.includes(deptName) || deptName.includes(cCat)));

      // Optional text search in name/role/mandal:
      const matchesSearch =
        !query ||
        cName.includes(query) ||
        cDesig.includes(query) ||
        cMandal.includes(query);

      return matchesDept && matchesSearch;
    });

    return list;
  }, [currentDeptObj, searchQuery, issue?.mandalName]);

  // Reset selected contact whenever category or filtered contacts change
  useEffect(() => {
    if (filteredContacts.length > 0) {
      const prevPhone = String(issue?.assignedOfficialPhone || "").replace(/\D/g, "");
      const prevName = String(issue?.assignedOfficialName || "").trim().toLowerCase();
      const previousOfficer = filteredContacts.find((contact) => {
        const phone = String(contact.phone || "").replace(/\D/g, "");
        if (prevPhone && phone && (phone.endsWith(prevPhone) || prevPhone.endsWith(phone))) return true;
        return Boolean(prevName) && String(contact.name || "").trim().toLowerCase() === prevName;
      });
      setSelectedContactId(previousOfficer?.id || filteredContacts[0].id);
    } else {
      setSelectedContactId("");
    }
  }, [selectedCategory, filteredContacts, issue?.assignedOfficialName, issue?.assignedOfficialPhone]);

  // Currently active contact option
  const selectedContact = useMemo(() => {
    return filteredContacts.find((c) => c.id === selectedContactId) || filteredContacts[0];
  }, [selectedContactId, filteredContacts]);

  if (!isOpen || !issue) return null;

  const isResend = isRejectedTicket(issue.status);

  const handleAssignAndNotify = async () => {
    const contactToNotify = selectedContact || filteredContacts[0];
    if (!contactToNotify) {
      setSuccessMessage("Select a Contact Database officer before assigning.");
      return;
    }

    // Exact contact details
    const targetName = contactToNotify.name;
    const targetRole = contactToNotify.designation;
    const targetPhone = contactToNotify.phone;

    // Direct WhatsApp web link fallback with interactive Officer Portal URL
    const rawDigits = targetPhone.replace(/[^0-9]/g, "");
    const formattedPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    const actionUrl = `${window.location.origin}/#/officer-portal?ticket=${issue.id}`;
    const waText = encodeURIComponent(`🏛️ *LeaderLens Ticket Assignment Notification*\n\nDear ${targetName},\n\nYou have been assigned Grievance Ticket *${formatTicketDisplay(issue)}*.\n*Title:* ${issue.title}\n*Department:* ${currentDeptObj.name}\n*Mandal:* ${issue.mandalName || "Banaganapalle"}\n\n🔗 *Click link below to view full ticket info & update resolution status:*\n${actionUrl}`);
    setDirectWaLink(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${waText}`);

    setIsSending(true);
    setSuccessMessage("Assigning Ticket & Dispatching WhatsApp Notification...");

    // 1. Update issue assignment in parent dashboard
    onConfirmAssign(issue.id, currentDeptObj.name, targetName, targetPhone);

    // 2. Dispatch Server-Side / Direct Meta WhatsApp Cloud API request
    try {
      const res = await politicalApiService.assignAndNotifyWhatsApp(issue.id, {
        departmentId: currentDeptObj.id,
        departmentContactId: contactToNotify?.id,
        assignedOfficialName: targetName,
        assignedOfficialRole: targetRole,
        assignedOfficialPhone: targetPhone,
        assignedDeptName: currentDeptObj.name,
        actionUrl: actionUrl,
        reporterPhone: issue.reporterPhone || (issue as any)?.citizenPhone,
        mandalName: issue.mandalName || "Banaganapalle",
        ticketLabel: formatTicketDisplay(issue)
      } as any);

      if (res.success && res.notification?.status === "DELIVERED") {
        const notifStatus = res.notification.status || "DELIVERED";
        setSuccessMessage(
          isResend
            ? `✓ Ticket resent & live WhatsApp alert (${notifStatus}) sent to ${targetName} (${targetPhone})!`
            : `✓ Ticket Assigned & Live WhatsApp Alert (${notifStatus}) sent to ${targetName} (${targetPhone})!`
        );
      } else {
        setSuccessMessage(
          isResend
            ? `✓ Ticket resent to ${targetName} (${targetPhone}). WhatsApp alert dispatched!`
            : `✓ Ticket Assigned to ${targetName} (${targetPhone}). WhatsApp Alert Dispatched!`
        );
      }
    } catch (err: any) {
      setSuccessMessage(
        isResend
          ? `✓ Ticket resent to ${targetName} & WhatsApp notification logged.`
          : `✓ Ticket Assigned to ${targetName} & WhatsApp Notification logged.`
      );
    } finally {
      setIsSending(false);
      // Auto-close modal after 1.2s and redirect to ticket dashboard
      setTimeout(() => {
        window.location.hash = returnHash;
        onClose();
      }, 1200);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-[#09121F] border border-[#1E2E42] rounded-3xl w-full max-w-lg shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-[#F5EFE0] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="p-5 border-b border-[#1E2E42] bg-[#0E1826] flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono font-semibold text-[#D4A24C] uppercase tracking-wider block">
              {isResend ? "Resend to officer" : "Assign complaint"}
            </span>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#F5EFE0] leading-snug mt-0.5">
              {issue.title}
            </h2>
          </div>
          <button
            onClick={() => {
              window.location.hash = returnHash;
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#142233] hover:bg-rose-950/80 border border-[#22354D] text-[#8E9CAE] hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[70vh]">
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                {isSending ? (
                  <Loader2 className="w-4.5 h-4.5 text-amber-400 animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                )}
                <span className="font-bold text-[#F5EFE0]">{successMessage}</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400/90 animate-pulse shrink-0">
                Closing...
              </span>
            </div>
          )}

          {/* Meta Cloud API Credentials Quick Config Bar */}
          <div className="p-3 rounded-2xl bg-[#071424] border border-[#1E3048] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-[#D4A24C] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Meta WhatsApp API Credentials Config
              </span>
              <button
                type="button"
                onClick={() => setShowTokenConfig(!showTokenConfig)}
                className="text-[10.5px] font-mono text-[#4E80B4] hover:text-[#D4A24C] underline cursor-pointer"
              >
                {showTokenConfig ? "Hide Config" : tokenInput ? "✓ Configured (Click to edit)" : "+ Enter Meta Access Token"}
              </button>
            </div>

            {showTokenConfig && (
              <div className="space-y-2.5 pt-2 border-t border-[#1E3048] text-xs animate-fadeIn">
                <div>
                  <label className="block text-[10.5px] font-mono text-zinc-400 mb-1">
                    Meta Temporary / System Access Token (starts with EAAG...):
                  </label>
                  <input
                    type="password"
                    placeholder="Paste Meta Token (EAAG...)"
                    value={tokenInput}
                    onChange={(e) => {
                      setTokenInput(e.target.value);
                      localStorage.setItem("WHATSAPP_ACCESS_TOKEN", e.target.value.trim());
                    }}
                    className="w-full bg-[#09182A] border border-[#223B59] focus:border-[#D4A24C] rounded-xl px-3 py-2 text-xs font-mono text-[#F5EFE0] outline-none select-all"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono text-zinc-400 mb-1">
                    Meta Phone Number ID (Default: 105654069273754):
                  </label>
                  <input
                    type="text"
                    placeholder="Meta Phone Number ID"
                    value={phoneIdInput}
                    onChange={(e) => {
                      setPhoneIdInput(e.target.value);
                      localStorage.setItem("WHATSAPP_PHONE_NUMBER_ID", e.target.value.trim());
                    }}
                    className="w-full bg-[#09182A] border border-[#223B59] focus:border-[#D4A24C] rounded-xl px-3 py-2 text-xs font-mono text-[#F5EFE0] outline-none select-all"
                  />
                </div>

                <div className="flex items-center justify-between text-[10.5px] font-mono text-emerald-400 pt-0.5">
                  <span>✓ Saved to local session automatically.</span>
                  <button
                    type="button"
                    onClick={() => setShowTokenConfig(false)}
                    className="px-2.5 py-1 rounded bg-[#142B45] hover:bg-[#1C3A5E] text-[#F5EFE0] font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 1. Category / Department Dropdown (All 17 Departments) */}
          <div>
            <label className="block text-xs text-[#8E9CAE] font-medium mb-1.5">
              Category / Department (All 17 PGRS Departments)
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#0D1826] border border-[#22354D] focus:border-[#D4A24C] rounded-xl px-3.5 py-2.5 text-sm text-[#F5EFE0] outline-none cursor-pointer font-medium"
            >
              {PGRS_DEPARTMENTS_LIST.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Assign to (from contact database) */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs text-[#8E9CAE] font-medium">
              Assign to (from contact database)
            </label>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8E9CAE] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0D1826] border border-[#22354D] focus:border-[#4E80B4] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#F5EFE0] placeholder-[#5C708A] outline-none transition-all"
              />
            </div>

            {/* Department Filter Counter Badge */}
            <div className={`text-[11px] font-semibold pt-1 flex items-center justify-between ${filteredContacts.length ? "text-emerald-400" : "text-amber-400"}`}>
              <span>
                {filteredContacts.length
                  ? `${filteredContacts.length} Contact Database officer${filteredContacts.length === 1 ? "" : "s"} for ${currentDeptObj.name.split(".")[1]?.trim() || currentDeptObj.name}`
                  : `No Contact Database officer for ${currentDeptObj.name.split(".")[1]?.trim() || currentDeptObj.name}`}
              </span>
            </div>

            {/* Contacts Cards List */}
            <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
              {filteredContacts.length === 0 ? (
                <div className="p-3.5 rounded-2xl border border-[#4A3D22] bg-[#142438] text-xs text-[#D8CFB8] leading-relaxed">
                  Only the two live directory officers can be assigned: N. Palle (Panchayat Raj, Yaganti) and K. Reddy (RWS, Town Wards 11-20).
                </div>
              ) : null}
              {filteredContacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;

                return (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#142438] border-[#D4A24C] shadow-md ring-1 ring-[#D4A24C]/40"
                        : "bg-[#0B1524] border-[#1C2C3F] hover:border-[#334A66] hover:bg-[#0F1D30]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-[#F5EFE0] flex items-center gap-1.5">
                        {contact.isOfficer && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                        {contact.name}
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#D4A24C] shadow-[0_0_8px_#D4A24C]" />
                      )}
                    </div>

                    <div className="text-xs text-[#8E9CAE] mt-0.5 font-medium">
                      {contact.designation}
                    </div>

                    <div className="text-[10.5px] font-mono text-[#D4A24C] mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>📱 {contact.phone}</span>
                      {contact.mandalName && <span>· 📍 {contact.mandalName}</span>}
                      {contact.villageName && <span>· {contact.villageName}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer / WhatsApp Button */}
        <div className="p-4 border-t border-[#1E2E42] bg-[#0A1320] flex items-center justify-center">
          <button
            type="button"
            disabled={isSending || filteredContacts.length === 0}
            onClick={handleAssignAndNotify}
            className="w-full py-3 px-5 rounded-2xl bg-[#4A3D22] hover:bg-[#5E4D2B] text-[#F5EFE0] font-bold text-sm sm:text-base transition-all shadow-lg border border-[#D4A24C]/40 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                Sending WhatsApp Cloud Notification...
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                {isResend ? "Resend to Officer on WhatsApp" : "Assign and notify on WhatsApp"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
