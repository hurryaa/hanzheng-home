import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MenuItem {
    title: string;
    icon: string;
    path: string;
    submenu?: {
        title: string;
        path: string;
    }[];
}

const menuItems: MenuItem[] = [{
    title: "仪表板",
    icon: "fa-tachometer-alt",
    path: "/dashboard"
}, {
    title: "消费管理",
    icon: "fa-receipt",
    path: "/consumptions"
}, {
    title: "会员充值",
    icon: "fa-credit-card",
    path: "/recharges"
}, {
    title: "次卡管理",
    icon: "fa-ticket-alt",
    path: "/member-cards"
}, {
    title: "会员管理",
    icon: "fa-users",
    path: "/members"
}, {
    title: "系统设置",
    icon: "fa-cog",
    path: "/settings"
}];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // 切换子菜单展开状态
    const toggleMenu = useCallback((menuTitle: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuTitle)
                ? prev.filter(title => title !== menuTitle)
                : [...prev, menuTitle]
        );
    }, []);

    // 切换移动端菜单
    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => {
            const newState = !prev;
            console.log('移动端菜单切换:', prev, '->', newState);
            return newState;
        });
    }, []);

    // 关闭移动端菜单
    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    // 监听路由变化，自动展开当前菜单
    useEffect(() => {
        const activeMenu = menuItems.find(
            item => location.pathname.startsWith(item.path) ||
                   (item.submenu && item.submenu.some(sub => location.pathname.startsWith(sub.path)))
        );

        if (activeMenu && activeMenu.submenu && !expandedMenus.includes(activeMenu.title)) {
            setExpandedMenus(prev => [...prev, activeMenu.title]);
        }
    }, [location.pathname, expandedMenus]);

    // 处理窗口大小变化
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 判断菜单是否激活
    const isMenuActive = useCallback((menuItem: MenuItem) => {
        if (location.pathname === menuItem.path) return true;

        if (menuItem.submenu) {
            return menuItem.submenu.some(sub => location.pathname === sub.path);
        }

        return false;
    }, [location.pathname]);

    // 判断子菜单是否激活
    const isSubmenuActive = useCallback((submenuPath: string) => {
        return location.pathname === submenuPath;
    }, [location.pathname]);

    // 处理菜单点击
    const handleMenuClick = useCallback((menu: MenuItem) => {
        if (menu.submenu) {
            toggleMenu(menu.title);
        } else {
            navigate(menu.path);
            // 移动端点击后关闭菜单
            if (isMobileMenuOpen) {
                closeMobileMenu();
            }
        }
    }, [navigate, toggleMenu, isMobileMenuOpen, closeMobileMenu]);

    return (
        <>
            {/* 移动端菜单按钮 */}
            <button
                onClick={toggleMobileMenu}
                className="lg:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200"
                aria-label="切换菜单"
            >
                <i className={`fa-solid ${isMobileMenuOpen ? "fa-times" : "fa-bars"} text-lg`}></i>
            </button>

            {/* 移动端遮罩层 */}
            {isMobileMenuOpen && (
                <div
                    onClick={closeMobileMenu}
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                    aria-hidden="true"
                />
            )}

            {/* 侧边栏主体 */}
            <div className={cn(
                "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg z-40 flex flex-col",
                "transform transition-transform duration-300 ease-in-out",
                // 大屏幕时始终显示
                "lg:translate-x-0",
                // 移动端根据状态显示/隐藏
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* 顶部标题 */}
                <div className="flex items-center justify-center h-16 bg-blue-600 text-white shadow-sm flex-shrink-0">
                    <i className="fa-solid fa-hot-tub text-2xl mr-2"></i>
                    <h1 className="text-xl font-bold">汗蒸养生馆</h1>
                </div>

                {/* 导航菜单 */}
                <nav className="flex-1 overflow-y-auto py-4 px-2">
                    <div className="space-y-1">
                        {menuItems.map(menu => (
                            <div key={menu.title}>
                                <button
                                    onClick={() => handleMenuClick(menu)}
                                    className={cn(
                                        "flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                                        isMenuActive(menu)
                                            ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600"
                                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    )}
                                >
                                    <i className={cn(
                                        `fa-solid ${menu.icon} mr-3 transition-colors duration-200`,
                                        isMenuActive(menu) ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                                    )}></i>
                                    <span className="flex-1 text-left">{menu.title}</span>
                                    {menu.submenu && (
                                        <i className={cn(
                                            "fa-solid ml-auto transition-transform duration-200",
                                            expandedMenus.includes(menu.title) ? "fa-chevron-down" : "fa-chevron-right"
                                        )}></i>
                                    )}
                                </button>

                                {/* 子菜单 */}
                                {menu.submenu && expandedMenus.includes(menu.title) && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        {menu.submenu.map(submenu => (
                                            <Link
                                                key={submenu.title}
                                                to={submenu.path}
                                                onClick={closeMobileMenu}
                                                className={cn(
                                                    "flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200",
                                                    isSubmenuActive(submenu.path)
                                                        ? "bg-blue-50 text-blue-700 font-medium"
                                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                                )}
                                            >
                                                {submenu.title}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </nav>

                {/* 底部版本信息 */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">系统版本</p>
                        <p className="text-sm font-medium text-gray-900">v1.0.0</p>
                    </div>
                </div>
            </div>
        </>
    );
}