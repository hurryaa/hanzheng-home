import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  storage,
  formatDate,
  getMembers,
  addConsumptionRecord,
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

interface QuickConsumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedMember?: Member;
}

const QuickConsumeModal: React.FC<QuickConsumeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedMember
}) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(preSelectedMember || null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [service, setService] = useState('');
  const [category, setCategory] = useState('汗蒸服务');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('会员卡支付');
  const [usedCard, setUsedCard] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 快速服务选项
  const quickServices = [
    { name: '标准汗蒸', category: '汗蒸服务', amount: 68 },
    { name: '豪华汗蒸', category: '汗蒸服务', amount: 98 },
    { name: '全身按摩', category: '按摩服务', amount: 128 },
    { name: '足底按摩', category: '按摩服务', amount: 88 },
    { name: '肩颈理疗', category: '理疗服务', amount: 108 },
    { name: '汗蒸+按摩', category: '组合服务', amount: 168 }
  ];

  // 服务类别选项
  const serviceCategories = [
    '汗蒸服务', '按摩服务', '理疗服务', '组合服务', '其他服务'
  ];

  // 支付方式选项
  const paymentMethods = [
    '会员卡支付', '微信支付', '支付宝', '现金', '银行卡'
  ];

  // 重置表单
  const resetForm = () => {
    if (!preSelectedMember) {
      setSelectedMember(null);
      setSearchKeyword('');
    }
    setSearchResults([]);
    setShowSearchResults(false);
    setService('');
    setCategory('汗蒸服务');
    setAmount('');
    setPaymentMethod('会员卡支付');
    setUsedCard(true);
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
        // 如果会员有次卡，默认使用次卡
        setUsedCard(!!preSelectedMember.card && preSelectedMember.card.remainingCount > 0);
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
    // 如果会员有次卡，默认使用次卡
    setUsedCard(!!member.card && member.card.remainingCount > 0);
  };

  // 快速选择服务
  const handleQuickService = (quickService: typeof quickServices[0]) => {
    setService(quickService.name);
    setCategory(quickService.category);
    setAmount(quickService.amount.toString());
  };

  // 提交消费记录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMember) {
      toast.error('请选择会员');
      return;
    }

    if (!service) {
      toast.error('请输入服务项目');
      return;
    }

    const consumeAmount = parseFloat(amount);
    if (!amount || consumeAmount <= 0) {
      toast.error('请输入有效的消费金额');
      return;
    }

    if (usedCard && (!selectedMember.card || selectedMember.card.remainingCount <= 0)) {
      toast.error('该会员没有可用的次卡');
      return;
    }

    setIsSubmitting(true);
    try {
      // 创建消费记录
      const consumptionRecord = {
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        phone: selectedMember.phone,
        time: formatDate(new Date()),
        service: service,
        category: category,
        amount: consumeAmount,
        paymentMethod: paymentMethod,
        status: '已完成' as const,
        operator: '管理员',
        usedCard: usedCard,
        notes: notes
      };

      // 添加消费记录
      addConsumptionRecord(consumptionRecord);

      toast.success(`消费记录添加成功！${selectedMember.name} - ${service}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('添加消费记录失败:', error);
      toast.error('添加消费记录失败，请重试');
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            <i className="fa-solid fa-shopping-cart text-blue-600 mr-2"></i>
            快速消费
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />

                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 search-results max-h-60 overflow-y-auto">
                    {searchResults.map(member => (
                      <div
                        key={member.id}
                        onClick={() => handleSelectMember(member)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-blue-600">¥{member.balance || 0}</p>
                            {member.card && member.card.remainingCount > 0 && (
                              <p className="text-xs text-green-600">次卡: {member.card.remainingCount}次</p>
                            )}
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
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">{selectedMember.name}</h3>
                  <p className="text-sm text-blue-700">会员ID: {selectedMember.id}</p>
                  <p className="text-sm text-blue-700">手机号: {selectedMember.phone}</p>
                  <p className="text-sm text-blue-700">余额: ¥{selectedMember.balance || 0}</p>
                </div>
                <div className="text-right">
                  {selectedMember.card ? (
                    <div>
                      <p className="text-sm font-medium text-blue-800">{selectedMember.card.type}</p>
                      <p className="text-xs text-blue-600">
                        剩余 {selectedMember.card.remainingCount} / {selectedMember.card.totalCount} 次
                      </p>
                      <p className="text-xs text-blue-600">有效期: {selectedMember.card.expiryDate}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">无次卡</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 快速服务选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">快速选择服务</label>
            <div className="grid grid-cols-2 gap-3">
              {quickServices.map((quickService, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickService(quickService)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    service === quickService.name
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <p className="font-medium text-sm">{quickService.name}</p>
                  <p className="text-xs text-gray-500">{quickService.category} • ¥{quickService.amount}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 服务详情 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                服务项目 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="输入服务项目"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">服务类别</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {serviceCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                消费金额 <span className="text-red-500">*</span>
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
                  className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">支付方式</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 使用次卡选项 */}
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="usedCard"
                checked={usedCard}
                onChange={(e) => setUsedCard(e.target.checked)}
                disabled={!selectedMember?.card || selectedMember.card.remainingCount <= 0}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="usedCard" className="ml-2 block text-sm text-gray-700">
                使用次卡消费
                {selectedMember && (!selectedMember.card || selectedMember.card.remainingCount <= 0) && (
                  <span className="text-gray-400 ml-1">(无可用次卡)</span>
                )}
              </label>
            </div>
          </div>

          {/* 备注 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">备注信息</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="输入消费备注信息（选填）"
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
              disabled={isSubmitting || !selectedMember || !service || !amount}
              className="flex-1 px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        </form>
      </div>
    </div>
  );
};

export default QuickConsumeModal;