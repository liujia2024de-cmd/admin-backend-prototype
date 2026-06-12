import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getDefaultHomePath, readSession } from "@/lib/auth";

export default function NoAccessPage() {
  const session = readSession();
  const homePath = session ? getDefaultHomePath(session.role) : "/login";

  return (
    <AppShell>
      <AccessDenied
        title="访问受限"
        description="当前账号没有进入该模块的权限。你可以联系超级管理员调整模块勾选范围，或者返回首页继续处理其他任务。"
        action={
          <Link className="inline-flex rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" to={homePath}>
            返回首页
          </Link>
        }
      />
    </AppShell>
  );
}
