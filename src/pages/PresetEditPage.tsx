import { Save } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";

export default function PresetEditPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="编辑物种预设参数"
          description="用于配置温度、湿度、灯光、风扇和净化等推荐参数"
          action={
            <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-2.5 text-sm font-medium text-white">
              <Save className="h-4 w-4" />
              保存参数
            </button>
          }
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-4">
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="物种一级选择" defaultValue="豹纹守宫" />
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="物种二级选择" defaultValue="高黄" />
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="物种示意图上传（30MB内）" defaultValue="gecko-cover.png" />
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="推荐温度最小值" defaultValue="29" />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="推荐温度最大值" defaultValue="32" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="推荐湿度最小值" defaultValue="35" />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="推荐湿度最大值" defaultValue="45" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="LED亮度最小值" defaultValue="40" />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="LED亮度最大值" defaultValue="50" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="日光加热灯开始时间" defaultValue="08:30" />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="日光加热灯结束时间" defaultValue="20:00" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="LED 开始时间" defaultValue="09:00" />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="LED 结束时间" defaultValue="21:00" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="UVA/UVB 区" defaultValue="2区" />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="风扇档位" defaultValue="2档" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="UVA/UVB 开始时间" defaultValue="09:30" />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="UVA/UVB 结束时间" defaultValue="18:00" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="日光模式" defaultValue="开启" />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="夜光模式" defaultValue="关闭" />
              </div>
              <textarea
                className="min-h-36 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none"
                defaultValue={"风扇时段 1：10:00 - 11:30\n风扇时段 2：14:00 - 15:00\n等离子净化：开启"}
              />
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
