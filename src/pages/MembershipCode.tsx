import React, { useContext, useRef } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { getMemberById } from '@/lib/utils';

export default function MembershipCode() {
  const { user } = useContext(AuthContext);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  if (!user) {
    return <div>加载中...</div>;
  }

  const memberInfo = getMemberById(user.id);
  const memberCode = user.id.substring(0, 8).toUpperCase();
  const memberName = memberInfo?.name || user.name || '用户';

  const handleDownloadQRCode = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `会员码-${memberCode}.png`;
        link.click();
        toast.success('会员码已下载');
      }
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('打印对话框已打开');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(memberCode);
    toast.success('会员码已复制！');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">我的会员码</h1>
        <p className="text-gray-600 mt-2">出示此二维码或会员码给店员进行核销</p>
      </div>

      {/* 主要展示区域 */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12">
          <div className="flex flex-col items-center justify-center">
            {/* 会员名称 */}
            <p className="text-white text-sm opacity-80 mb-4">尊敬的会员</p>
            <h2 className="text-white text-4xl font-bold mb-8">{memberName}</h2>

            {/* 二维码区域 */}
            <div 
              ref={qrCodeRef}
              className="bg-white rounded-lg p-6 mb-8"
              style={{ minWidth: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <div style={{ width: '250px', height: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width="250" height="250" viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* 简单的二维码示意图 */}
                  <rect width="250" height="250" fill="white" />
                  <g fill="black" opacity="0.8">
                    {/* 顶左位置标记 */}
                    <rect x="10" y="10" width="50" height="50" />
                    <rect x="20" y="20" width="30" height="30" fill="white" />
                    <rect x="25" y="25" width="20" height="20" />
                    {/* 顶右位置标记 */}
                    <rect x="190" y="10" width="50" height="50" />
                    <rect x="200" y="20" width="30" height="30" fill="white" />
                    <rect x="205" y="25" width="20" height="20" />
                    {/* 底左位置标记 */}
                    <rect x="10" y="190" width="50" height="50" />
                    <rect x="20" y="200" width="30" height="30" fill="white" />
                    <rect x="25" y="205" width="20" height="20" />
                    {/* 中间数据区域 */}
                    <rect x="70" y="70" width="15" height="15" />
                    <rect x="90" y="70" width="15" height="15" />
                    <rect x="110" y="70" width="15" height="15" />
                    <rect x="130" y="70" width="15" height="15" />
                    <rect x="70" y="90" width="15" height="15" />
                    <rect x="90" y="110" width="15" height="15" />
                    <rect x="110" y="130" width="15" height="15" />
                    <rect x="130" y="110" width="15" height="15" />
                    <rect x="150" y="130" width="15" height="15" />
                    <rect x="150" y="150" width="15" height="15" />
                    <rect x="170" y="150" width="15" height="15" />
                    <rect x="170" y="170" width="15" height="15" />
                  </g>
                </svg>
              </div>
            </div>

            {/* 会员码文字 */}
            <div className="text-center mb-6">
              <p className="text-white text-sm opacity-80 mb-2">会员编号</p>
              <p className="text-white text-4xl font-mono font-bold tracking-widest">{memberCode}</p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={handleCopyCode}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              <i className="fa-solid fa-copy"></i>
              复制会员码
            </button>
            <button
              onClick={handleDownloadQRCode}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
            >
              <i className="fa-solid fa-download"></i>
              下载二维码
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
            >
              <i className="fa-solid fa-print"></i>
              打印会员码
            </button>
          </div>
        </div>
      </div>

      {/* 会员信息卡片 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-user"></i>
            基本信息
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">会员名称</p>
              <p className="font-semibold text-gray-900">{memberName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">联系电话</p>
              <p className="font-semibold text-gray-900">{memberInfo?.phone || user.username}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">会员编号</p>
              <p className="font-mono font-semibold text-blue-600">{user.id}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-info-circle"></i>
            使用说明
          </h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">1</span>
              <span>到店消费时，出示上方的二维码或会员码</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">2</span>
              <span>店员扫码或输入会员编号即可查询您的信息</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">3</span>
              <span>确认消费内容后，店员为您核销次数</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">4</span>
              <span>完成核销，您的剩余次数即时更新</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 温馨提示 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-lightbulb"></i>
          温馨提示
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✓ 此会员码是您的专属身份识别，请妥善保管</li>
          <li>✓ 您可以随时下载或截屏保存此页面方便查阅</li>
          <li>✓ 在店员扫码或手工输入会员编号时，系统会自动查询您的会员信息</li>
          <li>✓ 若会员码丢失或需要补办，请联系门店工作人员</li>
          <li>✓ 核销记录会自动更新到您的账户，请定期检查</li>
        </ul>
      </div>

      {/* 打印样式 */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .max-w-4xl {
            max-width: 100%;
          }
          div:not([ref]) {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
