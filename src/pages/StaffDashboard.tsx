import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/lib/utils';
import { RedemptionRecord, PurchaseRecord } from '@/lib/types';

export default function StaffDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [todayStats, setTodayStats] = useState({
    redemptionCount: 0,
    redemptionSessions: 0,
    purchaseCount: 0,
    purchaseAmount: 0,
  });

  useEffect(() => {
    // 计算今日统计
    const today = new Date().toDateString();
    
    const redemptionRecords = storage.get<RedemptionRecord[]>('redemptionRecords') || [];
    const purchaseRecords = storage.get<PurchaseRecord[]>('purchaseRecords') || [];

    const todayRedemptions = redemptionRecords.filter(
      r => new Date(r.occurredAt).toDateString() === today && r.status === 'confirmed'
    );

    const todayPurchases = purchaseRecords.filter(
      r => new Date(r.occurredAt).toDateString() === today && r.status === 'confirmed'
    );

    setTodayStats({
      redemptionCount: todayRedemptions.length,
      redemptionSessions: todayRedemptions.reduce((sum, r) => sum + r.sessionsDeducted, 0),
      purchaseCount: todayPurchases.length,
      purchaseAmount: todayPurchases.reduce((sum, p) => sum + p.amount, 0),
    });
  }, []);

  const statCards = [
    {
      label: '今日核销',
      value: todayStats.redemptionCount,
      subValue: `${todayStats.redemptionSessions} 次`,
      icon: 'fa-chart-line',
      color: 'bg-green-50 text-green-600',
      borderColor: 'border-green-200',
    },
    {
      label: '今日购买',
      value: todayStats.purchaseCount,
      subValue: `¥${todayStats.purchaseAmount.toFixed(2)}`,
      icon: 'fa-arrow-trend-up',
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
    },
  ];

  const quickActions = [
    {
      label: '会员查询与核销',
      description: '扫码查询会员，执行核销',
      icon: 'fa-bolt',
      color: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-300',
      action: () => navigate('/staff/member-query'),
    },
    {
      label: '手动录入购买',
      description: '为会员手动添加次卡',
      icon: 'fa-circle-plus',
      color: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-300',
      action: () => navigate('/staff/manual-purchase'),
    },
    {
      label: '核销记录查询',
      description: '查看本门店的核销记录',
      icon: 'fa-chart-line',
      color: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-300',
      action: () => navigate('/staff/records'),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* 欢迎信息 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          欢迎，{user?.name}
        </h1>
        <p className="text-gray-600 mt-2">
          {new Date().toLocaleDateString('zh-CN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`rounded-lg border p-6 ${card.color} ${card.borderColor}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">{card.label}</p>
                <p className="text-3xl font-bold mb-1">{card.value}</p>
                <p className="text-sm text-gray-600">{card.subValue}</p>
              </div>
              <i className={`fa-solid ${card.icon} text-4xl opacity-20`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* 快速操作 */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`rounded-lg border-2 ${action.borderColor} p-6 text-left transition hover:shadow-lg hover:scale-105 ${action.color}`}
            >
              <div className="flex items-start justify-between mb-3">
                <i className={`fa-solid ${action.icon} text-2xl`}></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex gap-4">
          <i className="fa-solid fa-circle-info text-2xl text-blue-600 flex-shrink-0 mt-0.5"></i>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">使用提示</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 点击"会员查询与核销"进行会员扫码和核销操作</li>
              <li>• 每次核销时系统会自动选择最早到期的次卡</li>
              <li>• 所有操作都会被记录在审计日志中</li>
              <li>• 如有问题，请联系管理员</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
