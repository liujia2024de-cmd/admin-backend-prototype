import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Download, Filter, ListChecks } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/useToast";
import { devices, logFiles, users } from "@/data/mock";

type LogDownloadScope = "filtered" | "all";
type LogDownloadTask = {
  id: string;
  name: string;
  scope: LogDownloadScope;
  scopeLabel: string;
  count: number;
  status: "processing" | "completed";
  createdAt: string;
  fileName: string;
  payload: string;
};

const scopeLabelMap: Record<LogDownloadScope, string> = {
  filtered: "当前筛选结果",
  all: "全部数据",
};

export default function LogsPage() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const openNativeDatePicker = (input: HTMLInputElement) => {
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
  };

  const [keyword, setKeyword] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [presetFilter, setPresetFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [batchDownloadOpen, setBatchDownloadOpen] = useState(false);
  const [taskListOpen, setTaskListOpen] = useState(false);
  const [downloadScope, setDownloadScope] = useState<LogDownloadScope>("filtered");
  const [downloadTasks, setDownloadTasks] = useState<LogDownloadTask[]>([]);

  const logRows = useMemo(
    () =>
      logFiles.map((item) => {
        const matchedDevice = devices.find((device) => device.snCode === item.deviceSn);
        const matchedUser = users.find((user) => user.id === item.userId);

        return {
          ...item,
          deviceName: matchedDevice?.deviceName ?? "-",
          userName: matchedUser?.nickname ?? "-",
        };
      }),
    [],
  );

  const filteredLogs = useMemo(
    () =>
      logRows.filter((item) => {
        const text = keyword.trim().toLowerCase();
        const matchesKeyword =
          !text ||
          item.deviceSn.toLowerCase().includes(text) ||
          item.deviceName.toLowerCase().includes(text) ||
          item.userId.toLowerCase().includes(text) ||
          item.userName.toLowerCase().includes(text) ||
          item.fileName.toLowerCase().includes(text);
        const matchesSource = !sourceFilter || item.source === sourceFilter;
        const matchesPreset =
          !presetFilter ||
          (presetFilter === "embedded_upgrade_failure" &&
            item.source === "device" &&
            /(upgrade|ota)/i.test(item.fileName) &&
            /failure/i.test(item.fileName));
        const uploadDate = item.uploadTime.slice(0, 10);
        const matchesStartDate = !startDate || uploadDate >= startDate;
        const matchesEndDate = !endDate || uploadDate <= endDate;

        return matchesKeyword && matchesSource && matchesPreset && matchesStartDate && matchesEndDate;
      }),
    [logRows, keyword, sourceFilter, presetFilter, startDate, endDate],
  );
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [currentPageSafe, filteredLogs, pageSize]);
  const visiblePageNumbers = useMemo(() => {
    const start = Math.max(1, currentPageSafe - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);
    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [currentPageSafe, totalPages]);

  useEffect(() => {
    setKeyword(searchParams.get("keyword") ?? "");
    setSourceFilter(searchParams.get("source") ?? "");
    setStartDate(searchParams.get("startDate") ?? "");
    setEndDate(searchParams.get("endDate") ?? "");
    setPresetFilter(searchParams.get("preset") ?? "");
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, sourceFilter, startDate, endDate, presetFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getLogsByScope = (scope: LogDownloadScope) => {
    if (scope === "filtered") return filteredLogs;
    return logRows;
  };

  const estimatedDownloadCount = getLogsByScope(downloadScope).length;

  const downloadFile = (fileName: string, content: string, mimeType = "text/plain;charset=utf-8") => {
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

  const createTaskTime = () => new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-");

  const handleDownload = (fileName: string, logId: string) => {
    downloadFile(
      fileName,
      [`# ${fileName}`, `logId=${logId}`, `exportedAt=${new Date().toISOString()}`, "status=downloaded-from-admin-prototype"].join("\n"),
    );
    showToast({
      tone: "success",
      title: "日志文件已开始下载",
      description: `${fileName} 已生成本地下载文件。`,
    });
  };

  const createDownloadTask = () => {
    const targetLogs = getLogsByScope(downloadScope);
    if (targetLogs.length === 0) {
      showToast({
        tone: "warning",
        title: "没有可下载的日志",
        description: "当前下载范围下没有日志文件，请调整筛选条件后再试。",
      });
      return;
    }

    const taskId = `log-download-${Date.now()}`;
    const fileName = `日志文件包-${Date.now()}.zip`;
    const payload = [
      "日志打包任务清单",
      `范围=${scopeLabelMap[downloadScope]}`,
      `数量=${targetLogs.length}`,
      ...targetLogs.map((item) => `${item.fileName} | ${item.deviceSn} | ${item.uploadTime}`),
    ].join("\n");

    setDownloadTasks((current) => [
      {
        id: taskId,
        name: "日志批量下载任务",
        scope: downloadScope,
        scopeLabel: scopeLabelMap[downloadScope],
        count: targetLogs.length,
        status: "processing",
        createdAt: createTaskTime(),
        fileName,
        payload,
      },
      ...current,
    ]);

    setBatchDownloadOpen(false);
    setTaskListOpen(true);
    showToast({
      tone: "info",
      title: "下载任务已创建",
      description: `系统正在为 ${targetLogs.length} 条日志生成打包文件。`,
    });

    window.setTimeout(() => {
      setDownloadTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: "completed" } : task)));
    }, 1400);
  };

  const downloadTaskPackage = (task: LogDownloadTask) => {
    downloadFile(task.fileName, task.payload, "application/zip");
    showToast({
      tone: "success",
      title: "日志打包文件已开始下载",
      description: `${task.fileName} 已开始下载。`,
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="日志列表"
          overflowVisible
          action={
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#d8ebff] bg-white px-4 py-2.5 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA]"
                onClick={() => setTaskListOpen(true)}
              >
                <ListChecks className="h-4 w-4" />
                下载任务
              </button>
              <button className="brand-primary-btn px-4 py-2.5" onClick={() => setBatchDownloadOpen(true)}>
                <Download className="h-4 w-4" />
                批量下载
              </button>
            </div>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr_1fr_auto]">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="brand-input"
              placeholder="设备 SN / 设备名称 / 用户 ID / 用户名称"
            />

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setSourceOpen((prev) => !prev);
                  setDateOpen(false);
                }}
                className="brand-input flex w-full items-center justify-between text-left text-slate-700"
              >
                <span className={sourceFilter ? "text-slate-700" : "text-[#8caed5]"}>
                  {sourceFilter === "app" ? "App" : sourceFilter === "device" ? "嵌入式" : sourceFilter === "third_party_oss" ? "OSS" : "日志来源"}
                </span>
                <ChevronDown className="h-4 w-4 text-[#79a4d4]" />
              </button>

              {sourceOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] w-full rounded-2xl border border-[#d8ebff] bg-white p-2 shadow-[0_20px_40px_rgba(27,139,250,0.12)]">
                  {[
                    ["", "全部来源"],
                    ["app", "App"],
                    ["device", "嵌入式"],
                    ["third_party_oss", "OSS"],
                  ].map(([value, label]) => (
                    <button
                      key={value || "all"}
                      type="button"
                      onClick={() => {
                        setSourceFilter(value);
                        setSourceOpen(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-sm transition ${
                        sourceFilter === value ? "bg-[#eef6ff] text-[#1B8BFA]" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setDateOpen((prev) => !prev);
                  setSourceOpen(false);
                }}
                className="brand-input flex w-full items-center justify-between text-left text-slate-700"
              >
                <span className={startDate || endDate ? "text-slate-700" : "text-[#8caed5]"}>
                  {startDate || endDate ? `${startDate || "开始日期"} 至 ${endDate || "结束日期"}` : "上传时间范围"}
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
                      onChange={(e) => setStartDate(e.target.value)}
                      onClick={(e) => openNativeDatePicker(e.currentTarget)}
                      onFocus={(e) => openNativeDatePicker(e.currentTarget)}
                      className="brand-input"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      onClick={(e) => openNativeDatePicker(e.currentTarget)}
                      onFocus={(e) => openNativeDatePicker(e.currentTarget)}
                      className="brand-input"
                    />
                    <button type="button" className="brand-primary-btn w-full" onClick={() => setDateOpen(false)}>
                      确定
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B8BFA] px-5 py-3 text-sm font-medium text-white"
              onClick={() => {
                setSourceOpen(false);
                setDateOpen(false);
              }}
            >
              <Filter className="h-4 w-4" />
              查询
            </button>
          </div>
        </Panel>

        <Panel padded={false}>
          {filteredLogs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="没有符合条件的日志"
                description="可以尝试清空设备、用户或时间筛选条件，查看全部日志文件。"
                action={
                  <button
                    className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white"
                    onClick={() => {
                      setKeyword("");
                      setSourceFilter("");
                      setStartDate("");
                      setEndDate("");
                      setPresetFilter("");
                    }}
                  >
                    重置筛选
                  </button>
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="brand-table min-w-full text-left text-sm">
                  <thead>
                    <tr>
                      {["日志ID", "设备SN", "设备名称", "用户ID", "用户名称", "来源", "大小", "上传时间", "操作"].map((head) => (
                        <th key={head} className="px-5 py-4 font-medium">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((item, index) => (
                      <tr key={item.id} className={index !== paginatedLogs.length - 1 ? "border-b border-[#eaf4ff]" : ""}>
                        <td className="px-5 py-4 font-medium text-slate-900">{item.id}</td>
                        <td className="px-5 py-4">{item.deviceSn}</td>
                        <td className="px-5 py-4">{item.deviceName}</td>
                        <td className="px-5 py-4">{item.userId}</td>
                        <td className="px-5 py-4">{item.userName}</td>
                        <td className="px-5 py-4">{item.source === "app" ? "App" : item.source === "device" ? "嵌入式" : "OSS"}</td>
                        <td className="px-5 py-4">{item.fileSize}</td>
                        <td className="px-5 py-4">{item.uploadTime}</td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white"
                            onClick={() => handleDownload(item.fileName, item.id)}
                          >
                            下载文件
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-4 border-t border-[#e9f4ff] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6784a8]">
                  <span>
                    共 <span className="font-semibold text-slate-900">{filteredLogs.length}</span> 条
                  </span>
                  <span>
                    当前第 <span className="font-semibold text-slate-900">{currentPageSafe}</span> / {totalPages} 页
                  </span>
                  <span>
                    本页显示 {Math.min(pageSize, paginatedLogs.length)} 条
                  </span>
                  <label className="inline-flex items-center gap-2">
                    <span>每页</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="rounded-xl border border-[#d8ebff] bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                    >
                      {[8, 10, 20].map((size) => (
                        <option key={size} value={size}>
                          {size} 条
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPageSafe === 1}
                    onClick={() => setCurrentPage(1)}
                    className="rounded-xl border border-[#d8ebff] bg-white px-3 py-2 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    首页
                  </button>
                  <button
                    type="button"
                    disabled={currentPageSafe === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="rounded-xl border border-[#d8ebff] bg-white px-3 py-2 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    上一页
                  </button>

                  {visiblePageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-10 rounded-xl px-3 py-2 text-sm font-medium transition ${
                        page === currentPageSafe
                          ? "bg-[#1B8BFA] text-white shadow-[0_10px_24px_rgba(27,139,250,0.2)]"
                          : "border border-[#d8ebff] bg-white text-[#6287b0] hover:border-[#1B8BFA] hover:text-[#1B8BFA]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPageSafe === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className="rounded-xl border border-[#d8ebff] bg-white px-3 py-2 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    下一页
                  </button>
                  <button
                    type="button"
                    disabled={currentPageSafe === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="rounded-xl border border-[#d8ebff] bg-white px-3 py-2 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    末页
                  </button>
                </div>
              </div>
            </>
          )}
        </Panel>

        <Drawer
          open={taskListOpen}
          title="下载任务"
          description="这里集中查看日志打包任务状态，结果包生成完成后可直接下载。"
          onClose={() => setTaskListOpen(false)}
        >
          {downloadTasks.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#d8ebff] bg-[#f8fbff] p-6 text-sm leading-6 text-[#6f8fb3]">
              暂无下载任务。你可以先点击“批量下载”创建打包任务，完成后再回到这里下载结果包。
            </div>
          ) : (
            <div className="space-y-3">
              {downloadTasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-4 rounded-[24px] border border-[#e9f4ff] bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-slate-900">{task.name}</div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          task.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {task.status === "completed" ? "已完成" : "打包中"}
                      </span>
                    </div>
                    <div className="text-sm text-[#6f8fb3]">
                      下载范围：{task.scopeLabel} · 文件数：{task.count} 条 · 创建时间：{task.createdAt}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={task.status !== "completed"}
                    onClick={() => downloadTaskPackage(task)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8ebff] bg-white px-4 py-2.5 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Download className="h-4 w-4" />
                    {task.status === "completed" ? "下载结果包" : "打包中"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Drawer>

        <Drawer
          open={batchDownloadOpen}
          title="批量下载日志"
          description="按下载范围创建后台打包任务，适合大量日志文件批量下载。打包完成后可在任务列表下载结果包。"
          onClose={() => setBatchDownloadOpen(false)}
          footer={
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-[#6f8fb3]">预计下载 {estimatedDownloadCount} 条日志文件</div>
              <div className="flex gap-3">
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
                  onClick={() => setBatchDownloadOpen(false)}
                >
                  取消
                </button>
                <button className="brand-primary-btn px-4 py-3" onClick={createDownloadTask}>
                  <Download className="h-4 w-4" />
                  创建下载任务
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            <section className="rounded-[24px] border border-[#d8ebff] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-5">
              <div className="text-sm font-medium text-slate-900">下载范围</div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  { value: "filtered", label: "下载当前筛选结果", count: filteredLogs.length },
                  { value: "all", label: "下载全部数据", count: logRows.length },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDownloadScope(option.value as LogDownloadScope)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      downloadScope === option.value
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
              <div className="text-sm font-medium text-slate-900">打包方式</div>
              <div className="mt-3 text-sm leading-6 text-[#6f8fb3]">系统会将所选范围内的日志文件打包为一个下载结果包，适合海量日志批量下载。</div>
            </section>

            <section className="rounded-[24px] border border-[#d8ebff] bg-white p-5">
              <div className="text-sm font-medium text-slate-900">任务说明</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[#6f8fb3]">
                <div>1. 大数据量日志不再逐条勾选下载，直接按当前筛选结果或全部数据创建打包任务。</div>
                <div>2. 任务创建后会进入打包队列，完成后可在右上角“下载任务”入口查看并下载结果包。</div>
                <div>3. 当前为原型演示，结果包使用可下载文件形式模拟。</div>
              </div>
            </section>
          </div>
        </Drawer>
      </div>
    </AppShell>
  );
}
