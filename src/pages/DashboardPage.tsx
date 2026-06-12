import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Bot, Check, ChevronDown, Cpu, Crown, Download, ShieldEllipsis, Sparkles, UsersRound, Wifi } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { devices, logFiles, users } from "@/data/mock";
import { buildHighActivityInsight, buildUserActivityDistribution, getUserActivityLevel, USER_ACTIVITY_REFERENCE_DATE } from "@/lib/userActivity";

type ReportTab = "users" | "devices" | "pet_profiles" | "ai" | "subscription";
type TimeRange = "日" | "周" | "月" | "年";
type ShortTimeRange = "日" | "周" | "月";
type UserScope = "users" | "household";
type AppUsageDateKey = "yesterday" | "today";
type DeviceType = (typeof devices)[number]["type"];
type UserTrendPoint = { name: string; users: number; active: number };
type DistributionDatum = { name: string; value: number; share: number; fill?: string; displayValue?: string };
type ReptilePetProfile = {
  userEmail: string;
  name: string;
  category: "蜥蜴类" | "守宫类" | "两栖类" | "龟类" | "蛇类";
  species: "瘤尾守宫" | "肥尾守宫" | "豹纹守宫" | "睫角守宫" | "鬃狮蜥" | "蓝舌石龙子" | "玉米蛇" | "猪鼻蛇" | "球蟒" | "姥爷蛙" | "赫曼陆龟";
  geneMorph: "高黄" | "白化" | "雪花" | "无纹" | "条纹" | "橘化" | "虎纹" | "黑夜" | "薰衣草" | "红眼白化" | "het白化" | "零纹";
  lifeStage: "幼体" | "亚成体" | "成体";
  healthStatus: "健康" | "一般" | "异常";
  mixedHousing: boolean;
  gender: "雄性" | "雌性" | "未知";
  ageBucket: "0-6个月" | "7-12个月" | "1-2岁" | "3-5岁" | "5岁以上";
  yearlyMatingCount: number;
  yearlyEggLayCount: number;
  yearlyHatchCount: number;
};
type CameraProfile = {
  eventRecordingsDaily: number;
  recordingDurationSeconds: number;
  liveViewDaily: number;
  liveViewPlayerDaily: number;
  liveViewDurationSeconds: number;
  playbackDaily: number;
  playbackDurationSeconds: number;
  settingsEntryDaily: number;
  petProfilesPerDevice: number;
  detectionMode: "检测所有活动" | "只检测动物活动";
  sensitivity: "高" | "中" | "低";
  nightVisionMode: "开启微光辅助夜视" | "关闭微光辅助夜视";
  recordingResolution: "1080P" | "720P" | "480P";
  liveViewResolution: "自动" | "1080P" | "720P" | "480P";
  installOrientation: "正装" | "90度" | "180度" | "270度" | "360度" | "其他倾斜角度";
  continuousRecording: "开启" | "关闭";
  sdCardStatus: "已插入SD卡" | "未插入SD卡";
  pushEnabled: boolean;
  dailyNotifications: number;
  pushOpenRate: number;
  pushLatencyBucket: "1s以内" | "1s" | "2s" | "3s" | "4s" | "5s" | "6s及以上";
  notificationStyle: "纯文本通知" | "文本+图片+描述";
  usageLocation: "客厅" | "卧室" | "阳台" | "门厅/玄关" | "庭院/花园" | "猫砂盆区" | "宠物活动房" | "厨房/餐区";
  appAnimalSpecies: "瘤尾守宫" | "豹纹守宫" | "睫角守宫" | "高冠变色龙" | "玉米蛇" | "高黄白化玉米蛇" | "球蟒" | "猪鼻蛇" | "印尼蓝舌石龙子" | "鬃狮蜥";
  aiAnimalSpecies: "瘤尾守宫" | "豹纹守宫" | "睫角守宫" | "高冠变色龙" | "玉米蛇" | "高黄白化玉米蛇" | "球蟒" | "猪鼻蛇" | "印尼蓝舌石龙子" | "鬃狮蜥";
  namingCluster: "按房间命名" | "按宠物名命名" | "按功能场景命名" | "默认设备名" | "个性化昵称";
  deviceName: string;
  regionCountry: "中国" | "美国" | "日本" | "英国" | "德国" | "加拿大" | "澳大利亚";
  regionCity: "深圳" | "上海" | "杭州" | "洛杉矶" | "旧金山" | "东京" | "大阪" | "伦敦" | "柏林" | "温哥华" | "悉尼";
  cloudServiceEnabled: boolean;
  cloudStorageEnabled: boolean;
  cloudAiEnabled: boolean;
  cloudClipEnabled: boolean;
  subscriptionRenewed: boolean;
  subscriptionPackage: "增值服务-单设备套餐-月付" | "增值服务-多设备套餐-月付" | "增值服务-单设备套餐-年付" | "增值服务-多设备套餐-年付" | "未订阅";
  firmwareVersion: string;
};
type CentralControlProfile = {
  settingsEntryDaily: number;
  temperatureAdjustDaily: number;
  humidityAdjustDaily: number;
  manualSprayDaily: number;
  manualSprayDurationSeconds: number;
  linkedPets: number;
  linkedFanLamps: number;
  fanSchedules: number;
  heaterPowerPercent: number;
  temperatureTargetBucket: "24-26°C" | "27-28°C" | "29-30°C" | "31-32°C" | "33°C及以上";
  humidityTargetBucket: "40-49%" | "50-59%" | "60-69%" | "70-79%" | "80%及以上";
  humidityMode: "智能恒湿模式" | "定时喷淋模式" | "手动即时喷淋";
  heaterLampOn: boolean;
  halogenLampOn: boolean;
  halogenScheduleEnabled: boolean;
  ledOn: boolean;
  ledBrightnessBucket: "0-20%" | "21-40%" | "41-60%" | "61-80%" | "81-100%";
  uvOn: boolean;
  fergusonZone: "FZ1 遮蔽型" | "FZ2 部分日照" | "FZ3 开放/晨昏型" | "FZ4 bask型";
  uvScheduleEnabled: boolean;
  simulateDaylightOn: boolean;
  nightLightOn: boolean;
  fanOn: boolean;
  fanSpeed: "1档" | "2档" | "3档" | "4档";
  ionizerOn: boolean;
  ionizerSyncWithFan: boolean;
  usageLocation: "客厅生态箱" | "书房饲养架" | "卧室孵化架" | "阳台育苗箱" | "工作室展示墙" | "检疫隔离区";
  linkedSpecies: "瘤尾守宫" | "豹纹守宫" | "睫角守宫" | "鬃狮蜥" | "玉米蛇" | "猪鼻蛇" | "球蟒" | "蓝舌石龙子" | "赫曼陆龟" | "姥爷蛙";
  linkedPetBucket: "1只" | "2-3只" | "4-5只" | "6只及以上";
  linkedFanLampBucket: "0台" | "1-2台" | "3-4台" | "5-6台" | "7台及以上";
  deviceName: string;
  regionCountry: "中国" | "美国" | "日本" | "英国" | "德国" | "加拿大" | "澳大利亚";
  regionCity: "深圳" | "上海" | "杭州" | "洛杉矶" | "旧金山" | "东京" | "大阪" | "伦敦" | "柏林" | "温哥华" | "悉尼";
  anomalyType: "温度异常" | "湿度异常" | "设备离线" | "传感器故障";
  anomalyEventsMonthly: number;
  otaUpdatedRecently: boolean;
  otaResumeUsed: boolean;
  wifiReprovisioned: boolean;
  firmwareVersion: string;
};

const pieColors = ["#5B8CFF", "#30C7C9", "#FF8A5B", "#9B7BFF", "#5B9D6B"];
const featurePalette = ["#5B8CFF", "#30C7C9", "#FF8A5B", "#9B7BFF", "#5B9D6B"];
const referenceDate = USER_ACTIVITY_REFERENCE_DATE;
const realisticGenderDistribution = [
  { name: "女", value: 71240 },
  { name: "男", value: 53440 },
];
const realisticAgeDistribution = [
  { name: "18以下", value: 8420 },
  { name: "18-25", value: 23760 },
  { name: "26-35", value: 41860 },
  { name: "36-45", value: 28740 },
  { name: "46-55", value: 14980 },
  { name: "56以上", value: 6920 },
];
const realisticRegionDistribution = [
  { name: "美国 / 洛杉矶", value: 18540 },
  { name: "中国 / 深圳", value: 16280 },
  { name: "中国 / 上海", value: 14960 },
  { name: "日本 / 东京", value: 12840 },
  { name: "英国 / 曼彻斯特", value: 10760 },
  { name: "中国 / 杭州", value: 9840 },
  { name: "德国 / 柏林", value: 8760 },
  { name: "法国 / 巴黎", value: 7920 },
  { name: "加拿大 / 温哥华", value: 6830 },
  { name: "澳大利亚 / 悉尼", value: 5970 },
  { name: "新加坡 / 新加坡", value: 4860 },
  { name: "荷兰 / 阿姆斯特丹", value: 3120 },
  { name: "阿联酋 / 迪拜", value: 2200 },
  { name: "西班牙 / 马德里", value: 1800 },
];
const realisticPnHouseholdCount = [
  { name: "C6001", value: 5240 },
  { name: "C6002", value: 4860 },
  { name: "T1001", value: 4520 },
  { name: "C6003", value: 4180 },
  { name: "T1002", value: 3860 },
  { name: "C6004", value: 3520 },
  { name: "T1003", value: 3280 },
  { name: "C6005", value: 2940 },
  { name: "T1004", value: 2610 },
  { name: "T1005", value: 2240 },
  { name: "C6006", value: 1980 },
  { name: "T1006", value: 1720 },
  { name: "T1007", value: 1460 },
];
const realisticHouseholdComboStats = [
  { name: "C6001 + T1001", percent: 18.6 },
  { name: "C6002 + T1003", percent: 15.9 },
  { name: "C6003 + C6004 + T1001", percent: 13.2 },
  { name: "C6001 + C6002 + T1002", percent: 10.7 },
  { name: "C6005 + T1004 + T1005", percent: 8.9 },
  { name: "C6003 + T1002", percent: 7.5 },
  { name: "C6004 + T1006 + T1007", percent: 6.4 },
  { name: "C6001 + C6006 + T1003 + T1004", percent: 5.6 },
  { name: "C6002 + C6005 + T1001", percent: 4.8 },
  { name: "T1002 + T1003 + T1004 + T1005", percent: 3.9 },
];
const appUsageHourlyPreset: Record<AppUsageDateKey, Record<UserScope, number[]>> = {
  yesterday: {
    users: [1.8, 1.1, 0.8, 0.7, 0.9, 1.6, 3.2, 5.4, 7.1, 8.3, 9.2, 10.1, 10.8, 10.2, 9.7, 9.4, 10.6, 12.4, 14.6, 16.8, 17.5, 16.2, 12.1, 6.4],
    household: [1.2, 0.8, 0.6, 0.5, 0.7, 1.1, 2.6, 4.3, 5.8, 6.9, 7.8, 8.6, 9.1, 8.9, 8.5, 8.2, 9.1, 10.7, 12.9, 14.8, 15.4, 14.1, 10.8, 5.7],
  },
  today: {
    users: [1.7, 1.1, 0.8, 0.7, 0.9, 1.5, 3, 5.3, 7.4, 8.6, 9.6, 10.4, 11.1, 10.7, 10.2, 10, 11.7, 13.8, 16.1, 18.4, 19, 17.3, 13.2, 7.1],
    household: [1.2, 0.8, 0.6, 0.5, 0.7, 1.1, 2.4, 4.2, 5.9, 7.1, 8, 8.8, 9.4, 9.1, 8.9, 8.8, 10.1, 12, 14.3, 16.5, 17.1, 15.5, 11.9, 6.3],
  },
};

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
const phoneModelUsagePreset = [
  { name: "iPhone 15 Pro / iOS 18.1", percent: 16.4 },
  { name: "iPhone 14 / iOS 17.6", percent: 13.9 },
  { name: "Samsung S24 / Android 15", percent: 11.8 },
  { name: "Xiaomi 14 / HyperOS 2.0", percent: 10.6 },
  { name: "HUAWEI Pura 70 / HarmonyOS 4.2", percent: 8.9 },
  { name: "OPPO Find X7 / Android 15", percent: 7.8 },
  { name: "vivo X100 / Android 15", percent: 6.9 },
  { name: "iPhone 13 / iOS 17.5", percent: 6.1 },
];
const appVersionUsagePreset = [
  { name: "v5.8.2", percent: 28.6 },
  { name: "v5.8.1", percent: 22.4 },
  { name: "v5.8.0", percent: 18.2 },
  { name: "v5.7.5", percent: 12.8 },
  { name: "v5.7.4", percent: 8.6 },
  { name: "v5.7.3", percent: 5.9 },
  { name: "v5.7.2", percent: 3.5 },
];

const reportTabs = [
  { id: "users" as ReportTab, label: "用户大数据报表", description: "household、用户数、活跃度和画像", icon: <UsersRound className="h-4.5 w-4.5" /> },
  { id: "devices" as ReportTab, label: "设备大数据报表", description: "按 PN 看 Wi-Fi、固件和功能开启", icon: <Cpu className="h-4.5 w-4.5" /> },
  { id: "pet_profiles" as ReportTab, label: "宠物档案报表", description: "爬宠命名、品种、健康、繁殖与基因画像", icon: <Sparkles className="h-4.5 w-4.5" /> },
  { id: "ai" as ReportTab, label: "AI服务报表", description: "各 AI 功能开启率、使用率和服务表现", icon: <Bot className="h-4.5 w-4.5" /> },
  { id: "subscription" as ReportTab, label: "订阅服务报表", description: "购买套餐比例、续费和收入趋势", icon: <Crown className="h-4.5 w-4.5" /> },
];

const userCardIcons = [
  <UsersRound className="h-5 w-5" />,
  <Activity className="h-5 w-5" />,
  <Sparkles className="h-5 w-5" />,
  <Cpu className="h-5 w-5" />,
  <ShieldEllipsis className="h-5 w-5" />,
  <Wifi className="h-5 w-5" />,
];

const baseUserSummary = {
  households: 16840,
  registeredUsers: 124680,
  dailyActive: 18420,
  weeklyActive: 42680,
  monthlyActive: 62380,
};

const baseDeviceSummary = {
  total: 39812,
  camera: 24220,
  centralControl: 15592,
};

const bindingSuccessBase = {
  camera: 98.4,
  centralControl: 97.6,
};

const bindingErrorBase = {
  camera: [
    { name: "App-B001", value: 34 },
    { name: "FW-C001", value: 27 },
    { name: "App-B009", value: 19 },
    { name: "FW-C017", value: 12 },
  ],
  centralControl: [
    { name: "TMP-A001", value: 29 },
    { name: "HUM-B004", value: 23 },
    { name: "FAN-C002", value: 17 },
    { name: "LED-D003", value: 12 },
    { name: "NET-E007", value: 9 },
  ],
};
const cameraBindFailureBase = [
  { name: "E-Bind-001", value: 26, scene: "摄像头未进入配对模式" },
  { name: "E-Bind-002", value: 18, scene: "Wi-Fi 密码错误" },
  { name: "E-Bind-003", value: 16, scene: "蓝牙连接/下发失败" },
  { name: "E-Bind-004", value: 9, scene: "误选 5GHz Wi-Fi" },
  { name: "E-Bind-005", value: 8, scene: "路由器隔离或限制" },
  { name: "E-Bind-006", value: 14, scene: "网络超时" },
  { name: "E-Bind-007", value: 6, scene: "隐藏 SSID 输入错误" },
  { name: "E-Bind-008", value: 7, scene: "云端/服务器不可达" },
  { name: "E-Bind-009", value: 11, scene: "设备已被其他账号绑定" },
] as const;
const centralControlBindFailureBase = [
  { name: "E-Bind-001", value: 24, scene: "设备未进入配对模式" },
  { name: "E-Bind-002", value: 19, scene: "Wi-Fi 密码错误" },
  { name: "E-Bind-003", value: 16, scene: "蓝牙未开启或权限不足" },
  { name: "E-Bind-004", value: 10, scene: "选择 5GHz Wi-Fi" },
  { name: "E-Bind-005", value: 12, scene: "蓝牙连接超时或断开" },
  { name: "E-Bind-006", value: 8, scene: "设备连上 Wi-Fi 但无法注册" },
  { name: "E-Bind-007", value: 7, scene: "网络超时" },
  { name: "E-Bind-008", value: 6, scene: "云端或服务器不可达" },
  { name: "E-Bind-009", value: 9, scene: "设备已被其他账号绑定" },
] as const;

const aiFeatureSummary = [
  { name: "本地动物检测", enableRate: 64, usageRate: 58, dailyCalls: 182400 },
  { name: "云端行为识别", enableRate: 39, usageRate: 31, dailyCalls: 96840 },
  { name: "AI精彩剪辑", enableRate: 27, usageRate: 19, dailyCalls: 28640 },
  { name: "AI对话助手", enableRate: 22, usageRate: 14, dailyCalls: 16420 },
  { name: "AI知识库问答", enableRate: 31, usageRate: 18, dailyCalls: 11860 },
];

const aiUsageTrend = [
  { name: "周一", detect: 168400, behavior: 82400, clip: 24800 },
  { name: "周二", detect: 171200, behavior: 86100, clip: 25740 },
  { name: "周三", detect: 176900, behavior: 90240, clip: 26820 },
  { name: "周四", detect: 180400, behavior: 93420, clip: 27980 },
  { name: "周五", detect: 182400, behavior: 96840, clip: 28640 },
  { name: "周六", detect: 179100, behavior: 94520, clip: 28110 },
  { name: "周日", detect: 175600, behavior: 91860, clip: 27480 },
];

const aiBehaviorTypeDistribution: DistributionDatum[] = [
  { name: "攀爬", value: 24.1, share: 24.1 },
  { name: "蜕皮现象", value: 21.4, share: 21.4 },
  { name: "捕食吃食", value: 18.6, share: 18.6 },
  { name: "喝水", value: 12.3, share: 12.3 },
  { name: "断尾现象", value: 9.8, share: 9.8 },
  { name: "打架", value: 8.1, share: 8.1 },
  { name: "交配", value: 5.7, share: 5.7 },
];

const aiCreditConsumptionDistribution: DistributionDatum[] = [
  { name: "行为识别", value: 51.2, share: 51.2 },
  { name: "视频剪辑", value: 34.6, share: 34.6 },
  { name: "对话助手", value: 14.2, share: 14.2 },
];

const aiFeedbackLoopStats = [
  { label: "点赞认可率", value: "87.4%", subtext: "用户对 AI 结果点赞的总体比例", tone: "teal" as const },
  { label: "点踩纠错率", value: "9.6%", subtext: "发生点踩并提交纠错说明的事件占比", tone: "amber" as const },
  { label: "视频捐献回流率", value: "12.8%", subtext: "进入训练闭环的视频捐献比例", tone: "violet" as const },
  { label: "人工复核采纳率", value: "78.2%", subtext: "运营复核后被采纳进入样本池的占比", tone: "emerald" as const },
];

const aiAlertQualityStats = [
  { label: "异常事件占比", value: "18.6%", subtext: "异常行为在全部 AI 事件中的占比", tone: "teal" as const },
  { label: "告警平均延迟", value: "2.4秒", subtext: "关键事件从识别到通知送达的平均延迟", tone: "amber" as const },
  { label: "告警点击回看率", value: "36.8%", subtext: "收到 AI 告警后点击进入回看的比例", tone: "violet" as const },
  { label: "7类行为覆盖率", value: "100%", subtext: "规格定义的 7 类云端行为均已纳入识别范围", tone: "emerald" as const },
];

