import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { useNavigate } from 'react-router-dom';
import { getMemberById } from '@/lib/utils';
import { 
  calculateSessionBalance, 
  getUserActivePackages,
  getUserPurchaseRecords,
  getUserRedemptionRecords
} from '@/lib/sessionManagement';
import { SessionBalance, UserPackage, PurchaseRecord, RedemptionRecord } from '@/lib/types';

export default function PersonalCenter() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sessionBalance, setSessionBalance] = useState<SessionBalance | null>(null);
  const [activePackages, setActivePackages] = useState<UserPackage[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
  const [redemptionRecords, setRedemptionRecords] = useState<RedemptionRecord[]>([]);

  useEffect(() => {
    if (user?.id) {
      // 获取会话余额
      const balance = calculateSessionBalance(user.id);
      setSessionBalance(balance);

      // 获取活跃次卡
      const packages = getUserActivePackages(user.id);
      setActivePackages(packages);

      // 获取购买和核销记录
      const purchases = getUserPurchaseRecords(user.id, 5);
      setPurchaseRecords(purchases);

      const redemptions = getUserRedemptionRecords(user.id, 5);
      setRedemptionRecords(redemptions);
    }
  }, [user]);

  if (!sessionBalance || !user) {
    return <div>加载中...</div>;
  }

  const memberInfo = getMemberById(user.id);

  return (
    <div className="max-w-6xl mx-auto">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{memberInfo?.name || user.name}</h1>
            <p className="text-blue-100">手机号：{memberInfo?.phone || user.username}</p>
            <p className="text-blue-100 mt-1">
              加入时间：{memberInfo?.joinDate ? new Date(memberInfo.joinDate).toLocaleDateString('zh-CN') : '未知'}
            </p>
          </div>
          <div className="text-right">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-blue-100 mb-1">会员码</p>
              <p className="text-2xl font-bold">{user.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 次卡统计概览 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm mb-2">可用次数</p>
          <p className="text-3xl font-bold text-green-600">{sessionBalance.availableSessions}</p>
          <p className="text-xs text-gray-500 mt-2">次</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm mb-2">即将过期</p>
          <p className="text-3xl font-bold text-orange-600">{sessionBalance.expiringSessions}</p>
          <p className="text-xs text-gray-500 mt-2">7天内到期</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm mb-2">已过期</p>
          <p className="text-3xl font-bold text-red-600">{sessionBalance.expiredSessions}</p>
          <p className="text-xs text-gray-500 mt-2">次</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm mb-2">历史核销</p>
          <p className="text-3xl font-bold text-blue-600">{sessionBalance.redeemedSessions}</p>
          <p className="text-xs text-gray-500 mt-2">次</p>
        </div>
      </div>

      {/* 活跃次卡列表 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">活跃次卡</h2>
          <button
            onClick={() => navigate('/recharges')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
          >
            购买新卡
          </button>
        </div>

        {activePackages.length > 0 ? (
          <div className="space-y-3">
            {activePackages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {pkg.totalSessions} 次卡
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    购买时间：{new Date(pkg.purchasedAt).toLocaleDateString('zh-CN')}
                    | 有效期至：{new Date(pkg.expiresAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-3xl font-bold text-blue-600">
                    {pkg.remainingSessions}
                  </p>
                  <p className="text-xs text-gray-600">剩余次数</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p className="mb-3">暂无活跃次卡</p>
            <button
              onClick={() => navigate('/recharges')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              立即购买
            </button>
          </div>
        )}
      </div>

      {/* 购买和核销记录 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* 购买记录 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">最近购买</h2>
          {purchaseRecords.length > 0 ? (
            <div className="space-y-2">
              {purchaseRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">+{record.sessionsAdded} 次</p>
                    <p className="text-xs text-gray-600">
                      {new Date(record.occurredAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">¥{record.amount.toFixed(2)}</p>
                    <p className={`text-xs ${record.status === 'confirmed' ? 'text-green-600' : 'text-red-600'}`}>
                      {record.status === 'confirmed' ? '已确认' : '已作废'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-4">暂无购买记录</p>
          )}
        </div>

        {/* 核销记录 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">最近核销</h2>
          {redemptionRecords.length > 0 ? (
            <div className="space-y-2">
              {redemptionRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">-{record.sessionsDeducted} 次</p>
                    <p className="text-xs text-gray-600">
                      {new Date(record.occurredAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <i className="fa-solid fa-check-circle text-green-600 text-lg"></i>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-4">暂无核销记录</p>
          )}
        </div>
      </div>

      {/* 功能导航 */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/recharges')}
          className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg p-6 text-center transition"
        >
          <i className="fa-solid fa-credit-card text-3xl text-blue-600 mb-3 block"></i>
          <h3 className="font-semibold text-gray-900">购买次卡</h3>
          <p className="text-sm text-gray-600 mt-1">充值更多汗蒸次数</p>
        </button>

        <button
          onClick={() => navigate('/consumptions')}
          className="bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg p-6 text-center transition"
        >
          <i className="fa-solid fa-fire text-3xl text-green-600 mb-3 block"></i>
          <h3 className="font-semibold text-gray-900">消费记录</h3>
          <p className="text-sm text-gray-600 mt-1">查看汗蒸核销记录</p>
        </button>

        <button
          onClick={() => navigate('/distributor')}
          className="bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 rounded-lg p-6 text-center transition"
        >
          <i className="fa-solid fa-share-nodes text-3xl text-amber-600 mb-3 block"></i>
          <h3 className="font-semibold text-gray-900">分销中心</h3>
          <p className="text-sm text-gray-600 mt-1">邀请好友赚佣金</p>
        </button>
      </div>
    </div>
  );
}
