import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { storage, formatDate, searchMembers, getMembers, getCardTypes, addCardType, updateCardType, createMemberCard } from '@/lib/utils';
import { toast } from 'sonner';

// 次卡类型数据模型
interface CardType {
  id: string;
  name: string;
  description: string;
  price: number;
  count: number;
  validityDays: number;
  active: boolean;
}

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

// 次卡类型表格组件
const CardTypesTable = ({ 
  cardTypes, 
  onEdit, 
  onStatusChange 
}: { 
  cardTypes: CardType[];
  onEdit: (cardType: CardType) => void;
  onStatusChange: (id: string, active: boolean) => void;
}) => {
  if (cardTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <i className="fa-solid fa-credit-card text-gray-400 text-2xl"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">暂无次卡类型</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-4">
          请先添加次卡类型，以便为会员办理次卡。
        </p>
        <button 
          onClick={() => onEdit({} as CardType)}
          className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200"
        >
          添加次卡类型
        </button>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">次卡名称</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">次数</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效期</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cardTypes.map((cardType) => (
            <tr key={cardType.id} className="hover:bg-gray-50 transition duration-150">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{cardType.name}</div>
                <div className="text-xs text-gray-500 truncate max-w-xs">{cardType.description}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {cardType.count} 次
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {cardType.validityDays} 天
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ¥{cardType.price}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onStatusChange(cardType.id, !cardType.active)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                    cardType.active 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {cardType.active ? '启用' : '禁用'}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button 
                  onClick={() => onEdit(cardType)}
                  className="text-blue-600 hover:text-blue-900 mr-3 transition duration-200"
                >
                  <i className="fa-solid fa-edit"></i> 编辑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 次卡类型编辑模态框
const CardTypeModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = {} as Partial<CardType>
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CardType) => void;
  initialData?: Partial<CardType>;
}) => {
  const [formData, setFormData] = useState<Partial<CardType>>({
    name: '',
    description: '',
    price: 0,
    count: 0,
    validityDays: 30,
    active: true,
    ...initialData
  });
  const [error, setError] = useState('');
  
  useEffect(() => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      count: 0,
      validityDays: 30,
      active: true,
      ...initialData
    });
  }, [initialData?.id, initialData?.name, initialData?.description, initialData?.price, initialData?.count, initialData?.validityDays, initialData?.active]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };
  
  const validateForm = () => {
    if (!formData.name) {
      setError('请输入次卡名称');
      return false;
    }
    
    if (!formData.price || formData.price <= 0) {
      setError('请输入有效的价格');
      return false;
    }
    
    if (!formData.count || formData.count <= 0) {
      setError('请输入有效的次数');
      return false;
    }
    
    if (!formData.validityDays || formData.validityDays <= 0) {
      setError('请输入有效的有效期');
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
    
    onSubmit(formData as CardType);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData.id ? '编辑次卡类型' : '添加次卡类型'}
          </h2>
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">次卡名称 <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">次卡描述</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={2}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">价格 (元) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="price"
                value={formData.price || ''}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务次数 <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="count"
                value={formData.count || ''}
                onChange={handleChange}
                required
                min="1"
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">有效期 (天) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="validityDays"
                value={formData.validityDays || ''}
                onChange={handleChange}
                required
                min="1"
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active !== false}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                启用此卡类型
              </label>
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
              <i className="fa-solid fa-save mr-2"></i>
              {initialData.id ? '更新次卡类型' : '添加次卡类型'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 办理次卡模态框
const IssueCardModal = ({
  isOpen,
  onClose,
  onSubmit,
  cardTypes
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memberId: string, cardTypeId: string) => void;
  cardTypes: CardType[];
}) => {
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    memberPhone: '',
    cardTypeId: '',
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
      memberPhone: member.phone
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
    
    if (!formData.cardTypeId) {
      setError('请选择次卡类型');
      return false;
    }
    
    // 检查会员是否已有次卡
    if (selectedMember?.card) {
      setError('该会员已有次卡，无法重复办理');
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
    
    onSubmit(formData.memberId, formData.cardTypeId);
    onClose();
    
    // 重置表单
    setFormData({
      memberId: '',
      memberName: '',
      memberPhone: '',
      cardTypeId: '',
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
          <h2 className="text-xl font-bold text-gray-900">为会员办理次卡</h2>
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
                      </div>
                      {member.card ? (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          已有次卡
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          可办理
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
          
          {selectedMember && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedMember.name}</h3>
                  <p className="text-sm text-gray-600">会员ID: {selectedMember.id}</p>
                  <p className="text-sm text-gray-600">手机号: {selectedMember.phone}</p>
                  <p className="text-sm text-gray-600">加入日期: {selectedMember.joinDate}</p>
                </div>
                <div className="bg-white rounded-full p-2 shadow-sm">
                  <i className="fa-solid fa-user text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">选择次卡类型 <span className="text-red-500">*</span></label>
            <select
              name="cardTypeId"
              value={formData.cardTypeId}
              onChange={handleChange}
              required
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">请选择次卡类型</option>
              {cardTypes.filter(ct => ct.active).map(cardType => (
                <option key={cardType.id} value={cardType.id}>
                  {cardType.name} ({cardType.count}次 / {cardType.validityDays}天 / ¥{cardType.price})
                </option>
              ))}
            </select>
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
              <i className="fa-solid fa-hand-holding-heart mr-2"></i>办理次卡
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function MemberCards() {
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCardTypeModalOpen, setIsCardTypeModalOpen] = useState(false);
  const [isIssueCardModalOpen, setIsIssueCardModalOpen] = useState(false);
  const [editingCardType, setEditingCardType] = useState<CardType | null>(null);
  
  // 加载次卡类型
  useEffect(() => {
    const loadCardTypes = () => {
      const types = getCardTypes();
      setCardTypes(types);
      setLoading(false);
    };
    
    // 模拟加载延迟
    const timer = setTimeout(loadCardTypes, 800);
    return () => clearTimeout(timer);
  }, []);
  
  // 编辑次卡类型
  const handleEditCardType = (cardType: CardType) => {
    setEditingCardType(cardType);
    setIsCardTypeModalOpen(true);
  };
  
  // 添加次卡类型
  const handleAddCardType = () => {
    setEditingCardType(null);
    setIsCardTypeModalOpen(true);
  };
  
  // 保存次卡类型
  const saveCardType = (cardTypeData: CardType) => {
    try {
      if (editingCardType) {
        // 更新现有次卡类型
        const updated = updateCardType(cardTypeData);
        if (updated) {
          setCardTypes(prev => 
            prev.map(type => type.id === cardTypeData.id ? cardTypeData : type)
          );
          toast.success('次卡类型更新成功！');
        } else {
          toast.error('次卡类型更新失败');
        }
      } else {
        // 添加新次卡类型
        const newCardType = addCardType(cardTypeData);
        setCardTypes(prev => [...prev, newCardType]);
        toast.success('次卡类型添加成功！');
      }
    } catch (error) {
      console.error('保存次卡类型失败:', error);
      toast.error('保存次卡类型失败，请重试');
    }
  };
  
  // 更改次卡类型状态
  const handleStatusChange = (id: string, active: boolean) => {
    try {
      const updatedTypes = cardTypes.map(type => 
        type.id === id ? { ...type, active } : type
      );
      
      // 更新本地存储
      storage.set('cardTypes', updatedTypes);
      
      // 更新状态
      setCardTypes(updatedTypes);
      
      toast.success(`次卡类型已${active ? '启用' : '禁用'}`);
    } catch (error) {
      console.error('更新次卡类型状态失败:', error);
      toast.error('操作失败，请重试');
    }
  };
  
  // 办理次卡
  const handleIssueCard = () => {
    setIsIssueCardModalOpen(true);
  };
  
  // 提交次卡办理
  const submitIssueCard = (memberId: string, cardTypeId: string) => {
    try {
      const success = createMemberCard(memberId, cardTypeId);
      
      if (success) {
        toast.success('次卡办理成功！');
      } else {
        toast.error('次卡办理失败');
      }
    } catch (error) {
      console.error('办理次卡失败:', error);
      toast.error('办理次卡失败，请重试');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">次卡管理</h1>
          <p className="text-gray-500 mt-1">管理次卡类型和会员次卡信息</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleAddCardType}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200 flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>添加次卡类型
          </button>
          <button 
            onClick={handleIssueCard}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
          >
            <i className="fa-solid fa-ticket-alt mr-2"></i>办理次卡
          </button>
        </div>
      </div>
      
      {/* 次卡类型管理 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">次卡类型管理</h2>
          <p className="text-gray-500 text-sm mt-1">管理可用的次卡类型和价格</p>
        </div>
        
        {loading ? (
          // 加载骨架屏
          <div className="animate-pulse p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <CardTypesTable 
            cardTypes={cardTypes} 
            onEdit={handleEditCardType}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
      
      {/* 次卡类型编辑模态框 */}
      <CardTypeModal
        isOpen={isCardTypeModalOpen}
        onClose={() => setIsCardTypeModalOpen(false)}
        onSubmit={saveCardType}
        initialData={editingCardType || undefined}
      />
      
      {/* 办理次卡模态框 */}
      <IssueCardModal
        isOpen={isIssueCardModalOpen}
        onClose={() => setIsIssueCardModalOpen(false)}
        onSubmit={submitIssueCard}
        cardTypes={cardTypes}
      />
    </div>
  );
}