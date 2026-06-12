export type ExportModule = "users" | "devices" | "ai-feedback";
export type AsyncExportStatus = "pending" | "processing" | "completed" | "failed";

export type AsyncExportTask = {
  id: string;
  module: ExportModule;
  moduleLabel: string;
  name: string;
  scopeLabel: string;
  count: number;
  status: AsyncExportStatus;
  createdAt: string;
  retainedUntil: string;
  fileName: string;
  mimeType: string;
  payload: string;
  lastError?: string;
  retryCount?: number;
};

type CreateAsyncExportTaskInput = Omit<AsyncExportTask, "status" | "retainedUntil"> & {
  retainedUntil?: string;
  initialStatus?: AsyncExportStatus;
  lastError?: string;
  retryCount?: number;
};

const EXPORT_TASKS_KEY = "advinci_async_export_tasks";
export const ASYNC_EXPORT_FORCE_RETRY_THRESHOLD = 10;

function formatDateTime(date: Date) {
  return date
    .toLocaleString("zh-CN", {
      hour12: false,
    })
    .replace(/\//g, "-");
}

function buildRetainedUntil() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return formatDateTime(date);
}

function buildSeedTasks(): AsyncExportTask[] {
  return [
    {
      id: "seed-failed-export-task",
      module: "devices",
      moduleLabel: "设备管理",
      name: "设备 SN 导出任务",
      scopeLabel: "全部数据",
      count: 1842,
      status: "failed",
      createdAt: "2026-06-11 09:24:00",
      retainedUntil: "2026-07-11 09:24:00",
      fileName: "设备SN列表-20260611.csv",
      mimeType: "text/csv;charset=utf-8",
      payload: "设备SN\nCAM20260512002",
      lastError: "导出节点响应超时，请刷新后重试导出。",
      retryCount: 0,
    },
  ];
}

export function readAsyncExportTasks() {
  if (typeof window === "undefined") return [] as AsyncExportTask[];
  const raw = window.localStorage.getItem(EXPORT_TASKS_KEY);
  if (!raw) {
    const seededTasks = buildSeedTasks();
    writeAsyncExportTasks(seededTasks);
    return seededTasks;
  }

  try {
    return JSON.parse(raw) as AsyncExportTask[];
  } catch {
    window.localStorage.removeItem(EXPORT_TASKS_KEY);
    return [] as AsyncExportTask[];
  }
}

function writeAsyncExportTasks(tasks: AsyncExportTask[]) {
  window.localStorage.setItem(EXPORT_TASKS_KEY, JSON.stringify(tasks));
}

export function createAsyncExportTask(input: CreateAsyncExportTaskInput) {
  const task: AsyncExportTask = {
    ...input,
    status: input.initialStatus ?? "processing",
    retainedUntil: input.retainedUntil ?? buildRetainedUntil(),
    retryCount: input.retryCount ?? 0,
  };
  const tasks = [task, ...readAsyncExportTasks()];
  writeAsyncExportTasks(tasks);
  return task;
}

export function updateAsyncExportTaskStatus(taskId: string, status: AsyncExportStatus) {
  const tasks = readAsyncExportTasks().map((task) =>
    task.id === taskId
      ? {
          ...task,
          status,
          lastError: status === "failed" ? task.lastError ?? "导出任务执行失败，请刷新后重试导出。" : undefined,
        }
      : task,
  );
  writeAsyncExportTasks(tasks);
}

export function retryAsyncExportTask(taskId: string) {
  const tasks = readAsyncExportTasks().map((task) =>
    task.id === taskId
      ? {
          ...task,
          status: "processing" as const,
          lastError: undefined,
          retryCount: (task.retryCount ?? 0) + 1,
          retainedUntil: buildRetainedUntil(),
        }
      : task,
  );
  writeAsyncExportTasks(tasks);
}

export function canRetryAsyncExportTask(task: AsyncExportTask) {
  return task.status === "failed";
}

export function downloadAsyncExportTask(task: AsyncExportTask) {
  const blob = new Blob([task.payload], { type: task.mimeType });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = task.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
