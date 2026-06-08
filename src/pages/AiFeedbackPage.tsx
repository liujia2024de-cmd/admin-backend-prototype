import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Download, ListChecks, MapPinned, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Drawer } from "@/components/ui/Drawer";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/useToast";
import { aiVideos, devices } from "@/data/mock";

type AiExportScope = "selected" | "filtered" | "all";

type AiExportTask = {
  id: string;
  name: string;
  scope: AiExportScope;
  scopeLabel: string;
  count: number;
  status: "processing" | "completed";
  createdAt: string;
  fileName: string;
};

const scopeLabelMap: Record<AiExportScope, string> = {
  selected: "选中项",
  filtered: "当前筛选结果",
  all: "全部数据",
};

export default function AiFeedbackPage() {
  const { showToast } = useToast();
  const openNativeDatePicker = (input: HTMLInputElement) => {
    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  };
  const [userKeyword, setUserKeyword] = useState("");
  const [deviceKeyword, setDeviceKeyword] = useState("");
  const [labelKeyword, setLabelKeyword] = useState("");
  const [reasonKeyword, setReasonKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [batchExportOpen, setBatchExportOpen] = useState(false);
  const [taskListOpen, setTaskListOpen] = useState(false);
  const [exportScope, setExportScope] = useState<AiExportScope>("selected");
  const [exportTasks, setExportTasks] = useState<AiExportTask[]>([]);

  const videoRows = useMemo(
    () =>
      aiVideos.map((video, index) => ({
        ...video,
        id: `video-${index + 1}`,
      })),
    [],
  );

  const deviceOptions = useMemo(() => [...new Set(videoRows.map((video) => video.sn))], [videoRows]);
  const behaviorLabelOptions = useMemo(() => [...new Set(videoRows.map((video) => video.behaviorLabel))], [videoRows]);
  const reasonOptions = useMemo(() => [...new Set(videoRows.map((video) => video.reason))], [videoRows]);
  const deviceLinkMap = useMemo(
    () =>
      new Map(
        devices.map((device) => [
          device.snCode,
          device.type === "camera" ? `/devices/camera/${device.id}` : `/devices/central/${device.id}`,
        ]),
      ),
    [],
  );

  const filteredVideos = useMemo(
    () =>
      videoRows.filter((video) => {
        const matchesUser = !userKeyword.trim() || video.userId.toLowerCase().includes(userKeyword.trim().toLowerCase());
        const matchesDevice = !deviceKeyword || video.sn === deviceKeyword;
        const matchesLabel = !labelKeyword || video.behaviorLabel === labelKeyword;
        const matchesReason = !reasonKeyword || video.reason === reasonKeyword;
        const donatedDate = video.donatedAt.slice(0, 10);
        const matchesStartDate = !startDate || donatedDate >= startDate;
        const matchesEndDate = !endDate || donatedDate <= endDate;
        return matchesUser && matchesDevice && matchesLabel && matchesReason && matchesStartDate && matchesEndDate;
      }),
    [deviceKeyword, endDate, labelKeyword, reasonKeyword, startDate, userKeyword, videoRows],
  );

  const selectedVideos = filteredVideos.filter((video) => selectedIds.includes(video.id));
  const previewVideo = filteredVideos.find((video) => video.id === previewId) ?? videoRows.find((video) => video.id === previewId) ?? null;

  const handleDownload = (videoId: string, fileName: string) => {
    const blob = new Blob(
      [
        `videoId=${videoId}\n`,
        `fileName=${fileName}\n`,
        `exportedAt=${new Date().toISOString()}\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    showToast({
      tone: "success",
      title: "视频下载已开始",
      description: `${fileName} 已生成本地下载文件。`,
    });
  };

  const getVideosByScope = (scope: AiExportScope) => {
    if (scope === "selected") return selectedVideos;
    if (scope === "filtered") return filteredVideos;
    return videoRows;
  };

  const createTaskTime = () => new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-");

  const createExportTask = () => {
    const targetVideos = getVideosByScope(exportScope);
    if (targetVideos.length === 0) {
      showToast({
        tone: "warning",
        title: "没有可导出的数据",
        description: "当前导出范围下没有视频数据，请调整筛选条件后再试。",
      });
      return;
    }

    const header = "视频ID,用户ID,设备SN,捐献原因,捐献备注,录像标签,物种标签,行为标签,时长";
    const rows = targetVideos.map(
      (video) =>
        `${video.id},${video.userId},${video.sn},${video.reason},${video.donationRemark},${video.recordingLabel},${video.speciesLabel},${video.behaviorLabel},${video.duration}`,
    );
    const fileName = `ai-feedback-export-${Date.now()}.csv`;
    const taskId = `ai-export-${Date.now()}`;

    setExportTasks((current) => [
      {
        id: taskId,
        name: "AI反馈视频导出任务",
        scope: exportScope,
        scopeLabel: scopeLabelMap[exportScope],
        count: targetVideos.length,
        status: "processing",
        createdAt: createTaskTime(),
        fileName,
      },
      ...current,
    ]);

    setBatchExportOpen(false);
    setTaskListOpen(true);
    showToast({
      tone: "info",
      title: "导出任务已创建",
      description: `系统正在为 ${targetVideos.length} 条视频记录生成导出文件。`,
    });

    window.setTimeout(() => {
      setExportTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: "completed" } : task)));
    }, 1200);
  };

  const downloadTextFile = (fileName: string, content: string, mimeType = "text/plain;charset=utf-8") => {
    const blob = new Blob([content], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const downloadExportTask = (task: AiExportTask) => {
    const targetVideos = getVideosByScope(task.scope);
    const header = "视频ID,用户ID,设备SN,捐献原因,捐献备注,录像标签,物种标签,行为标签,时长";
    const rows = targetVideos.map(
      (video) =>
        `${video.id},${video.userId},${video.sn},${video.reason},${video.donationRemark},${video.recordingLabel},${video.speciesLabel},${video.behaviorLabel},${video.duration}`,
    );
    const content = [header, ...rows].join("\n");
    downloadTextFile(task.fileName, content, "text/csv;charset=utf-8");
    showToast({
      tone: "success",
      title: "导出文件已开始下载",
      description: `${task.fileName} 已开始下载。`,
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="用户捐献视频列表"
          description="支持按用户、设备、行为标签和捐献原因筛选，并进行批量导出"
          action={
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#d8ebff] bg-white px-4 py-2.5 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA]"
                onClick={() => setTaskListOpen(true)}
              >
                <ListChecks className="h-4 w-4" />
                导出任务
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-2.5 text-sm font-medium text-white" onClick={() => setBatchExportOpen(true)}>
                <Download className="h-4 w-4" />
                批量导出
              </button>
            </div>
          }
        >
          <div className="grid gap-4 xl:grid-cols-6">
            <input value={userKeyword} onChange={(event) => setUserKeyword(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="用户ID" />
            <div className="relative">
              <select value={deviceKeyword} onChange={(event) => setDeviceKeyword(event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                <option value="">全部设备SN</option>
                {deviceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <select value={labelKeyword} onChange={(event) => setLabelKeyword(event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                <option value="">全部行为标签</option>
                {behaviorLabelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <select value={reasonKeyword} onChange={(event) => setReasonKeyword(event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                <option value="">全部捐献原因</option>
                {reasonOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDateOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 outline-none"
              >
                <span className={startDate || endDate ? "text-slate-700" : "text-[#8caed5]"}>
                  {startDate || endDate ? `${startDate || "开始日期"} 至 ${endDate || "结束日期"}` : "时间筛选"}
                </span>
                <span className="flex items-center gap-2 text-[#79a4d4]">
                  <CalendarDays className="h-4 w-4" />
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
              {dateOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] w-full rounded-2xl border border-[#d8ebff] bg-white p-4 shadow-[0_20px_40px_rgba(27,139,250,0.12)]">
                  <div className="space-y-3">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      onClick={(event) => openNativeDatePicker(event.currentTarget)}
                      onFocus={(event) => openNativeDatePicker(event.currentTarget)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      onClick={(event) => openNativeDatePicker(event.currentTarget)}
                      onFocus={(event) => openNativeDatePicker(event.currentTarget)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                    />
                    <button type="button" className="w-full rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" onClick={() => setDateOpen(false)}>
                      确定
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <button type="button" className="rounded-2xl bg-[#1B8BFA] px-5 py-3 text-sm font-medium text-white">
              查询
            </button>
          </div>
        </Panel>

        <Panel title="捐献视频明细" description="集中查看用户捐献视频并执行查看、下载操作" padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["视频信息", "设备SN", "捐献原因", "捐献备注", "录像标签", "物种标签", "行为标签", "操作"].map((head) => (
                    <th key={head} className="px-5 py-4 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVideos.map((video, index) => (
                  <tr key={video.id} className={index !== filteredVideos.length - 1 ? "border-b border-slate-100" : ""}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-20 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#0f766e)]" />
                        <div>
                          <div className="font-medium text-slate-900">{video.duration}</div>
                          <div className="text-xs text-slate-500">1920×1080 / 原始格式</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {deviceLinkMap.get(video.sn) ? (
                        <Link to={deviceLinkMap.get(video.sn)!} className="text-[#1B8BFA] underline-offset-2 transition hover:underline">
                          {video.sn}
                        </Link>
                      ) : (
                        video.sn
                      )}
                    </td>
                    <td className="px-5 py-4">{video.reason}</td>
                    <td className="max-w-[260px] px-5 py-4 text-slate-600">{video.donationRemark}</td>
                    <td className="px-5 py-4">{video.recordingLabel}</td>
                    <td className="px-5 py-4">{video.speciesLabel}</td>
                    <td className="px-5 py-4">{video.behaviorLabel}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-full border border-[#d8ebff] bg-white px-3 py-1.5 text-xs font-medium text-[#6287b0]" onClick={() => setPreviewId(video.id)}>
                          查看
                        </button>
                        <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white" onClick={() => handleDownload(video.id, `${video.userId}-${video.sn}.txt`)}>
                          下载
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Drawer open={taskListOpen} title="导出任务" description="这里集中查看AI反馈视频导出任务状态，文件生成完成后可直接下载。" onClose={() => setTaskListOpen(false)}>
          {exportTasks.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#d8ebff] bg-[#f8fbff] p-6 text-sm leading-6 text-[#6f8fb3]">
              暂无导出任务。你可以先点击"批量导出"创建任务，生成完成后再回到这里下载文件。
            </div>
          ) : (
            <div className="space-y-3">
              {exportTasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-4 rounded-[24px] border border-[#e9f4ff] bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-900">{task.name}</div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${task.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                        {task.status === "completed" ? "已完成" : "处理中"}
                      </span>
                    </div>
                    <div className="text-sm text-[#6f8fb3]">
                      导出范围：{task.scopeLabel} · 数据量：{task.count} 条 · 创建时间：{task.createdAt}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={task.status !== "completed"}
                    onClick={() => downloadExportTask(task)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8ebff] bg-white px-4 py-2.5 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Download className="h-4 w-4" />
                    {task.status === "completed" ? "下载文件" : "生成中"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Drawer>

        <Drawer open={batchExportOpen} title="批量导出AI反馈视频" description="按导出范围创建后台导出任务，适合大量数据批量导出。文件生成完成后可在任务列表查看并下载。" onClose={() => setBatchExportOpen(false)} footer={(
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-[#6f8fb3]">预计导出 {getVideosByScope(exportScope).length} 条视频数据</div>
            <div className="flex gap-3">
              <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700" onClick={() => setBatchExportOpen(false)}>
                取消
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" onClick={createExportTask}>
                <Download className="h-4 w-4" />
                创建导出任务
              </button>
            </div>
          </div>
        )}>
          <div className="space-y-5">
            <section className="rounded-[24px] border border-[#d8ebff] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-5">
              <div className="text-sm font-medium text-slate-900">导出范围</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  { value: "filtered", label: "导出当前筛选结果", count: filteredVideos.length },
                  { value: "all", label: "导出全部数据", count: videoRows.length },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExportScope(option.value as AiExportScope)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      exportScope === option.value
                        ? "border-[#1B8BFA] bg-[#eef6ff] text-[#1B8BFA]"
                        : "border-[#d8ebff] bg-white text-slate-700 hover:border-[#9fcbff]"
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="mt-1 text-xs text-inherit/80">预计 {option.count} 条</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-[#d8ebff] bg-white p-5">
              <div className="text-sm font-medium text-slate-900">任务说明</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[#6f8fb3]">
                <div>1. 大数据量导出不再逐条勾选，直接按当前筛选结果或全部数据创建任务。</div>
                <div>2. 任务创建后会进入导出队列，生成完成后可在右上角"导出任务"入口查看并下载文件。</div>
                <div>3. 当前为原型演示，默认导出 CSV 文件。</div>
              </div>
            </section>
          </div>
        </Drawer>
      </div>

      <Drawer open={previewVideo !== null} title="视频详情" description="查看用户捐献视频的基础信息与上下文。" onClose={() => setPreviewId(null)}>
        {previewVideo ? (
          <div className="space-y-6">
            <div className="h-56 rounded-[28px] bg-[linear-gradient(135deg,#0f172a,#0f766e)]" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">用户ID</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{previewVideo.userId}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">设备SN</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{previewVideo.sn}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">录像标签</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{previewVideo.recordingLabel}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">视频时长</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{previewVideo.duration}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">物种标签</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{previewVideo.speciesLabel}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">行为标签</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{previewVideo.behaviorLabel}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">捐献原因</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{previewVideo.reason}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">捐献备注</div>
                <div className="mt-2 text-sm font-medium leading-6 text-slate-900">{previewVideo.donationRemark}</div>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
