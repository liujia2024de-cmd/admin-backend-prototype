import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { presetConfigs } from "@/data/mock";

export default function PresetConfigsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="饲养箱预设参数库"
          description="为不同物种和亚种配置中控设备推荐参数，供 App 自动匹配并展示"
          action={
            <Link to="/cms/preset/edit/new" className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-2.5 text-sm font-medium text-white">
              <PlusCircle className="h-4 w-4" />
              新增参数
            </Link>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="按物种搜索" />
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="按亚种或更新时间筛选" />
            <button className="rounded-2xl bg-[#1B8BFA] px-5 py-3 text-sm font-medium text-white">查询</button>
          </div>
        </Panel>

        <Panel title="推荐参数列表" description="展示物种推荐参数的摘要信息" padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["物种", "示意图", "温度", "湿度", "灯光", "风扇", "更新时间", "操作"].map((head) => (
                    <th key={head} className="px-5 py-4 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {presetConfigs.map((item, index) => (
                  <tr key={item.species} className={index !== presetConfigs.length - 1 ? "border-b border-slate-100" : ""}>
                    <td className="px-5 py-4 font-medium text-slate-900">{item.species}</td>
                    <td className="px-5 py-4">{item.image}</td>
                    <td className="px-5 py-4">{item.temp}</td>
                    <td className="px-5 py-4">{item.humidity}</td>
                    <td className="px-5 py-4">{item.lighting}</td>
                    <td className="px-5 py-4">{item.fan}</td>
                    <td className="px-5 py-4">{item.updatedAt}</td>
                    <td className="px-5 py-4">
                      <Link to="/cms/preset/edit/new" className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white">
                        编辑
                      </Link>
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
