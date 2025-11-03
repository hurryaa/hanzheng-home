import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appointment, Service, FilterOptions, SortOptions } from './types';
import { toast } from 'sonner';

interface AppointmentState {
  appointments: Appointment[];
  services: Service[];
  loading: boolean;
  error: string | null;

  // 筛选和排序
  filters: FilterOptions;
  sortOptions: SortOptions;

  // 分页
  currentPage: number;
  pageSize: number;

  // Actions
  fetchAppointments: () => Promise<void>;
  fetchServices: () => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (id: string, reason?: string) => Promise<void>;
  confirmAppointment: (id: string) => Promise<void>;
  completeAppointment: (id: string) => Promise<void>;
  markNoShow: (id: string) => Promise<void>;

  // 服务管理
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // 查询
  getAppointmentById: (id: string) => Appointment | undefined;
  getAppointmentsByDate: (date: string) => Appointment[];
  getAppointmentsByMember: (memberId: string) => Appointment[];
  getAvailableTimeSlots: (date: string, serviceId: string) => string[];

  // 筛选和排序
  setFilters: (filters: Partial<FilterOptions>) => void;
  setSortOptions: (sort: SortOptions) => void;
  clearFilters: () => void;

  // 分页
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // 统计
  getStats: () => {
    total: number;
    today: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
}

// 生成唯一ID
const generateId = () => `A${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
const generateServiceId = () => `S${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 默认服务项目
const defaultServices: Service[] = [
  {
    id: 'S001',
    name: '汗蒸房体验',
    category: '汗蒸服务',
    price: 68,
    duration: 60,
    description: '标准汗蒸房体验，包含毛巾和饮用水',
    active: true,
    requirements: ['需提前预约', '建议空腹2小时后使用'],
    benefits: ['促进血液循环', '排毒养颜', '缓解疲劳']
  },
  {
    id: 'S002',
    name: 'VIP汗蒸套餐',
    category: '汗蒸服务',
    price: 128,
    duration: 90,
    description: 'VIP汗蒸房体验，包含按摩和茶水服务',
    active: true,
    requirements: ['需提前预约', '建议空腹2小时后使用'],
    benefits: ['深度排毒', '专业按摩', '私人空间']
  },
  {
    id: 'S003',
    name: '足疗按摩',
    category: '按摩服务',
    price: 88,
    duration: 45,
    description: '专业足疗按摩服务',
    active: true,
    requirements: ['需提前预约'],
    benefits: ['缓解疲劳', '改善睡眠', '促进血液循环']
  },
  {
    id: 'S004',
    name: '全身按摩',
    category: '按摩服务',
    price: 168,
    duration: 60,
    description: '全身放松按摩服务',
    active: true,
    requirements: ['需提前预约'],
    benefits: ['全身放松', '缓解肌肉紧张', '改善体质']
  }
];

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set, get) => ({
      appointments: [],
      services: defaultServices,
      loading: false,
      error: null,
      filters: {},
      sortOptions: { field: 'appointmentTime', direction: 'asc' },
      currentPage: 1,
      pageSize: 10,

      fetchAppointments: async () => {
        set({ loading: true, error: null });
        try {
          await delay(500);
          set({ loading: false });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '获取预约数据失败'
          });
          toast.error('获取预约数据失败');
        }
      },

