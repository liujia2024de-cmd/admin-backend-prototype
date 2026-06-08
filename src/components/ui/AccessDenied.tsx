import { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

type AccessDeniedProps = {
  title?: string;
  description: string;
  action?: ReactNode;
};

export function AccessDenied({ title = "当前账号暂无权限", description, action }: AccessDeniedProps) {
  return (
    <div className="rounded-[28px] border border-amber-100 bg-amber-50/70 p-8">
      <div className="flex max-w-2xl flex-col gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  );
}
