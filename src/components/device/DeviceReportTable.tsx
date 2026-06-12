import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, RefreshCcw } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/useToast";

type DeviceReportRow = {
  id: string;
  time: string;
  type: string;
  field: string;
  value: string;
  source: string;
};

type DeviceReportTableProps = {
  title: string;
  description: string;
  rows: DeviceReportRow[];
};

const formatNow = () =>
  new Date().toLocaleString("zh-CN", {
    hour12: false,
  });

export function DeviceReportTable({ title, description, rows }: DeviceReportTableProps) {
  const { showToast } = useToast();
  const [typeFilter, setTypeFilter] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [lastRefreshAt, setLastRefreshAt] = useState(formatNow());

  const typeOptions = useMemo(() => [...new Set(rows.map((row) => row.type))], [rows]);
  const fieldOptions = useMemo(() => [...new Set(rows.map((row) => row.field))], [rows]);
  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const rowDate = row.time.slice(0, 10);
        const matchesType = !typeFilter || row.type === typeFilter;
        const matchesField = !fieldFilter || row.field === fieldFilter;
        const matchesStartDate = !startDate || rowDate >= startDate;
        const matchesEndDate = !endDate || rowDate <= endDate;
        return matchesType && matchesField && matchesStartDate && matchesEndDate;
      }),
    [rows, typeFilter, fieldFilter, startDate, endDate],
  );
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [currentPageSafe, filteredRows, pageSize]);
  const visiblePageNumbers = useMemo(() => {
    const start = Math.max(1, currentPageSafe - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);
    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [currentPageSafe, totalPages]);

  const openNativeDatePicker = (input: HTMLInputElement) => {
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
  };

  return (
    <Panel
      title={title}
      description={description}
      padded={false}
      action={
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-[#8aa6c5]">最近刷新：{lastRefreshAt}</div>
          <button
            type="button"
            onClick={() => {
              const time = formatNow();
              setLastRefreshAt(time);
              showToast({
                tone: "success",
                title: "数据已刷新",
                description: `${title} 已刷新到最新原型数据。`,
              });
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#d8ebff] bg-white px-4 py-2.5 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA]"
          >
            <RefreshCcw className="h-4 w-4" />
            手动刷新
          </button>
        </div>
      }
    >
      <div className="grid gap-4 border-b border-[#e9f4ff] px-5 py-4 xl:grid-cols-[1fr_1fr_1fr_auto]">
        <div className="relative">
          <button
            type="button"
            onClick={() => setDateOpen((prev) => !prev)}
            className="brand-input flex w-full items-center justify-between text-left text-slate-700"
          >
            <span className={startDate || endDate ? "text-slate-700" : "text-[#8caed5]"}>
              {startDate || endDate ? `${startDate || "开始日期"} 至 ${endDate || "结束日期"}` : "上报时间范围"}
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
                  className="brand-input"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  onClick={(event) => openNativeDatePicker(event.currentTarget)}
                  onFocus={(event) => openNativeDatePicker(event.currentTarget)}
                  className="brand-input"
                />
                <button type="button" className="brand-primary-btn w-full" onClick={() => setDateOpen(false)}>
                  确定
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="brand-input w-full appearance-none pr-10 text-slate-700">
            <option value="">全部上报类型</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#79a4d4]" />
        </div>

        <div className="relative">
          <select value={fieldFilter} onChange={(event) => setFieldFilter(event.target.value)} className="brand-input w-full appearance-none pr-10 text-slate-700">
            <option value="">全部上报项目</option>
            {fieldOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#79a4d4]" />
        </div>

        <button
          type="button"
          onClick={() => {
            setStartDate("");
            setEndDate("");
            setTypeFilter("");
            setFieldFilter("");
            setCurrentPage(1);
          }}
          className="rounded-2xl border border-[#d8ebff] bg-white px-4 py-3 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA]"
        >
          清空筛选
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="brand-table min-w-full text-left text-sm">
          <thead>
            <tr>
              {["序号", "上报时间", "上报类型", "上报项目", "上报值", "触发来源"].map((head) => (
                <th key={head} className="px-5 py-4 font-medium">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
              <tr key={row.id} className={index !== paginatedRows.length - 1 ? "border-b border-[#eaf4ff]" : ""}>
                <td className="px-5 py-4 text-slate-500">{row.id}</td>
                <td className="px-5 py-4 text-slate-700">{row.time}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      row.type === "用户操作后自动上报" ? "bg-[#eef6ff] text-[#1B8BFA]" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {row.type}
                  </span>
                </td>
                <td className="px-5 py-4 font-medium text-slate-900">{row.field}</td>
                <td className="px-5 py-4 text-slate-700">{row.value}</td>
                <td className="px-5 py-4 text-slate-500">{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-[#e9f4ff] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#6784a8]">
          <span>
            共 <span className="font-semibold text-slate-900">{filteredRows.length}</span> 条
          </span>
          <span>
            当前第 <span className="font-semibold text-slate-900">{currentPageSafe}</span> / {totalPages} 页
          </span>
          <label className="inline-flex items-center gap-2">
            <span>每页</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
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
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                page === currentPageSafe ? "bg-[#1B8BFA] text-white shadow-[0_10px_20px_rgba(27,139,250,0.18)]" : "border border-[#d8ebff] bg-white text-[#6287b0] hover:border-[#1B8BFA] hover:text-[#1B8BFA]"
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
  );
}

export type { DeviceReportRow };
