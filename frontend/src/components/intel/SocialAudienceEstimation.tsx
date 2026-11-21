import React, { useState, useEffect } from "react";
import {
  Users,
  Compass,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Layers,
  Radio,
  Sparkles,
  Info
} from "lucide-react";
import { politicalApiService } from "../../services/api";
import { ConstituencyAudienceReport, AudiencePlatformDetail, ElectoralStatistics } from "../../types";

interface SocialAudienceEstimationProps {
  acId: string;
  acName: string;
  districtName?: string;
  stateId?: string;
  userId: string;
}

const CARD = "rounded-2xl border border-[#22405E] bg-[#0B1A2C]/90 p-4 sm:p-5 shadow-xl transition-all";
const METHOD_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  "Platform Estimate": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Geographical Approximation": { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30" },
  "Statistical Estimate": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  "Partial Coverage": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  "Data Unavailable": { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" }
};

function formatAudienceCount(num: number): string {
  if (num == null || isNaN(num)) return "0";
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} Lakh`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString("en-IN");
}

export const SocialAudienceEstimation: React.FC<SocialAudienceEstimationProps> = ({
  acId,
  acName,
  districtName,
  stateId = "AP",
  userId
}) => {
  const RADIUS_KM = 40;
  const [geoView, setGeoView] = useState<"constituency" | "radius">("constituency");
  const [report, setReport] = useState<ConstituencyAudienceReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);

  useEffect(() => {
    if (!acId) return;
    loadAudienceEstimates();
  }, [acId]);

  const loadAudienceEstimates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await politicalApiService.getConstituencyAudienceEstimates(userId, acId, RADIUS_KM);
      setReport(data);
    } catch (err: any) {
      console.error("Failed to load audience estimates:", err);
      setError("Unable to load audience estimates from backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await politicalApiService.refreshConstituencyAudienceEstimates(userId, acId, RADIUS_KM);
      setReport(data);
    } catch (err: any) {
      console.error("Failed to refresh audience estimates:", err);
      setError("Failed to refresh estimates. Retrying cached view.");
    } finally {
      setRefreshing(false);
    }
  };

  const electoral: ElectoralStatistics = report?.electoralStatistics || {
    totalElectors: 245000,
    maleElectors: 123000,
    femaleElectors: 121700,
    otherElectors: 300,
    pollingStations: 265,
    source: "Election Commission of India (ECI) Final Electoral Roll 2024",
    sourceDate: "2024"
  };

  const platformKeys = ["facebook", "instagram", "x", "youtube"];

  return (
    <div className="space-y-6 pt-6 border-t border-[#D4A24C]/25 animate-fadeIn">
      {/* Subsection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#D4A24C]/15 text-[#D4A24C] border border-[#D4A24C]/30 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" />
              Automated Intelligence
            </span>
            <span className="text-xs text-[#B9AF95]">Geographical Targeting 0–40 km</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-[#F5EFE0] mt-1.5 flex items-center gap-2">
            Social Media Audience Estimation
          </h2>
          <p className="text-xs text-[#B9AF95] mt-0.5">
            Real-time digital population and audience reach estimates for <span className="text-[#D4A24C] font-semibold">{acName}</span> {districtName ? `· ${districtName}` : ""}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowApiModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#22405E] bg-[#071322] hover:bg-[#131E2D] text-xs font-semibold text-[#B9AF95] hover:text-[#F5EFE0] transition-colors cursor-pointer"
            title="View API Connectivity & Eligibility"
          >
            <ShieldCheck className="w-4 h-4 text-[#D4A24C]" />
            <span>API Management</span>
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D4A24C] hover:bg-[#c4923c] text-[#071322] text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="Recalculate live platform estimates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing…" : "Refresh Estimates"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* GEOGRAPHICAL TARGETING CONTROL BAR (40 km Standard) */}
      <div className={`${CARD} space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#D4A24C]" />
            <h3 className="text-sm font-bold text-[#F5EFE0] uppercase tracking-wide">
              Geographical Targeting (40 km Standard)
            </h3>
          </div>

          {/* Dual Geographical View Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-[#071322] border border-[#22405E]">
            <button
              type="button"
              onClick={() => setGeoView("constituency")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                geoView === "constituency"
                  ? "bg-[#D4A24C] text-[#071322] shadow-sm"
                  : "text-[#B9AF95] hover:text-[#F5EFE0]"
              }`}
            >
              A. Constituency Only (40 km)
            </button>
            <button
              type="button"
              onClick={() => setGeoView("radius")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                geoView === "radius"
                  ? "bg-[#D4A24C] text-[#071322] shadow-sm"
                  : "text-[#B9AF95] hover:text-[#F5EFE0]"
              }`}
            >
              B. Constituency + Surrounding Radius (40 km)
            </button>
          </div>
        </div>

        <p className="text-[11px] text-[#8E9CAE] flex items-center gap-1.5 pt-1 border-t border-[#22405E]/40">
          <Info className="w-3.5 h-3.5 text-[#D4A24C] shrink-0" />
          <span>
            {geoView === "constituency"
              ? `Displaying audience exclusively within the official physical boundary of ${acName} Assembly Constituency (40 km baseline).`
              : `Displaying combined reach: ${acName} 40 km constituency core + 40 km surrounding territory buffer.`}
          </span>
        </p>
      </div>

      {/* 4 INDEPENDENT SOCIAL MEDIA PLATFORM AUDIENCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformKeys.map((plat) => {
          const detail: AudiencePlatformDetail = report?.platformEstimates?.[plat] || {
            platform: plat,
            platformDisplayName: plat === "facebook" ? "Facebook" : plat === "instagram" ? "Instagram" : plat === "x" ? "X (Twitter)" : "YouTube",
            constituencyAudience: 0,
            totalRadiusAudience: 0,
            surroundingAudience: 0,
            surroundingRadiusKm: RADIUS_KM,
            estimationMethod: "Statistical Estimate",
            dataSource: "Documented Baseline Ratios",
            geographicalCoverage: `${acName} Constituency`,
            apiAvailabilityStatus: "Active",
            lastUpdated: new Date().toISOString()
          };

          const audienceDisplay = geoView === "radius" ? detail.totalRadiusAudience : detail.constituencyAudience;
          const badge = METHOD_BADGES[detail.estimationMethod] || METHOD_BADGES["Statistical Estimate"];

          return (
            <div key={plat} className={`${CARD} flex flex-col justify-between space-y-4`}>
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {plat === "facebook" ? "📘" : plat === "instagram" ? "📸" : plat === "x" ? "𝕏" : "▶️"}
                    </span>
                    <h4 className="text-sm font-bold text-[#F5EFE0]">{detail.platformDisplayName}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                    {detail.estimationMethod}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-xs uppercase font-semibold text-[#8E9CAE]">
                    {geoView === "radius" ? "Constituency + Surrounding (40 km)" : "Constituency Only (40 km)"}
                  </span>
                  <p className="text-3xl font-display font-bold text-[#D4A24C] tracking-tight mt-0.5">
                    {formatAudienceCount(audienceDisplay)}
                  </p>
                  <p className="text-[11px] text-[#B9AF95] font-mono mt-0.5">
                    {audienceDisplay.toLocaleString("en-IN")} users
                  </p>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-[#071322] border border-[#22405E]/80 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-[#B9AF95]">
                    <span>Constituency (40 km):</span>
                    <span className="font-semibold text-[#F5EFE0]">{formatAudienceCount(detail.constituencyAudience)}</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Surrounding (40 km):</span>
                    <span className="font-semibold">+{formatAudienceCount(detail.surroundingAudience)}</span>
                  </div>
                  <div className="flex justify-between text-[#D4A24C] pt-1 border-t border-[#22405E]/50 font-bold">
                    <span>Total Combined:</span>
                    <span>{formatAudienceCount(detail.totalRadiusAudience)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#22405E]/60 space-y-1.5 text-[10px] text-[#8E9CAE]">
                <div className="flex justify-between">
                  <span className="text-[#B9AF95]">Data Source:</span>
                  <span className="text-right truncate max-w-[150px] font-medium text-[#F5EFE0]" title={detail.dataSource}>
                    {detail.dataSource}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B9AF95]">Coverage:</span>
                  <span className="text-right truncate max-w-[150px]">{detail.geographicalCoverage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B9AF95]">API Status:</span>
                  <span className="text-emerald-400 font-semibold">{detail.apiAvailabilityStatus}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PLATFORM AUDIENCE COMPARISON TABLE */}
      <div className={`${CARD} space-y-3 overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-[#22405E]/60 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#D4A24C]" />
            <h3 className="text-sm font-bold text-[#F5EFE0] uppercase tracking-wide">
              Cross-Platform Audience Comparison
            </h3>
          </div>
          <span className="text-[11px] text-[#D4A24C] font-semibold">
            {geoView === "constituency" ? "Constituency View (40 km)" : "Radius View (Constituency + 40 km Surrounding)"}
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#22405E] text-[#8E9CAE] text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Estimated Audience</th>
                <th className="py-2.5 px-3">Constituency Core (40 km)</th>
                <th className="py-2.5 px-3">Surrounding (40 km)</th>
                <th className="py-2.5 px-3">Estimation Method</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Data Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22405E]/40 text-[#F5EFE0]">
              {(report?.comparisonTable || []).map((row) => {
                const currentAudience = geoView === "constituency" ? row.constituencyOnlyAudience : row.estimatedAudience;
                return (
                  <tr key={row.platform} className="hover:bg-[#131E2D]/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-[#F5EFE0] flex items-center gap-1.5">
                      <span>
                        {row.platform.includes("Facebook") ? "📘" : row.platform.includes("Instagram") ? "📸" : row.platform.includes("X") ? "𝕏" : "▶️"}
                      </span>
                      {row.platform}
                    </td>
                    <td className="py-3 px-3 font-display font-bold text-[#D4A24C] text-sm">
                      {formatAudienceCount(currentAudience)}
                      <span className="text-[10px] text-[#8E9CAE] font-normal block font-mono">
                        {currentAudience.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-[#F5EFE0]">
                      {formatAudienceCount(row.constituencyOnlyAudience)}
                    </td>
                    <td className="py-3 px-3 text-amber-300 font-medium">
                      +{formatAudienceCount(row.surroundingAudience)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${METHOD_BADGES[row.estimationMethod]?.bg || "bg-amber-500/10"} ${METHOD_BADGES[row.estimationMethod]?.text || "text-amber-400"} ${METHOD_BADGES[row.estimationMethod]?.border || "border-amber-500/30"}`}>
                        {row.estimationMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-emerald-400">
                      {row.status}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-[#B9AF95] max-w-[200px] truncate" title={row.dataSource}>
                      {row.dataSource}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-[#071322] border border-[#22405E]/60 text-[11px] text-[#8E9CAE] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#D4A24C] shrink-0" />
          <span>
            <strong>Note on Unique Reach:</strong> Platform audiences must not be added together as a combined total because individual citizens use multiple platforms concurrently.
          </span>
        </div>
      </div>

      {/* API MANAGEMENT MODAL */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0B1A2C] border border-[#D4A24C]/40 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[#22405E] pb-3">
              <div>
                <h3 className="text-base font-display font-bold text-[#F5EFE0] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#D4A24C]" />
                  API Management & Credentials Health
                </h3>
                <p className="text-xs text-[#B9AF95] mt-0.5">
                  Platform API connections, scopes, and documented demographic fallback configuration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: "Meta Marketing API (Facebook)",
                  status: report?.apiHealth?.facebook?.status || "STATISTICAL_FALLBACK",
                  eligibility: "Meta Business Ads Account with delivery_estimate API permission",
                  scopes: "ads_read, ads_management",
                  envVars: "META_MARKETING_ACCESS_TOKEN, META_AD_ACCOUNT_ID"
                },
                {
                  name: "Meta Marketing API (Instagram Placement)",
                  status: report?.apiHealth?.instagram?.status || "STATISTICAL_FALLBACK",
                  eligibility: "Linked Instagram Professional Account in Meta Business Suite",
                  scopes: "instagram_basic, ads_read",
                  envVars: "META_MARKETING_ACCESS_TOKEN, META_AD_ACCOUNT_ID"
                },
                {
                  name: "X Ads API (Twitter)",
                  status: report?.apiHealth?.x?.status || "STATISTICAL_FALLBACK",
                  eligibility: "Approved X Ads Developer Account (Basic or Pro Tier)",
                  scopes: "ads:read, ads:write",
                  envVars: "TWITTER_ADS_API_KEY, TWITTER_ADS_ACCOUNT_ID"
                },
                {
                  name: "Google Ads ReachPlanService (YouTube)",
                  status: report?.apiHealth?.youtube?.status || "STATISTICAL_FALLBACK",
                  eligibility: "Google Ads Manager with approved Developer Token",
                  scopes: "https://www.googleapis.com/auth/adwords",
                  envVars: "GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID"
                }
              ].map((item) => (
                <div key={item.name} className="p-3.5 rounded-xl bg-[#071322] border border-[#22405E] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#F5EFE0]">{item.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}>
                      {item.status === "ACTIVE" ? "Connected (Live API)" : "Active (Statistical Fallback)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#B9AF95]"><strong>Eligibility:</strong> {item.eligibility}</p>
                  <p className="text-[11px] text-[#8E9CAE]"><strong>Required Scopes:</strong> <code className="text-[#D4A24C]">{item.scopes}</code></p>
                  <p className="text-[10px] text-[#8E9CAE]"><strong>Render Env:</strong> <code>{item.envVars}</code></p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="px-4 py-2 rounded-xl bg-[#D4A24C] hover:bg-[#c4923c] text-[#071322] text-xs font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
