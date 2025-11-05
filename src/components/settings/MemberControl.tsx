import { useEffect, useState } from 'react';
import { storage } from '@/lib/utils';
import { toast } from 'sonner';

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  phone?: string;
  email?: string;
  status: 'active' | 'vacation' | 'resigned';
  role: string;
  joinDate: string;
  notes?: string;
  team?: string;
}

interface MemberControlProps {
  onLog?: (module: string, action: string, details: string) => void;
}

const STATUS_LABELS: Record<StaffMember['status'], string> = {
  active: '在职',
  vacation: '休假',
  resigned: '离职',
};

const MemberControl: React.FC<MemberControlProps> = ({ onLog }) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState<Omit<StaffMember, 'id' | 'joinDate'>>({
    name: '',
    title: '',
    phone: '',
    email: '',
    status: 'active',
    role: '',
    notes: '',
    team: '',
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = () => {
    const data = storage.get<StaffMember[]>('staffMembers') || [];
    setStaffMembers(data);
  };

  const openModal = (member?: StaffMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        title: member.title,
        phone: member.phone || '',
        email: member.email || '',
        status: member.status,
        role: member.role,
        notes: member.notes || '',
        team: member.team || '',
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        title: '',
        phone: '',
        email: '',
        status: 'active',
        role: '',
        notes: '',
        team: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.title) {
      toast.error('员工姓名和职务不能为空');
      return;
    }

    const currentStaff = storage.get<StaffMember[]>('staffMembers') || [];

    if (editingMember) {
      const index = currentStaff.findIndex((member) => member.id === editingMember.id);
      if (index !== -1) {
        currentStaff[index] = {
          ...editingMember,
          ...formData,
        };
        onLog?.('设置', '成员控制', `更新员工信息: ${formData.name}`);
      }
    } else {
      const newStaff: StaffMember = {
        id: `STF${Date.now()}`,
        ...formData,
        joinDate: new Date().toISOString(),
      };
      currentStaff.push(newStaff);
      onLog?.('设置', '成员控制', `新增员工: ${formData.name}`);
    }

    storage.set('staffMembers', currentStaff);
    setStaffMembers(currentStaff);
    setIsModalOpen(false);
    toast.success('成员信息保存成功');
  };

  const handleStatusChange = (member: StaffMember, status: StaffMember['status']) => {
    const currentStaff = storage.get<StaffMember[]>('staffMembers') || [];
    const index = currentStaff.findIndex((item) => item.id === member.id);

    if (index !== -1) {
      currentStaff[index].status = status;
      storage.set('staffMembers', currentStaff);
      setStaffMembers(currentStaff);
      onLog?.('设置', '成员控制', `调整员工状态: ${member.name} -> ${STATUS_LABELS[status]}`);
      toast.success('成员状态已更新');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">成员控制</h3>
          <p className="text-sm text-gray-500 mt-1">管理店内员工与岗位</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <i className="fa-solid fa-user-plus mr-2"></i>新增成员
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {staffMembers.map((member) => (
          <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-semibold">
                {member.name.slice(0, 1)}
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h4 className="text-lg font-semibold text-gray-900">{member.name}</h4>
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                    {member.title}
                  </span>
                  {member.team && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600">
                      {member.team}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{member.role || '未分配角色'}</p>
                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  {member.phone && (
                    <p><i className="fa-solid fa-phone mr-2"></i>{member.phone}</p>
                  )}
                  {member.email && (
                    <p><i className="fa-solid fa-envelope mr-2"></i>{member.email}</p>
                  )}
                  <p><i className="fa-solid fa-clock mr-2"></i>入职：{new Date(member.joinDate).toLocaleDateString()}</p>
                </div>
                {member.notes && (
                  <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">{member.notes}</p>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <select
                value={member.status}
                onChange={(e) => handleStatusChange(member, e.target.value as StaffMember['status'])}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">在职</option>
                <option value="vacation">休假</option>
                <option value="resigned">离职</option>
              </select>
              <button
                onClick={() => openModal(member)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                编辑
              </button>
            </div>
          </div>
        ))}

        {staffMembers.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
            暂无成员数据，请点击“新增成员”进行添加。
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">{editingMember ? '编辑成员' : '新增成员'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">职务 <span className="text-red-500">*</span></label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所属角色</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="例如：前台、技师、客服"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">团队/班组</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberControl;
