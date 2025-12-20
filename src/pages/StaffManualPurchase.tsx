import React, { useState, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { searchMembers } from '@/lib/utils';
import { createPurchaseRecord, calculateSessionBalance } from '@/lib/sessionManagement';
import { PackageConfig } from '@/lib/types';

export default function StaffManualPurchase() {
  const { user } = useContext(AuthContext);
  const [searchInput, setSearchInput] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [customSessions, setCustomSessions] = useState(10);
  const [customAmount, setCustomAmount] = useState(99);
  const [validDays, setValidDays] = useState(180);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  // 预定义的套餐模板
  const packageTemplates: Record<string, PackageConfig> = {
    'package_10': {
      id: 'PKG001',
      name: '10次卡',
      totalSessions: 10,
      priceAmount: 99,
      validDays: 180,
      applicableStoreScope: 'all',
      isStackable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    'package_20': {
      id: 'PKG002',
      name: '20次卡',
      totalSessions: 20,
      priceAmount: 189,
      validDays: 180,
      applicableStoreScope: 'all',
      isStackable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    'package_50': {
      id: 'PKG003',
      name: '50次卡',
      totalSessions: 50,
      priceAmount: 399,
      validDays: 365,
      applicableStoreScope: 'all',
      isStackable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    'package_100': {
      id: 'PKG004',
      name: '100次卡',
      totalSessions: 100,
      priceAmount: 699,
      validDays: 365,
      applicableStoreScope: 'all',
      isStackable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      toast.error('请输入会员信息');
      return;
    }

    const members = searchMembers(searchInput);
    if (members.length === 0) {
      toast.error('未找到会员信息');
      setSelectedMemberId(null);
      return;
    }

    // 使用第一个搜索结果
    setSelectedMemberId(members[0].id);
    setSelectedMemberName(members[0].name);
    toast.success(`已选择会员：${members[0].name}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMemberId) {
      toast.error('请先选择会员');
      return;
    }

    if (!user?.storeId) {
      toast.error('员工信息不完整');
      return;
    }

    if (customSessions <= 0 || customAmount <= 0) {
      toast.error('次数和金额必须大于0');
      return;
    }

    setLoading(true);

    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800));

      // 确定使用哪个套餐配置
      let packageConfig = undefined;
      if (useTemplate && selectedPackage) {
        packageConfig = packageTemplates[selectedPackage];
      }

      // 创建购买记录
      const { purchaseRecord, userPackage } = createPurchaseRecord(
        selectedMemberId,
        packageConfig?.id,
        packageConfig,
        user.storeId,
        user.id,
        undefined,
        useTemplate && selectedPackage ? undefined : customSessions,
        useTemplate && selectedPackage ? undefined : customAmount,
        remark || undefined
      );

      toast.success(
        `✓ 购买记录已创建！\n会员: ${selectedMemberName}\n新增次数: ${userPackage.totalSessions}次\n金额: ¥${userPackage.priceAmount.toFixed(2)}`
      );

      // 重置表单
      setSelectedMemberId(null);
      setSelectedMemberName('');
      setSearchInput('');
      setUseTemplate(true);
      setSelectedPackage('');
      setCustomSessions(10);
      setCustomAmount(99);
      setValidDays(180);
      setRemark('');
    } catch (error) {
      toast.error('创建购买记录失败，请重试');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">手动录入购买</h1>
        <p className="text-gray-600 mt-1">为会员手动创建购买记录并增加汗蒸次数</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 左侧表单 */}
        <div className="col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
            {/* 第一步：选择会员 */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  1
                </span>
                选择会员
              </h2>

              <form onSubmit={handleSearch} className="space-y-3">
                <div className="relative">
                  <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="输入会员手机号或姓名"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    disabled={selectedMemberId !== null}
                  />
                </div>
                <button
                  type="submit"
                  disabled={selectedMemberId !== null}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
                >
                  搜索会员
                </button>
              </form>

              {/* 已选会员显示 */}
              {selectedMemberId && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      <i className="fa-solid fa-check text-green-600 mr-2"></i>
                      {selectedMemberName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">会员ID: {selectedMemberId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberId(null);
                      setSelectedMemberName('');
                      setSearchInput('');
                    }}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    更换
                  </button>
                </div>
              )}
            </div>

            {/* 第二步：选择套餐 */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  2
                </span>
                选择套餐方式
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    checked={useTemplate}
                    onChange={() => setUseTemplate(true)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-gray-900">使用预设套餐</span>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    checked={!useTemplate}
                    onChange={() => setUseTemplate(false)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-gray-900">自定义次数和金额</span>
                </label>
              </div>
            </div>

            {/* 第三步：套餐详情 */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  3
                </span>
                套餐详情
              </h2>

              {useTemplate ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    选择套餐
                  </label>
                  <select
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  >
                    <option value="">-- 请选择套餐 --</option>
                    {Object.entries(packageTemplates).map(([key, template]) => (
                      <option key={key} value={key}>
                        {template.name} - {template.totalSessions}次 / ¥{template.priceAmount} / {template.validDays}天
                      </option>
                    ))}
                  </select>

                  {selectedPackage && packageTemplates[selectedPackage] && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">套餐名称</p>
                          <p className="font-semibold text-gray-900">
                            {packageTemplates[selectedPackage].name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">包含次数</p>
                          <p className="font-semibold text-gray-900">
                            {packageTemplates[selectedPackage].totalSessions} 次
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">售价</p>
                          <p className="font-semibold text-gray-900">
                            ¥{packageTemplates[selectedPackage].priceAmount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">有效期</p>
                          <p className="font-semibold text-gray-900">
                            {packageTemplates[selectedPackage].validDays} 天
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      次数
                    </label>
                    <input
                      type="number"
                      value={customSessions}
                      onChange={(e) => setCustomSessions(parseInt(e.target.value) || 0)}
                      min="1"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      金额（¥）
                    </label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      有效期（天）
                    </label>
                    <input
                      type="number"
                      value={validDays}
                      onChange={(e) => setValidDays(parseInt(e.target.value) || 180)}
                      min="1"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 备注 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注（可选）
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="例如：充值续期、赠送活动等"
                maxLength={200}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{remark.length}/200</p>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={!selectedMemberId || (useTemplate && !selectedPackage) || loading}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-check"></i>
              {loading ? '处理中...' : '确认创建购买'}
            </button>
          </form>
        </div>

        {/* 右侧提示和说明 */}
        <div className="space-y-6">
          {/* 操作提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-circle-info"></i>
              操作提示
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>✓ 先搜索并选择会员</li>
              <li>✓ 选择套餐或自定义配置</li>
              <li>✓ 可选添加备注说明</li>
              <li>✓ 确认后自动计算佣金</li>
              <li>✓ 记录可在管理后台查看</li>
            </ul>
          </div>

          {/* 套餐价格表 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">预设套餐价格表</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(packageTemplates).map(([key, template]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{template.name}</span>
                  <span className="font-semibold text-gray-900">¥{template.priceAmount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 注意事项 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-exclamation"></i>
              注意事项
            </h3>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• 同一会员可购买多张卡</li>
              <li>• 核销时自动选最早到期的卡</li>
              <li>• 金额用于佣金计算</li>
              <li>• 操作记录可审计查看</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
