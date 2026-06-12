import { useMemo } from "react";
import { AlertTriangle, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

type InfraTone = "green" | "amber" | "rose";

type ServiceRecord = {
  id: string;
  name: string;
  status: "健康" | "关注" | "预警";
  capacityLabel: string;
  concurrency: number;
  autoScale: boolean;
  scaleDecision: "容量充足" | "建议扩容" | "扩容中";
  riskSummary: string;
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
    status: "健康",
    capacityLabel: "18 台 / 上限 28 台",
    concurrency: 4200,
    autoScale: true,
    scaleDecision: "容量充足",
    riskSummary: "核心接口稳定，当前不需要扩容",
  },
  {
    id: "mqtt",
    name: "MQTT服务",
    status: "关注",
    capacityLabel: "12 台 / 上限 20 台",
    concurrency: 16800,
    autoScale: true,
    scaleDecision: "建议扩容",
    riskSummary: "在线连接接近阈值，建议提前扩容 2 台",
  },
  {
    id: "rocketmq",
    name: "RocketMQ",
    status: "健康",
    capacityLabel: "6 台 / 上限 10 台",
    concurrency: 3400,
    autoScale: true,
    scaleDecision: "容量充足",
    riskSummary: "消息积压正常，当前不需要扩容",
  },
  {
    id: "mysql",
    name: "MySQL",
    status: "健康",
    capacityLabel: "主从 2 节点",
    concurrency: 1280,
    autoScale: true,
    scaleDecision: "容量充足",
    riskSummary: "数据库读写压力稳定，当前无扩容风险",
  },
  {
    id: "redis",
    name: "Redis",
    status: "健康",
    capacityLabel: "4 台 / 上限 8 台",
    concurrency: 6200,
    autoScale: true,
    scaleDecision: "容量充足",
    riskSummary: "缓存命中稳定，当前不需要扩容",
  },
  {
    id: "p2p",
    name: "P2P",
    status: "关注",
    capacityLabel: "8 台 / 上限 12 台",
    concurrency: 2860,
    autoScale: true,
    scaleDecision: "建议扩容",
    riskSummary: "弱网回源升高，建议预留带宽与节点",
  },
  {
    id: "ai-inference",
    name: "AI推理",
    status: "预警",
    capacityLabel: "14 台 / 上限 22 台",
    concurrency: 1180,
    autoScale: true,
    scaleDecision: "扩容中",
    riskSummary: "GPU 压力过高，已触发动态扩容",
  },
  {
    id: "video-editing",
    name: "视频剪辑",
    status: "关注",
    capacityLabel: "7 台 / 上限 12 台",
    concurrency: 420,
    autoScale: true,
    scaleDecision: "建议扩容",
    riskSummary: "任务等待偏长，建议补充转码节点",
  },
  {
    id: "storage",
    name: "存储服务",
    status: "健康",
    capacityLabel: "5 台网关 / 动态对象扩容",
    concurrency: 3560,
    autoScale: true,
    scaleDecision: "容量充足",
    riskSummary: "对象存储空间充足，当前无风险",
  },
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

export default function InfraOpsPage() {
  const visibleServices = useMemo(() => serviceRows, []);

  const summaryCards = useMemo(() => {
    const totalConcurrency = visibleServices.reduce((sum, item) => sum + item.concurrency, 0);
    const autoScaleCount = visibleServices.filter((item) => item.autoScale).length;
    const expansionCount = visibleServices.filter((item) => item.scaleDecision !== "容量充足").length;
    const riskCount = visibleServices.filter((item) => item.status !== "健康").length;

    return [
      { label: "服务总数", value: String(visibleServices.length), tone: "teal" as const, subtext: "当前后台依赖的核心服务数量" },
      { label: "总并发量", value: totalConcurrency.toLocaleString(), tone: "violet" as const, subtext: "各服务当前承载并发合计" },
      { label: "动态扩容服务", value: String(autoScaleCount), tone: "emerald" as const, subtext: "默认采用动态扩容的服务数量" },
      { label: "建议扩容服务", value: String(expansionCount), tone: "amber" as const, subtext: "包含建议扩容和扩容中的服务" },
      { label: "异常风险服务", value: String(riskCount), tone: "amber" as const, subtext: "需要运维优先关注的风险服务" },
    ];
  }, [visibleServices]);

  const priorityRisks = useMemo(() => alertRows.filter((item) => item.severity === "P1" || item.severity === "P2"), []);

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel title="运维管理总览" description="只看后台有多少服务、每个服务当前容量与并发、是否需要动态扩容，以及是否存在异常风险。">
          <div className="grid gap-4 xl:grid-cols-5">
            {summaryCards.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} tone={item.tone} subtext={item.subtext} />
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="服务容量与并发" description="逐个服务看当前容量、并发承载、是否需要动态扩容。">
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f5f9ff] text-[#6f8fb3]">
                    <tr>
                      <th className="px-4 py-3 font-medium">服务</th>
                      <th className="px-4 py-3 font-medium">容量</th>
                      <th className="px-4 py-3 font-medium">并发量</th>
                      <th className="px-4 py-3 font-medium">动态扩容</th>
                      <th className="px-4 py-3 font-medium">是否要扩容</th>
                      <th className="px-4 py-3 font-medium">风险状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleServices.map((item) => (
                      <tr key={item.id} className="border-t border-[#edf4ff]">
                        <td className="px-4 py-4 font-medium text-slate-950">{item.name}</td>
                        <td className="px-4 py-4 text-[#5f7ea5]">{item.capacityLabel}</td>
                        <td className="px-4 py-4 text-[#5f7ea5]">{item.concurrency.toLocaleString()}</td>
                        <td className="px-4 py-4">
                          <StatusBadge value={item.autoScale ? "动态扩容" : "固定容量"} tone={item.autoScale ? "blue" : "slate"} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge
                            value={item.scaleDecision}
                            tone={item.scaleDecision === "容量充足" ? "green" : item.scaleDecision === "建议扩容" ? "amber" : "blue"}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge value={item.status} tone={getTone(item.status)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-[24px] border border-[#d8ebff] bg-[#fbfdff] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Zap className="h-4 w-4 text-[#1B8BFA]" />
                  动态扩容说明
                </div>
                <p className="mt-2 text-sm leading-6 text-[#6f8fb3]">
                  当前服务默认采用动态扩容。容量不足时系统自动扩容，压力回落后自动缩容，运维页只负责提示哪些服务需要关注。
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="异常风险提示" description="只提示需要优先关注的风险服务和处理入口。">
            <div className="space-y-4">
              {priorityRisks.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge value={item.severity} tone={item.severity === "P1" ? "rose" : "amber"} />
                        <span className="font-medium text-slate-950">{item.service}</span>
                      </div>
                      <div className="mt-2 text-sm font-medium text-slate-950">{item.summary}</div>
                      <div className="mt-2 text-sm leading-6 text-[#6f8fb3]">{item.impact}</div>
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
        </div>
      </div>
    </AppShell>
  );
}
