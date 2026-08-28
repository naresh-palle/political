import React, { useState } from "react";
import { VolunteerSquad, VolunteerTask } from "../../types";
import { MOCK_VOLUNTEER_SQUADS, MOCK_VOLUNTEER_TASKS } from "../../services/mockData";
import {
  Users,
  Share2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Send,
  Plus,
  Flame,
  Award,
  ExternalLink,
  MessageCircle
} from "lucide-react";

export const VolunteerMonitoring: React.FC = () => {
  const [squads, setSquads] = useState<VolunteerSquad[]>(MOCK_VOLUNTEER_SQUADS);
  const [tasks, setTasks] = useState<VolunteerTask[]>(MOCK_VOLUNTEER_TASKS);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState<VolunteerTask["type"]>("WhatsApp Dispatch");
  const [newSquadName, setNewSquadName] = useState("Kadapa North Digital Command");
  const [newTaskTarget, setNewTaskTarget] = useState(500);

  const [copiedTask, setCopiedTask] = useState<string | null>(null);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    const task: VolunteerTask = {
      id: `tsk-${Date.now()}`,
      title: newTaskTitle,
      type: newTaskType,
      assignedSquad: newSquadName,
      deadline: "Today, 08:00 PM",
      targetCount: Number(newTaskTarget),
      completedCount: 0,
      priority: "High"
    };

    setTasks([task, ...tasks]);
    setIsNewTaskModalOpen(false);
    setNewTaskTitle("");
  };

  const handleShareOnWhatsApp = (text: string, id: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setCopiedTask(id);
    setTimeout(() => setCopiedTask(null), 2000);
  };

  const totalVolunteers = squads.reduce((acc, s) => acc + s.activeMembersCount, 0);
  const totalDailyShares = squads.reduce((acc, s) => acc + s.dailyWhatsAppShares, 0);
  const totalCoveredHouseholds = squads.reduce((acc, s) => acc + s.reachedHouseholds, 0);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E3D8] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-semibold uppercase tracking-widest text-[#787B88]">
            <span>Platform Pillar 3</span>
            <span>/</span>
            <span className="text-[#112233]">Grassroots Amplification</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal mt-1">
            Social Media Volunteer Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-[#626674]">
            Real-time cadre mobilization, WhatsApp broadcast squads, and anti-misinformation response grid across Kadapa AC.
          </p>
        </div>

        <button
          onClick={() => setIsNewTaskModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 bg-[#112233] text-[#FBFBF9] text-xs font-semibold rounded-lg hover:bg-[#07121F] transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Dispatch Campaign Task
        </button>
      </div>

      {/* Real-time KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E0DED5] rounded-xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B] block">
            Active Verified Volunteers
          </span>
          <div className="font-editorial text-3xl font-bold text-[#112233] mt-1 font-mono-data">
            {totalVolunteers}
          </div>
          <span className="text-[11px] text-[#717582] mt-1 block">
            Organized into 3 tactical squads
          </span>
        </div>

        <div className="bg-white border border-[#E0DED5] rounded-xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B] block">
            Daily WhatsApp Dispatches
          </span>
          <div className="font-editorial text-3xl font-bold text-[#0F766E] mt-1 font-mono-data">
            {totalDailyShares.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#0F766E] font-medium mt-1 block">
            Forwarded across resident groups
          </span>
        </div>

        <div className="bg-white border border-[#E0DED5] rounded-xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B] block">
            Households Canvassed
          </span>
          <div className="font-editorial text-3xl font-bold text-[#112233] mt-1 font-mono-data">
            {totalCoveredHouseholds.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#717582] mt-1 block">
            74.8% of target constituency base
          </span>
        </div>

        <div className="bg-white border border-[#E0DED5] rounded-xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8E9B] block">
            Cadre Amplification Index
          </span>
          <div className="font-editorial text-3xl font-bold text-amber-700 mt-1 font-mono-data">
            89.4%
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            High organic peer relay rate
          </span>
        </div>
      </div>

      {/* Squad Status Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#112233]">
            Ward Mobilization Squads
          </h3>
          <span className="text-xs text-[#7B7F8C]">Live Cadre Readiness</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {squads.map((sq) => (
            <div key={sq.id} className="bg-white border border-[#E0DED5] rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#112233]">{sq.name}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    sq.status === "High Surge"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}>
                    {sq.status}
                  </span>
                </div>

                <div className="text-xs text-[#6B6F7D]">
                  Zone: <span className="font-medium text-[#112233]">{sq.wardZone}</span> · Lead: <span className="font-medium text-[#112233]">{sq.leaderName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-[#F2F1EA]">
                  <div>
                    <span className="text-[10px] uppercase text-[#888C99] block">Members</span>
                    <span className="font-mono-data font-bold text-[#112233]">{sq.activeMembersCount} Cadres</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#888C99] block">Shares / Day</span>
                    <span className="font-mono-data font-bold text-[#0F766E]">{sq.dailyWhatsAppShares}</span>
                  </div>
                </div>
              </div>

              {/* Household progress bar */}
              <div className="space-y-1 pt-2 border-t border-[#ECEAE2]">
                <div className="flex justify-between text-[11px] text-[#696D7A]">
                  <span>Voter Reach Progress</span>
                  <span className="font-mono-data font-semibold text-[#112233]">
                    {Math.round((sq.reachedHouseholds / sq.targetVoterHouseholds) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F2F1EA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#112233] rounded-full"
                    style={{ width: `${(sq.reachedHouseholds / sq.targetVoterHouseholds) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anti-Misinformation Fast Response Unit */}
      <div className="bg-white border-2 border-rose-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4EBEB] pb-3">
          <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-700" />
            <span>Anti-Disinformation & Fact-Check Radar</span>
          </div>
          <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            1 Active Smear Flagged
          </span>
        </div>

        <div className="bg-[#FFFDFD] border border-rose-100 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold bg-rose-600 text-white px-2 py-0.5 rounded">
                False Claim Detected
              </span>
              <span className="text-xs text-[#7B7F8C]">Opposition WhatsApp Forward circulating in Ward 04 & 05</span>
            </div>
            <h4 className="text-sm font-semibold text-[#112233]">
              "Claim that drinking water canal project is being diverted away from Kadapa."
            </h4>
            <p className="text-xs text-emerald-800 font-medium">
              ✓ Verified Counter-Fact: ECI approved work orders confirm 100% water allocated directly to Kadapa AC municipal supply.
            </p>
          </div>

          <button
            onClick={() => handleShareOnWhatsApp("FACT CHECK: Claims about water canal diversion are completely false. Official government work order confirms 100% water allocation to Kadapa AC. Verified details: https://candidatea.in/water-factcheck", "fact-1")}
            className="inline-flex items-center px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            <span>{copiedTask === "fact-1" ? "Opening WhatsApp..." : "1-Click Squad Counter Blast"}</span>
          </button>
        </div>
      </div>

      {/* Task Dispatches List */}
      <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-[#112233]">
              Active Campaign Directives
            </h3>
            <span className="text-xs text-[#787C8A]">Real-time cadre completion tracking</span>
          </div>
          <span className="text-xs font-mono-data text-[#888C98]">Target Completion</span>
        </div>

        <div className="space-y-3">
          {tasks.map((tsk) => {
            const percent = Math.min(Math.round((tsk.completedCount / tsk.targetCount) * 100), 100);
            return (
              <div key={tsk.id} className="p-4 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#112233] text-white rounded">
                      {tsk.type}
                    </span>
                    <span className="text-xs text-[#717582]">Assigned to: {tsk.assignedSquad}</span>
                    <span className="text-xs text-[#8A8E9B]">· Due: {tsk.deadline}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#112233]">
                    {tsk.title}
                  </h4>
                </div>

                <div className="flex items-center space-x-4 min-w-[200px]">
                  <div className="flex-1 text-right">
                    <span className="text-xs font-mono-data font-bold text-[#112233]">
                      {tsk.completedCount} / {tsk.targetCount}
                    </span>
                    <div className="w-full h-2 bg-[#E2E0D5] rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-[#0F766E] rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={() => handleShareOnWhatsApp(`Campaign Action Directive: ${tsk.title}. Please broadcast to your ward groups immediately!`, tsk.id)}
                    className="p-2 bg-white border border-[#D5D3C8] rounded-lg hover:bg-[#EFEFE8] text-[#112233] cursor-pointer"
                    title="Share task to WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E0DED5] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
              <h3 className="font-editorial text-xl font-normal text-[#112233]">
                Dispatch Volunteer Directive
              </h3>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-xs font-bold text-[#717582]">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#555866]">Directive Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broadcast development manifesto video to Ward 1-8"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#555866]">Task Type</label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                  >
                    <option value="WhatsApp Dispatch">WhatsApp Dispatch</option>
                    <option value="Door-to-Door Canvassing">Door-to-Door</option>
                    <option value="Rally Mobilization">Rally Mobilization</option>
                    <option value="Misinformation Fact-Check">Fact-Check</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#555866]">Target Shares / Houses</label>
                  <input
                    type="number"
                    value={newTaskTarget}
                    onChange={(e) => setNewTaskTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#555866]">Assign to Squad</label>
                <select
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                >
                  <option value="Kadapa North Digital Command">Kadapa North Digital Command</option>
                  <option value="Central Bazaar Grassroots Unit">Central Bazaar Grassroots Unit</option>
                  <option value="South Industrial & Kopparthy Wing">South Industrial & Kopparthy Wing</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#ECEAE2]">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5A5E6B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#112233] text-white text-xs font-semibold rounded-lg hover:bg-[#07121F]"
                >
                  Dispatch Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
