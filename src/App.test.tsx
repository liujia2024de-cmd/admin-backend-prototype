import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("后台高保真原型", () => {
  it("默认进入登录页并显示登录标题", () => {
    window.history.pushState({}, "", "/login");
    render(<App />);
    expect(screen.getByRole("heading", { name: "登录" })).toBeInTheDocument();
    expect(screen.getByText("欢迎回来达芬奇黑洞IOT管理后台")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
  });

  it("访问设备列表页时展示统一设备列表标题", () => {
    window.history.pushState({}, "", "/devices");
    render(<App />);
    expect(screen.getByText("统一设备列表")).toBeInTheDocument();
    expect(screen.getByText("设备明细")).toBeInTheDocument();
  });

  it("访问未知路由时展示404页面", () => {
    window.history.pushState({}, "", "/unknown-page");
    render(<App />);
    expect(screen.getByText("404 Not Found")).toBeInTheDocument();
    expect(screen.getByText("这个页面还没有接入到后台工作台")).toBeInTheDocument();
  });

  it("后台成员页支持切换为无权限态", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/admin/users");
    render(<App />);

    await user.click(screen.getByRole("button", { name: "模拟无权限视角" }));

    expect(screen.getByText("当前账号暂无权限")).toBeInTheDocument();
    expect(screen.getByText("切回可管理视角")).toBeInTheDocument();
  });

  it("OTA页面支持上传新固件并进入版本列表", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/ota");
    render(<App />);

    await user.click(screen.getByRole("button", { name: "上传新固件" }));
    await user.type(screen.getByPlaceholderText("例如：中央控制夏季修复版"), "中央控制夏季修复版");
    await user.type(screen.getByPlaceholderText("v1.0.0_0512"), "v1.2.0_0603");
    await user.click(screen.getByRole("button", { name: "保存版本" }));

    expect(screen.getByText("中央控制夏季修复版")).toBeInTheDocument();
    expect(screen.getByText("v1.2.0_0603")).toBeInTheDocument();
  });
});
