import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { devices, userMobileDevices, userOwnedDevices, users } from "@/data/mock";

export default function UserDetailPage() {
  const { id } = useParams();
  const user = useMemo(() => users.find((item) => item.id === id) ?? users[0], [id]);
  const ownedDevicesWithLink = useMemo(
    () =>
      userOwnedDevices.map((device) => {
        const matchedDevice = devices.find((item) => item.snCode === device.sn);
        if (!matchedDevice) {
          return { ...device, detailPath: null };
        }

        return {
          ...device,
          detailPath:
            matchedDevice.type === "camera"
              ? `/devices/camera/${matchedDevice.id}`
              : `/devices/central/${matchedDevice.id}`,
        };
      }),
    [],
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel title="用户详细档案信息">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">用户 ID</div>
              <div className="mt-2 text-lg font-medium text-slate-950">{user.id}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">昵称</div>
              <div className="mt-2 text-lg font-medium text-slate-950">{user.nickname}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">登录渠道</div>
              <div className="mt-2 text-lg font-medium text-slate-950">{user.channel}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">邮箱</div>
              <div className="mt-2 text-sm text-slate-700">{user.email}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">手机号</div>
              <div className="mt-2 text-sm text-slate-700">{user.phone}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">地区</div>
              <div className="mt-2 text-sm text-slate-700">{user.region}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">持有设备数量</div>
              <div className="mt-2 text-sm text-slate-700">{user.deviceCount} 台</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">用户状态</div>
              <div className="mt-2">
                <StatusBadge value="活跃" tone="green" />
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">注册时间</div>
              <div className="mt-2 text-sm text-slate-700">{user.registeredAt}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">性别</div>
              <div className="mt-2 text-sm text-slate-700">{user.gender}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">生日</div>
              <div className="mt-2 text-sm text-slate-700">{user.birthday}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">最近一次活跃</div>
              <div className="mt-2 text-sm text-slate-700">{user.lastActiveAt}</div>
            </div>
          </div>
        </Panel>

        <Panel title="持有的具体设备情况" padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["设备类型", "设备名称", "SN", "状态", "固件版本", "操作"].map((head) => (
                    <th key={head} className="px-5 py-4 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ownedDevicesWithLink.map((device, index) => (
                  <tr key={device.sn} className={index !== ownedDevicesWithLink.length - 1 ? "border-b border-slate-100" : ""}>
                    <td className="px-5 py-4">{device.type}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">{device.name}</td>
                    <td className="px-5 py-4">{device.sn}</td>
                    <td className="px-5 py-4">
                      <StatusBadge value={device.status} tone={device.status === "在线" ? "green" : "rose"} />
                    </td>
                    <td className="px-5 py-4">{device.firmware}</td>
                    <td className="px-5 py-4">
                      {device.detailPath ? (
                        <Link
                          to={device.detailPath}
                          className="inline-flex rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white shadow-[0_8px_18px_rgba(27,139,250,0.16)] transition hover:bg-[#1577d9]"
                        >
                          查看详情
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">暂无详情</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="所用手机的型号" description="展示该用户历史使用过的手机品牌、型号、系统和 App 版本" padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["品牌", "型号", "系统", "App版本", "最后使用时间"].map((head) => (
                    <th key={head} className="px-5 py-4 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userMobileDevices.map((device, index) => (
                  <tr key={device.model} className={index !== userMobileDevices.length - 1 ? "border-b border-slate-100" : ""}>
                    <td className="px-5 py-4">{device.brand}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">{device.model}</td>
                    <td className="px-5 py-4">{device.os}</td>
                    <td className="px-5 py-4">{device.appVersion}</td>
                    <td className="px-5 py-4">{device.lastUsedAt}</td>
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
