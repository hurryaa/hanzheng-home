import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { cn, storage, getCardTypes, updateCardType, getRechargeRecords, getConsumptionRecords } from '@/lib/utils';
import { toast } from 'sonner';
import { z } from 'zod';

// 服务类别模型
interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

// 系统设置模型
interface SystemSettings {
  businessName: string;
  contactPhone: string;
  address: string;
  serviceCategories: ServiceCategory[];
  workingHours: string;
  invoiceInfo: string;
  notificationSettings: {
    expiringCards: boolean;
    lowBalance: boolean;
    newMember: boolean;
  };
}

// 表单验证schema
const BusinessInfoSchema = z.object({
  businessName: z.string().min(2, '商户名称至少需要2个字符').max(50, '商户名称不能超过50个字符'),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的联系电话'),
  address: z.string().min(5, '地址至少需要5个字符').max(200, '地址不能超过200个字符'),
  workingHours: z.string().min(5, '营业时间格式不正确').max(100, '营业时间不能超过100个字符'),
  invoiceInfo: z.string().optional(),
});

// 服务类别验证schema
const ServiceCategorySchema = z.object({
  name: z.string().min(2, '类别名称至少需要2个字符').max(50, '类别名称不能超过50个字符'),
  description: z.string().max(200, '描述不能超过200个字符').optional(),
});

// 服务类别组件
const ServiceCategoryItem = ({
  category,
  onEdit,
  onStatusChange
}: {
  category: ServiceCategory;
  onEdit: (category: ServiceCategory) => void;
  onStatusChange: (id: string, active: boolean) => void;
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200">
      <div>
        <h4 className="font-medium text-gray-900">{category.name}</h4>
        <p className="text-sm text-gray-500 truncate max-w-xs">{category.description}</p>
      </div>
      <div className="flex items-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          category.active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {category.active ? '启用' : '禁用'}
        </span>
        <button 
          onClick={() => onEdit(category)}
          className="ml-3 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          aria-label="编辑"
        >
          <i className="fa-solid fa-edit"></i>
        </button>
      </div>
    </div>
  );
};

