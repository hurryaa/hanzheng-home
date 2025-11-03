import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { useTheme } from '@/hooks/useTheme';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // 导航到会员页面并带上搜索参数
      navigate(`/members?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`shadow-sm z-10 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800 ml-4 lg:ml-0">
              汗蒸养生馆管理系统
            </h2>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
  {/* 搜索框 */}
  <div className="relative hidden sm:block">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <i className="fa-solid fa-search text-gray-400"></i>
    </div>
    <input
      type="text"
      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-48 md:w-64 pl-10 pr-3 py-2 transition-all duration-200"
      placeholder="搜索会员..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
    />
    {searchQuery && (
      <button
        onClick={() => setSearchQuery('')}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
      >
        <i className="fa-solid fa-times"></i>
      </button>
    )}
  </div>

  {/* 移动端搜索按钮 */}
  <button
    onClick={handleSearch}
    className="sm:hidden p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
    aria-label="搜索"
  >
    <i className="fa-solid fa-search"></i>
  </button>

            {/* 主题切换 */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 ${
                theme === 'light' 
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
              aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            >
              <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'} transition-transform duration-300 ${theme === 'dark' ? 'rotate-180' : ''}`}></i>
            </button>

            {/* 通知中心 */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 relative"
                aria-label="查看通知"
              >
                <i className="fa-solid fa-bell"></i>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {notificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fadeIn">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800">通知</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {/* 通知项 */}
                      <a
                        href="#"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-start"
                        role="menuitem"
                      >
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <i className="fa-solid fa-credit-card"></i>
                        </div>
                        <div>
                          <p>会员张三刚刚充值了1000元</p>
                          <p className="text-xs text-gray-500 mt-1">10分钟前</p>
                        </div>
                      </a>
                      
                      <a
                        href="#"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-start"
                        role="menuitem"
                      >
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                          <i className="fa-solid fa-ticket-alt"></i>
                        </div>
                        <div>
                          <p>会员李四购买了30次汗蒸次卡</p>
                          <p className="text-xs text-gray-500 mt-1">1小时前</p>
                        </div>
                      </a>
                      
                      <a
                        href="#"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-start"
                        role="menuitem"
                      >
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-3">
                          <i className="fa-solid fa-exclamation-circle"></i>
                        </div>
                        <div>
                          <p>王五的次卡即将过期（剩余3天）</p>
                          <p className="text-xs text-gray-500 mt-1">2小时前</p>
                        </div>
                      </a>
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200">
                      <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium text-center block">
                        查看所有通知
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 用户菜单 */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                id="user-menu-button"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="flex items-center">
                  <img
                    className="h-8 w-8 rounded-full object-cover border-2 border-white shadow"
                    src="https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=admin%20avatar%20male%20asian%20businessman&sign=e12b72a53e2396859dcec77c66698d14"
                    alt="用户头像"
                  />
                  <span className="ml-2 hidden md:block text-sm font-medium text-gray-700">管理员</span>
                  <i className={`fa-solid fa-chevron-down ml-1 text-xs hidden md:block ${userMenuOpen ? 'transform rotate-180' : ''}`}></i>
                </div>
              </button>

              {userMenuOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fadeIn"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button">
                  <div className="py-1" role="none">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <i className="fa-solid fa-user mr-2"></i>个人资料
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <i className="fa-solid fa-cog mr-2"></i>账户设置
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-red-400 transition-colors duration-200"
                      role="menuitem"
                    >
                      <i className="fa-solid fa-sign-out-alt mr-2"></i>退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}