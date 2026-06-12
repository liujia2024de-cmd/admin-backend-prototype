import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronDown, Download, ListChecks, MapPinned } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ExportTaskDrawer } from "@/components/export/ExportTaskDrawer";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/useToast";
import { devices, users } from "@/data/mock";
import { createAsyncExportTask, updateAsyncExportTaskStatus } from "@/lib/asyncExport";
import { isSuperAdmin, readSession } from "@/lib/auth";
import { getUserActivityLevel, getUserActivitySecondaryTag, getUserActivityTone } from "@/lib/userActivity";

type UserExportScope = "filtered" | "all";
type UserExportMode = "account_email" | "phone";
type UserExportTask = {
  id: string;
  name: string;
  scope: UserExportScope;
  scopeLabel: string;
  exportMode: UserExportMode;
  count: number;
  status: "processing" | "completed";
  createdAt: string;
  fileName: string;
  payload: string;
};

const scopeLabelMap: Record<UserExportScope, string> = {
  filtered: "当前筛选结果",
  all: "全部数据",
};

export default function UsersPage() {
  const { showToast } = useToast();
  const canExport = isSuperAdmin(readSession());
  const openNativeDatePicker = (input: HTMLInputElement) => {
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
  };

  const [keyword, setKeyword] = useState("");
  const [deviceKeyword, setDeviceKeyword] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [countryCityOpen, setCountryCityOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [taskListOpen, setTaskListOpen] = useState(false);
  const [batchExportOpen, setBatchExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<UserExportScope>("filtered");
  const [exportMode, setExportMode] = useState<UserExportMode>("account_email");

  const countryOptions = useMemo(
    () => [...new Set(users.map((user) => user.region.split(" / ")[0]))],
    [],
  );

  const cityOptions = useMemo(() => {
    const matchedUsers = country ? users.filter((user) => user.region.startsWith(`${country} / `)) : users;
    return [...new Set(matchedUsers.map((user) => user.region.split(" / ")[1]))];
  }, [country]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const text = keyword.trim().toLowerCase();
        const matchesKeyword =
          !text ||
          user.nickname.toLowerCase().includes(text) ||
          user.realName.toLowerCase().includes(text) ||
          user.id.toLowerCase().includes(text);

        const normalizedDeviceKeyword = deviceKeyword.trim().toLowerCase();
        const matchesDevice =
          !normalizedDeviceKeyword ||
          devices.some(
            (device) =>
              (device.userPhone === user.phone || device.userEmail === user.email) &&
              device.snCode.toLowerCase() === normalizedDeviceKeyword,
          );
        const [userCountry, userCity] = user.region.split(" / ");
        const matchesCountry = !country || userCountry === country;
        const matchesCity = !city || userCity === city;

        const registeredDate = user.registeredAt.slice(0, 10);
        const matchesStartDate = !startDate || registeredDate >= startDate;
        const matchesEndDate = !endDate || registeredDate <= endDate;

        return matchesKeyword && matchesDevice && matchesCountry && matchesCity && matchesStartDate && matchesEndDate;
      }),
    [keyword, deviceKeyword, country, city, startDate, endDate],
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [currentPageSafe, filteredUsers, pageSize]);
  const visiblePageNumbers = useMemo(() => {
    const start = Math.max(1, currentPageSafe - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);
    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [currentPageSafe, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, deviceKeyword, country, city, startDate, endDate, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getUsersByScope = (scope: UserExportScope) => {
    if (scope === "filtered") return filteredUsers;
    return users;
  };

  const estimatedExportCount = getUsersByScope(exportScope).length;

  const createTaskTime = () => new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-");

  const createExportTask = () => {
    const targetUsers = getUsersByScope(exportScope);
    if (targetUsers.length === 0) {
      showToast({
        tone: "warning",
        title: "没有可导出的数据",
        description: "当前导出范围下没有用户数据，请调整筛选条件后再试。",
      });
      return;
    }

    const header =
      exportMode === "account_email"
        ? "用户ID,用户名,用户邮箱,用户状态主分层,近24小时高活跃标签"
        : "用户ID,用户名,电话号码,用户状态主分层,近24小时高活跃标签";
    const rows = targetUsers.map((user) => {
      const level = getUserActivityLevel(user.lastActiveAt);
      const highActivityTag = getUserActivitySecondaryTag(user.lastActiveAt) ?? "否";
      return exportMode === "account_email"
        ? `${user.id},${user.nickname},${user.email},${level},${highActivityTag}`
        : `${user.id},${user.nickname},${user.phone},${level},${highActivityTag}`;
    });
    const fileName = `${exportMode === "account_email" ? "用户账号邮箱列表" : "用户电话号码列表"}-${Date.now()}.csv`;
    const taskId = `user-export-${Date.now()}`;
    createAsyncExportTask({
      id: taskId,
      module: "users",
      moduleLabel: "用户管理",
      name: exportMode === "account_email" ? "用户账号邮箱导出任务" : "用户电话号码导出任务",
      scopeLabel: scopeLabelMap[exportScope],
      count: targetUsers.length,
      createdAt: createTaskTime(),
      fileName,
      mimeType: "text/csv;charset=utf-8",
      payload: [header, ...rows].join("\n"),
    });

    setBatchExportOpen(false);
    setTaskListOpen(true);
    showToast({
      tone: "info",
      title: "导出任务已创建",
      description: `系统正在为 ${targetUsers.length} 条用户数据生成导出文件，可在当前页面的导出任务中查看进度。`,
    });

    window.setTimeout(() => {
      updateAsyncExportTaskStatus(taskId, "completed");
    }, 1200);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="用户列表"
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
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="brand-input"
              placeholder="搜索用户名称"
            />
            <input
              value={deviceKeyword}
              onChange={(e) => setDeviceKeyword(e.target.value)}
              className="brand-input"
              placeholder="搜索设备 SN"
            />

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCountryCityOpen((prev) => !prev);
                  setDateOpen(false);
                }}
                className="brand-input flex w-full items-center justify-between text-left text-slate-700"
              >
                <span className={country || city ? "text-slate-700" : "text-[#8caed5]"}>
                  {country || city ? `${country || "全部国家"} / ${city || "全部城市"}` : "地区筛选"}
                </span>
                <span className="flex items-center gap-2 text-[#79a4d4]">
                  <MapPinned className="h-4 w-4" />
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>

              {countryCityOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] w-full rounded-2xl border border-[#d8ebff] bg-white p-4 shadow-[0_20px_40px_rgba(27,139,250,0.12)]">
                  <div className="space-y-3">
                    <select
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        setCity("");
                      }}
                      className="brand-input"
                    >
                      <option value="">全部国家</option>
                      {countryOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="brand-input"
                    >
                      <option value="">全部城市</option>
                      {cityOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="brand-primary-btn w-full"
                      onClick={() => setCountryCityOpen(false)}
                    >
                      确定
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setDateOpen((prev) => !prev);
                  setCountryCityOpen(false);
                }}
                className="brand-input flex w-full items-center justify-between text-left text-slate-700"
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
                    <button
                      type="button"
                      className="brand-primary-btn w-full"
                      onClick={() => setDateOpen(false)}
                    >
                      确定
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <button
              className="brand-primary-btn"
              onClick={() => {
                setCountryCityOpen(false);
                setDateOpen(false);
              }}
            >
              搜索用户
            </button>
          </div>
        </Panel>

        <Panel padded={false}>
          {filteredUsers.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="没有找到匹配用户"
                description="当前筛选条件下没有符合结果，您可以清空搜索关键词或调整地区、设备条件。"
                action={
                  <button
                    className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white"
                    onClick={() => {
                      setKeyword("");
                      setDeviceKeyword("");
                      setCountry("");
                      setCity("");
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    清空筛选
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
                      {["用户ID", "昵称", "地区", "持有设备数量", "注册时间", "状态", "操作"].map((head) => (
                        <th key={head} className="px-5 py-4 font-medium">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user, index) => (
                      <tr key={user.id} className={index !== paginatedUsers.length - 1 ? "border-b border-[#eaf4ff]" : ""}>
                        <td className="px-5 py-4 font-medium text-slate-900">{user.id}</td>
                        <td className="px-5 py-4 text-slate-700">{user.nickname}</td>
                        <td className="px-5 py-4 text-slate-700">{user.region}</td>
                        <td className="px-5 py-4 text-slate-700">{user.deviceCount}</td>
                        <td className="px-5 py-4 text-slate-700">{user.registeredAt}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge value={getUserActivityLevel(user.lastActiveAt)} tone={getUserActivityTone(getUserActivityLevel(user.lastActiveAt))} />
                            {getUserActivitySecondaryTag(user.lastActiveAt) ? (
                              <span className="inline-flex w-fit rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-medium text-[#1B8BFA]">
                                {getUserActivitySecondaryTag(user.lastActiveAt)}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            to={`/users/${user.id}`}
                            className="inline-flex rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white shadow-[0_8px_18px_rgba(27,139,250,0.16)] transition hover:bg-[#1577d9]"
                          >
                            查看详情
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-4 border-t border-[#e9f4ff] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6784a8]">
                  <span>
                    共 <span className="font-semibold text-slate-900">{filteredUsers.length}</span> 条
                  </span>
                  <span>
                    当前第 <span className="font-semibold text-slate-900">{currentPageSafe}</span> / {totalPages} 页
                  </span>
                  <span>
                    本页显示 {Math.min(pageSize, paginatedUsers.length)} 条
                  </span>
                  <label className="inline-flex items-center gap-2">
                    <span>每页</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
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
            </>
          )}
        </Panel>

        <ExportTaskDrawer
          open={taskListOpen}
          onClose={() => setTaskListOpen(false)}
          module="users"
          title="用户管理导出任务"
          description="查看用户管理页创建的导出任务状态，文件生成完成后可直接在这里下载。"
        />

        <Drawer
          open={batchExportOpen}
          title="批量导出用户"
          description="按导出范围创建后台导出任务，适合大量数据批量导出。文件生成完成后可在当前页面的导出任务中下载。"
          onClose={() => setBatchExportOpen(false)}
          footer={
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-[#6f8fb3]">预计导出 {estimatedExportCount} 条用户数据</div>
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
                  { value: "filtered", label: "导出当前筛选结果", count: filteredUsers.length },
                  { value: "all", label: "导出全部数据", count: users.length },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExportScope(option.value as UserExportScope)}
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

            <section className="rounded-[24px] border border-[#d8ebff] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-5">
              <div className="text-sm font-medium text-slate-900">导出字段</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  ["account_email", "用户名 + 用户邮箱列表"],
                  ["phone", "用户名 + 电话号码列表"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setExportMode(value as "account_email" | "phone")}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      exportMode === value
                        ? "border-[#1B8BFA] bg-[#eef6ff] text-[#1B8BFA]"
                        : "border-[#d8ebff] bg-white text-slate-700 hover:border-[#9fcbff]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
