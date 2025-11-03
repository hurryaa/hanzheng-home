import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { storage, formatDate, searchMembers, getMembers, getMemberById, addRechargeRecord } from '@/lib/utils';
import { toast } from 'sonner';

// 会员数据模型
interface Member {
  id: string;
  name: string;
  phone: string;
  card?: Card;
  joinDate: string;
  balance?: number;
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

// 充值记录数据模型
interface RechargeRecord {
  id: string;
  memberId: string;
  memberName: string;
  phone: string;
  time: string;
  amount: number;
  balance: number;
  paymentMethod: string;
  operator: string;
  notes?: string;
}

// 支付方式选项
const paymentMethods = [
  { id: '微信支付', name: '微信支付' },
  { id: '支付宝', name: '支付宝' },
  { id: '现金', name: '现金' },
  { id: '银行卡', name: '银行卡' },
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
          <p className="text-sm font-medium text-green-600 mt-2">当前余额: ¥{member.balance || 0}</p>
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
        </div>
      )}
    </div>
  );
};

// 充值记录表格组件
const RechargeRecordsTable = ({ records }: { records: RechargeRecord[] }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <i className="fa-solid fa-file-invoice text-gray-400 text-2xl"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">暂无充值记录</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          没有找到充值记录，请先为会员添加充值记录。
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">会员信息</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">充值时间</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">充值金额</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方式</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">充值后余额</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作员</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50 transition duration-150">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img 
                      className="h-10 w-10 rounded-full object-cover" 
                      src={`https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=${record.memberName}%20avatar%20person`} 
                      alt={record.memberName}/>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{record.memberName}</div>
                    <div className="text-sm text-gray-500">{record.memberId} | {record.phone}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {record.time}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                +¥{record.amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {record.paymentMethod}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ¥{record.balance}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {record.operator}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                {record.notes || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 添加充值记录模态框
const AddRechargeModal = ({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    memberPhone: '',
    amount: '',
    paymentMethod: '',
    notes: '',
    currentBalance: 0
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
        memberPhone: '',
        currentBalance: 0
      }));
    }
  };
  
  // 选择会员
  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setShowSearchResults(false);
    setSearchKeyword(member.name);
    
    // 获取会员当前余额（实际应用中应从数据库获取）
    const currentBalance = member.balance || 0;
    
    setFormData(prev => ({
      ...prev,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      currentBalance
    }));
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };
  
  const validateForm = () => {
    if (!formData.memberId) {
      setError('请选择会员');
      return false;
    }
    
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError('请填写有效的充值金额');
      return false;
    }
    
    if (!formData.paymentMethod) {
      setError('请选择支付方式');
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
    
    const newBalance = formData.currentBalance + parseFloat(formData.amount);
    
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      balance: newBalance,
      time: formatDate(new Date()),
      operator: '管理员'
    });
    
    onClose();
    
    // 重置表单
    setFormData({
      memberId: '',
      memberName: '',
      memberPhone: '',
      amount: '',
      paymentMethod: '',
      notes: '',
      currentBalance: 0
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
          <h2 className="text-xl font-bold text-gray-900">添加充值记录</h2>
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
                        <p className="text-sm text-gray-600">{member.phone} | {member.id}</p>
                        <p className="text-xs text-gray-500">余额: ¥{member.balance || 0}</p>
                      </div>
                      {member.card && member.card.remainingCount > 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          次卡: {member.card.remainingCount}次
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
              <label className="block text-sm font-medium text-gray-700 mb-1">充值金额 (元) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">当前余额: ¥{formData.currentBalance}</p>
              <p className="text-xs text-gray-500">预计余额: ¥{formData.currentBalance + (formData.amount ? parseFloat(formData.amount) : 0)}</p>
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
                {paymentMethods.map(method => (
                  <option key={method.id} value={method.id}>{method.name}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">备注信息</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="输入充值备注信息（选填）"
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
              <i className="fa-solid fa-save mr-2"></i>保存充值记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Recharges() {
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<RechargeRecord[]>([]);
  
  // 加载充值记录
  useEffect(() => {
    const loadRechargeRecords = () => {
      // 从本地存储获取充值记录
      const records = storage.get<RechargeRecord[]>('recharges') || [];
      setRechargeRecords(records);
      setFilteredRecords(records);
      setLoading(false);
    };
    
    // 模拟加载延迟
    const timer = setTimeout(loadRechargeRecords, 800);
    return () => clearTimeout(timer);
  }, []);
  
  // 应用筛选
  useEffect(() => {
    let result = [...rechargeRecords];

    // 搜索筛选
    if (searchTerm) {
      const lowerCaseTerm = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.memberName.toLowerCase().includes(lowerCaseTerm) ||
        item.phone.includes(searchTerm) ||
        item.memberId.includes(searchTerm)
      );
    }

    // 支付方式筛选
    if (selectedPayment) {
      result = result.filter(item => item.paymentMethod === selectedPayment);
    }

    // 日期范围筛选
    if (startDate && endDate) {
      result = result.filter(item => {
        const itemDate = new Date(item.time);
        const start = new Date(startDate);
        const end = new Date(endDate + 'T23:59:59');
        return itemDate >= start && itemDate <= end;
      });
    }

    setFilteredRecords(result);
  }, [searchTerm, selectedPayment, dateRange, startDate, endDate, rechargeRecords]);
  
  // 添加新充值记录
  const handleAddRecharge = (newRecord) => {
    try {
      // 添加到本地存储
      const addedRecord = addRechargeRecord(newRecord);

      // 更新会员余额
      const members = getMembers();
      const memberIndex = members.findIndex(member => member.id === newRecord.memberId);

      if (memberIndex !== -1) {
        const updatedMembers = [...members];
        updatedMembers[memberIndex] = {
          ...members[memberIndex],
          balance: newRecord.balance
        };
        storage.set('members', updatedMembers);
      }

      // 更新本地状态
      setRechargeRecords(prev => [addedRecord, ...prev]);

      // 显示成功提示
      toast.success('充值记录添加成功！');
    } catch (error) {
      console.error('添加充值记录失败:', error);
      toast.error('添加充值记录失败，请重试');
    }
  };
  
  // 日期范围快捷选择
  const handleQuickDateRange = (range: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case 'today':
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        setDateRange('今日');
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        setDateRange('本周');
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        setDateRange('本月');
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
        setDateRange('本年');
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // 应用筛选
  const handleApplyFilters = () => {
    // 筛选逻辑已在useEffect中自动应用
    const filterCount = [searchTerm, selectedPayment, startDate && endDate].filter(Boolean).length;
    if (filterCount > 0) {
      toast.success(`已应用 ${filterCount} 个筛选条件，找到 ${filteredRecords.length} 条记录`);
    } else {
      toast.info('请设置筛选条件');
    }
  };

  // 重置筛选
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedPayment('');
    setDateRange('');
    setStartDate('');
    setEndDate('');
    toast.info('筛选条件已重置');
  };
  
  // 导出充值记录
   const handleExportRecharges = () => {
  try {
    // 准备Excel数据
    const headers = [
      '记录ID', '会员ID', '会员姓名', '手机号', '充值时间', 
      '金额', '余额', '支付方式', '操作员', '备注'
    ];
    
    // 转换数据格式
    const excelData = filteredRecords.map(record => [
      record.id,
      record.memberId,
      record.memberName,
      record.phone,
      record.time,
      record.amount,
      record.balance,
      record.paymentMethod,
      record.operator,
      record.notes || ''
    ]);
    
    // 创建工作簿和工作表
    const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '充值记录');
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `充值记录_${new Date().toLocaleDateString()}.xlsx`);
    link.style.visibility = 'hidden';
    
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    
      toast.success('充值记录导出成功！');
    } catch (error) {
      console.error('导出充值记录失败:', error);
      toast.error('导出充值记录失败，请重试');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">会员充值记录</h1>
          <p className="text-gray-500 mt-1">管理和记录所有会员充值信息</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportRecharges}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200 flex items-center"
          >
            <i className="fa-solid fa-download mr-2"></i>导出记录
          </button>
           <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>添加充值记录
          </button>

        </div>
      </div>
      
      {/* 筛选面板 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        {/* 当前筛选条件显示 */}
        {(searchTerm || selectedPayment || dateRange) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-filter text-blue-600"></i>
                <span className="text-sm font-medium text-blue-800">当前筛选条件:</span>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      搜索: {searchTerm}
                    </span>
                  )}
                  {selectedPayment && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      支付: {selectedPayment}
                    </span>
                  )}
                  {dateRange && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      时间: {dateRange}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-blue-600">
                找到 {filteredRecords.length} 条记录
              </span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">全部方式</option>
              {paymentMethods.map(method => (
                <option key={method.id} value={method.id}>{method.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日期范围</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <span className="text-gray-500">至</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => handleQuickDateRange('today')}
                  className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  今日
                </button>
                <button
                  onClick={() => handleQuickDateRange('week')}
                  className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  本周
                </button>
                <button
                  onClick={() => handleQuickDateRange('month')}
                  className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  本月
                </button>
                <button
                  onClick={() => handleQuickDateRange('year')}
                  className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  本年
                </button>
              </div>
              {dateRange && (
                <div className="text-xs text-blue-600">
                  当前选择: {dateRange}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
          >
            重置筛选
          </button>
          <button
            onClick={handleApplyFilters}
            className="ml-3 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
          >
            <i className="fa-solid fa-filter mr-2"></i>应用筛选
          </button>
        </div>
      </div>
      
      {/* 充值记录表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          // 加载骨架屏
          <div className="animate-pulse p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <RechargeRecordsTable records={filteredRecords} />
        )}
        
        {/* 分页控件（实际应用中需要实现） */}
        {!loading && filteredRecords.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              显示 {filteredRecords.length} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200" disabled>
                上一页
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-blue-600 text-white">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200" disabled>
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 添加充值记录模态框 */}
      <AddRechargeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddRecharge}
      />
     </div>
  );
}