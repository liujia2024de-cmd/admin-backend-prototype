import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, CircleAlert, Clapperboard, LogOut, Megaphone, MessageSquareMore, Sparkles } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { clearSession, readSession } from "@/lib/auth";
import {
  getVisibleNotifications,
  markAllMessagesRead,
  markMessageRead,
  readMessageCenter,
  subscribeMessageCenter,
  type NotificationItem,
} from "@/lib/messageCenter";

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
  const navigate = useNavigate();
  const session = readSession();
  const [messageCenterOpen, setMessageCenterOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => readMessageCenter());
  const pageInfo = useMemo(() => {
    const matchedEntry = Object.entries(titleMap).find(([path]) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`),
    );
    return matchedEntry?.[1] ?? { title: "后台工作台", description: "集中处理设备、内容、售后与运营事务" };
  }, [location.pathname]);
  const visibleNotifications = useMemo(() => {
    return getVisibleNotifications(notifications, session?.role);
  }, [notifications, session?.role]);
  const unreadCount = visibleNotifications.filter((item) => !item.read).length;
  const categoryMeta = {
    运维异常: {
      icon: CircleAlert,
      tone: "bg-rose-50 text-rose-600",
    },
    售后消息: {
      icon: MessageSquareMore,
      tone: "bg-amber-50 text-amber-600",
    },
    视频捐献: {
      icon: Clapperboard,
      tone: "bg-emerald-50 text-emerald-600",
    },
    活动下线: {
      icon: Megaphone,
      tone: "bg-[#eef6ff] text-[#1B8BFA]",
    },
  } as const;

  useEffect(() => {
    setNotifications(readMessageCenter());
    return subscribeMessageCenter(setNotifications);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(markAllMessagesRead());
  };

  const handleMarkRead = (messageId: string) => {
    setNotifications(markMessageRead(messageId));
  };

  return (
    <>
      <header className="sticky top-0 z-30 min-h-[101px] border-b border-[#d7e9ff] bg-white/88 px-6 py-5 backdrop-blur-xl">
        <div className="flex min-h-[61px] flex-col justify-center gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950">{pageInfo.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-[#6784a8]">{pageInfo.description}</p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setMessageCenterOpen(true)}
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4e8ff] bg-white text-[#448bda] shadow-[0_12px_28px_rgba(27,139,250,0.08)] transition hover:-translate-y-0.5 hover:shadow-md"
              aria-label="打开消息中心"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <>
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#1B8BFA]" />
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                </>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => {
                clearSession();
                navigate("/login", { replace: true });
              }}
              className="flex items-center gap-2 rounded-2xl border border-[#d4e8ff] bg-white px-4 py-3 text-sm font-medium text-[#1B8BFA] shadow-[0_12px_28px_rgba(27,139,250,0.08)] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>

            <div className="flex items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#1B8BFA_0%,#3AA3FF_100%)] px-4 py-3 text-white shadow-[0_18px_36px_rgba(27,139,250,0.28)]">
              <div className="rounded-xl bg-white/16 p-2">
                <Sparkles className="h-4 w-4 text-[#eaf4ff]" />
              </div>
              <div>
                <div className="text-sm font-medium">{session?.role ?? "未登录"}</div>
                <div className="text-xs text-[#dbeeff]">{session?.email ?? "-"}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Drawer
        open={messageCenterOpen}
        title="消息中心"
        description="统一查看运维异常、售后新增用户消息、新视频捐献和运营活动自动下线通知。消息数据持久保存在站内消息系统中，原型内同步展示已读状态。"
        onClose={() => setMessageCenterOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-[#6f8fb3]">
              共 {visibleNotifications.length} 条消息，未读 {unreadCount} 条
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="rounded-2xl border border-[#d8ebff] bg-white px-4 py-3 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA]"
            >
              全部标记为已读
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[24px] border border-[#d8ebff] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4">
            <div className="text-sm font-semibold text-slate-900">待优先处理</div>
            <div className="mt-2 text-2xl font-semibold text-[#1B8BFA]">{unreadCount}</div>
            <div className="mt-1 text-sm text-[#6f8fb3]">包含运维异常、售后新增消息和新视频捐献等未读通知</div>
          </div>

          <div className="space-y-3">
            {visibleNotifications.map((item) => {
              const meta = categoryMeta[item.category];
              const Icon = meta.icon;
              return (
                <div
                  key={item.id}
                  className={`rounded-[24px] border p-5 transition ${
                    item.read ? "border-[#e8f2ff] bg-white" : "border-[#cfe4ff] bg-[linear-gradient(180deg,#fbfdff_0%,#f3f9ff_100%)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.tone}`}>{item.category}</span>
                          {!item.read ? <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600">未读</span> : null}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-[#6f8fb3]">{item.description}</div>
                        <div className="mt-2 text-xs text-[#90a6c0]">{item.time}</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {!item.read ? (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(item.id)}
                          className="rounded-full border border-[#d8ebff] bg-white px-3 py-1.5 text-xs font-medium text-[#6287b0]"
                        >
                          标记已读
                        </button>
                      ) : null}
                      <Link
                        to={item.link}
                        onClick={() => {
                          handleMarkRead(item.id);
                          setMessageCenterOpen(false);
                        }}
                        className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white shadow-[0_10px_18px_rgba(27,139,250,0.18)]"
                      >
                        前往查看
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Drawer>
    </>
  );
}
