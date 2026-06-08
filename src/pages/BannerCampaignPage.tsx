import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { bannerCampaigns } from "@/data/mock";

export default function BannerCampaignPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Panel title="Banner 活动配置" description="支持首页底部和设备页底部浮层 Banner 的位置、优先级和点击统计">
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Banner 名称搜索" />
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="展示位置筛选" />
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="状态筛选" />
            <button className="rounded-2xl bg-[#1B8BFA] px-5 py-3 text-sm font-medium text-white">查询</button>
          </div>
        </Panel>

        <Panel title="Banner 列表" description="浮层 Banner 支持拖拽位置，多个活动按优先级排序" padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["活动名称", "位置", "标题", "副标题", "优先级", "状态", "点击次数", "操作"].map((head) => (
                    <th key={head} className="px-5 py-4 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bannerCampaigns.map((item, index) => (
                  <tr key={item.name} className={index !== bannerCampaigns.length - 1 ? "border-b border-slate-100" : ""}>
                    <td className="px-5 py-4 font-medium text-slate-900">{item.name}</td>
                    <td className="px-5 py-4">{item.position}</td>
                    <td className="px-5 py-4">{item.title}</td>
                    <td className="px-5 py-4">{item.subtitle}</td>
                    <td className="px-5 py-4">{item.priority}</td>
                    <td className="px-5 py-4">
                      <StatusBadge value={item.status} tone={item.status === "已上线" ? "green" : item.status === "草稿" ? "amber" : "rose"} />
                    </td>
                    <td className="px-5 py-4">{item.clicks}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white">编辑</button>
                        <button className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">上线/下线</button>
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
