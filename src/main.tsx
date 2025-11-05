import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { DBService } from './lib/db';
import "./index.css";

// 初始化数据库连接
const db = DBService.getInstance();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="mt-4 text-gray-600">正在连接数据库...</p>
  </div>
);

const ErrorScreen = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 px-4 text-center">
    <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
    <h1 className="mt-6 text-2xl font-semibold text-red-700">系统初始化失败</h1>
    <p className="mt-3 max-w-md text-red-600">{message}</p>
    <p className="mt-2 text-sm text-red-500">请检查后端服务或数据库配置后刷新页面重试。</p>
  </div>
);

root.render(<LoadingScreen />);

const renderApp = () => {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
        <Toaster position="top-center" />
      </BrowserRouter>
    </StrictMode>
  );
};

(async () => {
  try {
    await db.connect();
    renderApp();
  } catch (error) {
    console.error('数据库连接失败:', error);
    root.render(
      <>
        <ErrorScreen message={error instanceof Error ? error.message : '未知错误'} />
        <Toaster position="top-center" />
      </>
    );
  }
})();
