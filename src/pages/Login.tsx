import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useContext(AuthContext);

  const validateForm = () => {
    if (!username.trim()) {
      setError('请输入用户名');
      return false;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return false;
    }
    if (username.length < 3) {
      setError('用户名至少需要3个字符');
      return false;
    }
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 生产环境登录验证
      // 注意：在实际生产环境中，这里应该连接到后端API进行身份验证
      if (username && password) {
        // 这里仅做表单验证，实际项目中需要替换为真实的身份验证逻辑
        login();
        toast.success('登录成功！');

        // 如果选择记住我，保存到localStorage
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }
      }
    } catch (error) {
      setError('登录失败，请检查用户名和密码');
      toast.error('登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    toast.info('忘记密码功能正在开发中，请联系系统管理员');
  };

  // 组件加载时检查是否有记住的用户名
  useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
          <div className="bg-blue-600 p-6 text-center">
            <h1 className="text-2xl font-bold text-white">汗蒸养生馆管理系统</h1>
            <p className="text-blue-100 mt-1">管理员登录</p>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                <i className="fa-solid fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                  用户名
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-user text-gray-400"></i>
                  </div>
                  <input
                    className={cn(
                      "shadow appearance-none border rounded-lg w-full py-3 px-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200",
                      error && "border-red-300 focus:ring-red-500 focus:border-red-500"
                    )}
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    required
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-lock text-gray-400"></i>
                  </div>
                  <input
                    className={cn(
                      "shadow appearance-none border rounded-lg w-full py-3 px-10 pr-12 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200",
                      error && "border-red-300 focus:ring-red-500 focus:border-red-500"
                    )}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 transition-colors"
                  />
                  <span className="ml-2 text-gray-700 text-sm select-none">记住我</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800 transition duration-200 focus:outline-none focus:underline"
                >
                  忘记密码?
                </button>
              </div>

              <button
                className={cn(
                  "w-full font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center",
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
                type="submit"
                disabled={isLoading}
                aria-label="登录到系统"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    登录中...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-sign-in mr-2"></i>
                    登录
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <p className="mt-4 text-center text-gray-500 text-sm">
          请使用管理员账户登录
        </p>
      </div>
    </div>
  );
}