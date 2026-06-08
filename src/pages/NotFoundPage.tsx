import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function NotFoundPage() {
  return (
    <AppShell>
      <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="flex max-w-2xl flex-col gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#1B8BFA] text-white">
            <Compass className="h-8 w-8" />
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">404 Not Found</div>
            <h1 className="mt-3 font-display text-4xl font-semibold text-slate-950">这个页面还没有接入到后台工作台</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              可能是访问链接错误，或者当前原型尚未覆盖这个页面。你可以返回首页继续查看已完成模块，或回到上一步重新进入。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" to="/dashboard">
              <Home className="h-4 w-4" />
              返回首页
            </Link>
            <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700" onClick={() => window.history.back()}>
              返回上一页
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
