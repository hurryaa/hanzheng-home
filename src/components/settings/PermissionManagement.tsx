import { useState, useEffect } from 'react';
import { storage } from '@/lib/utils';
import { toast } from 'sonner';

export interface Permission {
  id: string;
  name: string;
  description: string;
  scopes: string[];
  status: 'active' | 'disabled';
  members: number;
}

interface PermissionManagementProps {
  onLog?: (module: string, action: string, details: string) => void;
}

const AVAILABLE_SCOPES = [
  { value: 'dashboard:view', label: '查看仪表盘' },
  { value: 'members:manage', label: '管理会员' },
  { value: 'recharge:manage', label: '管理充值' },
  { value: 'consumption:manage', label: '管理消费' },
  { value: 'cards:manage', label: '管理次卡' },
  { value: 'appointments:manage', label: '管理预约' },
  { value: 'settings:access', label: '访问设置' },
  { value: 'reports:export', label: '导出报表' }
];

const PermissionManagement: React.FC<PermissionManagementProps> = ({ onLog }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scopes: [] as string[],
    status: 'active' as Permission['status']
  });
  const [scopeSearch, setScopeSearch] = useState('');

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = () => {
    const data = storage.get<Permission[]>('rolePermissions') || [];
    if (data.length === 0) {
      const defaults: Permission[] = [
        {
          id: 'PERM_ADMIN',
          name: '系统管理员',
          description: '拥有所有系统权限，负责配置与管理',
          scopes: AVAILABLE_SCOPES.map(scope => scope.value),
          status: 'active',
          members: 1
        },
        {
          id: 'PERM_STAFF',
          name: '运营专员',
          description: '处理会员、充值、消费等日常业务',
          scopes: ['dashboard:view', 'members:manage', 'recharge:manage', 'consumption:manage', 'reports:export'],
          status: 'active',
          members: 0
        }
      ];
      storage.set('rolePermissions', defaults);
      setPermissions(defaults);
      return;
    }
    setPermissions(data);
  };

  const openModal = (permission?: Permission) => {
    if (permission) {
      setEditingPermission(permission);
      setFormData({
        name: permission.name,
        description: permission.description,
        scopes: permission.scopes,
        status: permission.status
      });
    } else {
      setEditingPermission(null);
      setFormData({
        name: '',
        description: '',
        scopes: [],
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleScope = (scope: string) => {
    setFormData((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((item) => item !== scope)
        : [...prev.scopes, scope]
    }));
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('请输入角色名称');
      return;
    }

    if (formData.scopes.length === 0) {
      toast.error('至少需要选择一个权限范围');
      return;
    }

    const currentPermissions = storage.get<Permission[]>('rolePermissions') || [];

    if (editingPermission) {
      const index = currentPermissions.findIndex((item) => item.id === editingPermission.id);
      if (index !== -1) {
        currentPermissions[index] = {
          ...editingPermission,
          ...formData
        };
        onLog?.('设置', '权限管理', `更新角色 ${formData.name}`);
      }
    } else {
      const newPermission: Permission = {
        id: `PERM${Date.now()}`,
        name: formData.name,
        description: formData.description,
        scopes: formData.scopes,
        status: formData.status,
        members: 0
      };
      currentPermissions.push(newPermission);
      onLog?.('设置', '权限管理', `创建角色 ${formData.name}`);
    }

    storage.set('rolePermissions', currentPermissions);
    setPermissions(currentPermissions);
    setIsModalOpen(false);
    toast.success('权限设置已保存');
  };

  const handleStatusToggle = (permission: Permission) => {
    if (permission.id === 'PERM_ADMIN') {
      toast.error('系统管理员角色不可禁用');
      return;
    }

    const currentPermissions = storage.get<Permission[]>('rolePermissions') || [];
    const index = currentPermissions.findIndex((item) => item.id === permission.id);
    if (index !== -1) {
      currentPermissions[index].status = currentPermissions[index].status === 'active' ? 'disabled' : 'active';
      storage.set('rolePermissions', currentPermissions);
      setPermissions(currentPermissions);
      onLog?.(
        '设置',
        '权限管理',
        `${currentPermissions[index].status === 'active' ? '启用' : '禁用'}角色 ${permission.name}`
      );
      toast.success('角色状态已更新');
    }
  };

  const filteredScopes = AVAILABLE_SCOPES.filter((scope) =>
    scope.label.toLowerCase().includes(scopeSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">权限管理</h3>
          <p className="text-sm text-gray-500 mt-1">定义角色权限范围，控制系统访问</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <i className="fa-solid fa-user-shield mr-2"></i>创建角色
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {permissions.map((permission) => (
          <div key={permission.id} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h4 className="text-lg font-semibold text-gray-900">{permission.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    permission.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {permission.status === 'active' ? '启用' : '禁用'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{permission.description}</p>
                <div className="mt-3">
                  <span className="text-xs text-gray-500">已绑定账号：{permission.members} 个</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-3">
                <button
                  onClick={() => openModal(permission)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleStatusToggle(permission)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  {permission.status === 'active' ? '禁用' : '启用'}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">权限范围</h5>
              <div className="mt-2 flex flex-wrap gap-2">
                {permission.scopes.map((scope) => {
                  const label = AVAILABLE_SCOPES.find((item) => item.value === scope)?.label || scope;
                  return (
                    <span key={scope} className="px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-600">
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {permissions.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
            暂无权限配置，请点击“创建角色”进行添加。
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">{editingPermission ? '编辑角色' : '创建角色'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色名称 <span className="text-red-500">*</span></label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Permission['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">启用</option>
                    <option value="disabled">禁用</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色描述</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">权限范围 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="搜索权限..."
                    value={scopeSearch}
                    onChange={(e) => setScopeSearch(e.target.value)}
                    className="w-60 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                  {filteredScopes.map((scope) => (
                    <label key={scope.value} className="flex items-start space-x-2 bg-gray-50 rounded-lg p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={formData.scopes.includes(scope.value)}
                        onChange={() => handleToggleScope(scope.value)}
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">{scope.label}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">{scope.value}</span>
                      </span>
                    </label>
                  ))}
                  {filteredScopes.length === 0 && (
                    <div className="col-span-2 text-center text-sm text-gray-500 py-6">
                      没有匹配的权限项
                    </div>
                  )}
                </div>
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

export default PermissionManagement;
