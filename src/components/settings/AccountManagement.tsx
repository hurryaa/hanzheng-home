import { useState, useEffect } from 'react';
import { storage } from '@/lib/utils';
import { toast } from 'sonner';

export interface Account {
  id: string;
  username: string;
  password: string;
  role: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLogin?: string;
}

interface AccountManagementProps {
  onLog?: (module: string, action: string, details: string) => void;
}

export const AccountManagement: React.FC<AccountManagementProps> = ({ onLog }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'staff',
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    const data = storage.get<Account[]>('accounts') || [];
    setAccounts(data);
  };

  const handleAdd = () => {
    setEditingAccount(null);
    setFormData({
      username: '',
      password: '',
      role: 'staff',
      name: '',
      email: '',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      username: account.username,
      password: '',
      role: account.role,
      name: account.name,
      email: account.email,
      phone: account.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.username || !formData.name) {
      toast.error('用户名和姓名不能为空');
      return;
    }

    if (!editingAccount && !formData.password) {
      toast.error('新账号必须设置密码');
      return;
    }

    const currentAccounts = storage.get<Account[]>('accounts') || [];

    if (editingAccount) {
      const index = currentAccounts.findIndex(a => a.id === editingAccount.id);
      if (index !== -1) {
        currentAccounts[index] = {
          ...editingAccount,
          username: formData.username,
          password: formData.password || editingAccount.password,
          role: formData.role,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        };
        onLog?.('设置', '账号管理', `修改账号: ${formData.username}`);
      }
    } else {
      const newAccount: Account = {
        id: `ACC${Date.now()}`,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      currentAccounts.push(newAccount);
      onLog?.('设置', '账号管理', `创建账号: ${formData.username}`);
    }

    storage.set('accounts', currentAccounts);
    setAccounts(currentAccounts);
    setIsModalOpen(false);
    toast.success(editingAccount ? '账号更新成功' : '账号创建成功');
  };

  const handleToggleStatus = (account: Account) => {
    if (account.role === 'admin' && account.status === 'active') {
      toast.error('无法禁用管理员账号');
      return;
    }

    const currentAccounts = storage.get<Account[]>('accounts') || [];
    const index = currentAccounts.findIndex(a => a.id === account.id);
    
    if (index !== -1) {
      currentAccounts[index].status = account.status === 'active' ? 'disabled' : 'active';
      storage.set('accounts', currentAccounts);
      setAccounts(currentAccounts);
      onLog?.('设置', '账号管理', `${currentAccounts[index].status === 'active' ? '启用' : '禁用'}账号: ${account.username}`);
      toast.success('账号状态已更新');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">账号管理</h3>
          <p className="text-sm text-gray-500 mt-1">管理系统用户账号和权限</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <i className="fa-solid fa-plus mr-2"></i>添加账号
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {account.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    account.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {account.role === 'admin' ? '管理员' : account.role === 'staff' ? '员工' : '前台'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.email || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {account.status === 'active' ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleToggleStatus(account)}
                    className={account.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                  >
                    {account.status === 'active' ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  暂无账号数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAccount ? '编辑账号' : '添加账号'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingAccount}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingAccount ? '新密码（留空不修改）' : '密码'} {!editingAccount && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={editingAccount ? '留空不修改' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={editingAccount?.role === 'admin'}
                >
                  <option value="admin">管理员</option>
                  <option value="staff">员工</option>
                  <option value="receptionist">前台</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

export default AccountManagement;
