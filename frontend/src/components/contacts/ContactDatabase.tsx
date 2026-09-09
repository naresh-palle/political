import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MandalInfo, UserProfile, VillageInfo } from "../../types";
import {
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Building2,
  Eye,
  FileSpreadsheet,
  FileDown,
  X,
  UserPlus,
  Pencil,
  Trash2
} from "lucide-react";
import { downloadContactWorkbook } from "../../utils/contactExcelExport";
import { downloadContactPdf, ContactPdfLang } from "../../utils/contactPdfExport";
import { UNIQUE_TICKET_SURFACE, formatDashboardCount } from "../../utils/ticketKpi";
import { politicalApiService } from "../../services/api";
import { PGRS_DEPARTMENTS_LIST } from "../fieldops/VolunteerOperationsDashboard";
import ManagerVolunteerRoster, { VolunteerIdentity } from "./ManagerVolunteerRoster";

export interface ContactRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category: "INFLUENCER" | "CADRE" | "PARTY_LEADER" | "CITIZEN" | "GOVT_OFFICIAL" | "DWCRA_LEAD" | "YOUTH_LEADER" | "OTHER";
  designation: string;
  mandalId: string;
  mandalName: string;
  villageId: string;
  villageName: string;
  voterId?: string;
  age?: number;
  gender: "Male" | "Female" | "Other";
  politicalAlignment: "STRONG_SUPPORTER" | "NEUTRAL_LEANING" | "OFFICIAL" | "CRITICAL_NEEDS_REACH";
  occupation: string;
  avatarUrl?: string;
  grievanceCount: number;
  lastContactedDate?: string;
  notes?: string;
  assignedVolunteerName?: string;
  department?: string;
  subDepartment?: string;
}

const INITIAL_CONTACTS: ContactRecord[] = [
  {
    id: "cnt-live-001",
    name: "N. Palle (Senior Executive Officer)",
    phone: "+91 98857 65672",
    email: "n.palle@ap.gov.in",
    category: "GOVT_OFFICIAL",
    designation: "Senior Executive Engineer - Panchayat Raj",
    mandalId: "MDL-BNG-RUR",
    mandalName: "Banaganapalle Mandal",
    villageId: "VIL-BNG-YGT",
    villageName: "Yaganti Sector",
    voterId: "AP/140/012/10001",
    age: 48,
    gender: "Male",
    politicalAlignment: "OFFICIAL",
    occupation: "Executive Engineer - Govt Operations",
    grievanceCount: 3,
    lastContactedDate: "2026-09-04",
    notes: "Verified live department contact for Panchayat Raj dispatches.",
    assignedVolunteerName: "Manager1",
    department: "1. Panchayat Raj – Engineering Department",
    subDepartment: "Panchayat Buildings Department (పంచాయతీ భవనాలు)"
  },
  {
    id: "cnt-live-002",
    name: "K. Reddy (RWS Executive Engineer)",
    phone: "+91 89852 16765",
    email: "k.reddy@ap.gov.in",
    category: "GOVT_OFFICIAL",
    designation: "RWS Chief Operations Engineer",
    mandalId: "MDL-BNG-TWN",
    mandalName: "Banaganapalle Town",
    villageId: "VIL-BNG-TWN-02",
    villageName: "Banaganapalle Town Wards 11-20",
    voterId: "AP/140/012/10002",
    age: 45,
    gender: "Male",
    politicalAlignment: "OFFICIAL",
    occupation: "Chief Engineer - RWS Water Supply",
    grievanceCount: 2,
    lastContactedDate: "2026-09-04",
    notes: "Verified live department contact for Rural Water Supply Scheme dispatches.",
    assignedVolunteerName: "Manager1",
    department: "2. Rural Water Supply Scheme Department (RWS)",
    subDepartment: "Drains and Pipe lines (డ్రైన్లు మరియు పైప్‌లైన్లు)"
  }
];

const STORAGE_KEY = "leaders_lens_contacts_db_v2";
const OTHER_DEPT = "Other Government Department (ఇతర ప్రభుత్వ శాఖ)";
const OTHER_SUB = "Other (ఇతరం)";
const CONTACT_DEPARTMENTS = [...PGRS_DEPARTMENTS_LIST.map((d) => d.name), OTHER_DEPT];

