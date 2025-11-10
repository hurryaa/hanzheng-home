import { useState, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    avatar: ''
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'security' | 'preferences'>('basic');

  const handleSave = () => {
    toast.success('个人资料已更新');
    setIsEditing(false);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('密码修改成功，请重新登录');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">个人资料</h1>
        <p className="text-gray-500 mt-1">管理您的个人信息和账户设置</p>
      </div>

      {/* 个人资料卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 头部背景 */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        
        {/* 用户信息 */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-6">
            {/* 头像 */}
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center text-4xl font-bold text-blue-600 overflow-hidden">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="用户头像" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors duration-200">
                <i className="fa-solid fa-camera text-gray-600"></i>
              </button>
            </div>

            {/* 用户基本信息 */}
            <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user?.name || '未设置'}</h2>
              <p className="text-gray-500 mt-1">{user?.email || '未设置邮箱'}</p>
              <div className="flex items-center mt-2 space-x-3">
                <span className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                  user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                )}>
                  <i className={`fa-solid ${user?.role === 'admin' ? 'fa-crown' : 'fa-user'} mr-1`}></i>
                  {user?.role === 'admin' ? '系统管理员' : '普通用户'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <i className="fa-solid fa-check-circle mr-1"></i>
                  账号正常
                </span>
              </div>
            </div>

            {/* 编辑按钮 */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="mt-4 sm:mt-0 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              <i className={`fa-solid ${isEditing ? 'fa-times' : 'fa-edit'} mr-2`}></i>
              {isEditing ? '取消编辑' : '编辑资料'}
            </button>
          </div>

          {/* 标签页 */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('basic')}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                  activeTab === 'basic'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <i className="fa-solid fa-user mr-2"></i>
                基本信息
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <i className="fa-solid fa-lock mr-2"></i>
                安全设置
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                  activeTab === 'preferences'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <i className="fa-solid fa-cog mr-2"></i>
                偏好设置
              </button>
            </nav>
          </div>

          {/* 标签页内容 */}
          <div className="mt-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      用户名
                    </label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">用户名不可修改</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      className={cn(
                        'w-full px-4 py-2 border border-gray-300 rounded-lg transition-colors duration-200',
                        isEditing
                          ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          : 'bg-gray-50 cursor-not-allowed'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      邮箱地址 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className={cn(
                        'w-full px-4 py-2 border border-gray-300 rounded-lg transition-colors duration-200',
                        isEditing
                          ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          : 'bg-gray-50 cursor-not-allowed'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      手机号码
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="未设置"
                      className={cn(
                        'w-full px-4 py-2 border border-gray-300 rounded-lg transition-colors duration-200',
                        isEditing
                          ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          : 'bg-gray-50 cursor-not-allowed'
                      )}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                    >
                      保存修改
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">修改密码</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        当前密码
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        新密码
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        确认新密码
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                    >
                      修改密码
                    </button>
                  </form>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">登录历史</h3>
                  <div className="space-y-3">
                    {[
                      { time: '2024-01-10 14:30', location: '北京市', device: 'Chrome on Windows' },
                      { time: '2024-01-09 09:15', location: '北京市', device: 'Safari on iPhone' },
                      { time: '2024-01-08 16:45', location: '上海市', device: 'Chrome on Mac' },
                    ].map((log, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-desktop text-blue-600"></i>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{log.device}</p>
                            <p className="text-xs text-gray-500">{log.location} • {log.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">通知偏好</h3>
                  <div className="space-y-4">
                    {[
                      { label: '会员充值通知', description: '当会员充值时接收通知' },
                      { label: '消费记录通知', description: '当产生新的消费记录时接收通知' },
                      { label: '次卡到期提醒', description: '会员次卡即将到期时提醒' },
                      { label: '系统更新通知', description: '接收系统更新和维护通知' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">界面偏好</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">语言</p>
                        <p className="text-xs text-gray-500 mt-1">选择界面显示语言</p>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>简体中文</option>
                        <option>English</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">每页显示数量</p>
                        <p className="text-xs text-gray-500 mt-1">设置列表每页显示的记录数</p>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>10</option>
                        <option>20</option>
                        <option>50</option>
                        <option>100</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 账号信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-calendar text-blue-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">注册时间</p>
              <p className="text-lg font-semibold text-gray-900">2023-06-15</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-clock text-green-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">最后登录</p>
              <p className="text-lg font-semibold text-gray-900">今天 14:30</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-shield-alt text-purple-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">账号安全</p>
              <p className="text-lg font-semibold text-green-600">良好</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
