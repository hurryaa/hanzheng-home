// 数据类型定义
export interface Member {
  id: string;
  name: string;
  phone: string;
  card?: MemberCard;
  joinDate: string;
  balance: number;
  status: 'active' | 'inactive' | 'suspended';
  level?: 'bronze' | 'silver' | 'gold' | 'platinum';
  points?: number;
  birthday?: string;
  gender?: 'male' | 'female';
  address?: string;
  notes?: string;
  tags?: string[];
  lastVisit?: string;
  totalSpent?: number;
  visitCount?: number;
}

export interface MemberCard {
  id: string;
  type: string;
  totalCount: number;
  usedCount: number;
  remainingCount: number;
  expiryDate: string;
  purchaseDate: string;
  price: number;
  status: 'active' | 'expired' | 'suspended';
}

export interface CardType {
  id: string;
  name: string;
  description: string;
  price: number;
  count: number;
  validityDays: number;
  active: boolean;
  category?: string;
  benefits?: string[];
  restrictions?: string[];
}

export interface RechargeRecord {
  id: string;
  memberId: string;
  memberName: string;
  phone: string;
  time: string;
  amount: number;
  balance: number;
  paymentMethod: 'cash' | 'card' | 'wechat' | 'alipay' | 'other';
  operator: string;
  notes?: string;
  status: 'completed' | 'pending' | 'failed';
  transactionId?: string;
}

export interface ConsumptionRecord {
  id: string;
  memberId: string;
  memberName: string;
  phone: string;
  time: string;
  service: string;
  category: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'wechat' | 'alipay' | 'balance' | 'membercard';
  status: 'completed' | 'cancelled' | 'refunded';
  operator: string;
  usedCard: boolean;
  duration?: number;
  room?: string;
  notes?: string;
  discount?: number;
  originalAmount?: number;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description?: string;
  active: boolean;
  requirements?: string[];
  benefits?: string[];
}

export interface Appointment {
  id: string;
  memberId: string;
  memberName: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  appointmentTime: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  room?: string;
  operator?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'admin' | 'manager' | 'staff' | 'receptionist';
  permissions: string[];
  status: 'active' | 'inactive';
  hireDate: string;
  salary?: number;
  schedule?: WeeklySchedule;
}

export interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  available: boolean;
}

export interface SystemSettings {
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  businessHours: {
    open: string;
    close: string;
    days: string[];
  };
  currency: string;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  features: {
    appointments: boolean;
    inventory: boolean;
    loyalty: boolean;
    reports: boolean;
  };
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页类型
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 筛选和排序类型
export interface FilterOptions {
  search?: string;
  status?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// 统计数据类型
export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalRevenue: number;
  monthlyRevenue: number;
  todayRevenue: number;
  totalAppointments: number;
  todayAppointments: number;
  popularServices: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    appointments: number;
  }>;
}