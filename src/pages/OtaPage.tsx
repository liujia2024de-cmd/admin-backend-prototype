import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/useToast";
import { otaVersions } from "@/data/mock";

type OtaAction = "publish" | "rollback" | "delete" | "unpublish" | null;
type OtaStatus = "已发布" | "未发布" | "已回滚" | "已取消发布";

type OtaRecord = {
  id: string;
  pn: string;
  version: string;
  size: string;
  releaseNote: string;
  uploadedAt: string;
  publishedAt: string;
  status: OtaStatus;
};

const hashSeed = (value: string) =>
  [...value].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);

const getOtaMetrics = (item: OtaRecord) => {
  const seed = hashSeed(`${item.pn}-${item.version}`);
  const total = item.pn.startsWith("CTRL-") ? 120 + (seed % 60) : 180 + (seed % 90);

  if (item.status === "未发布") {
    return {
      total,
      upgraded: 0,
      rate: 0,
      failedLogs: 0,
    };
  }

  const rateBase =
    item.status === "已发布"
      ? 48 + (seed % 35)
      : item.status === "已取消发布"
        ? 26 + (seed % 24)
        : 12 + (seed % 18);
  const upgraded = Math.min(total, Math.round((total * rateBase) / 100));
  const failedLogs =
    item.status === "已发布"
      ? 1 + (seed % 4)
      : item.status === "已取消发布"
        ? 2 + (seed % 5)
        : 4 + (seed % 6);

  return {
    total,
    upgraded,
    rate: Number(((upgraded / total) * 100).toFixed(1)),
    failedLogs,
  };
};

const initialVersions: OtaRecord[] = otaVersions.map((item, index) => ({
  id: `ota-${index + 1}`,
  ...item,
  status: item.status as OtaStatus,
}));

