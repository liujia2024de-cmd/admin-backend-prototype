import { useMemo, useState } from "react";
import { Activity, BellRing, Cpu, Database, HardDrive, Network, Server, ShieldAlert, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

type InfraTab = "overview" | "scaling" | "traffic" | "alerts";
type InfraTone = "green" | "amber" | "rose";

type ServiceRecord = {
  id: string;
  name: string;
  role: string;
  region: "全球" | "亚太" | "北美" | "欧洲";
  status: "健康" | "关注" | "预警";
  instances: number;
  minInstances: number;
  maxInstances: number;
  cpuUsage: number;
  memoryUsage: number;
  qps: number;
  concurrency: number;
  p95Latency: number;
  availability: number;
  monthlyCost: number;
  costUnit: string;
  autoScale: boolean;
  requestShare: number;
  relatedModules: string[];
  scaleRule: string;
};

type ScalingEvent = {
  time: string;
  service: string;
  trigger: string;
  action: string;
  result: string;
};

type AlertRecord = {
  id: string;
  severity: "P1" | "P2" | "P3";
  service: string;
  summary: string;
  owner: string;
  impact: string;
  actionLabel: string;
  actionLink: string;
};

const serviceRows: ServiceRecord[] = [
  {
    id: "java-app",
    name: "Java应用服务",
    role: "承接 App API、账号、设备、订阅与后台核心业务",
    region: "全球",
    status: "健康",
    instances: 18,
    minInstances: 10,
    maxInstances: 28,
    cpuUsage: 56,
    memoryUsage: 62,
    qps: 1380,
    concurrency: 4200,
    p95Latency: 182,
    availability: 99.96,
    monthlyCost: 18200,
    costUnit: "元/月",
    autoScale: true,
    requestShare: 26,
    relatedModules: ["用户管理", "设备管理", "订阅服务", "售后服务"],
    scaleRule: "CPU>70% 或 P95>250ms 连续 5 分钟扩 2 台",
  },
  {
    id: "mqtt",
    name: "MQTT服务",
    role: "设备在线连接、消息上下行、状态订阅推送",
    region: "全球",
    status: "关注",
    instances: 12,
    minInstances: 8,
    maxInstances: 20,
    cpuUsage: 68,
    memoryUsage: 58,
    qps: 2260,
    concurrency: 16800,
    p95Latency: 94,
    availability: 99.91,
    monthlyCost: 12600,
    costUnit: "元/月",
    autoScale: true,
    requestShare: 18,
    relatedModules: ["设备管理", "中控控制", "摄像头连接", "OTA通知"],
    scaleRule: "连接数>1.6万 或 消息堆积>5万 时扩 2 台",
  },
  {
    id: "rocketmq",
    name: "RocketMQ",
    role: "事件流转、异步消息、AI任务与视频任务解耦",
    region: "全球",
    status: "健康",
    instances: 6,
    minInstances: 4,
    maxInstances: 10,
    cpuUsage: 49,
    memoryUsage: 54,
    qps: 860,
    concurrency: 3400,
    p95Latency: 77,
    availability: 99.95,
    monthlyCost: 8300,
    costUnit: "元/月",
    autoScale: true,
    requestShare: 9,
    relatedModules: ["AI推理", "视频剪辑", "消息通知", "OTA管理"],
    scaleRule: "积压消息>2万 或 消费延迟>40s 自动扩 1 台",
  },
  {
    id: "mysql",
    name: "MySQL",
    role: "账号、设备、订单、配置与运营活动核心数据",
    region: "亚太",
    status: "健康",
    instances: 2,
    minInstances: 2,
    maxInstances: 4,
    cpuUsage: 51,
    memoryUsage: 66,
    qps: 720,
    concurrency: 1280,
    p95Latency: 35,
    availability: 99.99,
    monthlyCost: 9400,
    costUnit: "元/月",
    autoScale: false,
    requestShare: 7,
    relatedModules: ["用户管理", "设备管理", "订阅服务", "运营管理"],
    scaleRule: "人工评估扩容，按读写分离与存储增长计划执行",
  },
  {
    id: "redis",
    name: "Redis",
    role: "热点缓存、会话、排行榜、设备状态与限流",
    region: "亚太",
    status: "健康",
    instances: 4,
    minInstances: 2,
    maxInstances: 8,
    cpuUsage: 42,
    memoryUsage: 64,
    qps: 5100,
    concurrency: 6200,
    p95Latency: 8,
    availability: 99.98,
    monthlyCost: 5200,
    costUnit: "元/月",
    autoScale: true,
    requestShare: 11,
    relatedModules: ["登录态", "设备状态", "大数据报表", "AI结果缓存"],
    scaleRule: "内存>75% 或 热 key 抖动异常时自动升配",
  },
  {
    id: "p2p",
    name: "P2P",
    role: "直播连通、弱网穿透与回源中继链路",
    region: "全球",
    status: "关注",
    instances: 8,
    minInstances: 6,
    maxInstances: 12,
    cpuUsage: 63,
    memoryUsage: 57,
    qps: 540,
    concurrency: 2860,
    p95Latency: 214,
    availability: 99.72,
    monthlyCost: 11800,
    costUnit: "元/月",
    autoScale: true,
    requestShare: 6,
    relatedModules: ["Live View", "历史回放", "云端回看"],
    scaleRule: "中继比例>28% 或 首帧时延>300ms 扩 2 台",
  },
  {
    id: "ai-inference",
    name: "AI推理",
    role: "云端行为识别、AI事件分析、知识问答推理",
    region: "北美",
    status: "预警",
    instances: 14,
    minInstances: 10,
    maxInstances: 22,
    cpuUsage: 78,
    memoryUsage: 71,
    qps: 320,
    concurrency: 1180,
    p95Latency: 1180,
    availability: 99.31,
    monthlyCost: 46800,
    costUnit: "元/月",
    autoScale: true,
    requestShare: 8,
    relatedModules: ["AI服务报表", "行为识别", "知识问答"],
    scaleRule: "GPU利用率>78% 或 队列>800 时扩 2 台 GPU 节点",
  },
  {
    id: "video-editing",
    name: "视频剪辑",
    role: "精彩剪辑、导出转码、素材拼接与压缩",
    region: "北美",
    status: "关注",
    instances: 7,
    minInstances: 4,
    maxInstances: 12,
    cpuUsage: 69,
    memoryUsage: 74,
    qps: 96,
    concurrency: 420,
    p95Latency: 2860,
    availability: 99.48,
    monthlyCost: 21200,
    costUnit: "元/月",
    autoScale: true,
    requestShare: 4,
    relatedModules: ["AI精彩剪辑", "视频捐献", "内容导出"],
    scaleRule: "转码队列>300 或 平均等待>6分钟 时扩 1 台",
  },
  {
    id: "storage",
    name: "存储服务",
    role: "云存录像、日志、OTA包、知识库与素材对象存储",
    region: "全球",
    status: "健康",
    instances: 5,
    minInstances: 3,
    maxInstances: 8,
    cpuUsage: 38,
    memoryUsage: 45,
    qps: 910,
    concurrency: 3560,
    p95Latency: 132,
    availability: 99.97,
    monthlyCost: 28600,
    costUnit: "元/月",
    autoScale: true,
    requestShare: 11,
    relatedModules: ["云存储", "日志管理", "OTA管理", "CMS"],
    scaleRule: "带宽>78% 或 日增量>1.2TB 时自动扩容桶与网关",
  },
];

const scalingEvents: ScalingEvent[] = [
  { time: "06-06 14:20", service: "AI推理", trigger: "GPU利用率 81%，队列 920", action: "10 -> 12 台", result: "成功，推理等待下降 23%" },
  { time: "06-06 10:05", service: "MQTT服务", trigger: "在线连接峰值 1.72 万", action: "10 -> 12 台", result: "成功，连接建链恢复正常" },
  { time: "06-05 21:40", service: "视频剪辑", trigger: "平均排队时长 7.1 分钟", action: "6 -> 7 台", result: "成功，转码积压下降 18%" },
  { time: "06-05 03:10", service: "Redis", trigger: "热 key 命中异常波动", action: "升配内存 64G -> 96G", result: "成功，命中率恢复至 97.8%" },
];

const alertRows: AlertRecord[] = [
  {
    id: "alert-1",
    severity: "P1",
    service: "AI推理",
    summary: "北美集群推理延迟连续 12 分钟超过 1s",
    owner: "AI平台组",
    impact: "AI行为识别结果延迟，影响洞察页和告警时效",
    actionLabel: "查看 AI 日志",
    actionLink: "/logs?source=backend&preset=ai_inference",
  },
  {
    id: "alert-2",
    severity: "P2",
    service: "P2P",
    summary: "欧洲中继比例升至 31%，弱网回源增加",
    owner: "音视频组",
    impact: "Live View 首帧时延提升，跨区回源成本上升",
    actionLabel: "查看网络日志",
    actionLink: "/logs?source=third_party_other&preset=p2p",
  },
  {
    id: "alert-3",
    severity: "P2",
    service: "视频剪辑",
    summary: "剪辑任务等待时长高于 6 分钟阈值",
    owner: "媒体处理组",
    impact: "AI精彩剪辑生成变慢，用户点击播放率可能下滑",
    actionLabel: "查看转码日志",
    actionLink: "/logs?source=backend&preset=video_editing",
  },
  {
    id: "alert-4",
    severity: "P3",
    service: "存储服务",
    summary: "美国区域日志桶日增量接近 1TB",
    owner: "基础平台组",
    impact: "若持续增长，将推高日志与云存账单",
    actionLabel: "查看存储日志",
    actionLink: "/logs?source=third_party_oss&preset=storage_cost",
  },
];

function getTone(status: ServiceRecord["status"]): InfraTone {
  if (status === "健康") return "green";
  if (status === "关注") return "amber";
  return "rose";
}

function getAlertTone(severity: AlertRecord["severity"]) {
  if (severity === "P1") return "rose" as const;
  if (severity === "P2") return "amber" as const;
  return "blue" as const;
}

function ProgressBar({ value, colorClass = "bg-[#1B8BFA]" }: { value: number; colorClass?: string }) {
  return (
    <div className="h-2 rounded-full bg-[#eaf4ff]">
      <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export default function InfraOpsPage() {
  const [activeTab, setActiveTab] = useState<InfraTab>("overview");
  const [timeRange, setTimeRange] = useState("近7天");

  const visibleServices = useMemo(() => serviceRows, []);

  const summaryCards = useMemo(() => {
    const totalCost = visibleServices.reduce((sum, item) => sum + item.monthlyCost, 0);
    const totalQps = visibleServices.reduce((sum, item) => sum + item.qps, 0);
    const totalConcurrency = visibleServices.reduce((sum, item) => sum + item.concurrency, 0);
    const autoScaleCount = visibleServices.filter((item) => item.autoScale).length;
    const activeAlertCount = alertRows.filter((item) =>
      visibleServices.some((service) => service.name === item.service),
    ).length;

    return [
      { label: "总请求吞吐", value: `${totalQps.toLocaleString()} QPS`, tone: "teal" as const, subtext: `${timeRange} 核心服务平均吞吐` },
      { label: "峰值并发", value: totalConcurrency.toLocaleString(), tone: "violet" as const, subtext: "跨服务合计在线并发与任务并发" },
      { label: "月度基础成本", value: `¥${totalCost.toLocaleString()}`, tone: "amber" as const, subtext: "含计算、缓存、消息、对象存储与 GPU 费用" },
      { label: "自动扩容服务", value: String(autoScaleCount), tone: "emerald" as const, subtext: `当前 ${visibleServices.length} 个服务中的弹性服务数` },
      { label: "活跃告警", value: String(activeAlertCount), tone: "teal" as const, subtext: "待跟进的资源、延迟与成本告警" },
    ];
  }, [timeRange, visibleServices]);

  const costRanking = useMemo(
    () =>
      [...visibleServices]
        .sort((a, b) => b.monthlyCost - a.monthlyCost)
        .map((item) => ({
          ...item,
          costShare: Number(((item.monthlyCost / visibleServices.reduce((sum, current) => sum + current.monthlyCost, 0)) * 100).toFixed(1)),
        })),
    [visibleServices],
  );

  const capacityRanking = useMemo(
    () =>
      [...visibleServices]
        .map((item) => ({
          ...item,
          saturation: Math.max(item.cpuUsage, item.memoryUsage),
        }))
        .sort((a, b) => b.saturation - a.saturation),
    [visibleServices],
  );

  const alertCountBySeverity = useMemo(
    () => ({
      p1: alertRows.filter((item) => item.severity === "P1").length,
      p2: alertRows.filter((item) => item.severity === "P2").length,
      p3: alertRows.filter((item) => item.severity === "P3").length,
    }),
    [],
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="运维管理总览"
          description="围绕 Java 应用、MQTT、消息中间件、数据库、AI 与存储服务，统一看资源利用率、扩容策略、请求并发和月度成本。"
          action={
            <div className="flex flex-wrap items-center gap-2">
              {["近24小时", "近7天", "近30天"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTimeRange(item)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    timeRange === item
                      ? "bg-[#1B8BFA] text-white shadow-[0_10px_24px_rgba(27,139,250,0.18)]"
                      : "border border-[#d7e9ff] bg-white text-[#5e86b4]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          }
        >
          <div className="grid gap-4 xl:grid-cols-5">
            {summaryCards.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} tone={item.tone} subtext={item.subtext} />
            ))}
          </div>
        </Panel>

        <div className="rounded-[28px] border border-[#d8ebff] bg-white px-5 py-4 shadow-[0_18px_44px_rgba(27,139,250,0.08)]">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "overview", label: "服务总览" },
              { key: "scaling", label: "容量与扩缩容" },
              { key: "traffic", label: "请求并发与成本" },
              { key: "alerts", label: "告警中心" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as InfraTab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "bg-[#1B8BFA] text-white shadow-[0_10px_24px_rgba(27,139,250,0.18)]"
                    : "border border-[#d7e9ff] bg-white text-[#5e86b4]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
              <Panel title="服务部署清单" description="按你当前业务定义展示核心基础设施服务，便于评估是否需要扩容或拆分。">
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleServices.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-[#e5f1ff] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-slate-950">{item.name}</div>
                          <p className="mt-1 text-sm leading-6 text-[#6f8fb3]">{item.role}</p>
                        </div>
                        <StatusBadge value={item.status} tone={getTone(item.status)} />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-xs text-[#7395bc]">实例数</div>
                          <div className="mt-1 font-semibold text-slate-950">
                            {item.instances} / {item.maxInstances}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-xs text-[#7395bc]">平均 QPS</div>
                          <div className="mt-1 font-semibold text-slate-950">{item.qps.toLocaleString()}</div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-xs text-[#7395bc]">P95 延迟</div>
                          <div className="mt-1 font-semibold text-slate-950">{item.p95Latency} ms</div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-xs text-[#7395bc]">月成本</div>
                          <div className="mt-1 font-semibold text-slate-950">¥{item.monthlyCost.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.relatedModules.map((module) => (
                          <span key={module} className="rounded-full bg-white px-3 py-1 text-xs text-[#5e86b4] ring-1 ring-[#dcecff]">
                            {module}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="容量压力排序" description="优先关注 CPU、内存或队列最接近上限的服务，便于提前扩容。">
                <div className="space-y-4">
                  {capacityRanking.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-950">{item.name}</div>
                          <div className="mt-1 text-xs text-[#7395bc]">{item.scaleRule}</div>
                        </div>
                        <StatusBadge value={`${item.saturation}%`} tone={item.saturation >= 75 ? "rose" : item.saturation >= 60 ? "amber" : "green"} />
                      </div>
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-[#7395bc]">
                            <span>CPU</span>
                            <span>{item.cpuUsage}%</span>
                          </div>
                          <ProgressBar value={item.cpuUsage} colorClass={item.cpuUsage >= 75 ? "bg-[#ef4444]" : item.cpuUsage >= 60 ? "bg-[#f59e0b]" : "bg-[#1B8BFA]"} />
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-[#7395bc]">
                            <span>内存</span>
                            <span>{item.memoryUsage}%</span>
                          </div>
                          <ProgressBar value={item.memoryUsage} colorClass={item.memoryUsage >= 75 ? "bg-[#ef4444]" : item.memoryUsage >= 60 ? "bg-[#f59e0b]" : "bg-[#1B8BFA]"} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel title="业务承载与依赖关系" description="把基础设施和现有业务规格对应起来，方便老板、产品和研发一起看。">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f5f9ff] text-[#6f8fb3]">
                    <tr>
                      <th className="px-4 py-3 font-medium">服务</th>
                      <th className="px-4 py-3 font-medium">主要承载</th>
                      <th className="px-4 py-3 font-medium">区域</th>
                      <th className="px-4 py-3 font-medium">SLA</th>
                      <th className="px-4 py-3 font-medium">扩容方式</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleServices.map((item) => (
                      <tr key={item.id} className="border-t border-[#edf4ff]">
                        <td className="px-4 py-4 font-medium text-slate-950">{item.name}</td>
                        <td className="px-4 py-4 text-[#5f7ea5]">{item.relatedModules.join(" / ")}</td>
                        <td className="px-4 py-4 text-[#5f7ea5]">{item.region}</td>
                        <td className="px-4 py-4 text-[#5f7ea5]">{item.availability}%</td>
                        <td className="px-4 py-4 text-[#5f7ea5]">{item.autoScale ? "自动扩容" : "人工规划"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        ) : null}

        {activeTab === "scaling" ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
              <Panel title="自动扩容策略" description="统一管理实例上下限、触发阈值与冷却窗口，帮助判断是否需要继续自动扩容。">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#f5f9ff] text-[#6f8fb3]">
                      <tr>
                        <th className="px-4 py-3 font-medium">服务</th>
                        <th className="px-4 py-3 font-medium">当前实例</th>
                        <th className="px-4 py-3 font-medium">上下限</th>
                        <th className="px-4 py-3 font-medium">策略</th>
                        <th className="px-4 py-3 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleServices.map((item) => (
                        <tr key={item.id} className="border-t border-[#edf4ff]">
                          <td className="px-4 py-4 font-medium text-slate-950">{item.name}</td>
                          <td className="px-4 py-4 text-[#5f7ea5]">{item.instances} 台</td>
                          <td className="px-4 py-4 text-[#5f7ea5]">
                            {item.minInstances} - {item.maxInstances} 台
                          </td>
                          <td className="px-4 py-4 text-[#5f7ea5]">{item.scaleRule}</td>
                          <td className="px-4 py-4">
                            <StatusBadge value={item.autoScale ? "自动扩容中" : "人工评估"} tone={item.autoScale ? "blue" : "slate"} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="扩容建议" description="根据当前资源占用和业务形态，给出本周的容量动作建议。">
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-[#ffe0d4] bg-[#fff8f5] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#c2410c]">
                      <ShieldAlert className="h-4 w-4" />
                      AI推理建议优先扩容
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#8a5c44]">当前 GPU 集群已接近 80% 利用率，建议先把最大实例上限从 22 调到 28，再观察 AI 事件高峰时段。</p>
                  </div>
                  <div className="rounded-[24px] border border-[#d8ebff] bg-[#fbfdff] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#1B8BFA]">
                      <Zap className="h-4 w-4" />
                      MQTT 建议预留节假日峰值
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#6f8fb3]">设备活跃峰值会拉高在线连接数，建议把最小实例从 8 台抬到 10 台，减少冷启动扩容波动。</p>
                  </div>
                  <div className="rounded-[24px] border border-[#dff5ea] bg-[#f6fffb] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#0f8a5f]">
                      <HardDrive className="h-4 w-4" />
                      存储服务建议做成本分层
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#4b7a68]">云存录像、日志和 OTA 包可继续拆分冷热分层，先控成本，再做带宽扩容。</p>
                  </div>
                </div>
              </Panel>
            </div>

            <Panel title="近 7 天扩缩容记录" description="追踪自动扩容是否真的解决了高峰问题，并沉淀策略复盘。">
              <div className="space-y-3">
                {scalingEvents.map((item) => (
                  <div key={`${item.time}-${item.service}`} className="grid gap-3 rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4 md:grid-cols-[120px_1fr_180px_180px]">
                    <div className="text-sm font-medium text-slate-950">{item.time}</div>
                    <div>
                      <div className="font-medium text-slate-950">{item.service}</div>
                      <div className="mt-1 text-sm text-[#6f8fb3]">{item.trigger}</div>
                    </div>
                    <div className="text-sm text-[#5f7ea5]">{item.action}</div>
                    <div className="text-sm text-[#5f7ea5]">{item.result}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </>
        ) : null}

        {activeTab === "traffic" ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
              <Panel title="请求与并发分布" description="定位谁最吃请求、谁最吃并发、谁最容易成为瓶颈。">
                <div className="space-y-4">
                  {visibleServices
                    .slice()
                    .sort((a, b) => b.qps - a.qps)
                    .map((item) => (
                      <div key={item.id} className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-medium text-slate-950">{item.name}</div>
                            <div className="mt-1 text-xs text-[#7395bc]">
                              请求占比 {item.requestShare}% · 峰值并发 {item.concurrency.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-slate-950">{item.qps.toLocaleString()} QPS</div>
                        </div>
                        <div className="mt-3">
                          <ProgressBar value={item.requestShare * 3} />
                        </div>
                      </div>
                    ))}
                </div>
              </Panel>

              <Panel title="服务成本结构" description="帮助老板和研发一起判断是否该优先优化 AI、视频、存储这几类高成本服务。">
                <div className="space-y-4">
                  {costRanking.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-950">{item.name}</div>
                          <div className="mt-1 text-xs text-[#7395bc]">成本占比 {item.costShare}%</div>
                        </div>
                        <div className="text-sm font-medium text-slate-950">¥{item.monthlyCost.toLocaleString()}</div>
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={item.costShare} colorClass="bg-[#3b82f6]" />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel title="服务经营视角表" description="把请求、并发、可用性和成本放在同一张表里，适合周会和月度复盘。">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f5f9ff] text-[#6f8fb3]">
                    <tr>
                      <th className="px-4 py-3 font-medium">服务</th>
                      <th className="px-4 py-3 font-medium">QPS</th>
                      <th className="px-4 py-3 font-medium">并发</th>
                      <th className="px-4 py-3 font-medium">P95</th>
                      <th className="px-4 py-3 font-medium">可用性</th>
                      <th className="px-4 py-3 font-medium">月成本</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleServices.map((item) => (
                      <tr key={item.id} className="border-t border-[#edf4ff]">
                        <td className="px-4 py-4 font-medium text-slate-950">{item.name}</td>
                        <td className="px-4 py-4 text-[#5f7ea5]">{item.qps.toLocaleString()}</td>
                        <td className="px-4 py-4 text-[#5f7ea5]">{item.concurrency.toLocaleString()}</td>
                        <td className="px-4 py-4 text-[#5f7ea5]">{item.p95Latency} ms</td>
                        <td className="px-4 py-4 text-[#5f7ea5]">{item.availability}%</td>
                        <td className="px-4 py-4 text-[#5f7ea5]">¥{item.monthlyCost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        ) : null}

        {activeTab === "alerts" ? (
          <>
            <div className="grid gap-4 xl:grid-cols-4">
              <StatCard label="P1 告警" value={`${alertCountBySeverity.p1}`} tone="violet" subtext="需立即处理的服务风险" />
              <StatCard label="P2 告警" value={`${alertCountBySeverity.p2}`} tone="amber" subtext="建议在当天内完成处理" />
              <StatCard label="P3 告警" value={`${alertCountBySeverity.p3}`} tone="teal" subtext="持续观察的容量或成本信号" />
              <StatCard label="SLA 达标服务" value={`${visibleServices.filter((item) => item.availability >= 99.9).length}`} tone="emerald" subtext="可用性达到 99.9% 以上的服务数" />
            </div>

            <Panel title="告警中心" description="把活跃告警、负责人、业务影响和跳转动作聚合到一起。">
              <div className="space-y-4">
                {alertRows.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge value={item.severity} tone={getAlertTone(item.severity)} />
                          <span className="font-medium text-slate-950">{item.service}</span>
                        </div>
                        <div className="mt-2 text-sm font-medium text-slate-950">{item.summary}</div>
                        <div className="mt-2 text-sm leading-6 text-[#6f8fb3]">{item.impact}</div>
                        <div className="mt-2 text-xs text-[#7395bc]">负责人：{item.owner}</div>
                      </div>
                      <Link
                        to={item.actionLink}
                        className="inline-flex items-center rounded-full bg-[#1B8BFA] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_24px_rgba(27,139,250,0.16)] transition hover:bg-[#1577d9]"
                      >
                        {item.actionLabel}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Panel title="服务 SLA 快照" description="方便一眼看出哪类服务正在偏离目标值。">
                <div className="space-y-4">
                  {visibleServices
                    .slice()
                    .sort((a, b) => a.availability - b.availability)
                    .map((item) => (
                      <div key={item.id} className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="font-medium text-slate-950">{item.name}</span>
                          <span className="text-sm text-[#5f7ea5]">{item.availability}%</span>
                        </div>
                        <ProgressBar value={item.availability} colorClass={item.availability < 99.5 ? "bg-[#ef4444]" : item.availability < 99.9 ? "bg-[#f59e0b]" : "bg-[#1B8BFA]"} />
                      </div>
                    ))}
                </div>
              </Panel>

              <Panel title="值班建议" description="适合原型展示时给老板和同事看运维团队如何闭环处理问题。">
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Server className="h-4 w-4 text-[#1B8BFA]" />
                      高峰期前检查 AI 与剪辑节点
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#6f8fb3]">晚间是 AI 识别和视频剪辑高峰，建议在 18:00 前确认 GPU 与转码节点上限是否充足。</p>
                  </div>
                  <div className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Database className="h-4 w-4 text-[#1B8BFA]" />
                      每周复盘数据库与存储成本
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#6f8fb3]">MySQL、对象存储和日志桶是固定大项，建议每周做一次增长复盘，决定是否开启冷热分层或归档。</p>
                  </div>
                  <div className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <BellRing className="h-4 w-4 text-[#1B8BFA]" />
                      告警需要挂到业务影响
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#6f8fb3]">不要只看机器指标，P2P、AI、云存问题都要明确会影响哪个用户功能和哪个收入模块。</p>
                  </div>
                </div>
              </Panel>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