const EMPTY_CONTACT: Partial<ContactRecord> = {
  name: "",
  phone: "+91 ",
  email: "",
  category: "PARTY_LEADER",
  designation: "",
  department: "",
  subDepartment: "",
  mandalName: "",
  mandalId: "",
  villageName: "",
  villageId: "",
  politicalAlignment: "OFFICIAL",
  gender: "Male",
  notes: ""
};

const FIELD_CLASS =
  "w-full min-w-0 bg-[#0B131E] border border-[#223348] rounded-xl p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] outline-none";

const ROLE_TOKEN = (user: UserProfile) =>
  String(user.primaryRole || user.roleId || user.role || "")
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

/** PA, Manager, and Super Admin can view / edit / delete every contact. */
function canUserManageContacts(user: UserProfile): boolean {
  if (user.isPlatformAdmin || user.isPoliticalAdmin) return true;
  if (user.email === "admin@leaderslens.ai") return true;
  const role = ROLE_TOKEN(user);
  return (
    role === "SUPER_ADMIN" ||
    role === "POLITICAL_ADMIN" ||
    role === "DIRECTOR" ||
    role === "ADMIN" ||
    role === "CAMPAIGN_MANAGER" ||
    role === "PARTY_ADMIN" ||
    role === "CAMPAIGN_DIRECTOR"
  );
}

function isVolunteerUser(user: UserProfile): boolean {
  if (canUserManageContacts(user)) return false;
  const role = ROLE_TOKEN(user);
  return role === "VOLUNTEER" || user.role === "volunteer";
}

function isManagerUser(user: UserProfile): boolean {
  const role = ROLE_TOKEN(user);
  return (
    role === "DIRECTOR" ||
    role === "CAMPAIGN_MANAGER" ||
    role === "CAMPAIGN_DIRECTOR" ||
    role === "MANAGER"
  );
}

function contactMatchesVolunteer(contact: ContactRecord, identities: VolunteerIdentity[]) {
  const name = String(contact.name || "").trim().toLowerCase();
  const phone = String(contact.phone || "").replace(/\D/g, "").slice(-10);
  return identities.some((v) => {
    const vn = String(v.name || "").trim().toLowerCase();
    const vp = String(v.phone || "").replace(/\D/g, "").slice(-10);
    if (vn && name && vn === name) return true;
    if (vp.length >= 10 && phone.length >= 10 && vp === phone) return true;
    return false;
  });
}

