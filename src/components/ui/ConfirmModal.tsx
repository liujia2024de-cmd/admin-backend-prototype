import { ReactNode } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  onCancel,
  onConfirm,
  children,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B8BFA]/18 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-[#d8ebff] bg-white p-6 shadow-[0_40px_120px_rgba(27,139,250,0.18)]">
        <h3 className="font-display text-2xl font-semibold text-slate-950">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#6f8fb3]">{description}</p>
        {children ? <div className="mt-5">{children}</div> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(27,139,250,0.22)]" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