const subscriptionPackageMix = [
  { name: "Professional 单台月付", value: 2260 },
  { name: "Professional 多台月付", value: 1710 },
  { name: "Professional 单台年付", value: 1380 },
  { name: "Professional 多台年付", value: 1070 },
];

const subscriptionTrend = [
  { name: "1月", trials: 820, conversions: 290, renewals: 2480, revenue: 198000 },
  { name: "2月", trials: 910, conversions: 320, renewals: 2740, revenue: 226000 },
  { name: "3月", trials: 1030, conversions: 390, renewals: 3180, revenue: 279000 },
  { name: "4月", trials: 1120, conversions: 450, renewals: 3560, revenue: 328000 },
  { name: "5月", trials: 1240, conversions: 520, renewals: 3980, revenue: 384000 },
  { name: "6月", trials: 1320, conversions: 589, renewals: 4370, revenue: 428600 },
];

const subscriptionSummary = {
  subscribedHouseholds: 6420,
  trialHouseholds: 860,
  subscriptionRate: 38.1,
  renewalRate: 68.1,
  monthlyRevenue: 428600,
  trialConversionRate: 44.6,
};

const subscriptionStatusDistribution: DistributionDatum[] = [
  { name: "生效中", value: 62.7, share: 62.7 },
  { name: "试用中", value: 13.4, share: 13.4 },
  { name: "已取消待到期", value: 9.1, share: 9.1 },
  { name: "支付失败待恢复", value: 4.8, share: 4.8 },
  { name: "已过期", value: 10.0, share: 10.0 },
];

const subscriptionRenewalDistribution = [
  { name: "单台月付", value: 62.4 },
  { name: "多台月付", value: 66.9 },
  { name: "单台年付", value: 74.8 },
  { name: "多台年付", value: 79.3 },
];

const subscriptionFunnelDistribution = [
  { name: "试用启动", value: 100 },
  { name: "试用转正", value: 44.6 },
  { name: "首月续费", value: 31.2 },
  { name: "积分加购", value: 12.8 },
];

const paymentMethodDistribution = [
  { name: "Stripe", value: 2520 },
  { name: "微信支付", value: 2140 },
  { name: "支付宝", value: 1760 },
];

const cloudStorageUsageStats = [
  { label: "开启7天云存设备数", value: "9,860", subtext: "已启用固定 7 天 Event 滚动云存的设备规模" },
  { label: "日均上传 Event 数", value: "18.6", subtext: "单设备每天写入云端的事件录像片段数" },
  { label: "本地优先回放命中率", value: "72%", subtext: "同一录像本地可读时优先从 SD 卡回放的命中比例" },
  { label: "云端首帧≤1秒达成率", value: "93%", subtext: "云端录像点击后 1 秒内出首帧的达成比例" },
  { label: "断点续传恢复率", value: "81%", subtext: "上传失败后通过断点续传恢复完成的比例" },
  { label: "7天内云存回看率", value: "34%", subtext: "已上传云存录像在保留期内被回看的比例" },
];

const subscriptionEntitlementStats = [
  { label: "云存储解锁率", value: "84%", subtext: "已订阅家庭中成功解锁云存能力的覆盖率", tone: "teal" as const },
  { label: "云端AI启用率", value: "57%", subtext: "已订阅家庭中开启云端行为识别的比例", tone: "amber" as const },
  { label: "设备端AI使用率", value: "71%", subtext: "会员设备中实际使用本地 AI 检测的比例", tone: "violet" as const },
  { label: "AI积分当月消耗率", value: "61%", subtext: "当月套餐积分已消耗额度占比，不跨月结转", tone: "emerald" as const },
];

const userTrendMap: Record<TimeRange, UserTrendPoint[]> = {
  日: [
    { name: "5/07", users: 104200, active: 12680 },
    { name: "5/08", users: 104860, active: 12840 },
    { name: "5/09", users: 105420, active: 13010 },
    { name: "5/10", users: 106080, active: 13340 },
    { name: "5/11", users: 106720, active: 13520 },
    { name: "5/12", users: 107360, active: 13860 },
    { name: "5/13", users: 108040, active: 14180 },
    { name: "5/14", users: 108780, active: 14520 },
    { name: "5/15", users: 109420, active: 14860 },
    { name: "5/16", users: 110080, active: 15020 },
    { name: "5/17", users: 110760, active: 15280 },
    { name: "5/18", users: 111380, active: 15420 },
    { name: "5/19", users: 112020, active: 15760 },
    { name: "5/20", users: 112760, active: 16040 },
    { name: "5/21", users: 113420, active: 16280 },
    { name: "5/22", users: 114080, active: 16520 },
    { name: "5/23", users: 114760, active: 16860 },
    { name: "5/24", users: 115420, active: 17020 },
    { name: "5/25", users: 116040, active: 17180 },
    { name: "5/26", users: 116720, active: 17340 },
    { name: "5/27", users: 117420, active: 17620 },
    { name: "5/28", users: 118080, active: 17860 },
    { name: "5/29", users: 118760, active: 18040 },
    { name: "5/30", users: 119420, active: 18160 },
    { name: "5/31", users: 120080, active: 18240 },
    { name: "6/01", users: 120760, active: 18320 },
    { name: "6/02", users: 121520, active: 18460 },
    { name: "6/03", users: 122380, active: 18520 },
    { name: "6/04", users: 123460, active: 18480 },
    { name: "6/05", users: 124680, active: 18420 },
  ],
  周: [
    { name: "W14", users: 86200, active: 29480 },
    { name: "W15", users: 89540, active: 30620 },
    { name: "W16", users: 92860, active: 32140 },
    { name: "W17", users: 96420, active: 33860 },
    { name: "W18", users: 100280, active: 35640 },
    { name: "W19", users: 104860, active: 37220 },
    { name: "W20", users: 109420, active: 38980 },
    { name: "W21", users: 114760, active: 40620 },
    { name: "W22", users: 119840, active: 41980 },
    { name: "W23", users: 124680, active: 42680 },
  ],
  月: [
    { name: "2025/07", users: 68200, active: 23600 },
    { name: "2025/08", users: 71420, active: 24980 },
    { name: "2025/09", users: 75280, active: 26840 },
    { name: "2025/10", users: 79860, active: 28420 },
    { name: "2025/11", users: 84620, active: 30280 },
    { name: "2025/12", users: 89480, active: 32460 },
    { name: "2026/01", users: 94620, active: 34820 },
    { name: "2026/02", users: 99640, active: 36720 },
    { name: "2026/03", users: 105480, active: 39280 },
    { name: "2026/04", users: 112360, active: 42860 },
    { name: "2026/05", users: 119420, active: 46820 },
    { name: "2026/06", users: 124680, active: 62380 },
  ],
  年: [
    { name: "2021", users: 16280, active: 6420 },
    { name: "2022", users: 28640, active: 10480 },
    { name: "2023", users: 42160, active: 16820 },
    { name: "2024", users: 58240, active: 28620 },
    { name: "2025", users: 92480, active: 43860 },
    { name: "2026", users: 124680, active: 62380 },
  ],
};

const pnAliasMap: Record<string, string> = {
  "CAM-PN-01": "C6001",
  "CAM-PN-02": "C6002",
  "CAM-PN-03": "C6003",
  "CAM-PN-04": "C6004",
  "CAM-PN-05": "C6005",
  "CAM-PN-06": "C6006",
  "CTRL-PN-02": "T1002",
  "CTRL-PN-03": "T1001",
  "CTRL-PN-04": "T1004",
  "CTRL-PN-05": "T1003",
  "CTRL-PN-06": "T1005",
  "CTRL-PN-07": "T1006",
  "CTRL-PN-08": "T1007",
};

const pnActiveRatePreset: Record<string, number> = {
  "CAM-PN-01": 73.8,
  "CAM-PN-02": 68.4,
  "CAM-PN-03": 61.5,
  "CAM-PN-04": 56.2,
  "CAM-PN-05": 49.7,
  "CAM-PN-06": 44.1,
  "CTRL-PN-02": 63.6,
  "CTRL-PN-03": 66.8,
  "CTRL-PN-04": 58.4,
  "CTRL-PN-05": 53.1,
  "CTRL-PN-06": 47.9,
  "CTRL-PN-07": 42.6,
  "CTRL-PN-08": 38.8,
};

const defaultDevicePnCode = "CAM-PN-01";

function parsePercent(value: string) {
  return Number.parseFloat(value.replace("%", ""));
}

function scaleValue(count: number, sampleTotal: number, targetTotal: number) {
  if (!sampleTotal || !targetTotal) return 0;
  return Math.round((count / sampleTotal) * targetTotal);
}

function average(values: number[], digits = 1) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(digits));
}

function buildCategoryDistribution<T extends string>(items: T[], order: T[], colors: string[] = pieColors): DistributionDatum[] {
  const total = items.length || 1;
  return order.map((name, index) => {
    const value = items.filter((item) => item === name).length;
    const share = Number(((value / total) * 100).toFixed(1));
    return {
      name,
      value,
      share,
      fill: colors[index % colors.length],
      displayValue: `${share}% (${value.toLocaleString()}台)`,
    };
  });
}

function getAgeBucket(birthday: string) {
  const birthYear = Number.parseInt(birthday.slice(0, 4), 10);
  const age = referenceDate.getFullYear() - birthYear;
  if (age < 25) return "18-24";
  if (age < 30) return "25-29";
  if (age < 35) return "30-34";
  return "35+";
}

function getActivityBucket(lastActiveAt: string) {
  return getUserActivityLevel(lastActiveAt, referenceDate);
}

function isRecentActive(lastActiveAt: string, maxDays: number) {
  const activeDate = new Date(lastActiveAt.replace(" ", "T"));
  const diffDays = (referenceDate.getTime() - activeDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= maxDays;
}

function buildDistribution<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value);
}

function formatPnLabel(pnCode: string) {
  return pnCode === "全部PN" ? pnCode : (pnAliasMap[pnCode] ?? pnCode);
}

function PanelEmptyState({ text }: { text: string }) {
  return <div className="flex min-h-[240px] items-center justify-center rounded-[24px] border border-dashed border-[#d8ebff] bg-[#f8fbff] px-6 text-center text-sm text-[#7395bc]">{text}</div>;
}

function PercentageBar({ value, index }: { value: number; index: number }) {
  return (
    <div className="mt-3 h-3 rounded-full bg-[#edf4ff]">
      <div className="h-3 rounded-full" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${featurePalette[index % featurePalette.length]}, ${featurePalette[(index + 1) % featurePalette.length]})` }} />
    </div>
  );
}

function getToggleTabClass(active: boolean) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
    active
      ? "bg-[#1B8BFA] text-white"
      : "bg-[#eef5ff] text-[#6d8fb5] hover:bg-[#e4f0ff] hover:text-[#4f79a7]"
  }`;
}

function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function renderPieValueLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
  const normalizedPercent = percent > 1 ? percent / 100 : percent;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  return (
    <text x={x} y={y} fill="#0f172a" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(normalizedPercent * 100).toFixed(1)}%`}
    </text>
  );
}

function renderPieCalloutLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  payload?: { name?: string; value?: number };
}) {
  const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, payload } = props;
  const cos = Math.cos((-midAngle * Math.PI) / 180);
  const sin = Math.sin((-midAngle * Math.PI) / 180);
  const sx = cx + (outerRadius + 4) * cos;
  const sy = cy + (outerRadius + 4) * sin;
  const mx = cx + (outerRadius + 14) * cos;
  const my = cy + (outerRadius + 14) * sin;
  const ex = mx + (cos >= 0 ? 18 : -18);
  const anchor = cos >= 0 ? "start" : "end";
  const displayName = String(payload?.name ?? "").replace("（不限PN）", "");

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${my}`} stroke="#9db9da" fill="none" />
      <circle cx={ex} cy={my} r={2} fill="#9db9da" />
      <text x={ex + (cos >= 0 ? 4 : -4)} y={my - 2} textAnchor={anchor} fill="#5d7fa8" fontSize={10} fontWeight={600}>
        {truncateText(displayName, 8)}
      </text>
      <text x={ex + (cos >= 0 ? 4 : -4)} y={my + 11} textAnchor={anchor} fill="#0f172a" fontSize={11} fontWeight={700}>
        {(payload?.value ?? 0).toLocaleString()}
      </text>
    </g>
  );
}

