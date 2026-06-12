export type AppRegion = "cn" | "global";
export type AppRole = "超级管理员" | "开发人员";

export type AppSession = {
  username: string;
  role: AppRole;
  region: AppRegion;
  email: string;
};

export type NavItemAccess = {
  label: string;
  path: string;
  roles: AppRole[];
};

const SESSION_KEY = "advinci_admin_session";

export const demoAccounts: Record<
  AppRole,
  {
    username: string;
    password: string;
    email: string;
    verificationCode: string;
    description: string;
  }
> = {
  超级管理员: {
    username: "today_admin",
    password: "Admin@123",
    email: "today@reptile-lab.io",
    verificationCode: "246810",
    description: "账号密码校验通过后，还需完成邮箱验证码验证，登录后可访问全部模块。",
  },
  开发人员: {
    username: "dev_li",
    password: "Dev@2026",
    email: "dev.li@reptile-lab.io",
    verificationCode: "246810",
    description: "账号密码校验通过后，还需完成邮箱验证码验证，登录后仅显示设备、OTA、日志和视频捐献。",
  },
};

export const navAccessList: NavItemAccess[] = [
  { label: "数据看板", path: "/dashboard", roles: ["超级管理员"] },
  { label: "用户管理", path: "/users", roles: ["超级管理员"] },
  { label: "设备管理", path: "/devices", roles: ["超级管理员", "开发人员"] },
  { label: "OTA管理", path: "/ota", roles: ["超级管理员", "开发人员"] },
  { label: "日志管理", path: "/logs", roles: ["超级管理员", "开发人员"] },
  { label: "视频捐献", path: "/ai-feedback/videos", roles: ["超级管理员", "开发人员"] },
  { label: "售后服务", path: "/tickets", roles: ["超级管理员"] },
  { label: "运营管理", path: "/operations", roles: ["超级管理员"] },
  { label: "CMS", path: "/cms/faq", roles: ["超级管理员"] },
  { label: "运维管理", path: "/infra", roles: ["超级管理员"] },
  { label: "账号管理", path: "/admin/roles", roles: ["超级管理员"] },
];

export const getDefaultHomePath = (role: AppRole) => (role === "开发人员" ? "/devices" : "/dashboard");

export const canAccessPath = (role: AppRole, pathname: string) => {
  if (pathname === "/403") return true;
  return navAccessList.some(
    (item) => item.roles.includes(role) && (pathname === item.path || pathname.startsWith(`${item.path}/`)),
  );
};

export const readSession = () => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AppSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const writeSession = (session: AppSession) => {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  window.localStorage.removeItem(SESSION_KEY);
};

export const isSuperAdmin = (session: AppSession | null) => session?.role === "超级管理员";
