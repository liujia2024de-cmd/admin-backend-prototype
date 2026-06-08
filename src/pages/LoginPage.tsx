import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { AdvinciLogo } from "@/components/brand/AdvinciLogo";

const loginIllustration =
  "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=realistic%20leopard%20gecko%20inside%20a%20premium%20naturalistic%20terrarium%2C%20entire%20head%20fully%20visible%2C%20head%20not%20cropped%2C%20lush%20reptile%20landscaping%2C%20natural%20rocks%2C%20branches%2C%20moss%2C%20warm%20habitat%20details%2C%20gecko%20positioned%20slightly%20right%20of%20center%2C%20soft%20natural%20lighting%2C%20high-end%20editorial%20photography%2C%20no%20text%2C%20no%20watermark&image_size=portrait_4_3";

export default function LoginPage() {
  const [appRegion, setAppRegion] = useState<"cn" | "global">("cn");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [error, setError] = useState("");
  const [failedCount, setFailedCount] = useState(0);
  const [lockedSeconds, setLockedSeconds] = useState(0);

  useEffect(() => {
    if (!lockedSeconds) return;
    const timer = window.setInterval(() => {
      setLockedSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockedSeconds]);

  const lockMessage = useMemo(() => {
    if (!lockedSeconds) return "";
    const minutes = String(Math.floor(lockedSeconds / 60)).padStart(2, "0");
    const seconds = String(lockedSeconds % 60).padStart(2, "0");
    return `账号已锁定，剩余 ${minutes}:${seconds} 后可再次尝试`;
  }, [lockedSeconds]);

  const regionMeta = useMemo(
    () =>
      appRegion === "cn"
        ? {
            label: "中国版",
            welcome: "欢迎回来达芬奇黑洞IOT管理后台",
            usernamePlaceholder: "请输入中国版后台用户名",
            supportText: "支持微信支付、支付宝、国内短信通知与中国区服务配置",
          }
        : {
            label: "全球版",
            welcome: "欢迎回来达芬奇黑洞IOT管理后台（Global）",
            usernamePlaceholder: "请输入全球版后台用户名",
            supportText: "支持 Stripe、全球区域服务部署、海外消息与多区域运营配置",
          },
    [appRegion],
  );

  const submit = () => {
    if (lockedSeconds > 0) {
      setError(lockMessage);
      return;
    }
    if (!username.trim() || !password.trim() || !captcha.trim()) {
      setError("用户名、密码和验证码均为必填项。");
      return;
    }

    if (username === "today_admin" && password === "Admin@123" && captcha.toUpperCase() === "8H4Q") {
      window.location.href = "/dashboard";
      return;
    }

    const nextFailed = failedCount + 1;
    setFailedCount(nextFailed);
    if (nextFailed >= 5) {
      setLockedSeconds(30 * 60);
      setError("连续 5 次登录失败，账号已锁定 30 分钟。");
      return;
    }
    setError(`账号或验证码错误，已失败 ${nextFailed} 次。`);
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] px-6 py-10 text-slate-950 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#e7f3ff_0%,#f3f9ff_100%)] lg:flex lg:min-h-[760px]">
            <img
              src={loginIllustration}
              alt="守宫展示图"
              className="absolute inset-0 h-full w-full object-cover object-[65%_center]"
            />
          </section>

          <section className="flex items-center justify-center px-8 py-10 lg:px-12">
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between gap-4">
                <AdvinciLogo tone="blue" size="md" />
                <div className="inline-flex rounded-full bg-[#f3f8ff] p-1">
                  {[
                    { key: "cn", label: "中国版" },
                    { key: "global", label: "全球版" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setAppRegion(item.key as "cn" | "global")}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        appRegion === item.key
                          ? "bg-[#1B8BFA] text-white shadow-[0_10px_24px_rgba(27,139,250,0.18)]"
                          : "text-[#6f8fb3]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">登录</h1>
                <p className="mt-2 text-sm leading-6 text-[#7891af]">{regionMeta.welcome}</p>
                <p className="mt-2 text-xs leading-6 text-[#90a4bf]">{regionMeta.supportText}</p>
              </div>

              <div className="mt-8 space-y-5">
                <label className="block">
                  <span className="text-sm font-medium text-slate-600">用户名</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition ${
                      error && !username.trim() ? "border-rose-300 bg-rose-50" : "border-[#d7e9ff] bg-white focus:border-[#1B8BFA] focus:bg-white"
                    }`}
                    placeholder={regionMeta.usernamePlaceholder}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-600">密码</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition ${
                      error && !password.trim() ? "border-rose-300 bg-rose-50" : "border-[#d7e9ff] bg-white focus:border-[#1B8BFA] focus:bg-white"
                    }`}
                    placeholder="请输入密码"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-[1fr_132px]">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-600">验证码</span>
                    <input
                      value={captcha}
                      onChange={(e) => setCaptcha(e.target.value)}
                      className={`mt-2 w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition ${
                        error && !captcha.trim() ? "border-rose-300 bg-rose-50" : "border-[#d7e9ff] bg-white focus:border-[#1B8BFA] focus:bg-white"
                      }`}
                      placeholder="请输入验证码"
                    />
                  </label>
                  <div className="flex items-end">
                    <div className="flex h-[54px] w-full items-center justify-center rounded-2xl border border-[#dcecff] bg-[#f3f9ff] text-sm font-semibold tracking-[0.2em] text-[#1B8BFA]">
                      8H4Q
                    </div>
                  </div>
                </div>
              </div>

              <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${lockedSeconds ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                {lockedSeconds ? (
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4" />
                    <span>{lockMessage}</span>
                  </div>
                ) : (
                  `连续 5 次登录失败后将锁定账号 30 分钟。当前为${regionMeta.label}登录，演示账号：today_admin / Admin@123 / 8H4Q`
                )}
              </div>

              {error ? <div className="mt-4 text-sm text-rose-600">{error}</div> : null}

              <button
                type="button"
                disabled={lockedSeconds > 0}
                onClick={submit}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B8BFA] px-5 py-4 text-sm font-medium text-white shadow-[0_16px_36px_rgba(27,139,250,0.22)] transition hover:bg-[#1577d9] disabled:cursor-not-allowed disabled:bg-[#8fc7ff]"
              >
                登录
                <ArrowRight className="h-4 w-4" />
              </button>

            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
