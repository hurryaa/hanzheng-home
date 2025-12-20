import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { getUserRedemptionRecords } from '@/lib/sessionManagementAdapter';
import { UserPackage, RedemptionRecord } from '@/lib/types';

export default function PackageDetail() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { packageId } = useParams<{ packageId: string }>();
  
  const [packageData, setPackageData] = useState<UserPackage | null>(null);
  const [redemptionDetails, setRedemptionDetails] = useState<RedemptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && packageId) {
      loadPackageData();
    }
  }, [user?.id, packageId]);

  const loadPackageData = async () => {
    try {
      setLoading(true);
      // 获取用户的所有次卡
      const response = await apiClient.getUserPackages(user?.id || '');
      const packages = response.data || [];
      
      // 查找指定的次卡
      const pkg = packages.find((p: any) => p.id === packageId);
      if (!pkg) {
        toast.error('次卡不存在');
        navigate('/personal');
        return;
      }

      setPackageData(pkg);

      // 获取该次卡的核销记录
      const allRedemptions = await apiClient.getRedemptionRecords();
      const pkgRedemptions = (allRedemptions.data || []).filter(
        (r: any) => r.userPackageId === packageId && r.status === 'confirmed'
      );
      
      // 按时间排序（最新的在前）
      pkgRedemptions.sort((a: any, b: any) => 
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
      
      setRedemptionDetails(pkgRedemptions);
    } catch (error) {
      toast.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !packageData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-600 mb-4 block"></i>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(packageData.expiresAt);
  const now = new Date();
  const isExpired = expiresAt <= now;
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const usedSessions = packageData.totalSessions - packageData.remainingSessions;
  const usagePercentage = (usedSessions / packageData.totalSessions) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/personal')}
        className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        <i className="fa-solid fa-chevron-left"></i>
        返回个人中心
      </button>

      {/* 卡片信息 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 mb-8 border-2 border-blue-200">
        <div className="grid grid-cols-2 gap-8">
          {/* 左侧：基本信息 */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">次卡详情</h1>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">卡号</p>
                <p className="text-xl font-mono font-bold text-blue-600 bg-white px-3 py-2 rounded border border-blue-200">
                  {packageData.id}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">购买时间</p>
                <p className="text-gray-900 font-medium">
                  {new Date(packageData.purchasedAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">购买金额</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{packageData.priceAmount.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">状态</p>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  isExpired
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isExpired ? '已过期' : '活跃'}
                </span>
              </div>
            </div>
          </div>

          {/* 右侧：次数信息 */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-4">
              <p className="text-sm text-gray-600 mb-4">次数使用情况</p>
              
              {/* 进度条 */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-900">已使用：{usedSessions}/{packageData.totalSessions} 次</span>
                  <span className="text-sm text-gray-500">{Math.round(usagePercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
                    style={{ width: `${usagePercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* 统计 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-sm text-gray-700">剩余次数</span>
                  <span className="text-2xl font-bold text-green-600">{packageData.remainingSessions}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm text-gray-700">已使用次数</span>
                  <span className="text-2xl font-bold text-blue-600">{usedSessions}</span>
                </div>
              </div>
            </div>

            {/* 过期倒计时 */}
            <div className={`p-4 rounded-lg border-2 ${
              isExpired
                ? 'bg-red-50 border-red-200'
                : daysLeft <= 7
                ? 'bg-orange-50 border-orange-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <p className="text-sm text-gray-600 mb-1">有效期</p>
              <p className={`text-lg font-bold ${
                isExpired
                  ? 'text-red-600'
                  : daysLeft <= 7
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}>
                {isExpired
                  ? '已过期'
                  : `${daysLeft} 天后过期`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {expiresAt.toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 使用明细 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-list"></i>
          使用明细
        </h2>

        {redemptionDetails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    门店
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    核销次数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    员工
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    备注
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {redemptionDetails.map((record, index) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(record.occurredAt).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.storeId || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                        -{record.sessionsDeducted}次
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.staffId || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.remark ? (
                        <span title={record.remark} className="truncate block max-w-xs">
                          {record.remark}
                        </span>
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
            <p className="text-gray-600 mb-2">暂无使用记录</p>
            <p className="text-sm text-gray-500">
              {isExpired ? '此次卡已过期' : '您还未在此卡上进行任何核销'}
            </p>
          </div>
        )}

        {/* 统计信息 */}
        {redemptionDetails.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">总核销次数</p>
                <p className="text-2xl font-bold text-blue-600">
                  {redemptionDetails.reduce((sum, r) => sum + r.sessionsDeducted, 0)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">核销次数</p>
                <p className="text-2xl font-bold text-purple-600">
                  {redemptionDetails.length}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">平均每次核销</p>
                <p className="text-2xl font-bold text-green-600">
                  {(redemptionDetails.reduce((sum, r) => sum + r.sessionsDeducted, 0) / redemptionDetails.length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
