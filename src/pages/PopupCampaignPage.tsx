import { PlusCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { popupCampaigns } from "@/data/mock";

export default function PopupCampaignPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="弹窗活动配置"
          description="支持首页弹窗活动的频率、目标用户、优先级和投放状态管理"
          action={
            <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-2.5 text-sm font-medium text-white">
              <PlusCircle className="h-4 w-4" />
              新增弹窗活动
            </button>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="活动名称搜索" />
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="目标用户筛选" />
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="状态筛选" />
            <button className="rounded-2xl bg-[#1B8BFA] px-5 py-3 text-sm font-medium text-white">查询</button>
          </div>
        </Panel>

        <Panel title="弹窗活动列表" description="多个活动按优先级从高到低排序，已下线活动不可重复投放" padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["活动名称", "位置", "频率", "目标用户", "优先级", "状态", "确认点击次数", "操作"].map((head) => (
                    <th key={head} className="px-5 py-4 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {popupCampaigns.map((item, index) => (
                  <tr key={item.name} className={index !== popupCampaigns.length - 1 ? "border-b border-slate-100" : ""}>
                    <td className="px-5 py-4 font-medium text-slate-900">{item.name}</td>
                    <td className="px-5 py-4">{item.position}</td>
                    <td className="px-5 py-4">{item.frequency}</td>
                    <td className="px-5 py-4">{item.target}</td>
                    <td className="px-5 py-4">{item.priority}</td>
                    <td className="px-5 py-4">
                      <StatusBadge value={item.status} tone={item.status === "进行中" ? "green" : item.status === "草稿" ? "amber" : "rose"} />
                    </td>
                    <td className="px-5 py-4">{item.confirmClicks}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white">编辑</button>
                        <button className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">发布/下线</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
