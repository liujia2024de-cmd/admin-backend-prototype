import { canAccessPath, type AppRole } from "@/lib/auth";

export type NotificationCategory = "运维异常" | "售后消息" | "视频捐献" | "活动下线";

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  time: string;
  link: string;
  read: boolean;
};

const MESSAGE_CENTER_KEY = "advinci_admin_message_center";

const defaultNotifications: NotificationItem[] = [
  {
    id: "notification-1",
    category: "运维异常",
    title: "存储服务负载超过阈值",
    description: "新加坡节点对象存储服务 5 分钟平均负载达到 83%，建议关注自动扩容状态。",
    time: "2 分钟前",
    link: "/infra",
    read: false,
  },
  {
    id: "notification-2",
    category: "售后消息",
    title: "新增 1 条售后用户消息待处理",
    description: "用户反馈摄像头夜视画面异常，系统已自动关联对应工单和设备信息。",
    time: "8 分钟前",
    link: "/tickets",
    read: false,
  },
  {
    id: "notification-3",
    category: "视频捐献",
    title: "收到新的视频捐献记录",
    description: "用户刚上传 3 条新捐献视频，包含进食行为和守宫活动片段，建议尽快复核标签。",
    time: "15 分钟前",
    link: "/ai-feedback/videos",
    read: false,
  },
  {
    id: "notification-4",
    category: "活动下线",
    title: "运营活动已到期自动下线",
    description: "618 App 首页弹窗活动已结束，系统已自动完成下线并生成效果归档。",
    time: "32 分钟前",
    link: "/operations",
    read: true,
  },
];

const cloneDefaultNotifications = () => defaultNotifications.map((item) => ({ ...item }));

export const readMessageCenter = () => {
  if (typeof window === "undefined") return cloneDefaultNotifications();
  const raw = window.localStorage.getItem(MESSAGE_CENTER_KEY);
  if (!raw) {
    const seeded = cloneDefaultNotifications();
    window.localStorage.setItem(MESSAGE_CENTER_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(raw) as NotificationItem[];
  } catch {
    const seeded = cloneDefaultNotifications();
    window.localStorage.setItem(MESSAGE_CENTER_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

export const writeMessageCenter = (notifications: NotificationItem[]) => {
  window.localStorage.setItem(MESSAGE_CENTER_KEY, JSON.stringify(notifications));
};

export const updateMessageCenter = (updater: (notifications: NotificationItem[]) => NotificationItem[]) => {
  const next = updater(readMessageCenter());
  writeMessageCenter(next);
  return next;
};

export const markMessageRead = (messageId: string) =>
  updateMessageCenter((notifications) =>
    notifications.map((item) => (item.id === messageId ? { ...item, read: true } : item)),
  );

export const markAllMessagesRead = () =>
  updateMessageCenter((notifications) => notifications.map((item) => ({ ...item, read: true })));

export const subscribeMessageCenter = (callback: (notifications: NotificationItem[]) => void) => {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: StorageEvent) => {
    if (event.key !== MESSAGE_CENTER_KEY) return;
    callback(readMessageCenter());
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
};

export const getVisibleNotifications = (notifications: NotificationItem[], role: AppRole | undefined) => {
  if (!role) return [];
  return notifications.filter((item) => canAccessPath(role, item.link) || item.link === "/ai-feedback/videos");
};
