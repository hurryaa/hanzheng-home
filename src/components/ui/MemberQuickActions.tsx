import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui';

interface Member {
  id: string;
  name: string;
  phone: string;
  balance?: number;
  card?: {
    id: string;
    type: string;
    totalCount: number;
    usedCount: number;
    remainingCount: number;
    expiryDate: string;
  };
}

interface MemberQuickActionsProps {
  member: Member;
  onUpdate: (member: Member) => void;
  className?: string;
}

// 快速充值模态框
const QuickRechargeModal = ({
  isOpen,
  onClose,
  member,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onConfirm: (amount: number, paymentMethod: string) => void;
}) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('微信支付');
  const [isLoading, setIsLoading] = useState(false);

  const quickAmounts = [50, 100, 200, 500, 1000];
  const paymentMethods = ['微信支付', '支付宝', '现金', '银行卡'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rechargeAmount = parseFloat(amount);
    if (!rechargeAmount || rechargeAmount <= 0) {
      toast.error('请输入有效的充值金额');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(rechargeAmount, paymentMethod);
      onClose();
      setAmount('');
    } catch (error) {
      console.error('充值失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in-0 zoom-in-95">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">快速充值</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-600">
            <i className="fa-solid fa-user mr-2"></i>
            <span>{member.name} ({member.phone})</span>
          </div>
          <div className="mt-1 text-sm text-gray-500">
            当前余额: ¥{member.balance || 0}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              充值金额
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* 快速金额选择 */}
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">快速选择:</p>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    ¥{quickAmount}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              支付方式
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {amount && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">充值后余额:</span>
                <span className="font-medium text-blue-600">
                  ¥{((member.balance || 0) + parseFloat(amount || '0')).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !amount}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  处理中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-credit-card mr-2"></i>
                  确认充值
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 快速消费模态框
const QuickConsumeModal = ({
  isOpen,
  onClose,
  member,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onConfirm: (service: string, amount: number, useCard: boolean) => void;
}) => {
  const [service, setService] = useState('');
  const [amount, setAmount] = useState('');
  const [useCard, setUseCard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const commonServices = [
    { name: '汗蒸服务', price: 68 },
    { name: '按摩服务', price: 128 },
    { name: '理疗服务', price: 88 },
    { name: '足疗服务', price: 98 },
    { name: '组合套餐', price: 168 }
  ];

  const canUseCard = member.card && member.card.remainingCount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!service) {
      toast.error('请选择服务项目');
      return;
    }

    const consumeAmount = parseFloat(amount);
    if (!consumeAmount || consumeAmount <= 0) {
      toast.error('请输入有效的消费金额');
      return;
    }

    if (useCard && !canUseCard) {
      toast.error('该会员没有可用的次卡');
      return;
    }

    if (!useCard && (member.balance || 0) < consumeAmount) {
      toast.error('会员余额不足');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(service, consumeAmount, useCard);
      onClose();
      setService('');
      setAmount('');
      setUseCard(false);
    } catch (error) {
      console.error('消费失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in-0 zoom-in-95">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">快速消费</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-600">
            <i className="fa-solid fa-user mr-2"></i>
            <span>{member.name} ({member.phone})</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-gray-500">余额: ¥{member.balance || 0}</span>
            {member.card && (
              <span className="text-gray-500">
                次卡: {member.card.remainingCount}/{member.card.totalCount}次
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              服务项目
            </label>
            <div className="grid grid-cols-1 gap-2 mb-3">
              {commonServices.map((serviceItem) => (
                <button
                  key={serviceItem.name}
                  type="button"
                  onClick={() => {
                    setService(serviceItem.name);
                    setAmount(serviceItem.price.toString());
                  }}
                  className={cn(
                    "p-3 text-left border rounded-lg transition-colors",
                    service === serviceItem.name
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{serviceItem.name}</span>
                    <span className="text-sm text-gray-500">¥{serviceItem.price}</span>
                  </div>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="或输入自定义服务项目"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              消费金额
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {canUseCard && (
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCard}
                  onChange={(e) => setUseCard(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  使用次卡消费 (剩余 {member.card?.remainingCount} 次)
                </span>
              </label>
            </div>
          )}

          {amount && !useCard && (
            <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">消费后余额:</span>
                <span className={cn(
                  "font-medium",
                  (member.balance || 0) - parseFloat(amount || '0') >= 0
                    ? "text-green-600"
                    : "text-red-600"
                )}>
                  ¥{((member.balance || 0) - parseFloat(amount || '0')).toFixed(2)}
                </span>
              </div>
              {(member.balance || 0) - parseFloat(amount || '0') < 0 && (
                <p className="text-xs text-red-600 mt-1">余额不足，请先充值</p>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !service || !amount || (!useCard && (member.balance || 0) < parseFloat(amount || '0'))}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  处理中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-shopping-cart mr-2"></i>
                  确认消费
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 主要的快速操作组件
export default function MemberQuickActions({ member, onUpdate, className }: MemberQuickActionsProps) {
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const { showConfirm, ConfirmDialog } = useConfirmDialog();

  // 处理充值
  const handleRecharge = async (amount: number, paymentMethod: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedMember = {
        ...member,
        balance: (member.balance || 0) + amount
      };

      // 保存充值记录
      const rechargeRecord = {
        id: `R${Date.now()}`,
        memberId: member.id,
        memberName: member.name,
        amount,
        paymentMethod,
        time: new Date().toLocaleString(),
        balance: updatedMember.balance,
        operator: '管理员'
      };

      // 更新本地存储
      const recharges = JSON.parse(localStorage.getItem('recharges') || '[]');
      recharges.unshift(rechargeRecord);
      localStorage.setItem('recharges', JSON.stringify(recharges));

      // 更新会员信息
      const members = JSON.parse(localStorage.getItem('members') || '[]');
      const memberIndex = members.findIndex((m: Member) => m.id === member.id);
      if (memberIndex !== -1) {
        members[memberIndex] = updatedMember;
        localStorage.setItem('members', JSON.stringify(members));
      }

      onUpdate(updatedMember);
      toast.success(`充值成功！充值金额：¥${amount}`);
    } catch (error) {
      toast.error('充值失败，请重试');
      throw error;
    }
  };

  // 处理消费
  const handleConsume = async (service: string, amount: number, useCard: boolean) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      let updatedMember = { ...member };

      if (useCard && member.card) {
        // 使用次卡
        updatedMember.card = {
          ...member.card,
          usedCount: member.card.usedCount + 1,
          remainingCount: member.card.remainingCount - 1
        };
      } else {
        // 使用余额
        updatedMember.balance = (member.balance || 0) - amount;
      }

      // 保存消费记录
      const consumptionRecord = {
        id: `C${Date.now()}`,
        memberId: member.id,
        memberName: member.name,
        phone: member.phone,
        time: new Date().toLocaleString(),
        service,
        category: '汗蒸服务', // 可以根据服务类型动态设置
        amount,
        paymentMethod: useCard ? '次卡支付' : '会员卡支付',
        status: '已完成',
        operator: '管理员',
        usedCard: useCard
      };

      // 更新本地存储
      const consumptions = JSON.parse(localStorage.getItem('consumptions') || '[]');
      consumptions.unshift(consumptionRecord);
      localStorage.setItem('consumptions', JSON.stringify(consumptions));

      // 更新会员信息
      const members = JSON.parse(localStorage.getItem('members') || '[]');
      const memberIndex = members.findIndex((m: Member) => m.id === member.id);
      if (memberIndex !== -1) {
        members[memberIndex] = updatedMember;
        localStorage.setItem('members', JSON.stringify(members));
      }

      onUpdate(updatedMember);
      toast.success(`消费成功！服务：${service}，金额：¥${amount}`);
    } catch (error) {
      toast.error('消费失败，请重试');
      throw error;
    }
  };

  return (
    <>
      <div className={cn("flex items-center space-x-2", className)}>
        {/* 快速充值按钮 */}
        <button
          onClick={() => setShowRechargeModal(true)}
          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors duration-200 group"
          title="快速充值"
        >
          <i className="fa-solid fa-plus-circle text-lg group-hover:scale-110 transition-transform"></i>
        </button>

        {/* 快速消费按钮 */}
        <button
          onClick={() => setShowConsumeModal(true)}
          className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors duration-200 group"
          title="快速消费"
        >
          <i className="fa-solid fa-shopping-cart text-lg group-hover:scale-110 transition-transform"></i>
        </button>

        {/* 次卡使用按钮 */}
        {member.card && member.card.remainingCount > 0 && (
          <button
            onClick={() => {
              showConfirm({
                title: '使用次卡',
                message: `确认为 ${member.name} 使用一次次卡服务吗？\n剩余次数：${member.card?.remainingCount} 次`,
                type: 'info',
                confirmText: '确认使用',
                onConfirm: async () => {
                  await handleConsume('次卡服务', 0, true);
                }
              });
            }}
            className="p-2 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors duration-200 group"
            title={`使用次卡 (剩余${member.card.remainingCount}次)`}
          >
            <i className="fa-solid fa-ticket-alt text-lg group-hover:scale-110 transition-transform"></i>
          </button>
        )}
      </div>

      {/* 快速充值模态框 */}
      <QuickRechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        member={member}
        onConfirm={handleRecharge}
      />

      {/* 快速消费模态框 */}
      <QuickConsumeModal
        isOpen={showConsumeModal}
        onClose={() => setShowConsumeModal(false)}
        member={member}
        onConfirm={handleConsume}
      />

      {/* 确认对话框 */}
      <ConfirmDialog />
    </>
  );
}