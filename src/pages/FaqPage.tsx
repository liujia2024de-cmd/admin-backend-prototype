import { PlusCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { faqs } from "@/data/mock";

export default function FaqPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="FAQ 列表"
          description="FAQ 保存后直接生成 H5 页面，不区分草稿和发布状态"
          action={
            <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-2.5 text-sm font-medium text-white">
              <PlusCircle className="h-4 w-4" />
              新增 FAQ
            </button>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="按标题搜索" />
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="按功能模块筛选" />
            <button className="rounded-2xl bg-[#1B8BFA] px-5 py-3 text-sm font-medium text-white">筛选</button>
          </div>
        </Panel>

        <Panel title="FAQ 内容管理" description="支持富文本正文、图片上传和模块分类" padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["Key", "标题", "功能模块", "更新时间", "操作"].map((head) => (
                    <th key={head} className="px-5 py-4 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {faqs.map((faq, index) => (
                  <tr key={faq.key} className={index !== faqs.length - 1 ? "border-b border-slate-100" : ""}>
                    <td className="px-5 py-4 font-medium text-slate-900">{faq.key}</td>
                    <td className="px-5 py-4">{faq.title}</td>
                    <td className="px-5 py-4">{faq.module}</td>
                    <td className="px-5 py-4">{faq.updatedAt}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white">编辑</button>
                        <button className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
