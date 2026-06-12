import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DeviceReportTable, type DeviceReportRow } from "@/components/device/DeviceReportTable";
import { Panel } from "@/components/ui/Panel";
import { devices, users } from "@/data/mock";

const groups = [
  {
    title: "气候调控",
    rows: [
      ["目标温度", "31°C"],
      ["碳纤维恒温灯", "开启"],
      ["卤素日光加热灯", "开启"],
      ["卤素灯时段", "08:30 - 20:00"],
    ],
  },
  {
    title: "湿度调控",
    rows: [
      ["目标湿度", "72%"],
      ["当前模式", "智能恒湿"],
      ["定时喷淋", "已关闭"],
      ["风扇联动策略", "高于目标湿度时自动开启风扇"],
    ],
  },
  {
    title: "照明控制",
    rows: [
      ["LED灯", "开启 / 68%"],
      ["LED时段", "09:00 - 21:00"],
      ["UVA/UVB灯", "开启 / 3区"],
      ["UV时段", "09:30 - 18:30"],
      ["模拟日光模式", "开启"],
      ["夜光模式", "关闭"],
    ],
  },
  {
    title: "风扇控制",
    rows: [
      ["风扇", "开启 / 2档"],
      ["离子净化", "开启"],
      ["开风扇同步净化", "开启"],
      ["风扇计划", "3 个时段已配置"],
    ],
  },
];

const centralReportRows: DeviceReportRow[] = [
  { id: "1681", time: "2026-06-08 20:42:17.030", type: "用户操作后自动上报", field: "加热灯开关", value: "开启", source: "App 用户触发" },
  { id: "1682", time: "2026-06-08 20:42:16.056", type: "用户操作后自动上报", field: "雾化喷淋", value: "启动 30 秒", source: "App 用户触发" },
  { id: "1683", time: "2026-06-08 20:42:15.927", type: "用户操作后自动上报", field: "UV 灯开关", value: "关闭", source: "App 用户触发" },
  { id: "1684", time: "2026-06-08 20:42:13.420", type: "设备自动上报", field: "实时温度", value: "45.3°C", source: "设备本身" },
  { id: "1685", time: "2026-06-08 20:39:52.404", type: "设备自动上报", field: "实时湿度", value: "45.6%", source: "设备本身" },
  { id: "1686", time: "2026-06-08 20:39:48.479", type: "设备自动上报", field: "碳纤维恒温灯", value: "温控联动开启", source: "设备本身" },
  { id: "1687", time: "2026-06-08 20:39:31.299", type: "设备自动上报", field: "实时温度", value: "45.8°C", source: "设备本身" },
  { id: "1688", time: "2026-06-08 20:39:10.288", type: "设备自动上报", field: "实时湿度", value: "45.5%", source: "设备本身" },
  { id: "1689", time: "2026-06-08 20:38:52.414", type: "设备自动上报", field: "风扇功率", value: "79%", source: "设备本身" },
  { id: "1690", time: "2026-06-08 20:38:51.216", type: "设备自动上报", field: "加热区温度", value: "33.7°C", source: "设备本身" },
  { id: "1691", time: "2026-06-08 20:38:50.341", type: "设备自动上报", field: "喷淋状态", value: "0.0s / 本轮未触发", source: "设备本身" },
  { id: "1692", time: "2026-06-08 20:38:50.234", type: "设备自动上报", field: "故障码上报", value: "无异常", source: "设备本身" },
  { id: "1693", time: "2026-06-07 11:15:18.112", type: "用户操作后自动上报", field: "LED 灯亮度", value: "68%", source: "App 用户触发" },
  { id: "1694", time: "2026-06-06 08:42:10.512", type: "设备自动上报", field: "实时湿度", value: "48.1%", source: "设备本身" },
];

