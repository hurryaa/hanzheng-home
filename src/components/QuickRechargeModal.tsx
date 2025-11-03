import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  storage,
  formatDate,
  getMembers,
  addRechargeRecord,
  searchMembers
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

interface QuickRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedMember?: Member;
}

const QuickRechargeModal: React.FC<QuickRechargeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedMember
}) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(preSelectedMember || null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('微信支付');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 快速充值金额选项
  const quickAmounts = [100, 200, 500, 1000, 2000];

  // 支付方式选项
  const paymentMethods = ['微信支付', '支付宝', '现金', '银行卡'];

  // 重置表单
  const resetForm = () => {
    if (!preSelectedMember) {
      setSelectedMember(null);
      setSearchKeyword('');
    }
    setSearchResults([]);
    setShowSearchResults(false);
    setAmount('');
    setPaymentMethod('微信支付');
    setNotes('');
    setIsSubmitting(false);
  };

  // 当模态框打开时重置表单
  useEffect(() => {
    if (isOpen) {
      resetForm();
      if (preSelectedMember) {
        setSelectedMember(preSelectedMember);
        setSearchKeyword(preSelectedMember.name);
      }
    }
  }, [isOpen, preSelectedMember]);

  // 搜索会员
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);

    if (keyword.length >= 2) {
      const results = searchMembers(keyword);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      if (!preSelectedMember) {
        setSelectedMember(null);
      }
    }
  };

  // 选择会员
  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setSearchKeyword(member.name);
    setShowSearchResults(false);
  };

  // 快速选择金额
  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  // 提交充值
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMember) {
      toast.error('请选择会员');
      return;
    }

    const rechargeAmount = parseFloat(amount);
    if (!amount || rechargeAmount <= 0) {
      toast.error('请输入有效的充值金额');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentBalance = selectedMember.balance || 0;
      const newBalance = currentBalance + rechargeAmount;

      // 创建充值记录
      const rechargeRecord = {
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        phone: selectedMember.phone,
        time: formatDate(new Date()),
        amount: rechargeAmount,
        balance: newBalance,
        paymentMethod: paymentMethod,
        operator: '管理员',
        notes: notes
      };

      // 添加充值记录
      addRechargeRecord(rechargeRecord);

      // 更新会员余额
      const members = getMembers();
      const memberIndex = members.findIndex(m => m.id === selectedMember.id);
      if (memberIndex !== -1) {
        const updatedMembers = [...members];
        updatedMembers[memberIndex] = {
          ...members[memberIndex],
          balance: newBalance
        };
        storage.set('members', updatedMembers);
      }

      toast.success(`充值成功！${selectedMember.name} 当前余额：¥${newBalance}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('充值失败:', error);
      toast.error('充值失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container') && !target.closest('.search-results')) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSearchResults]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            <i className="fa-solid fa-plus-circle text-green-600 mr-2"></i>
            快速充值
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* 会员搜索 */}
          {!preSelectedMember && (
            <div className="mb-6 search-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择会员 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={handleSearch}
                  placeholder="输入会员姓名或手机号"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  required
                />

                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 search-results max-h-60 overflow-y-auto">
                    {searchResults.map(member => (
                      <div
                        key={member.id}
                        onClick={() => handleSelectMember(member)}
                        className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">¥{member.balance || 0}</p>
                            <p className="text-xs text-gray-500">当前余额</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 px-4 py-3 text-gray-500 text-center">
                    未找到匹配的会员
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 选中的会员信息 */}
          {selectedMember && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">{selectedMember.name}</h3>
                  <p className="text-sm text-green-700">会员ID: {selectedMember.id}</p>
                  <p className="text-sm text-green-700">手机号: {selectedMember.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700">¥{selectedMember.balance || 0}</p>
                  <p className="text-xs text-green-600">当前余额</p>
                </div>
              </div>

              {/* 充值后余额预览 */}
              {amount && parseFloat(amount) > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">充值后余额:</span>
                    <span className="text-lg font-bold text-green-800">
                      ¥{(selectedMember.balance || 0) + parseFloat(amount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 快速金额选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">快速选择金额</label>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map(quickAmount => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => handleQuickAmount(quickAmount)}
                  className={`px-3 py-2 text-sm font-medium border rounded-md transition-colors ${
                    amount === quickAmount.toString()
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  ¥{quickAmount}
                </button>
              ))}
            </div>
          </div>

          {/* 充值金额输入 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              充值金额 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">¥</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                className="block w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>
          </div>

          {/* 支付方式 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">支付方式</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* 备注 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">备注信息</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="输入充值备注信息（选填）"
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedMember || !amount}
              className="flex-1 px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  充值中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check mr-2"></i>
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

export default QuickRechargeModal;