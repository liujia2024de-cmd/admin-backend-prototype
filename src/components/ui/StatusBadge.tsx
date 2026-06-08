type StatusBadgeProps = {
  value: string;
  tone?: "green" | "amber" | "rose" | "slate" | "blue";
};

const toneMap = {
  green: "bg-[#e9f9ef] text-[#15803d] ring-[#b7e4c7]",
  amber: "bg-[#eef7ff] text-[#1577d9] ring-[#d6e9ff]",
  rose: "bg-[#fff1f2] text-[#dc2626] ring-[#fecdd3]",
  slate: "bg-[#f2f8ff] text-[#6287b0] ring-[#ddeeff]",
  blue: "bg-[#e9f4ff] text-[#1B8BFA] ring-[#cfe4ff]",
};

export function StatusBadge({ value, tone = "slate" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${toneMap[tone]}`}>
      {value}
    </span>
  );
}