export const ContactDatabase: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const canManageContacts = canUserManageContacts(currentUser);
  const hidePhone = isVolunteerUser(currentUser);
  const showManagerVolunteers = isManagerUser(currentUser);
  const [volunteerIdentities, setVolunteerIdentities] = useState<VolunteerIdentity[]>([]);
  const handleVolunteerIdentities = useCallback((identities: VolunteerIdentity[]) => {
    setVolunteerIdentities((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(identities)) return prev;
      return identities;
    });
  }, []);

  const [contacts, setContacts] = useState<ContactRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CONTACTS;
  });

  const [mandals, setMandals] = useState<MandalInfo[]>([]);
  const [villages, setVillages] = useState<VillageInfo[]>([]);
  const [otherDepartment, setOtherDepartment] = useState("");
  const [otherSubDepartment, setOtherSubDepartment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterMandal, setFilterMandal] = useState<string>("ALL");
  const [filterGender, setFilterGender] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState<ContactPdfLang | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);

  const [newContact, setNewContact] = useState<Partial<ContactRecord>>({ ...EMPTY_CONTACT });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const acId = currentUser.assemblyConstituencyId || "BNG-AC";
    Promise.all([
      politicalApiService.getMandals(acId, currentUser.stateId || undefined),
      politicalApiService.getVillages(undefined, acId)
    ])
      .then(([m, v]) => {
        setMandals(Array.isArray(m) ? m : []);
        setVillages(Array.isArray(v) ? v : []);
      })
      .catch(() => {});
  }, [currentUser.assemblyConstituencyId, currentUser.stateId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (e) {
      console.error(e);
    }
  }, [contacts]);

  useEffect(() => {
    if (!showManagerVolunteers || volunteerIdentities.length === 0) return;
    setContacts((prev) => {
      const next = prev.filter((c) => !contactMatchesVolunteer(c, volunteerIdentities));
      return next.length === prev.length ? prev : next;
    });
  }, [showManagerVolunteers, volunteerIdentities]);

  const mandalsList = useMemo(() => {
    if (mandals.length > 0) {
      return mandals.map((m) => ({ id: m.id, name: m.name }));
    }
    const map = new Map<string, string>();
    contacts.forEach((c) => {
      if (c.mandalName) map.set(c.mandalId || c.mandalName, c.mandalName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [mandals, contacts]);

  const villagesForForm = useMemo(() => {
    const mandalId = newContact.mandalId;
    if (!mandalId) return villages;
    const filtered = villages.filter((v) => v.mandalId === mandalId);
    return filtered.length > 0 ? filtered : villages;
  }, [villages, newContact.mandalId]);

  const selectedDept = PGRS_DEPARTMENTS_LIST.find((d) => d.name === newContact.department);
  const subOptions = selectedDept ? [...selectedDept.subDetails, OTHER_SUB] : [OTHER_SUB];
  const isOfficer = newContact.category === "GOVT_OFFICIAL";

  const isPartyLeaderCategory = (category: ContactRecord["category"]) =>
    category === "PARTY_LEADER" || category === "CADRE";

  const matchesSearchCategory = (category: ContactRecord["category"], selected: string) => {
    if (selected === "ALL") return true;
    if (selected === "GOVT_OFFICIAL") return category === "GOVT_OFFICIAL";
    if (selected === "PARTY_LEADER" || selected === "CADRE") return isPartyLeaderCategory(category);
    if (selected === "OTHER") return category !== "GOVT_OFFICIAL" && !isPartyLeaderCategory(category);
    return category === selected;
  };

  const directoryContacts = useMemo(() => {
    if (!showManagerVolunteers || volunteerIdentities.length === 0) return contacts;
    return contacts.filter((c) => !contactMatchesVolunteer(c, volunteerIdentities));
  }, [contacts, showManagerVolunteers, volunteerIdentities]);

  const filteredContacts = useMemo(() => {
    return directoryContacts.filter((c) => {
      if (!matchesSearchCategory(c.category, filterCategory)) return false;
      if (filterMandal !== "ALL" && c.mandalName !== filterMandal && c.mandalId !== filterMandal) return false;
      if (filterGender !== "ALL" && c.gender !== filterGender) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          c.name,
          hidePhone ? "" : c.phone,
          hidePhone ? "" : c.email,
          c.mandalName,
          c.villageName,
          c.designation,
          c.department,
          c.subDepartment
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      }
      return true;
    });
  }, [directoryContacts, filterCategory, filterMandal, filterGender, searchQuery, hidePhone]);

  const stats = useMemo(() => {
    const officials = directoryContacts.filter((c) => c.category === "GOVT_OFFICIAL").length;
    const leaders = directoryContacts.filter((c) => isPartyLeaderCategory(c.category)).length;
    return {
      total: directoryContacts.length,
      officials,
      leaders,
      other: directoryContacts.length - officials - leaders
    };
  }, [directoryContacts]);

  const resolvedDepartment = () => {
    if (!isOfficer) return "";
    if (newContact.department === OTHER_DEPT) return otherDepartment.trim() || OTHER_DEPT;
    return newContact.department || "";
  };

  const resolvedSubDepartment = () => {
    if (!isOfficer) return "";
    if (newContact.subDepartment === OTHER_SUB) return otherSubDepartment.trim() || OTHER_SUB;
    return newContact.subDepartment || "";
  };

  const buildContactRecord = (id: string, extras?: Partial<ContactRecord>): ContactRecord => ({
    id,
    name: newContact.name || "",
    phone: newContact.phone || "",
    email: newContact.email || undefined,
    category: (newContact.category as ContactRecord["category"]) || "PARTY_LEADER",
    designation: newContact.designation || "",
    department: resolvedDepartment(),
    subDepartment: resolvedSubDepartment(),
    mandalId: newContact.mandalId || "",
    mandalName: newContact.mandalName || "",
    villageId: newContact.villageId || "",
    villageName: newContact.villageName || "",
    gender: (newContact.gender as ContactRecord["gender"]) || "Male",
    politicalAlignment: (newContact.politicalAlignment as ContactRecord["politicalAlignment"]) || "OFFICIAL",
    occupation: newContact.occupation || "",
    avatarUrl: newContact.avatarUrl,
    grievanceCount: extras?.grievanceCount ?? 0,
    notes: newContact.notes || "",
    lastContactedDate: extras?.lastContactedDate || new Date().toISOString().split("T")[0],
    assignedVolunteerName: extras?.assignedVolunteerName
  });

  const resetForm = () => {
    setNewContact({ ...EMPTY_CONTACT });
    setOtherDepartment("");
    setOtherSubDepartment("");
    setEditingId(null);
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;
    if (editingId) {
      if (!canManageContacts) return;
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? buildContactRecord(editingId, {
                grievanceCount: c.grievanceCount,
                lastContactedDate: c.lastContactedDate,
                assignedVolunteerName: c.assignedVolunteerName
              })
            : c
        )
      );
    } else {
      setContacts((prev) => [buildContactRecord(`cnt-${Date.now().toString(16)}`), ...prev]);
    }
    setIsAddModalOpen(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setIsAddModalOpen(true);
  };

  const openEdit = (contact: ContactRecord) => {
    if (!canManageContacts) return;
    const knownDept = CONTACT_DEPARTMENTS.includes(contact.department || "")
      ? contact.department || ""
      : contact.department
        ? OTHER_DEPT
        : "";
    const deptObj = PGRS_DEPARTMENTS_LIST.find((d) => d.name === knownDept);
    const knownSub =
      deptObj && contact.subDepartment && deptObj.subDetails.includes(contact.subDepartment)
        ? contact.subDepartment
        : contact.subDepartment
          ? OTHER_SUB
          : "";
    setEditingId(contact.id);
    setOtherDepartment(knownDept === OTHER_DEPT ? contact.department || "" : "");
    setOtherSubDepartment(knownSub === OTHER_SUB ? contact.subDepartment || "" : "");
    const category = isPartyLeaderCategory(contact.category)
      ? "PARTY_LEADER"
      : contact.category === "GOVT_OFFICIAL"
        ? "GOVT_OFFICIAL"
        : "OTHER";
    setNewContact({
      ...contact,
      category,
      department: knownDept || contact.department,
      subDepartment: knownSub || contact.subDepartment
    });
    setSelectedContact(null);
    setIsAddModalOpen(true);
  };

  const handleDeleteContact = (contact: ContactRecord) => {
    if (!canManageContacts) return;
    if (!window.confirm(`Delete contact "${contact.name}"? This cannot be undone.`)) return;
    setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    if (selectedContact?.id === contact.id) setSelectedContact(null);
  };

  const handleExportExcel = () => {
    downloadContactWorkbook(filteredContacts, currentUser.assemblyConstituencyName || "Banaganapalle", {
      hidePhone
    });
  };

  const handleExportPdf = async (lang: ContactPdfLang) => {
    setExportingPdf(lang);
    try {
      await downloadContactPdf(
        filteredContacts,
        currentUser.assemblyConstituencyName || "Banaganapalle",
        lang,
        { hidePhone }
      );
    } finally {
      setExportingPdf(null);
    }
  };

  const goldBadge =
    "px-2 py-0.5 rounded-md bg-[#4A3D22] text-[#F5E0B0] border border-[#D4A24C] text-[10.5px] font-bold";

  const getCategoryBadge = (cat: ContactRecord["category"]) => {
    if (cat === "GOVT_OFFICIAL") return <span className={goldBadge}>Govt Officer</span>;
    if (isPartyLeaderCategory(cat)) return <span className={goldBadge}>Party Leader</span>;
    return <span className={goldBadge}>Other</span>;
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6 space-y-3 animate-fadeIn">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#D4A24C]/40 shadow-xl">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#F5EFE0] tracking-wide">
              Constituency Contact Database
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#D4A24C]/20 text-[#D4A24C] border border-[#D4A24C]/40">
              Live Directory
            </span>
          </div>
          <p className="text-xs text-[#CBD5E1] mt-0.5">
            {showManagerVolunteers
              ? "Your volunteer team is listed here. Matching directory contacts were removed and replaced with this roster."
              : canManageContacts
              ? "You can view, edit, or delete every contact in this directory."
              : "Govt Officers, Party Leaders, and other constituency contacts"}
          </p>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-[#0B131E] border border-[#223348] hover:border-[#D4A24C]/50 text-[#CBD5E1] hover:text-[#F5EFE0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#D4A24C]" />
            <span>Export Excel</span>
          </button>

          <div className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-[#223348] bg-[#0B131E] p-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-[#CBD5E1]">
              <FileDown className="w-3.5 h-3.5 text-[#D4A24C]" />
              Export PDF
            </span>
            <button
              type="button"
              onClick={() => handleExportPdf("en")}
              disabled={exportingPdf !== null}
              className="min-h-[32px] px-2.5 py-1.5 rounded-lg bg-[#071322] border border-[#D4A24C]/40 text-[#D4A24C] text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              {exportingPdf === "en" ? "Exporting…" : "English"}
            </button>
            <button
              type="button"
              onClick={() => handleExportPdf("te")}
              disabled={exportingPdf !== null}
              className="min-h-[32px] px-2.5 py-1.5 rounded-lg bg-[#071322] border border-[#D4A24C]/40 text-[#D4A24C] text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              {exportingPdf === "te" ? "Exporting…" : "Telugu"}
            </button>
          </div>

          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] hover:brightness-110 text-[#0B131E] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Contact</span>
          </button>
        </div>
      </div>

      {showManagerVolunteers ? (
        <ManagerVolunteerRoster currentUser={currentUser} onIdentities={handleVolunteerIdentities} />
      ) : null}

      {/* 2. Directory KPI Metrics — same gold surface as Manager landing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 rounded-2xl bg-[#091422] border border-[#22354D]">
        {(
          [
            { label: "Total", hint: "Directory", value: stats.total },
            { label: "Govt Officer", hint: "Dept", value: stats.officials },
            { label: "Party Leader", hint: "Party", value: stats.leaders },
            { label: "Other", hint: "Directory", value: stats.other }
          ] as const
        ).map((card) => (
          <div
            key={card.label}
            className={`p-3.5 rounded-xl border ${UNIQUE_TICKET_SURFACE.kpi} space-y-1`}
          >
            <span className="text-[10.5px] font-mono font-semibold uppercase text-[#D4A24C] block whitespace-normal break-words">
              {card.label}
            </span>
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-2xl font-bold font-mono text-[#D4A24C]">{formatDashboardCount(card.value)}</span>
              <span className="text-[10px] text-[#D4A24C]/80 font-mono font-semibold">{card.hint}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Filter & Search Master Toolbar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#223348] shadow-lg space-y-3">
        {showManagerVolunteers ? (
          <h2 className="font-display text-lg text-[#F5EFE0]">Constituency Directory</h2>
        ) : null}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
            <input
              type="text"
              placeholder={hidePhone ? "Search by name, village, department, designation..." : "Search by name, phone, village, designation..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] focus:border-[#D4A24C] rounded-xl pl-9 pr-8 py-2.5 text-xs text-[#F5EFE0] placeholder-[#5F6875] outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E9CAE] hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            <span className="text-xs text-[#8E9CAE]">
              Showing <strong className="text-[#D4A24C]">{filteredContacts.length}</strong> of {directoryContacts.length} contacts
            </span>

            {/* View Mode */}
            <div className="flex items-center p-1 rounded-xl bg-[#0B131E] border border-[#223348] text-xs">
              <button
                onClick={() => setViewMode("GRID")}
                className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "GRID" ? "bg-[#D4A24C] text-[#0B131E] font-bold shadow-sm" : "text-[#CBD5E1]"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("TABLE")}
                className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "TABLE" ? "bg-[#D4A24C] text-[#0B131E] font-bold shadow-sm" : "text-[#CBD5E1]"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Granular Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Category: All Types</option>
              <option value="GOVT_OFFICIAL">Govt Officer</option>
              <option value="PARTY_LEADER">Party Leader</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <select
              value={filterMandal}
              onChange={(e) => setFilterMandal(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Mandal: All Sectors</option>
              {mandalsList.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Gender: All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Main Contact Grid / Table List */}
      {filteredContacts.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#0E1724]/90 border border-[#223348] text-center space-y-2">
          <p className="text-sm font-semibold text-[#F5EFE0]">No contacts in this directory yet</p>
          <p className="text-xs text-[#8E9CAE]">
            Add a contact with name, phone, category, designation, mandal, and village.
          </p>
        </div>
      ) : viewMode === "GRID" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 items-stretch">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="h-full p-3 rounded-xl bg-[#0E1724]/90 border border-[#223348] hover:border-[#D4A24C]/60 transition-all shadow-md backdrop-blur-xl flex flex-col justify-between space-y-2 group"
            >
              {/* Top: Avatar, Name & Category */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-[#F5EFE0] group-hover:text-[#D4A24C] transition-colors truncate">
                        {contact.name}
                      </h3>
                      <p className="text-xs text-[#CBD5E1] whitespace-normal break-words">{contact.designation}</p>
                    </div>
                  </div>

                  {getCategoryBadge(contact.category)}
                </div>

                <div className="pt-2 space-y-1 text-xs text-[#8E9CAE]">
                  {contact.department ? (
                    <div className="flex items-start gap-1.5 text-[#CBD5E1]">
                      <Building2 className="w-3.5 h-3.5 text-[#D4A24C] shrink-0 mt-0.5" />
                      <span className="whitespace-normal break-words">
                        {contact.department}
                        {contact.subDepartment ? ` · ${contact.subDepartment}` : ""}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                    <MapPin className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                    <span className="whitespace-normal break-words">
                      {contact.mandalName}
                      {contact.villageName ? ` · ${contact.villageName}` : ""}
                    </span>
                  </div>
                </div>

                {/* Notes if any */}
                {contact.notes && (
                  <p className="text-[11px] text-[#8E9CAE] italic line-clamp-2 mt-2 pt-2 border-t border-[#223348]/60">
                    &ldquo;{contact.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Bottom: Action Buttons */}
              <div className="pt-2 border-t border-[#223348]/70 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {!hidePhone && (
                    <>
                  <a
                    href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=Namaste%20${encodeURIComponent(contact.name)}%20garu,%20greetings%20from%20Leaders%20Lens%20Office.`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="Send WhatsApp Message"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${contact.phone}`}
                    className="p-2 rounded-xl bg-[#131E2D] hover:bg-[#1E3048] border border-[#223348] text-[#D4A24C] text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="Direct Phone Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-mono whitespace-normal break-words">{contact.phone}</span>
                  </a>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {canManageContacts && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(contact)}
                        className="p-2 px-2.5 rounded-xl bg-[#0B131E] hover:bg-[#131E2D] border border-[#D4A24C]/40 text-[#D4A24C] text-xs transition-all cursor-pointer"
                        title="Edit contact"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(contact)}
                        className="p-2 px-2.5 rounded-xl bg-[#0B131E] hover:bg-rose-950/60 border border-[#223348] hover:border-rose-500/50 text-[#CBD5E1] hover:text-rose-200 text-xs transition-all cursor-pointer"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedContact(contact)}
                    className="p-2 px-2.5 rounded-xl bg-[#0B131E] hover:bg-[#131E2D] border border-[#223348] text-[#CBD5E1] hover:text-[#F5EFE0] text-xs transition-all cursor-pointer"
                    title="View Full Profile"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl bg-[#0E1724]/90 border border-[#223348] shadow-lg">
          <table className="w-full text-left text-xs text-[#CBD5E1]">
            <thead className="bg-[#0B131E] text-[#8E9CAE] uppercase font-semibold border-b border-[#223348] text-[10.5px]">
              <tr>
                <th className="p-3.5">Contact Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Dept / Sub-dept</th>
                <th className="p-3.5">Location</th>
                {!hidePhone && <th className="p-3.5">Phone / Connect</th>}
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#223348]/60">
              {filteredContacts.map((c) => (
                <tr key={c.id} className="hover:bg-[#131E2D]/60 transition-colors">
                  <td className="p-3.5">
                    <strong className="text-[#F5EFE0] block font-semibold">{c.name}</strong>
                    <span className="text-[11px] text-[#8E9CAE] block">{c.designation}</span>
                  </td>
                  <td className="p-3.5">{getCategoryBadge(c.category)}</td>
                  <td className="p-3.5">
                    <span className="text-[#F5EFE0] block whitespace-normal break-words">{c.department || "—"}</span>
                    {c.subDepartment ? (
                      <span className="text-[11px] text-[#8E9CAE] block whitespace-normal break-words">{c.subDepartment}</span>
                    ) : null}
                  </td>
                  <td className="p-3.5">
                    <span className="text-[#F5EFE0] block whitespace-normal break-words">{c.mandalName}</span>
                    <span className="text-[11px] text-[#8E9CAE] block whitespace-normal break-words">{c.villageName}</span>
                  </td>
                  {!hidePhone && (
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px] whitespace-normal break-words"
                      >
                        <MessageCircle className="w-3 h-3 shrink-0" />
                        {c.phone}
                      </a>
                    </div>
                  </td>
                  )}
                  <td className="p-3.5 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {canManageContacts && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="px-2.5 py-1 rounded-lg bg-[#131E2D] hover:bg-[#1E3048] border border-[#D4A24C]/40 text-[#D4A24C] text-[11px] font-semibold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteContact(c)}
                            className="px-2.5 py-1 rounded-lg bg-[#131E2D] hover:bg-rose-950/50 border border-[#223348] text-[#CBD5E1] hover:text-rose-200 text-[11px] font-semibold cursor-pointer"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedContact(c)}
                        className="px-2.5 py-1 rounded-lg bg-[#131E2D] hover:bg-[#1E3048] border border-[#223348] text-[#D4A24C] text-[11px] font-semibold cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Add Contact Modal */}
      {isAddModalOpen &&
        createPortal(
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-3 sm:p-6 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-xl mt-2 sm:mt-4 mb-8 bg-[#0E1724] border border-[#D4A24C]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#223348] flex items-center justify-between bg-[#0B131E]">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-[#D4A24C]" />
                <h3 className="font-display text-lg text-[#F5EFE0] font-bold">
                  {editingId ? "Edit Constituency Contact" : "Add New Constituency Contact"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="p-1 rounded-lg hover:bg-[#131E2D] text-[#8E9CAE] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. K. Subba Rayudu"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full bg-[#0B131E] border border-[#223348] rounded-xl p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Phone Number (with +91) *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98480 00000"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Category</label>
                  <select
                    value={newContact.category}
                    className={FIELD_CLASS}
                    onChange={(e) => {
                      const category = e.target.value as ContactRecord["category"];
                      const next: Partial<ContactRecord> = { ...newContact, category };
                      if (category === "GOVT_OFFICIAL") {
                        next.department = next.department || CONTACT_DEPARTMENTS[0];
                        const dept = PGRS_DEPARTMENTS_LIST.find((d) => d.name === next.department);
                        next.subDepartment = next.subDepartment || dept?.subDetails[0] || OTHER_SUB;
                      } else {
                        next.department = "";
                        next.subDepartment = "";
                        setOtherDepartment("");
                        setOtherSubDepartment("");
                      }
                      setNewContact(next);
                    }}
                  >
                    <option value="PARTY_LEADER">Party Leader</option>
                    <option value="GOVT_OFFICIAL">Govt Officer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Designation / Role</label>
                  <input
                    type="text"
                    className={FIELD_CLASS}
                    placeholder="e.g. Ex-Sarpanch / Mandal Incharge"
                    value={newContact.designation || ""}
                    onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={newContact.email || ""}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Gender</label>
                  <select
                    value={newContact.gender}
                    onChange={(e) => setNewContact({ ...newContact, gender: e.target.value as ContactRecord["gender"] })}
                    className={FIELD_CLASS}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {isOfficer && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#071322]/80 border border-[#D4A24C]/25">
                  <div className="sm:col-span-2">
                    <label className="text-[#D4A24C] block mb-1 font-medium">Department *</label>
                    <select
                      required
                      value={newContact.department || ""}
                      onChange={(e) => {
                        const department = e.target.value;
                        const dept = PGRS_DEPARTMENTS_LIST.find((d) => d.name === department);
                        setNewContact({
                          ...newContact,
                          department,
                          subDepartment: dept?.subDetails[0] || OTHER_SUB
                        });
                        setOtherSubDepartment("");
                      }}
                      className={FIELD_CLASS}
                    >
                      <option value="">Select department</option>
                      {CONTACT_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    {newContact.department === OTHER_DEPT && (
                      <input
                        type="text"
                        required
                        placeholder="Enter other department name"
                        value={otherDepartment}
                        onChange={(e) => setOtherDepartment(e.target.value)}
                        className={`${FIELD_CLASS} mt-2`}
                      />
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[#D4A24C] block mb-1 font-medium">Sub-department / scheme *</label>
                    <select
                      required
                      value={newContact.subDepartment || ""}
                      onChange={(e) => setNewContact({ ...newContact, subDepartment: e.target.value })}
                      className={FIELD_CLASS}
                    >
                      {subOptions.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                    {newContact.subDepartment === OTHER_SUB && (
                      <input
                        type="text"
                        required
                        placeholder="Enter other sub-department / work details"
                        value={otherSubDepartment}
                        onChange={(e) => setOtherSubDepartment(e.target.value)}
                        className={`${FIELD_CLASS} mt-2`}
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Mandal</label>
                  <select
                    value={newContact.mandalId || ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      const found = mandalsList.find((m) => m.id === id);
                      const firstVillage = villages.find((v) => v.mandalId === id);
                      setNewContact({
                        ...newContact,
                        mandalId: id,
                        mandalName: found?.name || "",
                        villageId: firstVillage?.id || "",
                        villageName: firstVillage?.name || ""
                      });
                    }}
                    className={FIELD_CLASS}
                  >
                    <option value="">Select mandal</option>
                    {mandalsList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Village / Ward</label>
                  <select
                    value={newContact.villageId || ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      const found = villagesForForm.find((v) => v.id === id);
                      setNewContact({
                        ...newContact,
                        villageId: id,
                        villageName: found?.name || ""
                      });
                    }}
                    className={FIELD_CLASS}
                  >
                    <option value="">Select village / ward</option>
                    {villagesForForm.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#8E9CAE] block mb-1 font-medium">Strategic Notes / Influence Context</label>
                <textarea
                  rows={3}
                  placeholder="Key influence details, family ties, past voting patterns or grievance history..."
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  className="w-full bg-[#0B131E] border border-[#223348] rounded-xl p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#223348] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0B131E] border border-[#223348] text-[#CBD5E1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] text-xs font-bold shadow-md hover:brightness-110"
                >
                  {editingId ? "Save changes" : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 6. Contact Details Modal */}
      {selectedContact &&
        createPortal(
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-3 sm:p-6 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg mt-2 sm:mt-4 mb-8 bg-[#0E1724] border border-[#D4A24C]/40 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-[#223348] pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#F5EFE0]">{selectedContact.name}</h3>
                <p className="text-xs text-[#CBD5E1]">{selectedContact.designation}</p>
                <div className="mt-1">{getCategoryBadge(selectedContact.category)}</div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-1 rounded-lg hover:bg-[#131E2D] text-[#8E9CAE] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {!hidePhone && (
              <div className="p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[10px] text-[#8E9CAE] block">Phone</span>
                <strong className="text-[#F5EFE0] font-mono whitespace-normal break-words">{selectedContact.phone}</strong>
              </div>
              )}
              {!hidePhone && selectedContact.email ? (
              <div className="p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[10px] text-[#8E9CAE] block">Email</span>
                <strong className="text-[#F5EFE0] whitespace-normal break-words">{selectedContact.email}</strong>
              </div>
              ) : null}
              <div className="p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[10px] text-[#8E9CAE] block">Gender</span>
                <strong className="text-[#F5EFE0]">{selectedContact.gender}</strong>
              </div>
              {selectedContact.department ? (
              <div className="p-2.5 rounded-xl bg-[#0B131E] border border-[#223348] col-span-2">
                <span className="text-[10px] text-[#8E9CAE] block">Department / Sub-department</span>
                <strong className="text-[#F5EFE0] whitespace-normal break-words">
                  {selectedContact.department}
                  {selectedContact.subDepartment ? ` · ${selectedContact.subDepartment}` : ""}
                </strong>
              </div>
              ) : null}
              <div className="p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[10px] text-[#8E9CAE] block">Mandal</span>
                <strong className="text-[#F5EFE0] whitespace-normal break-words">{selectedContact.mandalName}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[10px] text-[#8E9CAE] block">Village / Ward</span>
                <strong className="text-[#F5EFE0] whitespace-normal break-words">{selectedContact.villageName}</strong>
              </div>
            </div>

            {selectedContact.notes && (
              <div className="p-3 rounded-xl bg-[#131E2D] border border-[#D4A24C]/30 text-xs">
                <span className="text-[10px] uppercase font-bold text-[#D4A24C] block mb-1">Intelligence Notes</span>
                <p className="text-[#CBD5E1] leading-relaxed">&ldquo;{selectedContact.notes}&rdquo;</p>
              </div>
            )}

            <div className="pt-2 border-t border-[#223348] flex flex-wrap items-center justify-end gap-2">
              {canManageContacts && (
                <>
                  <button
                    type="button"
                    onClick={() => openEdit(selectedContact)}
                    className="px-4 py-2 rounded-xl bg-[#131E2D] hover:bg-[#1E3048] border border-[#D4A24C]/40 text-[#D4A24C] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteContact(selectedContact)}
                    className="px-4 py-2 rounded-xl bg-[#131E2D] hover:bg-rose-950/50 border border-[#223348] text-[#CBD5E1] hover:text-rose-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
              {!hidePhone && (
                <>
              <a
                href={`https://wa.me/${selectedContact.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open WhatsApp</span>
              </a>
              <a
                href={`tel:${selectedContact.phone}`}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] text-xs font-bold flex items-center gap-1.5"
              >
                <Phone className="w-4 h-4" />
                <span>Call Now</span>
              </a>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
