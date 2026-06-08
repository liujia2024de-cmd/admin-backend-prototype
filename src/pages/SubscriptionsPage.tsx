import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";

export default function SubscriptionsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-4">
          <StatCard label="订阅人数" value="12,406" trend="+8.2%" tone="teal" />
          <StatCard label="订阅率" value="34%" trend="+1.4%" tone="amber" />
          <StatCard label="续费率" value="71%" trend="+2.1%" tone="emerald" />
          <StatCard label="订阅收入" value="$86,420" trend="+9.7%" tone="violet" />
        </div>

        <Panel
          title="订阅收费看板"
          description="支持按日、周、月、年、设备型号和地区查看购买、云存与 AI 功能数据"
          action={
            <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-2.5 text-sm font-medium text-white">
              <Download className="h-4 w-4" />
              导出 PDF
            </button>
          }
        >
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
              <div className="text-sm font-medium text-slate-900">购买相关</div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>购买订阅服务人数趋势</li>
                <li>订阅率 / 续费率</li>
                <li>订阅收入趋势</li>
                <li>不同套餐订阅数量及占比</li>
                <li>不同支付方式占比</li>
              </ul>
            </div>
            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
              <div className="text-sm font-medium text-slate-900">云存储使用情况</div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>开启云存储设备数</li>
                <li>平均每天录像段数</li>
                <li>每段录像平均时长</li>
                <li>平均每天查看录像段数</li>
                <li>每次平均观看时长</li>
              </ul>
            </div>
            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
              <div className="text-sm font-medium text-slate-900">AI 功能情况</div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>云端行为分析打开率</li>
                <li>AI 视频剪辑打开率</li>
                <li>AI 本地动物检测打开率</li>
                <li>每日 AI 调用次数</li>
                <li>AI 剪辑视频播放率</li>
              </ul>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
