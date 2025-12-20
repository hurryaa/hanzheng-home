import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, type AuthUser } from '@/contexts/authContext';
import { validateAndInitData } from '@/lib/utils';
import { useAccessibility } from '@/hooks/useAccessibility';
import { getUserPermissions } from '@/lib/permissions';

// 页面组件
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ConsumptionLogs from "@/pages/ConsumptionLogs";
import Home from "@/pages/Home";
import Recharges from "@/pages/Recharges";
import MemberCards from "@/pages/MemberCards";
import Members from "@/pages/Members";
import Settings from "@/pages/Settings";
import StaffLogin from "@/pages/StaffLogin";
import StaffDashboard from "@/pages/StaffDashboard";
import StaffMemberQuery from "@/pages/StaffMemberQuery";
import StaffManualPurchase from "@/pages/StaffManualPurchase";
import StaffRecords from "@/pages/StaffRecords";
import PersonalCenter from "@/pages/PersonalCenter";
import DistributorCenter from "@/pages/DistributorCenter";
import AdminPackageManagement from "@/pages/AdminPackageManagement";

// 布局组件
import MainLayout from "@/components/layout/MainLayout";
import StaffLayout from "@/components/layout/StaffLayout";

// 保护路由组件
// 错误边界组件 - 防止单个页面崩溃导致整个应用崩溃
  export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null, errorInfo: React.ErrorInfo | null }> {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error("页面错误:", error, errorInfo);
      this.setState({ errorInfo });
      // 可以在这里添加错误日志上报逻辑
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <i className="fa-solid fa-exclamation-triangle text-red-500 text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">页面加载出错</h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {this.state.error?.message || '页面加载过程中发生错误，请刷新页面或返回主页'}
              </p>
              <div className="flex justify-center space-x-3">
                <button 
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null });
                    window.location.reload();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
                >
                  刷新页面
                </button>
                <button 
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null });
                    window.location.href = '/dashboard';
                  }}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200"
                >
                  返回主页
                </button>
              </div>
            </div>
          </div>
        );
      }

      return this.props.children;
    }
  }

// 保护路由组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = React.useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

// Staff保护路由
const StaffProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = React.useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/staff-login" replace />;
  }
  
  if (user?.role !== 'staff' && user?.role !== 'admin') {
    return <Navigate to="/staff-login" replace />;
  }
  
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const { announce } = useAccessibility();
     
  // 检查本地存储中的认证状态和初始化数据
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('userInfo');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser: AuthUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        setPermissions(getUserPermissions(parsedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse user info:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
      }
    }
    
    // 验证并初始化存储数据
    validateAndInitData();
    
    setLoading(false);
  }, []);

  const login = ({ token, user }: { token: string; user: AuthUser }) => {
    setIsAuthenticated(true);
    setToken(token);
    setUser(user);
    setPermissions(getUserPermissions(user));
    localStorage.setItem('authToken', token);
    localStorage.setItem('userInfo', JSON.stringify(user));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
    setPermissions([]);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
  };

  const hasPermission = useCallback((permission: string) => {
    return permissions.includes(permission);
  }, [permissions]);

  const isAdminUser = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  const isStaffUser = useCallback(() => {
    return user?.role === 'staff';
  }, [user]);

  const isRegularUser = useCallback(() => {
    return user?.role === 'user';
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated, 
        token, 
        user, 
        permissions, 
        hasPermission, 
        isAdmin: isAdminUser,
        isStaff: isStaffUser,
        isUser: isRegularUser,
        login, 
        logout 
      }}
    >
      {/* 跳转到主内容链接 - 可访问性增强 */}
      <a
        href="#main-content"
        className="skip-link"
        onFocus={() => announce('跳转到主内容链接已聚焦')}
      >
        跳转到主内容
      </a>

      {/* 主应用内容 */}
      <div id="app-root" role="application" aria-label="汗蒸养生馆管理系统">
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={isAuthenticated && user?.role === 'user' ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/staff-login" element={isAuthenticated && (user?.role === 'staff' || user?.role === 'admin') ? <Navigate to="/staff/dashboard" replace /> : <StaffLogin />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 用户端主布局路由 - 需要认证 */}
          <Route path="/" element={<MainLayout />}>
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="personal" element={<ProtectedRoute><PersonalCenter /></ProtectedRoute>} />
            <Route path="distributor" element={<ProtectedRoute><DistributorCenter /></ProtectedRoute>} />
            <Route path="admin/packages" element={<ProtectedRoute><AdminPackageManagement /></ProtectedRoute>} />
            <Route path="consumptions" element={<ProtectedRoute><ConsumptionLogs /></ProtectedRoute>} />
            <Route path="recharges" element={<ProtectedRoute><Recharges /></ProtectedRoute>} />
            <Route path="member-cards" element={<ProtectedRoute><MemberCards /></ProtectedRoute>} />
            <Route path="members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
           {/* 确保每次路由切换时正确卸载组件 */}
          </Route>

          {/* 员工端布局路由 */}
          <Route path="/staff" element={<StaffLayout />}>
            <Route path="dashboard" element={<StaffProtectedRoute><StaffDashboard /></StaffProtectedRoute>} />
            <Route path="member-query" element={<StaffProtectedRoute><StaffMemberQuery /></StaffProtectedRoute>} />
            <Route path="manual-purchase" element={<StaffProtectedRoute><StaffManualPurchase /></StaffProtectedRoute>} />
            <Route path="records" element={<StaffProtectedRoute><StaffRecords /></StaffProtectedRoute>} />
          </Route>

          {/* 404 路由 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}
