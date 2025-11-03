import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  phone: string;
  balance?: number;
}

interface QuickRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onConfirm: (amount: number, paymentMethod: string) => void;
}

export default function QuickRechargeModal({
  isOpen,
  onClose,
  member,
  onConfirm
}: QuickRechargeModalProps) {
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
              aria-label="关闭"
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
                autoFocus
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
                    className={cn(
                      "px-3 py-1 text-sm border rounded-md transition-colors",
                      amount === quickAmount.toString()
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:bg-gray-50"
                    )}
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
}