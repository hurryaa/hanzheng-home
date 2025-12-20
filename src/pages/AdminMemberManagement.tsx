import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import { getMemberById } from '@/lib/utils';
import { exportMembers } from '@/lib/exportUtils';

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  joinDate?: string;
  totalSpend?: number;
}

export default function AdminMemberManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMembers();
      setMembers(response.data || []);
      filterMembers(response.data || [], searchInput, statusFilter);
    } catch (error) {
      toast.error('加载会员列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = (memberList: Member[], search: string, status: string) => {
    let filtered = memberList;

    if (search.trim()) {
      filtered = filtered.filter(
        (m) =>
          m.name.includes(search) ||
          m.phone.includes(search) ||
          m.id.includes(search)
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter((m) => m.status === status);
    }

    setFilteredMembers(filtered);
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    filterMembers(members, value, statusFilter);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    filterMembers(members, searchInput, value);
  };

  const handleOpenModal = (member?: Member) => {
    if (member) {
      setEditingId(member.id);
      setFormData({
        name: member.name,
        phone: member.phone,
        email: member.email || '',
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', phone: '', email: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', email: '' });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('请填写必填字段');
      return;
    }

    try {
      if (editingId) {
        // 编辑现有成员
        await apiClient.updateMember(editingId, {
          ...formData,
          status: 'active',
        });
        toast.success('会员信息已更新');
      } else {
        // 创建新成员
        await apiClient.createMember({
          ...formData,
          status: 'active',
        });
        toast.success('会员已创建');
      }
      loadMembers();
      handleCloseModal();
    } catch (error) {
      toast.error('操作失败，请重试');
      console.error(error);
    }
  };

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === 'active').length,
    inactive: members.filter((m) => m.status === 'inactive').length,
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-600 mb-4 block"></i>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">会员管理</h1>
        <p className="text-gray-600 mt-1">查看和管理所有会员信息</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm mb-2">总会员数</p>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-2">人</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm mb-2">活跃会员</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          <p className="text-xs text-gray-500 mt-2">人</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm mb-2">非活跃会员</p>
          <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
          <p className="text-xs text-gray-500 mt-2">人</p>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              搜索会员
            </label>
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="按名称、电话或ID搜索..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态过滤
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            >
              <option value="all">所有状态</option>
              <option value="active">活跃</option>
              <option value="inactive">非活跃</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => handleOpenModal()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              新增会员
            </button>
            <button
              onClick={() => exportMembers(members)}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
            >
              <i className="fa-solid fa-download mr-2"></i>
              导出CSV
            </button>
          </div>
        </div>
      </div>

      {/* 会员列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    会员ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    姓名
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    电话
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    邮箱
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    加入时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {member.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {member.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {member.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {member.joinDate
                        ? new Date(member.joinDate).toLocaleDateString('zh-CN')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {member.status === 'active' ? '活跃' : '非活跃'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleOpenModal(member)}
                        className="text-blue-600 hover:text-blue-900 font-medium transition"
                      >
                        编辑
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        className="text-blue-600 hover:text-blue-900 font-medium transition"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <i className="fa-solid fa-inbox text-4xl text-gray-300 mb-4 block"></i>
            <p className="text-gray-600">
              {members.length === 0 ? '暂无会员' : '没有找到匹配的会员'}
            </p>
          </div>
        )}
      </div>

      {/* 编辑/创建模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? '编辑会员' : '新增会员'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="输入会员姓名"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  电话 *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="输入联系电话"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="输入邮箱地址"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