const nowString = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export default function OtaPage() {
  const { showToast } = useToast();
  const openNativeDatePicker = (input: HTMLInputElement) => {
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
  };

  const [versions, setVersions] = useState<OtaRecord[]>(initialVersions);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<OtaAction>(null);
  const [selectedVersion, setSelectedVersion] = useState<OtaRecord | null>(null);
  const [draftPn, setDraftPn] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [pnKeyword, setPnKeyword] = useState("");
  const [statusKeyword, setStatusKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadPn, setUploadPn] = useState("CAM-PN-02");
  const [uploadVersion, setUploadVersion] = useState("");
  const [uploadReleaseNote, setUploadReleaseNote] = useState("");
  const [publishMode, setPublishMode] = useState("立即发布");
  const [scheduleTime, setScheduleTime] = useState("2026-06-05 20:00");
  const [publishScope, setPublishScope] = useState("全部设备");
  const [snListFileName, setSnListFileName] = useState("");
  const [releaseNotePreview, setReleaseNotePreview] = useState<{ version: string; note: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filteredVersions = useMemo(
    () =>
      versions.filter((item) => {
        const uploadDate = item.uploadedAt.slice(0, 10);
        const matchedStartDate = !startDate || uploadDate >= startDate;
        const matchedEndDate = !endDate || uploadDate <= endDate;
        const matchedPn = pnKeyword ? item.pn.toLowerCase().includes(pnKeyword.toLowerCase()) : true;
        const matchedStatus = statusKeyword ? item.status.includes(statusKeyword) : true;
        return matchedStartDate && matchedEndDate && matchedPn && matchedStatus;
      }),
    [endDate, pnKeyword, startDate, statusKeyword, versions],
  );
  const totalPages = Math.max(1, Math.ceil(filteredVersions.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedVersions = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * pageSize;
    return filteredVersions.slice(startIndex, startIndex + pageSize);
  }, [currentPageSafe, filteredVersions, pageSize]);
  const visiblePageNumbers = useMemo(() => {
    const start = Math.max(1, currentPageSafe - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);
    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [currentPageSafe, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [endDate, pnKeyword, startDate, statusKeyword, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const resetUploadForm = () => {
    setUploadFileName("");
    setUploadPn("CAM-PN-02");
    setUploadVersion("");
    setUploadReleaseNote("");
  };

  const resetPublishForm = () => {
    setPublishMode("立即发布");
    setScheduleTime("2026-06-05 20:00");
    setPublishScope("全部设备");
    setSnListFileName("");
  };

  const openAction = (action: OtaAction, item: OtaRecord) => {
    setActiveAction(action);
    setSelectedVersion(item);
    if (action === "publish") {
      resetPublishForm();
    }
  };

  const closeAction = () => {
    setActiveAction(null);
    setSelectedVersion(null);
    resetPublishForm();
  };

  const handleUpload = () => {
    if (!uploadFileName || !uploadVersion.trim() || !uploadReleaseNote.trim()) {
      showToast({
        tone: "warning",
        title: "请先补全上传信息",
        description: "固件文件、版本号和 Release Note 都是必填项。",
      });
      return;
    }

    const autoDetectedSize =
      uploadPn.startsWith("CAM-") ? "96MB" : uploadPn === "CTRL-PN-02" ? "156MB" : "182MB";

    const record: OtaRecord = {
      id: `ota-${Date.now()}`,
      pn: uploadPn,
      version: uploadVersion.trim(),
      size: autoDetectedSize,
      releaseNote: uploadReleaseNote.trim(),
      uploadedAt: nowString(),
      publishedAt: "-",
      status: "未发布",
    };

    setVersions((current) => [record, ...current]);
    setUploadOpen(false);
    resetUploadForm();
    showToast({
      tone: "success",
      title: "固件上传成功",
      description: `新版本已进入待发布列表，文件大小已自动识别为 ${autoDetectedSize}。`,
    });
  };

  const handleConfirmAction = () => {
    if (!selectedVersion || !activeAction) return;

    if (activeAction === "publish") {
      if (publishMode === "定时发布" && !scheduleTime.trim()) {
        showToast({
          tone: "warning",
          title: "请设置定时发布时间",
          description: "选择定时发布后，需要补充具体发布时间。",
        });
        return;
      }

      if (publishScope === "指定SN名单发布" && !snListFileName) {
        showToast({
          tone: "warning",
          title: "请上传 SN 名单",
          description: "选择指定 SN 名单发布后，需要上传名单文件。",
        });
        return;
      }

      setVersions((current) =>
        current.map((item) =>
          item.id === selectedVersion.id
            ? {
                ...item,
                status: "已发布",
                publishedAt: publishMode === "立即发布" ? nowString() : scheduleTime,
              }
            : item,
        ),
      );
      showToast({
        tone: "success",
        title: "发布策略已生效",
        description: `${selectedVersion.version} 已按${publishMode}发布，范围为${publishScope}${snListFileName ? `（${snListFileName}）` : ""}。`,
      });
    }

    if (activeAction === "unpublish") {
      setVersions((current) =>
        current.map((item) =>
          item.id === selectedVersion.id
            ? {
                ...item,
                status: "已取消发布",
              }
            : item,
        ),
      );
      showToast({
        tone: "info",
        title: "版本已取消发布",
        description: `${selectedVersion.version} 已停止继续下发，后续可重新发布或删除。`,
      });
    }

    if (activeAction === "rollback") {
      setVersions((current) =>
        current.map((item) =>
          item.id === selectedVersion.id
            ? {
                ...item,
                status: "已回滚",
              }
            : item,
        ),
      );
      showToast({
        tone: "warning",
        title: "版本已回滚",
        description: `${selectedVersion.version} 已停止继续下发，设备端将回退到上一稳定版本。`,
      });
    }

    if (activeAction === "delete") {
      setVersions((current) => current.filter((item) => item.id !== selectedVersion.id));
      showToast({
        tone: "info",
        title: "未发布版本已删除",
        description: `${selectedVersion.version} 已从待发布列表移除，不影响已上线设备。`,
      });
    }

    closeAction();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="固件版本列表"
          overflowVisible
          action={
            <button className="brand-primary-btn px-4 py-2.5" onClick={() => setUploadOpen(true)}>
              <UploadCloud className="h-4 w-4" />
              上传新固件
            </button>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <input
              value={draftPn}
              onChange={(event) => setDraftPn(event.target.value)}
              className="brand-input"
              placeholder="设备型号 PN 代号"
            />

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setDateOpen((prev) => !prev);
                  setStatusOpen(false);
                }}
                className="brand-input flex w-full items-center justify-between text-left text-slate-700"
              >
                <span className={draftStartDate || draftEndDate ? "text-slate-700" : "text-[#8caed5]"}>
                  {draftStartDate || draftEndDate ? `${draftStartDate || "开始日期"} 至 ${draftEndDate || "结束日期"}` : "上传日期范围"}
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
                      value={draftStartDate}
                      onChange={(event) => setDraftStartDate(event.target.value)}
                      onClick={(event) => openNativeDatePicker(event.currentTarget)}
                      onFocus={(event) => openNativeDatePicker(event.currentTarget)}
                      className="brand-input"
                    />
                    <input
                      type="date"
                      value={draftEndDate}
                      onChange={(event) => setDraftEndDate(event.target.value)}
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
              <button
                type="button"
                onClick={() => {
                  setStatusOpen((prev) => !prev);
                  setDateOpen(false);
                }}
                className="brand-input flex w-full items-center justify-between text-left text-slate-700"
              >
                <span className={draftStatus ? "text-slate-700" : "text-[#8caed5]"}>{draftStatus || "状态筛选"}</span>
                <ChevronDown className="h-4 w-4 text-[#79a4d4]" />
              </button>

              {statusOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] w-full rounded-2xl border border-[#d8ebff] bg-white p-2 shadow-[0_20px_40px_rgba(27,139,250,0.12)]">
                  {["", "已发布", "未发布", "已取消发布", "已回滚"].map((value) => (
                    <button
                      key={value || "all"}
                      type="button"
                      onClick={() => {
                        setDraftStatus(value);
                        setStatusOpen(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-sm transition ${
                        draftStatus === value ? "bg-[#eef6ff] text-[#1B8BFA]" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {value || "全部状态"}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              className="brand-primary-btn px-5 py-3"
              onClick={() => {
                setPnKeyword(draftPn.trim());
                setStatusKeyword(draftStatus.trim());
                setStartDate(draftStartDate);
                setEndDate(draftEndDate);
                setDateOpen(false);
                setStatusOpen(false);
              }}
            >
              筛选
            </button>
          </div>
        </Panel>

        <Panel padded={false}>
          {filteredVersions.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="没有符合条件的固件版本"
                description="可以清空日期、PN 或状态筛选条件，重新查看全部版本，或直接上传一个新固件。"
                action={
                  <button className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" onClick={() => setUploadOpen(true)}>
                    上传新固件
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
                      {["设备PN", "版本号", "文件大小", "Release Note", "上传时间", "发布时间", "OTA进度", "升级率", "升级失败日志", "状态", "操作"].map((head) => (
                        <th key={head} className="px-5 py-4 font-medium">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVersions.map((item, index) => {
                      const metrics = getOtaMetrics(item);
                      return (
                      <tr key={item.id} className={index !== paginatedVersions.length - 1 ? "border-b border-[#eaf4ff]" : ""}>
                        <td className="px-5 py-4">{item.pn}</td>
                        <td className="px-5 py-4">{item.version}</td>
                        <td className="px-5 py-4">{item.size}</td>
                        <td className="px-5 py-4">
                          <div className="max-w-[16ch] text-sm leading-6 text-slate-700">
                            <p
                              className="break-all"
                              style={{
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 3,
                                overflow: "hidden",
                              }}
                            >
                              {item.releaseNote}
                            </p>
                            <button
                              type="button"
                              className="mt-1 text-xs font-medium text-[#1B8BFA] transition hover:text-[#1577d9]"
                              onClick={() => setReleaseNotePreview({ version: item.version, note: item.releaseNote })}
                            >
                              查看全部
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4">{item.uploadedAt}</td>
                        <td className="px-5 py-4">{item.publishedAt}</td>
                        <td className="px-5 py-4">
                          <div className="min-w-[108px]">
                            <div className="font-medium text-slate-900">
                              {metrics.upgraded}/{metrics.total}
                            </div>
                            <div className="mt-1 text-xs text-[#7395bc]">已升级设备 / 总设备数</div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="min-w-[88px]">
                            <div className="inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-sm font-medium text-[#1B8BFA]">{metrics.rate}%</div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {metrics.failedLogs > 0 ? (
                            <Link
                              to={`/logs?source=device&preset=embedded_upgrade_failure&keyword=${encodeURIComponent(item.version)}`}
                              className="inline-flex items-center rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white shadow-[0_10px_18px_rgba(27,139,250,0.18)]"
                            >
                              {metrics.failedLogs}条日志
                            </Link>
                          ) : (
                            <span className="text-sm text-[#7395bc]">0条日志</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge
                            value={item.status}
                            tone={
                              item.status === "已发布"
                                ? "green"
                                : item.status === "未发布"
                                  ? "amber"
                                  : item.status === "已取消发布"
                                    ? "slate"
                                    : "rose"
                            }
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {item.status === "未发布" ? (
                              <>
                                <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white shadow-[0_10px_18px_rgba(27,139,250,0.18)]" onClick={() => openAction("publish", item)}>
                                  发布
                                </button>
                                <button className="rounded-full border border-[#d8ebff] bg-white px-3 py-1.5 text-xs font-medium text-[#6287b0]" onClick={() => openAction("delete", item)}>
                                  删除
                                </button>
                              </>
                            ) : item.status === "已发布" ? (
                              <>
                                <button className="rounded-full border border-[#d8ebff] bg-white px-3 py-1.5 text-xs font-medium text-[#6287b0]" onClick={() => openAction("unpublish", item)}>
                                  取消发布
                                </button>
                                <button className="rounded-full border border-[#d8ebff] bg-white px-3 py-1.5 text-xs font-medium text-[#6287b0]" onClick={() => openAction("rollback", item)}>
                                  回滚
                                </button>
                              </>
                            ) : item.status === "已取消发布" ? (
                              <>
                                <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white shadow-[0_10px_18px_rgba(27,139,250,0.18)]" onClick={() => openAction("publish", item)}>
                                  重新发布
                                </button>
                                <button className="rounded-full border border-[#d8ebff] bg-white px-3 py-1.5 text-xs font-medium text-[#6287b0]" onClick={() => openAction("delete", item)}>
                                  删除
                                </button>
                              </>
                            ) : (
                              <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white shadow-[0_10px_18px_rgba(27,139,250,0.18)]" onClick={() => openAction("publish", item)}>
                                重新发布
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-4 border-t border-[#e9f4ff] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6784a8]">
                  <span>
                    共 <span className="font-semibold text-slate-900">{filteredVersions.length}</span> 条
                  </span>
                  <span>
                    当前第 <span className="font-semibold text-slate-900">{currentPageSafe}</span> / {totalPages} 页
                  </span>
                  <span>
                    本页显示 {Math.min(pageSize, paginatedVersions.length)} 条
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
      </div>

      <Drawer
        open={uploadOpen}
        title="上传新固件"
        description="支持 .bin / .zip / 其他格式文件，文件大小在上传后自动检测。"
        onClose={() => {
          setUploadOpen(false);
          resetUploadForm();
        }}
        footer={
          <div className="flex justify-end gap-3">
            <button
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
              onClick={() => {
                setUploadOpen(false);
                resetUploadForm();
              }}
            >
              取消
            </button>
            <button className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" onClick={handleUpload}>
              保存版本
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-700">上传固件文件</div>
              <label className="flex cursor-pointer items-center justify-between rounded-[24px] border border-[#d8ebff] bg-[linear-gradient(180deg,#fbfdff_0%,#f4f9ff_100%)] px-4 py-4 transition hover:border-[#1B8BFA] hover:bg-[#f8fbff]">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">{uploadFileName || "选择固件文件"}</div>
                  <div className="mt-1 text-xs text-[#6f8fb3]">支持 .bin / .zip / .img / .pkg，文件大小将自动检测</div>
                </div>
                <span className="ml-4 rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white">上传文件</span>
                <input
                  type="file"
                  accept=".bin,.zip,.img,.pkg"
                  onChange={(event) => setUploadFileName(event.target.files?.[0]?.name ?? "")}
                  className="sr-only"
                />
              </label>
            </label>
            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-700">版本号</div>
              <input
                value={uploadVersion}
                onChange={(event) => setUploadVersion(event.target.value)}
                className="brand-input"
                placeholder="v1.0.0_0512"
              />
            </label>
            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-700">设备 PN</div>
              <select value={uploadPn} onChange={(event) => setUploadPn(event.target.value)} className="brand-input">
                <option>CAM-PN-01</option>
                <option>CAM-PN-02</option>
                <option>CTRL-PN-02</option>
                <option>CTRL-PN-03</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <div className="mb-2 text-sm font-medium text-slate-700">Release Note</div>
              <textarea
                value={uploadReleaseNote}
                onChange={(event) => setUploadReleaseNote(event.target.value)}
                className="brand-input min-h-32 resize-y"
                placeholder="填写本次版本说明，可输入较长文本，例如修复内容、优化点、已知限制等。"
              />
            </label>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        open={activeAction !== null && selectedVersion !== null}
        title={
          activeAction === "publish"
            ? "确认发布固件版本"
            : activeAction === "unpublish"
              ? "确认取消发布"
            : activeAction === "rollback"
              ? "确认回滚当前版本"
              : "确认删除未发布版本"
        }
        description={
          activeAction === "publish"
            ? `即将发布 ${selectedVersion?.version}。请在这里配置发布方式和发布范围。`
            : activeAction === "unpublish"
              ? `即将取消发布 ${selectedVersion?.version}。取消后新设备不会继续收到该版本，但历史发布记录仍会保留。`
            : activeAction === "rollback"
              ? `即将回滚 ${selectedVersion?.version}。已升级设备将按回滚策略恢复到旧版本，并保留升级失败日志与错误码记录。`
              : `删除后 ${selectedVersion?.version} 将从待发布列表移除，已上传文件在原型中视为同步清理。`
        }
        confirmText={
          activeAction === "publish"
            ? "确认发布"
            : activeAction === "unpublish"
              ? "确认取消发布"
              : activeAction === "rollback"
                ? "确认回滚"
                : "确认删除"
        }
        onCancel={closeAction}
        onConfirm={handleConfirmAction}
      >
        {activeAction === "publish" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-700">发布方式</div>
              <select value={publishMode} onChange={(event) => setPublishMode(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                <option>立即发布</option>
                <option>定时发布</option>
              </select>
            </label>

            {publishMode === "定时发布" ? (
              <label className="block">
                <div className="mb-2 text-sm font-medium text-slate-700">定时发布时间</div>
                <input value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" />
              </label>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d8ebff] bg-[#f8fbff] px-4 py-3 text-sm text-[#6287b0]">
                选择立即发布后，确认即会直接生效。
              </div>
            )}

            <label className="block md:col-span-2">
              <div className="mb-2 text-sm font-medium text-slate-700">发布范围</div>
              <select value={publishScope} onChange={(event) => setPublishScope(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                <option>全部设备</option>
                <option>指定SN名单发布</option>
              </select>
            </label>

            {publishScope === "指定SN名单发布" ? (
              <label className="block md:col-span-2">
                <div className="mb-2 text-sm font-medium text-slate-700">上传 SN 名单</div>
                <label className="flex cursor-pointer items-center justify-between rounded-[24px] border border-[#d8ebff] bg-[linear-gradient(180deg,#fbfdff_0%,#f4f9ff_100%)] px-4 py-4 transition hover:border-[#1B8BFA] hover:bg-[#f8fbff]">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900">{snListFileName || "选择 SN 名单文件"}</div>
                    <div className="mt-1 text-xs text-[#6f8fb3]">支持 .csv / .txt，用于指定设备范围发布</div>
                  </div>
                  <span className="ml-4 rounded-full border border-[#d8ebff] bg-white px-3 py-1.5 text-xs font-medium text-[#6287b0]">
                    上传名单
                  </span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(event) => setSnListFileName(event.target.files?.[0]?.name ?? "")}
                    className="sr-only"
                  />
                </label>
              </label>
            ) : null}
          </div>
        ) : null}
      </ConfirmModal>

      {releaseNotePreview ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[#1B8BFA]/18 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-[#d8ebff] bg-white p-6 shadow-[0_40px_120px_rgba(27,139,250,0.18)]">
            <h3 className="font-display text-2xl font-semibold text-slate-950">Release Note</h3>
            <p className="mt-2 text-sm text-[#6f8fb3]">版本号：{releaseNotePreview.version}</p>
            <div className="mt-5 max-h-[60vh] overflow-y-auto rounded-[24px] border border-[#e8f3ff] bg-[#fbfdff] p-5 text-sm leading-7 text-slate-700">
              {releaseNotePreview.note}
            </div>
            <div className="mt-6 flex justify-end">
              <button className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" onClick={() => setReleaseNotePreview(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
