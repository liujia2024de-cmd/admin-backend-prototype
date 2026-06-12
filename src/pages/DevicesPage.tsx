import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronDown, Download, ListChecks } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ExportTaskDrawer } from "@/components/export/ExportTaskDrawer";
import { Drawer } from "@/components/ui/Drawer";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/useToast";
import { devices, users } from "@/data/mock";
import { createAsyncExportTask, updateAsyncExportTaskStatus } from "@/lib/asyncExport";
import { isSuperAdmin, readSession } from "@/lib/auth";

type DeviceExportScope = "filtered" | "all";
const scopeLabelMap: Record<DeviceExportScope, string> = {
  filtered: "当前筛选结果",
  all: "全部数据",
};

export default function DevicesPage() {
  const { showToast } = useToast();
  const canExport = isSuperAdmin(readSession());
  const openNativeDatePicker = (input: HTMLInputElement) => {
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
  };

  const [pnKeyword, setPnKeyword] = useState("");
  const [snKeyword, setSnKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [taskListOpen, setTaskListOpen] = useState(false);
  const [batchExportOpen, setBatchExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<DeviceExportScope>("filtered");

  const deviceRows = useMemo(
    () =>
      devices.map((device) => {
        const boundUser =
          users.find((user) => user.phone === device.userPhone) ??
          users.find((user) => user.email === device.userEmail);

        return {
          ...device,
          boundUserId: boundUser?.id ?? "-",
          boundUserNickname: boundUser?.nickname ?? "-",
        };
      }),
    [],
  );
  const filteredDevices = useMemo(
    () =>
      deviceRows.filter((device) => {
        const matchesPn = !pnKeyword.trim() || device.pnCode.toLowerCase().includes(pnKeyword.trim().toLowerCase());
        const matchesSn = !snKeyword.trim() || device.snCode.toLowerCase().includes(snKeyword.trim().toLowerCase());
        const matchesStatus = !statusFilter || device.status === statusFilter;
        const boundDate = device.boundAt.slice(0, 10);
        const matchesStartDate = !startDate || boundDate >= startDate;
        const matchesEndDate = !endDate || boundDate <= endDate;

        return matchesPn && matchesSn && matchesStatus && matchesStartDate && matchesEndDate;
      }),
    [deviceRows, pnKeyword, snKeyword, statusFilter, startDate, endDate],
  );
  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedDevices = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * pageSize;
    return filteredDevices.slice(startIndex, startIndex + pageSize);
  }, [currentPageSafe, filteredDevices, pageSize]);
  const visiblePageNumbers = useMemo(() => {
    const start = Math.max(1, currentPageSafe - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);
    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [currentPageSafe, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pnKeyword, snKeyword, statusFilter, startDate, endDate, pageSize]);

  const getDevicesByScope = (scope: DeviceExportScope) => {
    if (scope === "filtered") return filteredDevices;
    return deviceRows;
  };

  const estimatedExportCount = getDevicesByScope(exportScope).length;

  const createTaskTime = () => new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-");

  const createExportTask = () => {
    const targetDevices = getDevicesByScope(exportScope);
    if (targetDevices.length === 0) {
      showToast({
        tone: "warning",
        title: "没有可导出的设备",
        description: "当前导出范围下没有设备数据，请调整筛选条件后再试。",
      });
      return;
    }

    const fileName = `设备SN列表-${Date.now()}.csv`;
    const taskId = `device-export-${Date.now()}`;
    const payload = ["设备SN", ...targetDevices.map((device) => device.snCode)].join("\n");
    createAsyncExportTask({
      id: taskId,
      module: "devices",
      moduleLabel: "设备管理",
      name: "设备 SN 导出任务",
      scopeLabel: scopeLabelMap[exportScope],
      count: targetDevices.length,
      createdAt: createTaskTime(),
      fileName,
      mimeType: "text/csv;charset=utf-8",
      payload,
    });

    setBatchExportOpen(false);
    setTaskListOpen(true);
    showToast({
      tone: "info",
      title: "导出任务已创建",
      description: `系统正在为 ${targetDevices.length} 条设备数据生成导出文件，可在当前页面的导出任务中查看进度。`,
    });

    window.setTimeout(() => {
      updateAsyncExportTaskStatus(taskId, "completed");
    }, 1200);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="设备列表"
          overflowVisible
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
                <button className="brand-primary-btn px-4 py-2.5" onClick={() => setBatchExportOpen(true)}>
                  <Download className="h-4 w-4" />
                  批量导出
                </button>
              </div>
            ) : null
          }
        >
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr_1fr_auto]">
            <input
              value={pnKeyword}
              onChange={(e) => setPnKeyword(e.target.value)}
              className="brand-input"
              placeholder="设备 PN 代号"
            />
            <input
              value={snKeyword}
              onChange={(e) => setSnKeyword(e.target.value)}
              className="brand-input"
              placeholder="设备 SN"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStatusOpen((prev) => !prev);
                  setDateOpen(false);
                }}
                className="brand-input flex w-full items-center justify-between text-left text-slate-700"
              >
                <span className={statusFilter ? "text-slate-700" : "text-[#8caed5]"}>
                  {statusFilter === "online" ? "在线" : statusFilter === "offline" ? "离线" : "全部状态"}
                </span>
                <ChevronDown className="h-4 w-4 text-[#79a4d4]" />
              </button>

              {statusOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] w-full rounded-2xl border border-[#d8ebff] bg-white p-2 shadow-[0_20px_40px_rgba(27,139,250,0.12)]">
                  {[
                    ["", "全部状态"],
                    ["online", "在线"],
                    ["offline", "离线"],
                  ].map(([value, label]) => (
                    <button
                      key={value || "all"}
                      type="button"
                      onClick={() => {
                        setStatusFilter(value);
                        setStatusOpen(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-sm transition ${
                        statusFilter === value ? "bg-[#eef6ff] text-[#1B8BFA]" : "text-slate-700 hover:bg-slate-50"
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
                  setStatusOpen(false);
                }}
                className="brand-input flex w-full items-center justify-between text-left text-slate-700"
              >
                <span className={startDate || endDate ? "text-slate-700" : "text-[#8caed5]"}>
                  {startDate || endDate ? `${startDate || "开始日期"} 至 ${endDate || "结束日期"}` : "绑定时间范围"}
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
              className="brand-primary-btn"
              onClick={() => {
                setDateOpen(false);
                setStatusOpen(false);
              }}
            >
              搜索设备
            </button>
          </div>
        </Panel>

        <Panel padded={false}>
          <div className="overflow-x-auto">
            <table className="brand-table min-w-full text-left text-sm">
              <thead>
                <tr>
                  {["设备PN代号", "设备SN", "绑定时间", "绑定的用户ID", "用户昵称", "在线/离线状态", "操作"].map((head) => (
                    <th key={head} className="px-5 py-4 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedDevices.map((device, index) => {
                  const to = device.type === "camera" ? `/devices/camera/${device.id}` : `/devices/central/${device.id}`;
                  return (
                    <tr key={device.id} className={index !== paginatedDevices.length - 1 ? "border-b border-[#eaf4ff]" : ""}>
                      <td className="px-5 py-4">{device.pnCode}</td>
                      <td className="px-5 py-4">{device.snCode}</td>
                      <td className="px-5 py-4">{device.boundAt}</td>
                      <td className="px-5 py-4">{device.boundUserId}</td>
                      <td className="px-5 py-4">{device.boundUserNickname}</td>
                      <td className="px-5 py-4">
                        <StatusBadge value={device.status === "online" ? "在线" : "离线"} tone={device.status === "online" ? "green" : "rose"} />
                      </td>
                      <td className="px-5 py-4">
                        <Link className="inline-flex rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1577d9]" to={to}>
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4 border-t border-[#e9f4ff] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#6784a8]">
              <span>
                共 <span className="font-semibold text-slate-900">{filteredDevices.length}</span> 条
              </span>
              <span>
                当前第 <span className="font-semibold text-slate-900">{currentPageSafe}</span> / {totalPages} 页
              </span>
              <span>
                本页显示 {Math.min(pageSize, paginatedDevices.length)} 条
              </span>
              <label className="inline-flex items-center gap-2">
                <span>每页</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-[#d8ebff] bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                >
                  {[10, 20, 50].map((size) => (
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
        </Panel>

        <ExportTaskDrawer
          open={taskListOpen}
          onClose={() => setTaskListOpen(false)}
          module="devices"
          title="设备管理导出任务"
          description="查看设备管理页创建的导出任务状态，文件生成完成后可直接在这里下载。"
        />

        <Drawer
          open={batchExportOpen}
          title="批量导出设备"
          description="按导出范围创建后台导出任务，适合大量设备数据导出。文件生成完成后可在当前页面的导出任务中下载。"
          onClose={() => setBatchExportOpen(false)}
          footer={
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-[#6f8fb3]">预计导出 {estimatedExportCount} 条设备数据</div>
              <div className="flex gap-3">
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
                  onClick={() => setBatchExportOpen(false)}
                >
                  取消
                </button>
                <button className="brand-primary-btn px-4 py-3" onClick={createExportTask}>
                  <Download className="h-4 w-4" />
                  创建导出任务
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            <section className="rounded-[24px] border border-[#d8ebff] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-5">
              <div className="text-sm font-medium text-slate-900">导出范围</div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  { value: "filtered", label: "导出当前筛选结果", count: filteredDevices.length },
                  { value: "all", label: "导出全部数据", count: deviceRows.length },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExportScope(option.value as DeviceExportScope)}
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
              <div className="text-sm font-medium text-slate-900">导出内容</div>
              <div className="mt-3 text-sm leading-6 text-[#6f8fb3]">当前导出内容为设备 SN 号列表，系统会按选定范围生成 CSV 文件。</div>
            </section>

            <section className="rounded-[24px] border border-[#d8ebff] bg-white p-5">
              <div className="text-sm font-medium text-slate-900">任务说明</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[#6f8fb3]">
                <div>1. 大数据量导出不再逐条勾选，直接按当前筛选结果或全部数据创建任务。</div>
                <div>2. 任务创建后会进入当前页面的导出任务列表，生成完成后可直接下载文件。</div>
                <div>3. 当前为原型演示，默认导出 CSV 文件。</div>
              </div>
            </section>
          </div>
        </Drawer>
      </div>
    </AppShell>
  );
}
