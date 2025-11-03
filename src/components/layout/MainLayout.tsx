import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/App';
import { useAccessibility } from '@/hooks/useAccessibility';


export default function MainLayout() {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const { announce } = useAccessibility();

  // 监听路由变化，重置滚动位置并强制重新渲染
  useEffect(() => {
    window.scrollTo(0, 0);

    // 为屏幕阅读器用户公告页面变化
    const pageNames: Record<string, string> = {
      '/dashboard': '仪表板',
      '/consumptions': '消费日志',
      '/recharges': '充值记录',
      '/member-cards': '次卡管理',
      '/members': '会员管理',
      '/settings': '系统设置',
      '/home': '首页'
    };

    const pageName = pageNames[location.pathname] || '页面';
    announce(`已导航到${pageName}页面`, 'polite');

    // 更新页面标题
    document.title = `${pageName} - 汗蒸养生馆管理系统`;

    // 添加调试日志
    console.log('路由变化:', location.pathname);
  }, [location.pathname, announce]);

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen" role="main">
      {/* 侧边栏 - 固定定位，不占据文档流空间 */}
      <nav role="navigation" aria-label="主导航">
        <Sidebar />
      </nav>

      {/* 主内容区域 - 大屏幕时为侧边栏留出空间，移动端占满宽度 */}
      <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300 ease-in-out">
        {/* 头部导航 */}
        <header role="banner">
          <Header />
        </header>

        {/* 主要内容区域 */}
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto"
          role="main"
          aria-label="主要内容区域"
          tabIndex={-1}
        >
          <ErrorBoundary>
            <Outlet key={location.pathname} />
          </ErrorBoundary>
        </main>

        {/* 页脚 */}
        <footer
          role="contentinfo"
          className="border-t py-4 px-6 text-center text-sm bg-white"
          aria-label="页脚信息"
        >
          <p>© 2025 汗蒸养生馆管理系统. 保留所有权利.</p>
        </footer>
      </div>
    </div>
  );
}