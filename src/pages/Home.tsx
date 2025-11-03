import MainLayout from '@/components/layout/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-home text-3xl text-primary"></i>
        </div>
        <h1 className="text-[clamp(1.8rem,5vw,3rem)] font-bold text-gray-800 mb-4">
          欢迎使用我们的应用
        </h1>
        <p className="text-gray-600 max-w-md mb-8 text-lg">
          这是您的应用首页。从这里开始探索所有强大功能，管理您的日常活动和数据。
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            开始使用
          </button>
          <button className="px-6 py-3 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1">
            了解更多
          </button>
        </div>
      </div>
    </MainLayout>
  );
}