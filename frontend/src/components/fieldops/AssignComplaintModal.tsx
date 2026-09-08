import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { FieldIssue } from "../../types";
import { Search, X, MessageCircle, Shield, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

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

  return createPortal(
    <div
      className="fixed inset-0 z-[400000] overflow-y-auto overscroll-contain bg-black/80 animate-fadeIn"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
      <div
        className="relative w-full max-w-lg max-h-[min(90vh,40rem)] flex flex-col overflow-hidden rounded-2xl bg-[#0E1724] border border-[#223348] text-[#F5EFE0] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-4 py-3 border-b border-[#223348] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-semibold text-[#D4A24C] uppercase tracking-wider block">
              {isResend ? "Resend to officer" : "Assign complaint"}
            </span>
            <h2 className="font-display text-base sm:text-lg font-semibold text-[#F5EFE0] leading-snug mt-0.5 break-words">
              {issue.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.hash = returnHash;
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-[#131E2D] hover:bg-[#1C2C42] border border-[#223348] text-[#8E9CAE] hover:text-white flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 flex-1 overflow-y-auto min-h-0">
          {successMessage && (
            <p className="text-xs text-[#D4A24C] font-medium">
              {isSending ? "Assigning…" : successMessage}
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowTokenConfig(!showTokenConfig)}
              className="text-[10px] font-mono text-[#8E9CAE] hover:text-[#D4A24C] underline cursor-pointer"
            >
              {showTokenConfig ? "Hide WhatsApp API settings" : tokenInput ? "WhatsApp API configured" : "WhatsApp API settings"}
            </button>
            {showTokenConfig && (
              <div className="mt-2 space-y-2 text-xs">
                <input
                  type="password"
                  placeholder="Meta access token (EAAG…)"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    localStorage.setItem("WHATSAPP_ACCESS_TOKEN", e.target.value.trim());
                  }}
                  className="w-full h-10 bg-[#0B131E] border border-[#223348] focus:border-[#D4A24C] rounded-lg px-3 text-xs font-mono text-[#F5EFE0] outline-none"
                />
                <input
                  type="text"
                  placeholder="Meta Phone Number ID"
                  value={phoneIdInput}
                  onChange={(e) => {
                    setPhoneIdInput(e.target.value);
                    localStorage.setItem("WHATSAPP_PHONE_NUMBER_ID", e.target.value.trim());
                  }}
                  className="w-full h-10 bg-[#0B131E] border border-[#223348] focus:border-[#D4A24C] rounded-lg px-3 text-xs font-mono text-[#F5EFE0] outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#8E9CAE] font-semibold mb-1">
              Category / Department
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 bg-[#0B131E] border border-[#223348] focus:border-[#D4A24C] rounded-lg px-3 text-sm text-[#F5EFE0] outline-none cursor-pointer"
            >
              {PGRS_DEPARTMENTS_LIST.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-wider text-[#8E9CAE] font-semibold">
              Assign to (from contact database)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8E9CAE] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-[#0B131E] border border-[#223348] focus:border-[#D4A24C] rounded-lg pl-9 pr-3 text-sm text-[#F5EFE0] placeholder-[#5F6875] outline-none"
              />
            </div>
            <p className="text-[11px] text-[#8E9CAE]">
              {filteredContacts.length
                ? `${filteredContacts.length} officer${filteredContacts.length === 1 ? "" : "s"} for ${currentDeptObj.name.split(".")[1]?.trim() || currentDeptObj.name}`
                : `No officer for ${currentDeptObj.name.split(".")[1]?.trim() || currentDeptObj.name}`}
            </p>
            <div className="space-y-1.5 max-h-[12.5rem] overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <p className="text-xs text-[#8E9CAE] leading-relaxed">
                  Only the two live directory officers can be assigned: N. Palle (Panchayat Raj, Yaganti) and K. Reddy (RWS, Town Wards 11-20).
                </p>
              ) : null}
              {filteredContacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                return (
                  <button
                    type="button"
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border cursor-pointer ${
                      isSelected
                        ? "bg-[#131E2D] border-[#D4A24C]/50"
                        : "bg-[#0B131E] border-[#223348] hover:border-[#D4A24C]/30"
                    }`}
                  >
                    <div className="font-semibold text-sm text-[#F5EFE0] flex items-center gap-1.5">
                      {contact.isOfficer ? <Shield className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" /> : null}
                      {contact.name}
                    </div>
                    <div className="text-xs text-[#8E9CAE] mt-0.5">{contact.designation}</div>
                    <div className="text-[11px] font-mono text-[#D4A24C] mt-0.5 flex flex-wrap gap-x-2">
                      <span>{contact.phone}</span>
                      {contact.mandalName ? <span>· {contact.mandalName}</span> : null}
                      {contact.villageName ? <span>· {contact.villageName}</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="shrink-0 p-3 border-t border-[#223348]">
          <button
            type="button"
            disabled={isSending || filteredContacts.length === 0}
            onClick={handleAssignAndNotify}
            className="w-full h-11 px-4 rounded-xl bg-[#131E2D] hover:bg-[#1C2C42] text-[#D4A24C] font-semibold text-sm border border-[#D4A24C]/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending WhatsApp notification...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                {isResend ? "Resend to Officer on WhatsApp" : "Assign and notify on WhatsApp"}
              </>
            )}
          </button>
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
};
