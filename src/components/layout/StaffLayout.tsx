import React, { useContext, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';

export default function StaffLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/staff-login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { 
      label: '核销业务', 
      icon: { name: 'Shopping' },
      items: [
        { path: '/staff/dashboard', label: '工作台', icon: { name: 'Home' } },
        { path: '/staff/member-query', label: '会员查询与核销', icon: { name: 'Search' } },
        { path: '/staff/manual-purchase', label: '手动录入购买', icon: { name: 'Plus' } },
      ]
    },
    {
      label: '数据查询',
      icon: { name: 'BarChart3' },
      items: [
        { path: '/staff/records', label: '记录查询', icon: { name: 'FileText' } },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg hover:bg-gray-100 transition"
            >
              {sidebarOpen ? (
                <i className="fa-solid fa-xmark text-xl"></i>
              ) : (
                <i className="fa-solid fa-bars text-xl"></i>
              )}
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">汗蒸门店工作台</h1>
              <p className="text-sm text-gray-600">{user?.name}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <i className="fa-solid fa-sign-out-alt"></i>
            退出登录
          </button>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        {sidebarOpen && (
          <aside className="w-64 bg-white shadow-sm overflow-y-auto">
            <nav className="p-4 space-y-6">
              {navItems.map((group, groupIndex) => {
                const iconMap: Record<string, string> = {
                  'Home': 'fa-house',
                  'Search': 'fa-magnifying-glass',
                  'Plus': 'fa-plus',
                  'Shopping': 'fa-shopping-bag',
                  'FileText': 'fa-file-lines',
                  'BarChart3': 'fa-chart-bar',
                  'Settings': 'fa-gear',
                };
                
                return (
                  <div key={groupIndex}>
                    {/* 分组标题 */}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                      {group.label}
                    </p>
                    
                    {/* 分组内的菜单项 */}
                    <div className="space-y-1">
                      {'items' in group && group.items.map((item) => {
                        const iconClass = iconMap[item.icon.name] || 'fa-circle';
                        return (
                          <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition font-medium text-sm ${
                              isActive(item.path)
                                ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <i className={`fa-solid ${iconClass} w-4 text-center`}></i>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </aside>
        )}

        {/* 内容区域 */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
