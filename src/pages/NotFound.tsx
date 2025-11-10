import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
        <i className="fa-solid fa-compass text-3xl text-blue-600"></i>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">页面未找到</h1>
        <p className="mt-3 text-gray-500 max-w-md">
          抱歉，您访问的页面不存在或已被移动。您可以返回上一页或前往仪表板继续管理业务。
        </p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
        >
          返回上一页
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 shadow-sm"
        >
          前往仪表板
        </button>
      </div>
    </div>
  );
}
