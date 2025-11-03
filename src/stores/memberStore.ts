import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Member, MemberCard, FilterOptions, SortOptions } from './types';
import { toast } from 'sonner';

interface MemberState {
  members: Member[];
  loading: boolean;
  error: string | null;

  // 筛选和排序
  filters: FilterOptions;
  sortOptions: SortOptions;

  // 分页
  currentPage: number;
  pageSize: number;

  // Actions
  fetchMembers: () => Promise<void>;
  addMember: (member: Omit<Member, 'id'>) => Promise<void>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  getMemberById: (id: string) => Member | undefined;
  getMemberByPhone: (phone: string) => Member | undefined;

  // 会员卡相关
  assignCard: (memberId: string, card: MemberCard) => Promise<void>;
  useCard: (memberId: string, times?: number) => Promise<void>;

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
    active: number;
    inactive: number;
    withCards: number;
    totalBalance: number;
  };

  // 搜索
  searchMembers: (query: string) => Member[];

  // 批量操作
  bulkUpdateStatus: (ids: string[], status: Member['status']) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
}

// 生成唯一ID
const generateId = () => `M${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      members: [],
      loading: false,
      error: null,
      filters: {},
      sortOptions: { field: 'joinDate', direction: 'desc' },
      currentPage: 1,
      pageSize: 10,

      fetchMembers: async () => {
        set({ loading: true, error: null });
        try {
          await delay(500); // 模拟API调用
          // 在实际应用中，这里会调用API
          set({ loading: false });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '获取会员数据失败'
          });
          toast.error('获取会员数据失败');
        }
      },

      addMember: async (memberData) => {
        set({ loading: true, error: null });
        try {
          await delay(300);

          const newMember: Member = {
            ...memberData,
            id: generateId(),
            joinDate: memberData.joinDate || new Date().toISOString(),
            status: memberData.status || 'active',
            balance: memberData.balance || 0,
            level: memberData.level || 'bronze',
            points: memberData.points || 0,
            visitCount: 0,
            totalSpent: 0,
            tags: memberData.tags || []
          };

          set(state => ({
            members: [newMember, ...state.members],
            loading: false
          }));

          toast.success('会员添加成功');
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '添加会员失败'
          });
          toast.error('添加会员失败');
          throw error;
        }
      },

      updateMember: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          await delay(300);

          set(state => ({
            members: state.members.map(member =>
              member.id === id
                ? { ...member, ...updates }
                : member
            ),
            loading: false
          }));

          toast.success('会员信息更新成功');
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '更新会员失败'
          });
          toast.error('更新会员失败');
          throw error;
        }
      },

      deleteMember: async (id) => {
        set({ loading: true, error: null });
        try {
          await delay(300);

          set(state => ({
            members: state.members.filter(member => member.id !== id),
            loading: false
          }));

          toast.success('会员删除成功');
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '删除会员失败'
          });
          toast.error('删除会员失败');
          throw error;
        }
      },

      getMemberById: (id) => {
        return get().members.find(member => member.id === id);
      },

      getMemberByPhone: (phone) => {
        return get().members.find(member => member.phone === phone);
      },

      assignCard: async (memberId, card) => {
        set({ loading: true, error: null });
        try {
          await delay(300);

          set(state => ({
            members: state.members.map(member =>
              member.id === memberId
                ? { ...member, card }
                : member
            ),
            loading: false
          }));

          toast.success('次卡分配成功');
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '分配次卡失败'
          });
          toast.error('分配次卡失败');
          throw error;
        }
      },

      useCard: async (memberId, times = 1) => {
        const member = get().getMemberById(memberId);
        if (!member?.card) {
          toast.error('该会员没有可用的次卡');
          return;
        }

        if (member.card.remainingCount < times) {
          toast.error('次卡余额不足');
          return;
        }

        set({ loading: true, error: null });
        try {
          await delay(200);

          set(state => ({
            members: state.members.map(m =>
              m.id === memberId && m.card
                ? {
                    ...m,
                    card: {
                      ...m.card,
                      usedCount: m.card.usedCount + times,
                      remainingCount: m.card.remainingCount - times
                    }
                  }
                : m
            ),
            loading: false
          }));

          toast.success(`次卡使用成功，剩余 ${member.card.remainingCount - times} 次`);
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '使用次卡失败'
          });
          toast.error('使用次卡失败');
          throw error;
        }
      },

      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1 // 重置到第一页
        }));
      },

      setSortOptions: (sort) => {
        set({ sortOptions: sort, currentPage: 1 });
      },

      clearFilters: () => {
        set({
          filters: {},
          currentPage: 1,
          sortOptions: { field: 'joinDate', direction: 'desc' }
        });
      },

      setPage: (page) => {
        set({ currentPage: page });
      },

      setPageSize: (size) => {
        set({ pageSize: size, currentPage: 1 });
      },

      getStats: () => {
        const { members } = get();
        return {
          total: members.length,
          active: members.filter(m => m.status === 'active').length,
          inactive: members.filter(m => m.status === 'inactive').length,
          withCards: members.filter(m => m.card && m.card.remainingCount > 0).length,
          totalBalance: members.reduce((sum, m) => sum + m.balance, 0)
        };
      },

      searchMembers: (query) => {
        const { members } = get();
        if (!query.trim()) return members;

        const searchTerm = query.toLowerCase();
        return members.filter(member =>
          member.name.toLowerCase().includes(searchTerm) ||
          member.phone.includes(searchTerm) ||
          member.id.toLowerCase().includes(searchTerm) ||
          (member.tags && member.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
      },

      bulkUpdateStatus: async (ids, status) => {
        set({ loading: true, error: null });
        try {
          await delay(500);

          set(state => ({
            members: state.members.map(member =>
              ids.includes(member.id)
                ? { ...member, status }
                : member
            ),
            loading: false
          }));

          toast.success(`批量更新 ${ids.length} 个会员状态成功`);
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '批量更新失败'
          });
          toast.error('批量更新失败');
          throw error;
        }
      },

      bulkDelete: async (ids) => {
        set({ loading: true, error: null });
        try {
          await delay(500);

          set(state => ({
            members: state.members.filter(member => !ids.includes(member.id)),
            loading: false
          }));

          toast.success(`批量删除 ${ids.length} 个会员成功`);
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : '批量删除失败'
          });
          toast.error('批量删除失败');
          throw error;
        }
      }
    }),
    {
      name: 'member-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        members: state.members,
        filters: state.filters,
        sortOptions: state.sortOptions,
        pageSize: state.pageSize
      })
    }
  )
);