      fetchServices: async () => {
        set({ loading: true, error: null });
        try {
          await delay(300);
          set({ loading: false });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '获取服务数据失败'
          });
          toast.error('获取服务数据失败');
        }
      },

      addAppointment: async (appointmentData) => {
        set({ loading: true, error: null });
        try {
          await delay(300);

          const now = new Date().toISOString();
          const newAppointment: Appointment = {
            ...appointmentData,
            id: generateId(),
            status: 'scheduled',
            createdAt: now,
            updatedAt: now
          };

          set(state => ({
            appointments: [newAppointment, ...state.appointments],
            loading: false
          }));

          toast.success('预约创建成功');
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '创建预约失败'
          });
          toast.error('创建预约失败');
          throw error;
        }
      },

      updateAppointment: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          await delay(300);

          set(state => ({
            appointments: state.appointments.map(appointment =>
              appointment.id === id
                ? { ...appointment, ...updates, updatedAt: new Date().toISOString() }
                : appointment
            ),
            loading: false
          }));

          toast.success('预约更新成功');
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '更新预约失败'
          });
          toast.error('更新预约失败');
          throw error;
        }
      },

      cancelAppointment: async (id, reason) => {
        set({ loading: true, error: null });
        try {
          await delay(300);

          set(state => ({
            appointments: state.appointments.map(appointment =>
              appointment.id === id
                ? {
                    ...appointment,
                    status: 'cancelled',
                    notes: reason ? `取消原因: ${reason}` : appointment.notes,
                    updatedAt: new Date().toISOString()
                  }
                : appointment
            ),
            loading: false
          }));

          toast.success('预约已取消');
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '取消预约失败'
          });
          toast.error('取消预约失败');
          throw error;
        }
      },

      confirmAppointment: async (id) => {
        await get().updateAppointment(id, { status: 'confirmed' });
        toast.success('预约已确认');
      },

      completeAppointment: async (id) => {
        await get().updateAppointment(id, { status: 'completed' });
        toast.success('预约已完成');
      },

      markNoShow: async (id) => {
        await get().updateAppointment(id, { status: 'no-show' });
        toast.success('已标记为未到店');
      },

      addService: async (serviceData) => {
        set({ loading: true, error: null });
        try {
          await delay(300);

          const newService: Service = {
            ...serviceData,
            id: generateServiceId()
          };

          set(state => ({
            services: [newService, ...state.services],
            loading: false
          }));

          toast.success('服务项目添加成功');
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '添加服务项目失败'
          });
          toast.error('添加服务项目失败');
          throw error;
        }
      },

      updateService: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          await delay(300);

          set(state => ({
            services: state.services.map(service =>
              service.id === id
                ? { ...service, ...updates }
                : service
            ),
            loading: false
          }));

          toast.success('服务项目更新成功');
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '更新服务项目失败'
          });
          toast.error('更新服务项目失败');
          throw error;
        }
      },

      deleteService: async (id) => {
        set({ loading: true, error: null });
        try {
          await delay(300);

          set(state => ({
            services: state.services.filter(service => service.id !== id),
            loading: false
          }));

          toast.success('服务项目删除成功');
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '删除服务项目失败'
          });
          toast.error('删除服务项目失败');
          throw error;
        }
      },

      getAppointmentById: (id) => {
        return get().appointments.find(appointment => appointment.id === id);
      },

      getAppointmentsByDate: (date) => {
        const { appointments } = get();
        return appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentTime).toDateString();
          const targetDate = new Date(date).toDateString();
          return appointmentDate === targetDate;
        });
      },

      getAppointmentsByMember: (memberId) => {
        return get().appointments.filter(appointment => appointment.memberId === memberId);
      },

      getAvailableTimeSlots: (date, serviceId) => {
        const { appointments, services } = get();
        const service = services.find(s => s.id === serviceId);
        if (!service) return [];

        // 营业时间：9:00 - 22:00
        const businessHours = {
          start: 9,
          end: 22
        };

        // 生成所有可能的时间段（每30分钟一个）
        const allSlots: string[] = [];
        for (let hour = businessHours.start; hour < businessHours.end; hour++) {
          allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
          allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }

        // 获取当天已预约的时间段
        const dayAppointments = get().getAppointmentsByDate(date);
        const bookedSlots = dayAppointments
          .filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed')
          .map(apt => {
            const time = new Date(apt.appointmentTime);
            return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
          });

        // 过滤掉已预约的时间段
        return allSlots.filter(slot => !bookedSlots.includes(slot));
      },

      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1
        }));
      },

      setSortOptions: (sort) => {
        set({ sortOptions: sort, currentPage: 1 });
      },

      clearFilters: () => {
        set({
          filters: {},
          currentPage: 1,
          sortOptions: { field: 'appointmentTime', direction: 'asc' }
        });
      },

      setPage: (page) => {
        set({ currentPage: page });
      },

      setPageSize: (size) => {
        set({ pageSize: size, currentPage: 1 });
      },

      getStats: () => {
        const { appointments } = get();
        const today = new Date().toDateString();

        return {
          total: appointments.length,
          today: appointments.filter(apt => {
            const aptDate = new Date(apt.appointmentTime).toDateString();
            return aptDate === today;
          }).length,
          scheduled: appointments.filter(apt => apt.status === 'scheduled').length,
          completed: appointments.filter(apt => apt.status === 'completed').length,
          cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
          noShow: appointments.filter(apt => apt.status === 'no-show').length
        };
      }
    }),
    {
      name: 'appointment-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        appointments: state.appointments,
        services: state.services,
        filters: state.filters,
        sortOptions: state.sortOptions,
        pageSize: state.pageSize
      })
    }
  )
);