export default function CentralDevicePage() {
  const { id } = useParams();
  const centralDevice =
    devices.find((device) => device.id === id && device.type === "central_control") ??
    devices.find((device) => device.type === "central_control")!;
  const boundUser =
    users.find((user) => user.phone === centralDevice.userPhone) ??
    users.find((user) => user.email === centralDevice.userEmail);
  const location = boundUser?.region ?? "-";
  const linkedDevices = devices.filter((device) => {
    if (device.id === centralDevice.id || device.type === "central_control") return false;

    return (
      device.userPhone === centralDevice.userPhone ||
      device.userEmail === centralDevice.userEmail ||
      (boundUser ? device.userPhone === boundUser.phone || device.userEmail === boundUser.email : false)
    );
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel title="中控设备概览">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["设备名称", centralDevice.deviceName],
              ["设备 PN", centralDevice.pnCode],
              ["设备 SN", centralDevice.snCode],
              ["固件版本", centralDevice.firmware],
              ["当前 Wi-Fi", "Habitat-5F"],
              ["Wi-Fi信号", centralDevice.wifi],
              ["设备所在位置", location],
              ["最近使用", centralDevice.lastActiveAt],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
              </div>
            ))}
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">绑定用户 ID</div>
              {boundUser ? (
                <Link to={`/users/${boundUser.id}`} className="mt-2 inline-flex text-sm font-medium text-[#1B8BFA] transition hover:text-[#1577d9]">
                  {boundUser.id}
                </Link>
              ) : (
                <div className="mt-2 text-sm font-medium text-slate-400">-</div>
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">绑定用户昵称</div>
              {boundUser ? (
                <Link to={`/users/${boundUser.id}`} className="mt-2 inline-flex text-sm font-medium text-[#1B8BFA] transition hover:text-[#1577d9]">
                  {boundUser.nickname}
                </Link>
              ) : (
                <div className="mt-2 text-sm font-medium text-slate-400">-</div>
              )}
            </div>
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          {groups.map((group) => (
            <Panel key={group.title} title={group.title} padded={false}>
              <div className="divide-y divide-slate-100">
                {group.rows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-5 py-4">
                    <div className="text-sm text-slate-500">{label}</div>
                    <div className="max-w-[58%] text-right text-sm font-medium text-slate-900">{value}</div>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>

        <Panel title="关联设备列表" padded={false}>
          {linkedDevices.length === 0 ? (
            <div className="px-5 py-5 text-sm text-slate-500">当前没有关联到该中控的子设备。</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="brand-table min-w-full text-left text-sm">
                <thead>
                  <tr>
                    {["子设备名称", "PN号", "SN号", "操作"].map((head) => (
                      <th key={head} className="px-5 py-4 font-medium">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linkedDevices.map((device, index) => {
                    const detailPath =
                      device.type === "camera" ? `/devices/camera/${device.id}` : `/devices/central/${device.id}`;

                    return (
                      <tr key={device.id} className={index !== linkedDevices.length - 1 ? "border-b border-[#eaf4ff]" : ""}>
                        <td className="px-5 py-4 font-medium text-slate-900">{device.deviceName}</td>
                        <td className="px-5 py-4">{device.pnCode}</td>
                        <td className="px-5 py-4">{device.snCode}</td>
                        <td className="px-5 py-4">
                          <Link to={detailPath} className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white shadow-[0_10px_18px_rgba(27,139,250,0.18)]">
                            查看设备详情
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="设备日志记录">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["2026-06-02 08:22", "36MB"],
              ["2026-06-01 10:03", "22MB"],
              ["2026-05-31 23:09", "18MB"],
            ].map(([time, size]) => (
              <div key={time} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="text-sm font-medium text-slate-900">{time}</div>
                <div className="mt-1 text-xs text-slate-500">日志大小 {size}</div>
                <button className="mt-4 rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white">下载日志</button>
              </div>
            ))}
          </div>
        </Panel>

        <DeviceReportTable
          title="设备数据上报记录"
          description="展示用户对中控设备配置的操作上报，以及温湿度、执行器状态和异常信息等自动上报记录。"
          rows={centralReportRows}
        />
      </div>
    </AppShell>
  );
}
