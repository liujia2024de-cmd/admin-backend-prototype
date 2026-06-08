import { useEffect, useMemo, useState } from "react";
import { FileText, RefreshCcw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Drawer } from "@/components/ui/Drawer";
import { Panel } from "@/components/ui/Panel";
import { RetryState } from "@/components/ui/RetryState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/useToast";
import { knowledgeArticles } from "@/data/mock";

export default function KnowledgePage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [typeKeyword, setTypeKeyword] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredArticles = useMemo(
    () =>
      knowledgeArticles.filter((article) => {
        const titleMatched = keyword.trim() ? article.title.includes(keyword.trim()) : true;
        const typeMatched = typeKeyword.trim()
          ? article.type.includes(typeKeyword.trim()) || article.species.includes(typeKeyword.trim())
          : true;
        return titleMatched && typeMatched;
      }),
    [keyword, typeKeyword],
  );

  const previewArticle = knowledgeArticles.find((article) => article.id === previewId) ?? null;

  const refreshKnowledge = () => {
    setIsLoading(true);
    setSyncError(false);

    const shouldFail = refreshCount === 0;

    window.setTimeout(() => {
      setIsLoading(false);
      setRefreshCount((count) => count + 1);

      if (shouldFail) {
        setSyncError(true);
        showToast({
          tone: "error",
          title: "知识库刷新失败",
          description: "外部内容存储空间暂时不可达，已保留旧版本数据，可点击重试继续同步。",
        });
        return;
      }

      showToast({
        tone: "success",
        title: "知识库已同步",
        description: "最新结构化文档已重新拉取，H5 预览内容同步完成。",
      });
    }, 1000);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="动物知识库"
          description="当前方案通过读取外部知识库存储空间内容构建列表，后台负责查看、预览和刷新"
          action={
            <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-2.5 text-sm font-medium text-white" onClick={refreshKnowledge}>
              <RefreshCcw className="h-4 w-4" />
              手动刷新
            </button>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="文章标题搜索"
            />
            <input
              value={typeKeyword}
              onChange={(event) => setTypeKeyword(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder="类型或物种筛选"
            />
            <button className="rounded-2xl bg-[#1B8BFA] px-5 py-3 text-sm font-medium text-white">查询</button>
          </div>
        </Panel>

        <Panel title="知识库内容列表" description="支持预览 H5 内容和查看同步状态" padded={false}>
          {isLoading ? (
            <div className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ) : syncError ? (
            <div className="p-5">
              <RetryState
                title="知识库同步失败"
                description="外部内容存储空间返回超时。原型中保留了失败重试交互，便于演示后台在读取结构化知识文档时的异常处理。"
                actionLabel="重新同步"
                onRetry={refreshKnowledge}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {["文章ID", "类型", "标题", "物种", "存储路径", "更新时间", "状态", "操作"].map((head) => (
                      <th key={head} className="px-5 py-4 font-medium">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((article, index) => (
                    <tr key={article.id} className={index !== filteredArticles.length - 1 ? "border-b border-slate-100" : ""}>
                      <td className="px-5 py-4 font-medium text-slate-900">{article.id}</td>
                      <td className="px-5 py-4">{article.type}</td>
                      <td className="px-5 py-4">{article.title}</td>
                      <td className="px-5 py-4">{article.species}</td>
                      <td className="px-5 py-4 text-slate-500">{article.path}</td>
                      <td className="px-5 py-4">{article.updatedAt}</td>
                      <td className="px-5 py-4">
                        <StatusBadge value={article.status} tone={article.status === "已同步" ? "green" : "amber"} />
                      </td>
                      <td className="px-5 py-4">
                        <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white" onClick={() => setPreviewId(article.id)}>
                          预览 H5
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <Drawer
        open={previewArticle !== null}
        title={previewArticle?.title ?? "内容预览"}
        description="当前为知识库 H5 预览抽屉，后台可快速校验结构化内容是否同步成功。"
        onClose={() => setPreviewId(null)}
        footer={
          <div className="flex justify-end gap-3">
            <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700" onClick={() => setPreviewId(null)}>
              关闭预览
            </button>
            <button
              className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white"
              onClick={() => {
                setPreviewId(null);
                showToast({
                  tone: "info",
                  title: "H5 链接已生成",
                  description: "演示原型中已准备外部分享链接，可继续交给前端接真实地址。",
                });
              }}
            >
              复制 H5 链接
            </button>
          </div>
        }
      >
        {previewArticle ? (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">存储路径</div>
                    <div className="mt-1 font-medium text-slate-950">{previewArticle.path}</div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge value={previewArticle.status} tone={previewArticle.status === "已同步" ? "green" : "amber"} />
                    <StatusBadge value={previewArticle.type} tone="blue" />
                    <StatusBadge value={previewArticle.species} tone="slate" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <section className="rounded-[28px] border border-slate-100 bg-white p-5">
                <h4 className="font-display text-xl font-semibold text-slate-950">预览摘要</h4>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  本篇内容适用于 {previewArticle.species} 场景，当前以结构化文档方式外部存储。后台只负责读取、同步状态校验与 H5
                  预览，不在 CMS 内直接维护 60+ 字段的富文本编辑器。
                </p>
              </section>

              <section className="rounded-[28px] border border-slate-100 bg-white p-5">
                <h4 className="font-display text-xl font-semibold text-slate-950">同步信息</h4>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">文章 ID</div>
                    <div className="mt-2 text-sm font-medium text-slate-950">{previewArticle.id}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">最近更新时间</div>
                    <div className="mt-2 text-sm font-medium text-slate-950">{previewArticle.updatedAt}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">同步方式</div>
                    <div className="mt-2 text-sm font-medium text-slate-950">外部知识库拉取</div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
