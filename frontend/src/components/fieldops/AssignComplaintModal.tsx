import React, { useState, useMemo, useEffect } from "react";
import { FieldIssue } from "../../types";
import { Search, X, MessageCircle, CheckCircle2, Shield } from "lucide-react";
import { PGRS_DEPARTMENTS_LIST } from "./VolunteerOperationsDashboard";

export interface AssignContactOption {
  id: string;
  deptId: number; // 1 to 17
  name: string;
  designation: string;
  phone: string;
  category: string;
  mandalName: string;
  isOfficer?: boolean;
}

export const PGRS_CONTACT_DATABASE: AssignContactOption[] = [
  // 1. Panchayat Raj – Engineering Department
  {
    id: "cnt-pr-01",
    deptId: 1,
    name: "C. Hanumantha Reddy",
    designation: "Panchayat Secretary & Engineering Assistant",
    phone: "+91 98492 44556",
    category: "1. Panchayat Raj – Engineering Department",
    mandalName: "Banaganapalle Mandal",
    isOfficer: true
  },
  {
    id: "cnt-pr-02",
    deptId: 1,
    name: "Er. P. Ramanjaneyulu",
    designation: "Assistant Engineer (AE), Panchayat Raj Dept",
    phone: "+91 94408 12345",
    category: "1. Panchayat Raj – Engineering Department",
    mandalName: "Koilakuntla Mandal",
    isOfficer: true
  },
  {
    id: "cnt-pr-03",
    deptId: 1,
    name: "B. Venkateswarlu",
    designation: "Panchayat Buildings Convener, Ward 4",
    phone: "+91 94401 22334",
    category: "1. Panchayat Raj – Engineering Department",
    mandalName: "Banaganapalle Town"
  },

  // 2. Rural Water Supply Scheme Department (RWS)
  {
    id: "cnt-rws-01",
    deptId: 2,
    name: "Smt. Chennamma Naidu",
    designation: "Village Organization (VO) President & Swachh Bharat Lead",
    phone: "+91 94401 56789",
    category: "2. Rural Water Supply Scheme Department (RWS)",
    mandalName: "Banaganapalle Mandal"
  },
  {
    id: "cnt-rws-02",
    deptId: 2,
    name: "Er. G. V. Ramana",
    designation: "RWS Assistant Executive Engineer (AEE)",
    phone: "+91 94901 88776",
    category: "2. Rural Water Supply Scheme Department (RWS)",
    mandalName: "Koilakuntla Town",
    isOfficer: true
  },

  // 3. Rural Development – NTR Bharosa Pensions Department
  {
    id: "cnt-pen-01",
    deptId: 3,
    name: "P. Madhavi Latha",
    designation: "NTR Bharosa Pension Coordinator & VRO Lead",
    phone: "+91 94412 77889",
    category: "3. Rural Development – NTR Bharosa Pensions Department",
    mandalName: "Kolimigundla Mandal"
  },
  {
    id: "cnt-pen-02",
    deptId: 3,
    name: "Sri M. Chenna Kesava",
    designation: "MRO Pension Sanctioning Authority",
    phone: "+91 98499 01010",
    category: "3. Rural Development – NTR Bharosa Pensions Department",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },

  // 4. Self-Employment Scheme
  {
    id: "cnt-se-01",
    deptId: 4,
    name: "Y. Obulapathi",
    designation: "SC / BC Corporation Executive Officer",
    phone: "+91 98489 22110",
    category: "4. Self-Employment Scheme (స్వయం ఉపాధి పథకాలు)",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },

  // 5. VELUGU – Rural Development & SHG Programme
  {
    id: "cnt-vel-01",
    deptId: 5,
    name: "Smt. Chennamma Naidu",
    designation: "Stree Nidhi & Bank Linkage Coordinator",
    phone: "+91 94401 56789",
    category: "5. VELUGU – Rural Development & SHG Programme",
    mandalName: "Banaganapalle Mandal"
  },

  // 6. MGNREGS – Employment Guarantee Scheme
  {
    id: "cnt-mgn-01",
    deptId: 6,
    name: "V. Obulapati",
    designation: "MGNREGS Field Assistant & Work Supervisor",
    phone: "+91 98489 22110",
    category: "6. MGNREGS – Employment Guarantee Scheme",
    mandalName: "Sanjamala Mandal"
  },

  // 7. Agriculture Department
  {
    id: "cnt-agri-01",
    deptId: 7,
    name: "Y. Narayana Reddy",
    designation: "Agricultural Officer (AO) & Loan Waiver Lead",
    phone: "+91 94405 66778",
    category: "7. Agriculture Department (వ్యవసాయ శాఖ)",
    mandalName: "Banaganapalle Mandal",
    isOfficer: true
  },

  // 8. Roads & Buildings (R&B) Department
  {
    id: "cnt-rb-01",
    deptId: 8,
    name: "K. Subba Rayudu",
    designation: "Ex-Sarpanch, R&B liaison",
    phone: "+91 98480 33441",
    category: "8. Roads & Buildings (R&B) Department",
    mandalName: "Banaganapalle Town"
  },
  {
    id: "cnt-rb-02",
    deptId: 8,
    name: "B. Venkateswarlu",
    designation: "Booth Convener, Booth 142",
    phone: "+91 94401 22334",
    category: "8. Roads & Buildings (R&B) Department",
    mandalName: "Banaganapalle Mandal"
  },
  {
    id: "cnt-rb-03",
    deptId: 8,
    name: "Er. M. Ramanjaneyulu",
    designation: "Executive Engineer (EE), R&B Division",
    phone: "+91 94408 12345",
    category: "8. Roads & Buildings (R&B) Department",
    mandalName: "Koilakuntla Mandal",
    isOfficer: true
  },

  // 9. Housing Department
  {
    id: "cnt-hs-01",
    deptId: 9,
    name: "Sri M. Chenna Kesava",
    designation: "Housing Inspector & Site Allotment Lead",
    phone: "+91 98499 01010",
    category: "9. Housing Department (గృహ నిర్మాణ శాఖ)",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },

  // 10. Health Department
  {
    id: "cnt-hlth-01",
    deptId: 10,
    name: "Dr. P. Suresh Kumar, M.D.",
    designation: "Medical Officer, Primary Health Center (PHC)",
    phone: "+91 98850 77123",
    category: "10. Health Department (ఆరోగ్య శాఖ)",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },

  // 11. Revenue Department
  {
    id: "cnt-rev-01",
    deptId: 11,
    name: "Sri M. Chenna Kesava",
    designation: "Tahsildar / MRO Revenue Officer",
    phone: "+91 98499 01010",
    category: "11. Revenue Department (రెవెన్యూ శాఖ)",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },

  // 12. Neeru-Chettu / Minor Irrigation Dept
  {
    id: "cnt-irrig-01",
    deptId: 12,
    name: "Er. G. V. Ramana",
    designation: "Minor Irrigation Executive Engineer",
    phone: "+91 94901 88776",
    category: "12. Neeru-Chettu / Minor Irrigation Dept (నీరు-చెట్టు)",
    mandalName: "Koilakuntla Town",
    isOfficer: true
  },

  // 13. Education Department
  {
    id: "cnt-edu-01",
    deptId: 13,
    name: "M. Balaji Naik",
    designation: "Mandal Educational Officer (MEO)",
    phone: "+91 94403 44556",
    category: "13. Education Department (విద్యా శాఖ)",
    mandalName: "Koilakuntla Town",
    isOfficer: true
  },

  // 14. Electricity Department (APCPDCL)
  {
    id: "cnt-elec-01",
    deptId: 14,
    name: "Er. K. Srinivasulu",
    designation: "Assistant Engineer (AE), APCPDCL DISCOM",
    phone: "+91 94408 99112",
    category: "14. Electricity Department (విద్యుత్ శాఖ - APCPDCL)",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },

  // 15. ICDS – Women & Child Development
  {
    id: "cnt-icds-01",
    deptId: 15,
    name: "Smt. G. Radhamma",
    designation: "Anganwadi Supervisor & ICDS Cluster Lead",
    phone: "+91 98496 77889",
    category: "15. ICDS – Women & Child Development (ఐసిడిఎస్)",
    mandalName: "Banaganapalle Town"
  },

  // 16. Aadarana – 3 Scheme
  {
    id: "cnt-aad-01",
    deptId: 16,
    name: "Y. Obulapathi",
    designation: "Artisans & Aadarana Scheme Executive Officer",
    phone: "+91 98489 22110",
    category: "16. Aadarana – 3 Scheme (ఆదరణ – 3 పథకం)",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },

  // 17. Law & Order & Police Services
  {
    id: "cnt-pol-01",
    deptId: 17,
    name: "Inspector B. Maheshwar",
    designation: "Station House Officer (Circle Inspector)",
    phone: "+91 94407 90900",
    category: "17. Law & Order & Police Services (శాంతి భద్రతలు)",
    mandalName: "Banaganapalle Town",
    isOfficer: true
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

  // Find initial department matching issue
  const initialDeptObj = useMemo(() => {
    if (!issue) return PGRS_DEPARTMENTS_LIST[0];
    const found = PGRS_DEPARTMENTS_LIST.find(
      (d) => d.name.toLowerCase().includes(issue.category.toLowerCase()) || issue.category.toLowerCase().includes(d.name.toLowerCase()) || (issue.department && d.name.toLowerCase().includes(issue.department.toLowerCase()))
    );
    return found || PGRS_DEPARTMENTS_LIST[7]; // Default to Roads & Buildings
  }, [issue]);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialDeptObj.name);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Get selected PGRS department object
  const currentDeptObj = useMemo(() => {
    return PGRS_DEPARTMENTS_LIST.find((d) => d.name === selectedCategory) || initialDeptObj;
  }, [selectedCategory, initialDeptObj]);

  // Filter contacts strict by selected category deptId & search query
  const filteredContacts = useMemo(() => {
    return PGRS_CONTACT_DATABASE.filter((c) => {
      // Strict department matching:
      const matchesDept = c.deptId === currentDeptObj.id;

      // Optional text search in name/role/mandal:
      const matchesSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.mandalName && c.mandalName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesDept && matchesSearch;
    });
  }, [currentDeptObj, searchQuery]);

  // Reset selected contact whenever category or filtered contacts change
  useEffect(() => {
    if (filteredContacts.length > 0) {
      setSelectedContactId(filteredContacts[0].id);
    } else {
      setSelectedContactId("");
    }
  }, [selectedCategory, filteredContacts]);

  // Currently active contact option
  const selectedContact = useMemo(() => {
    return filteredContacts.find((c) => c.id === selectedContactId) || filteredContacts[0];
  }, [selectedContactId, filteredContacts]);

  const handleAssignAndNotify = () => {
    const contactToNotify = selectedContact || filteredContacts[0];
    
    // Exact contact details (No hardcoded values)
    const targetName = contactToNotify ? contactToNotify.name : `${currentDeptObj.name.split(".")[1] || currentDeptObj.name} Officer`;
    const targetRole = contactToNotify ? contactToNotify.designation : currentDeptObj.name;
    const targetPhone = contactToNotify ? contactToNotify.phone : "+91 98480 33441";
    const targetMandal = contactToNotify?.mandalName || issue.mandalName;

    // 1. Update issue assignment in parent dashboard
    onConfirmAssign(issue.id, `${currentDeptObj.name.split(".")[1]?.trim() || currentDeptObj.name} (${targetName})`, targetPhone);

    // 2. Format dynamic WhatsApp message with exact selected details
    const cleanPhone = targetPhone.replace(/\D/g, "");
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const messageText = `🚩 *CONSTITUENCY PUBLIC GRIEVANCE ASSIGNMENT*
----------------------------------------
📋 *Ticket ID:* #${issue.id}
📌 *Issue Title:* ${issue.title}
🏛️ *Department:* ${currentDeptObj.name}
📍 *Mandal/Location:* ${issue.mandalName}, ${issue.villageName}
👤 *Complainant:* ${issue.reportedBy} (${issue.reporterPhone || "N/A"})
${issue.aadharNumber ? `🆔 *Aadhaar Number:* ${issue.aadharNumber}\n` : ""}${issue.schemeSubDetail ? `📋 *Scheme Work Details:* ${issue.schemeSubDetail}\n` : ""}📝 *Issue Description:*
${issue.description}
----------------------------------------
👤 *Assigned Official/Lead:* ${targetName}
💼 *Role/Designation:* ${targetRole}
📍 *Assigned Sector:* ${targetMandal}
📱 *Official Phone:* ${targetPhone}
🔗 *Portal Link:* https://leaderslensconsulting.com/#/field-ops`;

    setSuccessMessage(`Assigned to ${targetName}! Opening WhatsApp...`);

    setTimeout(() => {
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`, "_blank");
      onClose();
    }, 850);
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

          {/* 1. Category Dropdown */}
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
            <div className="text-[11px] font-semibold text-emerald-400 pt-1 flex items-center justify-between">
              <span>{filteredContacts.length} contacts tagged for {currentDeptObj.name.split(".")[1]?.trim() || currentDeptObj.name}</span>
            </div>

            {/* Contacts Cards List */}
            <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
              {filteredContacts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#0B1524] border border-[#1C2C3F] text-center text-xs text-[#8E9CAE]">
                  No specific contacts tagged for this department. Defaulting to Mandal Officers & Field Agents.
                </div>
              ) : (
                filteredContacts.map((contact) => {
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

                      <div className="text-[10.5px] font-mono text-[#D4A24C] mt-1 flex items-center gap-2">
                        <span>📱 {contact.phone}</span>
                        {contact.mandalName && <span>· 📍 {contact.mandalName}</span>}
                      </div>
                    </div>
                  );
                })
              )}
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
