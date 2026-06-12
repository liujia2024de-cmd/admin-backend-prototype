import type { UserRecord } from "@/data/mock";

export type UserActivityLevel = "活跃" | "沉默" | "流失风险" | "流失";
export type UserActivitySecondaryTag = "近24小时高活跃" | null;

export const USER_ACTIVITY_REFERENCE_DATE = new Date("2026-06-11T12:00:00");

export function getInactiveDays(lastActiveAt: string, referenceDate = USER_ACTIVITY_REFERENCE_DATE) {
  const activeDate = new Date(lastActiveAt.replace(" ", "T"));
  return Math.max(0, Math.floor((referenceDate.getTime() - activeDate.getTime()) / (1000 * 60 * 60 * 24)));
}

export function isHighActivityWithin24Hours(lastActiveAt: string, referenceDate = USER_ACTIVITY_REFERENCE_DATE) {
  const activeDate = new Date(lastActiveAt.replace(" ", "T"));
  return referenceDate.getTime() - activeDate.getTime() <= 24 * 60 * 60 * 1000;
}

export function getUserActivityLevel(lastActiveAt: string, referenceDate = USER_ACTIVITY_REFERENCE_DATE): UserActivityLevel {
  const inactiveDays = getInactiveDays(lastActiveAt, referenceDate);
  if (inactiveDays <= 7) return "活跃";
  if (inactiveDays <= 30) return "沉默";
  if (inactiveDays <= 60) return "流失风险";
  return "流失";
}

export function getUserActivityTone(level: UserActivityLevel) {
  if (level === "活跃") return "green" as const;
  if (level === "沉默") return "blue" as const;
  if (level === "流失风险") return "amber" as const;
  return "rose" as const;
}

export function getUserActivityDescription(level: UserActivityLevel) {
  if (level === "活跃") return "近 7 天内有登录或前台会话";
  if (level === "沉默") return "8~30 天未打开 App";
  if (level === "流失风险") return "31~60 天未打开 App";
  return "超过 60 天未打开 App";
}

export function getUserActivitySecondaryTag(lastActiveAt: string, referenceDate = USER_ACTIVITY_REFERENCE_DATE): UserActivitySecondaryTag {
  return isHighActivityWithin24Hours(lastActiveAt, referenceDate) ? "近24小时高活跃" : null;
}

export function buildUserActivityDistribution(users: UserRecord[], referenceDate = USER_ACTIVITY_REFERENCE_DATE) {
  const order: UserActivityLevel[] = ["活跃", "沉默", "流失风险", "流失"];
  const counts = new Map<UserActivityLevel, number>(order.map((item) => [item, 0]));

  users.forEach((user) => {
    const level = getUserActivityLevel(user.lastActiveAt, referenceDate);
    counts.set(level, (counts.get(level) ?? 0) + 1);
  });

  const total = users.length || 1;
  return order.map((name) => {
    const value = counts.get(name) ?? 0;
    const share = Number(((value / total) * 100).toFixed(1));
    return {
      name,
      value,
      share,
      displayValue: `${share}% (${value.toLocaleString()}人)`,
    };
  });
}

export function buildHighActivityInsight(users: UserRecord[], referenceDate = USER_ACTIVITY_REFERENCE_DATE) {
  const highActiveCount = users.filter((user) => isHighActivityWithin24Hours(user.lastActiveAt, referenceDate)).length;
  const activeUsers = users.filter((user) => getUserActivityLevel(user.lastActiveAt, referenceDate) === "活跃");
  const activeBase = activeUsers.length || 1;

  return {
    highActiveCount,
    highActiveShare: Number(((highActiveCount / (users.length || 1)) * 100).toFixed(1)),
    highActiveWithinActiveShare: Number(((highActiveCount / activeBase) * 100).toFixed(1)),
  };
}
