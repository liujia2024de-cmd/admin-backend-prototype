import { Link } from "react-router-dom";
import { MessageSquareMore, Send } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { tickets } from "@/data/mock";

export default function TicketsPage() {
  const activeTicket = tickets[0];

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Panel title="工单列表" description="支持按工单状态、问题类型、用户信息和时间范围筛选">
            <div className="grid gap-4 xl:grid-cols-4">
              <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="工单状态" />
              <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="问题类型" />
              <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="用户ID / 用户名" />
              <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="时间范围" />
            </div>
          </Panel>

          <Panel title="工单明细表" description="用户与 AI 小机器人对话后会自动生成工单" padded={false}>
            <div className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <div key={ticket.no} className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-slate-900">{ticket.no}</div>
                      <StatusBadge
                        value={ticket.status}
                        tone={ticket.status === "处理中" ? "amber" : ticket.status === "待处理" ? "rose" : "green"}
                      />
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      {ticket.user} · {ticket.issueType} · 关联设备 {ticket.deviceSn}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-slate-400">
                      <div>创建时间 {ticket.createdAt}</div>
                      <div className="mt-1">处理人 {ticket.handler}</div>
                    </div>
                    <Link to={`/tickets/${ticket.no}`} className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white">
                      查看详情
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="工单详情预览" description="用于展示对话记录、日志附件和处理动作">
            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#1B8BFA] p-2 text-white">
                  <MessageSquareMore className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{activeTicket.no}</div>
                  <div className="text-xs text-slate-500">{activeTicket.user} · {activeTicket.issueType}</div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  用户：设备画面连续 10 分钟黑屏，但夜视灯是开着的。
                </div>
                <div className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm text-white shadow-sm">
                  机器人：已为您创建工单，并建议先检查电源和分辨率设置。
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  运营备注：已定位为固件渲染兼容问题，建议升级到 v2.1.1。
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="处理动作" description="国外用户发邮件，国内用户发短信，备注将嵌入模板发送">
            <textarea
              className="min-h-36 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none"
              defaultValue="您好，我们已完成排查，建议您将设备升级至 v2.1.1 后再次观察。如仍异常，请继续在 App 中回复本工单。"
            />
            <div className="mt-4 flex gap-3">
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">开始处理</button>
              <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white">
                <Send className="h-4 w-4" />
                处理完成并发送通知
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
