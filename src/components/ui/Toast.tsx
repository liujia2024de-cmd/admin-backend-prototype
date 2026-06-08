import { ReactNode, useCallback, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { ToastContext, ToastInput } from "@/components/ui/useToast";

type ToastRecord = ToastInput & {
  id: number;
};

const iconMap = {
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
  info: Info,
};

const toneMap = {
  success: "border-[#d6e9ff] bg-[#f4f9ff]/95 text-[#1B8BFA]",
  warning: "border-[#d6e9ff] bg-[#eef7ff]/95 text-[#1577d9]",
  error: "border-[#d6e9ff] bg-[#f2f8ff]/95 text-[#0f67c4]",
  info: "border-[#d6e9ff] bg-[#eef7ff]/95 text-[#1B8BFA]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({ duration = 2800, tone = "info", ...toast }: ToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current, { id, tone, duration, ...toast }]);

      window.setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-5 top-5 z-[80] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = iconMap[toast.tone ?? "info"];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-[24px] border p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur ${toneMap[toast.tone ?? "info"]}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-white/70 p-2">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-950">{toast.title}</div>
                  {toast.description ? <p className="mt-1 text-sm leading-6 text-[#6888ac]">{toast.description}</p> : null}
                </div>
                <button className="rounded-full p-1 text-slate-400 transition hover:bg-white/70 hover:text-slate-700" onClick={() => removeToast(toast.id)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
