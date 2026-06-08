import { useState } from "react";
import { Mail, MessageCircleMore, Paperclip, Send, Smartphone } from "lucide-react";
import { useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { tickets } from "@/data/mock";

export default function TicketDetailPage() {
  const { id } = useParams();
  const ticket = tickets.find((item) => item.no === id) ?? tickets[0];
  const [completeOpen, setCompleteOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Panel title="工单对话记录" description="App 用户与 AI 机器人的完整沟通记录将沉淀在这里">
            <div className="space-y-4">
              <div className="flex justify-start">
                <div className="max-w-[78%] rounded-[24px] rounded-tl-md bg-white px-4 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
                  用户：我的摄像头画面经常黑屏，但设备在线。
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[78%] rounded-[24px] rounded-tr-md bg-[#1B8BFA] px-4 py-3 text-sm text-white shadow-sm">
                  机器人：已记录该问题，并建议先检查分辨率设置和固件版本，我现在为您创建工单。
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[78%] rounded-[24px] rounded-tl-md bg-white px-4 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
                  用户：我已经升级过一次，还是会出现，附上了日志。
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="处理记录" description="后台处理动作、处理备注和发送通知内容会沉淀为可追溯记录">
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="font-medium">2026-06-02 09:40 · 开始处理</div>
                <div className="mt-2">处理人：运营-周宁</div>
              </div>
              <textarea
                className="min-h-40 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none"
                defaultValue="您好，我们已排查到该问题与旧版渲染组件兼容有关，建议您升级到 v2.1.1 版本后再次观察。如问题仍存在，请继续回复本工单。"
              />
              <div className="flex flex-wrap gap-3">
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">开始处理</button>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white"
                  onClick={() => setCompleteOpen(true)}
                >
                  <Send className="h-4 w-4" />
                  处理完成并发送通知
                </button>
              </div>
              {done ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">已模拟完成处理并向用户发送通知，App 端状态将更新为“处理完成”。</div> : null}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="工单概览" description="展示问题类型、用户信息、设备和通知方式">
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">工单编号</span>
                <span className="font-medium text-slate-900">{ticket.no}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">用户</span>
                <span className="font-medium text-slate-900">{ticket.user}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">问题类型</span>
                <span className="font-medium text-slate-900">{ticket.issueType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">关联设备</span>
                <span className="font-medium text-slate-900">{ticket.deviceSn}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">状态</span>
                <StatusBadge value={ticket.status} tone={ticket.status === "处理中" ? "amber" : ticket.status === "待处理" ? "rose" : "green"} />
              </div>
            </div>
          </Panel>

          <Panel title="附件与通知" description="国外用户发邮件，国内用户发短信">
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Paperclip className="h-4 w-4" />
                  附件日志
                </div>
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-100">
                  <span>camera-black-screen-20260602.zip</span>
                  <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white">下载</button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Mail className="h-4 w-4 text-sky-500" />
                    国外用户通知
                  </div>
                  <div className="mt-2 text-sm text-slate-500">完成后自动发送邮件模板</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Smartphone className="h-4 w-4 text-emerald-500" />
                    国内用户通知
                  </div>
                  <div className="mt-2 text-sm text-slate-500">完成后自动发送短信模板</div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <MessageCircleMore className="h-4 w-4 text-violet-500" />
                  App端进度
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <StatusBadge value="已发送问题" tone="blue" />
                  <StatusBadge value="开始处理" tone="amber" />
                  <StatusBadge value="处理完成" tone="green" />
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmModal
        open={completeOpen}
        title="确认处理完成"
        description="系统将把当前备注嵌入通知模板并发送给用户。国外用户发邮件，国内用户发短信，同时 App 端工单状态会更新为“处理完成”。"
        confirmText="确认发送"
        onCancel={() => setCompleteOpen(false)}
        onConfirm={() => {
          setCompleteOpen(false);
          setDone(true);
        }}
      />
    </AppShell>
  );
}
