import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';

export default function StaffLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // 演示用的员工账号
  const DEMO_STAFF = {
    username: 'staff01',
    password: '123456',
    id: 'S001',
    name: '张三',
    storeId: 'STORE001',
    email: 'staff@example.com',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 尝试通过API登录
      const response = await apiClient.staffLogin(username, password);
      
      login({
        token: response.token,
        user: response.user,
      });

      toast.success('员工登录成功');
      navigate('/staff/dashboard');
    } catch (error) {
      // API失败时降级到演示账号
      console.warn('API登录失败，尝试演示账号...');
      
      if (username === DEMO_STAFF.username && password === DEMO_STAFF.password) {
        // 模拟成功登录
        const staffUser = {
          id: DEMO_STAFF.id,
          username: DEMO_STAFF.username,
          role: 'staff' as const,
          name: DEMO_STAFF.name,
          storeId: DEMO_STAFF.storeId,
          email: DEMO_STAFF.email,
        };

        login({
          token: `staff_token_${Date.now()}`,
          user: staffUser,
        });

        toast.success('员工登录成功（演示账号）');
        navigate('/staff/dashboard');
      } else {
        toast.error('用户名或密码错误');
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setUsername(DEMO_STAFF.username);
    setPassword(DEMO_STAFF.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">员工工作台</h1>
          <p className="text-gray-600 mt-2">汗蒸门店管理系统</p>
        </div>

        {/* 登录表单卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                员工账号
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入员工账号"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                disabled={loading}
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-sign-in-alt"></i>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 演示账号提示 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-3">演示账号:</p>
            <div className="space-y-2 mb-4">
              <div className="text-xs text-gray-600">
                <span className="font-medium">账号:</span> {DEMO_STAFF.username}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">密码:</span> {DEMO_STAFF.password}
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
            >
              使用演示账号登录
            </button>
          </div>
        </div>

        {/* 返回用户登录链接 */}
        <div className="text-center mt-6">
          <a
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            返回用户登录
          </a>
        </div>
      </div>
    </div>
  );
}
