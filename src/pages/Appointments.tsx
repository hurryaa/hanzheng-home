import React, { useState, useEffect } from 'react';
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
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useMemberStore } from '@/stores/memberStore';
import { Appointment } from '@/stores/types';

export default function Appointments() {
  const {
    appointments,
    services,
    loading,
    error,
    currentPage,
    pageSize,
    fetchAppointments,
    fetchServices,
    addAppointment,
    updateAppointment,
    cancelAppointment,
    confirmAppointment,
    completeAppointment,
    markNoShow,
    setPage,
    getStats,
    getAvailableTimeSlots
  } = useAppointmentStore();

  const { members, getMemberByPhone } = useMemberStore();

  // 本地状态
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelReason, setCancelReason] = useState('');

  // 表单状态
  const [formData, setFormData] = useState({
    memberPhone: '',
    serviceId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '',
    notes: ''
  });

  // 统计数据
  const stats = getStats();

  // 筛选后的预约数据
  const filteredAppointments = React.useMemo(() => {
    let result = appointments;

    // 按日期筛选
    if (selectedDate) {
      result = result.filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentTime).toDateString();
        const targetDate = new Date(selectedDate).toDateString();
        return appointmentDate === targetDate;
      });
    }

    // 按搜索关键词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(appointment =>
        appointment.memberName.toLowerCase().includes(query) ||
        appointment.phone.includes(query) ||
        appointment.serviceName.toLowerCase().includes(query)
      );
    }

    // 按状态筛选
    if (statusFilter !== 'all') {
      result = result.filter(appointment => appointment.status === statusFilter);
    }

    return result.sort((a, b) =>
      new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime()
    );
  }, [appointments, selectedDate, searchQuery, statusFilter]);

  // 分页数据
  const paginatedAppointments = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAppointments.slice(startIndex, startIndex + pageSize);
  }, [filteredAppointments, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAppointments.length / pageSize);

  // 可用时间段
  const availableTimeSlots = React.useMemo(() => {
    if (!formData.serviceId || !formData.appointmentDate) return [];
    return getAvailableTimeSlots(formData.appointmentDate, formData.serviceId);
  }, [formData.serviceId, formData.appointmentDate, getAvailableTimeSlots]);

  // 初始化数据
  useEffect(() => {
    fetchAppointments();
    fetchServices();
  }, [fetchAppointments, fetchServices]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.memberPhone || !formData.serviceId || !formData.appointmentTime) {
      toast.error('请填写所有必填字段');
      return;
    }

    // 查找会员
    const member = getMemberByPhone(formData.memberPhone);
    if (!member) {
      toast.error('未找到该手机号对应的会员');
      return;
    }

    // 查找服务
    const service = services.find(s => s.id === formData.serviceId);
    if (!service) {
      toast.error('服务项目不存在');
      return;
    }

    try {
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}:00`);

      await addAppointment({
        memberId: member.id,
        memberName: member.name,
        phone: member.phone,
        serviceId: service.id,
        serviceName: service.name,
        appointmentTime: appointmentDateTime.toISOString(),
        duration: service.duration,
        notes: formData.notes
      });

      setShowAddModal(false);
      setFormData({
        memberPhone: '',
        serviceId: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '',
        notes: ''
      });
    } catch (error) {
      // 错误已在store中处理
    }
  };

  // 处理取消预约
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await cancelAppointment(selectedAppointment.id, cancelReason);
      setShowCancelModal(false);
      setSelectedAppointment(null);
      setCancelReason('');
    } catch (error) {
      // 错误已在store中处理
    }
  };

  // 获取状态样式
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'no-show':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '已预约';
      case 'confirmed':
        return '已确认';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      case 'no-show':
        return '未到店';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">预约管理</h1>
        <p className="text-gray-500 mt-1">管理客户预约和服务安排</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">总预约</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
              <p className="text-sm text-gray-500">今日预约</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.scheduled}</p>
              <p className="text-sm text-gray-500">待确认</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-500">已完成</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-sm text-gray-500">已取消</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.noShow}</p>
              <p className="text-sm text-gray-500">未到店</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择日期</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
                <SearchInput
                  placeholder="搜索会员姓名、手机号、服务项目..."
                  onSearch={setSearchQuery}
                  className="w-full sm:w-80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态筛选</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部状态</option>
                  <option value="scheduled">已预约</option>
                  <option value="confirmed">已确认</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                  <option value="no-show">未到店</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                icon="fa-plus"
              >
                新建预约
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预约列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            预约列表 - {selectedDate ? new Date(selectedDate).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : '全部'}
          </CardTitle>
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
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <i className="fa-solid fa-calendar-times text-4xl mb-4 text-gray-300"></i>
              <p>暂无预约数据</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        预约时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        会员信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        服务项目
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        备注
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedAppointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(appointment.appointmentTime).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.duration} 分钟
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{appointment.memberName}</div>
                            <div className="text-sm text-gray-500">{appointment.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{appointment.serviceName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusVariant(appointment.status)}>
                            {getStatusText(appointment.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {appointment.notes || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {appointment.status === 'scheduled' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => confirmAppointment(appointment.id)}
                                  icon="fa-check"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  确认
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowCancelModal(true);
                                  }}
                                  icon="fa-times"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  取消
                                </Button>
                              </>
                            )}
                            {appointment.status === 'confirmed' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => completeAppointment(appointment.id)}
                                  icon="fa-check-circle"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  完成
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markNoShow(appointment.id)}
                                  icon="fa-user-times"
                                  className="text-gray-600 hover:text-gray-700"
                                >
                                  未到店
                                </Button>
                              </>
                            )}
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
                      {Math.min(currentPage * pageSize, filteredAppointments.length)} 条，
                      共 {filteredAppointments.length} 条记录
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

      {/* 新建预约模态框 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="新建预约"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              会员手机号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.memberPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, memberPhone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入会员手机号"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              服务项目 <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.serviceId}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择服务项目</option>
              {services.filter(s => s.active).map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - ¥{service.price} ({service.duration}分钟)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预约日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.appointmentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预约时间 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.appointmentTime}
                onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!formData.serviceId || !formData.appointmentDate}
              >
                <option value="">请选择时间</option>
                {availableTimeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
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
              创建预约
            </Button>
          </div>
        </form>
      </Modal>

      {/* 取消预约模态框 */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="取消预约"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要取消 <strong>{selectedAppointment?.memberName}</strong> 的预约吗？
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">取消原因</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入取消原因（可选）"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelAppointment}
              loading={loading}
            >
              确认取消
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}