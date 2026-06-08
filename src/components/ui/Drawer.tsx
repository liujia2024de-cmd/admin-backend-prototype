import { ReactNode } from "react";
import { X } from "lucide-react";

type DrawerProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Drawer({ open, title, description, onClose, children, footer }: DrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-[#1B8BFA]/18 backdrop-blur-sm">
      <button className="flex-1" aria-label="关闭抽屉" onClick={onClose} />
      <aside className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-[#d8ebff] bg-white shadow-[-32px_0_80px_rgba(27,139,250,0.14)]">
        <div className="flex items-start justify-between border-b border-[#e8f3ff] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-6 py-5">
          <div>
            <h3 className="font-display text-2xl font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-2 max-w-xl text-sm leading-6 text-[#6f8fb3]">{description}</p> : null}
          </div>
          <button className="rounded-2xl border border-[#d7e9ff] p-2 text-[#5d8fc5] transition hover:bg-[#f2f8ff] hover:text-[#1B8BFA]" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? <div className="border-t border-[#e8f3ff] px-6 py-4">{footer}</div> : null}
      </aside>
    </div>
  );
}
