import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  storage,
  formatDate,
  getMembers,
  addRechargeRecord,
  addConsumptionRecord,
  updateMemberCardUsage
} from '@/lib/utils';

// 会员数据模型
interface Member {
  id: string;
  name: string;
  phone: string;
  card?: Card;
  joinDate: string;
  balance?: number;
  status: 'active' | 'inactive';
}

// 次卡数据模型
interface Card {
  id: string;
  type: string;
  totalCount: number;
  usedCount: number;
  remainingCount: number;
  expiryDate: string;
}

// 快速操作面板组件
const MemberQuickActions = ({
  member,
  onUpdate
}: {
  member: Member;
  onUpdate: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'consume' | 'recharge'>('consume');

  // 消费表单状态
  const [consumeForm, setConsumeForm] = useState({
    service: '',
    category: '汗蒸服务',
    amount: '',
    paymentMethod: '会员卡支付',
    usedCard: true,
    notes: ''
  });

  // 充值表单状态
  const [rechargeForm, setRechargeForm] = useState({
    amount: '',
    paymentMethod: '微信支付',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 服务类别选项
  const serviceCategories = [
    '汗蒸服务', '按摩服务', '理疗服务', '组合服务', '其他服务'
  ];

  // 支付方式选项
  const paymentMethods = [
    '会员卡支付', '微信支付', '支付宝', '现金', '银行卡'
  ];

  // 快速服务选项
  const quickServices = [
    { name: '标准汗蒸', category: '汗蒸服务', amount: 68 },
    { name: '豪华汗蒸', category: '汗蒸服务', amount: 98 },
    { name: '全身按摩', category: '按摩服务', amount: 128 },
    { name: '足底按摩', category: '按摩服务', amount: 88 }
  ];

  // 快速充值金额选项
  const quickRechargeAmounts = [100, 200, 500, 1000];

  // 处理消费表单变化
  const handleConsumeChange = (field: string, value: any) => {
    setConsumeForm(prev => ({ ...prev, [field]: value }));
  };

  // 处理充值表单变化
  const handleRechargeChange = (field: string, value: any) => {
    setRechargeForm(prev => ({ ...prev, [field]: value }));
  };

  // 快速选择服务
  const handleQuickService = (service: typeof quickServices[0]) => {
    setConsumeForm(prev => ({
      ...prev,
      service: service.name,
      category: service.category,
      amount: service.amount.toString()
    }));
  };

  // 快速选择充值金额
  const handleQuickRecharge = (amount: number) => {
    setRechargeForm(prev => ({ ...prev, amount: amount.toString() }));
  };

  // 提交消费记录
  const handleSubmitConsume = async () => {
    if (!consumeForm.service || !consumeForm.amount) {
      toast.error('请填写服务项目和金额');
      return;
    }

    if (consumeForm.usedCard && (!member.card || member.card.remainingCount <= 0)) {
      toast.error('该会员没有可用的次卡');
      return;
    }

    setIsSubmitting(true);
    try {
      // 创建消费记录
      const consumptionRecord = {
        memberId: member.id,
        memberName: member.name,
        phone: member.phone,
        time: formatDate(new Date()),
        service: consumeForm.service,
        category: consumeForm.category,
        amount: parseFloat(consumeForm.amount),
        paymentMethod: consumeForm.paymentMethod,
        status: '已完成' as const,
        operator: '管理员',
        usedCard: consumeForm.usedCard,
        notes: consumeForm.notes
      };

      // 添加消费记录
      addConsumptionRecord(consumptionRecord);

      // 重置表单
      setConsumeForm({
        service: '',
        category: '汗蒸服务',
        amount: '',
        paymentMethod: '会员卡支付',
        usedCard: true,
        notes: ''
      });

      toast.success('消费记录添加成功！');
      onUpdate();
      setIsExpanded(false);
    } catch (error) {
      console.error('添加消费记录失败:', error);
      toast.error('添加消费记录失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 提交充值记录
  const handleSubmitRecharge = async () => {
    if (!rechargeForm.amount) {
      toast.error('请填写充值金额');
      return;
    }

    const amount = parseFloat(rechargeForm.amount);
    if (amount <= 0) {
      toast.error('充值金额必须大于0');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentBalance = member.balance || 0;
      const newBalance = currentBalance + amount;

      // 创建充值记录
      const rechargeRecord = {
        memberId: member.id,
        memberName: member.name,
        phone: member.phone,
        time: formatDate(new Date()),
        amount: amount,
        balance: newBalance,
        paymentMethod: rechargeForm.paymentMethod,
        operator: '管理员',
        notes: rechargeForm.notes
      };

      // 添加充值记录
      addRechargeRecord(rechargeRecord);

      // 更新会员余额
      const members = getMembers();
      const memberIndex = members.findIndex(m => m.id === member.id);
      if (memberIndex !== -1) {
        const updatedMembers = [...members];
        updatedMembers[memberIndex] = {
          ...members[memberIndex],
          balance: newBalance
        };
        storage.set('members', updatedMembers);
      }

      // 重置表单
      setRechargeForm({
        amount: '',
        paymentMethod: '微信支付',
        notes: ''
      });

      toast.success(`充值成功！当前余额：¥${newBalance}`);
      onUpdate();
      setIsExpanded(false);
    } catch (error) {
      console.error('充值失败:', error);
      toast.error('充值失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* 快速操作按钮 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">快速操作</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        </div>

        {!isExpanded && (
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => {
                setIsExpanded(true);
                setActiveTab('consume');
              }}
              className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors"
            >
              <i className="fa-solid fa-shopping-cart mr-1"></i>
              消费
            </button>
            <button
              onClick={() => {
                setIsExpanded(true);
                setActiveTab('recharge');
              }}
              className="flex-1 px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-md hover:bg-green-100 transition-colors"
            >
              <i className="fa-solid fa-plus mr-1"></i>
              充值
            </button>
          </div>
        )}
      </div>

      {/* 展开的操作面板 */}
      {isExpanded && (
        <div className="p-4">
          {/* 标签切换 */}
          <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('consume')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'consume'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="fa-solid fa-shopping-cart mr-1"></i>
              次卡消费
            </button>
            <button
              onClick={() => setActiveTab('recharge')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'recharge'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="fa-solid fa-plus mr-1"></i>
              余额充值
            </button>
          </div>

          {/* 消费面板 */}
          {activeTab === 'consume' && (
            <div className="space-y-4">
              {/* 会员次卡状态 */}
              {member.card ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">{member.card.type}</p>
                      <p className="text-xs text-blue-700">
                        剩余 {member.card.remainingCount} 次 / 共 {member.card.totalCount} 次
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-600">有效期至</p>
                      <p className="text-xs text-blue-800 font-medium">{member.card.expiryDate}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">该会员暂无次卡</p>
                </div>
              )}

              {/* 快速服务选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">快速选择服务</label>
                <div className="grid grid-cols-2 gap-2">
                  {quickServices.map((service, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickService(service)}
                      className="p-2 text-left border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-500">¥{service.amount}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 服务详情 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">服务项目</label>
                  <input
                    type="text"
                    value={consumeForm.service}
                    onChange={(e) => handleConsumeChange('service', e.target.value)}
                    placeholder="输入服务项目"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
                  <input
                    type="number"
                    value={consumeForm.amount}
                    onChange={(e) => handleConsumeChange('amount', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">服务类别</label>
                  <select
                    value={consumeForm.category}
                    onChange={(e) => handleConsumeChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {serviceCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
                  <select
                    value={consumeForm.paymentMethod}
                    onChange={(e) => handleConsumeChange('paymentMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 使用次卡选项 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useCard"
                  checked={consumeForm.usedCard}
                  onChange={(e) => handleConsumeChange('usedCard', e.target.checked)}
                  disabled={!member.card || member.card.remainingCount <= 0}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useCard" className="ml-2 block text-sm text-gray-700">
                  使用次卡消费
                  {(!member.card || member.card.remainingCount <= 0) && (
                    <span className="text-gray-400 ml-1">(无可用次卡)</span>
                  )}
                </label>
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={consumeForm.notes}
                  onChange={(e) => handleConsumeChange('notes', e.target.value)}
                  placeholder="输入备注信息（选填）"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 提交按钮 */}
              <button
                onClick={handleSubmitConsume}
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    处理中...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-2"></i>
                    确认消费
                  </>
                )}
              </button>
            </div>
          )}

          {/* 充值面板 */}
          {activeTab === 'recharge' && (
            <div className="space-y-4">
              {/* 当前余额显示 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">当前余额</p>
                    <p className="text-lg font-bold text-green-700">¥{member.balance || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600">充值后余额</p>
                    <p className="text-sm font-medium text-green-800">
                      ¥{(member.balance || 0) + (parseFloat(rechargeForm.amount) || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 快速充值金额 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">快速选择金额</label>
                <div className="grid grid-cols-4 gap-2">
                  {quickRechargeAmounts.map(amount => (
                    <button
                      key={amount}
                      onClick={() => handleQuickRecharge(amount)}
                      className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-md hover:border-green-300 hover:bg-green-50 transition-colors"
                    >
                      ¥{amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* 充值详情 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">充值金额</label>
                  <input
                    type="number"
                    value={rechargeForm.amount}
                    onChange={(e) => handleRechargeChange('amount', e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
                  <select
                    value={rechargeForm.paymentMethod}
                    onChange={(e) => handleRechargeChange('paymentMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {paymentMethods.filter(method => method !== '会员卡支付').map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={rechargeForm.notes}
                  onChange={(e) => handleRechargeChange('notes', e.target.value)}
                  placeholder="输入充值备注信息（选填）"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* 提交按钮 */}
              <button
                onClick={handleSubmitRecharge}
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    处理中...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-2"></i>
                    确认充值
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberQuickActions;