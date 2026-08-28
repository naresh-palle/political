import React from "react";
import { Candidate } from "../../types";
import { formatLakhs, formatPercentage } from "../../calculations";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { ActivityBadge } from "../common/Badge";
import { InsightCard } from "./InsightCards";

interface SocialFootprintSectionProps {
  client: Candidate;
}

export const SocialFootprintSection: React.FC<SocialFootprintSectionProps> = ({ client }) => {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <span className="w-5 h-5 rounded bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs">f</span>;
      case "instagram":
        return <span className="w-5 h-5 rounded bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center font-bold text-xs">ig</span>;
      case "youtube":
        return <span className="w-5 h-5 rounded bg-[#FF0000] text-white flex items-center justify-center font-bold text-xs">▶</span>;
      case "x":
        return <span className="w-5 h-5 rounded bg-[#000000] text-white flex items-center justify-center font-bold text-[10px]">𝕏</span>;
      default:
        return <span className="w-5 h-5 rounded bg-[#444] text-white flex items-center justify-center text-xs">●</span>;
    }
  };

  return (
    <section id="section-footprint" className="py-10 border-b border-[#E7E5DB]">
      <div className="space-y-2 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7C808D]">
          Channel Architecture
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal">
          Client's digital footprint
        </h2>
        <p className="text-sm text-[#666A78]">
          Granular breakdown of audience scale, engagement depth, and active posting cadence across official channels.
        </p>
      </div>

      {/* Combined Following Hero Banner */}
      <div className="bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#797D8B]">
            Aggregated Reach Metric
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="font-editorial text-4xl sm:text-5xl font-bold text-[#112233]">
              {formatLakhs(client.combinedFollowing, true)}
            </span>
            <span className="text-sm text-[#5C606E] font-medium">
              Combined platform following
            </span>
          </div>
          <p className="text-[11px] text-[#868A98] mt-1 italic">
            * Combined following represents gross channel subscriptions and includes overlapping individuals across platforms.
          </p>
        </div>

        <div className="flex items-center space-x-6 border-t md:border-t-0 md:border-l border-[#ECEAE2] pt-4 md:pt-0 md:pl-6 text-xs text-[#525663]">
          <div>
            <div className="text-[10px] uppercase text-[#8C909E] font-bold">Verified Status</div>
            <div className="text-sm font-semibold text-emerald-700 mt-0.5">
              {client.verifiedPlatformsCount} of {client.totalPlatformsCount} Channels
            </div>
          </div>
          <div className="border-l border-[#ECEAE2] pl-6">
            <div className="text-[10px] uppercase text-[#8C909E] font-bold">Monthly Activity</div>
            <div className="text-sm font-semibold text-[#112233] mt-0.5 font-mono-data">
              {client.postingFrequencyMonthly} Dispatches
            </div>
          </div>
        </div>
      </div>

      {/* Clean Editorial Platform Table */}
      <div className="bg-white border border-[#E0DED5] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-[#E6E4DA] text-[10px] font-bold uppercase tracking-wider text-[#6F7380]">
                <th className="py-3.5 px-5">Platform</th>
                <th className="py-3.5 px-4">Handle</th>
                <th className="py-3.5 px-4">Audience</th>
                <th className="py-3.5 px-4">Engagement</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Activity</th>
                <th className="py-3.5 px-5 text-right">Cadence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFE8]">
              {client.socials.map((acc) => (
                <tr key={acc.platform} className="hover:bg-[#FAF9F5]/70 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center space-x-3">
                      {getPlatformIcon(acc.platform)}
                      <span className="font-semibold text-sm capitalize text-[#112233]">
                        {acc.platform === "x" ? "X (Twitter)" : acc.platform}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono-data text-[#595D6A]">
                    {acc.handle}
                  </td>
                  <td className="py-4 px-4 font-mono-data font-semibold text-sm text-[#112233]">
                    {formatLakhs(acc.audience)}
                  </td>
                  <td className="py-4 px-4 font-mono-data font-semibold text-sm text-[#0F766E]">
                    {formatPercentage(acc.engagementRate)}
                  </td>
                  <td className="py-4 px-4">
                    {acc.verified ? (
                      <span className="inline-flex items-center text-xs text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs text-[#8A8E9B]">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <ActivityBadge level={acc.activityLevel} />
                  </td>
                  <td className="py-4 px-5 text-right font-mono-data text-[#4A4E5A]">
                    {acc.monthlyPosts} posts/mo
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InsightCard
        title="WHAT THIS MEANS"
        insight="Instagram demonstrates the highest engagement quality (6.2%), signaling strong viral resonance among younger demographics. Facebook remains the anchor platform for broad constituent communication with 52K followers."
        metricHighlight="6.2% IG Engagement leads constituency benchmark by +2.1%"
      />
    </section>
  );
};
