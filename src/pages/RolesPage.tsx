import { useMemo, useState } from "react";
import { ChevronDown, CircleHelp, UserPlus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Drawer } from "@/components/ui/Drawer";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/useToast";

const moduleOptions = [
  "大数据看板",
  "用户管理",
  "设备管理",
  "OTA管理",
  "用户捐献视频",
  "运营管理",
  "内容管理（CMS）",
  "售后管理",
  "日志管理",
  "账号与权限",
] as const;

const roleOptions = ["超级管理员", "运营人员", "开发人员", "产品经理", "其他角色"] as const;

type ModuleName = (typeof moduleOptions)[number];
type RoleName = (typeof roleOptions)[number];

type MemberRecord = {
  id: string;
  username: string;
  password: string;
  role: RoleName;
  modules: ModuleName[];
  createdAt: string;
  protected?: boolean;
};

const rolePresets: Record<RoleName, ModuleName[]> = {
  超级管理员: [...moduleOptions],
  运营人员: ["大数据看板", "用户管理", "设备管理", "运营管理", "内容管理（CMS）", "售后管理"],
  开发人员: ["设备管理", "OTA管理", "用户捐献视频", "日志管理"],
  产品经理: ["大数据看板", "运营管理", "内容管理（CMS）", "售后管理"],
  其他角色: ["设备管理", "售后管理"],
};

const initialMembers: MemberRecord[] = [
  {
    id: "member-1",
    username: "today_admin",
    password: "SafeMailResetOnly",
    role: "超级管理员",
    modules: [...moduleOptions],
    createdAt: "2026-01-08 09:00",
    protected: true,
  },
  {
    id: "member-2",
    username: "ops_zhou",
    password: "Ops@2026",
    role: "运营人员",
    modules: rolePresets["运营人员"],
    createdAt: "2026-03-12 10:22",
  },
  {
    id: "member-3",
    username: "dev_li",
    password: "Dev@2026",
    role: "开发人员",
    modules: rolePresets["开发人员"],
    createdAt: "2026-04-18 13:40",
  },
  {
    id: "member-4",
    username: "pm_lin",
    password: "Pm@2026",
    role: "产品经理",
    modules: rolePresets["产品经理"],
    createdAt: "2026-04-22 11:08",
  },
  {
    id: "member-5",
    username: "support_he",
    password: "Support@2026",
    role: "其他角色",
    modules: ["设备管理", "售后管理", "内容管理（CMS）"],
    createdAt: "2026-05-03 17:16",
  },
];

const emptyMemberForm = {
  username: "",
  password: "",
  role: "运营人员" as RoleName,
  modules: rolePresets["运营人员"],
};

type MemberForm = typeof emptyMemberForm;

