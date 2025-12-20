import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { RedemptionRecord } from '@/lib/types';

export default function ConsumptionDetails() {
  const { user } = useContext(AuthContext);
  const [records, setRecords] = useState<RedemptionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<RedemptionRecord[]>([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadRecords();
    }
  }, [user?.id]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getRedemptionRecords();
      const allRecords = (response.data || []).filter(
        (r: any) => r.userId === user?.id && r.status === 'confirmed'
      );
      
      // 按时间排序（最新的在前）
      allRecords.sort((a: any, b: any) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
      
      setRecords(allRecords);
      filterByDate(allRecords, 'all');
    } catch (error) {
      toast.error('加载核销记录失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (recordsList: RedemptionRecord[], filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let filtered = recordsList;

    switch (filter) {
      case 'today':
        filtered = recordsList.filter((r) => new Date(r.occurredAt) >= today);
        break;
      case 'yesterday':
        filtered = recordsList.filter(
          (r) =>
            new Date(r.occurredAt) >= yesterday &&
            new Date(r.occurredAt) < today
        );
        break;
      case 'week':
        filtered = recordsList.filter((r) => new Date(r.occurredAt) >= sevenDaysAgo);
        break;
      case 'month':
        filtered = recordsList.filter((r) => new Date(r.occurredAt) >= thirtyDaysAgo);
        break;
      default:
        filtered = recordsList;
    }

    setFilteredRecords(filtered);
    setDateFilter(filter);
  };

  const calculateStats = () => {
    return {
      totalRecords: filteredRecords.length,
      totalSessions: filteredRecords.reduce((sum, r) => sum + r.sessionsDeducted, 0),
      averageSessions: filteredRecords.length > 0
        ? (filteredRecords.reduce((sum, r) => sum + r.sessionsDeducted, 0) / filteredRecords.length).toFixed(1)
        : 0
    };
  };

  const stats = calculateStats();
  const filterOptions = [
    { value: 'today', label: '今天' },
    { value: 'yesterday', label: '昨天' },
    { value: 'week', label: '最近7天' },
    { value: 'month', label: '最近30天' },
    { value: 'all', label: '全部' }
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">汗蒸消费记录</h1>
        <p className="text-gray-600 mt-1">查看您的核销记录和消费明细</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm mb-2">核销次数</p>
          <p className="text-3xl font-bold text-blue-600">{stats.totalRecords}</p>
          <p className="text-xs text-gray-500 mt-2">笔</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm mb-2">消费总次数</p>
          <p className="text-3xl font-bold text-red-600">{stats.totalSessions}</p>
          <p className="text-xs text-gray-500 mt-2">次</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm mb-2">平均每次核销</p>
          <p className="text-3xl font-bold text-purple-600">{stats.averageSessions}</p>
          <p className="text-xs text-gray-500 mt-2">次</p>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">时间范围</p>
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => filterByDate(records, option.value)}
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

      {/* 记录列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    核销时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    门店
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    核销次数
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    次卡编号
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    核销员
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    备注
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(record.occurredAt).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {record.storeId || '未知'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                        -{record.sessionsDeducted}次
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {record.userPackageId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.staffId || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.remark ? (
                        <div className="flex items-center gap-2 group">
                          <span className="truncate max-w-xs" title={record.remark}>
                            {record.remark}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="fa-solid fa-inbox text-4xl text-gray-300 mb-4 block"></i>
            <p className="text-gray-600 mb-2">暂无消费记录</p>
            <p className="text-sm text-gray-500">
              {records.length === 0
                ? '您还未在任何门店进行过消费'
                : `在${
                    dateFilter === 'today'
                      ? '今天'
                      : dateFilter === 'yesterday'
                      ? '昨天'
                      : dateFilter === 'week'
                      ? '最近7天'
                      : dateFilter === 'month'
                      ? '最近30天'
                      : '选定时间范围'
                  }内暂无消费记录`}
            </p>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      {records.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <i className="fa-solid fa-circle-info mr-2"></i>
            已显示 <span className="font-semibold">{filteredRecords.length}</span> 条记录，
            总消费 <span className="font-semibold">{stats.totalSessions}</span> 次
          </p>
        </div>
      )}
    </div>
  );
}
