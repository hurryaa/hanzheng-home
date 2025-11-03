import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { cn, storage, formatDate, getMembers, getMemberById, initRechargeData, initCardTypes, searchMembers, initStorageData, ConsumptionRecord, deleteConsumptionRecord, updateConsumptionRecord } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui';

// 状态标签组件
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case '已完成':
        return 'bg-green-100 text-green-800';
      case '已取消':
        return 'bg-red-100 text-red-800';
      case '进行中':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle()}`}>
      {status}
    </span>
  );
};

// 会员数据模型
interface Member {
  id: string;
  name: string;
  phone: string;
  card?: Card;
  joinDate: string;
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

// 更新会员次卡使用次数
export const updateMemberCardUsage = (memberId: string): boolean => {
  const members = getMembers();
  const memberIndex = members.findIndex(member => member.id === memberId);
  
  if (memberIndex === -1 || !members[memberIndex].card) {
    return false; // 会员不存在或没有次卡
  }
  
  // 更新次卡使用次数
  const updatedMember = { ...members[memberIndex] };
  updatedMember.card.usedCount += 1;
  updatedMember.card.remainingCount -= 1;
  
  members[memberIndex] = updatedMember;
  storage.set('members', members);
  return true;
};

// 获取所有消费记录
export const getConsumptionRecords = (): ConsumptionRecord[] => {
  return storage.get<ConsumptionRecord[]>('consumptions') || [];
};

// 添加消费记录
export const addConsumptionRecord = (record: Omit<ConsumptionRecord, 'id'>): ConsumptionRecord => {
  const records = getConsumptionRecords();
  const newRecord: ConsumptionRecord = {
    ...record,
    id: `CR${Date.now().toString().slice(-6)}`
  };
  
  // 如果使用了次卡，更新次卡使用次数
  if (newRecord.usedCard) {
    updateMemberCardUsage(newRecord.memberId);
  }
  
  // 添加到记录列表并保存
  records.unshift(newRecord); // 添加到开头
  storage.set('consumptions', records);
  
  return newRecord;
};

// 服务类别选项
const serviceCategories = [
  { id: '', name: '全部类别' },
  { id: '汗蒸服务', name: '汗蒸服务' },
  { id: '按摩服务', name: '按摩服务' },
  { id: '理疗服务', name: '理疗服务' },
  { id: '组合服务', name: '组合服务' },
  { id: '其他服务', name: '其他服务' },
];

// 支付方式选项
const paymentMethods = [
  { id: '', name: '全部方式' },
  { id: '会员卡支付', name: '会员卡支付' },
  { id: '微信支付', name: '微信支付' },
  { id: '支付宝', name: '支付宝' },
  { id: '现金', name: '现金' },
];

  // 会员信息卡片组件
  const MemberInfoCard = ({ member }: { member: Member }) => {
    if (!member) return null;
    
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{member.name}</h3>
            <p className="text-sm text-gray-600">会员ID: {member.id}</p>
            <p className="text-sm text-gray-600">手机号: {member.phone}</p>
            <p className="text-sm text-gray-600">加入日期: {member.joinDate}</p>
          </div>
          <div className="bg-white rounded-full p-2 shadow-sm">
            <i className="fa-solid fa-user text-blue-600 text-xl"></i>
          </div>
        </div>
        
        {member.card && (
          <div className="mt-4 pt-4 border-t border-blue-100">
            <h4 className="font-medium text-gray-800 mb-2">次卡信息</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded p-3 shadow-sm">
                <p className="text-xs text-gray-500">卡类型</p>
                <p className="font-medium">{member.card.type}</p>
              </div>
              <div className="bg-white rounded p-3 shadow-sm">
                <p className="text-xs text-gray-500">总次数</p>
                <p className="font-medium">{member.card.totalCount}</p>
              </div>
              <div className="bg-white rounded p-3 shadow-sm">
                <p className="text-xs text-gray-500">已使用</p>
                <p className="font-medium text-yellow-600">{member.card.usedCount}</p>
              </div>
              <div className="bg-white rounded p-3 shadow-sm">
                <p className="text-xs text-gray-500">剩余次数</p>
                <p className="font-medium text-green-600">{member.card.remainingCount}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">有效期至</p>
                <p className="font-medium">{member.card.expiryDate}</p>
              </div>
              <div>
                {calculateDaysUntilExpiry(member.card.expiryDate) <= 30 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    即将过期
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 消费详情模态框组件
  const ConsumptionDetailModal = ({
    isOpen,
    onClose,
    record
  }: {
    isOpen: boolean;
    onClose: () => void;
    record?: ConsumptionRecord;
  }) => {
    if (!isOpen || !record) return null;
    
    // 获取会员信息
    const member = getMemberById(record.memberId);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">消费记录详情</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
          
          <div className="p-6">
            {/* 会员信息 */}
            {member && <MemberInfoCard member={member} />}
            
            {/* 消费记录详情 */}
            <div className="bg-gray-50 rounded-lg p-5 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">消费详情</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">消费单号</p>
                  <p className="font-medium text-gray-900">{record.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">消费时间</p>
                  <p className="font-medium text-gray-900">{record.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">服务项目</p>
                  <p className="font-medium text-gray-900">{record.service}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">服务类别</p>
                  <p className="font-medium text-gray-900">{record.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">消费金额</p>
                  <p className="font-medium text-gray-900">¥{record.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">支付方式</p>
                  <p className="font-medium text-gray-900">{record.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">次卡使用</p>
                  <p className="font-medium text-gray-900">{record.usedCard ? '是' : '否'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">操作员</p>
                  <p className="font-medium text-gray-900">{record.operator}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">消费状态</p>
                <StatusBadge status={record.status} />
              </div>
            </div>
            
            {/* 备注信息 */}
            {record.notes && (
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">备注信息</h3>
                <p className="text-gray-700">{record.notes}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 编辑消费记录模态框组件
  const EditConsumptionModal = ({
    isOpen,
    onClose,
    record,
    onSubmit
  }: {
    isOpen: boolean;
    onClose: () => void;
    record?: ConsumptionRecord;
    onSubmit: (record: ConsumptionRecord) => void;
  }) => {
    const [formData, setFormData] = useState({
      service: '',
      category: '',
      amount: '',
      paymentMethod: '',
      status: '已完成' as const,
      notes: '',
      usedCard: false
    });
    const [error, setError] = useState('');
    
    // 当记录加载或变化时初始化表单数据
    useEffect(() => {
      if (record) {
        setFormData({
          service: record.service,
          category: record.category,
          amount: record.amount.toString(),
          paymentMethod: record.paymentMethod,
          status: record.status,
          notes: record.notes || '',
          usedCard: record.usedCard
        });
      }
    }, [record]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    };
    
    const validateForm = () => {
      if (!formData.service) {
        setError('请填写服务项目');
        return false;
      }
      
      if (!formData.category) {
        setError('请选择服务类别');
        return false;
      }
      
      if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
        setError('请填写有效的金额');
        return false;
      }
      
      if (!formData.paymentMethod) {
        setError('请选择支付方式');
        return false;
      }
      
      setError('');
      return true;
    };
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!record) return;
      
      if (!validateForm()) {
        return;
      }
      
      const updatedRecord: ConsumptionRecord = {
        ...record,
        ...formData,
        amount: Number(formData.amount)
      };
      
      onSubmit(updatedRecord);
    };
    
    if (!isOpen || !record) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">编辑消费记录</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
          
          {error && (
            <div className="px-6 py-3 bg-red-50 text-red-700 text-sm">
              <i className="fa-solid fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">服务项目 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">服务类别 <span className="text-red-500">*</span></label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">请选择类别</option>
                  {serviceCategories.slice(1).map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">消费金额 (元) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">支付方式 <span className="text-red-500">*</span></label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">请选择支付方式</option>
                  {paymentMethods.slice(1).map(method => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">消费状态 <span className="text-red-500">*</span></label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="已完成">已完成</option>
                  <option value="已取消">已取消</option>
                  <option value="进行中">进行中</option>
                </select>
              </div>
              
              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="usedCard"
                    name="usedCard"
                    checked={formData.usedCard}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="usedCard" className="ml-2 block text-sm text-gray-700">
                    使用次卡消费
                  </label>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">备注信息</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="输入备注信息（选填）"
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
              >
                <i className="fa-solid fa-save mr-2"></i>保存修改
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

// 计算次卡剩余天数
const calculateDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// 状态选项
const statusOptions = [
  { id: '', name: '全部状态' },
  { id: '已完成', name: '已完成' },
  { id: '已取消', name: '已取消' },
  { id: '进行中', name: '进行中' },
];



// 日期范围选择器组件
const DateRangePicker = ({ startDate, endDate, onDateChange, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  // 点击外部关闭日期选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.date-picker-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // 同步外部状态变化
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('zh-CN');
  };

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    onClear();
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!startDate && !endDate) return '选择日期范围';
    if (startDate && endDate) {
      return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
    }
    if (startDate) return `从 ${formatDateForDisplay(startDate)}`;
    if (endDate) return `到 ${formatDateForDisplay(endDate)}`;
    return '选择日期范围';
  };

  const quickRanges = [
    {
      label: '今天',
      getValue: () => {
        const today = new Date();
        return [today, today];
      }
    },
    {
      label: '昨天',
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return [yesterday, yesterday];
      }
    },
    {
      label: '最近7天',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return [start, end];
      }
    },
    {
      label: '最近30天',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return [start, end];
      }
    },
    {
      label: '本月',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return [start, end];
      }
    },
    {
      label: '上月',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return [start, end];
      }
    }
  ];

  const handleQuickRange = (range) => {
    const [start, end] = range.getValue();
    setTempStartDate(start);
    setTempEndDate(end);
  };

  return (
    <div className="relative date-picker-container">
      <div className="flex items-center">
        <label className="block text-sm font-medium text-gray-700 mr-2">日期范围:</label>
        <div className="relative">
          <input
            type="text"
            value={getDisplayText()}
            onClick={() => setIsOpen(!isOpen)}
            readOnly
            placeholder="选择日期范围"
            className="block w-64 pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer bg-white"
          />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
          >
            <i className="fa-solid fa-calendar"></i>
          </button>
        </div>
        {(startDate || endDate) && (
          <button
            onClick={handleClear}
            className="ml-2 text-gray-400 hover:text-gray-600 p-1"
            title="清除日期"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[400px]">
          <div className="flex gap-4">
            {/* 快速选择 */}
            <div className="flex-shrink-0">
              <h4 className="text-sm font-medium text-gray-700 mb-2">快速选择</h4>
              <div className="space-y-1">
                {quickRanges.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => handleQuickRange(range)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 自定义日期选择 */}
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-700 mb-2">自定义范围</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={formatDateForInput(tempStartDate)}
                    onChange={(e) => setTempStartDate(e.target.value ? new Date(e.target.value) : null)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={formatDateForInput(tempEndDate)}
                    onChange={(e) => setTempEndDate(e.target.value ? new Date(e.target.value) : null)}
                    min={formatDateForInput(tempStartDate)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  清除
                </button>
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  应用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 搜索和筛选组件
const SearchFilterPanel = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedPayment,
  setSelectedPayment,
  selectedStatus,
  setSelectedStatus,
  startDate,
  endDate,
  onDateChange,
  onDateClear,
  onResetFilters,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">会员搜索</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索会员姓名或手机号"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">服务类别</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {serviceCategories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>{method.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {statusOptions.map(status => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={onDateChange}
          onClear={onDateClear}
        />

        <div className="flex items-center space-x-3">
          <button
            onClick={onResetFilters}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
          >
            重置筛选
          </button>
          <div className="text-sm text-gray-500">
            筛选条件会自动应用
          </div>
        </div>
      </div>
    </div>
  );
};

// 添加消费记录模态框
const AddConsumptionModal = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    memberPhone: '',
    service: '',
    category: '',
    amount: '',
    paymentMethod: '',
    notes: '',
    usedCard: false,
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [error, setError] = useState('');
  
  // 搜索会员
  const handleSearch = (e) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
    
    if (keyword.length >= 2) {
      const results = searchMembers(keyword);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setSelectedMember(null);
      setFormData(prev => ({
        ...prev,
        memberId: '',
        memberName: '',
        memberPhone: ''
      }));
    }
  };
  
  // 选择会员
  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setShowSearchResults(false);
    setSearchKeyword(member.name);
    setFormData(prev => ({
      ...prev,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      // 如果有次卡，默认选中使用次卡
      usedCard: !!member.card && member.card.remainingCount > 0
    }));
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  const validateForm = () => {
    if (!formData.memberId) {
      setError('请选择会员');
      return false;
    }
    
    if (!formData.service) {
      setError('请填写服务项目');
      return false;
    }
    
    if (!formData.category) {
      setError('请选择服务类别');
      return false;
    }
    
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError('请填写有效的金额');
      return false;
    }
    
    if (!formData.paymentMethod) {
      setError('请选择支付方式');
      return false;
    }
    
    // 如果选择使用次卡但会员没有次卡或次卡已用完
    if (formData.usedCard && (!selectedMember?.card || selectedMember.card.remainingCount <= 0)) {
      setError('该会员没有可用的次卡');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(formData);
    onClose();
    
    // 重置表单
    setFormData({
      memberId: '',
      memberName: '',
      memberPhone: '',
      service: '',
      category: '',
      amount: '',
      paymentMethod: '',
      notes: '',
      usedCard: false,
    });
    setSelectedMember(null);
    setSearchKeyword('');
    setSearchResults([]);
  };
  
   // 点击模态框外部关闭搜索结果
   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       const target = event.target as HTMLElement;
       if (!target.closest('.search-container') && !target.closest('.search-results')) {
         setShowSearchResults(false);
       }
     };
     
     document.addEventListener('mousedown', handleClickOutside);
     return () => {
       document.removeEventListener('mousedown', handleClickOutside);
     };
   }, []);
   
   if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">添加消费记录</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        {error && (
          <div className="px-6 py-3 bg-red-50 text-red-700 text-sm">
            <i className="fa-solid fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* 会员搜索 */}
          <div className="mb-6 search-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">会员搜索 <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fa-solid fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                value={searchKeyword}
                onChange={handleSearch}
                placeholder="输入会员姓名或手机号"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
              
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 search-results max-h-60 overflow-y-auto">
                  {searchResults.map(member => (
                    <div 
                      key={member.id}
                      onClick={() => handleSelectMember(member)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.phone}</p>
                      </div>
                      {member.card && member.card.remainingCount > 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          剩余: {member.card.remainingCount}次
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {showSearchResults && searchResults.length === 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 px-4 py-3 text-gray-500">
                  未找到匹配的会员
                </div>
              )}
            </div>
          </div>
          
          {/* 选中的会员信息 */}
          {selectedMember && <MemberInfoCard member={selectedMember} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务项目 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务类别 <span className="text-red-500">*</span></label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">请选择类别</option>
                {serviceCategories.slice(1).map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">消费金额 (元) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支付方式 <span className="text-red-500">*</span></label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">请选择支付方式</option>
                {paymentMethods.slice(1).map(method => (
                  <option key={method.id} value={method.id}>{method.name}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="usedCard"
                  name="usedCard"
                  checked={formData.usedCard}
                  onChange={handleChange}
                  disabled={!selectedMember?.card || selectedMember.card.remainingCount <= 0}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="usedCard" className="ml-2 block text-sm text-gray-700">
                  使用次卡消费
                </label>
                {selectedMember?.card && selectedMember.card.remainingCount <= 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    (次卡次数已用完)
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">备注信息</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="输入备注信息（选填）"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
            >
              <i className="fa-solid fa-save mr-2"></i>保存记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ConsumptionLogs() {
  const [consumptionData, setConsumptionData] = useState<ConsumptionRecord[]>([]);
  const [filteredData, setFilteredData] = useState<ConsumptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage, setItemsPerPage] = useState(10);
   const [isDetailOpen, setIsDetailOpen] = useState(false);
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [selectedRecord, setSelectedRecord] = useState<ConsumptionRecord | null>(null);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 确认对话框
  const { showConfirm, ConfirmDialog } = useConfirmDialog();
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // 初始化数据和加载消费记录
  useEffect(() => {
  // 初始化本地存储数据（包含充值和次卡类型数据）
  initRechargeData();
  initCardTypes();
    initStorageData();
    
    // 加载消费记录
    const loadData = () => {
      const records = getConsumptionRecords();
      setConsumptionData(records);
      setFilteredData(records);
      setLoading(false);
    };
    
    // 模拟加载延迟
    const timer = setTimeout(loadData, 800);
    return () => clearTimeout(timer);
  }, []);
  
  // 应用筛选
  useEffect(() => {
    let result = [...consumptionData];

    // 搜索筛选
    if (searchTerm) {
      const lowerCaseTerm = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.memberName.toLowerCase().includes(lowerCaseTerm) ||
        item.phone.includes(searchTerm) ||
        item.memberId.includes(searchTerm)
      );
    }

    // 类别筛选
    if (selectedCategory) {
      result = result.filter(item => item.category === selectedCategory);
    }

    // 支付方式筛选
    if (selectedPayment) {
      result = result.filter(item => item.paymentMethod === selectedPayment);
    }

    // 状态筛选
    if (selectedStatus) {
      result = result.filter(item => item.status === selectedStatus);
    }

    // 日期范围筛选
    if (startDate || endDate) {
      result = result.filter(item => {
        const itemDate = new Date(item.time);

        // 如果只有开始日期，筛选大于等于开始日期的记录
        if (startDate && !endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          return itemDate >= start;
        }

        // 如果只有结束日期，筛选小于等于结束日期的记录
        if (!startDate && endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return itemDate <= end;
        }

        // 如果有开始和结束日期，筛选在范围内的记录
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }

        return true;
      });
    }

    setFilteredData(result);
    // 重置到第一页
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedPayment, selectedStatus, startDate, endDate, consumptionData]);
  
  // 处理分页
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  // 重置筛选
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedPayment('');
    setSelectedStatus('');
    setStartDate(null);
    setEndDate(null);
  };

  // 处理日期范围变化
  const handleDateChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  // 清除日期范围
  const handleDateClear = () => {
    setStartDate(null);
    setEndDate(null);
  };
  
  // 添加新消费记录
   // 查看消费记录详情
  const handleViewConsumption = (id: string) => {
    const record = consumptionData.find(item => item.id === id);
    if (record) {
      setSelectedRecord(record);
      setIsDetailOpen(true);
    }
  };

  // 编辑消费记录
  const handleEditConsumption = (id: string) => {
    const record = consumptionData.find(item => item.id === id);
    if (record) {
      setSelectedRecord(record);
      setIsEditModalOpen(true);
    }
  };

  // 删除消费记录
  const handleDeleteConsumption = (id: string) => {
    const record = consumptionData.find(item => item.id === id);
    if (!record) return;

    showConfirm({
      title: '删除消费记录',
      message: `确定要删除会员 "${record.memberName}" 的这条消费记录吗？此操作不可撤销。`,
      type: 'danger',
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          const success = deleteConsumptionRecord(id);
          if (success) {
            setConsumptionData(prev => prev.filter(item => item.id !== id));
            toast.success('消费记录已删除');
          } else {
            toast.error('删除失败，请重试');
          }
        } catch (error) {
          console.error('删除消费记录失败:', error);
          toast.error('删除消费记录失败');
          throw error; // 重新抛出错误以保持loading状态
        }
      }
    });
  };

  // 更新消费记录
  const handleUpdateConsumption = (updatedRecord: ConsumptionRecord) => {
    try {
      const success = updateConsumptionRecord(updatedRecord.id, updatedRecord);
      if (success) {
        setConsumptionData(prev => 
          prev.map(record => record.id === updatedRecord.id ? updatedRecord : record)
        );
        setIsEditModalOpen(false);
        toast.success('消费记录更新成功！');
      } else {
        toast.error('更新失败，请重试');
      }
    } catch (error) {
      console.error('更新消费记录失败:', error);
      toast.error('更新消费记录失败，请重试');
    }
  };

   const handleAddConsumption = (newItem) => {
    try {
      // 创建新消费记录对象
      const recordToAdd = {
        memberId: newItem.memberId,
        memberName: newItem.memberName,
        phone: newItem.memberPhone,
        time: formatDate(new Date()),
        service: newItem.service,
        category: newItem.category,
        amount: parseFloat(newItem.amount),
        paymentMethod: newItem.paymentMethod,
        status: '已完成' as const,
        operator: '管理员',
        usedCard: newItem.usedCard,
      };
      
      // 添加到数据库
      const newRecord = addConsumptionRecord(recordToAdd);
      
      // 更新本地状态
      setConsumptionData(prev => [newRecord, ...prev]);
      
      // 显示成功提示
      toast.success('消费记录添加成功！');
    } catch (error) {
      console.error('添加消费记录失败:', error);
      toast.error('添加消费记录失败，请重试');
    }
  };
  
  // 骨架屏组件
  const TableSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <th key={i} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                    <td key={j} className="px-3 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
  
  // 导出消费记录为Excel文件
  const handleExportConsumptions = () => {
    try {
      // 准备Excel数据
      const excelData = filteredData.map(record => ({
        '记录ID': record.id,
        '会员ID': record.memberId,
        '会员姓名': record.memberName,
        '手机号': record.phone,
        '消费时间': record.time,
        '服务项目': record.service,
        '类别': record.category,
        '金额': record.amount,
        '支付方式': record.paymentMethod,
        '状态': record.status,
        '次卡使用': record.usedCard ? '是' : '否'
      }));
      
      // 创建工作簿和工作表
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '消费记录');
      
      // 生成Excel文件
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
      link.setAttribute('href', url);
      link.setAttribute('download', `消费记录_${dateStr}.xlsx`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('消费记录导出成功！');
    } catch (error) {
      console.error('导出消费记录失败:', error);
      toast.error('导出消费记录失败，请重试');
    }
  };

  // 导入记录处理函数
  const handleImportConsumptions = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const importedData = XLSX.utils.sheet_to_json(worksheet);
          
          // 这里可以添加数据验证和导入逻辑
          console.log('导入的数据:', importedData);
          
          // 显示成功消息
          toast.success('记录导入成功！共导入 ' + importedData.length + ' 条记录');
          
          // 清除文件输入
          e.target.value = '';
        } catch (error) {
          console.error('导入记录失败:', error);
          toast.error('导入记录失败，请检查文件格式');
        }
      };
      
      reader.readAsArrayBuffer(file);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">消费日志记录</h1>
          <p className="text-gray-500 mt-1">管理和查看所有会员消费记录</p>
        </div>
        
           <div className="flex items-center space-x-3">
          <input 
            type="file" 
            className="hidden" 
            id="importFile" 
            accept=".xlsx,.xls"
            onChange={handleImportConsumptions}
          />
          <label htmlFor="importFile" className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200 flex items-center cursor-pointer">
            <i className="fa-solid fa-upload mr-2"></i>导入记录
          </label>
          <button 
            onClick={handleExportConsumptions}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200 flex items-center"
          >
            <i className="fa-solid fa-download mr-2"></i>导出记录
          </button>
           <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>添加消费记录
          </button>
        </div>
      </div>
      
      <SearchFilterPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedPayment={selectedPayment}
        setSelectedPayment={setSelectedPayment}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        onDateClear={handleDateClear}
        onResetFilters={handleResetFilters}
      />
      
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">会员信息</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">消费时间</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服务项目</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类别</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方式</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">次卡使用</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-\500 uppercase tracking-wider">操作</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={`https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=${item.memberName}%20avatar%20person`} 
                              alt={item.memberName} 
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.memberName}</div>
                            <div className="text-sm text-gray-500">{item.memberId} | {item.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ¥{item.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                       <StatusBadge status={item.status} />
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         item.usedCard 
                           ? 'bg-green-100 text-green-800' 
                           : 'bg-gray-100 text-gray-800'
                       }`}>
                         {item.usedCard ? '是' : '否'}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         item.usedCard 
                           ? 'bg-green-100 text-green-800' 
                           : 'bg-gray-100 text-gray-800'
                       }`}>
                         {item.usedCard ? '是' : '否'}
                       </span>
                     </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <div className="flex space-x-2">
                           <button 
                             onClick={() => handleViewConsumption(item.id)}
                             className="text-blue-600 hover:text-blue-900 transition duration-200 p-1.5 rounded-full hover:bg-blue-50"
                             aria-label="查看详情"
                           >
                             <i className="fa-solid fa-eye"></i>
                           </button>
                           <button 
                             onClick={() => handleEditConsumption(item.id)}
                             className="text-yellow-600 hover:text-yellow-900 transition duration-200 p-1.5 rounded-full hover:bg-yellow-50"
                             aria-label="编辑"
                           >
                             <i className="fa-solid fa-edit"></i>
                           </button>
                           <button 
                             onClick={() => handleDeleteConsumption(item.id)}
                             className="text-red-600 hover:text-red-900 transition duration-200 p-1.5 rounded-full hover:bg-red-50"
                             aria-label="删除"
                           >
                             <i className="fa-solid fa-trash"></i>
                           </button>
                         </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                          <i className="fa-solid fa-search text-gray-400 text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">未找到消费记录</h3>
                        <p className="text-gray-500 max-w-md">
                          没有找到符合当前筛选条件的消费记录，请尝试调整筛选条件或添加新的消费记录。
                        </p>
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-4 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200"
                        >
                          添加消费记录
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* 分页控件 */}
          {currentItems.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                显示 <span className="font-medium">{indexOfFirstItem + 1}</span> 到 <span className="font-medium">{Math.min(indexOfLastItem, filteredData.length)}</span> 条，共 <span className="font-medium">{filteredData.length}</span> 条记录
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  上一页
                </button>
                
                <div className="flex items-center">
                  {[...Array(Math.min(5, totalPages)).keys()].map((i) => {
                    // 计算要显示的页码，实现分页控件的省略逻辑
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    // 显示省略号
                    if (i === 0 && pageNum > 1) {
                      return (
                        <span key="ellipsis-start" className="px-3 py-1 text-sm text-gray-500">...</span>
                      );
                    }
                    
                    if (i === Math.min(5, totalPages) - 1 && pageNum < totalPages) {
                      return (
                        <span key="ellipsis-end" className="px-3 py-1 text-sm text-gray-500">...</span>
                      );
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "px-3 py-1 rounded-md text-sm font-medium transition duration-200",
                          currentPage === pageNum
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
         {/* 查看详情模态框 */}
         <ConsumptionDetailModal
           isOpen={isDetailOpen}
           onClose={() => setIsDetailOpen(false)}
           record={selectedRecord}
         />


         {/* 编辑模态框 */}
         <EditConsumptionModal
           isOpen={isEditModalOpen}
           onClose={() => setIsEditModalOpen(false)}
           record={selectedRecord}
           onSubmit={handleUpdateConsumption}
         />


        <AddConsumptionModal
         isOpen={isAddModalOpen}
         onClose={() => setIsAddModalOpen(false)}
         onSubmit={handleAddConsumption}
       />

       {/* 确认对话框 */}
       <ConfirmDialog />
      </div>
  );
}