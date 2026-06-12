import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { CalendarDays, ChevronDown, ImageIcon, LayoutTemplate, Link2, Megaphone, PlusCircle, UploadCloud, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Drawer } from "@/components/ui/Drawer";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/useToast";
import { bannerCampaigns, popupCampaigns } from "@/data/mock";

type OperationTab = "popup" | "banner";

type PopupCampaignItem = {
  id: string;
  name: string;
  title: string;
  image: string;
  imagePreviewUrl: string;
  copywriting: string;
  link: string;
  position: string;
  triggerCondition: string;
  frequency: string;
  startAt: string;
  endAt: string;
  target: string;
  priority: number;
  status: "草稿" | "进行中" | "已结束";
  confirmClicks: number;
};

type BannerCampaignItem = {
  id: string;
  name: string;
  image: string;
  imagePreviewUrl: string;
  link: string;
  title: string;
  subtitle: string;
  position: string;
  triggerCondition: string;
  frequency: string;
  target: string;
  startAt: string;
  endAt: string;
  priority: number;
  status: "草稿" | "已上线" | "已下线";
  clicks: number;
};

type CampaignInsight = {
  exposureUsers: number;
  openUsers: number;
  closeUsers: number;
  clickThroughRate: number;
  closeRate: number;
  targetReachRate: number;
  recommendedAction: string;
  bestWindow: string;
  topSegment: string;
};

type PublishActionState = {
  id: string;
  tab: OperationTab;
  nextStatus: PopupCampaignItem["status"] | BannerCampaignItem["status"];
  name: string;
  action: "publish" | "offline";
} | null;

const popupStatusOptions: PopupCampaignItem["status"][] = ["草稿", "进行中", "已结束"];
const bannerStatusOptions: BannerCampaignItem["status"][] = ["草稿", "已上线", "已下线"];
const popupPositionChoices = ["App首页", "设备首页", "订阅升级页", "AI服务页"];
const popupTriggerChoices = ["打开App时", "进入设备页时", "进入AI页时", "点击升级入口时"];
const popupFrequencyChoices = ["每天一次", "每3天一次", "每7天一次", "活动周期仅一次"];
const popupTargetChoices = ["全量用户", "新注册用户", "高活跃已订阅用户", "流失订阅召回用户", "指定SN名单发布"];
const bannerPositionChoices = ["首页底部", "设备页底部", "AI页顶部", "订阅页顶部"];

