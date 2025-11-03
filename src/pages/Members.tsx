import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { cn, storage, getMembers, searchMembers, getRechargeRecords, getConsumptionRecords } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import MemberQuickActions from '@/components/MemberQuickActions';
import QuickRechargeModal from '@/components/QuickRechargeModal';
import QuickConsumeModal from '@/components/QuickConsumeModal';

// 会员数据模型
interface Member {
  id: string;
  name: string;
  phone: string;
  card?: Card;
  joinDate: string;
  balance?: number;
  status: 'active' | 'inactive';
  notes?: string;
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

// 消费记录模型
interface ConsumptionRecord {
  id: string;
  time: string;
  service: string;
  amount: number;
  status: string;
}

// 会员数据验证schema
const MemberSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符').max(20, '姓名不能超过20个字符'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  notes: z.string().optional(),
});

// 会员状态标签组件
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    active: { label: '正常', class: 'bg-green-100 text-green-800' },
    inactive: { label: '禁用', class: 'bg-gray-100 text-gray-800' },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
  
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.class)}>
      {config.label}
    </span>
  );
};

// 会员卡片组件
const MemberCard = ({ member, onEdit, onStatusChange, onViewDetails }: { 
  member: Member; 
  onEdit: (member: Member) => void;
  onStatusChange: (id: string, status: 'active' | 'inactive') => void;
  onViewDetails: (member: Member) => void;
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
              {member.name.charAt(0)}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-500">会员ID: {member.id}</p>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600 mr-3">{member.phone}</span>
                <StatusBadge status={member.status} />
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => onViewDetails(member)}
              className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
              aria-label="查看详情"
            >
              <i className="fa-solid fa-eye"></i>
            </button>
            <button 
              onClick={() => onEdit(member)}
              className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
              aria-label="编辑会员"
            >
              <i className="fa-solid fa-edit"></i>
            </button>
            <button 
              onClick={() => onStatusChange(member.id, member.status === 'active' ? 'inactive' : 'active')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                member.status === 'active' 
                  ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' 
                  : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
              }`}
              aria-label={member.status === 'active' ? "禁用会员" : "启用会员"}
            >
              <i className={member.status === 'active' ? 'fa-solid fa-ban' : 'fa-solid fa-check'}></i>
            </button>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">加入日期</p>
            <p className="font-medium text-gray-900">{member.joinDate}</p>
          </div>
          <div>
            <p className="text-gray-500">当前余额</p>
            <p className="font-medium text-green-600">¥{member.balance || 0}</p>
          </div>
          <div>
            <p className="text-gray-500">次卡状态</p>
            <p className="font-medium text-gray-900">
              {member.card ? `${member.card.remainingCount}/${member.card.totalCount}次` : '无次卡'}
            </p>
          </div>
        </div>
        
        {member.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">备注信息</p>
            <p className="text-sm text-gray-700">{member.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 会员详情模态框
const MemberDetailsModal = ({
  isOpen,
  onClose,
  member,
  onIssueCard,
  onRecharge,
  onUpdate
}: {
  isOpen: boolean;
  onClose: () => void;
  member?: Member;
  onUpdate?: () => void;
}) => {
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>([]);
  const [rechargeRecords, setRechargeRecords] = useState<any[]>([]);
  const [isQuickRechargeOpen, setIsQuickRechargeOpen] = useState(false);
  const [isQuickConsumeOpen, setIsQuickConsumeOpen] = useState(false);

  const loadMemberData = useCallback(() => {
    if (member) {
      // 获取会员消费记录
      const allConsumptions = getConsumptionRecords();
      const memberConsumptions = allConsumptions
        .filter(c => c.memberId === member.id)
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          time: c.time,
          service: c.service,
          amount: c.amount,
          status: c.status
        }));

      // 获取会员充值记录
      const allRecharges = getRechargeRecords();
      const memberRecharges = allRecharges
        .filter(r => r.memberId === member.id)
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5);

      setConsumptionRecords(memberConsumptions);
      setRechargeRecords(memberRecharges);
    }
  }, [member]);

  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

  const handleQuickActionSuccess = () => {
    loadMemberData();
    onUpdate?.();
  };
  
  if (!isOpen || !member) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">会员详情</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="关闭"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                {member.name.charAt(0)}
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500">会员ID: {member.id}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600 mr-3">{member.phone}</span>
                  <StatusBadge status={member.status} />
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <button
                onClick={() => setIsQuickConsumeOpen(true)}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
              >
                <i className="fa-solid fa-shopping-cart mr-2"></i>快速消费
              </button>
              <button
                onClick={() => setIsQuickRechargeOpen(true)}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition duration-200 flex items-center"
              >
                <i className="fa-solid fa-plus mr-2"></i>快速充值
              </button>
              <button
                onClick={() => onIssueCard(member.id)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200 flex items-center"
              >
                <i className="fa-solid fa-ticket-alt mr-2"></i>办理次卡
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500">当前余额</h4>
              <p className="text-2xl font-bold text-green-600 mt-1">¥{member.balance || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500">加入日期</h4>
              <p className="text-xl font-semibold text-gray-900 mt-1">{member.joinDate}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500">消费次数</h4>
              <p className="text-xl font-semibold text-gray-900 mt-1">{consumptionRecords.length} 次</p>
            </div>
          </div>
          
          {member.card && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">次卡信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">卡类型</p>
                  <p className="font-medium text-gray-900">{member.card.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">总次数</p>
                  <p className="font-medium text-gray-900">{member.card.totalCount} 次</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">已使用</p>
                  <p className="font-medium text-yellow-600">{member.card.usedCount} 次</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">剩余次数</p>
                  <p className="font-medium text-green-600">{member.card.remainingCount} 次</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">有效期至</p>
                  <p className="font-medium text-gray-900">{member.card.expiryDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  <p className="font-medium text-green-600">正常使用</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">最近消费记录</h3>
            {consumptionRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服务项目</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consumptionRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{record.time}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">{record.service}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">¥{record.amount}</td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">暂无消费记录</p>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">最近充值记录</h3>
            {rechargeRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方式</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">充值后余额</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rechargeRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{record.time}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-600">+¥{record.amount}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">{record.paymentMethod}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">¥{record.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">暂无充值记录</p>
              </div>
            )}
          </div>
        </div>

        {/* 快速充值模态框 */}
        <QuickRechargeModal
          isOpen={isQuickRechargeOpen}
          onClose={() => setIsQuickRechargeOpen(false)}
          onSuccess={handleQuickActionSuccess}
          preSelectedMember={member}
        />

        {/* 快速消费模态框 */}
        <QuickConsumeModal
          isOpen={isQuickConsumeOpen}
          onClose={() => setIsQuickConsumeOpen(false)}
          onSuccess={handleQuickActionSuccess}
          preSelectedMember={member}
        />
      </div>
    </div>
  );
};

// 添加/编辑会员模态框
const MemberModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Member, 'id' | 'joinDate' | 'status'>) => void;
  initialData?: Member;
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    notes: initialData?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validateForm = () => {
    const result = MemberSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除对应字段的错误信息
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      onSubmit(formData);
      onClose();
      toast.success(initialData ? '会员信息更新成功' : '新会员添加成功');
    } catch (error) {
      toast.error('操作失败，请重试');
      console.error('会员操作失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? '编辑会员信息' : '添加新会员'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="关闭"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              会员姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入会员姓名"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
              手机号码 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入手机号码"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
              备注信息
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="请输入备注信息（选填）"
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
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>处理中...
                </>
              ) : (
                <>
                  <i className={`fa-solid ${initialData ? 'fa-save' : 'fa-plus'} mr-2`}></i>
                  {initialData ? '保存修改' : '添加会员'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
   const [searching, setSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isQuickRechargeOpen, setIsQuickRechargeOpen] = useState(false);
  const [isQuickConsumeOpen, setIsQuickConsumeOpen] = useState(false);
  const navigate = useNavigate();

  // 刷新会员数据
  const refreshMembers = useCallback(() => {
    try {
      const memberData = getMembers();
      const membersWithStatus = memberData.map(member => ({
        ...member,
        status: member.status || 'active'
      }));
      setMembers(membersWithStatus);
      setFilteredMembers(membersWithStatus);
    } catch (error) {
      console.error('刷新会员数据失败:', error);
      toast.error('刷新会员数据失败');
    }
  }, []);
  
  // 办理次卡
  const handleIssueCard = (memberId: string) => {
    navigate(`/member-cards?memberId=${memberId}`);
  };
  
  // 充值
  const handleRecharge = (memberId: string) => {
    navigate(`/recharges?memberId=${memberId}`);
  };
  
  // 加载会员数据
  useEffect(() => {
    const loadMembers = () => {
      try {
        const memberData = getMembers();
        // 确保status字段存在，默认为active
        const membersWithStatus = memberData.map(member => ({
          ...member,
          status: member.status || 'active'
        }));
        setMembers(membersWithStatus);
        setFilteredMembers(membersWithStatus);
      } catch (error) {
        console.error('加载会员数据失败:', error);
        toast.error('加载会员数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    // 模拟加载延迟
    const timer = setTimeout(loadMembers, 600);
    return () => clearTimeout(timer);
  }, []);
  
    // 防抖处理搜索
    const debounce = (func: (...args: any[]) => any, delay: number) => {
      let timeoutId: number;
     return (...args: any[]) => {
       clearTimeout(timeoutId);
       timeoutId = setTimeout(() => func.apply(this, args), delay);
     };
   };
   
   // 搜索会员
   const handleSearch = useCallback(
     debounce((term: string) => {
       if (!term) {
         setFilteredMembers(members);
         setSearching(false);
         return;
       }
       
       setSearching(true);
       const results = searchMembers(term);
       setFilteredMembers(results);
       setSearching(false);
     }, 300),
     [members]
   );
   
   useEffect(() => {
     handleSearch(searchTerm);
   }, [searchTerm, handleSearch]);
  
  // 添加或编辑会员
  const handleSaveMember = (memberData: Omit<Member, 'id' | 'joinDate' | 'status'>) => {
    const membersData = [...members];
    
    if (currentMember) {
      // 更新现有会员
      const index = membersData.findIndex(m => m.id === currentMember.id);
      if (index !== -1) {
        membersData[index] = {
          ...membersData[index],
          ...memberData
        };
      }
    } else {
      // 添加新会员
      const newMember: Member = {
        id: `M${Date.now().toString().slice(-4)}`,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        ...memberData,balance: 0
      };
      membersData.unshift(newMember);
    }
    
    // 保存到本地存储
    storage.set('members', membersData);
    setMembers(membersData);
    setFilteredMembers(membersData);
  };
  
  // 更改会员状态
  const handleStatusChange = (id: string, status: 'active' | 'inactive') => {
    const updatedMembers = members.map(member => 
      member.id === id ? { ...member, status } : member
    );
    
    storage.set('members', updatedMembers);
    setMembers(updatedMembers);
    setFilteredMembers(updatedMembers);
    
    toast.success(`会员已${status === 'active' ? '启用' : '禁用'}`);
  };
  
  // 打开添加会员模态框
  const handleAddMember = () => {
    setCurrentMember(null);
    setIsModalOpen(true);
  };
  
  // 打开编辑会员模态框
  const handleEditMember = (member: Member) => {
    setCurrentMember(member);
    setIsModalOpen(true);
  };
  
  // 打开会员详情模态框
  const handleViewDetails = (member: Member) => {
    setCurrentMember(member);
    setIsDetailsOpen(true);
  };
  
  // 加载状态骨架屏
  const MemberCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex items-start">
          <div className="w-12 h-12 rounded-full bg-gray-200"></div>
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="flex space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
            <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
            <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">会员管理</h1>
          <p className="text-gray-500 mt-1">管理所有会员信息和状态</p>
        </div>
        <div className="flex items-center space-x-3">
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               {searching ? (
                 <i className="fa-solid fa-spinner fa-spin text-gray-400"></i>
               ) : (
                 <i className="fa-solid fa-search text-gray-400"></i>
               )}
             </div>
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="搜索会员姓名或手机号"
               className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
               aria-label="搜索会员"
             />
             {searchTerm && (
               <button
                 onClick={() => setSearchTerm('')}
                 className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                 aria-label="清除搜索"
               >
                 <i className="fa-solid fa-times"></i>
               </button>
             )}
           </div>

           {/* 快速操作按钮 */}
           <button
             onClick={() => setIsQuickConsumeOpen(true)}
             className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
           >
             <i className="fa-solid fa-shopping-cart mr-2"></i>快速消费
           </button>
           <button
             onClick={() => setIsQuickRechargeOpen(true)}
             className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition duration-200 flex items-center"
           >
             <i className="fa-solid fa-plus mr-2"></i>快速充值
           </button>

            <button
             onClick={() => setIsFilterModalOpen(true)}
             className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200 flex items-center"
             aria-label="打开高级筛选"
           >
            <i className="fa-solid fa-filter mr-2"></i>高级筛选
          </button>
           <button
            onClick={handleAddMember}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200 flex items-center"
          >
            <i className="fa-solid fa-user-plus mr-2"></i>添加会员
          </button>
           <button
             onClick={() => handleExportMembers(filteredMembers)}
             className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200 flex items-center"
          >
            <i className="fa-solid fa-download mr-2"></i>导出会员
          </button>
        </div>
      </div>
      
       {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1, 2, 3, 4, 5, 6].map(i => (
             <MemberCardSkeleton key={i} />
           ))}
         </div>
       ) : (
         <>
           {/* 搜索结果统计 */}
           {searchTerm && (
             <div className="mb-4 flex items-center justify-between text-sm">
               <p className="text-gray-600">
                 {searching ? '搜索中...' : `找到 ${filteredMembers.length} 个匹配会员`}
               </p>
               <button 
                 onClick={() => setSearchTerm('')}
                 className="text-blue-600 hover:text-blue-800 flex items-center"
               >
                 <i className="fa-solid fa-times-circle mr-1"></i> 清除搜索
               </button>
             </div>
           )}
           
           {filteredMembers.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredMembers.map(member => (
                 <MemberCard 
                   key={member.id} 
                   member={member} 
                   onEdit={handleEditMember}
                   onStatusChange={handleStatusChange}
                   onViewDetails={handleViewDetails}
                 />
               ))}
             </div>
           ) : (
             <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                 <i className="fa-solid fa-user-search text-gray-400 text-2xl"></i>
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-1">未找到会员</h3>
               <p className="text-gray-500 max-w-md mx-auto mb-6">
                 {searchTerm 
                   ? '没有找到匹配的会员，请尝试其他搜索条件或检查输入是否正确。' 
                   : '暂无会员数据，请添加新会员。'}
               </p>
               {!searchTerm ? (
                 <button 
                   onClick={handleAddMember}
                   className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 transform hover:-translate-y-0.5"
                 >
                   添加第一个会员
                 </button>
               ) : (
                 <div className="flex justify-center space-x-3">
                   <button 
                     onClick={() => setSearchTerm('')}
                     className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
                   >
                     清除搜索条件
                   </button>
                   <button 
                     onClick={handleAddMember}
                     className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200"
                   >
                     添加新会员
                   </button>
                 </div>
               )}
             </div>
           )}
         </>
       )}
      
      <MemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveMember}
        initialData={currentMember}
      />
      
       <MemberDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        member={currentMember}
        onIssueCard={handleIssueCard}
        onRecharge={handleRecharge}
        onUpdate={refreshMembers}
      />

      {/* 全局快速操作模态框 */}
      <QuickRechargeModal
        isOpen={isQuickRechargeOpen}
        onClose={() => setIsQuickRechargeOpen(false)}
        onSuccess={refreshMembers}
      />

      <QuickConsumeModal
        isOpen={isQuickConsumeOpen}
        onClose={() => setIsQuickConsumeOpen(false)}
        onSuccess={refreshMembers}
      />
     </div>
  );
}

// 导出会员数据
const handleExportMembers = (membersToExport: Member[]) => {
  try {
    // 准备Excel数据
    const headers = [
      '会员ID', '姓名', '手机号', '加入日期', '余额', 
      '状态', '次卡类型', '剩余次数', '过期日期'
    ];
    
    // 转换数据格式
    const excelData = membersToExport.map(member => [
      member.id,
      member.name,
      member.phone,
      member.joinDate,
      member.balance || 0,
      member.status === 'active' ? '正常' : '禁用',
      member.card?.type || '',
      member.card?.remainingCount || '',
      member.card?.expiryDate || ''
    ]);
    
    // 创建工作簿和工作表
    const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '会员数据');
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `会员数据_${new Date().toLocaleDateString()}.xlsx`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('会员数据导出成功！');
  } catch (error) {
    console.error('导出会员数据失败:', error);
    toast.error('导出会员数据失败，请重试');
  }
}