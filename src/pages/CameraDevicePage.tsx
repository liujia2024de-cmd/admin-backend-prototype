import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { devices, users } from "@/data/mock";

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

export default function CameraDevicePage() {
  const { id } = useParams();
  const cameraDevice = devices.find((device) => device.id === id && device.type === "camera") ?? devices.find((device) => device.type === "camera")!;
  const boundUser =
    users.find((user) => user.phone === cameraDevice.userPhone) ??
    users.find((user) => user.email === cameraDevice.userEmail);
  const location = boundUser?.region ?? "-";

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
          <div className="space-y-3 text-sm">
            {[
              ["2026-06-02 09:18", "18MB", "下载日志"],
              ["2026-06-01 11:06", "25MB", "下载日志"],
              ["2026-05-31 20:42", "31MB", "下载日志"],
            ].map(([time, size, action]) => (
              <div key={time} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <div className="font-medium text-slate-900">{time}</div>
                  <div className="text-xs text-slate-500">日志大小 {size}</div>
                </div>
                <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white">{action}</button>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
