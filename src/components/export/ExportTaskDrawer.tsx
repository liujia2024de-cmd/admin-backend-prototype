import { useEffect, useMemo, useState } from "react";
import { Download, FileOutput, RefreshCcw } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/useToast";
import {
  AsyncExportTask,
  ASYNC_EXPORT_FORCE_RETRY_THRESHOLD,
  ExportModule,
  canRetryAsyncExportTask,
  downloadAsyncExportTask,
  readAsyncExportTasks,
  retryAsyncExportTask,
  updateAsyncExportTaskStatus,
} from "@/lib/asyncExport";

type ExportTaskDrawerProps = {
  open: boolean;
  onClose: () => void;
  module: ExportModule;
  title: string;
  description: string;
};

export function ExportTaskDrawer({ open, onClose, module, title, description }: ExportTaskDrawerProps) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<AsyncExportTask[]>([]);

  useEffect(() => {
    if (!open) return;
    setTasks(readAsyncExportTasks().filter((task) => task.module === module));
  }, [module, open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => {
      setTasks(readAsyncExportTasks().filter((task) => task.module === module));
    }, 3000);
    return () => window.clearInterval(timer);
  }, [module, open]);

  const orderedTasks = useMemo(() => tasks, [tasks]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-[#6f8fb3]">任务列表每 3 秒自动刷新，导出文件保留 30 天。</div>
          <button
            type="button"
            onClick={() => {
              setTasks(readAsyncExportTasks().filter((task) => task.module === module));
              showToast({
                tone: "success",
                title: "任务列表已刷新",
                description: "当前模块的导出任务状态已同步到最新结果。",
              });
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#d8ebff] bg-white px-4 py-3 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA]"
          >
            <RefreshCcw className="h-4 w-4" />
            刷新任务
          </button>
        </div>
      }
    >
      {orderedTasks.length === 0 ? (
        <EmptyState title="暂无导出任务" description="你可以先创建批量导出任务，文件生成后会显示在这里。" />
      ) : (
        <div className="space-y-4">
          {orderedTasks.map((task) => (
            <section key={task.id} className="rounded-[24px] border border-[#d8ebff] bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-slate-900">{task.name}</div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    task.status === "completed"
                      ? "bg-emerald-50 text-emerald-600"
                      : task.status === "failed"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {task.status === "completed" ? "已完成" : task.status === "failed" ? "已失败" : "处理中"}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm text-[#6f8fb3]">
                <div>
                  导出范围：{task.scopeLabel} · 数据量：{task.count} 条 · 创建时间：{task.createdAt}
                </div>
                <div>文件名：{task.fileName}</div>
                <div>文件保留至：{task.retainedUntil}</div>
                {task.status === "failed" && task.lastError ? <div className="text-rose-500">失败原因：{task.lastError}</div> : null}
                {task.status === "failed" ? (
                  <div>
                    已重试 {task.retryCount ?? 0} 次
                    {(task.retryCount ?? 0) >= ASYNC_EXPORT_FORCE_RETRY_THRESHOLD ? "，已进入强制重试阶段" : ""}
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {task.status === "failed" ? (
                  <button
                    type="button"
                    disabled={!canRetryAsyncExportTask(task)}
                    onClick={() => {
                      if (!canRetryAsyncExportTask(task)) return;
                      retryAsyncExportTask(task.id);
                      setTasks(readAsyncExportTasks().filter((item) => item.module === module));
                      showToast({
                        tone: "info",
                        title: "已重新加入导出队列",
                        description: `${task.name} 正在刷新后重试导出。`,
                      });
                      window.setTimeout(() => {
                        updateAsyncExportTaskStatus(task.id, "completed");
                        setTasks(readAsyncExportTasks().filter((item) => item.module === module));
                      }, 1500);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#d8ebff] bg-white px-4 py-2.5 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    {(task.retryCount ?? 0) >= ASYNC_EXPORT_FORCE_RETRY_THRESHOLD ? "强制重试导出" : "刷新重试导出"}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={task.status !== "completed"}
                  onClick={() => {
                    downloadAsyncExportTask(task);
                    showToast({
                      tone: "success",
                      title: "导出文件已开始下载",
                      description: `${task.fileName} 已开始下载。`,
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#d8ebff] bg-white px-4 py-2.5 text-sm font-medium text-[#6287b0] transition hover:border-[#1B8BFA] hover:text-[#1B8BFA] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {task.status === "completed" ? <Download className="h-4 w-4" /> : <FileOutput className="h-4 w-4" />}
                  {task.status === "completed" ? "下载文件" : task.status === "failed" ? "等待重试" : "生成中"}
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </Drawer>
  );
}
