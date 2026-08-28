import React, { useState } from "react";
import { GrievanceItem, GrievanceUrgency, GrievanceStatus } from "../../types";
import { MOCK_GRIEVANCES } from "../../services/mockData";
import {
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  Plus,
  ArrowUpRight,
  Phone,
  MapPin,
  Send,
  UserCheck,
  Sparkles
} from "lucide-react";

export const GrievanceManagement: React.FC = () => {
  const [grievances, setGrievances] = useState<GrievanceItem[]>(MOCK_GRIEVANCES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [activeTicket, setActiveTicket] = useState<GrievanceItem | null>(MOCK_GRIEVANCES[0]);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  // New Ticket Form State
  const [newCitizenName, setNewCitizenName] = useState("");
  const [newCitizenPhone, setNewCitizenPhone] = useState("");
  const [newWard, setNewWard] = useState("Ward 14 (Old City)");
  const [newCategory, setNewCategory] = useState<GrievanceItem["category"]>("Water Supply");
  const [newUrgency, setNewUrgency] = useState<GrievanceUrgency>("High");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newResolutionNote, setNewResolutionNote] = useState("");

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCitizenName || !newSubject) return;

    const newTicket: GrievanceItem = {
      id: `grv-${Date.now()}`,
      ticketNumber: `KDP-GRV-2026-${Math.floor(100 + Math.random() * 900)}`,
      citizenName: newCitizenName,
      citizenPhone: newCitizenPhone || "+91 98480 *****",
      wardNumber: newWard,
      boothNumber: "Booth 094",
      category: newCategory,
      urgency: newUrgency,
      status: "Open",
      receivedVia: "WhatsApp",
      submittedDate: "Just Now",
      slaHoursRemaining: newUrgency === "Emergency" ? 6 : 24,
      assignedOfficer: "Assigned to Ward Liaison",
      subject: newSubject,
      description: newDescription || newSubject,
      notes: ["Intake logged via Constituency Fast-Track Portal."]
    };

    setGrievances([newTicket, ...grievances]);
    setActiveTicket(newTicket);
    setIsNewTicketModalOpen(false);
    setNewCitizenName("");
    setNewSubject("");
    setNewDescription("");
  };

  const handleUpdateStatus = (ticketId: string, status: GrievanceStatus) => {
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === ticketId) {
          const updated = { ...g, status };
          if (activeTicket?.id === ticketId) {
            setActiveTicket(updated);
          }
          return updated;
        }
        return g;
      })
    );
  };

  const handleAddNote = (ticketId: string) => {
    if (!newResolutionNote) return;
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id === ticketId) {
          const updated = {
            ...g,
            notes: [...g.notes, `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: ${newResolutionNote}`]
          };
          if (activeTicket?.id === ticketId) {
            setActiveTicket(updated);
          }
          return updated;
        }
        return g;
      })
    );
    setNewResolutionNote("");
  };

  const filteredGrievances = grievances.filter((g) => {
    const matchesSearch =
      g.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || g.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || g.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const emergencyCount = grievances.filter((g) => g.urgency === "Emergency" && g.status !== "Resolved").length;
  const inProgressCount = grievances.filter((g) => g.status === "In_Progress" || g.status === "Assigned").length;
  const resolvedCount = grievances.filter((g) => g.status === "Resolved").length;

  const getUrgencyBadge = (urgency: GrievanceUrgency) => {
    switch (urgency) {
      case "Emergency":
        return "bg-rose-100 text-rose-800 border-rose-300 animate-pulse";
      case "High":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Normal":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (status: GrievanceStatus) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "In_Progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Assigned":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Escalated":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E3D8] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-semibold uppercase tracking-widest text-[#787B88]">
            <span>Platform Pillar 2</span>
            <span>/</span>
            <span className="text-[#112233]">Constituency CRM</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal mt-1">
            Grievance Resolution Command
          </h1>
          <p className="text-xs sm:text-sm text-[#626674]">
            Constituency-wide citizen intake, AI priority triage, and field response tracking across 28 municipal wards.
          </p>
        </div>

        <button
          onClick={() => setIsNewTicketModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 bg-[#112233] text-[#FBFBF9] text-xs font-semibold rounded-lg hover:bg-[#07121F] transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Log Citizen Grievance
        </button>
      </div>

      {/* Real-time KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E0DED5] rounded-xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B] block">
            Total Logged Tickets
          </span>
          <div className="font-editorial text-3xl font-bold text-[#112233] mt-1 font-mono-data">
            {grievances.length + 842}
          </div>
          <span className="text-[11px] text-[#717582] mt-1 block">
            Across 28 Municipal Wards
          </span>
        </div>

        <div className="bg-white border-2 border-rose-300 bg-rose-50/40 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
              Emergency & High Urgency
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          </div>
          <div className="font-editorial text-3xl font-bold text-rose-700 mt-1 font-mono-data">
            {emergencyCount + 3}
          </div>
          <span className="text-[11px] text-rose-700 font-medium mt-1 block">
            Active fast-track escalation
          </span>
        </div>

        <div className="bg-white border border-[#E0DED5] rounded-xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B] block">
            Field Dispatch in Progress
          </span>
          <div className="font-editorial text-3xl font-bold text-blue-700 mt-1 font-mono-data">
            {inProgressCount + 18}
          </div>
          <span className="text-[11px] text-[#717582] mt-1 block">
            Assigned to local engineers
          </span>
        </div>

        <div className="bg-white border border-[#E0DED5] rounded-xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B] block">
            SLA Compliance Rate
          </span>
          <div className="font-editorial text-3xl font-bold text-emerald-700 mt-1 font-mono-data">
            94.8%
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Resolved within 48-hour SLA
          </span>
        </div>
      </div>

      {/* Main Filter & Search Bar */}
      <div className="bg-white border border-[#E0DED5] rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8C909E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket #, citizen name, phone, or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#112233]"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#797D8B]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg px-2.5 py-1.5 text-xs text-[#112233] cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Roads & Transit">Roads & Transit</option>
              <option value="Electricity">Electricity</option>
              <option value="Welfare Pension">Welfare Pension</option>
              <option value="Healthcare">Healthcare</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg px-2.5 py-1.5 text-xs text-[#112233] cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In_Progress">In Progress</option>
              <option value="Assigned">Assigned</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#797D8B] px-1">
            Grievance Inflow ({filteredGrievances.length})
          </div>

          <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
            {filteredGrievances.map((item) => {
              const isSelected = activeTicket?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTicket(item)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-2 border-[#112233] shadow-md ring-1 ring-[#112233]/10"
                      : "bg-white border-[#E0DED5] hover:border-[#CDC9BC]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono-data font-bold text-[#112233]">
                      {item.ticketNumber}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getUrgencyBadge(item.urgency)}`}>
                        {item.urgency}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-sm font-semibold text-[#112233] line-clamp-1">
                    {item.subject}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-[#717582] mt-2 pt-2 border-t border-[#F2F1EA]">
                    <span>{item.citizenName} · {item.wardNumber}</span>
                    <span className="font-mono-data">{item.submittedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Ticket Detail Inspector */}
        <div className="lg:col-span-7">
          {activeTicket ? (
            <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECEAE2] pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-data text-xs font-bold px-2 py-0.5 bg-[#112233] text-white rounded">
                      {activeTicket.ticketNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getUrgencyBadge(activeTicket.urgency)}`}>
                      {activeTicket.urgency} Urgency
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(activeTicket.status)}`}>
                      {activeTicket.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="font-editorial text-xl sm:text-2xl font-normal text-[#112233] mt-2">
                    {activeTicket.subject}
                  </h3>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center space-x-2">
                  {activeTicket.status !== "Resolved" ? (
                    <button
                      onClick={() => handleUpdateStatus(activeTicket.id, "Resolved")}
                      className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 transition-colors inline-flex items-center cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Mark Resolved
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(activeTicket.id, "In_Progress")}
                      className="px-3 py-1.5 bg-[#FAF9F5] border border-[#D5D3C8] text-xs font-semibold rounded-lg text-[#112233] hover:bg-[#EFEFE8]"
                    >
                      Reopen Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Citizen & Location Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#FAF9F5] rounded-lg border border-[#E5E3D8] text-xs">
                <div>
                  <span className="text-[10px] uppercase text-[#888C99] font-bold block">Citizen</span>
                  <span className="font-semibold text-[#112233]">{activeTicket.citizenName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#888C99] font-bold block">Phone</span>
                  <span className="font-mono-data text-[#112233]">{activeTicket.citizenPhone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#888C99] font-bold block">Ward & Booth</span>
                  <span className="text-[#112233]">{activeTicket.wardNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#888C99] font-bold block">Intake Channel</span>
                  <span className="font-medium text-[#0F766E]">{activeTicket.receivedVia}</span>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B]">
                  Grievance Description
                </span>
                <p className="text-[#2F323E] leading-relaxed p-3.5 bg-[#FAF9F5] rounded-lg border border-[#ECEAE2]">
                  {activeTicket.description}
                </p>
              </div>

              {/* Assigned Officer & Resolution Log */}
              <div className="space-y-3 pt-2 border-t border-[#ECEAE2] text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B]">
                    Field Liaison Notes & Action Trail
                  </span>
                  <span className="text-xs font-semibold text-[#112233]">
                    Assigned: {activeTicket.assignedOfficer}
                  </span>
                </div>

                <div className="space-y-2">
                  {activeTicket.notes.map((note, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-[#454957] bg-[#F7F6F1] p-2.5 rounded border border-[#E5E3D8]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#112233] mt-1.5 flex-shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>

                {/* Add Note Input */}
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add dispatch update or citizen feedback note..."
                    value={newResolutionNote}
                    onChange={(e) => setNewResolutionNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddNote(activeTicket.id)}
                    className="flex-1 px-3 py-2 text-xs bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#112233]"
                  />
                  <button
                    onClick={() => handleAddNote(activeTicket.id)}
                    className="px-3.5 py-2 bg-[#112233] text-white text-xs font-semibold rounded-lg hover:bg-[#07121F] transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E0DED5] rounded-xl p-12 text-center text-xs text-[#7A7E8C]">
              Select a grievance ticket to inspect details and assign field officers.
            </div>
          )}
        </div>
      </div>

      {/* Log New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E0DED5] rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B]">
                  Intake Registration
                </span>
                <h3 className="font-editorial text-2xl font-normal text-[#112233]">
                  Log Citizen Grievance
                </h3>
              </div>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                className="text-xs font-bold text-[#717582] hover:text-[#112233]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTicket} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#555866]">Citizen Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. K. Sudhakar Reddy"
                    value={newCitizenName}
                    onChange={(e) => setNewCitizenName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#555866]">Citizen Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98480 12345"
                    value={newCitizenPhone}
                    onChange={(e) => setNewCitizenPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#555866]">Municipal Ward</label>
                  <select
                    value={newWard}
                    onChange={(e) => setNewWard(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs cursor-pointer"
                  >
                    <option value="Ward 14 (Old City)">Ward 14 (Old City)</option>
                    <option value="Ward 07 (Gandhi Nagar)">Ward 07 (Gandhi Nagar)</option>
                    <option value="Ward 22 (Industrial Bypass)">Ward 22 (Industrial Bypass)</option>
                    <option value="Ward 03 (Railway Colony)">Ward 03 (Railway Colony)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#555866]">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs cursor-pointer"
                  >
                    <option value="Water Supply">Water Supply</option>
                    <option value="Roads & Transit">Roads & Transit</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Welfare Pension">Welfare Pension</option>
                    <option value="Healthcare">Healthcare</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#555866]">Issue Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drinking water pipeline leak on Main Bazaar road"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#555866]">Description / Citizen Voice Transcript</label>
                <textarea
                  rows={3}
                  placeholder="Detailed observations recorded from citizen call or WhatsApp audio dispatch..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#ECEAE2]">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5B5F6C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#112233] text-white text-xs font-semibold rounded-lg hover:bg-[#07121F]"
                >
                  Register Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