export default function RolesPage() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<MemberRecord[]>(initialMembers);
  const [keyword, setKeyword] = useState("");
  const [roleKeyword, setRoleKeyword] = useState("");
  const [memberDrawerMode, setMemberDrawerMode] = useState<"create" | "edit" | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [roleGuideOpen, setRoleGuideOpen] = useState(false);

  const selectedMember = members.find((item) => item.id === selectedMemberId) ?? null;
  const deleteTarget = members.find((item) => item.id === deleteMemberId) ?? null;

  const filteredMembers = useMemo(
    () =>
      members.filter((member) => {
        const matchedKeyword = keyword.trim() ? member.username.toLowerCase().includes(keyword.trim().toLowerCase()) : true;
        const matchedRole = roleKeyword ? member.role === roleKeyword : true;
        return matchedKeyword && matchedRole;
      }),
    [keyword, members, roleKeyword],
  );

  const defaultRoleMatrix = useMemo(
    () =>
      moduleOptions.map((module) => ({
        module,
        superAdmin: rolePresets["超级管理员"].includes(module),
        operator: rolePresets["运营人员"].includes(module),
        developer: rolePresets["开发人员"].includes(module),
        product: rolePresets["产品经理"].includes(module),
      })),
    [],
  );

  const updateRole = (role: RoleName) => {
    setMemberForm((current) => ({
      ...current,
      role,
      modules: rolePresets[role],
    }));
  };

  const openCreateMember = () => {
    setSelectedMemberId(null);
    setMemberForm({
      username: "",
      password: "",
      role: "运营人员",
      modules: rolePresets["运营人员"],
    });
    setMemberDrawerMode("create");
  };

  const openEditMember = (member: MemberRecord) => {
    setSelectedMemberId(member.id);
    setMemberForm({
      username: member.username,
      password: member.password,
      role: member.role,
      modules: member.modules,
    });
    setMemberDrawerMode("edit");
  };

  const saveMember = () => {
    if (!memberForm.username.trim() || !memberForm.password.trim() || memberForm.modules.length === 0) {
      showToast({
        tone: "warning",
        title: "请先补全成员信息",
        description: "请选择角色，并填写用户名、密码和可访问模块。",
      });
      return;
    }

    const duplicated = members.some((member) => member.username === memberForm.username.trim() && member.id !== selectedMemberId);
    if (duplicated) {
      showToast({
        tone: "warning",
        title: "用户名已存在",
        description: "请更换一个未被占用的后台登录用户名。",
      });
      return;
    }

    if (memberDrawerMode === "create") {
      setMembers((current) => [
        {
          id: `member-${Date.now()}`,
          username: memberForm.username.trim(),
          password: memberForm.password.trim(),
          role: memberForm.role,
          modules: memberForm.modules,
          createdAt: "2026-06-04 15:00",
        },
        ...current,
      ]);
      showToast({
        tone: "success",
        title: "成员已新增",
        description: "新成员已完成角色、用户名、密码和模块权限配置。",
      });
    } else if (selectedMemberId) {
      setMembers((current) =>
        current.map((member) =>
          member.id === selectedMemberId
            ? {
                ...member,
                username: memberForm.username.trim(),
                password: memberForm.password.trim(),
                role: memberForm.role,
                modules: memberForm.modules,
              }
            : member,
        ),
      );
      showToast({
        tone: "success",
        title: "成员信息已更新",
        description: "成员角色、用户名、密码和模块权限已保存。",
      });
    }

    setMemberDrawerMode(null);
    setSelectedMemberId(null);
  };

  const confirmDeleteMember = () => {
    if (!deleteTarget) return;
    if (deleteTarget.protected) {
      showToast({
        tone: "warning",
        title: "超级管理员不可删除",
        description: "根据定义，超级管理员不能被删除。",
      });
      setDeleteMemberId(null);
      return;
    }
    setMembers((current) => current.filter((member) => member.id !== deleteTarget.id));
    setDeleteMemberId(null);
    showToast({
      tone: "success",
      title: "成员已删除",
      description: `${deleteTarget.username} 已从成员列表移除。`,
    });
  };

  const selectClassName =
    "h-12 w-full appearance-none rounded-[20px] border border-[#d8ebff] bg-[linear-gradient(180deg,#fbfdff_0%,#f4f9ff_100%)] pl-4 pr-11 text-sm text-slate-700 shadow-[0_12px_28px_rgba(27,139,250,0.06)] outline-none transition focus:border-[#1B8BFA] focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,139,250,0.12)]";

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="已有成员列表"
          action={
            <div className="flex items-center gap-3">
              <button
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d8ebff] bg-white text-[#5d8fc5] shadow-[0_12px_28px_rgba(27,139,250,0.08)] transition hover:text-[#1B8BFA]"
                onClick={() => setRoleGuideOpen(true)}
                aria-label="查看角色权限说明"
              >
                <CircleHelp className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-2.5 text-sm font-medium text-white" onClick={openCreateMember}>
                <UserPlus className="h-4 w-4" />
                新增成员
              </button>
            </div>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_auto]">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="brand-input"
              placeholder="用户名搜索"
            />
            <div className="relative">
              <select value={roleKeyword} onChange={(event) => setRoleKeyword(event.target.value)} className={selectClassName}>
                <option value="">全部角色</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f8fb3]" />
            </div>
            <button className="brand-primary-btn px-5 py-3">查询</button>
          </div>
        </Panel>

        <Panel padded={false}>
          <div className="overflow-x-auto">
            <table className="brand-table min-w-full text-left text-sm">
              <thead>
                <tr>
                  {["用户名", "角色", "可访问模块", "创建时间", "操作"].map((head) => (
                    <th key={head} className="px-5 py-4 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr key={member.id} className={index !== filteredMembers.length - 1 ? "border-b border-[#eaf4ff]" : ""}>
                    <td className="px-5 py-4 font-medium text-slate-900">{member.username}</td>
                    <td className="px-5 py-4">{member.role}</td>
                    <td className="px-5 py-4 text-slate-600">{member.modules.join(" / ")}</td>
                    <td className="px-5 py-4">{member.createdAt}</td>
                    <td className="px-5 py-4">
                      {member.protected ? (
                        <span className="text-xs font-medium text-[#8aa6c3]">-</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button className="rounded-full border border-[#d8ebff] bg-white px-3 py-1.5 text-xs font-medium text-[#6287b0]" onClick={() => openEditMember(member)}>
                            修改信息
                          </button>
                          <button className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700" onClick={() => setDeleteMemberId(member.id)}>
                            删除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Drawer
        open={memberDrawerMode !== null}
        title={memberDrawerMode === "create" ? "新增成员" : `修改成员 ${selectedMember?.username ?? ""}`}
        onClose={() => {
          setMemberDrawerMode(null);
          setSelectedMemberId(null);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700" onClick={() => setMemberDrawerMode(null)}>
              取消
            </button>
            <button className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" onClick={saveMember}>
              保存成员
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-700">角色</div>
              <div className="relative">
                <select className={selectClassName} value={memberForm.role} onChange={(event) => updateRole(event.target.value as RoleName)}>
                  {roleOptions.filter((role) => role !== "超级管理员").map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f8fb3]" />
              </div>
            </label>
            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-700">用户名</div>
              <input
                className="brand-input"
                value={memberForm.username}
                onChange={(event) => setMemberForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="例如：ops_wang"
              />
            </label>
            <label className="block md:col-span-2">
              <div className="mb-2 text-sm font-medium text-slate-700">密码</div>
              <input
                className="brand-input"
                value={memberForm.password}
                onChange={(event) => setMemberForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="至少 8 位，包含大小写字母、数字和特殊字符"
              />
            </label>
          </div>

          <section className="rounded-[28px] border border-[#d8ebff] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-5">
            <h4 className="text-base font-semibold text-slate-950">可访问模块</h4>
            <div className="mt-4 flex flex-wrap gap-3">
              {moduleOptions.map((module) => (
                <label key={module} className="inline-flex items-center gap-2 rounded-full border border-[#d7e9ff] bg-white px-4 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={memberForm.modules.includes(module)}
                    onChange={(event) =>
                      setMemberForm((current) => ({
                        ...current,
                        modules: event.target.checked
                          ? [...current.modules, module]
                          : current.modules.filter((item) => item !== module),
                      }))
                    }
                  />
                  <span>{module}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </Drawer>

      <Drawer
        open={roleGuideOpen}
        title="角色默认权限说明"
        description="这里展示推荐默认权限。新增成员时可以先选角色，再按实际需要微调模块勾选。"
        onClose={() => setRoleGuideOpen(false)}
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {roleOptions.map((role) => (
              <div key={role} className="rounded-[24px] border border-[#dbeeff] bg-[linear-gradient(180deg,#fbfdff_0%,#f4f9ff_100%)] p-4">
                <div className="text-base font-semibold text-slate-950">{role}</div>
                <div className="mt-3 text-sm leading-6 text-[#6f8fb3]">{rolePresets[role].join(" / ")}</div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-[#d8ebff]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["模块", "超级管理员", "运营人员", "开发人员", "产品经理"].map((head) => (
                    <th key={head} className="px-5 py-4 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {defaultRoleMatrix.map((row, index) => (
                  <tr key={row.module} className={index !== defaultRoleMatrix.length - 1 ? "border-b border-slate-100" : ""}>
                    <td className="px-5 py-4 font-medium text-slate-900">{row.module}</td>
                    <td className="px-5 py-4">{row.superAdmin ? "✓" : "-"}</td>
                    <td className="px-5 py-4">{row.operator ? "✓" : "-"}</td>
                    <td className="px-5 py-4">{row.developer ? "✓" : "-"}</td>
                    <td className="px-5 py-4">{row.product ? "✓" : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        open={deleteMemberId !== null}
        title="确认删除成员"
        description={`删除后 ${deleteTarget?.username ?? ""} 将无法继续登录后台。`}
        confirmText="确认删除"
        onCancel={() => setDeleteMemberId(null)}
        onConfirm={confirmDeleteMember}
      >
        <div className="rounded-[24px] border border-rose-100 bg-rose-50/70 p-4 text-sm leading-6 text-slate-700">
          该操作不可撤销。超级管理员成员不会在这里被删除。
        </div>
      </ConfirmModal>
    </AppShell>
  );
}
