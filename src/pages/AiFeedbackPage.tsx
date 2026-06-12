import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Download, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ExportTaskDrawer } from "@/components/export/ExportTaskDrawer";
import { Drawer } from "@/components/ui/Drawer";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/useToast";
import { aiVideos, devices } from "@/data/mock";
import { createAsyncExportTask, updateAsyncExportTaskStatus } from "@/lib/asyncExport";
import { isSuperAdmin, readSession } from "@/lib/auth";

type AiExportScope = "filtered" | "all";
type ReviewStatus = "待审核" | "已通过" | "已拒绝";
const REJECT_REASON_MAX_LENGTH = 100;
const rejectReasonTemplates = ["画面模糊或遮挡严重", "行为标签与视频内容不符", "非目标物种", "有效行为画面不足", "重复捐献", "其他"];

const scopeLabelMap: Record<AiExportScope, string> = {
  filtered: "当前筛选结果",
  all: "全部数据",
};

export default function AiFeedbackPage() {
  const { showToast } = useToast();
  const canExport = isSuperAdmin(readSession());
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
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [taskListOpen, setTaskListOpen] = useState(false);
  const [batchExportOpen, setBatchExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<AiExportScope>("filtered");
  const [statusKeyword, setStatusKeyword] = useState<ReviewStatus | "">("");
  const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [videoRows, setVideoRows] = useState(
    aiVideos.map((video, index) => ({
      ...video,
      id: `video-${index + 1}`,
      reviewedBy: video.status === "待审核" ? "-" : "today_admin",
      reviewedAt: video.status === "待审核" ? "-" : index === 1 ? "2026-06-01 09:10" : "2026-06-03 10:22",
      rejectReason: video.status === "已拒绝" ? "视频清晰度不足，且行为标签与画面主体不一致。" : "",
    })),
  );

  const deviceOptions = useMemo(() => [...new Set(videoRows.map((video) => video.sn))], [videoRows]);
  const behaviorLabelOptions = useMemo(() => [...new Set(videoRows.map((video) => video.behaviorLabel))], [videoRows]);
  const reasonOptions = useMemo(() => [...new Set(videoRows.map((video) => video.reason))], [videoRows]);
  const reviewStatusOptions: ReviewStatus[] = ["待审核", "已通过", "已拒绝"];
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
        const matchesStatus = !statusKeyword || video.status === statusKeyword;
        const donatedDate = video.donatedAt.slice(0, 10);
        const matchesStartDate = !startDate || donatedDate >= startDate;
        const matchesEndDate = !endDate || donatedDate <= endDate;
        return matchesUser && matchesDevice && matchesLabel && matchesReason && matchesStatus && matchesStartDate && matchesEndDate;
      }),
    [deviceKeyword, endDate, labelKeyword, reasonKeyword, startDate, statusKeyword, userKeyword, videoRows],
  );

  const previewVideo = filteredVideos.find((video) => video.id === previewId) ?? videoRows.find((video) => video.id === previewId) ?? null;
  const reviewTarget = videoRows.find((video) => video.id === reviewTargetId) ?? null;

  const getVideosByScope = (scope: AiExportScope) => {
    const approvedVideos = scope === "filtered" ? filteredVideos : videoRows;
    return approvedVideos.filter((video) => video.status === "已通过");
  };
  const buildExportContent = (targetVideos: typeof videoRows) => {
    const header = "视频ID,用户ID,设备SN,捐献原因,捐献备注,录像标签,物种标签,行为标签,时长";
    const rows = targetVideos.map(
      (video) =>
        `${video.id},${video.userId},${video.sn},${video.reason},${video.donationRemark},${video.recordingLabel},${video.speciesLabel},${video.behaviorLabel},${video.duration}`,
    );
    return [header, ...rows].join("\n");
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

    const fileName = `ai-feedback-export-${Date.now()}.csv`;
    const taskId = `ai-export-${Date.now()}`;
    createAsyncExportTask({
      id: taskId,
      module: "ai-feedback",
      moduleLabel: "视频捐献",
      name: "AI反馈视频导出任务",
      scopeLabel: scopeLabelMap[exportScope],
      count: targetVideos.length,
      createdAt: createTaskTime(),
      fileName,
      mimeType: "text/csv;charset=utf-8",
      payload: buildExportContent(targetVideos),
    });

    setBatchExportOpen(false);
    setTaskListOpen(true);
    showToast({
      tone: "info",
      title: "导出任务已创建",
      description: `系统正在为 ${targetVideos.length} 条已审核通过的视频记录生成导出文件，可在当前页面的导出任务中查看进度。`,
    });

    window.setTimeout(() => {
      updateAsyncExportTaskStatus(taskId, "completed");
    }, 1200);
  };
  const confirmReview = () => {
    if (!reviewTarget || !reviewAction) return;
    if (reviewAction === "reject" && !rejectReason.trim()) {
      showToast({
        tone: "warning",
        title: "请填写拒绝原因",
        description: "拒绝视频捐献审核时，需要记录具体原因。",
      });
      return;
    }

    const reviewedAt = createTaskTime();
    setVideoRows((current) =>
      current.map((video) =>
        video.id === reviewTarget.id
          ? {
              ...video,
              status: reviewAction === "approve" ? "已通过" : "已拒绝",
              reviewedBy: "today_admin",
              reviewedAt,
              rejectReason: reviewAction === "reject" ? rejectReason.trim() : "",
            }
          : video,
      ),
    );
    showToast({
      tone: reviewAction === "approve" ? "success" : "info",
      title: reviewAction === "approve" ? "视频已审核通过" : "视频已审核拒绝",
      description: reviewAction === "approve" ? "该视频已标记为训练可用范围业务状态，并进入批量导出范围。" : "系统已记录拒绝原因，该视频不会进入导出范围。",
    });
    setReviewAction(null);
    setReviewTargetId(null);
    setRejectReason("");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="用户捐献视频列表"
          description="支持按用户、设备、行为标签和捐献原因筛选，并进行批量导出"
          action={
            canExport ? (
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
            ) : null
          }
        >
          <div className="grid gap-4 xl:grid-cols-7">
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
              <select value={statusKeyword} onChange={(event) => setStatusKeyword(event.target.value as ReviewStatus | "")} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                <option value="">全部审核状态</option>
                {reviewStatusOptions.map((option) => (
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

        <ExportTaskDrawer
          open={taskListOpen}
          onClose={() => setTaskListOpen(false)}
          module="ai-feedback"
          title="视频捐献导出任务"
          description="查看视频捐献页创建的导出任务状态，文件生成完成后可直接在这里下载。"
        />

        <Panel title="捐献视频明细" description="集中查看用户捐献视频并执行查看、审核操作" padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["视频信息", "设备SN", "审核状态", "捐献原因", "捐献备注", "录像标签", "物种标签", "行为标签", "操作"].map((head) => (
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
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          video.status === "已通过"
                            ? "bg-emerald-50 text-emerald-600"
                            : video.status === "已拒绝"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {video.status}
                      </span>
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
                        {video.status !== "已通过" ? (
                          <button
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600"
                            onClick={() => {
                              setReviewTargetId(video.id);
                              setReviewAction("approve");
                              setRejectReason("");
                            }}
                          >
                            审核通过
                          </button>
                        ) : null}
                        {video.status !== "已拒绝" ? (
                          <button
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600"
                            onClick={() => {
                              setReviewTargetId(video.id);
                              setReviewAction("reject");
                              setRejectReason(video.rejectReason);
                            }}
                          >
                            审核拒绝
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Drawer open={batchExportOpen} title="批量导出AI反馈视频" description="按导出范围创建后台导出任务，适合大量数据批量导出。文件生成完成后可在当前页面的导出任务中查看并下载。" onClose={() => setBatchExportOpen(false)} footer={(
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-[#6f8fb3]">预计导出 {getVideosByScope(exportScope).length} 条已审核通过的视频数据</div>
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
                <div>2. 仅审核状态为“已通过”的视频会进入当前页面的导出任务列表。</div>
                <div>3. 任务创建后可在当前页面统一查看任务状态并下载文件。</div>
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
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">审核状态</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{previewVideo.status}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">审核人</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{previewVideo.reviewedBy}</div>
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
              <div className="md:col-span-2">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">审核结果说明</div>
                <div className="mt-2 text-sm font-medium leading-6 text-slate-900">
                  {previewVideo.status === "已拒绝" ? previewVideo.rejectReason : previewVideo.reviewedAt}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={reviewTarget !== null && reviewAction !== null}
        title={reviewAction === "approve" ? "审核通过视频捐献" : "审核拒绝视频捐献"}
        description="确认审核结果后，会同步更新视频捐献列表状态，并影响是否可进入批量导出范围。"
        onClose={() => {
          setReviewTargetId(null);
          setReviewAction(null);
          setRejectReason("");
        }}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
              onClick={() => {
                setReviewTargetId(null);
                setReviewAction(null);
                setRejectReason("");
              }}
            >
              取消
            </button>
            <button
              type="button"
              className={`rounded-2xl px-4 py-3 text-sm font-medium text-white ${reviewAction === "approve" ? "bg-emerald-500" : "bg-rose-500"}`}
              onClick={confirmReview}
            >
              {reviewAction === "approve" ? "确认通过" : "确认拒绝"}
            </button>
          </div>
        }
      >
        {reviewTarget ? (
          <div className="space-y-5">
            <section className="rounded-[24px] border border-[#d8ebff] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-5">
              <div className="text-sm font-medium text-slate-900">视频基本信息</div>
              <div className="mt-3 space-y-2 text-sm text-[#6f8fb3]">
                <div>用户ID：{reviewTarget.userId}</div>
                <div>设备SN：{reviewTarget.sn}</div>
                <div>行为标签：{reviewTarget.behaviorLabel}</div>
                <div>当前审核状态：{reviewTarget.status}</div>
              </div>
            </section>
            {reviewAction === "reject" ? (
              <section className="rounded-[24px] border border-[#d8ebff] bg-white p-5">
                <div className="text-sm font-medium text-slate-900">拒绝原因</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rejectReasonTemplates.map((template) => (
                    <button
                      key={template}
                      type="button"
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        rejectReason === template
                          ? "border-rose-300 bg-rose-50 text-rose-600"
                          : "border-[#d8ebff] bg-white text-[#6287b0] hover:border-rose-200 hover:text-rose-500"
                      }`}
                      onClick={() => setRejectReason(template)}
                    >
                      {template}
                    </button>
                  ))}
                </div>
                <textarea
                  value={rejectReason}
                  maxLength={REJECT_REASON_MAX_LENGTH}
                  onChange={(event) => setRejectReason(event.target.value.slice(0, REJECT_REASON_MAX_LENGTH))}
                  className="mt-3 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  placeholder="请填写审核拒绝原因，支持快捷模板和自定义补充说明。"
                />
                <div className="mt-2 text-right text-xs text-[#8caed5]">
                  {rejectReason.length}/{REJECT_REASON_MAX_LENGTH}
                </div>
              </section>
            ) : (
              <section className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-700">
                审核通过后，该视频会被标记为“训练可用范围”业务状态，并允许超级管理员在当前页面执行批量导出。
              </section>
            )}
          </div>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
