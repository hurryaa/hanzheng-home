import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { PurchaseRecord } from '@/lib/types';

export default function PurchaseHistory() {
  const { user } = useContext(AuthContext);
  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PurchaseRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState('confirmed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadRecords();
    }
  }, [user?.id]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPurchaseRecords();
      const allRecords = (response.data || []).filter(
        (r: any) => r.userId === user?.id
      );
      
      // 按时间排序（最新的在前）
      allRecords.sort((a: any, b: any) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
      
      setRecords(allRecords);
      filterByStatus(allRecords, 'confirmed');
    } catch (error) {
      toast.error('加载购买记录失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterByStatus = (recordsList: PurchaseRecord[], status: string) => {
    const filtered = recordsList.filter((r) => r.status === status);
    setFilteredRecords(filtered);
    setStatusFilter(status);
  };

  const calculateStats = () => {
    return {
      confirmedCount: records.filter((r) => r.status === 'confirmed').length,
      confirmedAmount: records
        .filter((r) => r.status === 'confirmed')
        .reduce((sum, r) => sum + r.amount, 0),
      voidCount: records.filter((r) => r.status === 'void').length,
      refundedCount: records.filter((r) => r.status === 'refunded').length,
      totalSessions: records
        .filter((r) => r.status === 'confirmed')
        .reduce((sum, r) => sum + r.sessionsAdded, 0)
    };
  };

  const stats = calculateStats();
  const statusBadgeMap = {
    confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: '有效' },
    void: { bg: 'bg-gray-100', text: 'text-gray-800', label: '作废' },
    refunded: { bg: 'bg-orange-100', text: 'text-orange-800', label: '退款' }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-600 mb-4 block"></i>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">购买记录</h1>
        <p className="text-gray-600 mt-1">查看您的所有购买记录和交易状态</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm mb-2">有效购买</p>
          <p className="text-3xl font-bold text-green-600">{stats.confirmedCount}</p>
          <p className="text-xs text-gray-500 mt-2">笔</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm mb-2">购买总额</p>
          <p className="text-2xl font-bold text-blue-600">
            ¥{stats.confirmedAmount.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">元</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm mb-2">获得总次数</p>
          <p className="text-3xl font-bold text-purple-600">{stats.totalSessions}</p>
          <p className="text-xs text-gray-500 mt-2">次</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm mb-2">特殊状态</p>
          <p className="text-lg font-bold text-gray-900">
            {stats.voidCount + stats.refundedCount}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.voidCount > 0 && `${stats.voidCount}作废`}
            {stats.voidCount > 0 && stats.refundedCount > 0 && '、'}
            {stats.refundedCount > 0 && `${stats.refundedCount}退款`}
          </p>
        </div>
      </div>

      {/* 状态过滤 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">记录状态</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => filterByStatus(records, 'confirmed')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              statusFilter === 'confirmed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fa-solid fa-check-circle"></i>
            有效 ({stats.confirmedCount})
          </button>
          <button
            onClick={() => filterByStatus(records, 'void')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              statusFilter === 'void'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fa-solid fa-ban"></i>
            作废 ({stats.voidCount})
          </button>
          <button
            onClick={() => filterByStatus(records, 'refunded')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              statusFilter === 'refunded'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fa-solid fa-undo"></i>
            退款 ({stats.refundedCount})
          </button>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    购买时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    套餐名称
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    新增次数
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    购买金额
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    购买渠道
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => {
                  const badge = statusBadgeMap[record.status as keyof typeof statusBadgeMap];
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {new Date(record.occurredAt).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.packageId || '自定义购买'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                          +{record.sessionsAdded}次
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ¥{record.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.storeId ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {record.storeId}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge?.bg} ${badge?.text}`}>
                          {badge?.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="fa-solid fa-inbox text-4xl text-gray-300 mb-4 block"></i>
            <p className="text-gray-600 mb-2">暂无购买记录</p>
            <p className="text-sm text-gray-500">
              {records.length === 0
                ? '您还未进行过任何购买'
                : `在${
                    statusFilter === 'confirmed'
                      ? '有效'
                      : statusFilter === 'void'
                      ? '已作废'
                      : '已退款'
                  }状态下暂无记录`}
            </p>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      {records.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <i className="fa-solid fa-circle-info mr-2"></i>
            显示 <span className="font-semibold">{filteredRecords.length}</span> 条
            <span className="font-semibold">{statusBadgeMap[statusFilter as keyof typeof statusBadgeMap]?.label}</span>
            状态的记录
          </p>
        </div>
      )}
    </div>
  );
}
