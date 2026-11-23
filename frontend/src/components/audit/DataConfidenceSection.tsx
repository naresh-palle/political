import React from "react";
import { DataConfidenceRecord } from "../../types";
import { ConfidenceBadge } from "../common/Badge";
import { Database, ShieldCheck } from "lucide-react";

interface DataConfidenceSectionProps {
  records: DataConfidenceRecord[];
}

export const DataConfidenceSection: React.FC<DataConfidenceSectionProps> = ({ records }) => {
  return (
    <section id="section-methodology" className="py-10 border-b border-[rgba(201,148,54,0.25)]">
      <div className="space-y-2 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#A3B1C2]">
          Provenance & Rigor
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#F5EFE0] font-normal">
          Data & Methodology
        </h2>
        <p className="text-sm text-[#A3B1C2]">
          Transparent origin, estimation models, and verification standards backing every constituency insight.
        </p>
      </div>

      <div className="bg-[#080E18] border border-[rgba(201,148,54,0.25)] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#080E18] border-b border-[#E6E4DA] text-[10px] font-bold uppercase tracking-wider text-[#6F7380]">
                <th className="py-3.5 px-5">Metric / Model</th>
                <th className="py-3.5 px-4">Primary Source</th>
                <th className="py-3.5 px-4">Recency</th>
                <th className="py-3.5 px-4">Classification</th>
                <th className="py-3.5 px-5">Methodology Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFE8]">
              {records.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#080E18]/70 transition-colors">
                  <td className="py-4 px-5 font-semibold text-[#F5EFE0]">
                    {item.metric}
                  </td>
                  <td className="py-4 px-4 text-[#4B4E5B]">
                    {item.source}
                  </td>
                  <td className="py-4 px-4 font-mono-data text-[#646875]">
                    {item.date}
                  </td>
                  <td className="py-4 px-4">
                    <ConfidenceBadge level={item.confidence} />
                  </td>
                  <td className="py-4 px-5 text-[#5F6370] leading-relaxed">
                    {item.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
