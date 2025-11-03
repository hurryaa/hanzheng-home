import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DBService } from './db';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 初始化数据库连接
const db = DBService.getInstance();
db.connect();

// 数据持久化工具函数
// 数据访问工具函数 - 通过数据库服务访问
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const collection = db.getCollection(key);
      return collection as T;
    } catch (error) {
      console.error(`获取数据失败: ${key}`, error);
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      db.saveCollection(key, value as any[]);
    } catch (error) {
      console.error(`保存数据失败: ${key}`, error);
      toast.error('数据保存失败');
    }
  },
  
  remove: (key: string): void => {
    try {
      db.saveCollection(key, []);
    } catch (error) {
      console.error(`清除数据失败: ${key}`, error);
      toast.error('数据清除失败');
    }
  },
  
  clear: (): void => {
    try {
      // 获取所有集合并清空
      const collections = ['members', 'recharges', 'consumptions', 'cardTypes'];
      collections.forEach(collection => {
        db.saveCollection(collection, []);
      });
      toast.success('所有数据已清空');
    } catch (error) {
      console.error('清空所有数据失败', error);
      toast.error('清空数据失败');
    }
  }
}

// 格式化日期
export function formatDate(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-')
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// 充值记录数据模型
export interface RechargeRecord {
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

// 次卡类型模型
export interface CardType {
  id: string;
  name: string;
  description: string;
  price: number;
  count: number;
  validityDays: number;
  active: boolean;
}

// 初始化充值记录数据
export const initRechargeData = () => {
  // 生产环境不自动创建演示数据
  const existingRecharges = storage.get<RechargeRecord[]>('recharges');
  
  if (!existingRecharges) {
    // 初始化空数组而非演示数据
    storage.set('recharges', []);
  }
};

// 初始化次卡类型数据
export const initCardTypes = () => {
  // 生产环境不自动创建演示数据
  const existingCardTypes = storage.get<CardType[]>('cardTypes');
  
  if (!existingCardTypes) {
    // 初始化空数组而非演示数据
    storage.set('cardTypes', []);
  }
};

// 验证数据结构并初始化
export const validateAndInitData = () => {
  try {
    // 确保所有必要的数据存储键都已初始化
    initStorageData();
    initRechargeData();
    initCardTypes();
    
    // 验证会员数据结构
    const members = getMembers();
    if (!Array.isArray(members)) {
      storage.set('members', []);
    }
    
    // 验证消费记录数据结构
    const consumptions = getConsumptionRecords();
    if (!Array.isArray(consumptions)) {
      storage.set('consumptions', []);
    }
    
    return true;
  } catch (error) {
    console.error('数据验证和初始化失败:', error);
    toast.error('数据验证失败，已重置为默认状态');
    // 重置所有数据
    storage.clear();
    initStorageData();
    initRechargeData();
    initCardTypes();
    return false;
  }
};

// 获取所有充值记录
export const getRechargeRecords = (): RechargeRecord[] => {
  return storage.get<RechargeRecord[]>('recharges') || [];
};

// 添加充值记录
export const addRechargeRecord = (record: Omit<RechargeRecord, 'id'>): RechargeRecord => {
  const records = getRechargeRecords();
  const newRecord: RechargeRecord = {
    ...record,
    id: `R${Date.now().toString().slice(-6)}`
  };
  
  // 添加到记录列表并保存
  records.unshift(newRecord); // 添加到开头
  storage.set('recharges', records);
  
  return newRecord;
};

// 获取所有次卡类型
export const getCardTypes = (): CardType[] => {
  return storage.get<CardType[]>('cardTypes') || [];
};

// 添加次卡类型
export const addCardType = (cardType: Omit<CardType, 'id'>): CardType => {
  const cardTypes = getCardTypes();
  const newCardType: CardType = {
    ...cardType,
    id: `CT${Date.now().toString().slice(-4)}`
  };
  
  cardTypes.push(newCardType);
  storage.set('cardTypes', cardTypes);
  
  return newCardType;
};

// 更新次卡类型
export const updateCardType = (updatedCardType: CardType): boolean => {
  const cardTypes = getCardTypes();
  const index = cardTypes.findIndex(ct => ct.id === updatedCardType.id);
  
  if (index === -1) return false;
  
  cardTypes[index] = updatedCardType;
  storage.set('cardTypes', cardTypes);
  return true;
};

// 会员数据模型
export interface Member {
  id: string;
  name: string;
  phone: string;
  card?: Card;
  joinDate: string;
  balance?: number;
}

// 次卡数据模型
export interface Card {
  id: string;
  type: string;
  totalCount: number;
  usedCount: number;
  remainingCount: number;
  expiryDate: string;
}

// 消费记录数据模型
export interface ConsumptionRecord {
  id: string;
  memberId: string;
  memberName: string;
  phone: string;
  time: string;
  service: string;
  category: string;
  amount: number;
  paymentMethod: string;
  status: '已完成' | '已取消' | '进行中';
  operator: string;
  usedCard: boolean;
  notes?: string;
}

// 初始化存储数据
export const initStorageData = () => {
  // 生产环境不自动创建演示数据
  const existingMembers = storage.get<Member[]>('members');
  const existingConsumptions = storage.get<ConsumptionRecord[]>('consumptions');
  
  if (!existingMembers) {
    // 初始化空会员数组而非演示数据
    storage.set('members', []);
  }
  
  if (!existingConsumptions) {
    // 初始化空消费记录数组而非演示数据
    storage.set('consumptions', []);
  }
};
   
   // 更新消费记录
   export const updateConsumptionRecord = (id: string, updatedData: Partial<ConsumptionRecord>): boolean => {
     const records = getConsumptionRecords();
     const index = records.findIndex(record => record.id === id);
     
     if (index === -1) return false;
     
     records[index] = { ...records[index], ...updatedData };
     storage.set('consumptions', records);
     return true;
   };
   
   // 删除消费记录
   export const deleteConsumptionRecord = (id: string): boolean => {
     const records = getConsumptionRecords();
     const initialLength = records.length;
     const updatedRecords = records.filter(record => record.id !== id);
     
     if (initialLength === updatedRecords.length) return false;
     
     storage.set('consumptions', updatedRecords);
     return true;
   };
   
   // 搜索会员（通过手机号或姓名）
export const searchMembers = (keyword: string): Member[] => {
  const members = getMembers();
  if (!keyword) return [];
  
  const lowerKeyword = keyword.toLowerCase();
  return members.filter(member => 
    member.name.toLowerCase().includes(lowerKeyword) || 
    member.phone.includes(keyword)
  );
};

 // 获取所有会员
  export const getMembers = (): Member[] => {
    return storage.get<Member[]>('members') || [];
  };

  // 获取会员详情
  export const getMemberById = (id: string): Member | undefined => {
    const members = getMembers();
    return members.find(member => member.id === id);
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

  // 更新会员次卡使用次数
  export const updateMemberCardUsage = (memberId: string): boolean => {
    const members = getMembers();
    const memberIndex = members.findIndex(member => member.id === memberId);

    if (memberIndex === -1 || !members[memberIndex].card) {
      return false; // 会员不存在或没有次卡
    }

    // 更新次卡使用次数
    const updatedMember = { ...members[memberIndex] };
    if (updatedMember.card) {
      updatedMember.card.usedCount += 1;
      updatedMember.card.remainingCount -= 1;
    }

    members[memberIndex] = updatedMember;
    storage.set('members', members);
    return true;
  };

// 为会员办理次卡
export const createMemberCard = (memberId: string, cardTypeId: string): boolean => {
  const members = getMembers();
  const cardTypes = getCardTypes();
  
  const memberIndex = members.findIndex(member => member.id === memberId);
  const cardType = cardTypes.find(ct => ct.id === cardTypeId);
  
  if (memberIndex === -1 || !cardType) return false;
  
  // 计算过期日期
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + cardType.validityDays);
  
  // 为会员添加次卡
  const updatedMember = { ...members[memberIndex] };
  updatedMember.card = {
    id: `C${Date.now().toString().slice(-6)}`,
    type: cardType.name,
    totalCount: cardType.count,
    usedCount: 0,
    remainingCount: cardType.count,
    expiryDate: expiryDate.toISOString().split('T')[0]
  };
  
  members[memberIndex] = updatedMember;
  storage.set('members', members);
  return true;
};