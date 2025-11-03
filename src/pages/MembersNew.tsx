import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Modal,
  ConfirmModal,
  SearchInput,
  Badge,
  StatusBadge
} from '@/components/ui';
import { useMemberStore } from '@/stores/memberStore';
import { Member } from '@/stores/types';

export default function MembersNew() {
  const navigate = useNavigate();
  const {
    members,
    loading,
    error,
    filters,
    currentPage,
    pageSize,
    fetchMembers,
    addMember,
    updateMember,
    deleteMember,
    setFilters,
    setPage,
    getStats,
    searchMembers,
    bulkDelete
  } = useMemberStore();

  // 本地状态
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: 'male' as 'male' | 'female',
    birthday: '',
    address: '',
    notes: ''
  });

  // 统计数据
  const stats = getStats();

  // 筛选后的会员数据
  const filteredMembers = React.useMemo(() => {
    let result = searchQuery ? searchMembers(searchQuery) : members;

    if (statusFilter !== 'all') {
      result = result.filter(member => member.status === statusFilter);
    }

    return result;
  }, [members, searchQuery, statusFilter, searchMembers]);

  // 分页数据
  const paginatedMembers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMembers.slice(startIndex, startIndex + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize);

  // 初始化数据
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  // 处理状态筛选
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('请填写必填字段');
      return;
    }

    try {
      if (editingMember) {
        await updateMember(editingMember.id, formData);
        setShowEditModal(false);
      } else {
        await addMember({
          ...formData,
          balance: 0,
          status: 'active',
          joinDate: new Date().toISOString()
        });
        setShowAddModal(false);
      }

      // 重置表单
      setFormData({
        name: '',
        phone: '',
        gender: 'male',
        birthday: '',
        address: '',
        notes: ''
      });
      setEditingMember(null);
    } catch (error) {
      // 错误已在store中处理
    }
  };

  // 处理编辑
  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      phone: member.phone,
      gender: member.gender || 'male',
      birthday: member.birthday || '',
      address: member.address || '',
      notes: member.notes || ''
    });
    setShowEditModal(true);
  };

  // 处理删除
  const handleDelete = async () => {
    if (selectedMembers.length === 0) return;

    try {
      if (selectedMembers.length === 1) {
        await deleteMember(selectedMembers[0]);
      } else {
        await bulkDelete(selectedMembers);
      }
      setSelectedMembers([]);
      setShowDeleteModal(false);
    } catch (error) {
      // 错误已在store中处理
    }
  };

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(paginatedMembers.map(member => member.id));
    } else {
      setSelectedMembers([]);
    }
  };

  // 处理单选
  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">会员管理</h1>
        <p className="text-gray-500 mt-1">管理您的会员信息和会员卡</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fa-solid fa-users text-blue-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总会员数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fa-solid fa-user-check text-green-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">活跃会员</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <i className="fa-solid fa-credit-card text-purple-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">持卡会员</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withCards}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="fa-solid fa-wallet text-yellow-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总余额</p>
                <p className="text-2xl font-bold text-gray-900">¥{stats.totalBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <SearchInput
                placeholder="搜索会员姓名、手机号..."
                onSearch={handleSearch}
                className="w-full sm:w-80"
              />

              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('all')}
                >
                  全部
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('active')}
                >
                  活跃
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('inactive')}
                >
                  非活跃
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedMembers.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  icon="fa-trash"
                >
                  删除选中 ({selectedMembers.length})
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                icon="fa-plus"
              >
                添加会员
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 会员列表 */}
      <Card>
        <CardHeader>
          <CardTitle>会员列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-500">加载中...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              <i className="fa-solid fa-exclamation-triangle text-2xl mb-2"></i>
              <p>{error}</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <i className="fa-solid fa-users text-4xl mb-4 text-gray-300"></i>
              <p>暂无会员数据</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedMembers.length === paginatedMembers.length && paginatedMembers.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        会员信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        余额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        次卡
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        加入时间
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={(e) => handleSelectMember(member.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.phone}</div>
                            {member.level && (
                              <Badge variant="secondary" size="sm" className="mt-1">
                                {member.level}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={member.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          ¥{member.balance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {member.card ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{member.card.type}</div>
                              <div className="text-gray-500">剩余 {member.card.remainingCount} 次</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">无</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(member.joinDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(member)}
                              icon="fa-edit"
                            >
                              编辑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMembers([member.id]);
                                setShowDeleteModal(true);
                              }}
                              icon="fa-trash"
                            >
                              删除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      显示 {(currentPage - 1) * pageSize + 1} 到{' '}
                      {Math.min(currentPage * pageSize, filteredMembers.length)} 条，
                      共 {filteredMembers.length} 条记录
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                        icon="fa-chevron-left"
                      >
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setPage(currentPage + 1)}
                        icon="fa-chevron-right"
                        iconPosition="right"
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 添加会员模态框 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加会员"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入会员姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入手机号"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">生日</label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">地址</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入备注信息"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              添加会员
            </Button>
          </div>
        </form>
      </Modal>

      {/* 编辑会员模态框 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑会员"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入会员姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入手机号"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">生日</label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">地址</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入备注信息"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              保存修改
            </Button>
          </div>
        </form>
      </Modal>

      {/* 删除确认模态框 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="确认删除"
        message={`确定要删除选中的 ${selectedMembers.length} 个会员吗？此操作不可撤销。`}
        variant="danger"
        loading={loading}
      />
    </div>
  );
}