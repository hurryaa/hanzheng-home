import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { storage } from '@/lib/utils';

interface DistributorStats {
  level: string;
  totalInvited: number;
  activeInvited: number;
  totalCommission: number;
  availableCommission: number;
  pendingCommission: number;
}

interface InvitedMember {
  id: string;
  name: string;
  phone: string;
  bindingDate: string;
  totalPurchase: number;
  totalCommission: number;
}

export default function DistributorCenter() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState<DistributorStats | null>(null);
  const [invitedMembers, setInvitedMembers] = useState<InvitedMember[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'commission'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadDistributorData();
    }
  }, [user?.id]);

  const loadDistributorData = () => {
    // 从存储中获取分销数据
    const distributors = storage.get<any[]>('distributorProfiles') || [];
    const invitings = storage.get<any[]>('inviteBindings') || [];
    const commissions = storage.get<any[]>('commissionRecords') || [];
    const members = storage.get<any[]>('members') || [];
    const purchases = storage.get<any[]>('purchaseRecords') || [];

    const distributor = distributors.find((d) => d.userId === user?.id);

    if (!distributor) {
      // 如果不是分销商，显示默认状态
      setStats({
        level: 'bronze',
        totalInvited: 0,
        activeInvited: 0,
        totalCommission: 0,
        availableCommission: 0,
        pendingCommission: 0,
      });
      setInvitedMembers([]);
      return;
    }

    // 计算统计数据
    const invitingRecords = invitings.filter(
      (i) => i.inviterId === user?.id && i.status === 'active'
    );

    const commissionRecords = commissions.filter((c) => c.distributorId === distributor.id);
    const totalCommission = commissionRecords.reduce((sum, c) => sum + (c.amount || 0), 0);
    const availableCommission = commissionRecords
      .filter((c) => c.status === 'available')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const pendingCommission = commissionRecords
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    // 获取被邀请成员的详细信息
    const invited: InvitedMember[] = invitingRecords.map((inv) => {
      const member = members.find((m) => m.id === inv.inviteeId);
      const memberCommissions = commissions.filter((c) => c.inviteeId === inv.inviteeId);
      const memberPurchases = purchases.filter(
        (p) => p.userId === inv.inviteeId && p.status === 'confirmed'
      );

      return {
        id: inv.inviteeId,
        name: member?.name || '未知用户',
        phone: member?.phone || '-',
        bindingDate: inv.bindingDate || new Date().toISOString(),
        totalPurchase: memberPurchases.reduce((sum, p) => sum + p.amount, 0),
        totalCommission: memberCommissions.reduce((sum, c) => sum + (c.amount || 0), 0),
      };
    });

    setStats({
      level: distributor.level || 'bronze',
      totalInvited: invitingRecords.length,
      activeInvited: invitingRecords.filter((i) => i.status === 'active').length,
      totalCommission,
      availableCommission,
      pendingCommission,
    });

    setInvitedMembers(invited);
    setInviteCode(distributor.inviteCode || generateInviteCode(user?.id || ''));
    setInviteUrl(distributor.inviteUrl || generateInviteUrl(user?.id || ''));
  };

  const generateInviteCode = (userId: string): string => {
    return userId.substring(0, 8).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const generateInviteUrl = (userId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?referrer=${userId}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('邀请码已复制！');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success('邀请链接已复制！');
  };

  const commissionRates: Record<string, number> = {
    bronze: 5,
    silver: 8,
    gold: 10,
    platinum: 15,
  };

  const levelDescriptions: Record<string, string> = {
    bronze: '青铜分销商',
    silver: '白银分销商',
    gold: '黄金分销商',
    platinum: '铂金分销商',
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">分销中心</h1>
        <p className="text-gray-600 mt-1">邀请好友购买汗蒸卡，赚取佣金奖励</p>
      </div>

      {/* 分销身份卡片 */}
      {stats && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg p-8 text-white mb-8">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-amber-100 text-sm mb-2">当前等级</p>
              <p className="text-3xl font-bold">
                {levelDescriptions[stats.level] || '未激活'}
              </p>
              <p className="text-amber-100 text-xs mt-2">
                佣金比例：{commissionRates[stats.level] || 5}%
              </p>
            </div>
            <div className="border-l border-white border-opacity-30">
              <p className="text-amber-100 text-sm mb-2 pl-6">邀请人数</p>
              <p className="text-3xl font-bold pl-6">{stats.totalInvited}</p>
              <p className="text-amber-100 text-xs mt-2 pl-6">
                {stats.activeInvited} 位活跃
              </p>
            </div>
            <div className="border-l border-white border-opacity-30">
              <p className="text-amber-100 text-sm mb-2 pl-6">累计佣金</p>
              <p className="text-3xl font-bold pl-6">¥{stats.totalCommission.toFixed(2)}</p>
              <p className="text-amber-100 text-xs mt-2 pl-6">已赚取</p>
            </div>
            <div className="border-l border-white border-opacity-30">
              <p className="text-amber-100 text-sm mb-2 pl-6">可用佣金</p>
              <p className="text-3xl font-bold text-green-300 pl-6">¥{stats.availableCommission.toFixed(2)}</p>
              <p className="text-amber-100 text-xs mt-2 pl-6">可提现</p>
            </div>
          </div>
        </div>
      )}

      {/* 邀请工具 */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* 邀请码 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">邀请码</h3>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4 text-center">
            <p className="text-2xl font-mono font-bold text-blue-600">{inviteCode}</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-copy"></i>
            复制邀请码
          </button>
          <p className="text-xs text-gray-600 mt-3">分享给好友，让他们输入此码注册</p>
        </div>

        {/* 邀请链接 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">邀请链接</h3>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4 text-center break-all">
            <p className="text-sm font-mono text-green-600">{inviteUrl}</p>
          </div>
          <button
            onClick={handleCopyUrl}
            className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-link"></i>
            复制链接
          </button>
          <p className="text-xs text-gray-600 mt-3">好友点击链接可直接进入注册页面</p>
        </div>

        {/* 二维码 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">二维码</h3>
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4 aspect-square flex items-center justify-center">
            <div className="text-center">
              <i className="fa-solid fa-qrcode text-4xl text-gray-400 mb-2"></i>
              <p className="text-xs text-gray-600">二维码功能</p>
              <p className="text-xs text-gray-600">敬请期待</p>
            </div>
          </div>
          <button
            disabled
            className="w-full px-4 py-2.5 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-qrcode"></i>
            生成二维码
          </button>
          <p className="text-xs text-gray-600 mt-3">将二维码分享给好友扫描</p>
        </div>
      </div>

      {/* 选项卡 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-4 font-medium transition border-b-2 ${
              activeTab === 'overview'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <i className="fa-solid fa-chart-pie mr-2"></i>
            概览
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 px-6 py-4 font-medium transition border-b-2 ${
              activeTab === 'members'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <i className="fa-solid fa-users mr-2"></i>
            邀请成员
          </button>
          <button
            onClick={() => setActiveTab('commission')}
            className={`flex-1 px-6 py-4 font-medium transition border-b-2 ${
              activeTab === 'commission'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <i className="fa-solid fa-wallet mr-2"></i>
            佣金明细
          </button>
        </div>

        {/* 概览标签 */}
        {activeTab === 'overview' && stats && (
          <div className="p-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <p className="text-sm text-gray-600 mb-2">升级条件</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">邀请人数：{stats.totalInvited} / 10</span>
                    <span className="text-xs text-gray-500">→ 白银</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((stats.totalInvited / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <p className="text-sm text-gray-600 mb-2">提现状态</p>
                <div className="space-y-2">
                  <p className="text-sm">
                    待审核：
                    <span className="font-semibold text-orange-600">
                      ¥{stats.pendingCommission.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-sm">
                    可提现：
                    <span className="font-semibold text-green-600">
                      ¥{stats.availableCommission.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-lightbulb"></i>
                分销规则
              </h3>
              <ul className="text-sm text-amber-800 space-y-2">
                <li>
                  ✓ <span className="font-semibold">青铜等级</span>：默认等级，佣金比例 5%
                </li>
                <li>
                  ✓ <span className="font-semibold">白银等级</span>：邀请 10+ 人，佣金比例 8%
                </li>
                <li>
                  ✓ <span className="font-semibold">黄金等级</span>：邀请 50+ 人且总佣金 ¥1000+，比例 10%
                </li>
                <li>
                  ✓ <span className="font-semibold">铂金等级</span>：邀请 100+ 人且总佣金 ¥5000+，比例 15%
                </li>
                <li className="mt-4 pt-4 border-t border-amber-200">
                  ✓ 佣金 = 被邀请用户购买金额 × 当前等级比例
                </li>
                <li>
                  ✓ 佣金自动生成，需管理员审核后可提现
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 成员列表 */}
        {activeTab === 'members' && (
          <div className="p-8">
            {invitedMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        成员名称
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        联系方式
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        邀请日期
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        其购买金额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        其贡献佣金
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invitedMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {member.phone}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(member.bindingDate).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          ¥{member.totalPurchase.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          ¥{member.totalCommission.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="fa-solid fa-users text-4xl text-gray-300 mb-4 block"></i>
                <p className="text-gray-600 mb-6">还没有邀请任何成员</p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
                >
                  <i className="fa-solid fa-share-nodes"></i>
                  立即邀请
                </button>
              </div>
            )}
          </div>
        )}

        {/* 佣金明细 */}
        {activeTab === 'commission' && (
          <div className="p-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <i className="fa-solid fa-info-circle mr-2"></i>
                佣金在被邀请用户购买成功后自动生成，管理员审核通过后可提现
              </p>
            </div>
            <div className="text-center py-12">
              <i className="fa-solid fa-wallet text-4xl text-gray-300 mb-4 block"></i>
              <p className="text-gray-600">佣金详情功能敬请期待</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
