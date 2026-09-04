import React, { useState, useMemo, useEffect } from "react";
import { UserProfile } from "../../types";
import {
  Search,
  Users2,
  Phone,
  MessageCircle,
  MapPin,
  Building2,
  Plus,
  Download,
  Upload,
  Filter,
  UserCheck,
  Shield,
  Briefcase,
  Layers,
  Sparkles,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  UserPlus,
  HeartHandshake,
  Landmark,
  GraduationCap,
  Home
} from "lucide-react";

export interface ContactRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category: "INFLUENCER" | "CADRE" | "CITIZEN" | "GOVT_OFFICIAL" | "DWCRA_LEAD" | "YOUTH_LEADER";
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
    villageId: "VIL-BNG-TWN-01",
    villageName: "Banaganapalle Sector 1",
    voterId: "AP/140/012/10001",
    age: 48,
    gender: "Male",
    politicalAlignment: "OFFICIAL",
    occupation: "Executive Engineer - Govt Operations",
    grievanceCount: 5,
    lastContactedDate: "2026-09-04",
    notes: "Verified Live Department Contact for Panchayat Raj dispatches.",
    assignedVolunteerName: "Demo Manager"
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
    villageName: "Banaganapalle Sector 2",
    voterId: "AP/140/012/10002",
    age: 45,
    gender: "Male",
    politicalAlignment: "OFFICIAL",
    occupation: "Chief Engineer - RWS Water Supply",
    grievanceCount: 3,
    lastContactedDate: "2026-09-04",
    notes: "Verified Live Department Contact for Rural Water Supply Scheme dispatches.",
    assignedVolunteerName: "Demo Manager"
  },
  {
    id: "cnt-bng-001",
    name: "K. Subba Rayudu",
    phone: "+91 98480 33441",
    email: "subba.rayudu@gmail.com",
    category: "INFLUENCER",
    designation: "Ex-Sarpanch & Rythu Sangham President",
    mandalId: "MDL-BNG-TWN",
    mandalName: "Banaganapalle Town",
    villageId: "VIL-BNG-TWN-01",
    villageName: "Banaganapalle Town Wards 1-10",
    voterId: "AP/140/012/98341",
    age: 56,
    gender: "Male",
    politicalAlignment: "STRONG_SUPPORTER",
    occupation: "Agriculture & Landowner",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    grievanceCount: 2,
    lastContactedDate: "2026-08-29",
    notes: "Key opinion leader in Town Sector. Influences 250+ farmer households.",
    assignedVolunteerName: "Demo Volunteer"
  },
  {
    id: "cnt-bng-002",
    name: "Smt. Chennamma Naidu",
    phone: "+91 94401 56789",
    category: "DWCRA_LEAD",
    designation: "Village Organization (VO) President",
    mandalId: "MDL-BNG-RUR",
    mandalName: "Banaganapalle Mandal",
    villageId: "VIL-BNG-YGT",
    villageName: "Yaganti Sector",
    voterId: "AP/140/014/45120",
    age: 44,
    gender: "Female",
    politicalAlignment: "STRONG_SUPPORTER",
    occupation: "Self-Help Group Leader & Dairy",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    grievanceCount: 3,
    lastContactedDate: "2026-08-30",
    notes: "Heads 18 DWCRA self-help groups. Actively coordinates welfare schemes.",
    assignedVolunteerName: "Demo Volunteer"
  },
  {
    id: "cnt-bng-003",
    name: "Dr. P. Suresh Kumar, M.D.",
    phone: "+91 98850 77123",
    category: "GOVT_OFFICIAL",
    designation: "Medical Officer · Primary Health Center",
    mandalId: "MDL-BNG-TWN",
    mandalName: "Banaganapalle Town",
    villageId: "VIL-BNG-TWN-01",
    villageName: "Hospital Road Ward 3",
    age: 42,
    gender: "Male",
    politicalAlignment: "OFFICIAL",
    occupation: "Civil Surgeon & Govt Medical Officer",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    grievanceCount: 1,
    lastContactedDate: "2026-08-25",
    notes: "Nodal officer for constituency medical camps & Janani Suraksha."
  },
  {
    id: "cnt-bng-004",
    name: "B. Venkateswarlu",
    phone: "+91 99890 23456",
    category: "CADRE",
    designation: "Booth Convener · Booth 142",
    mandalId: "MDL-KKL-TWN",
    mandalName: "Koilakuntla",
    villageId: "VIL-KKL-01",
    villageName: "Koilakuntla North Ward",
    voterId: "AP/140/018/88712",
    age: 32,
    gender: "Male",
    politicalAlignment: "STRONG_SUPPORTER",
    occupation: "Retail Merchant & Party Activist",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    grievanceCount: 1,
    lastContactedDate: "2026-08-31",
    notes: "Manages 1,100 voters in Booth 142. Very active on WhatsApp campaign broadcasts."
  },
  {
    id: "cnt-bng-005",
    name: "Sri M. Ramakrishna Reddy",
    phone: "+91 94901 88442",
    category: "INFLUENCER",
    designation: "Water Users Association (WUA) Chairman",
    mandalId: "MDL-OWK-RUR",
    mandalName: "Owk",
    villageId: "VIL-OWK-01",
    villageName: "Owk Reservoir Colony",
    voterId: "AP/140/022/12903",
    age: 62,
    gender: "Male",
    politicalAlignment: "NEUTRAL_LEANING",
    occupation: "Commercial Horticulture Farmer",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    grievanceCount: 2,
    lastContactedDate: "2026-08-27",
    notes: "Controls canal release distribution across 8 ayacut villages."
  },
  {
    id: "cnt-bng-006",
    name: "S. Fatima Begum",
    phone: "+91 98492 66311",
    category: "CITIZEN",
    designation: "Senior Citizen & DBT Beneficiary",
    mandalId: "MDL-BNG-TWN",
    mandalName: "Banaganapalle Town",
    villageId: "VIL-BNG-TWN-02",
    villageName: "Old Bus Stand Area",
    voterId: "AP/140/012/34812",
    age: 64,
    gender: "Female",
    politicalAlignment: "STRONG_SUPPORTER",
    occupation: "Pensioner",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    grievanceCount: 1,
    lastContactedDate: "2026-08-31",
    notes: "Widow pension beneficiary. Grateful for quick resolution of e-KYC issue.",
    assignedVolunteerName: "Demo Volunteer"
  },
  {
    id: "cnt-bng-007",
    name: "T. Narayana Murthy",
    phone: "+91 97011 44521",
    category: "CITIZEN",
    designation: "Fruit Transport Operators Association Member",
    mandalId: "MDL-SJM-RUR",
    mandalName: "Sanjamala",
    villageId: "VIL-SJM-01",
    villageName: "Sanjamala Main Village",
    voterId: "AP/140/031/76192",
    age: 48,
    gender: "Male",
    politicalAlignment: "NEUTRAL_LEANING",
    occupation: "Transport Business",
    grievanceCount: 1,
    lastContactedDate: "2026-08-30",
    notes: "Raised pothole cluster issue on Sanjamala bypass road."
  },
  {
    id: "cnt-bng-008",
    name: "Sri G. Venkatappa",
    phone: "+91 98851 33201",
    category: "INFLUENCER",
    designation: "Kolimigundla Grama Panchayat Elder",
    mandalId: "MDL-KLM-RUR",
    mandalName: "Kolimigundla",
    villageId: "VIL-KLM-01",
    villageName: "Belum Caves Sector",
    voterId: "AP/140/040/99120",
    age: 59,
    gender: "Male",
    politicalAlignment: "CRITICAL_NEEDS_REACH",
    occupation: "Mining Contractor & Farmer",
    grievanceCount: 1,
    lastContactedDate: "2026-08-20",
    notes: "High influence among lime-stone workers. Requires direct MLA meeting on drinking water pipeline."
  },
  {
    id: "cnt-bng-009",
    name: "K. Suresh, Executive Engineer",
    phone: "+91 94408 12300",
    category: "GOVT_OFFICIAL",
    designation: "Executive Engineer · Roads & Buildings (R&B)",
    mandalId: "MDL-BNG-TWN",
    mandalName: "Banaganapalle Town",
    villageId: "VIL-BNG-TWN-01",
    villageName: "R&B Division Camp Office",
    gender: "Male",
    politicalAlignment: "OFFICIAL",
    occupation: "Civil Engineer",
    grievanceCount: 0,
    lastContactedDate: "2026-08-30",
    notes: "Nodal authority for sanctioning highway pothole repair works."
  },
  {
    id: "cnt-bng-010",
    name: "P. Rakesh Yadav",
    phone: "+91 98660 99412",
    category: "YOUTH_LEADER",
    designation: "Constituency Youth Wing Incharge",
    mandalId: "MDL-BNG-TWN",
    mandalName: "Banaganapalle Town",
    villageId: "VIL-BNG-TWN-01",
    villageName: "Degree College Road",
    voterId: "AP/140/012/11293",
    age: 26,
    gender: "Male",
    politicalAlignment: "STRONG_SUPPORTER",
    occupation: "Graduate Student & Social Worker",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    grievanceCount: 0,
    lastContactedDate: "2026-08-31",
    notes: "Coordinates 50+ college volunteers for youth rallies and sports tournaments."
  }
];

