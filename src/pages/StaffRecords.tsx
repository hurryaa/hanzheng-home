import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { storage } from '@/lib/utils';
import { RedemptionRecord, PurchaseRecord } from '@/lib/types';
import { toast } from 'sonner';

export default function StaffRecords() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'redemption' | 'purchase'>('redemption');
  const [dateFilter, setDateFilter] = useState('today');
  const [redemptionRecords, setRedemptionRecords] = useState<RedemptionRecord[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
  const [filteredRedemption, setFilteredRedemption] = useState<RedemptionRecord[]>([]);
  const [filteredPurchase, setFilteredPurchase] = useState<PurchaseRecord[]>([]);

  useEffect(() => {
    if (user?.storeId) {
      // 获取本门店的所有记录
      const allRedemptions = storage.get<RedemptionRecord[]>('redemptionRecords') || [];
      const allPurchases = storage.get<PurchaseRecord[]>('purchaseRecords') || [];

      // 过滤本门店的记录
      const storeRedemptions = allRedemptions.filter(
        (r) => r.storeId === user.storeId && r.status === 'confirmed'
      );
      const storePurchases = allPurchases.filter(
        (p) => p.storeId === user.storeId && p.status === 'confirmed'
      );

      setRedemptionRecords(storeRedemptions);
      setPurchaseRecords(storePurchases);

      // 应用初始日期过滤
      filterByDate(storeRedemptions, storePurchases, 'today');
    }
  }, [user?.storeId]);

  const filterByDate = (
    redemptions: RedemptionRecord[],
    purchases: PurchaseRecord[],
    filter: string
  ) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    let startDate = today;

    switch (filter) {
      case 'today':
        startDate = today;
        break;
      case 'yesterday':
        startDate = yesterday;
        break;
      case 'week':
        startDate = weekAgo;
        break;
      case 'month':
        startDate = monthAgo;
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    const filteredR = redemptions.filter(
      (r) => new Date(r.occurredAt) >= startDate
    );
    const filteredP = purchases.filter(
      (p) => new Date(p.occurredAt) >= startDate
    );

    setFilteredRedemption(filteredR);
    setFilteredPurchase(filteredP);
    setDateFilter(filter);
  };

  const calculateStats = () => {
    const records = activeTab === 'redemption' ? filteredRedemption : filteredPurchase;

    if (activeTab === 'redemption') {
      const totalSessions = records.reduce(
        (sum, r) => sum + r.sessionsDeducted,
        0
      );
      return {
        count: records.length,
        total: totalSessions,
        label: '核销总次数',
      };
    } else {
      const totalAmount = records.reduce((sum, p) => sum + p.amount, 0);
      return {
        count: records.length,
        total: totalAmount,
        label: '销售总额',
      };
    }
  };

  const stats = calculateStats();

  const filterOptions = [
    { value: 'today', label: '今天' },
    { value: 'yesterday', label: '昨天' },
    { value: 'week', label: '最近7天' },
    { value: 'month', label: '最近30天' },
    { value: 'all', label: '全部' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">记录查询</h1>
        <p className="text-gray-600 mt-1">查看本门店的核销和购买记录</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm mb-2">记录数量</p>
          <p className="text-3xl font-bold text-green-600">{stats.count}</p>
          <p className="text-xs text-gray-500 mt-2">条</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm mb-2">{stats.label}</p>
          <p className="text-3xl font-bold text-blue-600">
            {activeTab === 'redemption' ? stats.total : `¥${(stats.total as number).toFixed(2)}`}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {activeTab === 'redemption' ? '次' : '元'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm mb-2">平均值</p>
          <p className="text-3xl font-bold text-purple-600">
            {stats.count > 0
              ? activeTab === 'redemption'
                ? (stats.total / stats.count).toFixed(1)
                : `¥${((stats.total as number) / stats.count).toFixed(2)}`
              : '0'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {activeTab === 'redemption' ? '次/笔' : '元/笔'}
          </p>
        </div>
      </div>

      {/* 选项卡和过滤器 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 flex">
          <button
            onClick={() => setActiveTab('redemption')}
            className={`flex-1 px-6 py-4 font-medium transition border-b-2 ${
              activeTab === 'redemption'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <i className="fa-solid fa-check-circle mr-2"></i>
            核销记录
          </button>
          <button
            onClick={() => setActiveTab('purchase')}
            className={`flex-1 px-6 py-4 font-medium transition border-b-2 ${
              activeTab === 'purchase'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <i className="fa-solid fa-shopping-cart mr-2"></i>
            购买记录
          </button>
        </div>

        {/* 日期过滤器 */}
        <div className="p-6 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">时间范围</p>
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  filterByDate(redemptionRecords, purchaseRecords, option.value);
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  dateFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {activeTab === 'redemption' ? (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      会员ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      扣次数
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      来自卡
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      备注
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      会员ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      新增次数
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      金额
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      备注
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(activeTab === 'redemption' ? filteredRedemption : filteredPurchase).map(
                (record, index) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(
                        activeTab === 'redemption'
                          ? (record as RedemptionRecord).occurredAt
                          : (record as PurchaseRecord).occurredAt
                      ).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                      {record.userId}
                    </td>
                    {activeTab === 'redemption' ? (
                      <>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            -{(record as RedemptionRecord).sessionsDeducted}次
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                          {(record as RedemptionRecord).userPackageId}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            +{(record as PurchaseRecord).sessionsAdded}次
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          ¥{((record as PurchaseRecord).amount).toFixed(2)}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.remark ? (
                        <div className="flex items-center gap-1 group">
                          <span className="truncate max-w-xs">{record.remark}</span>
                          <span
                            className="hidden group-hover:inline text-gray-400 cursor-help"
                            title={record.remark}
                          >
                            <i className="fa-solid fa-info-circle text-xs"></i>
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {(activeTab === 'redemption' ? filteredRedemption : filteredPurchase).length === 0 && (
            <div className="text-center py-12">
              <i className="fa-solid fa-inbox text-4xl text-gray-300 mb-4 block"></i>
              <p className="text-gray-600">暂无{activeTab === 'redemption' ? '核销' : '购买'}记录</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部统计信息 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <i className="fa-solid fa-circle-info mr-2"></i>
          显示条件：本门店 · {dateFilter === 'today' ? '今天' : '选定时间范围'} · 
          {activeTab === 'redemption' ? '已确认核销' : '已确认购买'} · 
          共 <span className="font-semibold">{stats.count}</span> 条记录
        </p>
      </div>
    </div>
  );
}
