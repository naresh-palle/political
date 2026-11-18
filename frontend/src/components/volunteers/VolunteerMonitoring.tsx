import React, { useState } from "react";
import { VolunteerSquad, VolunteerTask } from "../../types";
import { MOCK_VOLUNTEER_SQUADS, MOCK_VOLUNTEER_TASKS } from "../../services/mockData";
import {
  Share2,
  ShieldAlert,
  Plus,
  MessageCircle
} from "lucide-react";

const PANEL = "bg-[#0F2338] border border-[#D4A24C]/30 rounded-xl";
const LABEL = "text-[10px] font-bold uppercase tracking-wider text-[#D4A24C]";
const INPUT = "w-full px-3 py-2 bg-[#071322] border border-[#22405E] rounded-lg text-xs text-[#F5EFE0] placeholder:text-[#8E9CAE]";

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
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn text-[#F5EFE0]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D4A24C]/30 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-semibold uppercase tracking-widest text-[#8E9CAE]">
            <span>Platform Pillar 3</span>
            <span>/</span>
            <span className="text-[#D4A24C]">Grassroots Amplification</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#F5EFE0] font-normal mt-1">
            Social Media Volunteer Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-[#CBD5E1]">
            Real-time cadre mobilization, WhatsApp broadcast squads, and anti-misinformation response grid across Kadapa AC.
          </p>
        </div>

        <button
          onClick={() => setIsNewTaskModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 bg-[#D4A24C] text-[#071322] text-xs font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Dispatch Campaign Task
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${PANEL} p-5`}>
          <span className={`${LABEL} block`}>
            Active Verified Volunteers
          </span>
          <div className="font-display text-3xl font-bold text-[#F5EFE0] mt-1 font-mono-data">
            {totalVolunteers}
          </div>
          <span className="text-[11px] text-[#CBD5E1] mt-1 block">
            Organized into 3 tactical squads
          </span>
        </div>

        <div className={`${PANEL} p-5`}>
          <span className={`${LABEL} block`}>
            Daily WhatsApp Dispatches
          </span>
          <div className="font-display text-3xl font-bold text-[#D4A24C] mt-1 font-mono-data">
            {totalDailyShares.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#D4A24C] font-medium mt-1 block">
            Forwarded across resident groups
          </span>
        </div>

        <div className={`${PANEL} p-5`}>
          <span className={`${LABEL} block`}>
            Households Canvassed
          </span>
          <div className="font-display text-3xl font-bold text-[#F5EFE0] mt-1 font-mono-data">
            {totalCoveredHouseholds.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#CBD5E1] mt-1 block">
            74.8% of target constituency base
          </span>
        </div>

        <div className={`${PANEL} p-5`}>
          <span className={`${LABEL} block`}>
            Cadre Amplification Index
          </span>
          <div className="font-display text-3xl font-bold text-[#D4A24C] mt-1 font-mono-data">
            89.4%
          </div>
          <span className="text-[11px] text-[#D4A24C] font-medium mt-1 block">
            High organic peer relay rate
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[#F5EFE0]">
            Ward Mobilization Squads
          </h3>
          <span className="text-xs text-[#D4A24C] whitespace-nowrap">Live Cadre Readiness</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {squads.map((sq) => (
            <div key={sq.id} className={`${PANEL} p-5 space-y-4 flex flex-col justify-between`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#F5EFE0]">{sq.name}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${
                    sq.status === "High Surge"
                      ? "bg-[#D4A24C]/15 text-[#D4A24C] border-[#D4A24C]/40"
                      : "bg-emerald-950/40 text-emerald-300 border-emerald-500/40"
                  }`}>
                    {sq.status}
                  </span>
                </div>

                <div className="text-xs text-[#8E9CAE]">
                  Zone: <span className="font-medium text-[#F5EFE0]">{sq.wardZone}</span> · Lead: <span className="font-medium text-[#F5EFE0]">{sq.leaderName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-[#22405E]">
                  <div>
                    <span className="text-[10px] uppercase text-[#8E9CAE] block">Members</span>
                    <span className="font-mono-data font-bold text-[#F5EFE0]">{sq.activeMembersCount} Cadres</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#8E9CAE] block">Shares / Day</span>
                    <span className="font-mono-data font-bold text-[#D4A24C]">{sq.dailyWhatsAppShares}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-[#22405E]">
                <div className="flex justify-between text-[11px] text-[#CBD5E1]">
                  <span>Voter Reach Progress</span>
                  <span className="font-mono-data font-semibold text-[#D4A24C]">
                    {Math.round((sq.reachedHouseholds / sq.targetVoterHouseholds) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#071322] rounded-full overflow-hidden border border-[#22405E]">
                  <div
                    className="h-full bg-[#D4A24C] rounded-full"
                    style={{ width: `${(sq.reachedHouseholds / sq.targetVoterHouseholds) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0F2338] border border-rose-400/40 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-400/20 pb-3">
          <div className="flex items-center space-x-2 text-rose-200 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-300 shrink-0" />
            <span>Anti-Disinformation & Fact-Check Radar</span>
          </div>
          <span className="text-xs text-rose-200 font-semibold bg-rose-950/50 px-2 py-0.5 rounded border border-rose-400/40 whitespace-nowrap">
            1 Active Smear Flagged
          </span>
        </div>

        <div className="bg-[#071322] border border-rose-400/25 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold bg-rose-600 text-white px-2 py-0.5 rounded">
                False Claim Detected
              </span>
              <span className="text-xs text-[#CBD5E1]">Opposition WhatsApp Forward circulating in Ward 04 & 05</span>
            </div>
            <h4 className="text-sm font-semibold text-[#F5EFE0]">
              "Claim that drinking water canal project is being diverted away from Kadapa."
            </h4>
            <p className="text-xs text-emerald-300 font-medium">
              ✓ Verified Counter-Fact: ECI approved work orders confirm 100% water allocated directly to Kadapa AC municipal supply.
            </p>
          </div>

          <button
            onClick={() => handleShareOnWhatsApp("FACT CHECK: Claims about water canal diversion are completely false. Official government work order confirms 100% water allocation to Kadapa AC. Verified details: https://candidatea.in/water-factcheck", "fact-1")}
            className="inline-flex items-center px-4 py-2 bg-[#D4A24C] text-[#071322] text-xs font-bold rounded-lg hover:brightness-110 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            <span>{copiedTask === "fact-1" ? "Opening WhatsApp..." : "1-Click Squad Counter Blast"}</span>
          </button>
        </div>
      </div>

      <div className={`${PANEL} p-6 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#22405E] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-[#F5EFE0]">
              Active Campaign Directives
            </h3>
            <span className="text-xs text-[#8E9CAE]">Real-time cadre completion tracking</span>
          </div>
          <span className="text-xs font-mono-data text-[#D4A24C]">Target Completion</span>
        </div>

        <div className="space-y-3">
          {tasks.map((tsk) => {
            const percent = Math.min(Math.round((tsk.completedCount / tsk.targetCount) * 100), 100);
            return (
              <div key={tsk.id} className="p-4 bg-[#071322] border border-[#22405E] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#D4A24C] text-[#071322] rounded">
                      {tsk.type}
                    </span>
                    <span className="text-xs text-[#CBD5E1]">Assigned to: {tsk.assignedSquad}</span>
                    <span className="text-xs text-[#8E9CAE]">· Due: {tsk.deadline}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#F5EFE0]">
                    {tsk.title}
                  </h4>
                </div>

                <div className="flex items-center space-x-4 min-w-[200px]">
                  <div className="flex-1 text-right">
                    <span className="text-xs font-mono-data font-bold text-[#F5EFE0]">
                      {tsk.completedCount} / {tsk.targetCount}
                    </span>
                    <div className="w-full h-2 bg-[#0F2338] rounded-full overflow-hidden mt-1 border border-[#22405E]">
                      <div className="h-full bg-[#D4A24C] rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={() => handleShareOnWhatsApp(`Campaign Action Directive: ${tsk.title}. Please broadcast to your ward groups immediately!`, tsk.id)}
                    className="p-2 bg-[#0F2338] border border-[#D4A24C]/40 rounded-lg hover:border-[#D4A24C] text-[#D4A24C] cursor-pointer shrink-0"
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

      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#0F2338] border border-[#D4A24C]/40 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl text-[#F5EFE0]">
            <div className="flex items-center justify-between border-b border-[#22405E] pb-3">
              <h3 className="font-display text-xl font-normal text-[#F5EFE0]">
                Dispatch Volunteer Directive
              </h3>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-xs font-bold text-[#CBD5E1] hover:text-[#F5EFE0]">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className={LABEL}>Directive Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broadcast development manifesto video to Ward 1-8"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className={INPUT}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={LABEL}>Task Type</label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    className={INPUT}
                  >
                    <option value="WhatsApp Dispatch">WhatsApp Dispatch</option>
                    <option value="Door-to-Door Canvassing">Door-to-Door</option>
                    <option value="Rally Mobilization">Rally Mobilization</option>
                    <option value="Misinformation Fact-Check">Fact-Check</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={LABEL}>Target Shares / Houses</label>
                  <input
                    type="number"
                    value={newTaskTarget}
                    onChange={(e) => setNewTaskTarget(Number(e.target.value))}
                    className={INPUT}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={LABEL}>Assign to Squad</label>
                <select
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  className={INPUT}
                >
                  <option value="Kadapa North Digital Command">Kadapa North Digital Command</option>
                  <option value="Central Bazaar Grassroots Unit">Central Bazaar Grassroots Unit</option>
                  <option value="South Industrial & Kopparthy Wing">South Industrial & Kopparthy Wing</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#22405E]">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#CBD5E1] hover:text-[#F5EFE0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4A24C] text-[#071322] text-xs font-bold rounded-lg hover:brightness-110"
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
