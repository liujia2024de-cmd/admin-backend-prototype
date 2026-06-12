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
  "视频捐献",
  "运营管理",
  "内容管理（CMS）",
  "售后管理",
  "日志管理",
  "账号管理",
] as const;

const roleOptions = ["超级管理员", "运营人员", "开发人员", "产品经理", "其他角色"] as const;

type ModuleName = (typeof moduleOptions)[number];
type RoleName = (typeof roleOptions)[number];

type MemberRecord = {
  id: string;
  username: string;
  password: string;
  email: string;
  role: RoleName;
  modules: ModuleName[];
  authMethod: string;
  emailVerificationEnabled: boolean;
  lastVerifiedAt: string;
  lastLoginDevice: string;
  createdAt: string;
  protected?: boolean;
};

const rolePresets: Record<RoleName, ModuleName[]> = {
  超级管理员: [...moduleOptions],
  运营人员: ["大数据看板", "用户管理", "设备管理", "运营管理", "内容管理（CMS）", "售后管理"],
  开发人员: ["设备管理", "OTA管理", "视频捐献", "日志管理"],
  产品经理: ["大数据看板", "运营管理", "内容管理（CMS）", "售后管理"],
  其他角色: ["设备管理", "售后管理"],
};

const roleDescriptions: Record<RoleName, string> = {
  超级管理员: "登录采用账号密码 + 邮箱验证码二次验证，可访问全部模块，并独占用户管理、设备管理、视频捐献中的批量导出与导出任务入口。",
  运营人员: "默认聚焦用户、设备、运营、CMS 和售后模块，登录采用账号密码 + 邮箱验证码，不显示后台导出入口与系统级配置模块。",
  开发人员: "登录采用账号密码 + 邮箱验证码，登录后仅显示设备管理、OTA管理、日志管理、视频捐献，用于定位设备、排查升级与日志问题。",
  产品经理: "登录采用账号密码 + 邮箱验证码，默认聚焦看板、运营、CMS 和售后，用于查看业务表现与配置内容，不进入研发和系统管理模块。",
  其他角色: "可按实际需要勾选少量模块，适合临时协作成员或受限账号。",
};

const initialMembers: MemberRecord[] = [
  {
    id: "member-1",
    username: "today_admin",
    password: "Admin@123",
    email: "today@reptile-lab.io",
    role: "超级管理员",
    modules: [...moduleOptions],
    authMethod: "账号密码 + 邮箱验证码",
    emailVerificationEnabled: true,
    lastVerifiedAt: "2026-06-11 09:18",
    lastLoginDevice: "MacBook Pro / Chrome 137 / 深圳",
    createdAt: "2026-01-08 09:00",
    protected: true,
  },
  {
    id: "member-2",
    username: "ops_zhou",
    password: "Ops@2026",
    email: "ops.zhou@reptile-lab.io",
    role: "运营人员",
    modules: rolePresets["运营人员"],
    authMethod: "账号密码 + 邮箱验证码",
    emailVerificationEnabled: true,
    lastVerifiedAt: "2026-06-10 18:42",
    lastLoginDevice: "Windows / Edge / 广州",
    createdAt: "2026-03-12 10:22",
  },
  {
    id: "member-3",
    username: "dev_li",
    password: "Dev@2026",
    email: "dev.li@reptile-lab.io",
    role: "开发人员",
    modules: rolePresets["开发人员"],
    authMethod: "账号密码 + 邮箱验证码",
    emailVerificationEnabled: true,
    lastVerifiedAt: "2026-06-11 08:51",
    lastLoginDevice: "Mac mini / Chrome 137 / 上海",
    createdAt: "2026-04-18 13:40",
  },
  {
    id: "member-4",
    username: "pm_lin",
    password: "Pm@2026",
    email: "pm.lin@reptile-lab.io",
    role: "产品经理",
    modules: rolePresets["产品经理"],
    authMethod: "账号密码 + 邮箱验证码",
    emailVerificationEnabled: true,
    lastVerifiedAt: "2026-06-10 21:06",
    lastLoginDevice: "MacBook Air / Safari / 北京",
    createdAt: "2026-04-22 11:08",
  },
  {
    id: "member-5",
    username: "support_he",
    password: "Support@2026",
    email: "support.he@reptile-lab.io",
    role: "其他角色",
    modules: ["设备管理", "售后管理", "内容管理（CMS）"],
    authMethod: "账号密码 + 邮箱验证码",
    emailVerificationEnabled: true,
    lastVerifiedAt: "2026-06-09 16:24",
    lastLoginDevice: "未记录",
    createdAt: "2026-05-03 17:16",
  },
];

