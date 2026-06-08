import { PropsWithChildren, ReactNode } from "react";

type PanelProps = PropsWithChildren<{
  title?: string;
  description?: string;
  action?: ReactNode;
  padded?: boolean;
  overflowVisible?: boolean;
}>;

export function Panel({ title, description, action, padded = true, overflowVisible = false, children }: PanelProps) {
  return (
    <section className={`rounded-[28px] border border-[#d8ebff] bg-white shadow-[0_20px_50px_rgba(27,139,250,0.08)] ${overflowVisible ? "overflow-visible" : "overflow-hidden"}`}>
      {title || description || action ? (
        <div className="rounded-t-[28px] flex flex-col gap-3 border-b border-[#e9f4ff] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? <h3 className="font-display text-lg font-semibold text-slate-950">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-[#6f8fb3]">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}
