import React, { useState, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { searchMembers } from '@/lib/utils';
import { 
  queryMemberForStaff, 
  executeRedemption,
  getUserRedemptionRecords 
} from '@/lib/sessionManagement';
import { MemberQueryResult, RedemptionRecord } from '@/lib/types';

export default function StaffMemberQuery() {
  const { user } = useContext(AuthContext);
  const [searchInput, setSearchInput] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberQueryResult | null>(null);
  const [recentRecords, setRecentRecords] = useState<RedemptionRecord[]>([]);
  const [sessionsToDeduct, setSessionsToDeduct] = useState(1);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [redemptionRemark, setRedemptionRemark] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      toast.error('请输入会员信息');
      return;
    }

    // 搜索会员
    const members = searchMembers(searchInput);
    if (members.length === 0) {
      toast.error('未找到会员信息');
      setSelectedMember(null);
      return;
    }

    // 查询会员详情（暂时使用第一个结果）
    const memberData = queryMemberForStaff(members[0].id);
    if (memberData) {
      setSelectedMember(memberData);
      const records = getUserRedemptionRecords(members[0].id, 10);
      setRecentRecords(records);
      toast.success(`已查询到会员：${memberData.user.name}`);
    } else {
      toast.error('无法查询会员信息');
      setSelectedMember(null);
    }
  };

  const handleRedemption = async () => {
    if (!selectedMember || !user?.storeId) {
      toast.error('会员信息不完整');
      return;
    }

    if (sessionsToDeduct <= 0) {
      toast.error('扣次数必须大于0');
      return;
    }

    setLoading(true);
    try {
      // 延迟模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 600));

      const result = executeRedemption(
        selectedMember.user.id,
        user.storeId,
        user.id,
        sessionsToDeduct,
        redemptionRemark
      );

      if (result.success) {
        toast.success(`✓ 核销成功！已扣 ${sessionsToDeduct} 次`);
        
        // 刷新会员信息
        const updatedMember = queryMemberForStaff(selectedMember.user.id);
        if (updatedMember) {
          setSelectedMember(updatedMember);
          const records = getUserRedemptionRecords(selectedMember.user.id, 10);
          setRecentRecords(records);
        }

        // 重置表单
        setSessionsToDeduct(1);
        setRedemptionRemark('');
        setShowRedemptionModal(false);
      } else {
        toast.error(result.error || '核销失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSelectedMember(null);
    setRecentRecords([]);
    setSessionsToDeduct(1);
    setRedemptionRemark('');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">会员查询与核销</h1>
        <p className="text-gray-600 mt-1">快速查询会员信息并执行汗蒸次数核销</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 左侧：搜索和会员信息 */}
        <div className="col-span-2 space-y-6">
          {/* 搜索框 */}
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="输入会员手机号或名称"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    disabled={selectedMember !== null}
                  />
                </div>
                <button
                  type="submit"
                  disabled={selectedMember !== null}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-qrcode"></i>
                  查询
                </button>
              </div>
            </form>
          </div>

          {/* 会员信息卡片 */}
          {selectedMember && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMember.user.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    手机号：{selectedMember.user.phone} | 加入时间：{selectedMember.user.joinDate}
                  </p>
                </div>
                <button
                  onClick={handleClearSearch}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <i className="fa-solid fa-xmark text-xl text-gray-400"></i>
                </button>
              </div>

              {/* 分销身份 */}
              {selectedMember.distributorInfo && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900">
                    分销身份：<span className="font-bold">{selectedMember.distributorInfo.level}</span>
                  </p>
                  <p className="text-xs text-amber-700 mt-1">邀请码：{selectedMember.distributorInfo.inviteCode}</p>
                </div>
              )}

              {/* 余额统计 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">可用次数</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {selectedMember.sessionBalance.availableSessions}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">即将过期</p>
                  <p className="text-3xl font-bold text-red-600">
                    {selectedMember.sessionBalance.expiringSessions}
                  </p>
                </div>
              </div>

              {/* 活跃次卡列表 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">活跃次卡</h3>
                {selectedMember.activePackages.length > 0 ? (
                  <div className="space-y-2">
                    {selectedMember.activePackages.map(pkg => (
                      <div
                        key={pkg.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {pkg.totalSessions} 次卡
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            剩余：<span className="font-bold">{pkg.remainingSessions}</span> 次
                            | 有效期至：{new Date(pkg.expiresAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-4">暂无活跃次卡</p>
                )}
              </div>

              {/* 核销按钮 */}
              {selectedMember.sessionBalance.availableSessions > 0 ? (
                <button
                  onClick={() => setShowRedemptionModal(true)}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-plus"></i>
                  执行核销
                </button>
              ) : (
                <div className="w-full px-6 py-3 bg-gray-200 text-gray-600 rounded-lg text-center font-semibold">
                  会员没有可用次数
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧：近期核销记录 */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">近期核销记录</h3>
          {recentRecords.length > 0 ? (
            <div className="space-y-3">
              {recentRecords.map(record => (
                <div key={record.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2 mb-2">
                    <i className="fa-solid fa-check-circle text-green-600 mt-0.5 flex-shrink-0"></i>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">扣 {record.sessionsDeducted} 次</p>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {new Date(record.occurredAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  {record.remark && (
                    <p className="text-xs text-gray-600 pl-6 border-l-2 border-gray-300">
                      {record.remark}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 text-sm py-6">暂无核销记录</p>
          )}
        </div>
      </div>

      {/* 核销模态框 */}
      {showRedemptionModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">确认核销</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">会员：</span> {selectedMember.user.name}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">可用次数：</span>{' '}
                {selectedMember.sessionBalance.availableSessions} 次
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {/* 扣次数选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  扣次数
                </label>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setSessionsToDeduct(Math.max(1, sessionsToDeduct - 1))}
                    disabled={sessionsToDeduct <= 1}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 rounded-lg font-semibold"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={sessionsToDeduct}
                    onChange={(e) => setSessionsToDeduct(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={selectedMember.sessionBalance.availableSessions}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() =>
                      setSessionsToDeduct(
                        Math.min(
                          selectedMember.sessionBalance.availableSessions,
                          sessionsToDeduct + 1
                        )
                      )
                    }
                    disabled={sessionsToDeduct >= selectedMember.sessionBalance.availableSessions}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 rounded-lg font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注（可选）
                </label>
                <textarea
                  value={redemptionRemark}
                  onChange={(e) => setRedemptionRemark(e.target.value)}
                  placeholder="如：多人同行、体验备注等"
                  maxLength={200}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{redemptionRemark.length}/200</p>
              </div>
            </div>

            {/* 动作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRedemptionModal(false);
                  setSessionsToDeduct(1);
                  setRedemptionRemark('');
                }}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleRedemption}
                disabled={loading || sessionsToDeduct <= 0}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
              >
                {loading ? '处理中...' : '确认核销'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