const emptyMemberForm = {
  username: "",
  password: "",
  email: "",
  role: "运营人员" as RoleName,
  modules: rolePresets["运营人员"],
  emailVerificationEnabled: true,
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
      email: "",
      role: "运营人员",
      modules: rolePresets["运营人员"],
      emailVerificationEnabled: true,
    });
    setMemberDrawerMode("create");
  };

  const openEditMember = (member: MemberRecord) => {
    setSelectedMemberId(member.id);
    setMemberForm({
      username: member.username,
      password: member.password,
      email: member.email,
      role: member.role,
      modules: member.modules,
      emailVerificationEnabled: member.emailVerificationEnabled,
    });
    setMemberDrawerMode("edit");
  };

  const saveMember = () => {
    if (!memberForm.username.trim() || !memberForm.password.trim() || !memberForm.email.trim() || memberForm.modules.length === 0) {
      showToast({
        tone: "warning",
        title: "请先补全成员信息",
        description: "请选择角色，并填写用户名、密码、登录邮箱和可访问模块。",
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
          email: memberForm.email.trim(),
          role: memberForm.role,
          modules: memberForm.modules,
          authMethod: "账号密码 + 邮箱验证码",
          emailVerificationEnabled: true,
          lastVerifiedAt: memberForm.emailVerificationEnabled ? "2026-06-11 10:00" : "未开启",
          lastLoginDevice: "首次登录后生成",
          createdAt: "2026-06-04 15:00",
        },
        ...current,
      ]);
      showToast({
        tone: "success",
        title: "成员已新增",
        description: "新成员已完成角色、用户名、密码、邮箱和模块权限配置。",
      });
    } else if (selectedMemberId) {
      setMembers((current) =>
        current.map((member) =>
          member.id === selectedMemberId
            ? {
                ...member,
                username: memberForm.username.trim(),
                password: memberForm.password.trim(),
                email: memberForm.email.trim(),
                role: memberForm.role,
                modules: memberForm.modules,
                authMethod: "账号密码 + 邮箱验证码",
                emailVerificationEnabled: true,
                lastVerifiedAt: member.lastVerifiedAt,
              }
            : member,
        ),
      );
      showToast({
        tone: "success",
        title: "成员信息已更新",
        description: "成员角色、用户名、密码、邮箱和模块权限已保存。",
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
                  {["用户名", "登录邮箱", "角色", "邮箱验证", "最近验证时间", "最近登录设备", "可访问模块", "创建时间", "操作"].map((head) => (
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
                    <td className="px-5 py-4 text-slate-600">{member.email}</td>
                    <td className="px-5 py-4">{member.role}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          member.emailVerificationEnabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {member.emailVerificationEnabled ? "已开启" : "未开启"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{member.lastVerifiedAt}</td>
                    <td className="px-5 py-4 text-slate-600">{member.lastLoginDevice}</td>
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
          <div className="grid gap-4">
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
            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-700">密码</div>
              <input
                className="brand-input"
                value={memberForm.password}
                onChange={(event) => setMemberForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="至少 8 位，包含大小写字母、数字和特殊字符"
              />
            </label>
            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-700">登录邮箱</div>
              <input
                className="brand-input"
                value={memberForm.email}
                onChange={(event) => setMemberForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="例如：ops_wang@reptile-lab.io"
              />
            </label>
          </div>

          <section className="rounded-[24px] border border-[#d8ebff] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">邮箱验证码策略</div>
                <div className="mt-1 text-sm text-[#6f8fb3]">成员登录时强制要求账号密码校验通过后，再完成邮箱验证码二次验证。</div>
              </div>
              <span className="inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-medium text-[#1B8BFA]">全员强制开启</span>
            </div>
            <div className="mt-3 text-sm text-[#6f8fb3]">当前状态：账号密码 + 邮箱验证码，成员侧不可关闭。</div>
          </section>

          <section className="rounded-[24px] border border-[#d8ebff] bg-white p-5">
            <div className="text-sm font-semibold text-slate-900">登录安全策略</div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-[#6f8fb3]">
              <div>1. 所有成员统一使用账号密码 + 邮箱验证码二次验证，且邮箱验证码策略为全员强制开启。</div>
              <div>2. 账号密码校验通过后，系统会向该成员绑定邮箱发送 6 位验证码。</div>
              <div>3. 当前为原型演示，验证码流程为交互模拟，正式环境需接入真实邮件服务。</div>
              <div>4. 建议保留最近验证时间和最近登录设备，用于后续登录审计与风控提醒。</div>
            </div>
          </section>

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
        description="这里展示推荐默认权限和角色定位。新增成员时可以先选角色，再按实际需要微调模块勾选。"
        onClose={() => setRoleGuideOpen(false)}
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {roleOptions.map((role) => (
              <div key={role} className="rounded-[24px] border border-[#dbeeff] bg-[linear-gradient(180deg,#fbfdff_0%,#f4f9ff_100%)] p-4">
                <div className="text-base font-semibold text-slate-950">{role}</div>
                <div className="mt-3 text-sm leading-6 text-[#6f8fb3]">{roleDescriptions[role]}</div>
                <div className="mt-3 text-xs leading-6 text-[#8aa6c3]">默认模块：{rolePresets[role].join(" / ")}</div>
              </div>
            ))}
          </div>

          <div className="rounded-[28px] border border-[#d8ebff] bg-white p-5">
            <div className="text-sm font-semibold text-slate-950">当前登录演示角色</div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-[#6f8fb3]">
              <div>1. 超级管理员：today_admin / Admin@123 / today@reptile-lab.io。</div>
              <div>2. 开发人员：dev_li / Dev@2026 / dev.li@reptile-lab.io。</div>
              <div>3. 账号密码校验通过后，统一进入邮箱验证码验证步骤，原型演示验证码为 246810。</div>
              <div>4. 开发人员登录后会隐藏数据看板、用户管理、售后服务、运营管理、CMS、运维管理、账号管理。</div>
            </div>
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
