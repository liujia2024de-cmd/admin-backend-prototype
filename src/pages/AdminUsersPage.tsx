import { useMemo, useState } from "react";
import { LockKeyhole, PlusCircle, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { Drawer } from "@/components/ui/Drawer";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/useToast";
import { adminUsers } from "@/data/mock";

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [keyword, setKeyword] = useState("");
  const [roleKeyword, setRoleKeyword] = useState("");
  const [statusKeyword, setStatusKeyword] = useState("");
  const [viewMode, setViewMode] = useState<"admin" | "restricted">("admin");
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | "reset" | null>(null);
  const [selectedUser, setSelectedUser] = useState<(typeof adminUsers)[number] | null>(null);

  const filteredUsers = useMemo(
    () =>
      adminUsers.filter((user) => {
        const matchedKeyword = keyword.trim() ? user.username.includes(keyword.trim()) : true;
        const matchedRole = roleKeyword.trim()
          ? user.roleType.includes(roleKeyword.trim()) || user.roleName.includes(roleKeyword.trim())
          : true;
        const matchedStatus = statusKeyword.trim() ? user.status.includes(statusKeyword.trim()) : true;
        return matchedKeyword && matchedRole && matchedStatus;
      }),
    [keyword, roleKeyword, statusKeyword],
  );

  const openDrawer = (mode: "create" | "edit" | "reset", user?: (typeof adminUsers)[number]) => {
    setDrawerMode(mode);
    setSelectedUser(user ?? null);
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setSelectedUser(null);
  };

  const handleSubmit = () => {
    const titleMap = {
      create: "成员已创建",
      edit: "成员信息已更新",
      reset: "密码已重置",
    } as const;

    const descriptionMap = {
      create: "新成员已生成初始账号，可继续按模块级别勾选访问权限。",
      edit: "角色与模块权限调整已保存，新的权限将在下次访问时生效。",
      reset: "系统已生成新的临时密码，超级管理员可通过安全渠道通知成员。",
    } as const;

    if (!drawerMode) return;

    showToast({
      tone: drawerMode === "reset" ? "warning" : "success",
      title: titleMap[drawerMode],
      description: descriptionMap[drawerMode],
    });
    closeDrawer();
  };

  const drawerTitle =
    drawerMode === "create" ? "新增后台成员" : drawerMode === "edit" ? `编辑成员 ${selectedUser?.username ?? ""}` : "重置成员密码";

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="后台成员列表"
          description="成员由超级管理员创建，可配置角色、模块权限并重置密码"
          action={
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
                onClick={() => setViewMode((current) => (current === "admin" ? "restricted" : "admin"))}
              >
                <ShieldAlert className="h-4 w-4" />
                {viewMode === "admin" ? "模拟无权限视角" : "恢复超级管理员视角"}
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-2.5 text-sm font-medium text-white" onClick={() => openDrawer("create")}>
                <PlusCircle className="h-4 w-4" />
                新增成员
              </button>
            </div>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="用户名搜索"
            />
            <input
              value={roleKeyword}
              onChange={(event) => setRoleKeyword(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="角色类型筛选"
            />
            <input
              value={statusKeyword}
              onChange={(event) => setStatusKeyword(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="状态筛选"
            />
            <button className="rounded-2xl bg-[#1B8BFA] px-5 py-3 text-sm font-medium text-white">查询</button>
          </div>
        </Panel>

        <Panel title="成员明细" description="默认权限只是推荐，角色勾选可按实际业务调整" padded={false}>
          {viewMode === "restricted" ? (
            <div className="p-5">
              <AccessDenied
                description="当前演示的是未勾选“账号与权限”模块的成员视角。该角色无法查看后台成员列表，也不能创建新成员或重置密码。"
                action={
                  <button className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" onClick={() => setViewMode("admin")}>
                    切回可管理视角
                  </button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {["用户名", "角色类型", "角色名称", "可访问模块", "创建时间", "状态", "操作"].map((head) => (
                      <th key={head} className="px-5 py-4 font-medium">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr key={user.username} className={index !== filteredUsers.length - 1 ? "border-b border-slate-100" : ""}>
                      <td className="px-5 py-4 font-medium text-slate-900">{user.username}</td>
                      <td className="px-5 py-4">{user.roleType}</td>
                      <td className="px-5 py-4">{user.roleName}</td>
                      <td className="px-5 py-4 text-slate-600">{user.modules}</td>
                      <td className="px-5 py-4">{user.createdAt}</td>
                      <td className="px-5 py-4">
                        <StatusBadge value={user.status} tone="green" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white" onClick={() => openDrawer("edit", user)}>
                            编辑
                          </button>
                          <button className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700" onClick={() => openDrawer("reset", user)}>
                            重置密码
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <Drawer
        open={drawerMode !== null}
        title={drawerTitle}
        description={
          drawerMode === "reset"
            ? "超级管理员可以为成员重置新密码。连续 5 次登录失败仍会锁定 30 分钟。"
            : "后台成员由超级管理员创建，默认权限仅作为推荐模板，实际模块勾选可以单独调整。"
        }
        onClose={closeDrawer}
        footer={
          <div className="flex justify-end gap-3">
            <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700" onClick={closeDrawer}>
              取消
            </button>
            <button className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" onClick={handleSubmit}>
              {drawerMode === "reset" ? "确认重置" : "保存配置"}
            </button>
          </div>
        }
      >
        {drawerMode === "reset" ? (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-amber-100 bg-amber-50/70 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-2 text-amber-600 shadow-sm">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-slate-950">即将重置 {selectedUser?.username} 的登录密码</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    原型中演示的是由超级管理员发起重置，成员重新使用新密码登录。登录有效期 1 小时，不支持“记住我”。
                  </p>
                </div>
              </div>
            </div>
            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-700">新密码</div>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" defaultValue="Reset@2026" />
            </label>
            <p className="text-sm leading-6 text-slate-500">密码至少 8 位，需包含大小写字母、数字和特殊字符。</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <div className="mb-2 text-sm font-medium text-slate-700">用户名</div>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  defaultValue={selectedUser?.username ?? "new_operator"}
                />
              </label>
              <label className="block">
                <div className="mb-2 text-sm font-medium text-slate-700">角色名称</div>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  defaultValue={selectedUser?.roleName ?? "运营专员"}
                />
              </label>
              <label className="block">
                <div className="mb-2 text-sm font-medium text-slate-700">角色类型</div>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" defaultValue={selectedUser?.roleType ?? "运营人员"}>
                  <option>超级管理员</option>
                  <option>开发人员</option>
                  <option>运营人员</option>
                  <option>产品经理</option>
                </select>
              </label>
              <label className="block">
                <div className="mb-2 text-sm font-medium text-slate-700">账号状态</div>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" defaultValue={selectedUser?.status ?? "启用"}>
                  <option>启用</option>
                  <option>禁用</option>
                </select>
              </label>
            </div>

            <section className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
              <h4 className="text-base font-semibold text-slate-950">模块权限推荐</h4>
              <div className="mt-4 flex flex-wrap gap-3">
                {(selectedUser?.modules ?? "首页看板 / 用户管理 / 设备管理 / 售后服务")
                  .split(" / ")
                  .map((module) => (
                    <label key={module} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                      <input type="checkbox" defaultChecked />
                      <span>{module}</span>
                    </label>
                  ))}
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                  <input type="checkbox" defaultChecked={false} />
                  <span>账号与权限</span>
                </label>
              </div>
            </section>
          </div>
        )}
      </Drawer>
    </AppShell>
  );
}
