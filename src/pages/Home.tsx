import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { getMembers, getRechargeRecords, getConsumptionRecords } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuickStat {
  label: string;
  value: number | string;
  change: string;
  icon: string;
  color: string;
  link: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  link: string;
}

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QuickStat[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const members = getMembers();
        const recharges = getRechargeRecords();
        const consumptions = getConsumptionRecords();

        // 计算今日数据
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayRecharges = recharges.filter(r => new Date(r.time) >= today);
        const todayConsumptions = consumptions.filter(c => new Date(c.time) >= today);
        
        const todayRechargeAmount = todayRecharges.reduce((sum, r) => sum + r.amount, 0);
        const todayConsumptionAmount = todayConsumptions.reduce((sum, c) => sum + c.amount, 0);

        // 活跃会员（有次卡且未过期）
        const activeMembers = members.filter(m => {
          if (!m.card) return false;
          const expiryDate = new Date(m.card.expiryDate);
          return expiryDate > new Date() && m.card.remainingCount > 0;
        });

        setStats([
          {
            label: '总会员数',
            value: members.length,
            change: `活跃 ${activeMembers.length}`,
            icon: 'fa-users',
            color: 'bg-blue-500',
            link: '/members'
          },
          {
            label: '今日充值',
            value: `¥${todayRechargeAmount.toLocaleString()}`,
            change: `${todayRecharges.length} 笔`,
            icon: 'fa-credit-card',
            color: 'bg-green-500',
            link: '/recharges'
          },
          {
            label: '今日消费',
            value: `¥${todayConsumptionAmount.toLocaleString()}`,
            change: `${todayConsumptions.length} 笔`,
            icon: 'fa-receipt',
            color: 'bg-purple-500',
            link: '/consumptions'
          },
          {
            label: '今日预约',
            value: 0,
            change: '暂无预约',
            icon: 'fa-calendar-check',
            color: 'bg-orange-500',
            link: '/appointments'
          }
        ]);
      } catch (error) {
        console.error('加载统计数据失败:', error);
        toast.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const quickActions: QuickAction[] = [
    {
      title: '新增会员',
      description: '快速添加新会员信息',
      icon: 'fa-user-plus',
      color: 'bg-blue-500',
      link: '/members'
    },
    {
      title: '会员充值',
      description: '为会员账户充值',
      icon: 'fa-wallet',
      color: 'bg-green-500',
      link: '/recharges'
    },
    {
      title: '消费登记',
      description: '记录会员消费明细',
      icon: 'fa-shopping-cart',
      color: 'bg-purple-500',
      link: '/consumptions'
    },
    {
      title: '预约管理',
      description: '查看和管理客户预约',
      icon: 'fa-calendar',
      color: 'bg-orange-500',
      link: '/appointments'
    },
    {
      title: '办理次卡',
      description: '为会员办理次卡服务',
      icon: 'fa-ticket-alt',
      color: 'bg-pink-500',
      link: '/member-cards'
    },
    {
      title: '数据分析',
      description: '查看业务数据报表',
      icon: 'fa-chart-line',
      color: 'bg-indigo-500',
      link: '/dashboard'
    }
  ];

  const recentActivities = [
    { type: 'recharge', user: '张三', action: '充值了 ¥1000', time: '10分钟前', icon: 'fa-credit-card', color: 'text-green-600' },
    { type: 'consumption', user: '李四', action: '消费了汗蒸服务', time: '25分钟前', icon: 'fa-shopping-cart', color: 'text-purple-600' },
    { type: 'member', user: '王五', action: '成为新会员', time: '1小时前', icon: 'fa-user-plus', color: 'text-blue-600' },
    { type: 'card', user: '赵六', action: '购买了30次次卡', time: '2小时前', icon: 'fa-ticket-alt', color: 'text-orange-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              欢迎回来，{user?.name || '管理员'} 👋
            </h1>
            <p className="text-blue-100 text-lg">
              {new Date().toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              <i className="fa-solid fa-cog mr-2"></i>
              系统设置
            </button>
          </div>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <i className="fa-solid fa-arrow-right mr-1 text-xs"></i>
                  {stat.change}
                </div>
              </div>
              <div className={cn(
                'p-3 rounded-lg text-white shadow-md transform transition-transform duration-300 group-hover:scale-110',
                stat.color
              )}>
                <i className={`fa-solid ${stat.icon} text-xl`}></i>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 快捷操作 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md hover:border-blue-300 group"
            >
              <div className="flex items-start space-x-4">
                <div className={cn(
                  'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-110',
                  action.color
                )}>
                  <i className={`fa-solid ${action.icon} text-xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-200">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
                <i className="fa-solid fa-chevron-right text-gray-400 group-hover:text-blue-600 transition-colors duration-200"></i>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 最近动态和待办事项 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近动态 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">最近动态</h2>
              <Link to="/dashboard" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                查看全部
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <i className={`fa-solid ${activity.icon} ${activity.color}`}></i>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 待办事项 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">待办事项</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                3 项
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { 
                title: '次卡即将到期提醒', 
                description: '有 5 位会员的次卡即将在 7 天内到期',
                priority: 'high',
                icon: 'fa-exclamation-circle',
                link: '/members'
              },
              { 
                title: '查看今日预约', 
                description: '今日有 3 个预约待确认',
                priority: 'medium',
                icon: 'fa-calendar-check',
                link: '/appointments'
              },
              { 
                title: '每日数据报表', 
                description: '查看今日营业数据统计',
                priority: 'low',
                icon: 'fa-chart-bar',
                link: '/dashboard'
              }
            ].map((todo, index) => (
              <Link
                key={index}
                to={todo.link}
                className="p-4 hover:bg-gray-50 transition-colors duration-200 block"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={cn(
                      'w-5 h-5 rounded flex items-center justify-center',
                      todo.priority === 'high' ? 'bg-red-100 text-red-600' :
                      todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    )}>
                      <i className={`fa-solid ${todo.icon} text-xs`}></i>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{todo.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{todo.description}</p>
                  </div>
                  <i className="fa-solid fa-chevron-right text-gray-400 text-sm"></i>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 快速搜索 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">快速查询</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="输入会员姓名或手机号..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value;
                  if (value) {
                    navigate(`/members?search=${encodeURIComponent(value)}`);
                  }
                }
              }}
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder="输入会员姓名或手机号..."]') as HTMLInputElement;
              if (input?.value) {
                navigate(`/members?search=${encodeURIComponent(input.value)}`);
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
          >
            <i className="fa-solid fa-search mr-2"></i>
            搜索
          </button>
        </div>
      </div>
    </div>
  );
}