const buildMockCampaignImageUrl = (scene: string, title: string) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    `mobile app campaign artwork, reptile iot product promotion, ${scene}, ${title}, clean blue visual design, premium marketing banner, realistic lighting, polished interface style`,
  )}&image_size=landscape_16_9`;

const hashSeed = (value: string) =>
  [...value].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);

function buildCampaignInsight(item: PopupCampaignItem | BannerCampaignItem, tab: OperationTab): CampaignInsight {
  const seed = hashSeed(`${tab}-${item.id}-${item.name}`);
  const baseClicks = tab === "popup" ? ("confirmClicks" in item ? item.confirmClicks : 0) : "clicks" in item ? item.clicks : 0;
  const exposureUsers = baseClicks * (18 + (seed % 11)) + 2400 + (seed % 900);
  const openUsers = Math.min(exposureUsers, baseClicks * (tab === "popup" ? 4 : 5) + 600 + (seed % 260));
  const closeUsers = Math.min(exposureUsers - openUsers, Math.round(exposureUsers * (0.18 + (seed % 8) / 100)));
  const clickThroughRate = Number(((openUsers / exposureUsers) * 100).toFixed(1));
  const closeRate = Number(((closeUsers / exposureUsers) * 100).toFixed(1));
  const targetReachRate = Number((56 + (seed % 28)).toFixed(1));

  let recommendedAction = "建议保持当前投放节奏，并继续观察曝光到点击的转化效率。";
  if (clickThroughRate < 12) {
    recommendedAction = "点击查看偏低，建议优化主视觉与标题文案，减少首屏信息负担。";
  } else if (closeRate > 24) {
    recommendedAction = "关闭率偏高，建议降低弹出频次，或缩短活动露出周期。";
  } else if (clickThroughRate > 18) {
    recommendedAction = "活动吸引力较强，建议扩大目标人群覆盖，并延长高峰时段投放。";
  }

  return {
    exposureUsers,
    openUsers,
    closeUsers,
    clickThroughRate,
    closeRate,
    targetReachRate,
    recommendedAction,
    bestWindow: seed % 2 === 0 ? "19:00 - 22:00" : "12:00 - 14:00",
    topSegment: tab === "popup" ? "高活跃已订阅用户" : "近 7 天查看过设备页用户",
  };
}

const initialPopupCampaigns: PopupCampaignItem[] = Array.from({ length: 8 }, (_, index) => {
  const base = popupCampaigns[index % popupCampaigns.length];
  const suffixes = ["首波拉新", "订阅召回", "云存促活", "AI唤醒", "节日活动", "会员续费", "新品试用", "设备加购"];
  return {
    id: `popup-${index + 1}`,
    name: `${base.name}-${suffixes[index]}`,
    title: index % 2 === 0 ? "限时开通专业版" : "AI 服务限时唤醒",
    image: `${popupPositionChoices[index % popupPositionChoices.length]}KV图`,
    imagePreviewUrl: buildMockCampaignImageUrl(popupPositionChoices[index % popupPositionChoices.length], suffixes[index]),
    copywriting:
      index % 2 === 0
        ? "开通专业版，解锁 7 天云存、AI 行为识别与精彩剪辑，活动期内限时可见。"
        : "面向沉默用户推送限时召回权益，降低流失并提升 AI 服务打开率。",
    link: index % 2 === 0 ? "/dashboard?tab=subscription" : "/dashboard?tab=ai",
    position: popupPositionChoices[index % popupPositionChoices.length],
    triggerCondition: popupTriggerChoices[index % popupTriggerChoices.length],
    frequency: popupFrequencyChoices[index % popupFrequencyChoices.length],
    startAt: `2026-06-${String(1 + index).padStart(2, "0")}T10:00`,
    endAt: `2026-06-${String(18 + (index % 9)).padStart(2, "0")}T23:59`,
    target: popupTargetChoices[index % popupTargetChoices.length],
    priority: 55 + index * 5,
    status: (index < 4 ? "进行中" : index < 6 ? "草稿" : "已结束") as PopupCampaignItem["status"],
    confirmClicks: base.confirmClicks + index * 38,
  };
});

const initialBannerCampaigns: BannerCampaignItem[] = Array.from({ length: 8 }, (_, index) => {
  const base = bannerCampaigns[index % bannerCampaigns.length];
  const names = ["会员升级", "AI能力推荐", "云存储转化", "设备加购", "新品发售", "活动召回", "内容专题", "老客复购"];
  return {
    id: `banner-${index + 1}`,
    name: `${base.name}-${names[index]}`,
    image: `${bannerPositionChoices[index % bannerPositionChoices.length]}主视觉`,
    imagePreviewUrl: buildMockCampaignImageUrl(bannerPositionChoices[index % bannerPositionChoices.length], names[index]),
    link: index % 2 === 0 ? "/dashboard?tab=subscription" : "/dashboard?tab=ai",
    title: `${base.title} · ${names[index]}`,
    subtitle: base.subtitle,
    position: bannerPositionChoices[index % bannerPositionChoices.length],
    triggerCondition: popupTriggerChoices[index % popupTriggerChoices.length],
    frequency: popupFrequencyChoices[index % popupFrequencyChoices.length],
    target: popupTargetChoices[index % popupTargetChoices.length],
    startAt: `2026-06-${String(3 + index).padStart(2, "0")}T09:00`,
    endAt: `2026-06-${String(20 + (index % 8)).padStart(2, "0")}T23:59`,
    priority: 50 + index * 6,
    status: (index < 5 ? "已上线" : index < 7 ? "草稿" : "已下线") as BannerCampaignItem["status"],
    clicks: base.clicks + index * 62,
  };
});

function getStatusTone(status: string) {
  if (status === "进行中" || status === "已上线") return "green" as const;
  if (status === "草稿") return "amber" as const;
  return "rose" as const;
}

export default function OperationsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const activeTab: OperationTab = location.pathname.endsWith("/banner") ? "banner" : "popup";
  const [popupRows, setPopupRows] = useState(initialPopupCampaigns);
  const [bannerRows, setBannerRows] = useState(initialBannerCampaigns);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<{ tab: OperationTab; item: PopupCampaignItem | BannerCampaignItem } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [publishAction, setPublishAction] = useState<PublishActionState>(null);
  const [testPublishOpen, setTestPublishOpen] = useState(false);
  const [testSnInput, setTestSnInput] = useState("");
  const [imagePreview, setImagePreview] = useState<{ name: string; url: string } | null>(null);
  const popupImageInputRef = useRef<HTMLInputElement | null>(null);
  const bannerImageInputRef = useRef<HTMLInputElement | null>(null);
  const [popupDraft, setPopupDraft] = useState<PopupCampaignItem>({
    id: "",
    name: "",
    title: "",
    image: "",
    imagePreviewUrl: "",
    copywriting: "",
    link: "",
    position: "App首页",
    triggerCondition: "打开App时",
    frequency: "每天一次",
    startAt: "2026-06-10T10:00",
    endAt: "2026-06-20T23:59",
    target: "全量用户",
    priority: 50,
    status: "草稿",
    confirmClicks: 0,
  });
  const [bannerDraft, setBannerDraft] = useState<BannerCampaignItem>({
    id: "",
    name: "",
    image: "",
    imagePreviewUrl: "",
    link: "",
    title: "",
    subtitle: "",
    position: "首页底部",
    triggerCondition: "打开App时",
    frequency: "每天一次",
    target: "全量用户",
    startAt: "2026-06-10T10:00",
    endAt: "2026-06-20T23:59",
    priority: 50,
    status: "草稿",
    clicks: 0,
  });

  const popupActiveCount = useMemo(() => popupRows.filter((item) => item.status === "进行中").length, [popupRows]);
  const bannerActiveCount = useMemo(() => bannerRows.filter((item) => item.status === "已上线").length, [bannerRows]);

  const openNativeDatePicker = (input: HTMLInputElement) => {
    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  };

  useEffect(() => {
    setStatusFilter("");
    setPositionFilter("");
    setKeyword("");
    setStartDate("");
    setEndDate("");
    setDateOpen(false);
    setCurrentPage(1);
  }, [activeTab]);

  const popupPositionOptions = useMemo(() => [...new Set(popupRows.map((item) => item.position))], [popupRows]);
  const bannerPositionOptions = useMemo(() => [...new Set(bannerRows.map((item) => item.position))], [bannerRows]);

  const filteredPopupRows = useMemo(
    () =>
      popupRows.filter((item) => {
        const matchesKeyword =
          !keyword.trim() ||
          item.name.toLowerCase().includes(keyword.trim().toLowerCase()) ||
          item.target.toLowerCase().includes(keyword.trim().toLowerCase());
        const matchesStatus = !statusFilter || item.status === statusFilter;
        const matchesPosition = !positionFilter || item.position === positionFilter;
        const start = item.startAt.slice(0, 10);
        const matchesStartDate = !startDate || start >= startDate;
        const matchesEndDate = !endDate || start <= endDate;
        return matchesKeyword && matchesStatus && matchesPosition && matchesStartDate && matchesEndDate;
      }),
    [endDate, keyword, popupRows, positionFilter, startDate, statusFilter],
  );

  const filteredBannerRows = useMemo(
    () =>
      bannerRows.filter((item) => {
        const matchesKeyword =
          !keyword.trim() ||
          item.name.toLowerCase().includes(keyword.trim().toLowerCase()) ||
          item.title.toLowerCase().includes(keyword.trim().toLowerCase());
        const matchesStatus = !statusFilter || item.status === statusFilter;
        const matchesPosition = !positionFilter || item.position === positionFilter;
        const start = item.startAt.slice(0, 10);
        const matchesStartDate = !startDate || start >= startDate;
        const matchesEndDate = !endDate || start <= endDate;
        return matchesKeyword && matchesStatus && matchesPosition && matchesStartDate && matchesEndDate;
      }),
    [bannerRows, endDate, keyword, positionFilter, startDate, statusFilter],
  );

  const currentRows = activeTab === "popup" ? filteredPopupRows : filteredBannerRows;
  const currentPositionOptions = activeTab === "popup" ? popupPositionOptions : bannerPositionOptions;
  const currentStatusOptions = activeTab === "popup" ? popupStatusOptions : bannerStatusOptions;
  const currentCampaignInsight = useMemo(
    () => (detailCampaign ? buildCampaignInsight(detailCampaign.item, detailCampaign.tab) : null),
    [detailCampaign],
  );
  const totalPages = Math.max(1, Math.ceil(currentRows.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * pageSize;
    return currentRows.slice(startIndex, startIndex + pageSize);
  }, [currentPageSafe, currentRows, pageSize]);
  const visiblePageNumbers = useMemo(() => {
    const start = Math.max(1, currentPageSafe - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);
    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [currentPageSafe, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, positionFilter, startDate, endDate, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter("");
    setPositionFilter("");
    setStartDate("");
    setEndDate("");
    setDateOpen(false);
  };

  const openCreateDrawer = () => {
    setEditingId(null);
    if (activeTab === "popup") {
      setPopupDraft({
        id: "",
        name: "",
        title: "",
        image: "",
        imagePreviewUrl: "",
        copywriting: "",
        link: "",
        position: "App首页",
        triggerCondition: "打开App时",
        frequency: "每天一次",
        startAt: "2026-06-10T10:00",
        endAt: "2026-06-20T23:59",
        target: "全量用户",
        priority: 50,
        status: "草稿",
        confirmClicks: 0,
      });
    } else {
      setBannerDraft({
        id: "",
        name: "",
        image: "",
        imagePreviewUrl: "",
        link: "",
        title: "",
        subtitle: "",
        position: "首页底部",
        triggerCondition: "打开App时",
        frequency: "每天一次",
        target: "全量用户",
        startAt: "2026-06-10T10:00",
        endAt: "2026-06-20T23:59",
        priority: 50,
        status: "草稿",
        clicks: 0,
      });
    }
    setDrawerOpen(true);
  };

  const openDetailDrawer = (item: PopupCampaignItem | BannerCampaignItem, tab: OperationTab) => {
    setDetailCampaign({ item, tab });
    setDetailOpen(true);
  };

  const openEditDrawer = (id: string) => {
    setEditingId(id);
    if (activeTab === "popup") {
      const target = popupRows.find((item) => item.id === id);
      if (!target) return;
      setPopupDraft(target);
    } else {
      const target = bannerRows.find((item) => item.id === id);
      if (!target) return;
      setBannerDraft(target);
    }
    setDrawerOpen(true);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>, tab: OperationTab) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (tab === "popup") {
      setPopupDraft((current) => ({ ...current, image: file.name, imagePreviewUrl: previewUrl }));
    } else {
      setBannerDraft((current) => ({ ...current, image: file.name, imagePreviewUrl: previewUrl }));
    }
    event.target.value = "";
  };

  const saveCurrentDraft = () => {
    if (activeTab === "popup") {
      if (!popupDraft.name.trim()) {
        showToast({ tone: "warning", title: "请填写活动名称", description: "弹窗活动名称不能为空。" });
        return;
      }
      if (!popupDraft.image.trim()) {
        showToast({ tone: "warning", title: "请上传活动配图", description: "弹窗活动需要上传活动配图后才能保存。" });
        return;
      }
      if (!popupDraft.link.trim()) {
        showToast({ tone: "warning", title: "请填写活动详情链接", description: "弹窗活动需要配置活动详情链接后才能保存。" });
        return;
      }
      const nextRow = { ...popupDraft, id: editingId ?? `popup-${Date.now()}` };
      setPopupRows((current) => (editingId ? current.map((item) => (item.id === editingId ? nextRow : item)) : [nextRow, ...current]));
    } else {
      if (!bannerDraft.name.trim()) {
        showToast({ tone: "warning", title: "请填写活动名称", description: "Banner 活动名称不能为空。" });
        return;
      }
      if (!bannerDraft.image.trim()) {
        showToast({ tone: "warning", title: "请上传活动配图", description: "Banner 活动需要上传活动配图后才能保存。" });
        return;
      }
      if (!bannerDraft.link.trim()) {
        showToast({ tone: "warning", title: "请填写活动详情链接", description: "Banner 活动需要配置活动详情链接后才能保存。" });
        return;
      }
      const nextRow = { ...bannerDraft, id: editingId ?? `banner-${Date.now()}` };
      setBannerRows((current) => (editingId ? current.map((item) => (item.id === editingId ? nextRow : item)) : [nextRow, ...current]));
    }
    setDrawerOpen(false);
    showToast({
      tone: "success",
      title: editingId ? "活动已更新" : "活动已创建",
      description: activeTab === "popup" ? "弹窗活动配置已保存。" : "Banner 活动配置已保存。",
    });
  };

  const requestStatusChange = (id: string, tab: OperationTab) => {
    if (tab === "popup") {
      const target = popupRows.find((item) => item.id === id);
      if (!target) return;
      if (target.status === "已结束") {
        showToast({ tone: "warning", title: "活动已结束", description: "已结束的弹窗活动不可重复投放，请新建活动。" });
        return;
      }
      const nextStatus = target.status === "草稿" ? "进行中" : "已结束";
      if (target.status === "草稿") {
        setPublishAction({ id, tab, nextStatus, name: target.name, action: "publish" });
        return;
      }
      setPublishAction({ id, tab, nextStatus, name: target.name, action: "offline" });
      return;
    }

    const target = bannerRows.find((item) => item.id === id);
    if (!target) return;
    if (target.status === "已下线") {
      showToast({ tone: "warning", title: "活动已下线", description: "已下线 Banner 请通过编辑复制后重新创建。" });
      return;
    }
    const nextStatus = target.status === "草稿" ? "已上线" : "已下线";
    if (target.status === "草稿") {
      setPublishAction({ id, tab, nextStatus, name: target.name, action: "publish" });
      return;
    }
    setPublishAction({ id, tab, nextStatus, name: target.name, action: "offline" });
  };

  const confirmPublishAction = () => {
    if (!publishAction) return;
    if (publishAction.tab === "popup") {
      setPopupRows((current) => current.map((item) => (item.id === publishAction.id ? { ...item, status: publishAction.nextStatus as PopupCampaignItem["status"] } : item)));
      showToast({
        tone: "success",
        title: publishAction.action === "publish" ? "活动已发布" : "活动已下线",
        description: publishAction.action === "publish" ? `${publishAction.name} 已开始投放。` : `${publishAction.name} 已提前结束投放。`,
      });
    } else {
      setBannerRows((current) => current.map((item) => (item.id === publishAction.id ? { ...item, status: publishAction.nextStatus as BannerCampaignItem["status"] } : item)));
      showToast({
        tone: "success",
        title: publishAction.action === "publish" ? "Banner 已上线" : "Banner 已下线",
        description: publishAction.action === "publish" ? `${publishAction.name} 已开始投放。` : `${publishAction.name} 已提前结束展示。`,
      });
    }
    setPublishAction(null);
  };

  const openTestPublish = () => {
    if (!popupDraft.name.trim()) {
      showToast({ tone: "warning", title: "请先填写活动名称", description: "建议先把活动基本信息补全，再执行测试发布。" });
      return;
    }
    if (!popupDraft.image.trim()) {
      showToast({ tone: "warning", title: "请先上传活动配图", description: "测试发布前需要先准备好活动配图。" });
      return;
    }
    setTestPublishOpen(true);
  };

  const confirmTestPublish = () => {
    const snList = testSnInput
      .split(/[\n,，\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!snList.length) {
      showToast({ tone: "warning", title: "请填写测试设备 SN", description: "至少填写一个设备 SN，多个 SN 可用逗号或换行分隔。" });
      return;
    }
    setTestPublishOpen(false);
    showToast({
      tone: "success",
      title: "测试发布已提交",
      description: `${popupDraft.name || "当前活动"} 已向 ${snList.length} 台指定设备发起测试投放。`,
    });
  };

  const openEditFromDetail = () => {
    if (!detailCampaign) return;
    setDetailOpen(false);
    openEditDrawer(detailCampaign.item.id);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Panel
          title="运营活动管理"
          description="统一管理首页弹窗和 Banner 运营位，支持筛选、创建、编辑、发布与下线。"
          action={
            <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1B8BFA] px-4 py-2.5 text-sm font-medium text-white" onClick={openCreateDrawer}>
              <PlusCircle className="h-4 w-4" />
              新增活动
            </button>
          }
          overflowVisible
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/operations/popup")}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === "popup" ? "bg-[#1B8BFA] text-white shadow-[0_10px_24px_rgba(27,139,250,0.18)]" : "border border-[#d8ebff] bg-white text-[#6287b0]"
                }`}
              >
                <Megaphone className="h-4 w-4" />
                弹窗活动
              </button>
              <button
                type="button"
                onClick={() => navigate("/operations/banner")}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === "banner" ? "bg-[#1B8BFA] text-white shadow-[0_10px_24px_rgba(27,139,250,0.18)]" : "border border-[#d8ebff] bg-white text-[#6287b0]"
                }`}
              >
                <LayoutTemplate className="h-4 w-4" />
                Banner活动
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr_0.9fr_1fr_auto]">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                placeholder={activeTab === "popup" ? "按活动名称或目标用户搜索" : "按活动名称或标题搜索"}
              />
              <div className="relative">
                <select value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                  <option value="">全部位置</option>
                  {currentPositionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="relative">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                  <option value="">全部状态</option>
                  {currentStatusOptions.map((option) => (
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
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700"
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
              <button type="button" className="rounded-2xl bg-[#1B8BFA] px-5 py-3 text-sm font-medium text-white" onClick={() => setDateOpen(false)}>
                查询
              </button>
            </div>
          </div>
        </Panel>

        {activeTab === "popup" ? (
          <Panel title={`弹窗活动列表 · 进行中 ${popupActiveCount} 个`} description="支持频率、目标用户、开始结束时间、优先级和发布下线管理" padded={false}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {["活动名称", "配图/文案", "目标用户", "开始时间", "结束时间", "优先级", "状态", "操作"].map((head) => (
                      <th key={head} className="px-5 py-4 font-medium">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((item, index) => {
                    if (!("confirmClicks" in item)) return null;
                    const insight = buildCampaignInsight(item, "popup");
                    return (
                    <tr key={item.id} className={index !== paginatedRows.length - 1 ? "border-b border-slate-100" : ""}>
                      <td className="px-5 py-4 font-medium text-slate-900">{item.name}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#1B8BFA]">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                          <div className="max-w-[220px]">
                            <div className="line-clamp-2 text-slate-700">{item.copywriting}</div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-[#6f8fb3]">
                              <Link2 className="h-3.5 w-3.5" />
                              {item.link}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">{item.target}</td>
                      <td className="px-5 py-4">{item.startAt.replace("T", " ")}</td>
                      <td className="px-5 py-4">{item.endAt.replace("T", " ")}</td>
                      <td className="px-5 py-4">{item.priority}</td>
                      <td className="px-5 py-4">
                        <StatusBadge value={item.status} tone={getStatusTone(item.status)} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button className="rounded-full border border-[#d8ebff] bg-white px-3 py-1.5 text-xs font-medium text-[#1B8BFA]" onClick={() => openDetailDrawer(item, "popup")}>
                            查看详情
                          </button>
                          <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white" onClick={() => openEditDrawer(item.id)}>
                            编辑
                          </button>
                          <button className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700" onClick={() => requestStatusChange(item.id, "popup")}>
                            {item.status === "草稿" ? "发布" : item.status === "进行中" ? "下线" : "不可重复投放"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
              <div className="text-sm text-[#6f8fb3]">
                共 {currentRows.length} 条，当前第 {currentPageSafe} / {totalPages} 页
              </div>
              <div className="flex items-center gap-3">
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none">
                  {[5, 10, 20].map((size) => (
                    <option key={size} value={size}>
                      每页 {size} 条
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300" disabled={currentPageSafe === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
                    上一页
                  </button>
                  {visiblePageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        currentPageSafe === pageNumber ? "bg-[#1B8BFA] text-white" : "border border-slate-200 text-slate-700"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button type="button" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300" disabled={currentPageSafe === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel title={`Banner活动列表 · 已上线 ${bannerActiveCount} 个`} description="支持首页底部和设备页底部广告位的标题、副标题、优先级和上线下线管理" padded={false}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {["活动名称", "主标题/副标题/配图", "开始时间", "结束时间", "优先级", "状态", "操作"].map((head) => (
                      <th key={head} className="px-5 py-4 font-medium">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((item, index) => {
                    if (!("clicks" in item)) return null;
                    const insight = buildCampaignInsight(item, "banner");
                    return (
                    <tr key={item.id} className={index !== paginatedRows.length - 1 ? "border-b border-slate-100" : ""}>
                      <td className="px-5 py-4 font-medium text-slate-900">{item.name}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#1B8BFA]">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                          <div className="max-w-[220px]">
                            <div className="line-clamp-1 font-medium text-slate-900">{item.title || "-"}</div>
                            <div className="mt-1 line-clamp-1 text-xs text-[#6f8fb3]">{item.subtitle || "未填写副标题"}</div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-[#6f8fb3]">
                              <ImageIcon className="h-3.5 w-3.5" />
                              {item.image}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">{item.startAt.replace("T", " ")}</td>
                      <td className="px-5 py-4">{item.endAt.replace("T", " ")}</td>
                      <td className="px-5 py-4">{item.priority}</td>
                      <td className="px-5 py-4">
                        <StatusBadge value={item.status} tone={getStatusTone(item.status)} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button className="rounded-full border border-[#d8ebff] bg-white px-3 py-1.5 text-xs font-medium text-[#1B8BFA]" onClick={() => openDetailDrawer(item, "banner")}>
                            查看详情
                          </button>
                          <button className="rounded-full bg-[#1B8BFA] px-3 py-1.5 text-xs font-medium text-white" onClick={() => openEditDrawer(item.id)}>
                            编辑
                          </button>
                          <button className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700" onClick={() => requestStatusChange(item.id, "banner")}>
                            {item.status === "草稿" ? "上线" : item.status === "已上线" ? "下线" : "不可重复投放"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
              <div className="text-sm text-[#6f8fb3]">
                共 {currentRows.length} 条，当前第 {currentPageSafe} / {totalPages} 页
              </div>
              <div className="flex items-center gap-3">
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none">
                  {[5, 10, 20].map((size) => (
                    <option key={size} value={size}>
                      每页 {size} 条
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300" disabled={currentPageSafe === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
                    上一页
                  </button>
                  {visiblePageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        currentPageSafe === pageNumber ? "bg-[#1B8BFA] text-white" : "border border-slate-200 text-slate-700"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button type="button" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300" disabled={currentPageSafe === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        )}

        <Drawer
          open={drawerOpen}
          title={editingId ? `编辑${activeTab === "popup" ? "弹窗活动" : "Banner活动"}` : `新增${activeTab === "popup" ? "弹窗活动" : "Banner活动"}`}
          description={activeTab === "popup" ? "维护弹窗活动的配图、文案、跳转链接、频率与目标用户；活动状态通过发布、下线和测试发布流程控制。" : "维护 Banner 的主视觉、标题文案、跳转链接、位置与上线节奏。"}
          onClose={() => setDrawerOpen(false)}
          footer={
            <div className="flex items-center justify-end gap-3">
              <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700" onClick={() => setDrawerOpen(false)}>
                取消
              </button>
              {activeTab === "popup" ? (
                <button className="rounded-2xl border border-[#d8ebff] bg-white px-4 py-3 text-sm font-medium text-[#1B8BFA]" onClick={openTestPublish}>
                  测试发布
                </button>
              ) : null}
              <button className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" onClick={saveCurrentDraft}>
                保存配置
              </button>
            </div>
          }
        >
          {activeTab === "popup" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900">活动名称（供内部查看）</div>
                <input value={popupDraft.name} onChange={(event) => setPopupDraft((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="请输入活动名称" />
              </div>

              <div className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                <div className="text-sm font-medium text-slate-900">用户可见内容</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input value={popupDraft.title} onChange={(event) => setPopupDraft((current) => ({ ...current, title: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none md:col-span-2" placeholder="活动标题（非必填）" />
                  <textarea value={popupDraft.copywriting} onChange={(event) => setPopupDraft((current) => ({ ...current, copywriting: event.target.value }))} className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none md:col-span-2" placeholder="活动正文描述（非必填）" />
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 md:col-span-2">
                    <input ref={popupImageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleImageUpload(event, "popup")} />
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-[#7395bc]">上传活动配图（必填）</div>
                        <div className="mt-1 truncate text-sm text-slate-700">{popupDraft.image || "暂未上传配图"}</div>
                      </div>
                      <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-[#d8ebff] bg-white px-3 py-2 text-sm font-medium text-[#1B8BFA]" onClick={() => popupImageInputRef.current?.click()}>
                        <UploadCloud className="h-4 w-4" />
                        上传配图
                      </button>
                    </div>
                  </div>
                  <input value={popupDraft.link} onChange={(event) => setPopupDraft((current) => ({ ...current, link: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none md:col-span-2" placeholder="添加活动详情链接（必填）" />
                </div>
              </div>

              <div className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                <div className="text-sm font-medium text-slate-900">活动显示设置</div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="relative">
                    <select value={popupDraft.position} onChange={(event) => setPopupDraft((current) => ({ ...current, position: event.target.value }))} className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                      {popupPositionChoices.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="relative">
                    <select value={popupDraft.triggerCondition} onChange={(event) => setPopupDraft((current) => ({ ...current, triggerCondition: event.target.value }))} className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                      {popupTriggerChoices.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="relative">
                    <select value={popupDraft.frequency} onChange={(event) => setPopupDraft((current) => ({ ...current, frequency: event.target.value }))} className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                      {popupFrequencyChoices.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900">活动目标人群</div>
                <div className="relative">
                  <select value={popupDraft.target} onChange={(event) => setPopupDraft((current) => ({ ...current, target: event.target.value }))} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                    {popupTargetChoices.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900">活动有效时间</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input type="datetime-local" value={popupDraft.startAt} onChange={(event) => setPopupDraft((current) => ({ ...current, startAt: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" />
                  <input type="datetime-local" value={popupDraft.endAt} onChange={(event) => setPopupDraft((current) => ({ ...current, endAt: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900">活动优先级</div>
                <input type="number" value={popupDraft.priority} onChange={(event) => setPopupDraft((current) => ({ ...current, priority: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="填写优先级，数字越大越优先" />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900">活动名称（供内部查看）</div>
                <input value={bannerDraft.name} onChange={(event) => setBannerDraft((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="请输入活动名称" />
              </div>

              <div className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                <div className="text-sm font-medium text-slate-900">用户可见内容</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input value={bannerDraft.title} onChange={(event) => setBannerDraft((current) => ({ ...current, title: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none md:col-span-2" placeholder="活动标题（非必填）" />
                  <textarea value={bannerDraft.subtitle} onChange={(event) => setBannerDraft((current) => ({ ...current, subtitle: event.target.value }))} className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none md:col-span-2" placeholder="活动正文描述（非必填）" />
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 md:col-span-2">
                    <input ref={bannerImageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleImageUpload(event, "banner")} />
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-[#7395bc]">上传活动配图（必填）</div>
                        <div className="mt-1 truncate text-sm text-slate-700">{bannerDraft.image || "暂未上传配图"}</div>
                      </div>
                      <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-[#d8ebff] bg-white px-3 py-2 text-sm font-medium text-[#1B8BFA]" onClick={() => bannerImageInputRef.current?.click()}>
                        <UploadCloud className="h-4 w-4" />
                        上传配图
                      </button>
                    </div>
                  </div>
                  <input value={bannerDraft.link} onChange={(event) => setBannerDraft((current) => ({ ...current, link: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none md:col-span-2" placeholder="添加活动详情链接（必填）" />
                </div>
              </div>

              <div className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                <div className="text-sm font-medium text-slate-900">活动显示设置</div>
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-[#7395bc]">Banner位选择</div>
                  <div className="relative">
                    <select value={bannerDraft.position} onChange={(event) => setBannerDraft((current) => ({ ...current, position: event.target.value }))} className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                      {bannerPositionChoices.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900">活动目标人群</div>
                <div className="relative">
                  <select value={bannerDraft.target} onChange={(event) => setBannerDraft((current) => ({ ...current, target: event.target.value }))} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none">
                    {popupTargetChoices.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900">活动有效时间</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input type="datetime-local" value={bannerDraft.startAt} onChange={(event) => setBannerDraft((current) => ({ ...current, startAt: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" />
                  <input type="datetime-local" value={bannerDraft.endAt} onChange={(event) => setBannerDraft((current) => ({ ...current, endAt: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-900">活动优先级</div>
                <input type="number" value={bannerDraft.priority} onChange={(event) => setBannerDraft((current) => ({ ...current, priority: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="填写优先级，数字越大越优先" />
              </div>
            </div>
          )}
        </Drawer>

        <Drawer
          open={detailOpen}
          title={detailCampaign ? `${detailCampaign.item.name} · 活动详情` : "活动详情"}
          description="查看活动曝光、点击查看、关闭/收起等核心效果指标，并辅助判断是否需要继续放量或优化文案。"
          onClose={() => setDetailOpen(false)}
          footer={
            <div className="flex items-center justify-end gap-3">
              <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700" onClick={() => setDetailOpen(false)}>
                关闭
              </button>
              <button className="rounded-2xl bg-[#1B8BFA] px-4 py-3 text-sm font-medium text-white" onClick={openEditFromDetail}>
                编辑活动
              </button>
            </div>
          }
        >
          {detailCampaign && currentCampaignInsight ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard label="曝光用户数" value={currentCampaignInsight.exposureUsers.toLocaleString()} tone="teal" subtext="活动触达的去重用户数" />
                <StatCard label="点击查看活动" value={currentCampaignInsight.openUsers.toLocaleString()} tone="violet" subtext={`查看率 ${currentCampaignInsight.clickThroughRate}%`} />
                <StatCard label="点击关闭/收起" value={currentCampaignInsight.closeUsers.toLocaleString()} tone="amber" subtext={`关闭率 ${currentCampaignInsight.closeRate}%`} />
                <StatCard label="目标用户覆盖率" value={`${currentCampaignInsight.targetReachRate}%`} tone="emerald" subtext="目标人群实际触达覆盖情况" />
              </div>

              <Panel title="活动基础信息" description="把活动配置、投放状态和当前效果放在一起，方便运营复盘。">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                    <div className="text-xs text-[#7395bc]">投放位置</div>
                    <div className="mt-1 font-medium text-slate-950">{detailCampaign.item.position}</div>
                    <div className="mt-4 text-xs text-[#7395bc]">活动状态</div>
                    <div className="mt-1">
                      <StatusBadge value={detailCampaign.item.status} tone={getStatusTone(detailCampaign.item.status)} />
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                    <div className="text-xs text-[#7395bc]">投放时间</div>
                    <div className="mt-1 font-medium text-slate-950">
                      {detailCampaign.item.startAt.replace("T", " ")} 至 {detailCampaign.item.endAt.replace("T", " ")}
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                    <div className="text-xs text-[#7395bc]">活动配图</div>
                    <div className="mt-3 flex items-start gap-3">
                      <button
                        type="button"
                        className="group relative h-14 w-14 overflow-hidden rounded-2xl border border-[#d8ebff] bg-[#eef6ff]"
                        onClick={() => setImagePreview({ name: detailCampaign.item.image, url: detailCampaign.item.imagePreviewUrl })}
                      >
                        {detailCampaign.item.imagePreviewUrl ? (
                          <img src={detailCampaign.item.imagePreviewUrl} alt={detailCampaign.item.image} className="h-full w-full object-cover transition group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#1B8BFA]">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-950">{detailCampaign.item.image}</div>
                        <button
                          type="button"
                          className="mt-1 text-xs font-medium text-[#1B8BFA]"
                          onClick={() => setImagePreview({ name: detailCampaign.item.image, url: detailCampaign.item.imagePreviewUrl })}
                        >
                          点击查看配图
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-[#7395bc]">跳转链接</div>
                    <div className="mt-1 break-all font-medium text-slate-950">{detailCampaign.item.link}</div>
                  </div>
                  <div className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                    <div className="text-xs text-[#7395bc]">目标用户</div>
                    <div className="mt-1 font-medium text-slate-950">
                      {"target" in detailCampaign.item ? detailCampaign.item.target : "全量浏览设备页用户"}
                    </div>
                    <div className="mt-4 text-xs text-[#7395bc]">优先级</div>
                    <div className="mt-1 font-medium text-slate-950">{detailCampaign.item.priority}</div>
                  </div>
                </div>
              </Panel>

              <Panel title="活动效果漏斗" description="帮助判断是曝光不足、点击不足，还是关闭率偏高。">
                <div className="space-y-4">
                  {[
                    { label: "曝光用户", value: currentCampaignInsight.exposureUsers, width: 100, note: "完成活动展示" },
                    { label: "点击查看活动", value: currentCampaignInsight.openUsers, width: Math.max(18, currentCampaignInsight.clickThroughRate), note: `占曝光 ${currentCampaignInsight.clickThroughRate}%` },
                    { label: "点击关闭/收起", value: currentCampaignInsight.closeUsers, width: Math.max(12, currentCampaignInsight.closeRate), note: `占曝光 ${currentCampaignInsight.closeRate}%` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[24px] border border-[#e5f1ff] bg-[#fbfdff] p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-950">{item.label}</span>
                        <span className="text-sm text-[#5f7ea5]">
                          {item.value.toLocaleString()} · {item.note}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-[#eaf4ff]">
                        <div className="h-3 rounded-full bg-[#1B8BFA]" style={{ width: `${Math.min(100, item.width)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

            </div>
          ) : null}
        </Drawer>

        <ConfirmModal
          open={Boolean(publishAction)}
          title={
            publishAction?.action === "offline"
              ? publishAction?.tab === "popup"
                ? "确认下线弹窗活动"
                : "确认下线 Banner 活动"
              : publishAction?.tab === "popup"
                ? "确认发布弹窗活动"
                : "确认上线 Banner 活动"
          }
          description={
            publishAction
              ? publishAction.action === "offline"
                ? `是否要提前结束活动“${publishAction.name}”？确认后，该活动将立即停止${publishAction.tab === "popup" ? "弹窗" : "Banner"}投放。`
                : `确认后，${publishAction.name} 将立即进入${publishAction.tab === "popup" ? "弹窗" : "Banner"}投放状态，请确认活动内容、投放时间和跳转链接已检查无误。`
              : ""
          }
          confirmText={
            publishAction?.action === "offline"
              ? "确认提前结束"
              : publishAction?.tab === "popup"
                ? "确认发布"
                : "确认上线"
          }
          cancelText={publishAction?.action === "offline" ? "暂不下线" : "再检查一下"}
          onCancel={() => setPublishAction(null)}
          onConfirm={confirmPublishAction}
        />

        <ConfirmModal
          open={testPublishOpen}
          title="测试发布到指定设备"
          description="用于先在指定设备上验证弹窗展示效果、点击跳转和关闭表现。多个 SN 可用逗号、空格或换行分隔。"
          confirmText="提交测试发布"
          cancelText="取消"
          onCancel={() => setTestPublishOpen(false)}
          onConfirm={confirmTestPublish}
        >
          <div className="space-y-4">
            <div className="rounded-[24px] border border-[#d8ebff] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_100%)] p-4">
              <div className="text-xs text-[#7395bc]">当前测试活动</div>
              <div className="mt-1 text-sm font-medium text-slate-950">{popupDraft.name || "未命名弹窗活动"}</div>
              <div className="mt-2 text-xs text-[#6f8fb3]">测试发布不会改变活动正式状态，仅用于验证展示和交互效果。</div>
            </div>
            <textarea
              value={testSnInput}
              onChange={(event) => setTestSnInput(event.target.value)}
              className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              placeholder={"请输入测试设备 SN\n例如：CAM20260512002\nCAM20260514009"}
            />
          </div>
        </ConfirmModal>

        {imagePreview ? (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-6 backdrop-blur-sm">
            <button className="absolute inset-0" aria-label="关闭图片预览" onClick={() => setImagePreview(null)} />
            <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] border border-[#d8ebff] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
              <div className="flex items-center justify-between border-b border-[#e8f3ff] px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-950">活动配图预览</div>
                  <div className="mt-1 text-xs text-[#6f8fb3]">{imagePreview.name}</div>
                </div>
                <button className="rounded-2xl border border-[#d7e9ff] p-2 text-[#5d8fc5] transition hover:bg-[#f2f8ff] hover:text-[#1B8BFA]" onClick={() => setImagePreview(null)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="bg-[#f7fbff] p-5">
                <div className="overflow-hidden rounded-[24px] bg-white">
                  {imagePreview.url ? (
                    <img src={imagePreview.url} alt={imagePreview.name} className="max-h-[72vh] w-full object-contain bg-[#eef6ff]" />
                  ) : (
                    <div className="flex h-[320px] items-center justify-center text-[#6f8fb3]">暂无可预览配图</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
