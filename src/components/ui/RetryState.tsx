import { RotateCcw } from "lucide-react";

type RetryStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onRetry: () => void;
};

export function RetryState({ title, description, actionLabel = "重试", onRetry }: RetryStateProps) {
  return (
    <div className="rounded-[28px] border border-rose-100 bg-rose-50/70 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
        <RotateCcw className="h-6 w-6" />
      </div>
      <h4 className="mt-5 font-display text-2xl font-semibold text-slate-950">{title}</h4>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      <button className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" onClick={onRetry}>
        <RotateCcw className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  );
}
