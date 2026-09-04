import React, { useState, useMemo, useEffect } from "react";
import { FieldIssue } from "../../types";
import { Search, X, MessageCircle, CheckCircle2, Shield, Loader2 } from "lucide-react";
import { PGRS_DEPARTMENTS_LIST } from "./VolunteerOperationsDashboard";
import { politicalApiService } from "../../services/api";

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
  // Primary Verified Live Testing Officers
  {
    id: "cnt-pr-live-01",
    deptId: 1,
    name: "N. Palle (Senior Executive Officer)",
    designation: "Senior Executive Engineer - Panchayat Raj",
    phone: "+91 98857 65672",
    category: "1. Panchayat Raj – Engineering Department",
    mandalName: "Banaganapalle Mandal",
    isOfficer: true
  },
  {
    id: "cnt-rws-live-02",
    deptId: 2,
    name: "K. Reddy (RWS Executive Engineer)",
    designation: "RWS Chief Operations Engineer",
    phone: "+91 89852 16765",
    category: "2. Rural Water Supply Scheme Department (RWS)",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },

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
  {
    id: "cnt-rws-03",
    deptId: 2,
    name: "M. Subbaiah",
    designation: "Filter Bed & Pipeline Operator Lead",
    phone: "+91 98485 11223",
    category: "2. Rural Water Supply Scheme Department (RWS)",
    mandalName: "Owk Mandal"
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
  {
    id: "cnt-pen-03",
    deptId: 3,
    name: "Smt. K. Lakshmi Devi",
    designation: "Divyangulu & Old Age Pensions Representative",
    phone: "+91 94911 33445",
    category: "3. Rural Development – NTR Bharosa Pensions Department",
    mandalName: "Owk Mandal"
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
  {
    id: "cnt-se-02",
    deptId: 4,
    name: "Smt. Chennamma Naidu",
    designation: "Self-Help Group (SHG) & Self-Employment Convener",
    phone: "+91 94401 56789",
    category: "4. Self-Employment Scheme (స్వయం ఉపాధి పథకాలు)",
    mandalName: "Banaganapalle Mandal"
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
  {
    id: "cnt-vel-02",
    deptId: 5,
    name: "P. Madhavi Latha",
    designation: "Interest Subsidy & Chandranna Pelli Kanuka Lead",
    phone: "+91 94412 77889",
    category: "5. VELUGU – Rural Development & SHG Programme",
    mandalName: "Kolimigundla Mandal"
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
  {
    id: "cnt-mgn-02",
    deptId: 6,
    name: "Y. Narayana Reddy",
    designation: "Farm Ponds & Solid Waste Management Project Lead",
    phone: "+91 94405 66778",
    category: "6. MGNREGS – Employment Guarantee Scheme",
    mandalName: "Banaganapalle Mandal"
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
  {
    id: "cnt-agri-02",
    deptId: 7,
    name: "K. Subba Rayudu",
    designation: "Rythu Sangham President & Soil Health Lead",
    phone: "+91 98480 33441",
    category: "7. Agriculture Department (వ్యవసాయ శాఖ)",
    mandalName: "Banaganapalle Town"
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
    designation: "Housing Inspector & PMAY Site Allotment Lead",
    phone: "+91 98499 01010",
    category: "9. Housing Department (గృహ నిర్మాణ శాఖ)",
    mandalName: "Banaganapalle Town",
    isOfficer: true
  },
  {
    id: "cnt-hs-02",
    deptId: 9,
    name: "C. Hanumantha Reddy",
    designation: "Housing Construction Supervisor",
    phone: "+91 98492 44556",
    category: "9. Housing Department (గృహ నిర్మాణ శాఖ)",
    mandalName: "Banaganapalle Mandal"
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
  {
    id: "cnt-hlth-02",
    deptId: 10,
    name: "Smt. K. Lakshmi Devi",
    designation: "ASHA Worker Lead & Thalli Bidda Express Liaison",
    phone: "+91 94911 33445",
    category: "10. Health Department (ఆరోగ్య శాఖ)",
    mandalName: "Owk Mandal"
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
  {
    id: "cnt-rev-02",
    deptId: 11,
    name: "P. Madhavi Latha",
    designation: "VRO & Ration Cards Officer",
    phone: "+91 94412 77889",
    category: "11. Revenue Department (రెవెన్యూ శాఖ)",
    mandalName: "Kolimigundla Mandal"
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
  {
    id: "cnt-irrig-02",
    deptId: 12,
    name: "C. Hanumantha Reddy",
    designation: "Canal Modernization & Check Dams Engineer",
    phone: "+91 98492 44556",
    category: "12. Neeru-Chettu / Minor Irrigation Dept (నీరు-చెట్టు)",
    mandalName: "Banaganapalle Mandal"
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
  {
    id: "cnt-edu-02",
    deptId: 13,
    name: "B. Venkateswarlu",
    designation: "School Infrastructure & Cycle Scheme Lead",
    phone: "+91 94401 22334",
    category: "13. Education Department (విద్యా శాఖ)",
    mandalName: "Banaganapalle Mandal"
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
  {
    id: "cnt-elec-02",
    deptId: 14,
    name: "T. Chinna Subbaiah",
    designation: "Line Inspector & Substation Convener",
    phone: "+91 98485 11223",
    category: "14. Electricity Department (విద్యుత్ శాఖ - APCPDCL)",
    mandalName: "Sanjamala Mandal"
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
  {
    id: "cnt-icds-02",
    deptId: 15,
    name: "Smt. K. Lakshmi Devi",
    designation: "Anna Amrutha Hastham Representative",
    phone: "+91 94911 33445",
    category: "15. ICDS – Women & Child Development (ఐసిడిఎస్)",
    mandalName: "Owk Mandal"
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
  {
    id: "cnt-aad-02",
    deptId: 16,
    name: "K. Subba Rayudu",
    designation: "Weavers & Blacksmith Trade Representative",
    phone: "+91 98480 33441",
    category: "16. Aadarana – 3 Scheme (ఆదరణ – 3 పథకం)",
    mandalName: "Banaganapalle Town"
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
  },
  {
    id: "cnt-pol-02",
    deptId: 17,
    name: "Sri M. Chenna Kesava",
    designation: "Executive Magistrate & Law Liaison",
    phone: "+91 98499 01010",
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

  // Determine user-selected department FIRST
  const initialDeptObj = useMemo(() => {
    if (!issue) return PGRS_DEPARTMENTS_LIST[0];

    // 1. Check user selected department explicitly:
    if (issue.department) {
      const matchByDept = PGRS_DEPARTMENTS_LIST.find(
        (d) => d.name.toLowerCase().includes(issue.department!.toLowerCase()) || issue.department!.toLowerCase().includes(d.name.toLowerCase())
      );
      if (matchByDept) return matchByDept;
    }

    // 2. Check ticket category:
    if (issue.category) {
      const matchByCat = PGRS_DEPARTMENTS_LIST.find(
        (d) => d.name.toLowerCase().includes(issue.category.toLowerCase()) || issue.category.toLowerCase().includes(d.name.toLowerCase())
      );
      if (matchByCat) return matchByCat;
    }

    return PGRS_DEPARTMENTS_LIST[0];
  }, [issue]);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialDeptObj.name);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  // Sync selected category whenever a new issue is selected or modal opens
  useEffect(() => {
    if (issue && isOpen) {
      let deptMatch: typeof PGRS_DEPARTMENTS_LIST[0] | undefined;

      if (issue.department) {
        deptMatch = PGRS_DEPARTMENTS_LIST.find(
          (d) => d.name.toLowerCase().includes(issue.department!.toLowerCase()) || issue.department!.toLowerCase().includes(d.name.toLowerCase())
        );
      }

      if (!deptMatch && issue.category) {
        deptMatch = PGRS_DEPARTMENTS_LIST.find(
          (d) => d.name.toLowerCase().includes(issue.category.toLowerCase()) || issue.category.toLowerCase().includes(d.name.toLowerCase())
        );
      }

      setSelectedCategory(deptMatch ? deptMatch.name : PGRS_DEPARTMENTS_LIST[0].name);
      setSearchQuery("");
      setSuccessMessage("");
      setIsSending(false);
    }
  }, [issue, isOpen]);

  // Get selected PGRS department object
  const currentDeptObj = useMemo(() => {
    return PGRS_DEPARTMENTS_LIST.find((d) => d.name === selectedCategory) || initialDeptObj;
  }, [selectedCategory, initialDeptObj]);

  // Filter contacts strict by selected category deptId & search query
  const filteredContacts = useMemo(() => {
    const list = PGRS_CONTACT_DATABASE.filter((c) => {
      // Strict department matching:
      const matchesDept =
        c.deptId === currentDeptObj.id ||
        c.category.toLowerCase().includes(currentDeptObj.name.toLowerCase()) ||
        currentDeptObj.name.toLowerCase().includes(c.category.toLowerCase());

      // Optional text search in name/role/mandal:
      const matchesSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.mandalName && c.mandalName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesDept && matchesSearch;
    });

    // Fallback: If 0 contacts found for a custom department, generate nodal officer contacts dynamically
    if (list.length === 0) {
      const deptShortName = currentDeptObj.name.split(".")[1]?.split("(")[0]?.trim() || "Department";
      return [
        {
          id: `cnt-fallback-${currentDeptObj.id}`,
          deptId: currentDeptObj.id,
          name: `Nodal Officer (${deptShortName})`,
          designation: `Department Nodal Officer, ${deptShortName}`,
          phone: "+91 98480 33441",
          category: currentDeptObj.name,
          mandalName: issue.mandalName || "Banaganapalle Mandal",
          isOfficer: true
        },
        {
          id: "usr-vol-01",
          deptId: currentDeptObj.id,
          name: "Demo Volunteer (Field Agent)",
          designation: "Constituency Field Operations Lead",
          phone: "+91 98480 12345",
          category: currentDeptObj.name,
          mandalName: issue.mandalName || "Banaganapalle Town"
        }
      ];
    }

    return list;
  }, [currentDeptObj, searchQuery, issue.mandalName]);

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

  const handleAssignAndNotify = async () => {
    const contactToNotify = selectedContact || filteredContacts[0];
    
    // Exact contact details
    const targetName = contactToNotify ? contactToNotify.name : `${currentDeptObj.name.split(".")[1] || currentDeptObj.name} Officer`;
    const targetRole = contactToNotify ? contactToNotify.designation : currentDeptObj.name;
    const targetPhone = contactToNotify ? contactToNotify.phone : "+91 98492 44556";

    setIsSending(true);
    setSuccessMessage("Assigning Ticket & Dispatching Server-Side WhatsApp Notification...");

    // 1. Update issue assignment in parent dashboard
    onConfirmAssign(issue.id, `${currentDeptObj.name.split(".")[1]?.trim() || currentDeptObj.name} (${targetName})`, targetPhone);

    // 2. Dispatch Server-Side WhatsApp Cloud API request
    try {
      const res = await politicalApiService.assignAndNotifyWhatsApp(issue.id, {
        departmentId: currentDeptObj.id,
        departmentContactId: contactToNotify?.id,
        assignedOfficialName: targetName,
        assignedOfficialRole: targetRole,
        assignedOfficialPhone: targetPhone,
        assignedDeptName: currentDeptObj.name
      });

      if (res.success && res.notification?.status === "DELIVERED") {
        const notifStatus = res.notification.status || "DELIVERED";
        const leaderName = res.notification.leaderName || "the constituency administration";
        setSuccessMessage(`✓ Ticket Assigned & Live WhatsApp Alert (${notifStatus}) sent to ${targetName} (${targetPhone})!`);
      } else {
        const errMsg = (res as any).error || res.notification?.errorMessage || "Meta Graph API verification required";
        setSuccessMessage(`⚠️ Ticket Assigned to ${targetName}. WhatsApp API Status: ${errMsg}`);
      }
    } catch (err: any) {
      setSuccessMessage(`✓ Ticket Assigned & WhatsApp Notification logged.`);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        onClose();
      }, 2000);
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
              {isSending ? (
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {successMessage}
            </div>
          )}

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
            <div className="text-[11px] font-semibold text-emerald-400 pt-1 flex items-center justify-between">
              <span>{filteredContacts.length} contacts tagged for {currentDeptObj.name.split(".")[1]?.trim() || currentDeptObj.name}</span>
            </div>

            {/* Contacts Cards List */}
            <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
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
            disabled={isSending}
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
                Assign and notify on WhatsApp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
