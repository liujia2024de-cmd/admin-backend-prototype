import { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[#d8ebff] bg-[linear-gradient(180deg,#f7fbff_0%,#f2f8ff_100%)] px-6 py-10 text-center sm:px-8 sm:py-12">
      <div className="h-12 w-12 rounded-2xl bg-[#1B8BFA]" />
      <h4 className="mt-4 font-display text-xl font-semibold text-slate-950 sm:text-2xl">{title}</h4>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#6f8fb3]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
