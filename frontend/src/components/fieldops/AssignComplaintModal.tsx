import React, { useState, useMemo } from "react";
import { FieldIssue } from "../../types";
import { Search, X, MessageCircle, CheckCircle2, Shield } from "lucide-react";
import { PGRS_DEPARTMENTS_LIST } from "./VolunteerOperationsDashboard";

export interface AssignContactOption {
  id: string;
  name: string;
  designation: string;
  phone: string;
  category: string;
  mandalName?: string;
  isOfficer?: boolean;
}

export const PGRS_CONTACT_DATABASE: AssignContactOption[] = [
  // 1. Roads & Buildings (R&B)
  {
    id: "cnt-rb-01",
    name: "K. Subba Rayudu",
    designation: "Ex-Sarpanch, R&B liaison",
    phone: "+91 98480 33441",
    category: "Roads & Buildings",
    mandalName: "Banaganapalle Town"
  },
  {
    id: "cnt-rb-02",
    name: "B. Venkateswarlu",
    designation: "Booth Convener, Booth 142",
    phone: "+91 94401 22334",
    category: "Roads & Buildings",
    mandalName: "Banaganapalle Mandal"
  },
  {
    id: "cnt-rb-03",
    name: "Er. M. Ramanjaneyulu",
    designation: "Executive Engineer (EE), R&B Division",
    phone: "+91 94408 12345",
    category: "Roads & Buildings",
    mandalName: "Koilakuntla Mandal",
    isOfficer: true
  },

  // 2. Water Supply & Panchayat Raj
  {
    id: "cnt-pr-01",
    name: "Smt. Chennamma Naidu",
    designation: "Village Organization (VO) President & RWS Lead",
    phone: "+91 94401 56789",
    category: "Water Supply & Panchayat Raj",
    mandalName: "Banaganapalle Mandal"
  },
  {
    id: "cnt-pr-02",
    name: "C. Hanumantha Reddy",
    designation: "Panchayat Secretary & Engineering Assistant",
    phone: "+91 98492 44556",
    category: "Water Supply & Panchayat Raj",
    mandalName: "Owk Mandal",
    isOfficer: true
  },
  {
    id: "cnt-pr-03",
    name: "G. V. Ramana",
    designation: "RWS Assistant Executive Engineer (AEE)",
    phone: "+91 94901 88776",
    category: "Water Supply & Panchayat Raj",
    mandalName: "Koilakuntla Town",
    isOfficer: true
  },

  // 3. Electricity (APCPDCL)
  {
    id: "cnt-elec-01",
    name: "Er. K. Srinivasulu",
    designation: "Assistant Engineer (AE), APCPDCL DISCOM",
    phone: "+91 94408 99112",
    category: "Electricity",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },
  {
    id: "cnt-elec-02",
    name: "T. Chinna Subbaiah",
    designation: "Line Inspector & Substation Convener",
    phone: "+91 98485 11223",
    category: "Electricity",
    mandalName: "Sanjamala Mandal"
  },

  // 4. Revenue & Pensions
  {
    id: "cnt-rev-01",
    name: "Sri M. Chenna Kesava",
    designation: "Tahsildar / MRO Office Representative",
    phone: "+91 98499 01010",
    category: "Revenue & Pensions",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },
  {
    id: "cnt-rev-02",
    name: "P. Madhavi Latha",
    designation: "NTR Bharosa Pension Coordinator & VRO Lead",
    phone: "+91 94412 77889",
    category: "Revenue & Pensions",
    mandalName: "Kolimigundla Mandal"
  },

  // 5. Health & Sanitation
  {
    id: "cnt-hlth-01",
    name: "Dr. P. Suresh Kumar, M.D.",
    designation: "Medical Officer, Primary Health Center (PHC)",
    phone: "+91 98850 77123",
    category: "Health & Sanitation",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },
  {
    id: "cnt-hlth-02",
    name: "Smt. K. Lakshmi Devi",
    designation: "ASHA Worker Lead & Hospital Coordinator",
    phone: "+91 94911 33445",
    category: "Health & Sanitation",
    mandalName: "Owk Mandal"
  },

  // 6. Agriculture & Employment (MGNREGS)
  {
    id: "cnt-agri-01",
    name: "Y. Narayana Reddy",
    designation: "Agricultural Officer (AO) & Rythu Bharosa Lead",
    phone: "+91 94405 66778",
    category: "Agriculture & Employment",
    mandalName: "Banaganapalle Mandal",
    isOfficer: true
  },
  {
    id: "cnt-agri-02",
    name: "V. Obulapati",
    designation: "MGNREGS Field Assistant & Work Supervisor",
    phone: "+91 98489 22110",
    category: "Agriculture & Employment",
    mandalName: "Sanjamala Mandal"
  },

  // 7. Field Volunteers / Agents
  {
    id: "usr-vol-01",
    name: "Demo Volunteer (Field Agent)",
    designation: "Constituency Field Operations Lead",
    phone: "+91 98480 12345",
    category: "All Categories",
    mandalName: "Banaganapalle Town"
  }
];

