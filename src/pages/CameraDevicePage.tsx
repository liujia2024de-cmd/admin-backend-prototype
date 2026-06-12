import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DeviceReportTable, type DeviceReportRow } from "@/components/device/DeviceReportTable";
import { Panel } from "@/components/ui/Panel";
import { devices, logFiles, users } from "@/data/mock";

const cameraRows = [
  ["设备使用宠物", "豹纹守宫 / 育幼缸 1"],
  ["检测方式", "仅检测动物"],
  ["检测灵敏度", "高"],
  ["夜视微光辅助", "开启"],
  ["实时视频分辨率", "自动"],
  ["录像分辨率", "1080P"],
  ["画面倒置", "关闭"],
  ["Event 录像", "开启"],
  ["24/7 连续录像", "开启"],
  ["通知总开关", "开启"],
  ["通知形式", "AI 标签 + 描述 + 截图"],
  ["SD卡状态", "已插入"],
  ["SD卡已用空间", "84GB / 128GB"],
  ["本地录像状态", "开启"],
];

const cloudServiceRows = [
  ["是否订阅云服务", "已订阅"],
  ["订阅服务名称", "云存储 Pro + AI 守护"],
  ["订阅购买时间", "2026-05-28 10:12"],
  ["订阅到期时间", "2027-05-28 23:59"],
  ["订阅计费方式", "年付"],
  ["云端事件录像", "开启"],
  ["AI 行为识别", "开启"],
  ["AI 视频剪辑", "开启"],
];

const cameraReportRows: DeviceReportRow[] = [
  { id: "1681", time: "2026-06-08 20:42:17.030", type: "用户操作后自动上报", field: "实时预览", value: "打开 Live View", source: "App 用户触发" },
  { id: "1682", time: "2026-06-08 20:42:16.056", type: "用户操作后自动上报", field: "通知总开关", value: "开启", source: "App 用户触发" },
  { id: "1683", time: "2026-06-08 20:42:15.927", type: "用户操作后自动上报", field: "Event 录像", value: "关闭", source: "App 用户触发" },
  { id: "1684", time: "2026-06-08 20:39:48.479", type: "设备自动上报", field: "Wi-Fi 信号", value: "4 格", source: "设备本身" },
  { id: "1685", time: "2026-06-08 20:39:10.288", type: "设备自动上报", field: "存储状态", value: "本地 SD + 云端双录", source: "设备本身" },
  { id: "1686", time: "2026-06-08 20:38:52.414", type: "设备自动上报", field: "实时码率", value: "1080P / 1.6Mbps", source: "设备本身" },
  { id: "1687", time: "2026-06-08 20:38:51.216", type: "设备自动上报", field: "事件识别", value: "检测到进食行为", source: "设备 AI 识别" },
  { id: "1688", time: "2026-06-08 20:38:49.104", type: "设备自动上报", field: "本地录像状态", value: "录制中", source: "设备本身" },
  { id: "1689", time: "2026-06-08 20:38:47.552", type: "设备自动上报", field: "夜视微光辅助", value: "开启", source: "设备本身" },
  { id: "1690", time: "2026-06-08 20:38:45.983", type: "设备自动上报", field: "网络状态", value: "连接正常", source: "设备本身" },
  { id: "1691", time: "2026-06-07 18:22:43.256", type: "设备自动上报", field: "Wi-Fi 信号", value: "3 格", source: "设备本身" },
  { id: "1692", time: "2026-06-07 18:22:40.604", type: "用户操作后自动上报", field: "夜视微光辅助", value: "关闭", source: "App 用户触发" },
  { id: "1693", time: "2026-06-06 07:14:32.155", type: "设备自动上报", field: "事件识别", value: "检测到休息静止行为", source: "设备 AI 识别" },
];

export default function CameraDevicePage() {
  const { id } = useParams();
  const cameraDevice = devices.find((device) => device.id === id && device.type === "camera") ?? devices.find((device) => device.type === "camera")!;
  const boundUser =
    users.find((user) => user.phone === cameraDevice.userPhone) ??
    users.find((user) => user.email === cameraDevice.userEmail);
  const location = boundUser?.region ?? "-";
  const deviceLogs = logFiles.filter((item) => item.deviceSn === cameraDevice.snCode);
  const totalLogSize = deviceLogs.reduce((sum, item) => sum + Number.parseInt(item.fileSize, 10), 0);
  const latestLogTime = deviceLogs[0]?.uploadTime ?? "-";

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel title="摄像头设备概览">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["设备名称", cameraDevice.deviceName],
              ["设备PN", cameraDevice.pnCode],
              ["设备SN", cameraDevice.snCode],
              ["固件版本", cameraDevice.firmware],
              ["MAC地址", "8C:71:33:AB:09:1E"],
              ["IP地址", "192.168.50.16"],
              ["在线状态", cameraDevice.status === "online" ? "在线" : "离线"],
              ["最近心跳", "12 秒前"],
              ["Wi-Fi 信号", cameraDevice.wifi],
              ["当前 SSID", "Habitat-5F"],
              ["设备所在位置", location],
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
          <Panel title="摄像头设置项" padded={false}>
            <div className="divide-y divide-slate-100">
              {cameraRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-5 py-4">
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className="max-w-[58%] text-right text-sm font-medium text-slate-900">{value}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="云服务设置" padded={false}>
            <div className="divide-y divide-slate-100">
              {cloudServiceRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-5 py-4">
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className="max-w-[58%] text-right text-sm font-medium text-slate-900">{value}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="设备日志记录">
          <div className="flex flex-col gap-4 rounded-[24px] border border-[#e6f1ff] bg-[linear-gradient(180deg,#f9fcff_0%,#ffffff_100%)] px-5 py-5 md:flex-row md:items-center md:justify-between">
            <div className="grid flex-1 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[#7b9bc2]">日志总数</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{deviceLogs.length}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[#7b9bc2]">累计大小</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{totalLogSize}MB</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[#7b9bc2]">最近上传</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{latestLogTime}</div>
              </div>
            </div>
            <Link
              to={`/logs?keyword=${encodeURIComponent(cameraDevice.snCode)}`}
              className="inline-flex w-fit items-center justify-center rounded-full bg-[#1B8BFA] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_24px_rgba(27,139,250,0.18)] transition hover:bg-[#1577d9]"
            >
              查看日志
            </Link>
          </div>
        </Panel>

        <DeviceReportTable
          title="设备数据上报记录"
          description="展示用户对设备配置的操作上报，以及设备自动上报的运行数据、识别结果和状态变化。"
          rows={cameraReportRows}
        />
      </div>
    </AppShell>
  );
}
