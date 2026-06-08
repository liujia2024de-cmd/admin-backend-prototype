import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, LogOut, Sparkles } from "lucide-react";

const titleMap: Record<string, { title: string; description: string }> = {
  "/login": { title: "达芬奇黑洞IOT管理后台", description: "使用后台成员账号登录系统，未登录前不展示任何业务数据" },
  "/dashboard": { title: "数据看板", description: "查看注册用户、设备、功能使用和版本分布的整体趋势" },
  "/users": { title: "用户管理", description: "查看用户信息、设备持有情况与历史活跃状态" },
  "/devices": { title: "设备管理", description: "统一查看全部设备，并按类型下钻进入详情" },
  "/ota": { title: "OTA管理", description: "管理固件版本、发布策略和升级状态" },
  "/logs": { title: "日志管理", description: "查看日志文件元数据、下载记录和来源分布" },
  "/tickets": { title: "售后服务", description: "统一查看工单、处理用户问题与回访状态" },
  "/operations": { title: "运营管理", description: "统一管理弹窗活动与 Banner 广告位的投放、优先级和点击表现" },
  "/infra": { title: "运维管理", description: "跟踪核心服务用量、自动扩容、请求并发、告警与基础设施成本" },
  "/cms/faq": { title: "CMS 管理", description: "维护 FAQ、知识库入口和物种参数配置" },
  "/cms/knowledge": { title: "动物知识库", description: "查看知识库同步内容、预览 H5 页面和刷新状态" },
  "/cms/preset": { title: "预设参数库", description: "维护不同物种对应的中控推荐参数与时间策略" },
  "/operations/popup": { title: "弹窗活动管理", description: "配置首页弹窗活动的频率、优先级与目标用户" },
  "/operations/banner": { title: "Banner 活动管理", description: "管理首页底部和设备页底部的浮层 Banner" },
  "/ai-feedback/videos": { title: "用户捐献视频", description: "查看用户捐献视频、筛选标签并追踪下载记录" },
  "/admin/users": { title: "后台成员管理", description: "管理后台成员账号、角色归属和状态" },
  "/admin/roles": { title: "账号与权限", description: "配置后台成员、角色模板和模块访问权限" },
  "/403": { title: "访问受限", description: "当前账号没有访问该模块的权限，请联系超级管理员处理" },
};

export function TopBar() {
  const location = useLocation();
  const pageInfo = useMemo(() => {
    const matchedEntry = Object.entries(titleMap).find(([path]) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`),
    );
    return matchedEntry?.[1] ?? { title: "后台工作台", description: "集中处理设备、内容、售后与运营事务" };
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 min-h-[101px] border-b border-[#d7e9ff] bg-white/88 px-6 py-5 backdrop-blur-xl">
      <div className="flex min-h-[61px] flex-col justify-center gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950">{pageInfo.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#6784a8]">{pageInfo.description}</p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4e8ff] bg-white text-[#448bda] shadow-[0_12px_28px_rgba(27,139,250,0.08)] transition hover:-translate-y-0.5 hover:shadow-md">
            <Bell className="h-4 w-4" />
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#1B8BFA]" />
          </button>

          <Link
            to="/login"
            className="flex items-center gap-2 rounded-2xl border border-[#d4e8ff] bg-white px-4 py-3 text-sm font-medium text-[#1B8BFA] shadow-[0_12px_28px_rgba(27,139,250,0.08)] transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </Link>

          <div className="flex items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#1B8BFA_0%,#3AA3FF_100%)] px-4 py-3 text-white shadow-[0_18px_36px_rgba(27,139,250,0.28)]">
            <div className="rounded-xl bg-white/16 p-2">
              <Sparkles className="h-4 w-4 text-[#eaf4ff]" />
            </div>
            <div>
              <div className="text-sm font-medium">超级管理员</div>
              <div className="text-xs text-[#dbeeff]">today@reptile-lab.io</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