function renderTruncatedYAxisTick(props: {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string | number };
  maxLength?: number;
  align?: "start" | "end";
  width?: number | string;
}) {
  const { x = 0, y = 0, payload, maxLength = 15, align = "end", width = 0 } = props;
  const numericX = typeof x === "number" ? x : Number(x) || 0;
  const numericY = typeof y === "number" ? y : Number(y) || 0;
  const numericWidth = typeof width === "number" ? width : Number(width) || 0;
  const value = String(payload?.value ?? "");
  const compactValue = value.replace(/\s*\/\s*/g, "/");
  const displayValue = compactValue.length > maxLength ? `${compactValue.slice(0, maxLength)}...` : compactValue;
  const textX = align === "start" ? -numericWidth + 4 : 0;

  return (
    <g transform={`translate(${numericX},${numericY})`}>
      <title>{value}</title>
      <text x={textX} y={0} dy="0.355em" textAnchor={align} fill="#7395bc" fontSize={12}>
        {displayValue}
      </text>
    </g>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; payload?: Record<string, unknown> }>; label?: string }) {
  if (!active || !payload?.length) return null;

  const title = label || "";
  return (
    <div className="z-[9999] rounded-2xl border border-[#d8ebff] bg-white/95 px-4 py-3 shadow-[0_18px_40px_rgba(27,139,250,0.12)] backdrop-blur">
      {title ? <div className="text-xs uppercase tracking-[0.2em] text-[#7d9ec4]">{title}</div> : null}
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-6 text-sm">
            <span className="text-[#6f8fb3]">{entry.name}</span>
            <span className="font-semibold text-slate-950">
              {typeof entry.payload?.displayValue === "string"
                ? entry.payload.displayValue
                : String(entry.name).includes("活跃率")
                ? `${entry.value.toLocaleString()}%`
                : typeof entry.payload?.share === "number"
                  ? `${entry.value.toLocaleString()} (${entry.payload.share.toFixed(1)}%)`
                  : typeof entry.payload?.percent === "number"
                    ? `${entry.value.toLocaleString()} (${entry.payload.percent.toFixed(1)}%)`
                : String(entry.name).includes("活跃") && typeof entry.payload?.activeRate === "number"
                  ? `${entry.value.toLocaleString()} (${entry.payload.activeRate.toFixed(1)}%)`
                  : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompactPiePanel({ title, description, data }: { title: string; description: string; data: DistributionDatum[] }) {
  return (
    <Panel title={title} description={description}>
      <div className="flex h-[236px] flex-col">
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="44%" innerRadius={32} outerRadius={58} paddingAngle={4} labelLine={false}>
                {data.map((item, index) => (
                  <Cell key={item.name} fill={item.fill ?? pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#5d7fa8]">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill ?? pieColors[index % pieColors.length] }} />
              <div>{item.name}</div>
              <div className="font-semibold text-slate-950">{item.share.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function CompactHorizontalBarPanel({
  title,
  description,
  data,
  valueLabel,
  width = 76,
  labelMaxLength = 10,
  action,
}: {
  title: string;
  description: string;
  data: Array<{ name: string; value: number; fill?: string; displayValue?: string }>;
  valueLabel: string;
  width?: number;
  labelMaxLength?: number;
  action?: ReactNode;
}) {
  return (
    <Panel title={title} description={description} action={action}>
      <div className="mt-4 h-[280px] overflow-y-auto pr-1">
        <div style={{ height: `${Math.max(data.length * 34, 240)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 4, right: 42, top: 4, bottom: 4 }}>
              <CartesianGrid stroke="#e4f0ff" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} tickFormatter={(value: number) => `${value}%`} />
              <YAxis
                type="category"
                dataKey="name"
                width={width}
                tickLine={false}
                axisLine={false}
                tick={(props) => renderTruncatedYAxisTick({ ...props, maxLength: labelMaxLength, align: "end", width })}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name={valueLabel} radius={[0, 8, 8, 0]} barSize={16}>
                {data.map((item, index) => (
                  <Cell key={item.name} fill={item.fill ?? featurePalette[index % featurePalette.length]} />
                ))}
                <LabelList dataKey="value" position="right" formatter={(value: number) => `${value}%`} className="fill-slate-950 text-xs font-semibold" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Panel>
  );
}

function CompactMetricsPanel({
  title,
  description,
  items,
  columnsClassName = "xl:grid-cols-4",
}: {
  title: string;
  description: string;
  items: Array<{ label: string; value: string; subtext: string; tone: "teal" | "amber" | "violet" | "emerald" }>;
  columnsClassName?: string;
}) {
  const toneClasses: Record<string, string> = {
    teal: "from-[#1B8BFA]/14 to-[#73b8ff]/8 border-[#d8ebff]",
    amber: "from-[#ffb36b]/16 to-[#ffe2bf]/8 border-[#ffe2c8]",
    violet: "from-[#8e74ff]/14 to-[#c7bbff]/8 border-[#e4ddff]",
    emerald: "from-[#4dbf9f]/14 to-[#b8efe0]/8 border-[#d9f3ea]",
  };

  return (
    <Panel title={title} description={description}>
      <div className={`grid gap-3 ${columnsClassName}`}>
        {items.map((item) => (
          <div key={item.label} className={`rounded-[24px] border bg-gradient-to-br p-4 shadow-[0_14px_32px_rgba(27,139,250,0.08)] ${toneClasses[item.tone]}`}>
            <div className="text-[11px] font-semibold tracking-[0.14em] text-[#7395bc]">{item.label}</div>
            <div className="mt-2 font-display text-[28px] font-semibold leading-none text-slate-950">{item.value}</div>
            <div className="mt-2 text-xs leading-5 text-[#6f8fb3]">{item.subtext}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CompactWordCloudPanel({
  title,
  description,
  items,
  action,
}: {
  title: string;
  description: string;
  items: Array<{ name: string; value: number; fill?: string }>;
  action?: ReactNode;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <Panel title={title} description={description} action={action}>
      <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-4 rounded-[24px] bg-[radial-gradient(circle_at_top,#f7fbff_0%,#ffffff_65%)] px-6 py-8">
        {items.map((item, index) => {
          const scale = item.value / max;
          const fontSize = 18 + scale * 18;
          return (
            <div
              key={item.name}
              className="rounded-full border border-white/80 px-4 py-2 shadow-[0_10px_24px_rgba(91,140,255,0.08)]"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.1,
                color: item.fill ?? featurePalette[index % featurePalette.length],
                background: `${item.fill ?? featurePalette[index % featurePalette.length]}12`,
              }}
              title={`${item.name} ${item.value}%`}
            >
              <span className="font-display font-semibold">{item.name}</span>
              <span className="ml-2 text-sm font-medium text-slate-500">{item.value}%</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("users");
  const [userTrendRange, setUserTrendRange] = useState<TimeRange>("周");
  const [userTrendScope, setUserTrendScope] = useState<UserScope>("users");
  const [pnActiveRange, setPnActiveRange] = useState<ShortTimeRange>("周");
  const [appUsageScope, setAppUsageScope] = useState<UserScope>("users");
  const [appUsageDate, setAppUsageDate] = useState(() => formatDateInputValue(new Date(Date.now() - 24 * 60 * 60 * 1000)));
  const [devicePnFilter, setDevicePnFilter] = useState("全部PN");
  const [pnFilterOpen, setPnFilterOpen] = useState(false);

  const householdGroups = useMemo(() => {
    const grouped = new Map<string, Set<DeviceType>>();
    devices.forEach((device) => {
      const current = grouped.get(device.userEmail) ?? new Set<DeviceType>();
      current.add(device.type);
      grouped.set(device.userEmail, current);
    });
    return grouped;
  }, []);

  const userSummaryCards = [
    { label: "household 总数", value: baseUserSummary.households.toLocaleString(), trend: "已绑定设备家庭", tone: "teal" as const, subtext: "账户已绑定设备的用户数" },
    { label: "注册用户总数", value: baseUserSummary.registeredUsers.toLocaleString(), trend: "总用户数量", tone: "amber" as const, subtext: "包含已绑定设备用户和被分享设备用户以及无设备用户" },
    { label: "日活 / 周活", value: `${(baseUserSummary.dailyActive / 1000).toFixed(1)}k / ${(baseUserSummary.weeklyActive / 1000).toFixed(1)}k`, trend: "DAU / WAU", tone: "violet" as const, subtext: "近 24h 与近 7 天" },
    { label: "月活用户", value: baseUserSummary.monthlyActive.toLocaleString(), trend: "MAU", tone: "emerald" as const, subtext: "近 30 天" },
    { label: "人均绑定设备数", value: (baseDeviceSummary.total / baseUserSummary.households).toFixed(2), trend: "平均每 household", tone: "teal" as const, subtext: "总绑定设备数/household" },
    { label: "总绑定设备数", value: baseDeviceSummary.total.toLocaleString(), trend: "总绑定设备数", tone: "amber" as const, subtext: "平台上全部已绑定设备数" },
  ];

  const userTrend = useMemo(() => userTrendMap[userTrendRange], [userTrendRange]);
  const userTrendWithRate = useMemo(
    () =>
      userTrend.map((item) => ({
        ...item,
        activeRate: Number(((item.active / item.users) * 100).toFixed(1)),
      })),
    [userTrend],
  );
  const householdTrendWithRate = useMemo(
    () =>
      userTrend.map((item) => {
        const total = Math.round((item.users / baseUserSummary.registeredUsers) * baseUserSummary.households);
        const active = Math.round((item.active / baseUserSummary.registeredUsers) * baseUserSummary.households * 0.92);
        return {
          name: item.name,
          total,
          active,
          activeRate: Number(((active / (total || 1)) * 100).toFixed(1)),
        };
      }),
    [userTrend],
  );
  const currentUserTrendSeries = useMemo(
    () =>
      userTrendScope === "users"
        ? userTrendWithRate.map((item) => ({ ...item, total: item.users }))
        : householdTrendWithRate,
    [householdTrendWithRate, userTrendScope, userTrendWithRate],
  );
  const genderDistribution = useMemo(
    () => realisticGenderDistribution.map((item) => ({ ...item, share: Number(((item.value / baseUserSummary.registeredUsers) * 100).toFixed(1)) })),
    [],
  );
  const ageDistribution = useMemo(
    () =>
      realisticAgeDistribution.map((item) => ({
        ...item,
        share: Number(((item.value / baseUserSummary.registeredUsers) * 100).toFixed(1)),
        displayValue: `${Math.round(item.value / 1000)}k (${Number(((item.value / baseUserSummary.registeredUsers) * 100).toFixed(1))}%)`,
      })),
    [],
  );
  const regionDistribution = useMemo(
    () =>
      realisticRegionDistribution.map((item) => ({
        ...item,
        percent: Number(((item.value / baseUserSummary.registeredUsers) * 100).toFixed(1)),
      })),
    [],
  );
  const activityDistribution = useMemo(
    () =>
      buildUserActivityDistribution(users, referenceDate).map((item, index) => ({
        ...item,
        fill: featurePalette[index % featurePalette.length],
      })),
    [],
  );
  const highActivityInsight = useMemo(() => buildHighActivityInsight(users, referenceDate), []);
  const householdTypeDistribution = useMemo(
    () =>
      [
        { name: "摄像头（不限PN）", value: 6840 },
        { name: "中控设备（不限PN）", value: 4820 },
        { name: "风扇灯（不限PN）", value: 2240 },
        { name: "加热灯（不限PN）", value: 1760 },
        { name: "Wi-Fi温控（不限PN）", value: 1180 },
      ].map((item) => ({
        ...item,
        share: Number(((item.value / baseUserSummary.households) * 100).toFixed(1)),
      })),
    [],
  );

  const pnUserActiveRate = useMemo(() => {
    const rangeMultiplierMap: Record<ShortTimeRange, number> = {
      日: 0.76,
      周: 0.9,
      月: 1,
    };
    const waveStrengthMap: Record<ShortTimeRange, number> = {
      日: 1.6,
      周: 1,
      月: 0.45,
    };

    return [...new Set(devices.map((device) => device.pnCode))]
      .map((pnCode, index) => {
        const base = pnActiveRatePreset[pnCode] ?? 52;
        const wave = ((index % 5) - 2) * waveStrengthMap[pnActiveRange];
        const value = Math.max(18, Math.min(95, Number((base * rangeMultiplierMap[pnActiveRange] + wave).toFixed(1))));
        return {
          name: formatPnLabel(pnCode),
          value,
        };
      })
      .sort((left, right) => right.value - left.value);
  }, [pnActiveRange]);

  const pnUserShare = useMemo(() => {
    const pnUsers = new Map<string, Set<string>>();
    devices.forEach((device) => {
      const current = pnUsers.get(device.pnCode) ?? new Set<string>();
      current.add(device.userEmail);
      pnUsers.set(device.pnCode, current);
    });

    const totalUsers = new Set(devices.map((device) => device.userEmail)).size || 1;
    return [...pnUsers.entries()]
      .map(([name, bucket]) => ({
        name: formatPnLabel(name),
        value: Number(((bucket.size / totalUsers) * 100).toFixed(1)),
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6);
  }, []);

  const pnHouseholdCount = useMemo(() => realisticPnHouseholdCount, []);

  const householdDeviceComboStats = useMemo(() => {
    return realisticHouseholdComboStats.map((item) => ({
      ...item,
      value: Math.round((item.percent / 100) * baseUserSummary.households),
    }));
  }, []);
  const hourlyAppUsageDistribution = useMemo(() => {
    const selectedDate = new Date(`${appUsageDate}T00:00:00`);
    const dayNumber = Number(appUsageDate.split("-")[2] ?? "1");
    const presetKey: AppUsageDateKey = dayNumber % 2 === 0 ? "today" : "yesterday";
    const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
    const weekendFactor = isWeekend ? 0.92 : 1;
    const monthWave = ((dayNumber % 5) - 2) * 0.25;
    const totalBase = appUsageScope === "users" ? baseUserSummary.registeredUsers : baseUserSummary.households;
    return appUsageHourlyPreset[presetKey][appUsageScope].map((percent, index) => {
      const adjustedPercent = Number(Math.max(0.4, Math.min(19.5, percent * weekendFactor + monthWave)).toFixed(1));
      const activeUsers = Math.round((adjustedPercent / 100) * totalBase);
      return {
        hour: `${String(index).padStart(2, "0")}:00`,
        percent: adjustedPercent,
        activeUsers,
        displayValue: `${adjustedPercent.toFixed(1)}% (${activeUsers.toLocaleString()}人)`,
      };
    });
  }, [appUsageDate, appUsageScope]);
  const phoneModelUsageDistribution = useMemo(
    () =>
      phoneModelUsagePreset.map((item) => {
        const users = Math.round((item.percent / 100) * baseUserSummary.registeredUsers);
        return {
          ...item,
          users,
          displayValue: `${item.percent.toFixed(1)}% (${users.toLocaleString()}人)`,
        };
      }),
    [],
  );
  const appVersionUsageDistribution = useMemo(
    () =>
      appVersionUsagePreset.map((item) => {
        const users = Math.round((item.percent / 100) * baseUserSummary.registeredUsers);
        return {
          ...item,
          users,
          displayValue: `${item.percent.toFixed(1)}% (${users.toLocaleString()}人)`,
        };
      }),
    [],
  );
  const reptilePetProfiles = useMemo<ReptilePetProfile[]>(() => {
    const speciesCatalog: Array<Pick<ReptilePetProfile, "category" | "species">> = [
      { category: "守宫类", species: "瘤尾守宫" },
      { category: "守宫类", species: "肥尾守宫" },
      { category: "守宫类", species: "豹纹守宫" },
      { category: "守宫类", species: "睫角守宫" },
      { category: "蜥蜴类", species: "鬃狮蜥" },
      { category: "蜥蜴类", species: "蓝舌石龙子" },
      { category: "蛇类", species: "玉米蛇" },
      { category: "蛇类", species: "猪鼻蛇" },
      { category: "蛇类", species: "球蟒" },
      { category: "两栖类", species: "姥爷蛙" },
      { category: "龟类", species: "赫曼陆龟" },
    ];
    const petNames = ["煤球", "团子", "奶酪", "月光", "琥珀", "小瘤", "卷卷", "胖橘", "阿守", "布丁", "玉米卷", "木木", "点点", "可乐", "芒果", "小龙"];
    const geneMorphs: ReptilePetProfile["geneMorph"][] = ["高黄", "白化", "雪花", "无纹", "条纹", "橘化", "虎纹", "黑夜", "薰衣草", "红眼白化", "het白化", "零纹"];

    return users.flatMap((user, userIndex) => {
      const petCount = Math.max(1, Math.min(5, Math.round(user.deviceCount * 0.75 + (userIndex % 3))));
      const mixedHousing = petCount >= 3 ? userIndex % 4 !== 1 : userIndex % 9 === 0;

      return Array.from({ length: petCount }, (_, petIndex) => {
        const seed = userIndex * 19 + petIndex * 7 + user.deviceCount * 5;
        const species = speciesCatalog[seed % speciesCatalog.length];
        const name = petNames[(userIndex * 3 + petIndex * 2) % petNames.length];
        const ageBucket: ReptilePetProfile["ageBucket"] =
          seed % 100 < 22 ? "0-6个月" : seed % 100 < 44 ? "7-12个月" : seed % 100 < 68 ? "1-2岁" : seed % 100 < 88 ? "3-5岁" : "5岁以上";
        const lifeStage: ReptilePetProfile["lifeStage"] = ageBucket === "0-6个月" ? "幼体" : ageBucket === "7-12个月" || ageBucket === "1-2岁" ? "亚成体" : "成体";
        const healthStatus: ReptilePetProfile["healthStatus"] = seed % 100 < 74 ? "健康" : seed % 100 < 92 ? "一般" : "异常";
        const gender: ReptilePetProfile["gender"] = seed % 100 < 41 ? "雄性" : seed % 100 < 81 ? "雌性" : "未知";
        const geneMorph = geneMorphs[seed % geneMorphs.length];
        const breedingReady = lifeStage === "成体" || (lifeStage === "亚成体" && seed % 100 > 64);
        const yearlyMatingCount = breedingReady ? Math.max(0, Math.round(1.6 + (seed % 4) + (species.category === "蛇类" ? 1 : 0) + (gender === "未知" ? -1 : 0))) : 0;
        const yearlyEggLayCount = breedingReady && gender === "雌性" ? Math.max(0, Math.round((species.category === "龟类" ? 2.2 : 1.4) + (seed % 3))) : 0;
        const yearlyHatchCount = yearlyEggLayCount > 0 ? Math.max(0, Math.round(yearlyEggLayCount * (0.7 + (seed % 3) * 0.08))) : 0;

        return {
          userEmail: user.email,
          name,
          category: species.category,
          species: species.species,
          geneMorph,
          lifeStage,
          healthStatus,
          mixedHousing,
          gender,
          ageBucket,
          yearlyMatingCount,
          yearlyEggLayCount,
          yearlyHatchCount,
        };
      });
    });
  }, []);
  const petArchiveSummaryCards = useMemo(() => {
    const petCountMap = new Map<string, number>();
    reptilePetProfiles.forEach((item) => {
      petCountMap.set(item.userEmail, (petCountMap.get(item.userEmail) ?? 0) + 1);
    });
    const avgHouses = average(users.map((user, index) => Math.max(1, Math.min(4, Number((1.1 + user.deviceCount * 0.22 + (index % 2) * 0.35).toFixed(1))))), 1);
    const avgRooms = average(users.map((user, index) => Math.max(2, Math.min(9, Math.round(2 + user.deviceCount * 0.85 + (index % 3) * 0.6)))), 1);
    const avgPetProfiles = average(users.map((user) => petCountMap.get(user.email) ?? 0), 1);
    const mixedUserRate = Number(((new Set(reptilePetProfiles.filter((item) => item.mixedHousing).map((item) => item.userEmail)).size / (users.length || 1)) * 100).toFixed(1));
    return [
      { label: "平均保存 House 数", value: `${avgHouses}个`, subtext: "按用户在 App 中维护的 House 数量估算", tone: "teal" as const },
      { label: "平均保存房间数", value: `${avgRooms}个`, subtext: "按用户在 House 下维护的房间数量估算", tone: "amber" as const },
      { label: "平均宠物档案数", value: `${avgPetProfiles}个`, subtext: "单用户平均添加的爬宠档案数量", tone: "violet" as const },
      { label: "混养用户比例", value: `${mixedUserRate}%`, subtext: "存在至少一组混养宠物档案的用户占比", tone: "emerald" as const },
    ];
  }, [reptilePetProfiles]);
  const petBreedingSummaryCards = useMemo(() => {
    const matingSamples = reptilePetProfiles.filter((item) => item.yearlyMatingCount > 0);
    const eggSamples = reptilePetProfiles.filter((item) => item.yearlyEggLayCount > 0);
    const hatchSamples = reptilePetProfiles.filter((item) => item.yearlyHatchCount > 0);
    const breedingRate = Number((((matingSamples.length || eggSamples.length) ? matingSamples.length : 0) / (reptilePetProfiles.length || 1) * 100).toFixed(1));
    return [
      { label: "年均交配次数", value: `${average(matingSamples.map((item) => item.yearlyMatingCount), 1)}次`, subtext: "按存在繁殖行为的爬宠档案估算年均交配次数", tone: "teal" as const },
      { label: "年均下蛋次数", value: `${average(eggSamples.map((item) => item.yearlyEggLayCount), 1)}次`, subtext: "按有产卵记录的雌性爬宠估算年均下蛋次数", tone: "amber" as const },
      { label: "年均孵化次数", value: `${average(hatchSamples.map((item) => item.yearlyHatchCount), 1)}次`, subtext: "按有繁殖结果的档案估算年均孵化次数", tone: "violet" as const },
      { label: "有繁殖记录档案占比", value: `${breedingRate}%`, subtext: "存在交配记录的爬宠档案在全部档案中的比例", tone: "emerald" as const },
    ];
  }, [reptilePetProfiles]);
  const reptilePetNamingWordCloudDistribution = useMemo(() => {
    const total = reptilePetProfiles.length || 1;
    const counts = new Map<string, number>();
    reptilePetProfiles.forEach((item) => {
      counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count], index) => ({
        name,
        value: Number(((count / total) * 100).toFixed(1)),
        fill: featurePalette[index % featurePalette.length],
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 16);
  }, [reptilePetProfiles]);
  const reptilePetGeneWordCloudDistribution = useMemo(() => {
    const total = reptilePetProfiles.length || 1;
    const counts = new Map<string, number>();
    reptilePetProfiles.forEach((item) => {
      counts.set(item.geneMorph, (counts.get(item.geneMorph) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count], index) => ({
        name,
        value: Number(((count / total) * 100).toFixed(1)),
        fill: featurePalette[index % featurePalette.length],
      }))
      .sort((left, right) => right.value - left.value);
  }, [reptilePetProfiles]);
  const reptilePetCategoryDistribution = useMemo(
    () =>
      buildCategoryDistribution(reptilePetProfiles.map((item) => item.category), ["守宫类", "蜥蜴类", "蛇类", "两栖类", "龟类"]).map((item) => ({ ...item, value: item.share })),
    [reptilePetProfiles],
  );
  const reptilePetSpeciesDistribution = useMemo(
    () =>
      buildCategoryDistribution(reptilePetProfiles.map((item) => item.species), ["瘤尾守宫", "肥尾守宫", "豹纹守宫", "睫角守宫", "玉米蛇", "猪鼻蛇", "球蟒", "姥爷蛙", "鬃狮蜥", "蓝舌石龙子", "赫曼陆龟"]).map((item) => ({ ...item, value: item.share })),
    [reptilePetProfiles],
  );
  const reptilePetLifeStageDistribution = useMemo(
    () => buildCategoryDistribution(reptilePetProfiles.map((item) => item.lifeStage), ["幼体", "亚成体", "成体"]),
    [reptilePetProfiles],
  );
  const reptilePetHealthDistribution = useMemo(
    () => buildCategoryDistribution(reptilePetProfiles.map((item) => item.healthStatus), ["健康", "一般", "异常"]),
    [reptilePetProfiles],
  );
  const reptilePetGenderDistribution = useMemo(
    () => buildCategoryDistribution(reptilePetProfiles.map((item) => item.gender), ["雄性", "雌性", "未知"]),
    [reptilePetProfiles],
  );
  const reptilePetAgeBucketDistribution = useMemo(
    () =>
      buildCategoryDistribution(reptilePetProfiles.map((item) => item.ageBucket), ["0-6个月", "7-12个月", "1-2岁", "3-5岁", "5岁以上"]).map((item) => ({ ...item, value: item.share })),
    [reptilePetProfiles],
  );

  const devicePnOptions = useMemo(() => ["全部PN", ...new Set(devices.map((device) => device.pnCode))], []);
  const currentPnDevices = useMemo(() => (devicePnFilter === "全部PN" ? devices : devices.filter((device) => device.pnCode === devicePnFilter)), [devicePnFilter]);
  const currentPnLabel = useMemo(() => formatPnLabel(devicePnFilter), [devicePnFilter]);
  const userRegionMap = useMemo(() => new Map(users.map((user) => [user.email, user.region])), []);
  const userRecordMap = useMemo(() => new Map(users.map((user) => [user.email, user])), []);
  const currentDeviceType = useMemo<DeviceType | "mixed">(() => {
    if (!currentPnDevices.length) return "mixed";
    const uniqueTypes = new Set(currentPnDevices.map((device) => device.type));
    return uniqueTypes.size === 1 ? currentPnDevices[0].type : "mixed";
  }, [currentPnDevices]);
  const currentPnTotal = useMemo(() => (devicePnFilter === "全部PN" ? baseDeviceSummary.total : scaleValue(currentPnDevices.length, devices.length, baseDeviceSummary.total)), [currentPnDevices, devicePnFilter]);
  const currentPnOnline = scaleValue(currentPnDevices.filter((device) => device.status === "online").length, currentPnDevices.length || 1, currentPnTotal);
  const currentPnOffline = Math.max(currentPnTotal - currentPnOnline, 0);
  const currentPnSuccessRate = currentDeviceType === "camera" ? bindingSuccessBase.camera : currentDeviceType === "central_control" ? bindingSuccessBase.centralControl : 98;
  const currentPnErrorStats = currentDeviceType === "camera" ? bindingErrorBase.camera : currentDeviceType === "central_control" ? bindingErrorBase.centralControl : [...bindingErrorBase.camera.slice(0, 2), ...bindingErrorBase.centralControl.slice(0, 2)];
  const currentPnErrorShare = useMemo(() => {
    const total = currentPnErrorStats.reduce((sum, item) => sum + item.value, 0) || 1;
    return currentPnErrorStats.map((item) => {
      const value = Number(((item.value / total) * 100).toFixed(1));
      return { ...item, count: item.value, value, displayValue: `${value}% (${item.value}次)` };
    });
  }, [currentPnErrorStats]);
  const currentPnCameraBindFailureShare = useMemo(() => {
    const total = cameraBindFailureBase.reduce((sum, item) => sum + item.value, 0) || 1;
    return cameraBindFailureBase.map((item, index) => {
      const value = Number(((item.value / total) * 100).toFixed(1));
      return {
        name: item.name,
        value,
        fill: featurePalette[index % featurePalette.length],
        displayValue: `${value}% (${item.value}次) · ${item.scene}`,
      };
    });
  }, []);
  const currentPnCentralControlBindFailureShare = useMemo(() => {
    const total = centralControlBindFailureBase.reduce((sum, item) => sum + item.value, 0) || 1;
    return centralControlBindFailureBase.map((item, index) => {
      const value = Number(((item.value / total) * 100).toFixed(1));
      return {
        name: item.name,
        value,
        fill: featurePalette[index % featurePalette.length],
        displayValue: `${value}% (${item.value}次) · ${item.scene}`,
      };
    });
  }, []);
  const currentPnCountryDistribution = useMemo(() => {
    const rows = currentPnDevices
      .map((device) => userRegionMap.get(device.userEmail))
      .filter((region): region is string => Boolean(region))
      .map((region) => region.split(" / ")[0]);

    return buildDistribution(rows, (name) => name)
      .slice(0, 6)
      .map((item) => ({ ...item, value: scaleValue(item.value, currentPnDevices.length || 1, currentPnTotal) }));
  }, [currentPnDevices, currentPnTotal, userRegionMap]);
  const currentPnCityDistribution = useMemo(() => {
    const rows = currentPnDevices
      .map((device) => userRegionMap.get(device.userEmail))
      .filter((region): region is string => Boolean(region))
      .map((region) => region.split(" / ")[1] ?? "未知城市");

    return buildDistribution(rows, (name) => name)
      .slice(0, 6)
      .map((item) => ({ ...item, value: scaleValue(item.value, currentPnDevices.length || 1, currentPnTotal) }));
  }, [currentPnDevices, currentPnTotal, userRegionMap]);
  const currentPnSignalStrength = useMemo(() => {
    const signalBuckets = ["一档", "二档", "三档", "四档", "五档"];
    const buckets = currentPnDevices.map((device, index) => {
      if (device.wifi === "强") return index % 2 === 0 ? "五档" : "四档";
      if (device.wifi === "中") return index % 2 === 0 ? "三档" : "四档";
      return signalBuckets[index % 3];
    });
    const total = buckets.length || 1;
    return signalBuckets.map((name, index) => {
      const count = buckets.filter((bucket) => bucket === name).length;
      const value = Number(((count / total) * 100).toFixed(1));
      return { name, value, color: featurePalette[index % featurePalette.length], displayValue: `${value}%` };
    });
  }, [currentPnDevices]);
  const currentPnLocationDistribution = useMemo(
    () => [
      ...currentPnCountryDistribution.map((item) => ({
        ...item,
        name: `国家 · ${item.name}`,
        fill: "#30C7C9",
        displayValue: `${item.value.toLocaleString()}台`,
      })),
      ...currentPnCityDistribution.map((item) => ({
        ...item,
        name: `城市 · ${item.name}`,
        fill: "#5B8CFF",
        displayValue: `${item.value.toLocaleString()}台`,
      })),
    ],
    [currentPnCountryDistribution, currentPnCityDistribution],
  );
  const currentPnCameraProfiles = useMemo<CameraProfile[]>(
    () => {
      const cameraDevices = currentPnDevices.filter((device) => device.type === "camera");
      if (!cameraDevices.length) return [];
      const sampleSize = Math.max(Math.min(currentPnTotal, 160), cameraDevices.length * 18);
      const geoOptions = [
        { country: "中国", city: "深圳" },
        { country: "中国", city: "上海" },
        { country: "中国", city: "杭州" },
        { country: "美国", city: "洛杉矶" },
        { country: "美国", city: "旧金山" },
        { country: "日本", city: "东京" },
        { country: "日本", city: "大阪" },
        { country: "英国", city: "伦敦" },
        { country: "德国", city: "柏林" },
        { country: "加拿大", city: "温哥华" },
        { country: "澳大利亚", city: "悉尼" },
      ] as const;
      const locationOptions = ["客厅", "卧室", "阳台", "门厅/玄关", "庭院/花园", "猫砂盆区", "宠物活动房", "厨房/餐区"] as const;
      const speciesOptions = ["瘤尾守宫", "豹纹守宫", "睫角守宫", "高冠变色龙", "玉米蛇", "高黄白化玉米蛇", "球蟒", "猪鼻蛇", "印尼蓝舌石龙子", "鬃狮蜥"] as const;
      const namingClusters = ["按房间命名", "按宠物名命名", "按功能场景命名", "默认设备名", "个性化昵称"] as const;

      return Array.from({ length: sampleSize }, (_, index) => {
          const device = cameraDevices[index % cameraDevices.length];
          const user = userRecordMap.get(device.userEmail);
          const devicePerUser = user?.deviceCount ?? 1;
          const lastActiveDate = new Date(device.lastActiveAt.replace(" ", "T"));
          const inactiveDays = Math.max(0, Math.round((referenceDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)));
          const activityFactor = inactiveDays <= 1 ? 1.15 : inactiveDays <= 3 ? 1 : 0.82;
          const wifiFactor = device.wifi === "强" ? 1.12 : device.wifi === "中" ? 1 : 0.84;
          const onlineFactor = device.status === "online" ? 1.08 : 0.72;
          const seed = index * 17 + devicePerUser * 11 + device.snCode.length * 3;

          const eventRecordingsDaily = Number((8.8 * wifiFactor * onlineFactor * activityFactor + (seed % 5) * 1.4 + devicePerUser * 0.5).toFixed(1));
          const recordingDurationSeconds = Math.round(16 + (seed % 4) * 3 + (device.wifi === "弱" ? 11 : device.wifi === "中" ? 6 : 2) + inactiveDays * 1.5);
          const liveViewDaily = Number((2.3 * activityFactor + (device.status === "online" ? 1.6 : 0.5) + (devicePerUser > 3 ? 0.8 : 0.3) + (seed % 4) * 0.45).toFixed(1));
          const liveViewPlayerDaily = Number((liveViewDaily * (0.48 + (seed % 3) * 0.08)).toFixed(1));
          const liveViewDurationSeconds = Math.round(58 + (seed % 5) * 11 + activityFactor * 24 + devicePerUser * 6);
          const playbackDaily = Number((1.7 * activityFactor + liveViewDaily * 0.36 + eventRecordingsDaily * 0.11 + (seed % 3) * 0.22).toFixed(1));
          const playbackDurationSeconds = Math.round(41 + liveViewDurationSeconds * 0.42 + (seed % 4) * 9 + (device.status === "online" ? 8 : -4));
          const settingsEntryDaily = Number((0.9 + liveViewDaily * 0.18 + playbackDaily * 0.22 + (seed % 4) * 0.12).toFixed(1));
          const petProfilesPerDevice = Number((0.9 + Math.min(devicePerUser, 4) * 0.32 + (seed % 3) * 0.18).toFixed(1));

          const weightedBucket = seed % 100;
          const detectionMode: CameraProfile["detectionMode"] = weightedBucket < 57 ? "检测所有活动" : "只检测动物活动";
          const sensitivity: CameraProfile["sensitivity"] = weightedBucket < 22 ? "高" : weightedBucket < 74 ? "中" : "低";
          const nightVisionMode: CameraProfile["nightVisionMode"] = weightedBucket < 71 ? "开启微光辅助夜视" : "关闭微光辅助夜视";
          const recordingResolution: CameraProfile["recordingResolution"] = weightedBucket < 63 ? "1080P" : weightedBucket < 89 ? "720P" : "480P";
          const liveViewResolution: CameraProfile["liveViewResolution"] = weightedBucket < 34 ? "自动" : weightedBucket < 59 ? "1080P" : weightedBucket < 85 ? "720P" : "480P";
          const installOrientation: CameraProfile["installOrientation"] =
            weightedBucket < 61 ? "正装" : weightedBucket < 69 ? "90度" : weightedBucket < 83 ? "180度" : weightedBucket < 89 ? "270度" : weightedBucket < 93 ? "360度" : "其他倾斜角度";
          const continuousRecording: CameraProfile["continuousRecording"] = weightedBucket < 37 ? "开启" : "关闭";
          const sdCardStatus: CameraProfile["sdCardStatus"] = weightedBucket < 81 ? "已插入SD卡" : "未插入SD卡";
          const pushEnabled = weightedBucket < 73;
          const dailyNotifications = pushEnabled ? Number((eventRecordingsDaily * 0.46 + liveViewDaily * 0.35 + (seed % 4) * 0.6).toFixed(1)) : 0;
          const pushOpenRate = Number((18 + activityFactor * 9 + (pushEnabled ? 7 : 0) + (seed % 4) * 2.2).toFixed(1));
          const pushLatencyBucket: CameraProfile["pushLatencyBucket"] =
            weightedBucket < 27 ? "1s以内" : weightedBucket < 48 ? "1s" : weightedBucket < 66 ? "2s" : weightedBucket < 80 ? "3s" : weightedBucket < 89 ? "4s" : weightedBucket < 95 ? "5s" : "6s及以上";
          const notificationStyle: CameraProfile["notificationStyle"] = weightedBucket < 58 ? "纯文本通知" : "文本+图片+描述";
          const geo = geoOptions[(seed + index) % geoOptions.length];
          const usageLocation = locationOptions[weightedBucket < 28 ? 0 : weightedBucket < 43 ? 1 : weightedBucket < 56 ? 2 : weightedBucket < 67 ? 3 : weightedBucket < 76 ? 4 : weightedBucket < 86 ? 5 : weightedBucket < 94 ? 6 : 7];
          const appAnimalSpecies = speciesOptions[weightedBucket < 18 ? 0 : weightedBucket < 31 ? 1 : weightedBucket < 42 ? 2 : weightedBucket < 50 ? 3 : weightedBucket < 61 ? 4 : weightedBucket < 70 ? 5 : weightedBucket < 78 ? 6 : weightedBucket < 86 ? 7 : weightedBucket < 94 ? 8 : 9];
          const aiAnimalSpecies = speciesOptions[(weightedBucket + (device.status === "online" ? 1 : 3)) % speciesOptions.length];
          const namingCluster = namingClusters[weightedBucket < 31 ? 0 : weightedBucket < 54 ? 1 : weightedBucket < 71 ? 2 : weightedBucket < 86 ? 3 : 4];
          const deviceName =
            namingCluster === "按房间命名"
              ? ["客厅1号", "卧室南窗", "阳台角落", "玄关守护", "餐区顶角", "书房窗边", "庭院东侧", "爬箱右上角"][index % 8]
              : namingCluster === "按宠物名命名"
                ? ["小豹子", "睫毛弯弯", "大尾巴", "瘤尾1", "奶盖", "煤球", "团团", "布丁", "琥珀", "阿守", "栗子", "龙宝"][index % 12]
                : namingCluster === "按功能场景命名"
                  ? ["喂食区", "睡觉区", "活动区", "门口守护", "夜视观察", "孵化观察", "晒背区", "加温区"][index % 8]
                  : namingCluster === "默认设备名"
                    ? `Camera-${device.snCode.slice(-4)}`
                    : ["小尾巴", "毛孩子", "陪伴号", "安心看护", "小可爱", "胖橘", "雪饼", "小夜灯", "暖暖", "守护星", "小龙女", "巡箱号"][index % 12];
          const cloudServiceEnabled = weightedBucket < 49;
          const cloudStorageEnabled = weightedBucket < 44;
          const cloudAiEnabled = weightedBucket < 31;
          const cloudClipEnabled = weightedBucket < 23;
          const packageBucket = seed % 20;
          const subscriptionPackage: CameraProfile["subscriptionPackage"] = !cloudServiceEnabled
            ? "未订阅"
            : packageBucket < 8
              ? "增值服务-单设备套餐-月付"
              : packageBucket < 13
                ? "增值服务-多设备套餐-月付"
                : packageBucket < 17
                  ? "增值服务-单设备套餐-年付"
                  : "增值服务-多设备套餐-年付";
          const subscriptionRenewed = cloudServiceEnabled && (packageBucket < 14 || subscriptionPackage.includes("年付") || (cloudAiEnabled && weightedBucket < 88));

          const firmwareOptions = [device.firmware, "v2.1.0", "v2.0.9", "v2.0.8", "v2.0.7", "v2.0.6"];
          const firmwareVersion =
            weightedBucket < 37
              ? firmwareOptions[0]
              : weightedBucket < 60
                ? firmwareOptions[1]
                : weightedBucket < 76
                  ? firmwareOptions[2]
                  : weightedBucket < 88
                    ? firmwareOptions[3]
                    : weightedBucket < 96
                      ? firmwareOptions[4]
                      : firmwareOptions[5];

          return {
            eventRecordingsDaily,
            recordingDurationSeconds,
            liveViewDaily,
            liveViewPlayerDaily,
            liveViewDurationSeconds,
            playbackDaily,
            playbackDurationSeconds,
            settingsEntryDaily,
            petProfilesPerDevice,
            detectionMode,
            sensitivity,
            nightVisionMode,
            recordingResolution,
            liveViewResolution,
            installOrientation,
            continuousRecording,
            sdCardStatus,
            pushEnabled,
            dailyNotifications,
            pushOpenRate,
            pushLatencyBucket,
            notificationStyle,
            usageLocation,
            appAnimalSpecies,
            aiAnimalSpecies,
            namingCluster,
            deviceName,
            regionCountry: geo.country,
            regionCity: geo.city,
            cloudServiceEnabled,
            cloudStorageEnabled,
            cloudAiEnabled,
            cloudClipEnabled,
            subscriptionRenewed,
            subscriptionPackage,
            firmwareVersion,
          };
        });
    },
    [currentPnDevices, currentPnTotal, userRecordMap],
  );
  const currentPnCentralControlProfiles = useMemo<CentralControlProfile[]>(() => {
    const centralDevices = currentPnDevices.filter((device) => device.type === "central_control");
    if (!centralDevices.length) return [];

    const geoOptions = [
      { country: "中国", city: "深圳" },
      { country: "中国", city: "上海" },
      { country: "中国", city: "杭州" },
      { country: "美国", city: "洛杉矶" },
      { country: "美国", city: "旧金山" },
      { country: "日本", city: "东京" },
      { country: "日本", city: "大阪" },
      { country: "英国", city: "伦敦" },
      { country: "德国", city: "柏林" },
      { country: "加拿大", city: "温哥华" },
      { country: "澳大利亚", city: "悉尼" },
    ] as const;
    const usageLocations = ["客厅生态箱", "书房饲养架", "卧室孵化架", "阳台育苗箱", "工作室展示墙", "检疫隔离区"] as const;
    const speciesOptions = ["瘤尾守宫", "豹纹守宫", "睫角守宫", "鬃狮蜥", "玉米蛇", "猪鼻蛇", "球蟒", "蓝舌石龙子", "赫曼陆龟", "姥爷蛙"] as const;
    const fergusonZones = ["FZ1 遮蔽型", "FZ2 部分日照", "FZ3 开放/晨昏型", "FZ4 bask型"] as const;
    const humidityModes = ["智能恒湿模式", "定时喷淋模式", "手动即时喷淋"] as const;
    const sampleSize = Math.max(Math.min(currentPnTotal, 150), centralDevices.length * 16);

    return Array.from({ length: sampleSize }, (_, index) => {
      const device = centralDevices[index % centralDevices.length];
      const user = userRecordMap.get(device.userEmail);
      const devicePerUser = user?.deviceCount ?? 1;
      const lastActiveDate = new Date(device.lastActiveAt.replace(" ", "T"));
      const inactiveDays = Math.max(0, Math.round((referenceDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)));
      const activityFactor = inactiveDays <= 1 ? 1.12 : inactiveDays <= 3 ? 0.98 : 0.8;
      const wifiFactor = device.wifi === "强" ? 1.12 : device.wifi === "中" ? 1 : 0.82;
      const seed = index * 13 + devicePerUser * 9 + device.snCode.length * 5;
      const weightedBucket = seed % 100;

      const settingsEntryDaily = Number((1.4 + activityFactor * 1.3 + (seed % 4) * 0.28 + devicePerUser * 0.12).toFixed(1));
      const temperatureAdjustDaily = Number((0.9 + activityFactor * 0.82 + (seed % 3) * 0.22 + (device.status === "online" ? 0.18 : 0)).toFixed(1));
      const humidityAdjustDaily = Number((0.8 + activityFactor * 0.74 + (seed % 4) * 0.18 + (device.wifi === "弱" ? 0.16 : 0)).toFixed(1));
      const manualSprayDaily = Number((weightedBucket < 58 ? 1.3 : 0.6 + (seed % 3) * 0.35).toFixed(1));
      const manualSprayDurationSeconds = Math.round(18 + activityFactor * 12 + (seed % 5) * 5);
      const linkedPets = Math.max(1, Math.min(8, Math.round(1.2 + devicePerUser * 0.9 + (seed % 4) * 0.6)));
      const linkedFanLamps = Math.max(0, Math.min(8, Math.round(devicePerUser * 0.7 + (seed % 5) * 0.8 - (device.status === "offline" ? 1 : 0))));
      const fanSchedules = Math.max(1, Math.min(8, Math.round(1.4 + linkedFanLamps * 0.6 + (seed % 4) * 0.7)));
      const heaterPowerPercent = Math.round(36 + activityFactor * 11 + wifiFactor * 8 + (seed % 5) * 5);
      const temperatureTargetBucket: CentralControlProfile["temperatureTargetBucket"] =
        weightedBucket < 18 ? "24-26°C" : weightedBucket < 44 ? "27-28°C" : weightedBucket < 72 ? "29-30°C" : weightedBucket < 90 ? "31-32°C" : "33°C及以上";
      const humidityTargetBucket: CentralControlProfile["humidityTargetBucket"] =
        weightedBucket < 12 ? "40-49%" : weightedBucket < 35 ? "50-59%" : weightedBucket < 67 ? "60-69%" : weightedBucket < 89 ? "70-79%" : "80%及以上";
      const humidityMode: CentralControlProfile["humidityMode"] = humidityModes[weightedBucket < 51 ? 0 : weightedBucket < 79 ? 1 : 2];
      const heaterLampOn = weightedBucket < 66;
      const halogenLampOn = weightedBucket < 44;
      const halogenScheduleEnabled = halogenLampOn && weightedBucket < 78;
      const ledOn = weightedBucket < 81;
      const ledBrightnessBucket: CentralControlProfile["ledBrightnessBucket"] =
        !ledOn ? "0-20%" : weightedBucket < 18 ? "0-20%" : weightedBucket < 39 ? "21-40%" : weightedBucket < 66 ? "41-60%" : weightedBucket < 87 ? "61-80%" : "81-100%";
      const uvOn = weightedBucket < 71;
      const fergusonZone: CentralControlProfile["fergusonZone"] = fergusonZones[weightedBucket < 16 ? 0 : weightedBucket < 41 ? 1 : weightedBucket < 77 ? 2 : 3];
      const uvScheduleEnabled = uvOn && weightedBucket < 83;
      const simulateDaylightOn = weightedBucket < 39;
      const nightLightOn = weightedBucket >= 69 && weightedBucket < 91;
      const fanOn = weightedBucket < 76;
      const fanSpeed: CentralControlProfile["fanSpeed"] = weightedBucket < 19 ? "1档" : weightedBucket < 45 ? "2档" : weightedBucket < 78 ? "3档" : "4档";
      const ionizerOn = weightedBucket < 58;
      const ionizerSyncWithFan = fanOn && ionizerOn && weightedBucket < 67;
      const usageLocation = usageLocations[weightedBucket < 24 ? 0 : weightedBucket < 44 ? 1 : weightedBucket < 58 ? 2 : weightedBucket < 72 ? 3 : weightedBucket < 88 ? 4 : 5];
      const linkedSpecies = speciesOptions[(weightedBucket + index) % speciesOptions.length];
      const linkedPetBucket: CentralControlProfile["linkedPetBucket"] = linkedPets <= 1 ? "1只" : linkedPets <= 3 ? "2-3只" : linkedPets <= 5 ? "4-5只" : "6只及以上";
      const linkedFanLampBucket: CentralControlProfile["linkedFanLampBucket"] =
        linkedFanLamps === 0 ? "0台" : linkedFanLamps <= 2 ? "1-2台" : linkedFanLamps <= 4 ? "3-4台" : linkedFanLamps <= 6 ? "5-6台" : "7台及以上";
      const namingClusterBucket = weightedBucket % 5;
      const deviceName =
        namingClusterBucket === 0
          ? ["客厅主箱", "书房饲养架", "卧室孵化架", "阳台育苗箱", "检疫箱主控", "展示墙主机"][index % 6]
          : namingClusterBucket === 1
            ? ["瘤尾繁育箱", "豹纹主控", "球蟒温控台", "鬃狮晒背箱", "玉米蛇育成箱", "蓝舌保温箱"][index % 6]
            : namingClusterBucket === 2
              ? ["白天模式主控", "夜光联动箱", "恒湿喷淋箱", "孵化观察箱", "加温循环箱", "通风净化箱"][index % 6]
              : namingClusterBucket === 3
                ? `CTRL-${device.snCode.slice(-4)}`
                : ["暖暖屋", "小爬主机", "陪伴箱", "胖尾箱", "守护中枢", "繁育一号"][index % 6];
      const geo = geoOptions[(seed + index) % geoOptions.length];
      const anomalyType: CentralControlProfile["anomalyType"] =
        weightedBucket < 34 ? "温度异常" : weightedBucket < 61 ? "湿度异常" : weightedBucket < 82 ? "设备离线" : "传感器故障";
      const anomalyEventsMonthly = Number((0.8 + (anomalyType === "设备离线" ? 0.7 : anomalyType === "传感器故障" ? 0.5 : 0.3) + (device.status === "offline" ? 0.9 : 0) + (device.wifi === "弱" ? 0.6 : device.wifi === "中" ? 0.3 : 0.1) + inactiveDays * 0.12).toFixed(1));
      const otaUpdatedRecently = weightedBucket < 57;
      const otaResumeUsed = otaUpdatedRecently && weightedBucket % 5 === 0;
      const wifiReprovisioned = weightedBucket < 16 || (device.wifi === "弱" && weightedBucket < 36);
      const firmwareOptions = [device.firmware, "v3.2.1", "v3.2.0", "v3.1.8", "v3.1.6", "v3.1.4"];
      const firmwareVersion =
        weightedBucket < 34
          ? firmwareOptions[0]
          : weightedBucket < 58
            ? firmwareOptions[1]
            : weightedBucket < 77
              ? firmwareOptions[2]
              : weightedBucket < 89
                ? firmwareOptions[3]
                : weightedBucket < 96
                  ? firmwareOptions[4]
                  : firmwareOptions[5];

      return {
        settingsEntryDaily,
        temperatureAdjustDaily,
        humidityAdjustDaily,
        manualSprayDaily,
        manualSprayDurationSeconds,
        linkedPets,
        linkedFanLamps,
        fanSchedules,
        heaterPowerPercent,
        temperatureTargetBucket,
        humidityTargetBucket,
        humidityMode,
        heaterLampOn,
        halogenLampOn,
        halogenScheduleEnabled,
        ledOn,
        ledBrightnessBucket,
        uvOn,
        fergusonZone,
        uvScheduleEnabled,
        simulateDaylightOn,
        nightLightOn,
        fanOn,
        fanSpeed,
        ionizerOn,
        ionizerSyncWithFan,
        usageLocation,
        linkedSpecies,
        linkedPetBucket,
        linkedFanLampBucket,
        deviceName,
        regionCountry: geo.country,
        regionCity: geo.city,
        anomalyType,
        anomalyEventsMonthly,
        otaUpdatedRecently,
        otaResumeUsed,
        wifiReprovisioned,
        firmwareVersion,
      };
    });
  }, [currentPnDevices, currentPnTotal, userRecordMap]);
  const currentPnCameraUsageCards = useMemo(
    () => [
      { label: "日均 event 录像次数", value: `${average(currentPnCameraProfiles.map((item) => item.eventRecordingsDaily), 1)}次`, tone: "teal" as const, subtext: "单摄像头平均每天触发录像片段" },
      { label: "单段录像平均时长", value: `${average(currentPnCameraProfiles.map((item) => item.recordingDurationSeconds), 0)}秒`, tone: "amber" as const, subtext: "按每天 event 录像片段平均时长统计" },
      { label: "日均live view打开次数", value: `${average(currentPnCameraProfiles.map((item) => item.liveViewDaily), 1)}次`, tone: "violet" as const, subtext: "单摄像头平均每天打开实时视频的次数" },
      { label: "日均进入Live View大播放器次数", value: `${average(currentPnCameraProfiles.map((item) => item.liveViewPlayerDaily), 1)}次`, tone: "emerald" as const, subtext: "单摄像头平均每天点击进入 Live View 大播放器的次数" },
      { label: "日均 Live View 时长", value: `${average(currentPnCameraProfiles.map((item) => item.liveViewDurationSeconds), 0)}秒`, tone: "amber" as const, subtext: "单摄像头平均每天实时观看时长" },
      { label: "日均看录像次数", value: `${average(currentPnCameraProfiles.map((item) => item.playbackDaily), 1)}次`, tone: "amber" as const, subtext: "单摄像头平均每天回看录像次数" },
      { label: "平均每次看录像时长", value: `${average(currentPnCameraProfiles.map((item) => item.playbackDurationSeconds), 0)}秒`, tone: "violet" as const, subtext: "单次进入录像回看页面的平均观看时长" },
      { label: "日均进入设备设置次数", value: `${average(currentPnCameraProfiles.map((item) => item.settingsEntryDaily), 1)}次`, tone: "emerald" as const, subtext: "单摄像头平均每天进入设备设置页次数" },
      { label: "平均绑定宠物档案数", value: `${average(currentPnCameraProfiles.map((item) => item.petProfilesPerDevice), 1)}个`, tone: "teal" as const, subtext: "单摄像头关联的宠物档案平均数量" },
    ],
    [currentPnCameraProfiles],
  );
  const currentPnCameraDetectionDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCameraProfiles.map((item) => item.detectionMode), ["检测所有活动", "只检测动物活动"]),
    [currentPnCameraProfiles],
  );
  const currentPnCameraSensitivityDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCameraProfiles.map((item) => item.sensitivity), ["高", "中", "低"]),
    [currentPnCameraProfiles],
  );
  const currentPnCameraNightVisionDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCameraProfiles.map((item) => item.nightVisionMode), ["开启微光辅助夜视", "关闭微光辅助夜视"]),
    [currentPnCameraProfiles],
  );
  const currentPnCameraRecordingResolutionDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCameraProfiles.map((item) => item.recordingResolution), ["1080P", "720P", "480P"]),
    [currentPnCameraProfiles],
  );
  const currentPnCameraLiveViewResolutionDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCameraProfiles.map((item) => item.liveViewResolution), ["自动", "1080P", "720P", "480P"]),
    [currentPnCameraProfiles],
  );
  const currentPnCameraContinuousRecordingDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCameraProfiles.map((item) => item.continuousRecording), ["开启", "关闭"]),
    [currentPnCameraProfiles],
  );
  const currentPnCameraSdCardDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCameraProfiles.map((item) => item.sdCardStatus), ["已插入SD卡", "未插入SD卡"]),
    [currentPnCameraProfiles],
  );
  const currentPnCameraStorageModeDistribution = useMemo(
    () =>
      buildCategoryDistribution(
        currentPnCameraProfiles.map((item) => {
          if (item.cloudStorageEnabled && item.sdCardStatus === "已插入SD卡") return "同时使用云存储和本地SD卡";
          if (item.cloudStorageEnabled) return "只使用云存储";
          if (item.sdCardStatus === "已插入SD卡") return "只使用本地SD卡存储";
          return "不用云存储也不插SD卡";
        }),
        ["只使用云存储", "只使用本地SD卡存储", "同时使用云存储和本地SD卡", "不用云存储也不插SD卡"],
      ).map((item) => ({ ...item, value: item.share })),
    [currentPnCameraProfiles],
  );
  const currentPnCameraNotificationStyleDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCameraProfiles.map((item) => item.notificationStyle), ["纯文本通知", "文本+图片+描述"]),
    [currentPnCameraProfiles],
  );
  const currentPnCameraKeyRateCards = useMemo(
    () => [
      {
        label: "微光辅助夜视开启率",
        value: `${(currentPnCameraNightVisionDistribution.find((item) => item.name === "开启微光辅助夜视")?.share ?? 0).toFixed(1)}%`,
        tone: "teal" as const,
        subtext: "仅展示开启微光辅助夜视的设备占比",
      },
      {
        label: "连续录像开启率",
        value: `${(currentPnCameraContinuousRecordingDistribution.find((item) => item.name === "开启")?.share ?? 0).toFixed(1)}%`,
        tone: "amber" as const,
        subtext: "仅展示开启连续录像的设备占比",
      },
      {
        label: "插入 SD 卡设备比例",
        value: `${(currentPnCameraSdCardDistribution.find((item) => item.name === "已插入SD卡")?.share ?? 0).toFixed(1)}%`,
        tone: "violet" as const,
        subtext: "仅展示已插入 SD 卡的设备比例",
      },
    ],
    [currentPnCameraContinuousRecordingDistribution, currentPnCameraNightVisionDistribution, currentPnCameraSdCardDistribution],
  );
  const currentPnCameraGeographicDistribution = useMemo(() => {
    const total = currentPnCameraProfiles.length || 1;
    const countryCounts = new Map<string, number>();
    const cityCounts = new Map<string, number>();
    currentPnCameraProfiles.forEach((item) => {
      countryCounts.set(item.regionCountry, (countryCounts.get(item.regionCountry) ?? 0) + 1);
      cityCounts.set(item.regionCity, (cityCounts.get(item.regionCity) ?? 0) + 1);
    });
    const topCountries = [...countryCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([name, count], index) => ({
        name: `国家 · ${name}`,
        value: scaleValue(count, total, currentPnTotal),
        fill: featurePalette[index % featurePalette.length],
        displayValue: `${scaleValue(count, total, currentPnTotal).toLocaleString()}台`,
      }));
    const topCities = [...cityCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([name, count], index) => ({
        name: `城市 · ${name}`,
        value: scaleValue(count, total, currentPnTotal),
        fill: featurePalette[(index + 2) % featurePalette.length],
        displayValue: `${scaleValue(count, total, currentPnTotal).toLocaleString()}台`,
      }));
    return [...topCountries, ...topCities];
  }, [currentPnCameraProfiles, currentPnTotal]);
  const currentPnCameraUsageLocationDistribution = useMemo(
    () =>
      buildCategoryDistribution(
        currentPnCameraProfiles.map((item) => item.usageLocation),
        ["客厅", "卧室", "阳台", "门厅/玄关", "庭院/花园", "猫砂盆区", "宠物活动房", "厨房/餐区"],
      ).map((item) => ({ ...item, value: item.share })),
    [currentPnCameraProfiles],
  );
  const currentPnCameraAppSpeciesDistribution = useMemo(
    () =>
      buildCategoryDistribution(
        currentPnCameraProfiles.map((item) => item.appAnimalSpecies),
        ["瘤尾守宫", "豹纹守宫", "睫角守宫", "高冠变色龙", "玉米蛇", "高黄白化玉米蛇", "球蟒", "猪鼻蛇", "印尼蓝舌石龙子", "鬃狮蜥"],
      ).map((item) => ({ ...item, value: item.share })),
    [currentPnCameraProfiles],
  );
  const currentPnCameraAiSpeciesDistribution = useMemo(
    () =>
      buildCategoryDistribution(
        currentPnCameraProfiles.map((item) => item.aiAnimalSpecies),
        ["瘤尾守宫", "豹纹守宫", "睫角守宫", "高冠变色龙", "玉米蛇", "高黄白化玉米蛇", "球蟒", "猪鼻蛇", "印尼蓝舌石龙子", "鬃狮蜥"],
      ).map((item) => ({ ...item, value: item.share })),
    [currentPnCameraProfiles],
  );
  const currentPnCameraNamingClusterDistribution = useMemo(
    () =>
      buildCategoryDistribution(
        currentPnCameraProfiles.map((item) => item.namingCluster),
        ["按房间命名", "按宠物名命名", "按功能场景命名", "默认设备名", "个性化昵称"],
      ).map((item) => ({ ...item, value: item.share })),
    [currentPnCameraProfiles],
  );
  const currentPnCameraNamingWordCloudDistribution = useMemo(() => {
    const total = currentPnCameraProfiles.length || 1;
    const counts = new Map<string, number>();
    currentPnCameraProfiles.forEach((item) => {
      counts.set(item.deviceName, (counts.get(item.deviceName) ?? 0) + 1);
    });
    return [...counts.entries()]
      .filter(([name]) => !name.startsWith("Camera-"))
      .map(([name, count], index) => ({
        name,
        value: Number(((count / total) * 100).toFixed(1)),
        fill: featurePalette[index % featurePalette.length],
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 24);
  }, [currentPnCameraProfiles]);
  const currentPnCameraNamingTableCsv = useMemo(() => {
    const sampleRows = currentPnCameraProfiles.slice(0, Math.min(currentPnCameraProfiles.length, 120));
    const lines = [
      ["设备名称", "命名聚类", "使用位置", "App配置物种", "AI识别物种", "所在国家", "所在城市"].join(","),
      ...sampleRows.map((item) =>
        [item.deviceName, item.namingCluster, item.usageLocation, item.appAnimalSpecies, item.aiAnimalSpecies, item.regionCountry, item.regionCity]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    return `\uFEFF${lines.join("\n")}`;
  }, [currentPnCameraProfiles]);
  const currentPnCameraInstallOrientationDistribution = useMemo(
    () =>
      buildCategoryDistribution(
        currentPnCameraProfiles.map((item) => item.installOrientation),
        ["正装", "90度", "180度", "270度", "360度", "其他倾斜角度"],
      ).map((item) => ({ ...item, value: item.share })),
    [currentPnCameraProfiles],
  );
  const currentPnCameraFirmwareDistribution = useMemo(() => {
    const total = currentPnCameraProfiles.length || 1;
    const counts = new Map<string, number>();
    currentPnCameraProfiles.forEach((item) => {
      counts.set(item.firmwareVersion, (counts.get(item.firmwareVersion) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count], index) => {
        const share = Number(((count / total) * 100).toFixed(1));
        return {
          name,
          count,
          value: share,
          fill: featurePalette[index % featurePalette.length],
          displayValue: `${share}% (${count}台)`,
        };
      })
      .sort((left, right) => right.count - left.count);
  }, [currentPnCameraProfiles]);
  const currentPnCameraNotificationCards = useMemo(
    () => [
      {
        label: "Push 通知开启率",
        value: `${Number(((currentPnCameraProfiles.filter((item) => item.pushEnabled).length / (currentPnCameraProfiles.length || 1)) * 100).toFixed(1))}%`,
        tone: "teal" as const,
        subtext: "摄像头设备已开启推送通知的比例",
      },
      {
        label: "日均发出通知条数",
        value: `${average(currentPnCameraProfiles.map((item) => item.dailyNotifications), 1)}条`,
        tone: "amber" as const,
        subtext: "单摄像头平均每天触发的通知数量",
      },
      {
        label: "Push 平均点击打开率",
        value: `${average(currentPnCameraProfiles.filter((item) => item.pushEnabled).map((item) => item.pushOpenRate), 1)}%`,
        tone: "violet" as const,
        subtext: "推送消息被点击打开的平均比例",
      },
    ],
    [currentPnCameraProfiles],
  );
  const currentPnCameraPushLatencyDistribution = useMemo(() => {
    const buckets = ["1s以内", "1s", "2s", "3s", "4s", "5s", "6s及以上"] as const;
    const total = currentPnCameraProfiles.reduce((sum, item) => sum + Math.max(1, Math.round(item.dailyNotifications * 10)), 0) || 1;
    return buckets.map((name, index) => {
      const value = currentPnCameraProfiles.reduce((sum, item) => {
        if (item.pushLatencyBucket !== name) return sum;
        return sum + Math.max(1, Math.round(item.dailyNotifications * 10));
      }, 0);
      const share = Number(((value / total) * 100).toFixed(1));
      return {
        name,
        value: share,
        fill: featurePalette[index % featurePalette.length],
        displayValue: `${share}% (${value.toLocaleString()}条)`,
      };
    });
  }, [currentPnCameraProfiles]);
  const currentPnCameraSubscriptionCards = useMemo(
    () => [
      {
        label: "订阅云服务设备比例",
        value: `${Number(((currentPnCameraProfiles.filter((item) => item.cloudServiceEnabled).length / (currentPnCameraProfiles.length || 1)) * 100).toFixed(1))}%`,
        tone: "teal" as const,
        subtext: "已购买任一云服务套餐的设备占比",
      },
      {
        label: "开启云存储设备比例",
        value: `${Number(((currentPnCameraProfiles.filter((item) => item.cloudStorageEnabled).length / (currentPnCameraProfiles.length || 1)) * 100).toFixed(1))}%`,
        tone: "amber" as const,
        subtext: "已启用云端录像存储的设备占比",
      },
      {
        label: "开启云AI行为识别比例",
        value: `${Number(((currentPnCameraProfiles.filter((item) => item.cloudAiEnabled).length / (currentPnCameraProfiles.length || 1)) * 100).toFixed(1))}%`,
        tone: "violet" as const,
        subtext: "已启用云 AI 行为识别服务的设备占比",
      },
      {
        label: "开启云视频剪辑比例",
        value: `${Number(((currentPnCameraProfiles.filter((item) => item.cloudClipEnabled).length / (currentPnCameraProfiles.length || 1)) * 100).toFixed(1))}%`,
        tone: "teal" as const,
        subtext: "已启用云端视频剪辑服务的设备占比",
      },
    ],
    [currentPnCameraProfiles],
  );
  const currentPnCameraRenewalRateDistribution = useMemo(
    () =>
      [
        {
          name: "总续费率",
          profiles: currentPnCameraProfiles.filter((item) => item.cloudServiceEnabled),
        },
        {
          name: "单设备月付",
          profiles: currentPnCameraProfiles.filter((item) => item.subscriptionPackage === "增值服务-单设备套餐-月付"),
        },
        {
          name: "多设备月付",
          profiles: currentPnCameraProfiles.filter((item) => item.subscriptionPackage === "增值服务-多设备套餐-月付"),
        },
        {
          name: "单设备年付",
          profiles: currentPnCameraProfiles.filter((item) => item.subscriptionPackage === "增值服务-单设备套餐-年付"),
        },
        {
          name: "多设备年付",
          profiles: currentPnCameraProfiles.filter((item) => item.subscriptionPackage === "增值服务-多设备套餐-年付"),
        },
      ].map((item, index) => {
        const total = item.profiles.length || 1;
        const renewed = item.profiles.filter((profile) => profile.subscriptionRenewed).length;
        const value = Number(((renewed / total) * 100).toFixed(1));
        return {
          name: item.name,
          value,
          fill: featurePalette[index % featurePalette.length],
          displayValue: `${value}% (${renewed}/${item.profiles.length || 0}台)`,
        };
      }),
    [currentPnCameraProfiles],
  );
  const currentPnCameraSubscriptionOverviewDistribution = useMemo(
    () =>
      currentPnCameraSubscriptionCards.map((item, index) => ({
        name: item.label.replace("设备比例", "").replace("比例", ""),
        value: parsePercent(item.value),
        fill: featurePalette[index % featurePalette.length],
        displayValue: item.value,
      })),
    [currentPnCameraSubscriptionCards],
  );
  const currentPnCameraSubscriptionPackageDistribution = useMemo(
    () =>
      buildCategoryDistribution(
        currentPnCameraProfiles.filter((item) => item.subscriptionPackage !== "未订阅").map((item) => item.subscriptionPackage),
        ["增值服务-单设备套餐-月付", "增值服务-多设备套餐-月付", "增值服务-单设备套餐-年付", "增值服务-多设备套餐-年付"],
      ),
    [currentPnCameraProfiles],
  );
  const currentPnCentralControlUsageCards = useMemo(
    () => [
      { label: "日均进入设备设置次数", value: `${average(currentPnCentralControlProfiles.map((item) => item.settingsEntryDaily), 1)}次`, tone: "teal" as const, subtext: "单台中控设备平均每天进入设置页次数" },
      { label: "日均温度调节次数", value: `${average(currentPnCentralControlProfiles.map((item) => item.temperatureAdjustDaily), 1)}次`, tone: "amber" as const, subtext: "单台设备平均每天修改温控目标或温控模式次数" },
      { label: "日均湿度调节次数", value: `${average(currentPnCentralControlProfiles.map((item) => item.humidityAdjustDaily), 1)}次`, tone: "violet" as const, subtext: "单台设备平均每天修改湿控目标或模式次数" },
      { label: "日均手动喷淋次数", value: `${average(currentPnCentralControlProfiles.map((item) => item.manualSprayDaily), 1)}次`, tone: "emerald" as const, subtext: "单台设备平均每天触发即时喷淋次数" },
      { label: "单次喷淋平均时长", value: `${average(currentPnCentralControlProfiles.map((item) => item.manualSprayDurationSeconds), 0)}秒`, tone: "amber" as const, subtext: "手动喷淋单次按压触发的平均持续时长" },
      { label: "平均关联爬宠数", value: `${average(currentPnCentralControlProfiles.map((item) => item.linkedPets), 1)}只`, tone: "teal" as const, subtext: "单台设备平均关联爬宠档案数量" },
      { label: "平均关联风扇灯数", value: `${average(currentPnCentralControlProfiles.map((item) => item.linkedFanLamps), 1)}台`, tone: "violet" as const, subtext: "单台中控设备平均关联的风扇灯数量" },
      { label: "平均风扇定时计划数", value: `${average(currentPnCentralControlProfiles.map((item) => item.fanSchedules), 1)}个`, tone: "emerald" as const, subtext: "单台设备启用的风扇定时计划平均数量" },
      { label: "恒温灯平均功率", value: `${average(currentPnCentralControlProfiles.map((item) => item.heaterPowerPercent), 0)}%`, tone: "amber" as const, subtext: "恒温灯开启时的平均实时功率百分比" },
    ],
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlUpgradeOverview = useMemo(() => {
    const total = currentPnCentralControlProfiles.length;
    const upgraded = currentPnCentralControlProfiles.filter((item) => item.otaUpdatedRecently).length;
    const rate = Number(((upgraded / (total || 1)) * 100).toFixed(1));
    return {
      total,
      upgraded,
      rate,
    };
  }, [currentPnCentralControlProfiles]);
  const currentPnCentralControlUpgradeFailureLogCount = useMemo(() => {
    const currentPnSnSet = new Set(currentPnDevices.map((item) => item.snCode));
    return logFiles.filter(
      (item) => currentPnSnSet.has(item.deviceSn) && item.source === "device" && /(upgrade|ota)/i.test(item.fileName) && /failure/i.test(item.fileName),
    ).length;
  }, [currentPnDevices]);
  const currentPnCentralControlNamingWordCloudDistribution = useMemo(() => {
    const total = currentPnCentralControlProfiles.length || 1;
    const counts = new Map<string, number>();
    currentPnCentralControlProfiles.forEach((item) => {
      counts.set(item.deviceName, (counts.get(item.deviceName) ?? 0) + 1);
    });
    return [...counts.entries()]
      .filter(([name]) => !name.startsWith("CTRL-"))
      .map(([name, count], index) => ({
        name,
        value: Number(((count / total) * 100).toFixed(1)),
        fill: featurePalette[index % featurePalette.length],
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 18);
  }, [currentPnCentralControlProfiles]);
  const currentPnCentralControlTempTargetDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCentralControlProfiles.map((item) => item.temperatureTargetBucket), ["24-26°C", "27-28°C", "29-30°C", "31-32°C", "33°C及以上"]).map((item) => ({ ...item, value: item.share })),
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlHumidityTargetDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCentralControlProfiles.map((item) => item.humidityTargetBucket), ["40-49%", "50-59%", "60-69%", "70-79%", "80%及以上"]).map((item) => ({ ...item, value: item.share })),
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlHumidityModeDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCentralControlProfiles.map((item) => item.humidityMode), ["智能恒湿模式", "定时喷淋模式", "手动即时喷淋"]),
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlFergusonZoneDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCentralControlProfiles.map((item) => item.fergusonZone), ["FZ1 遮蔽型", "FZ2 部分日照", "FZ3 开放/晨昏型", "FZ4 bask型"]),
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlFeatureOverviewDistribution = useMemo(() => {
    const total = currentPnCentralControlProfiles.length || 1;
    const rows = [
      { name: "恒温灯开启", value: currentPnCentralControlProfiles.filter((item) => item.heaterLampOn).length },
      { name: "卤素日光加热灯开启", value: currentPnCentralControlProfiles.filter((item) => item.halogenLampOn).length },
      { name: "卤素灯定时启用", value: currentPnCentralControlProfiles.filter((item) => item.halogenScheduleEnabled).length },
      { name: "LED 灯开启", value: currentPnCentralControlProfiles.filter((item) => item.ledOn).length },
      { name: "UVA/UVB 灯开启", value: currentPnCentralControlProfiles.filter((item) => item.uvOn).length },
      { name: "UVA/UVB 定时启用", value: currentPnCentralControlProfiles.filter((item) => item.uvScheduleEnabled).length },
      { name: "模拟日光开启", value: currentPnCentralControlProfiles.filter((item) => item.simulateDaylightOn).length },
      { name: "夜光模式开启", value: currentPnCentralControlProfiles.filter((item) => item.nightLightOn).length },
      { name: "离子净化开启", value: currentPnCentralControlProfiles.filter((item) => item.ionizerOn).length },
      { name: "风扇联动净化", value: currentPnCentralControlProfiles.filter((item) => item.ionizerSyncWithFan).length },
    ];
    return rows.map((item, index) => ({
      name: item.name,
      value: Number(((item.value / total) * 100).toFixed(1)),
      fill: featurePalette[index % featurePalette.length],
      displayValue: `${Number(((item.value / total) * 100).toFixed(1))}%`,
    }));
  }, [currentPnCentralControlProfiles]);
  const currentPnCentralControlFanSpeedDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCentralControlProfiles.map((item) => item.fanSpeed), ["1档", "2档", "3档", "4档"]).map((item) => ({ ...item, value: item.share })),
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlLedBrightnessDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCentralControlProfiles.map((item) => item.ledBrightnessBucket), ["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"]).map((item) => ({ ...item, value: item.share })),
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlAnomalyDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCentralControlProfiles.map((item) => item.anomalyType), ["温度异常", "湿度异常", "设备离线", "传感器故障"]),
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlSpeciesDistribution = useMemo(
    () =>
      buildCategoryDistribution(
        currentPnCentralControlProfiles.map((item) => item.linkedSpecies),
        ["瘤尾守宫", "豹纹守宫", "睫角守宫", "鬃狮蜥", "玉米蛇", "猪鼻蛇", "球蟒", "蓝舌石龙子", "赫曼陆龟", "姥爷蛙"],
      ).map((item) => ({ ...item, value: item.share })),
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlUsageLocationDistribution = useMemo(
    () =>
      buildCategoryDistribution(
        currentPnCentralControlProfiles.map((item) => item.usageLocation),
        ["客厅生态箱", "书房饲养架", "卧室孵化架", "阳台育苗箱", "工作室展示墙", "检疫隔离区"],
      ).map((item) => ({ ...item, value: item.share })),
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlGeographicDistribution = useMemo(() => {
    const total = currentPnCentralControlProfiles.length || 1;
    const countries = buildDistribution(currentPnCentralControlProfiles, (item) => item.regionCountry)
      .slice(0, 4)
      .map((item, index) => ({
        name: `国家 · ${item.name}`,
        value: Number(((item.value / total) * 100).toFixed(1)),
        fill: index % 2 === 0 ? "#30C7C9" : "#5B8CFF",
      }));
    const cities = buildDistribution(currentPnCentralControlProfiles, (item) => item.regionCity)
      .slice(0, 4)
      .map((item, index) => ({
        name: `城市 · ${item.name}`,
        value: Number(((item.value / total) * 100).toFixed(1)),
        fill: index % 2 === 0 ? "#FF8A5B" : "#9B7BFF",
      }));
    return [...countries, ...cities];
  }, [currentPnCentralControlProfiles]);
  const currentPnCentralControlLinkedPetDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCentralControlProfiles.map((item) => item.linkedPetBucket), ["1只", "2-3只", "4-5只", "6只及以上"]).map((item) => ({ ...item, value: item.share })),
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlLinkedFanLampDistribution = useMemo(
    () => buildCategoryDistribution(currentPnCentralControlProfiles.map((item) => item.linkedFanLampBucket), ["0台", "1-2台", "3-4台", "5-6台", "7台及以上"]).map((item) => ({ ...item, value: item.share })),
    [currentPnCentralControlProfiles],
  );
  const currentPnCentralControlFirmwareDistribution = useMemo(() => {
    const counts = buildDistribution(currentPnCentralControlProfiles, (item) => item.firmwareVersion).slice(0, 6);
    const total = currentPnCentralControlProfiles.length || 1;
    return counts.map((item, index) => ({
      name: item.name,
      value: Number(((item.value / total) * 100).toFixed(1)),
      fill: featurePalette[index % featurePalette.length],
      displayValue: `${Number(((item.value / total) * 100).toFixed(1))}%`,
    }));
  }, [currentPnCentralControlProfiles]);

  useEffect(() => {
    setPnFilterOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "devices" && devicePnFilter === "全部PN") {
      setDevicePnFilter(defaultDevicePnCode);
    }
  }, [activeTab, devicePnFilter]);

  const aiSummaryCards = [
    { label: "本地AI开启率", value: `${aiFeatureSummary[0].enableRate}%`, trend: "订阅后不限次使用", tone: "teal" as const, subtext: "设备端动物检测能力渗透率" },
    {
      label: "云端AI使用率",
      value: `${(aiFeatureSummary.slice(1).reduce((sum, item) => sum + item.usageRate, 0) / Math.max(aiFeatureSummary.length - 1, 1)).toFixed(1)}%`,
      trend: "已解锁后的真实使用",
      tone: "amber" as const,
      subtext: "行为识别、剪辑、助手、知识库平均使用率",
    },
    { label: "AI 日调用量", value: aiFeatureSummary.reduce((sum, item) => sum + item.dailyCalls, 0).toLocaleString(), trend: "近 24 小时", tone: "violet" as const, subtext: "本地与云端 AI 总调用规模" },
    { label: "纠错反馈参与率", value: "9.6%", trend: "模型改进入口", tone: "emerald" as const, subtext: "发生点踩并提交纠错的 AI 事件占比" },
    { label: "告警平均延迟", value: "2.4秒", trend: "关键事件送达", tone: "teal" as const, subtext: "异常行为识别到推送送达的平均时延" },
  ];

  const subscriptionSummaryCards = [
    { label: "专业版订阅家庭数", value: subscriptionSummary.subscribedHouseholds.toLocaleString(), trend: "Professional", tone: "teal" as const, subtext: "当前有效专业版订阅家庭规模" },
    { label: "订阅率", value: `${subscriptionSummary.subscriptionRate}%`, trend: "household 口径", tone: "amber" as const, subtext: "订阅家庭占全部家庭的比例" },
    { label: "试用中家庭数", value: subscriptionSummary.trialHouseholds.toLocaleString(), trend: "7天试用", tone: "violet" as const, subtext: "当前仍处于试用期的家庭数" },
    { label: "试用转正率", value: `${subscriptionSummary.trialConversionRate}%`, trend: "试用→付费", tone: "emerald" as const, subtext: "启动试用后转为正式订阅的比例" },
    { label: "月度经常性收入", value: `$${subscriptionSummary.monthlyRevenue.toLocaleString()}`, trend: "MRR", tone: "teal" as const, subtext: "专业版套餐月度经常性收入" },
  ];

  const pnFilterAction = (
    <div className="relative sm:self-center">
      <button
        type="button"
        onClick={() => setPnFilterOpen((current) => !current)}
        className="flex w-[136px] items-center justify-between rounded-full border border-white/80 bg-white/92 px-3 py-2 text-sm font-medium text-[#5e86b4] shadow-[0_10px_24px_rgba(91,140,255,0.1)] transition hover:bg-white"
      >
        <span className="truncate">{currentPnLabel}</span>
        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#eef5ff] text-[#5B8CFF]">
          <ChevronDown className={`h-3.5 w-3.5 transition ${pnFilterOpen ? "rotate-180" : ""}`} />
        </span>
      </button>
      {pnFilterOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[90] w-[168px] rounded-[22px] border border-[#d8ebff] bg-white p-2 shadow-[0_20px_40px_rgba(27,139,250,0.14)]">
          {devicePnOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setDevicePnFilter(option);
                setPnFilterOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm transition ${
                devicePnFilter === option ? "bg-[#eef6ff] text-[#1B8BFA]" : "text-slate-700 hover:bg-[#f8fbff]"
              }`}
            >
              <span className="truncate">{formatPnLabel(option)}</span>
              {devicePnFilter === option ? <Check className="h-4 w-4" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  const downloadCameraNamingTable = () => {
    const blob = new Blob([currentPnCameraNamingTableCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${currentPnLabel}-设备命名表.csv`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="relative rounded-[34px] border border-[#d8ebff] bg-[linear-gradient(135deg,#f8fbff_0%,#eef5ff_22%,#f8f2ff_56%,#eefdfc_100%)] p-6 shadow-[0_28px_70px_rgba(73,123,255,0.12)]">
          <div className="absolute -right-14 -top-12 h-40 w-40 rounded-full bg-[#7d8dff]/20 blur-3xl" />
          <div className="absolute bottom-0 right-[18%] h-32 w-32 rounded-full bg-[#33c7c9]/18 blur-3xl" />
          <div className="absolute left-[20%] top-0 h-28 w-28 rounded-full bg-[#ff8a5b]/14 blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {reportTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setPnFilterOpen(false);
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? "border-[#8fbdff] bg-white text-[#1B8BFA] shadow-[0_10px_24px_rgba(91,140,255,0.14)]" : "border-white/75 bg-white/70 text-[#6e8eb4] hover:bg-white/90"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {activeTab === "users" ? (
          <>
            <section className="space-y-2">
              <Panel title="用户规模与活跃" description="统计 household、月活用户，并汇总展示注册用户、绑定设备和活跃表现">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[userSummaryCards[1], userSummaryCards[0], userSummaryCards[5], userSummaryCards[4]].map((item, index) => (
                    <StatCard key={item.label} label={item.label} value={item.value} trend={item.trend} tone={item.tone} subtext={item.subtext} icon={userCardIcons[index]} />
                  ))}
                </div>
              </Panel>
            </section>

            <section className="space-y-4">
              <div className="grid gap-6 xl:grid-cols-[2fr_1fr] [&>div>section]:h-full [&>section]:h-full">
                  <Panel title="用户活跃趋势" description="支持查看最近 30 天、10 周、12 个月和全部有记录年份的用户或 household 活跃趋势">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: "users" as const, label: "全体用户活跃趋势" },
                            { value: "household" as const, label: "household活跃趋势" },
                          ].map((scope) => (
                            <button
                              key={scope.value}
                              type="button"
                              onClick={() => setUserTrendScope(scope.value)}
                              className={getToggleTabClass(userTrendScope === scope.value)}
                            >
                              {scope.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(["日", "周", "月", "年"] as TimeRange[]).map((range) => (
                            <button
                              key={range}
                              type="button"
                              onClick={() => setUserTrendRange(range)}
                              className={getToggleTabClass(userTrendRange === range)}
                            >
                              {range}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 px-[10px] text-right text-xs text-[#7395bc]">
                        {userTrendRange === "日"
                          ? "展示最近 30 天活跃趋势"
                          : userTrendRange === "周"
                            ? "展示最近 10 周活跃趋势"
                            : userTrendRange === "月"
                              ? "展示最近 12 个月活跃趋势"
                              : "展示全部有记录年份的活跃趋势"}
                      </div>
                    </div>
                    <div className="mt-4 h-[212px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={currentUserTrendSeries}>
                          <CartesianGrid stroke="#e4f0ff" vertical={false} />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} tickMargin={16} height={40} />
                          <YAxis yAxisId="count" tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                          <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} unit="%" />
                          <Tooltip content={<ChartTooltip />} />
                          <Line
                            yAxisId="count"
                            type="monotone"
                            dataKey="total"
                            name={userTrendScope === "users" ? "全体用户数" : "household 总数"}
                            stroke="#5B8CFF"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#5B8CFF" }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="count"
                            type="monotone"
                            dataKey="active"
                            name={userTrendScope === "users" ? "活跃用户" : "活跃 household"}
                            stroke="#30C7C9"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#30C7C9" }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="rate"
                            type="monotone"
                            dataKey="activeRate"
                            name={userTrendScope === "users" ? "用户活跃率" : "household 活跃率"}
                            stroke="#FF8A5B"
                            strokeWidth={2.5}
                            strokeDasharray="6 6"
                            dot={{ r: 3.5, fill: "#FF8A5B" }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Panel>
                  <div className="[&>section>div:last-child]:pt-5 [&>section>div:last-child]:pb-5">
                    <Panel
                      title="各 PN 用户活跃度"
                      description="每根横向柱表示一个 PN 的用户活跃度"
                    >
                      <div className="mb-3 flex flex-wrap justify-center gap-2">
                        {(["日", "周", "月"] as ShortTimeRange[]).map((range) => (
                          <button key={range} type="button" onClick={() => setPnActiveRange(range)} className={getToggleTabClass(pnActiveRange === range)}>
                            {range}
                          </button>
                        ))}
                      </div>
                      <div className="h-[254px] overflow-y-auto pr-1">
                        <div style={{ height: `${Math.max(pnUserActiveRate.length * 32, 300)}px` }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pnUserActiveRate} layout="vertical" margin={{ left: -4, right: 28, top: 4, bottom: 4 }}>
                            <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} unit="%" />
                            <YAxis type="category" dataKey="name" width={54} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="value" name="用户活跃度" fill="#5B8CFF" barSize={14} radius={[0, 8, 8, 0]}>
                              <LabelList dataKey="value" position="right" formatter={(value: number) => `${value}%`} className="fill-slate-950 text-xs font-semibold" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      </div>
                    </Panel>
                  </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid gap-6 xl:grid-cols-3">
                <Panel title="按设备类型的household分布" description="包含摄像头、中控设备、风扇灯、加热灯和 Wi-Fi 温控等">
                  <div className="flex h-[260px] flex-col">
                    <div className="min-h-0 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={householdTypeDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="44%"
                            innerRadius={40}
                            outerRadius={62}
                            paddingAngle={3}
                            labelLine={false}
                          >
                            {householdTypeDistribution.map((item, index) => (
                              <Cell key={item.name} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[#5d7fa8]">
                      {householdTypeDistribution.map((item, index) => (
                        <div key={item.name} className="flex items-start gap-1.5">
                          <span className="mt-0.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                          <div className="leading-4">
                            <div>{String(item.name).replace("（不限PN）", "")}</div>
                            <div className="font-semibold text-slate-950">
                              {item.value.toLocaleString()} / {item.share}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>

                <Panel title="各PN的household总数" description="统计所有 household 里每个 PN 对应的 household 数量">
                  <div className="mt-4 h-[240px] overflow-y-auto pr-1">
                    <div style={{ height: `${Math.max(pnHouseholdCount.length * 34, 240)}px` }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pnHouseholdCount} layout="vertical" margin={{ left: 2, right: 38, top: 4, bottom: 4 }}>
                          <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                          <XAxis
                            type="number"
                            domain={[0, 6000]}
                            tickCount={5}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#7395bc", fontSize: 12 }}
                            tickFormatter={(value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`)}
                          />
                          <YAxis type="category" dataKey="name" width={54} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="value" name="household总数" fill="#30C7C9" barSize={16} radius={[0, 8, 8, 0]}>
                            <LabelList dataKey="value" position="right" formatter={(value: number) => value.toLocaleString()} className="fill-slate-950 text-xs font-semibold" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Panel>

                <Panel title="Household拥有的设备组合统计" description="按 household 拥有的设备组合统计各组合对应的 household 人数占比">
                  <div className="mt-4 h-[240px] overflow-y-auto pr-1">
                    <div style={{ height: `${Math.max(householdDeviceComboStats.length * 46, 240)}px` }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={householdDeviceComboStats} layout="vertical" margin={{ left: 14, right: 22, top: 4, bottom: 4 }}>
                          <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} unit="%" />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={116}
                            tickLine={false}
                            axisLine={false}
                            tick={(props) => renderTruncatedYAxisTick({ ...props, maxLength: 15 })}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="percent" name="household占比" fill="#5B8CFF" barSize={16} radius={[0, 8, 8, 0]}>
                            <LabelList dataKey="percent" position="right" formatter={(value: number) => `${value}%`} className="fill-slate-950 text-xs font-semibold" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Panel>
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <Panel title="用户地区分布" description="查看用户主要地区分布占比" padded={false}>
                  <div className="px-5 pt-[7px] pb-[7px]">
                    <div className="mt-4 h-[220px] overflow-y-auto pr-1">
                      <div style={{ height: `${Math.max(regionDistribution.length * 24, 220)}px` }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={regionDistribution} layout="vertical" margin={{ left: 18, right: 58, top: 4, bottom: 4 }}>
                            <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                            <XAxis type="number" domain={[0, 18]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} unit="%" />
                            <YAxis type="category" dataKey="name" width={78} tickLine={false} axisLine={false} tick={(props) => renderTruncatedYAxisTick({ ...props, maxLength: 8, align: "start", width: 78 })} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="percent" name="地区用户占比" fill="#5B8CFF" barSize={12} radius={[0, 8, 8, 0]}>
                              <LabelList dataKey="percent" position="right" formatter={(value: number) => `${value.toFixed(1)}%`} className="fill-slate-950 text-xs font-semibold" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel title="性别分布" description="查看用户性别画像占比">
                  <div className="flex h-[220px] flex-col">
                    <div className="min-h-0 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={genderDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="48%"
                            innerRadius={34}
                            outerRadius={68}
                            paddingAngle={4}
                            labelLine={false}
                          >
                            {genderDistribution.map((item, index) => (
                              <Cell key={item.name} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-4 text-xs text-[#5d7fa8]">
                      {genderDistribution.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                          <span>{item.name}</span>
                          <span className="font-semibold text-slate-950">{item.share}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>

                <Panel title="年龄分布" description="按年龄层查看用户画像结构">
                  <div className="mt-4 h-[220px] overflow-y-auto pr-1">
                    <div style={{ height: `${Math.max(ageDistribution.length * 28, 220)}px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageDistribution} layout="vertical" margin={{ left: 4, right: 18, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} />
                        <YAxis type="category" dataKey="name" width={56} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="value" name="年龄用户数" fill="#5B8CFF" barSize={16} radius={[0, 8, 8, 0]}>
                          <LabelList
                            dataKey="displayValue"
                            position="right"
                            className="fill-slate-950 text-xs font-semibold"
                          />
                          </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                </Panel>

                <Panel title="用户活跃分层分布" description="统一按近 7 天、8~30 天、31~60 天、超过 60 天未打开 App 进行分层">
                  <div className="mt-4 h-[220px] overflow-y-auto pr-1">
                    <div style={{ height: `${Math.max(activityDistribution.length * 32, 220)}px` }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityDistribution} layout="vertical" margin={{ left: 4, right: 38, top: 4, bottom: 4 }}>
                          <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} unit="%" />
                          <YAxis type="category" dataKey="name" width={72} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="share" name="用户占比" barSize={16} radius={[0, 8, 8, 0]}>
                            {activityDistribution.map((item) => (
                              <Cell key={item.name} fill={item.fill} />
                            ))}
                            <LabelList dataKey="displayValue" position="right" className="fill-slate-950 text-xs font-semibold" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Panel>
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                <Panel title="用户使用的App版本分布" description="统计各 App 版本号对应的用户占比" overflowVisible>
                  <div className="mt-4 h-[280px] overflow-y-auto pr-1">
                    <div style={{ height: `${Math.max(appVersionUsageDistribution.length * 36, 280)}px` }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={appVersionUsageDistribution} layout="vertical" margin={{ left: 4, right: 42, top: 4, bottom: 4 }}>
                          <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                          <XAxis type="number" domain={[0, 35]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} unit="%" />
                          <YAxis type="category" dataKey="name" width={72} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="percent" name="用户占比" fill="#5B8CFF" barSize={16} radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Panel>

                <Panel title="用户使用的手机型号统计" description="以手机型号与系统版本组合查看各类手机的使用用户占比" overflowVisible>
                  <div className="mt-4 h-[280px] overflow-y-auto pr-1">
                    <div style={{ height: `${Math.max(phoneModelUsageDistribution.length * 36, 280)}px` }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={phoneModelUsageDistribution} layout="vertical" margin={{ left: 4, right: 42, top: 4, bottom: 4 }}>
                          <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                          <XAxis type="number" domain={[0, 18]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} unit="%" />
                          <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 11 }} tickFormatter={(value: string) => truncateText(value, 16)} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="percent" name="使用用户占比" fill="#30C7C9" barSize={14} radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Panel>
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid gap-6">
                <Panel title="用户每天使用App的时间段统计" description="按小时查看指定日期内的 App 使用用户占比，支持切换全体用户与 household" overflowVisible>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {([
                          { value: "users" as const, label: "全体用户" },
                          { value: "household" as const, label: "household" },
                        ]).map((scope) => (
                          <button key={scope.value} type="button" onClick={() => setAppUsageScope(scope.value)} className={getToggleTabClass(appUsageScope === scope.value)}>
                            {scope.label}
                          </button>
                        ))}
                      </div>
                      <div className="inline-flex items-center gap-3 text-sm text-[#6f8fb3]">
                        <span className="font-medium">选择日期</span>
                        <input
                          type="date"
                          value={appUsageDate}
                          onChange={(event) => setAppUsageDate(event.target.value)}
                          className="rounded-full border border-[#d7e9ff] bg-[#f7fbff] px-3 py-1.5 text-sm text-slate-950 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyAppUsageDistribution} margin={{ left: 0, right: 10, top: 12, bottom: 8 }}>
                        <CartesianGrid stroke="#e4f0ff" vertical={false} />
                        <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 11 }} interval={1} />
                        <YAxis type="number" domain={[0, 20]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} unit="%" />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="percent" name={appUsageScope === "users" ? "App使用用户占比" : "App使用household占比"} fill="#5B8CFF" barSize={12} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>
            </section>

          </>
        ) : null}

        {activeTab === "devices" ? (
          <>
            {currentPnDevices.length === 0 ? (
              <PanelEmptyState text="当前 PN 条件下暂无设备报表数据。" />
            ) : (
              <div className="space-y-6">
                <section className="space-y-4">
                  <Panel
                    title={`设备大数据报表 · ${currentPnLabel}`}
                    description="按选定 PN 查看设备数与状态的核心汇总指标"
                    action={pnFilterAction}
                    overflowVisible
                  >
                    <div className="grid gap-4 xl:grid-cols-4">
                      <StatCard label="总绑定设备数" value={currentPnTotal.toLocaleString()} trend="按 PN 估算" tone="teal" subtext="当前设备型号总体规模" icon={<Cpu className="h-5 w-5" />} />
                      <StatCard label="在线设备数" value={currentPnOnline.toLocaleString()} trend={`${((currentPnOnline / currentPnTotal) * 100).toFixed(1)}%`} tone="emerald" subtext="在线设备占比" icon={<Activity className="h-5 w-5" />} />
                      <StatCard label="离线设备数" value={currentPnOffline.toLocaleString()} trend={`${((currentPnOffline / currentPnTotal) * 100).toFixed(1)}%`} tone="violet" subtext="离线设备占比" icon={<ShieldEllipsis className="h-5 w-5" />} />
                      <StatCard label="绑定成功率" value={`${currentPnSuccessRate.toFixed(1)}%`} trend="绑定表现" tone="amber" subtext="当前 PN 绑定成功率" icon={<Sparkles className="h-5 w-5" />} />
                    </div>
                  </Panel>
                </section>

                {currentDeviceType === "camera" ? (
                  <>
                    <section className="space-y-4">
                      <CompactWordCloudPanel
                        title="摄像头名字聚类统计"
                        description="使用词云方式查看小豹子、睫毛弯弯、大尾巴、瘤尾1、奶盖、布丁、琥珀等更丰富的具体设备命名聚类"
                        items={currentPnCameraNamingWordCloudDistribution}
                        action={
                          <button
                            type="button"
                            onClick={downloadCameraNamingTable}
                            className="inline-flex items-center gap-2 rounded-full border border-[#d7e9ff] bg-white px-3 py-2 text-sm font-medium text-[#5B8CFF] shadow-[0_8px_18px_rgba(91,140,255,0.08)] transition hover:bg-[#f7fbff]"
                          >
                            <Download className="h-4 w-4" />
                            下载设备命名表
                          </button>
                        }
                      />
                    </section>

                    <section className="space-y-4">
                      <CompactMetricsPanel
                        title="摄像头功能使用概览"
                        description="压缩展示录像、Live View、大播放器进入、回看、设置进入与宠物档案等高频使用指标"
                        items={currentPnCameraUsageCards}
                        columnsClassName="md:grid-cols-3 xl:grid-cols-5"
                      />
                    </section>

                    <section className="space-y-4">
                      <CompactMetricsPanel
                        title="关键设置开启概览"
                        description="在两行高度内紧凑查看夜视、连续录像与 SD 卡启用情况"
                        items={currentPnCameraKeyRateCards}
                        columnsClassName="md:grid-cols-3"
                      />
                    </section>

                    <section className="space-y-4">
                      <div className="grid gap-6 xl:grid-cols-4">
                        <CompactPiePanel title="活动检测模式比例" description="查看检测所有活动与只检测动物活动的设置占比" data={currentPnCameraDetectionDistribution} />
                        <CompactPiePanel title="检测灵敏度比例" description="查看高、中、低三档灵敏度设置的设备占比" data={currentPnCameraSensitivityDistribution} />
                        <CompactHorizontalBarPanel
                          title="录像分辨率设置比例"
                          description="参考版本分布图样式查看 1080P / 720P / 480P 三档录像分辨率配置占比"
                          data={currentPnCameraRecordingResolutionDistribution.map((item) => ({ ...item, value: item.share }))}
                          valueLabel="录像分辨率占比"
                          width={60}
                        />
                        <CompactHorizontalBarPanel
                          title="实时视频分辨率比例"
                          description="参考版本分布图样式查看自动 / 1080P / 720P / 480P 的实时视频设置占比"
                          data={currentPnCameraLiveViewResolutionDistribution.map((item) => ({ ...item, value: item.share }))}
                          valueLabel="实时视频分辨率占比"
                          width={60}
                        />
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="grid gap-6 xl:grid-cols-4">
                        <Panel title="设备所在地区分布" description="汇总查看当前 PN 摄像头所在国家与城市分布">
                          <div className="mt-4 h-[280px] overflow-y-auto pr-1">
                            <div style={{ height: `${Math.max(currentPnCameraGeographicDistribution.length * 34, 240)}px` }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={currentPnCameraGeographicDistribution} layout="vertical" margin={{ left: 14, right: 42, top: 4, bottom: 4 }}>
                                  <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                                  <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={80}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={(props) => renderTruncatedYAxisTick({ ...props, maxLength: 10, align: "start", width: 80 })}
                                  />
                                  <Tooltip content={<ChartTooltip />} />
                                  <Bar dataKey="value" name="设备数" radius={[0, 8, 8, 0]} barSize={16}>
                                    {currentPnCameraGeographicDistribution.map((item) => (
                                      <Cell key={item.name} fill={item.fill} />
                                    ))}
                                    <LabelList dataKey="value" position="right" formatter={(value: number) => value.toLocaleString()} className="fill-slate-950 text-xs font-semibold" />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </Panel>
                        <CompactHorizontalBarPanel
                          title="摄像头使用位置分布"
                          description="查看客厅、卧室、阳台等使用位置名称及摄像头数量占比"
                          data={currentPnCameraUsageLocationDistribution}
                          valueLabel="使用位置占比"
                          width={84}
                        />
                        <CompactHorizontalBarPanel
                          title="关联动物物种（App设置）"
                          description="按 App 用户为摄像头设置的爬行动物详细物种分类查看占比"
                          data={currentPnCameraAppSpeciesDistribution}
                          valueLabel="物种占比"
                          width={96}
                          labelMaxLength={8}
                        />
                        <CompactHorizontalBarPanel
                          title="关联动物物种（AI识别）"
                          description="按 AI 根据摄像头图片视频识别的主要爬行动物物种查看占比"
                          data={currentPnCameraAiSpeciesDistribution}
                          valueLabel="物种占比"
                          width={96}
                          labelMaxLength={8}
                        />
                      </div>
                    </section>

                    <section className="space-y-4">
                      <Panel title="通知数据概览" description="查看摄像头 Push 通知开启率、通知形式与消息送达时延分布">
                        <div className="grid gap-4 xl:grid-cols-3">
                          {currentPnCameraNotificationCards.map((item) => (
                            <StatCard key={item.label} label={item.label} value={item.value} tone={item.tone} subtext={item.subtext} />
                          ))}
                        </div>
                        <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                          <div className="rounded-[24px] border border-[#e3f0ff] bg-[#fbfdff] p-5">
                            <div className="text-sm font-semibold text-slate-950">通知形式设置比例</div>
                            <div className="mt-1 text-xs text-[#6f8fb3]">查看纯文本通知与文本+图片+描述两种通知形式配置占比</div>
                            <div className="mt-4 flex h-[232px] flex-col">
                              <div className="min-h-0 flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie data={currentPnCameraNotificationStyleDistribution} dataKey="value" nameKey="name" cx="50%" cy="44%" innerRadius={32} outerRadius={58} paddingAngle={4} labelLine={false}>
                                      {currentPnCameraNotificationStyleDistribution.map((item, index) => (
                                        <Cell key={item.name} fill={item.fill ?? pieColors[index % pieColors.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#5d7fa8]">
                                {currentPnCameraNotificationStyleDistribution.map((item, index) => (
                                  <div key={item.name} className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill ?? pieColors[index % pieColors.length] }} />
                                    <div>{item.name}</div>
                                    <div className="font-semibold text-slate-950">{item.share.toFixed(1)}%</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="rounded-[24px] border border-[#e3f0ff] bg-[#fbfdff] p-5">
                            <div className="text-sm font-semibold text-slate-950">Push 通知送达时延占比</div>
                            <div className="mt-1 text-xs text-[#6f8fb3]">统计所有发出去的 Push 通知从触发到手机收到通知的耗时分布</div>
                            <div className="mt-4 h-[280px] overflow-y-auto pr-1">
                              <div style={{ height: `${Math.max(currentPnCameraPushLatencyDistribution.length * 34, 240)}px` }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={currentPnCameraPushLatencyDistribution} layout="vertical" margin={{ left: 4, right: 42, top: 4, bottom: 4 }}>
                                    <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} tickFormatter={(value: number) => `${value}%`} />
                                    <YAxis
                                      type="category"
                                      dataKey="name"
                                      width={76}
                                      tickLine={false}
                                      axisLine={false}
                                      tick={(props) => renderTruncatedYAxisTick({ ...props, maxLength: 10, align: "end", width: 76 })}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="value" name="通知条数占比" radius={[0, 8, 8, 0]} barSize={16}>
                                      {currentPnCameraPushLatencyDistribution.map((item, index) => (
                                        <Cell key={item.name} fill={item.fill ?? featurePalette[index % featurePalette.length]} />
                                      ))}
                                      <LabelList dataKey="value" position="right" formatter={(value: number) => `${value}%`} className="fill-slate-950 text-xs font-semibold" />
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Panel>
                    </section>

                    <section className="space-y-4">
                      <div className="grid gap-6 xl:grid-cols-3">
                        <CompactHorizontalBarPanel
                          title="订阅数据概览"
                          description="查看云服务订阅、云存储、云 AI 行为识别与云视频剪辑开启情况"
                          data={currentPnCameraSubscriptionOverviewDistribution}
                          valueLabel="设备占比"
                          width={96}
                          labelMaxLength={10}
                        />
                        <CompactPiePanel title="订阅服务套餐比例" description="查看四类增值服务套餐在已订阅设备中的占比结构" data={currentPnCameraSubscriptionPackageDistribution} />
                        <CompactHorizontalBarPanel
                          title="订阅续费率"
                          description="除总续费率外，统计不同套餐订阅用户的续费率，并按横向条形图展示"
                          data={currentPnCameraRenewalRateDistribution}
                          valueLabel="续费率"
                          width={88}
                          labelMaxLength={8}
                        />
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="grid gap-6 xl:grid-cols-3">
                        <Panel title="功能报错编号与报错次数占比" description="查看 App / FW 终端错误码编号以及各编号对应的报错次数比例">
                          <div className="mt-4 h-[280px] overflow-y-auto pr-1">
                            <div style={{ height: `${Math.max(currentPnErrorShare.length * 34, 240)}px` }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={currentPnErrorShare} layout="vertical" margin={{ left: 2, right: 42, top: 4, bottom: 4 }}>
                                  <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} tickFormatter={(value: number) => `${value}%`} />
                                  <YAxis type="category" dataKey="name" width={84} tickLine={false} axisLine={false} tick={(props) => renderTruncatedYAxisTick({ ...props, maxLength: 11, align: "end", width: 84 })} />
                                  <Tooltip content={<ChartTooltip />} />
                                  <Bar dataKey="value" name="报错次数占比" radius={[0, 8, 8, 0]} barSize={16}>
                                    {currentPnErrorShare.map((item, index) => (
                                      <Cell key={item.name} fill={featurePalette[index % featurePalette.length]} />
                                    ))}
                                    <LabelList dataKey="value" position="right" formatter={(value: number) => `${value}%`} className="fill-slate-950 text-xs font-semibold" />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </Panel>

                        <Panel title="摄像头安装方向统计比例" description="查看正装、旋转角度与其他倾斜角度等安装方向占比">
                          <div className="mt-4 h-[280px] overflow-y-auto pr-1">
                            <div style={{ height: `${Math.max(currentPnCameraInstallOrientationDistribution.length * 34, 240)}px` }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={currentPnCameraInstallOrientationDistribution} layout="vertical" margin={{ left: 14, right: 42, top: 4, bottom: 4 }}>
                                  <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} tickFormatter={(value: number) => `${value}%`} />
                                  <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={84}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={(props) => renderTruncatedYAxisTick({ ...props, maxLength: 9, align: "start", width: 84 })}
                                  />
                                  <Tooltip content={<ChartTooltip />} />
                                  <Bar dataKey="value" name="安装方向占比" fill="#30C7C9" radius={[0, 8, 8, 0]} barSize={16}>
                                    <LabelList dataKey="value" position="right" formatter={(value: number) => `${value}%`} className="fill-slate-950 text-xs font-semibold" />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </Panel>

                        <Panel title="各固件版本设备占比" description="查看当前 PN 摄像头不同固件版本的设备占比">
                          <div className="mt-4 h-[280px] overflow-y-auto pr-1">
                            <div style={{ height: `${Math.max(currentPnCameraFirmwareDistribution.length * 34, 240)}px` }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={currentPnCameraFirmwareDistribution} layout="vertical" margin={{ left: 4, right: 42, top: 4, bottom: 4 }}>
                                  <CartesianGrid stroke="#e4f0ff" horizontal={false} />
                                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} tickFormatter={(value: number) => `${value}%`} />
                                  <YAxis type="category" dataKey="name" width={72} tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                                  <Tooltip content={<ChartTooltip />} />
                                  <Bar dataKey="value" name="设备占比" radius={[0, 8, 8, 0]} barSize={16}>
                                    {currentPnCameraFirmwareDistribution.map((item, index) => (
                                      <Cell key={item.name} fill={item.fill ?? featurePalette[index % featurePalette.length]} />
                                    ))}
                                    <LabelList dataKey="value" position="right" formatter={(value: number) => `${value}%`} className="fill-slate-950 text-xs font-semibold" />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </Panel>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="grid gap-6 xl:grid-cols-3">
                        <CompactHorizontalBarPanel
                          title="摄像头五挡位信号强度分布比例"
                          description="参考设备报表样式，查看当前 PN 摄像头设备在一档到五档信号中的分布比例"
                          data={currentPnSignalStrength.map((item) => ({ name: item.name, value: item.value, fill: item.color, displayValue: item.displayValue }))}
                          valueLabel="信号强度占比"
                          width={56}
                          labelMaxLength={4}
                        />
                        <CompactHorizontalBarPanel
                          title="存储方式使用设备占比"
                          description="查看只用云存储、只用本地 SD 卡、双存储以及未开启存储的设备占比"
                          data={currentPnCameraStorageModeDistribution}
                          valueLabel="设备占比"
                          width={110}
                          labelMaxLength={10}
                        />
                        <CompactHorizontalBarPanel
                          title="摄像头绑定失败报错码统计"
                          description="按设备规格中的蓝牙配网失败场景，查看 E-Bind 系列错误码的报错次数占比"
                          data={currentPnCameraBindFailureShare}
                          valueLabel="报错次数占比"
                          width={96}
                          labelMaxLength={10}
                        />
                      </div>
                    </section>

                  </>
                ) : (
                  <>
                    <section className="space-y-4">
                      <CompactWordCloudPanel
                        title="中控设备命名词云统计"
                        description="查看客厅主箱、瘤尾繁育箱、恒湿喷淋箱、暖暖屋等高频中控设备命名的聚类热度"
                        items={currentPnCentralControlNamingWordCloudDistribution}
                      />
                    </section>

                    <section className="space-y-4">
                      <CompactMetricsPanel
                        title="中控设备功能使用概览"
                        description="聚焦温湿调节、喷淋、关联设备和定时计划等高频使用行为，帮助产品与研发判断真实使用深度"
                        items={currentPnCentralControlUsageCards}
                        columnsClassName="md:grid-cols-3 xl:grid-cols-5"
                      />
                    </section>

                    <section className="space-y-4">
                      <div className="grid gap-6 xl:grid-cols-4">
                        <CompactHorizontalBarPanel
                          title="目标温度设定分布"
                          description="查看中控设备目标温度主要落在哪些区间，以判断典型饲养环境温控偏好"
                          data={currentPnCentralControlTempTargetDistribution}
                          valueLabel="设备占比"
                          width={72}
                          labelMaxLength={8}
                        />
                        <CompactHorizontalBarPanel
                          title="目标湿度设定分布"
                          description="查看中控设备目标湿度区间分布，以判断湿控场景偏好和高湿需求"
                          data={currentPnCentralControlHumidityTargetDistribution}
                          valueLabel="设备占比"
                          width={72}
                          labelMaxLength={8}
                        />
                        <CompactPiePanel title="湿度调控模式占比" description="查看智能恒湿、定时喷淋和手动即时喷淋三种模式的使用占比" data={currentPnCentralControlHumidityModeDistribution} />
                        <CompactPiePanel title="弗格森区设置占比" description="查看 FZ1-FZ4 的照明区设置占比，用于评估不同物种对 UVA/UVB 的需求结构" data={currentPnCentralControlFergusonZoneDistribution} />
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="grid gap-6 xl:grid-cols-4">
                        <CompactHorizontalBarPanel
                          title="关键功能开启概览"
                          description="统计温控、湿控、照明、风扇净化等核心功能启用率，支持产品判断主打能力的真实渗透"
                          data={currentPnCentralControlFeatureOverviewDistribution}
                          valueLabel="设备占比"
                          width={122}
                          labelMaxLength={10}
                        />
                        <CompactHorizontalBarPanel
                          title="风扇档位分布"
                          description="查看中控设备常用风速档位分布，辅助评估通风策略与默认档位合理性"
                          data={currentPnCentralControlFanSpeedDistribution}
                          valueLabel="设备占比"
                          width={52}
                          labelMaxLength={4}
                        />
                        <CompactHorizontalBarPanel
                          title="LED 亮度梯度分布"
                          description="按亮度区间查看 LED 常用设置，辅助判断默认亮度和日光曲线策略"
                          data={currentPnCentralControlLedBrightnessDistribution}
                          valueLabel="设备占比"
                          width={68}
                          labelMaxLength={8}
                        />
                        <CompactPiePanel title="异常类型占比" description="查看温度异常、湿度异常、离线和传感器故障的占比结构，便于研发发现主要稳定性问题" data={currentPnCentralControlAnomalyDistribution} />
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="grid gap-6 xl:grid-cols-4">
                        <CompactHorizontalBarPanel
                          title="关联爬宠物种分布"
                          description="查看当前 PN 中控设备主要服务的爬宠物种结构，辅助产品理解物种场景差异"
                          data={currentPnCentralControlSpeciesDistribution}
                          valueLabel="设备占比"
                          width={96}
                          labelMaxLength={8}
                        />
                        <CompactHorizontalBarPanel
                          title="安装位置分布"
                          description="查看客厅生态箱、书房饲养架、检疫隔离区等典型使用位置分布"
                          data={currentPnCentralControlUsageLocationDistribution}
                          valueLabel="设备占比"
                          width={88}
                          labelMaxLength={8}
                        />
                        <CompactHorizontalBarPanel
                          title="关联风扇灯数量分布"
                          description="查看单台中控设备通常会关联多少台风扇灯，以判断联动管理深度"
                          data={currentPnCentralControlLinkedFanLampDistribution}
                          valueLabel="设备占比"
                          width={70}
                          labelMaxLength={8}
                        />
                        <CompactHorizontalBarPanel
                          title="关联爬宠数量分布"
                          description="查看单台中控设备通常关联多少只爬宠，以评估共享设备和多宠场景密度"
                          data={currentPnCentralControlLinkedPetDistribution}
                          valueLabel="设备占比"
                          width={70}
                          labelMaxLength={8}
                        />
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="grid gap-6 xl:grid-cols-2">
                        <CompactHorizontalBarPanel
                          title="设备所在地区分布"
                          description="查看中控设备主要集中在哪些国家和城市，帮助业务判断重点市场与售后支持区域"
                          data={currentPnCentralControlGeographicDistribution}
                          valueLabel="设备占比"
                          width={88}
                          labelMaxLength={10}
                        />
                        <CompactHorizontalBarPanel
                          title="各固件版本设备占比"
                          description="查看当前 PN 中控设备固件版本分布，便于研发判断升级覆盖度与存量包袱"
                          data={currentPnCentralControlFirmwareDistribution}
                          valueLabel="设备占比"
                          width={72}
                          labelMaxLength={8}
                        />
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="grid gap-6 xl:grid-cols-3">
                        <CompactHorizontalBarPanel
                          title="中控设备五挡位信号强度分布比例"
                          description="查看当前 PN 中控设备在一档到五档信号中的分布，帮助评估实际联网环境"
                          data={currentPnSignalStrength.map((item) => ({ name: item.name, value: item.value, fill: item.color, displayValue: item.displayValue }))}
                          valueLabel="信号强度占比"
                          width={56}
                          labelMaxLength={4}
                        />
                        <CompactHorizontalBarPanel
                          title="中控设备绑定失败报错码统计"
                          description="按蓝牙配网规格中的 E-Bind 系列错误码查看报错次数占比，便于排查主要绑定瓶颈"
                          data={currentPnCentralControlBindFailureShare}
                          valueLabel="报错次数占比"
                          width={96}
                          labelMaxLength={10}
                        />
                        <CompactHorizontalBarPanel
                          title="功能报错编号与报错次数占比"
                          description="查看温湿控、风扇、照明与网络相关错误码占比，辅助研发定位主要故障面"
                          data={currentPnErrorShare}
                          valueLabel="报错次数占比"
                          width={84}
                          labelMaxLength={9}
                        />
                      </div>
                    </section>
                  </>
                )}
              </div>
            )}
          </>
        ) : null}

        {activeTab === "pet_profiles" ? (
          <>
            <section className="space-y-4">
              <CompactMetricsPanel
                title="宠物档案核心概览"
                description="查看用户在 App 内保存 House、房间、宠物档案及混养比例等核心数据"
                items={petArchiveSummaryCards}
              />
            </section>

            <section className="space-y-4">
              <div className="grid gap-6 xl:grid-cols-2">
                <CompactHorizontalBarPanel
                  title="爬行宠物品种大类统计"
                  description="按守宫类、蜥蜴类、蛇类、两栖类、龟类等大类查看宠物档案占比"
                  data={reptilePetCategoryDistribution}
                  valueLabel="宠物档案占比"
                  width={84}
                  labelMaxLength={8}
                />
                <CompactHorizontalBarPanel
                  title="爬行宠物详细物种统计"
                  description="按瘤尾守宫、肥尾守宫、豹纹守宫、玉米蛇、猪鼻蛇、姥爷蛙等详细物种查看占比"
                  data={reptilePetSpeciesDistribution}
                  valueLabel="宠物档案占比"
                  width={104}
                  labelMaxLength={8}
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid gap-6 xl:grid-cols-2">
                <CompactWordCloudPanel
                  title="爬行宠物命名词云统计"
                  description="查看煤球、团子、奶酪、月光等高频爬宠名字的聚类热度"
                  items={reptilePetNamingWordCloudDistribution}
                />
                <CompactWordCloudPanel
                  title="宠物基因分布词云"
                  description="查看高黄、白化、雪花、无纹、条纹、薰衣草等基因形态在宠物档案中的分布热度"
                  items={reptilePetGeneWordCloudDistribution}
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid gap-6 xl:grid-cols-4">
                <CompactPiePanel title="宠物年龄统计" description="查看幼体、亚成体、成体三类年龄阶段占比" data={reptilePetLifeStageDistribution} />
                <CompactPiePanel title="宠物健康状况统计" description="查看健康、一般、异常三类健康状态占比" data={reptilePetHealthDistribution} />
                <CompactPiePanel title="宠物性别分布" description="查看雄性、雌性、未知三类性别分布" data={reptilePetGenderDistribution} />
                <CompactHorizontalBarPanel
                  title="宠物年龄分布"
                  description="按 0-6个月、7-12个月、1-2岁、3-5岁、5岁以上查看年龄梯度分布"
                  data={reptilePetAgeBucketDistribution}
                  valueLabel="宠物档案占比"
                  width={86}
                  labelMaxLength={8}
                />
              </div>
            </section>

            <section className="space-y-4">
              <CompactMetricsPanel
                title="爬宠繁殖行为概览"
                description="使用仿真业务数据查看年均交配、下蛋、孵化次数及有繁殖记录档案占比"
                items={petBreedingSummaryCards}
              />
            </section>
          </>
        ) : null}

        {activeTab === "ai" ? (
          <>
            <Panel
              title="AI服务报表"
              description="围绕本地 AI、云端 AI、积分消耗、反馈闭环与告警质量，输出适合产品、运营、研发和管理层查看的核心数据"
              action={pnFilterAction}
              overflowVisible
            >
              <div className="grid gap-4 xl:grid-cols-5">
                {aiSummaryCards.map((item) => (
                  <StatCard key={item.label} label={item.label} value={item.value} trend={item.trend} tone={item.tone} subtext={item.subtext} icon={<Bot className="h-5 w-5" />} />
                ))}
              </div>
            </Panel>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Panel title="AI 功能开启率 vs 使用率" description="每个 AI 功能同时展示开启率和使用率">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aiFeatureSummary}>
                      <CartesianGrid stroke="#e4f0ff" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={56} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="enableRate" name="开启率" fill="#5B8CFF" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="usageRate" name="使用率" fill="#30C7C9" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <CompactPiePanel title="AI 积分消耗结构" description="按规格口径查看云端行为识别、视频剪辑与对话助手的积分消耗占比" data={aiCreditConsumptionDistribution} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Panel title="AI 调用趋势" description="展示本地动物检测、云端行为识别与 AI 精彩剪辑的周调用趋势">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={aiUsageTrend}>
                      <CartesianGrid stroke="#e4f0ff" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="detect" name="本地动物检测" stroke="#5B8CFF" strokeWidth={3} dot={{ r: 4, fill: "#5B8CFF" }} />
                      <Line type="monotone" dataKey="behavior" name="云端行为识别" stroke="#30C7C9" strokeWidth={3} dot={{ r: 4, fill: "#30C7C9" }} />
                      <Line type="monotone" dataKey="clip" name="AI精彩剪辑" stroke="#FF8A5B" strokeWidth={3} dot={{ r: 4, fill: "#FF8A5B" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <CompactHorizontalBarPanel title="AI 行为识别类型分布" description="按规格定义的 7 类行为查看事件占比，帮助产品和运营判断热点场景" data={aiBehaviorTypeDistribution} valueLabel="事件占比" width={74} labelMaxLength={8} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <CompactMetricsPanel title="AI 反馈与数据回流闭环" description="重点观察点赞、点踩纠错、视频捐献和人工复核采纳表现" items={aiFeedbackLoopStats} columnsClassName="md:grid-cols-2" />
              <CompactMetricsPanel title="AI 事件质量与告警表现" description="帮助研发和运营同时判断异常告警质量、时延与场景覆盖度" items={aiAlertQualityStats} columnsClassName="md:grid-cols-2" />
            </div>
          </>
        ) : null}

        {activeTab === "subscription" ? (
          <>
            <Panel
              title="订阅服务报表"
              description="按 Professional 套餐、试用转化、续费、支付方式、云存储和 AI 权益使用，输出适合经营与产品决策的订阅报表"
              action={pnFilterAction}
              overflowVisible
            >
              <div className="grid gap-4 xl:grid-cols-5">
                {subscriptionSummaryCards.map((item) => (
                  <StatCard key={item.label} label={item.label} value={item.value} trend={item.trend} tone={item.tone} subtext={item.subtext} icon={<Crown className="h-5 w-5" />} />
                ))}
              </div>
            </Panel>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <Panel title="Professional 套餐购买结构" description="按单台/多台、月付/年付查看专业版套餐购买分布">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={subscriptionPackageMix} dataKey="value" nameKey="name" innerRadius={68} outerRadius={108} paddingAngle={3}>
                        {subscriptionPackageMix.map((item, index) => (
                          <Cell key={item.name} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="试用转化与续费趋势" description="同时观察 7 天试用启动、试用转正和续费数量变化">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={subscriptionTrend}>
                      <CartesianGrid stroke="#e4f0ff" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="trials" name="试用启动" stroke="#5B8CFF" strokeWidth={3} dot={{ r: 4, fill: "#5B8CFF" }} />
                      <Line type="monotone" dataKey="conversions" name="试用转正" stroke="#FF8A5B" strokeWidth={3} dot={{ r: 4, fill: "#FF8A5B" }} />
                      <Line type="monotone" dataKey="renewals" name="续费 household" stroke="#30C7C9" strokeWidth={3} dot={{ r: 4, fill: "#30C7C9" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel title="订阅收入趋势" description="按月份查看订阅收入变化">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subscriptionTrend}>
                      <CartesianGrid stroke="#e4f0ff" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7395bc", fontSize: 12 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="revenue" name="收入" fill="#9B7BFF" radius={[12, 12, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <CompactHorizontalBarPanel title="套餐续费率" description="按 Professional 四类套餐查看续费率差异，帮助定价和运营优化" data={subscriptionRenewalDistribution} valueLabel="续费率" width={74} labelMaxLength={8} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <Panel title="支付方式占比" description="按规格口径区分海外 Stripe 与中国区微信支付、支付宝">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentMethodDistribution} dataKey="value" nameKey="name" innerRadius={56} outerRadius={96} paddingAngle={3}>
                        {paymentMethodDistribution.map((item, index) => (
                          <Cell key={item.name} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="云存储使用情况" description="围绕 7 天 Event 滚动、本地优先回放与断点续传恢复表现查看云存储质量">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {cloudStorageUsageStats.map((item, index) => (
                    <div key={item.label} className="rounded-[22px] bg-[#f8fbff] px-4 py-4">
                      <div className="text-sm font-medium text-slate-900">{item.label}</div>
                      <div className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</div>
                      <div className="mt-1 text-xs text-[#7395bc]">{item.subtext}</div>
                      <PercentageBar value={55 + index * 8} index={index} />
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <CompactPiePanel title="订阅状态结构" description="查看生效中、试用中、已取消待到期、支付失败待恢复与已过期的分布" data={subscriptionStatusDistribution} />
              <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                <CompactHorizontalBarPanel title="订阅转化漏斗" description="观察试用启动、试用转正、首月续费与积分加购的经营漏斗表现" data={subscriptionFunnelDistribution} valueLabel="阶段转化率" width={72} labelMaxLength={8} />
                <CompactMetricsPanel title="订阅权益解锁与积分使用" description="查看云存储、设备端 AI、云端 AI 和当月 AI 积分消耗的真实使用深度" items={subscriptionEntitlementStats} columnsClassName="md:grid-cols-2" />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
