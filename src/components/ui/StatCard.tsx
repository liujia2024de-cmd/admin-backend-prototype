import { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
  tone?: "teal" | "amber" | "violet" | "emerald";
  subtext?: string;
};

const toneClasses = {
  teal: "from-[#1B8BFA]/18 to-[#73b8ff]/10 border-[#cfe4ff]",
  amber: "from-[#5faefc]/14 to-[#9fd2ff]/10 border-[#d7eaff]",
  violet: "from-[#2d7eea]/16 to-[#7ab9ff]/8 border-[#cfe4ff]",
  emerald: "from-[#3a9cff]/18 to-[#bfe2ff]/12 border-[#d8ecff]",
};

export function StatCard({ label, value, trend, icon, tone = "teal", subtext }: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border bg-gradient-to-br ${toneClasses[tone]} bg-white p-5 shadow-[0_22px_56px_rgba(27,139,250,0.1)]`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#7395bc]">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          {subtext ? <p className="mt-2 text-xs text-[#7395bc]">{subtext}</p> : null}
        </div>
      </div>
    </div>
  );
}