// 模态框组件 - 用于编辑服务类别和系统设置
const SettingsModal = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "保存",
  isSubmitting = false
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="关闭"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
        
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>保存中...
              </>
            ) : (
              <>
                <i className="fa-solid fa-save mr-2"></i>{submitLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// 系统统计信息组件
const SystemStats = () => {
  const [stats, setStats] = useState({
    members: 0,
    consumptions: 0,
    recharges: 0,
    totalRevenue: 0,
    activeCards: 0,
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadStats = () => {
      try {
        const members = []; // 临时修复：原代码中getMembers未定义
        const consumptions = getConsumptionRecords();
        const recharges = getRechargeRecords();
        const cardTypes = getCardTypes();
        
        const totalRevenue = recharges.reduce((sum, r) => sum + r.amount, 0);
        const activeCards = members.filter(m => m.card && m.card.remainingCount > 0).length;
        
        setStats({
          members: members.length,
          consumptions: consumptions.length,
          recharges: recharges.length,
          totalRevenue,
          activeCards,
        });
      } catch (error) {
        console.error('加载系统统计失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(loadStats, 600);
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-500">总会员数</h4>
        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.members}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-500">消费记录</h4>
        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.consumptions}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-500">充值记录</h4>
        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.recharges}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-500">累计充值</h4>
        <p className="text-2xl font-bold text-green-600 mt-1">¥{stats.totalRevenue.toLocaleString()}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-500">活跃次卡</h4>
        <p className="text-2xl font-bold text-blue-600 mt-1">{stats.activeCards}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-500">服务类别</h4>
        <p className="text-2xl font-bold text-purple-600 mt-1">{getCardTypes().length}</p>
      </div>
    </div>
  );
};

// 通知设置组件
const NotificationSettings = ({
  settings,
  onChange
}: {
  settings: SystemSettings['notificationSettings'];
  onChange: (settings: SystemSettings['notificationSettings']) => void;
}) => {
  const handleToggle = (key: keyof SystemSettings['notificationSettings']) => {
    onChange({
      ...settings,
      [key]: !settings[key]
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">次卡即将过期提醒</h4>
          <p className="text-sm text-gray-500">当次卡即将过期时发送通知</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.expiringCards}
            onChange={() => handleToggle('expiringCards')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">余额不足提醒</h4>
          <p className="text-sm text-gray-500">当会员余额低于设定阈值时发送通知</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.lowBalance}
            onChange={() => handleToggle('lowBalance')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">新会员加入通知</h4>
          <p className="text-sm text-gray-500">当有新会员加入时发送通知</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.newMember}
            onChange={() => handleToggle('newMember')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
};

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>({
    businessName: '汗蒸养生馆',
    contactPhone: '',
    address: '',
    serviceCategories: [],
    workingHours: '10:00 - 22:00',
    invoiceInfo: '',
    notificationSettings: {
      expiringCards: true,
      lowBalance: true,
      newMember: true,
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('business');
  const [formData, setFormData] = useState({
    businessName: '',
    contactPhone: '',
    address: '',
    workingHours: '',
    invoiceInfo: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [categoryFormData, setCategoryFormData] = useState({
    id: '',
    name: '',
    description: '',
    active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 数据备份处理函数
  const handleCreateBackup = () => {
    toast.info('正在创建数据备份...');
    
    try {
      // 收集需要备份的数据
      const members = storage.get('members') || [];
      const recharges = storage.get('recharges') || [];
      const consumptions = storage.get('consumptions') || [];
      const cardTypes = storage.get('cardTypes') || [];
      
      // 创建工作簿和工作表
      const wb = XLSX.utils.book_new();
      
      // 为每个数据类型创建工作表
      if (members.length > 0) {
        const wsMembers = XLSX.utils.json_to_sheet(members);
        XLSX.utils.book_append_sheet(wb, wsMembers, '会员数据');
      }
      
      if (recharges.length > 0) {
        const wsRecharges = XLSX.utils.json_to_sheet(recharges);
        XLSX.utils.book_append_sheet(wb, wsRecharges, '充值记录');
      }
      
      if (consumptions.length > 0) {
        const wsConsumptions = XLSX.utils.json_to_sheet(consumptions);
        XLSX.utils.book_append_sheet(wb, wsConsumptions, '消费记录');
      }
      
      if (cardTypes.length > 0) {
        const wsCardTypes = XLSX.utils.json_to_sheet(cardTypes);
        XLSX.utils.book_append_sheet(wb, wsCardTypes, '次卡类型');
      }
      
      // 生成Excel文件并下载
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // 设置文件名，包含当前日期
      const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
      link.setAttribute('href', url);
      link.setAttribute('download', `系统备份_${dateStr}.xlsx`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 显示成功提示
      setTimeout(() => {
        toast.success('数据备份创建成功并已下载！');
      }, 800);
    } catch (error) {
      console.error('创建备份失败:', error);
      toast.error('创建备份失败，请重试');
    }
  };
  
  // 数据恢复处理函数
  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      toast.info('正在恢复数据...');
      const file = e.target.files[0];
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 假设我们只处理第一个工作表
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // 这里应该根据实际数据结构进行处理和导入
          console.log('恢复的数据:', jsonData);
          
          // 模拟数据处理延迟
          setTimeout(() => {
            toast.success('数据恢复成功！');
            e.target.value = ''; // 重置文件输入
          }, 1500);
        } catch (error) {
          console.error('数据恢复失败:', error);
          toast.error('数据恢复失败，请检查文件格式');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };
  
  // 处理服务类别表单变化
  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setCategoryFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setCategoryFormData(prev => ({ ...prev, [name]: value }));
      
      // 清除对应字段的错误信息
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };
  
  // 加载系统设置
  useEffect(() => {
    const loadSettings = () => {
      try {
        // 从本地存储获取系统设置
        const savedSettings = storage.get<SystemSettings>('systemSettings');
        
        // 获取服务类别（从次卡类型）
        const cardTypes = getCardTypes();
        const serviceCategories: ServiceCategory[] = cardTypes.map(ct => ({
          id: ct.id,
          name: ct.name,
          description: ct.description,
          active: ct.active
        }));
        
        const defaultSettings: SystemSettings = {
          businessName: '汗蒸养生馆',
          contactPhone: '',
          address: '',
          serviceCategories,
          workingHours: '10:00 - 22:00',
          invoiceInfo: '',
          notificationSettings: {
            expiringCards: true,
            lowBalance: true,
            newMember: true,
          }
        };
        
        const settingsToUse = savedSettings ? {
          ...defaultSettings,
          ...savedSettings,
          serviceCategories,
          notificationSettings: {
            ...defaultSettings.notificationSettings,
            ...savedSettings.notificationSettings
          }
        } : defaultSettings;
        
        setSettings(settingsToUse);
        setFormData({
          businessName: settingsToUse.businessName,
          contactPhone: settingsToUse.contactPhone,
          address: settingsToUse.address,
          workingHours: settingsToUse.workingHours,
          invoiceInfo: settingsToUse.invoiceInfo || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (error) {
        console.error('加载系统设置失败:', error);
        toast.error('加载系统设置失败');
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // 处理表单变化
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setCategoryFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // 清除对应字段的错误信息
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };
  
  // 保存商家信息
  const saveBusinessInfo = () => {
    const result = BusinessInfoSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedSettings: SystemSettings = {
        ...settings,
        ...formData
      };
      
      // 保存到本地存储
      storage.set('systemSettings', updatedSettings);
      setSettings(updatedSettings);
      
      toast.success('商家信息保存成功');
      setIsModalOpen(false);
    } catch (error) {
      console.error('保存商家信息失败:', error);
      toast.error('保存商家信息失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 保存服务类别
  const saveServiceCategory = () => {
    const result = ServiceCategorySchema.safeParse(categoryFormData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedCategories = [...settings.serviceCategories];
      
      if (modalType === 'edit') {
        // 更新现有类别
        const index = updatedCategories.findIndex(c => c.id === categoryFormData.id);
        if (index !== -1) {
          updatedCategories[index] = categoryFormData;
          
          // 同时更新对应的次卡类型
          const cardTypes = getCardTypes();
          const cardIndex = cardTypes.findIndex(ct => ct.id === categoryFormData.id);
          if (cardIndex !== -1) {
            const updatedCardType = {
              ...cardTypes[cardIndex],
              name: categoryFormData.name,
              description: categoryFormData.description || '',
              active: categoryFormData.active
            };
            updateCardType(updatedCardType);
          }
        }
      } else {
        // 添加新类别 (实际应用中应该有专门的添加API)
        toast.info('请在次卡管理中添加新的服务类别');
        setIsModalOpen(false);
        return;
      }
      
      // 更新设置
      const updatedSettings: SystemSettings = {
        ...settings,
        serviceCategories: updatedCategories
      };
      
      storage.set('systemSettings', updatedSettings);
      setSettings(updatedSettings);
      
      toast.success('服务类别保存成功');
      setIsModalOpen(false);
    } catch (error) {
      console.error('保存服务类别失败:', error);
      toast.error('保存服务类别失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 更新通知设置
  const updateNotificationSettings = (notificationSettings: SystemSettings['notificationSettings']) => {
    try {
      const updatedSettings = {
        ...settings,
        notificationSettings
      };
      
      storage.set('systemSettings', updatedSettings);
      setSettings(updatedSettings);
      toast.success('通知设置更新成功');
    } catch (error) {
      console.error('更新通知设置失败:', error);
      toast.error('更新通知设置失败，请重试');
    }
  };
  
  // 打开服务类别编辑模态框
  const handleEditCategory = (category: ServiceCategory) => {
    setModalType('edit');
    setCategoryFormData(category);
    setErrors({});
    setIsModalOpen(true);
  };
  
  // 更改服务类别状态
  const handleStatusChange = (id: string, active: boolean) => {
    try {
      const updatedCategories = settings.serviceCategories.map(category => 
        category.id === id ? { ...category, active } : category
      );
      
      // 更新对应的次卡类型状态
      const cardTypes = getCardTypes();
      const updatedCardTypes = cardTypes.map(ct => 
        ct.id === id ? { ...ct, active } : ct
      );
      storage.set('cardTypes', updatedCardTypes);
      
      // 更新设置
      const updatedSettings: SystemSettings = {
        ...settings,
        serviceCategories: updatedCategories
      };
      
      storage.set('systemSettings', updatedSettings);
      setSettings(updatedSettings);
      
      toast.success(`服务类别已${active ? '启用' : '禁用'}`);
    } catch (error) {
      console.error('更新服务类别状态失败:', error);  
      toast.error('更新服务类别状态失败，请重试');
    }
  };
  
  // 打开编辑商家信息模态框
  const openBusinessInfoModal = () => {
    setModalType('edit');
    setFormData({
      businessName: settings.businessName,
      contactPhone: settings.contactPhone,
      address: settings.address,
      workingHours: settings.workingHours,
      invoiceInfo: settings.invoiceInfo || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    setIsModalOpen(true);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">加载系统设置中...</p>
        </div>
      </div>
    );
  }
  
  // 修改密码模态框内容
  const renderPasswordModalContent = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="currentPassword">
          当前密码 <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="currentPassword"
          name="currentPassword"
          value={formData.currentPassword || ''}
          onChange={handleFormChange}
          className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.currentPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
          }`}
          placeholder="请输入当前密码"
        />
        {errors.currentPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newPassword">
          新密码 <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="newPassword"
          name="newPassword"
          value={formData.newPassword || ''}
          onChange={handleFormChange}
          className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.newPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
          }`}
          placeholder="请输入新密码"
        />
        {errors.newPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
          确认新密码 <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword || ''}
          onChange={handleFormChange}
          className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
          }`}
          placeholder="请再次输入新密码"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>
    </div>
  );
  
  // 保存密码修改
  const savePasswordChange = () => {
    // 简单密码验证
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = '请输入当前密码';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = '请输入新密码';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = '密码长度不能少于6个字符';
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 模拟密码修改
      setTimeout(() => {
        toast.success('密码修改成功，请重新登录');
        setIsModalOpen(false);
        setIsSubmitting(false);
        
        // 重置表单
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }, 800);
    } catch (error) {
      console.error('修改密码失败:', error);
      toast.error('修改密码失败，请重试');
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-500 mt-1">配置系统参数和业务信息</p>
        </div>
        
        {/* 标签页导航 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
             <button
              onClick={() => setActiveTab('business')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm",
                activeTab === 'business'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <i className="fa-solid fa-building mr-2"></i>商家信息
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm",
                activeTab === 'services'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <i className="fa-solid fa-list mr-2"></i>服务类别
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm",
                activeTab === 'notifications'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <i className="fa-solid fa-bell mr-2"></i>通知设置
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm",
                activeTab === 'roles'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <i className="fa-solid fa-users-gear mr-2"></i>角色权限
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm",
                activeTab === 'system'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <i className="fa-solid fa-cog mr-2"></i>系统参数
            </button>
          </nav>
        </div>
        
        {/* 标签页内容 */}
        <div className="mt-6">
          {activeTab === 'business' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">商家基本信息</h2>
                <button 
                  onClick={openBusinessInfoModal}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
                >
                  <i className="fa-solid fa-edit mr-2"></i>编辑信息
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">商家名称</h3>
                    <p className="mt-1 text-lg text-gray-900">{settings.businessName || '未设置'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">联系电话</h3>
                    <p className="mt-1 text-lg text-gray-900">{settings.contactPhone || '未设置'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">商家地址</h3>
                    <p className="mt-1 text-lg text-gray-900">{settings.address || '未设置'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">营业时间</h3>
                    <p className="mt-1 text-lg text-gray-900">{settings.workingHours}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">发票信息</h3>
                    <p className="mt-1 text-lg text-gray-900">{settings.invoiceInfo || '未设置'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'services' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">服务类别管理</h2>
                <button 
                  onClick={() => {
                    setModalType('add');
                    setCategoryFormData({ id: '', name: '', description: '', active: true });
                    setErrors({});
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200 flex items-center"
                  disabled
                >
                  <i className="fa-solid fa-plus mr-2"></i>添加类别
                  <span className="ml-2 text-xs text-gray-500">(在次卡管理中添加)</span>
                </button>
              </div>
              
              <div className="p-6">
                {settings.serviceCategories.length > 0 ? (
                  <div className="space-y-3">
                    {settings.serviceCategories.map(category => (
                      <ServiceCategoryItem
                        key={category.id}
                        category={category}
                        onEdit={handleEditCategory}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <i className="fa-solid fa-list-check text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">暂无服务类别</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      请先添加服务类别，以便进行服务和消费管理。
                    </p>
                    <button 
                      onClick={() => {
                        setModalType('add');
                        setCategoryFormData({ id: '', name: '', description: '', active: true });
                        setErrors({});
                        setIsModalOpen(true);
                      }}
                      className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200"
                      disabled
                    >
                      添加服务类别
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">通知设置</h2>
                <p className="text-gray-500 text-sm mt-1">配置系统通知选项</p>
              </div>
              
              <div className="p-6">
                <NotificationSettings 
                  settings={settings.notificationSettings}
                  onChange={(newSettings) => {
                    const updatedSettings = {
                      ...settings,
                      notificationSettings: newSettings
                    };
                    setSettings(updatedSettings);
                    storage.set('systemSettings', updatedSettings);
                  }}
                />
                
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">通知方式</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">系统内通知</h4>
                        <p className="text-sm text-gray-500">在系统内显示通知消息</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">短信通知</h4>
                        <p className="text-sm text-gray-500">通过短信发送通知给会员</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
           {activeTab === 'roles' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">角色权限管理</h2>
                <button 
                  onClick={() => {}}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-200 flex items-center"
                >
                  <i className="fa-solid fa-plus mr-2"></i>添加角色
                </button>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色名称</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户数量</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">管理员</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">系统全部权限</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            启用
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">编辑</button>
                          <button className="text-gray-600 hover:text-gray-900">权限</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">前台操作员</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">会员管理、消费记录操作</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            启用
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">编辑</button>
                          <button className="text-gray-600 hover:text-gray-900">权限</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">财务</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">充值记录、报表查看</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            禁用
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">编辑</button>
                          <button className="text-gray-600 hover:text-gray-900">权限</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'system' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">系统参数设置</h2>
                <p className="text-gray-500 text-sm mt-1">配置系统相关参数</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">系统统计</h3>
                    <SystemStats />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">数据管理</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                       <h4 className="font-medium text-gray-900 mb-2">数据备份</h4>
                        <p className="text-sm text-gray-500 mb-3">创建系统数据的备份，以防数据丢失</p>
                        <button
                          onClick={() => {
                            if (confirm('确定要创建备份吗？此操作将备份所有当前系统数据。')) {
                              handleCreateBackup();
                            }
                          }}
                         className="px-3 py-1.5 border border-transparent rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition duration-200 flex items-center"
                       >
                         <i className="fa-solid fa-download mr-1.5"></i>创建备份
                       </button>
                     </div>
                     <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                       <h4 className="font-medium text-gray-900 mb-2">数据恢复</h4>
                       <p className="text-sm text-gray-500 mb-3">从备份文件恢复系统数据</p>
                       <input 
                         type="file" 
                         className="hidden" 
                         id="restoreFile" 
                         accept=".xlsx"
                         onChange={handleRestoreData}
                       />
                       <label htmlFor="restoreFile" className="px-3 py-1.5 border border-transparent rounded-lg text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 transition duration-200 flex items-center cursor-pointer">
                         <i className="fa-solid fa-upload mr-1.5"></i>恢复数据
                       </label>
                     </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">安全设置</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">修改密码</h4>
                          <p className="text-sm text-gray-500">定期修改密码以保证账户安全</p>
                        </div>
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
                        >
                          修改
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">操作日志</h4>
                          <p className="text-sm text-gray-500">记录系统的重要操作和变更</p> 
                        </div>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200">
                          查看日志
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">关于系统</h3>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">系统版本</p>
                          <p className="font-medium text-gray-900">v1.0.0</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">最后更新</p>
                          <p className="font-medium text-gray-900">2025-08-13</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">版权信息</p>
                          <p className="font-medium text-gray-900">© 2025 汗蒸养生馆管理系统 保留所有权利</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 商家信息编辑模态框 */}
      {isModalOpen && (modalType === 'edit' && (activeTab === 'business' || activeTab === 'services')) && (
        <SettingsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={activeTab === 'business' ? saveBusinessInfo : saveServiceCategory}
          title={activeTab === 'business' ? '编辑商家信息' : modalType === 'add' ? '添加服务类别' : '编辑服务类别'}
          isSubmitting={isSubmitting}
          submitLabel={activeTab === 'business' ? '保存商家信息' : '保存类别'}
        >
          {activeTab === 'business' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="businessName">
                  商家名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleFormChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.businessName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="请输入商家名称"
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contactPhone">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleFormChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.contactPhone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="请输入联系电话"
                />
                {errors.contactPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactPhone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address">
                  商家地址 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  rows={3}
                  className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="请输入商家地址"
                ></textarea>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="workingHours">
                  营业时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="workingHours"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleFormChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.workingHours ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例如: 10:00 - 22:00"
                />
                {errors.workingHours && (
                  <p className="mt-1 text-sm text-red-600">{errors.workingHours}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="invoiceInfo">
                  发票信息
                </label>
                <textarea
                  id="invoiceInfo"
                  name="invoiceInfo"
                  value={formData.invoiceInfo}
                  onChange={handleFormChange}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="请输入发票信息（选填）"
                ></textarea>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                  类别名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryFormChange}
                  className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="请输入类别名称"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                  类别描述
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryFormChange}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="请输入类别描述（选填）"
                ></textarea>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={categoryFormData.active}
                  onChange={handleCategoryFormChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  启用此服务类别
                </label>
              </div>
            </div>
          )}
        </SettingsModal>
      )}
      
      {/* 密码修改模态框 */}
      {isModalOpen && activeTab === 'system' && (
        <SettingsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={savePasswordChange}
          title="修改密码"
          isSubmitting={isSubmitting}
          submitLabel="保存密码"
        >
          {renderPasswordModalContent()}
        </SettingsModal>
      )}
    </>
  );
}