const STORAGE_KEY = "leaders_lens_contacts_db";

export const ContactDatabase: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
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

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterMandal, setFilterMandal] = useState<string>("ALL");
  const [filterAlignment, setFilterAlignment] = useState<string>("ALL");
  const [filterGender, setFilterGender] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);

  // New Contact Form State
  const [newContact, setNewContact] = useState<Partial<ContactRecord>>({
    name: "",
    phone: "+91 ",
    email: "",
    category: "CITIZEN",
    designation: "",
    mandalName: "Banaganapalle Town",
    mandalId: "MDL-BNG-TWN",
    villageName: "Ward 1",
    villageId: "VIL-01",
    politicalAlignment: "STRONG_SUPPORTER",
    occupation: "",
    gender: "Male",
    age: 35,
    notes: ""
  });

  // Save to local storage whenever contacts change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (e) {
      console.error(e);
    }
  }, [contacts]);

  // Unique Mandals list
  const mandalsList = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach((c) => {
      if (c.mandalName) map.set(c.mandalName, c.mandalId);
    });
    return Array.from(map.entries()).map(([name, id]) => ({ name, id }));
  }, [contacts]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (filterCategory !== "ALL" && c.category !== filterCategory) return false;
      if (filterMandal !== "ALL" && c.mandalName !== filterMandal && c.mandalId !== filterMandal) return false;
      if (filterAlignment !== "ALL" && c.politicalAlignment !== filterAlignment) return false;
      if (filterGender !== "ALL" && c.gender !== filterGender) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.mandalName.toLowerCase().includes(q) ||
          c.villageName.toLowerCase().includes(q) ||
          (c.designation || "").toLowerCase().includes(q) ||
          (c.occupation || "").toLowerCase().includes(q) ||
          (c.voterId || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contacts, filterCategory, filterMandal, filterAlignment, filterGender, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const influencers = contacts.filter((c) => c.category === "INFLUENCER").length;
    const cadres = contacts.filter((c) => c.category === "CADRE" || c.category === "YOUTH_LEADER").length;
    const officials = contacts.filter((c) => c.category === "GOVT_OFFICIAL").length;
    const citizens = contacts.filter((c) => c.category === "CITIZEN" || c.category === "DWCRA_LEAD").length;
    const supporters = contacts.filter((c) => c.politicalAlignment === "STRONG_SUPPORTER").length;

    return {
      total: contacts.length,
      influencers,
      cadres,
      officials,
      citizens,
      supporters
    };
  }, [contacts]);

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;

    const created: ContactRecord = {
      id: `cnt-${Date.now().toString(16)}`,
      name: newContact.name,
      phone: newContact.phone,
      email: newContact.email || undefined,
      category: (newContact.category as any) || "CITIZEN",
      designation: newContact.designation || "Citizen Resident",
      mandalId: newContact.mandalId || "MDL-BNG-TWN",
      mandalName: newContact.mandalName || "Banaganapalle Town",
      villageId: newContact.villageId || "VIL-01",
      villageName: newContact.villageName || "Town Ward 1",
      voterId: newContact.voterId || undefined,
      age: Number(newContact.age) || 35,
      gender: (newContact.gender as any) || "Male",
      politicalAlignment: (newContact.politicalAlignment as any) || "STRONG_SUPPORTER",
      occupation: newContact.occupation || "Resident",
      grievanceCount: 0,
      notes: newContact.notes || "",
      lastContactedDate: new Date().toISOString().split("T")[0]
    };

    setContacts((prev) => [created, ...prev]);
    setIsAddModalOpen(false);
    setNewContact({
      name: "",
      phone: "+91 ",
      email: "",
      category: "CITIZEN",
      designation: "",
      mandalName: "Banaganapalle Town",
      mandalId: "MDL-BNG-TWN",
      villageName: "Ward 1",
      villageId: "VIL-01",
      politicalAlignment: "STRONG_SUPPORTER",
      occupation: "",
      gender: "Male",
      age: 35,
      notes: ""
    });
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Phone",
      "Category",
      "Designation",
      "Mandal",
      "Village",
      "Political Alignment",
      "Occupation",
      "Gender",
      "Age",
      "Voter ID",
      "Grievances Count",
      "Notes"
    ];

    const rows = filteredContacts.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.phone}"`,
      c.category,
      `"${c.designation}"`,
      `"${c.mandalName}"`,
      `"${c.villageName}"`,
      c.politicalAlignment,
      `"${c.occupation}"`,
      c.gender,
      c.age || "",
      c.voterId || "",
      c.grievanceCount,
      `"${(c.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LeadersLens_Contact_Database_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadge = (cat: ContactRecord["category"]) => {
    switch (cat) {
      case "INFLUENCER":
        return <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10.5px] font-bold">👑 Influencer</span>;
      case "CADRE":
        return <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10.5px] font-bold">🚩 Party Cadre</span>;
      case "GOVT_OFFICIAL":
        return <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10.5px] font-bold">🏛️ Govt Officer</span>;
      case "DWCRA_LEAD":
        return <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10.5px] font-bold">👩 DWCRA Lead</span>;
      case "YOUTH_LEADER":
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold">⚡ Youth Wing</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-[#223348] text-[#CBD5E1] border border-[#223348] text-[10.5px] font-medium">🧑 Citizen</span>;
    }
  };

  const getAlignmentBadge = (align: ContactRecord["politicalAlignment"]) => {
    switch (align) {
      case "STRONG_SUPPORTER":
        return <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">🟢 Strong Supporter</span>;
      case "NEUTRAL_LEANING":
        return <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">🟡 Neutral / Leaning</span>;
      case "OFFICIAL":
        return <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-600 text-[10px] font-semibold">🏛️ Non-Partisan Official</span>;
      case "CRITICAL_NEEDS_REACH":
        return <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">🟠 Needs Engagement</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6 space-y-5 animate-fadeIn">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#D4A24C]/40 shadow-xl">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D97724] to-[#B45309] flex items-center justify-center text-[#0B131E] shadow-md shrink-0">
            <Users2 className="w-6 h-6" />
          </div>
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
              Verified Citizens, Community Influencers, Booth Agents, Nodal Officers & DWCRA Leaders
            </p>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#0B131E] border border-[#223348] hover:border-[#D4A24C]/50 text-[#CBD5E1] hover:text-[#F5EFE0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#D4A24C]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] hover:brightness-110 text-[#0B131E] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Contact</span>
          </button>
        </div>
      </div>

      {/* 2. Top Strategic KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0E1724]/80 border border-[#223348] backdrop-blur-xl">
          <span className="text-[10px] text-[#8E9CAE] uppercase block font-semibold">Total Verified</span>
          <strong className="font-display text-2xl text-[#F5EFE0] block mt-0.5">{stats.total}</strong>
          <span className="text-[9.5px] text-[#D4A24C] block mt-0.5">100% In Constituency</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0E1724]/80 border border-[#223348] backdrop-blur-xl">
          <span className="text-[10px] text-amber-300/80 uppercase block font-semibold">Influencers</span>
          <strong className="font-display text-2xl text-amber-400 block mt-0.5">{stats.influencers}</strong>
          <span className="text-[9.5px] text-[#8E9CAE] block mt-0.5">Sarpanches & Elders</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0E1724]/80 border border-[#223348] backdrop-blur-xl">
          <span className="text-[10px] text-blue-300/80 uppercase block font-semibold">Field Cadres</span>
          <strong className="font-display text-2xl text-blue-400 block mt-0.5">{stats.cadres}</strong>
          <span className="text-[9.5px] text-[#8E9CAE] block mt-0.5">Booth Conveners</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0E1724]/80 border border-[#223348] backdrop-blur-xl">
          <span className="text-[10px] text-purple-300/80 uppercase block font-semibold">Govt Officers</span>
          <strong className="font-display text-2xl text-purple-400 block mt-0.5">{stats.officials}</strong>
          <span className="text-[9.5px] text-[#8E9CAE] block mt-0.5">Department Heads</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0E1724]/80 border border-[#223348] backdrop-blur-xl">
          <span className="text-[10px] text-pink-300/80 uppercase block font-semibold">Citizens & DWCRA</span>
          <strong className="font-display text-2xl text-pink-400 block mt-0.5">{stats.citizens}</strong>
          <span className="text-[9.5px] text-[#8E9CAE] block mt-0.5">Petitioners & Leads</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0E1724]/80 border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-xl">
          <span className="text-[10px] text-emerald-300 uppercase block font-semibold">Strong Supporters</span>
          <strong className="font-display text-2xl text-emerald-400 block mt-0.5">{stats.supporters}</strong>
          <span className="text-[9.5px] text-emerald-300/80 block mt-0.5">
            {stats.total > 0 ? Math.round((stats.supporters / stats.total) * 100) : 0}% Active Base
          </span>
        </div>
      </div>

      {/* 3. Filter & Search Master Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0E1724]/90 backdrop-blur-xl border border-[#223348] shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9CAE]" />
            <input
              type="text"
              placeholder="Search by name, phone, village, designation, voter ID..."
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
              Showing <strong className="text-[#D4A24C]">{filteredContacts.length}</strong> of {contacts.length} contacts
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Category: All Types</option>
              <option value="INFLUENCER">👑 Community Influencer</option>
              <option value="CADRE">🚩 Party Cadre</option>
              <option value="GOVT_OFFICIAL">🏛️ Govt Nodal Officer</option>
              <option value="DWCRA_LEAD">👩 DWCRA Leader</option>
              <option value="YOUTH_LEADER">⚡ Youth Wing</option>
              <option value="CITIZEN">🧑 Citizen Petitioner</option>
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
              value={filterAlignment}
              onChange={(e) => setFilterAlignment(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Political Stance: All</option>
              <option value="STRONG_SUPPORTER">🟢 Strong Supporter</option>
              <option value="NEUTRAL_LEANING">🟡 Neutral / Leaning</option>
              <option value="OFFICIAL">🏛️ Official / Non-Partisan</option>
              <option value="CRITICAL_NEEDS_REACH">🟠 Needs Engagement</option>
            </select>
          </div>

          <div>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full bg-[#0B131E] border border-[#223348] rounded-xl px-2.5 py-2 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
            >
              <option value="ALL">Gender: All</option>
              <option value="Male">👨 Male</option>
              <option value="Female">👩 Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Main Contact Grid / Table List */}
      {viewMode === "GRID" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 rounded-2xl bg-[#0E1724]/90 border border-[#223348] hover:border-[#D4A24C]/60 transition-all shadow-lg backdrop-blur-xl flex flex-col justify-between space-y-3.5 group"
            >
              {/* Top: Avatar, Name & Category */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {contact.avatarUrl ? (
                      <img
                        src={contact.avatarUrl}
                        alt={contact.name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#D4A24C]/40 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#131E2D] border border-[#223348] text-[#D4A24C] font-bold text-base flex items-center justify-center shrink-0">
                        {contact.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-[#F5EFE0] group-hover:text-[#D4A24C] transition-colors truncate">
                        {contact.name}
                      </h3>
                      <p className="text-xs text-[#CBD5E1] truncate">{contact.designation}</p>
                    </div>
                  </div>

                  {getCategoryBadge(contact.category)}
                </div>

                {/* Badges & Meta */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px]">
                  {getAlignmentBadge(contact.politicalAlignment)}
                  {contact.voterId && (
                    <span className="px-2 py-0.5 rounded-full bg-[#131E2D] text-[#8E9CAE] border border-[#223348] font-mono text-[10px]">
                      {contact.voterId}
                    </span>
                  )}
                </div>

                {/* Mandal & Village */}
                <div className="pt-2 space-y-1 text-xs text-[#8E9CAE]">
                  <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                    <Building2 className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                    <span className="truncate">{contact.mandalName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                    <MapPin className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
                    <span className="truncate">{contact.villageName}</span>
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
                  {/* WhatsApp Action */}
                  <a
                    href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=Namaste%20${encodeURIComponent(contact.name)}%20garu,%20greetings%20from%20Leader%27s%20Lens%20Office.`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="Send WhatsApp Message"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">WhatsApp</span>
                  </a>

                  {/* Direct Phone Call Action */}
                  <a
                    href={`tel:${contact.phone}`}
                    className="p-2 rounded-xl bg-[#131E2D] hover:bg-[#1E3048] border border-[#223348] text-[#D4A24C] text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="Direct Phone Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-mono">{contact.phone}</span>
                  </a>
                </div>

                <button
                  onClick={() => setSelectedContact(contact)}
                  className="p-2 px-2.5 rounded-xl bg-[#0B131E] hover:bg-[#131E2D] border border-[#223348] text-[#CBD5E1] hover:text-[#F5EFE0] text-xs transition-all cursor-pointer"
                  title="View Full Profile"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
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
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Political Stance</th>
                <th className="p-3.5">Phone / Connect</th>
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
                    <span className="text-[#F5EFE0] block">{c.mandalName}</span>
                    <span className="text-[11px] text-[#8E9CAE] block">{c.villageName}</span>
                  </td>
                  <td className="p-3.5">{getAlignmentBadge(c.politicalAlignment)}</td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        <MessageCircle className="w-3 h-3" />
                        {c.phone}
                      </a>
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedContact(c)}
                      className="px-2.5 py-1 rounded-lg bg-[#131E2D] hover:bg-[#1E3048] border border-[#223348] text-[#D4A24C] text-[11px] font-semibold cursor-pointer"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-[#0E1724] border border-[#D4A24C]/40 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#223348] flex items-center justify-between bg-[#0B131E]">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-[#D4A24C]" />
                <h3 className="font-display text-lg text-[#F5EFE0] font-bold">Add New Constituency Contact</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
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
                    className="w-full bg-[#0B131E] border border-[#223348] rounded-xl p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Category</label>
                  <select
                    value={newContact.category}
                    onChange={(e) => setNewContact({ ...newContact, category: e.target.value as any })}
                    className="w-full bg-[#0B131E] border border-[#223348] rounded-xl p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
                  >
                    <option value="INFLUENCER">👑 Community Influencer</option>
                    <option value="CADRE">🚩 Party Cadre</option>
                    <option value="GOVT_OFFICIAL">🏛️ Govt Nodal Officer</option>
                    <option value="DWCRA_LEAD">👩 DWCRA Leader</option>
                    <option value="YOUTH_LEADER">⚡ Youth Wing</option>
                    <option value="CITIZEN">🧑 Citizen Resident</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Designation / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Ex-Sarpanch / Mandal Incharge"
                    value={newContact.designation}
                    onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })}
                    className="w-full bg-[#0B131E] border border-[#223348] rounded-xl p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Mandal</label>
                  <input
                    type="text"
                    placeholder="e.g. Banaganapalle Town"
                    value={newContact.mandalName}
                    onChange={(e) => setNewContact({ ...newContact, mandalName: e.target.value })}
                    className="w-full bg-[#0B131E] border border-[#223348] rounded-xl p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Village / Ward</label>
                  <input
                    type="text"
                    placeholder="e.g. Ward 4 / Yaganti Sector"
                    value={newContact.villageName}
                    onChange={(e) => setNewContact({ ...newContact, villageName: e.target.value })}
                    className="w-full bg-[#0B131E] border border-[#223348] rounded-xl p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Political Stance</label>
                  <select
                    value={newContact.politicalAlignment}
                    onChange={(e) => setNewContact({ ...newContact, politicalAlignment: e.target.value as any })}
                    className="w-full bg-[#0B131E] border border-[#223348] rounded-xl p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
                  >
                    <option value="STRONG_SUPPORTER">🟢 Strong Supporter</option>
                    <option value="NEUTRAL_LEANING">🟡 Neutral / Leaning</option>
                    <option value="OFFICIAL">🏛️ Official</option>
                    <option value="CRITICAL_NEEDS_REACH">🟠 Needs Engagement</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Gender</label>
                  <select
                    value={newContact.gender}
                    onChange={(e) => setNewContact({ ...newContact, gender: e.target.value as any })}
                    className="w-full bg-[#0B131E] border border-[#223348] rounded-xl p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8E9CAE] block mb-1 font-medium">Age</label>
                  <input
                    type="number"
                    value={newContact.age}
                    onChange={(e) => setNewContact({ ...newContact, age: Number(e.target.value) })}
                    className="w-full bg-[#0B131E] border border-[#223348] rounded-xl p-2.5 text-[#F5EFE0] focus:border-[#D4A24C] outline-none"
                  />
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0B131E] border border-[#223348] text-[#CBD5E1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] text-xs font-bold shadow-md hover:brightness-110"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Contact Details Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0E1724] border border-[#D4A24C]/40 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-[#223348] pb-3">
              <div className="flex items-center gap-3">
                {selectedContact.avatarUrl ? (
                  <img
                    src={selectedContact.avatarUrl}
                    alt={selectedContact.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4A24C] shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#131E2D] border border-[#D4A24C] text-[#D4A24C] font-bold text-xl flex items-center justify-center shrink-0">
                    {selectedContact.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-lg font-bold text-[#F5EFE0]">{selectedContact.name}</h3>
                  <p className="text-xs text-[#CBD5E1]">{selectedContact.designation}</p>
                  <div className="mt-1">{getCategoryBadge(selectedContact.category)}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-1 rounded-lg hover:bg-[#131E2D] text-[#8E9CAE] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[10px] text-[#8E9CAE] block">Phone</span>
                <strong className="text-[#F5EFE0] font-mono">{selectedContact.phone}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[10px] text-[#8E9CAE] block">Political Stance</span>
                <div className="mt-0.5">{getAlignmentBadge(selectedContact.politicalAlignment)}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[10px] text-[#8E9CAE] block">Mandal</span>
                <strong className="text-[#F5EFE0]">{selectedContact.mandalName}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B131E] border border-[#223348]">
                <span className="text-[10px] text-[#8E9CAE] block">Village / Ward</span>
                <strong className="text-[#F5EFE0]">{selectedContact.villageName}</strong>
              </div>
            </div>

            {selectedContact.notes && (
              <div className="p-3 rounded-xl bg-[#131E2D] border border-[#D4A24C]/30 text-xs">
                <span className="text-[10px] uppercase font-bold text-[#D4A24C] block mb-1">Intelligence Notes</span>
                <p className="text-[#CBD5E1] leading-relaxed">&ldquo;{selectedContact.notes}&rdquo;</p>
              </div>
            )}

            <div className="pt-2 border-t border-[#223348] flex items-center justify-end gap-2">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
