import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { exportCommissions } from '@/lib/exportUtils';

interface CommissionRecord {
  id: string;
  distributorId: string;
  inviteeId: string;
  inviteeName?: string;
  amount: number;
  status: 'pending' | 'available' | 'withdrawn' | 'rejected';
  relatedOrderId?: string;
  createdAt: string;
  approvedAt?: string;
  remark?: string;
}

export default function AdminCommissionManagement() {
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<CommissionRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      // 由于API不直接支持佣金记录获取，这里使用占位符
      // 实际应该从apiClient.getCommissionRecords()获取
      const mockRecords: CommissionRecord[] = [];
      setRecords(mockRecords);
      filterByStatus(mockRecords, 'all');
    } catch (error) {
      toast.error('加载佣金记录失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterByStatus = (recordList: CommissionRecord[], status: string) => {
    let filtered = recordList;
    if (status !== 'all') {
      filtered = recordList.filter((r) => r.status === status);
    }
    setFilteredRecords(filtered);
    setStatusFilter(status);
  };

  const handleApprove = async (id: string) => {
    try {
      // 模拟审批操作
      const updated = records.map((r) =>
        r.id === id ? { ...r, status: 'available' as const } : r
      );
      setRecords(updated);
      filterByStatus(updated, statusFilter);
      setSelectedId(null);
      toast.success('佣金已审批');
    } catch (error) {
      toast.error('审批失败');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const updated = records.map((r) =>
        r.id === id ? { ...r, status: 'rejected' as const } : r
      );
      setRecords(updated);
      filterByStatus(updated, statusFilter);
      setSelectedId(null);
      toast.success('佣金已拒绝');
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const calculateStats = () => {
    return {
      pending: records.filter((r) => r.status === 'pending').length,
      pendingAmount: records
        .filter((r) => r.status === 'pending')
        .reduce((sum, r) => sum + r.amount, 0),
      available: records.filter((r) => r.status === 'available').length,
      availableAmount: records
        .filter((r) => r.status === 'available')
        .reduce((sum, r) => sum + r.amount, 0),
      withdrawn: records.filter((r) => r.status === 'withdrawn').length,
      withdrawnAmount: records
        .filter((r) => r.status === 'withdrawn')
        .reduce((sum, r) => sum + r.amount, 0),
    };
  };

  const stats = calculateStats();

  const statusBadgeMap = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '待审批' },
    available: { bg: 'bg-blue-100', text: 'text-blue-800', label: '可提现' },
    withdrawn: { bg: 'bg-green-100', text: 'text-green-800', label: '已提现' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '已拒绝' },
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
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
    <div className="max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">佣金管理</h1>
        <p className="text-gray-600 mt-1">审批和管理分销商佣金</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm mb-2">待审批</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-gray-500 mt-2">
            ¥{stats.pendingAmount.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm mb-2">可提现</p>
          <p className="text-2xl font-bold text-blue-600">{stats.available}</p>
          <p className="text-xs text-gray-500 mt-2">
            ¥{stats.availableAmount.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm mb-2">已提现</p>
          <p className="text-2xl font-bold text-green-600">{stats.withdrawn}</p>
          <p className="text-xs text-gray-500 mt-2">
            ¥{stats.withdrawnAmount.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm mb-2">累计佣金</p>
          <p className="text-2xl font-bold text-red-600">
            ¥{(stats.pendingAmount + stats.availableAmount + stats.withdrawnAmount).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">总额</p>
        </div>
      </div>

      {/* 状态过滤 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">佣金状态</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => filterByStatus(records, 'all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              statusFilter === 'all'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => filterByStatus(records, 'pending')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fa-solid fa-clock text-sm"></i>
            待审批 ({stats.pending})
          </button>
          <button
            onClick={() => filterByStatus(records, 'available')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              statusFilter === 'available'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fa-solid fa-check"></i>
            可提现 ({stats.available})
          </button>
          <button
            onClick={() => filterByStatus(records, 'withdrawn')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              statusFilter === 'withdrawn'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <i className="fa-solid fa-check-double"></i>
            已提现 ({stats.withdrawn})
          </button>
          <button
            onClick={() => exportCommissions(records)}
            className="px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <i className="fa-solid fa-download"></i>
            导出CSV
          </button>
        </div>
      </div>

      {/* 佣金列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    佣金ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    分销商
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    被邀请用户
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    佣金金额
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    创建时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => {
                  const badge = statusBadgeMap[record.status];
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {record.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.distributorId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.inviteeName || record.inviteeId}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ¥{record.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge?.bg} ${badge?.text}`}
                        >
                          {badge?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        {record.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(record.id)}
                              className="text-green-600 hover:text-green-900 font-medium transition"
                            >
                              审批
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleReject(record.id)}
                              className="text-red-600 hover:text-red-900 font-medium transition"
                            >
                              拒绝
                            </button>
                          </>
                        )}
                        {record.status !== 'pending' && (
                          <span className="text-gray-400">-</span>
                        )}
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
            <p className="text-gray-600">暂无佣金记录</p>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      {records.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <i className="fa-solid fa-circle-info mr-2"></i>
            共有 <span className="font-semibold">{filteredRecords.length}</span> 条
            <span className="font-semibold">
              {statusFilter === 'all'
                ? '佣金'
                : statusBadgeMap[statusFilter as keyof typeof statusBadgeMap]?.label}
            </span>
            记录，待审批金额
            <span className="font-semibold">¥{stats.pendingAmount.toFixed(2)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