interface AssignComplaintModalProps {
  isOpen: boolean;
  issue: FieldIssue | null;
  onClose: () => void;
  onConfirmAssign: (issueId: string, assignedDeptOrName: string, contactPhone?: string) => void;
}

export const AssignComplaintModal: React.FC<AssignComplaintModalProps> = ({
  isOpen,
  issue,
  onClose,
  onConfirmAssign
}) => {
  if (!isOpen || !issue) return null;

  // Selected Category (Defaults to issue category or department)
  const initialCategory = useMemo(() => {
    if (!issue) return "8. Roads & Buildings (R&B) Department";
    const found = PGRS_DEPARTMENTS_LIST.find(
      (d) => d.name.toLowerCase().includes(issue.category.toLowerCase()) || issue.category.toLowerCase().includes(d.name.toLowerCase())
    );
    return found ? found.name : "8. Roads & Buildings (R&B) Department";
  }, [issue]);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Filter Contacts based on Category search & Search Query
  const filteredContacts = useMemo(() => {
    return PGRS_CONTACT_DATABASE.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.mandalName && c.mandalName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [searchQuery]);

  // Selected Contact Object
  const selectedContact = useMemo(() => {
    return PGRS_CONTACT_DATABASE.find((c) => c.id === selectedContactId) || filteredContacts[0];
  }, [selectedContactId, filteredContacts]);

  const handleAssignAndNotify = () => {
    const contactToNotify = selectedContact || filteredContacts[0];
    const targetPhone = contactToNotify?.phone || "+91 98480 12345";
    const contactName = contactToNotify?.name || "Assigned Representative";
    const contactRole = contactToNotify?.designation || selectedCategory;

    // 1. Trigger parent assignment handler
    onConfirmAssign(issue.id, `${selectedCategory} (${contactName})`, targetPhone);

    // 2. Prepare WhatsApp message
    const cleanPhone = targetPhone.replace(/\D/g, "");
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const messageText = `🚩 *CONSTITUENCY COMPLAINT ASSIGNMENT*
----------------------------------------
📋 *Ticket ID:* #${issue.id}
📌 *Title:* ${issue.title}
🏛️ *Department:* ${selectedCategory}
📍 *Location:* ${issue.mandalName}, ${issue.villageName}
👤 *Complainant:* ${issue.reportedBy} (${issue.reporterPhone || "N/A"})
${issue.aadharNumber ? `🆔 *Aadhaar:* ${issue.aadharNumber}\n` : ""}${issue.schemeSubDetail ? `📋 *Scheme Details:* ${issue.schemeSubDetail}\n` : ""}📝 *Issue Description:*
${issue.description}
----------------------------------------
👤 *Assigned Official/Lead:* ${contactName} (${contactRole})
🔗 *View Portal:* https://leaderslensconsulting.com/#/field-ops`;

    setSuccessMessage(`Assigned to ${contactName}! Opening WhatsApp...`);

    setTimeout(() => {
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`, "_blank");
      onClose();
    }, 900);
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
              Assign complaint
            </span>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#F5EFE0] leading-snug mt-0.5">
              {issue.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#142233] hover:bg-rose-950/80 border border-[#22354D] text-[#8E9CAE] hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[70vh]">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* 1. Category Selection */}
          <div>
            <label className="block text-xs text-[#8E9CAE] font-medium mb-1.5">
              Category
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
              <option value="Other Government Department (ఇతర ప్రభుత్వ శాఖ)">
                Other Government Department (ఇతర ప్రభుత్వ శాఖ)
              </option>
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

            {/* Contact Count Badge */}
            <div className="text-[11px] font-semibold text-emerald-400 pt-1">
              {filteredContacts.length} contacts tagged for {selectedCategory.split("(")[0]}
            </div>

            {/* Contacts Cards List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {filteredContacts.map((contact) => {
                const isSelected = selectedContactId === contact.id || (!selectedContactId && filteredContacts[0]?.id === contact.id);

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

                    <div className="text-[10.5px] font-mono text-[#D4A24C] mt-1 flex items-center gap-2">
                      <span>📱 {contact.phone}</span>
                      {contact.mandalName && <span>· 📍 {contact.mandalName}</span>}
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
            onClick={handleAssignAndNotify}
            className="w-full py-3 px-5 rounded-2xl bg-[#4A3D22] hover:bg-[#5E4D2B] text-[#F5EFE0] font-bold text-sm sm:text-base transition-all shadow-lg border border-[#D4A24C]/40 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            Assign and notify on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
