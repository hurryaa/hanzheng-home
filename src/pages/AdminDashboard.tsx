import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const adminModules = [
    {
      title: '会员管理',
      description: '查看和管理所有会员信息',
      icon: 'fa-users',
      color: 'bg-blue-500',
      path: '/admin/members',
      stats: [
        { label: '总会员数', value: '156', color: 'text-blue-600' },
        { label: '活跃会员', value: '98', color: 'text-green-600' },
      ]
    },
    {
      title: '套餐管理',
      description: '配置和管理汗蒸次卡套餐',
      icon: 'fa-box',
      color: 'bg-green-500',
      path: '/admin/packages',
      stats: [
        { label: '套餐总数', value: '8', color: 'text-green-600' },
        { label: '在售套餐', value: '7', color: 'text-blue-600' },
      ]
    },
    {
      title: '佣金管理',
      description: '审批和管理分销商佣金',
      icon: 'fa-wallet',
      color: 'bg-yellow-500',
      path: '/admin/commissions',
      stats: [
        { label: '待审批', value: '12', color: 'text-yellow-600' },
        { label: '可提现', value: '¥2,580', color: 'text-green-600' },
      ]
    },
    {
      title: '核销记录',
      description: '查看和管理所有核销记录',
      icon: 'fa-check-circle',
      color: 'bg-purple-500',
      path: '/consumption-details',
      stats: [
        { label: '今日核销', value: '28次', color: 'text-purple-600' },
        { label: '本月核销', value: '890次', color: 'text-blue-600' },
      ]
    },
    {
      title: '购买记录',
      description: '查看和管理所有购买记录',
      icon: 'fa-credit-card',
      color: 'bg-pink-500',
      path: '/purchase-history',
      stats: [
        { label: '今日购买', value: '12单', color: 'text-pink-600' },
        { label: '本月销售额', value: '¥8,900', color: 'text-green-600' },
      ]
    },
    {
      title: '系统设置',
      description: '配置系统规则和权限',
      icon: 'fa-sliders',
      color: 'bg-gray-500',
      path: '/settings',
      stats: [
        { label: '门店数', value: '3', color: 'text-gray-600' },
        { label: '员工数', value: '8', color: 'text-blue-600' },
      ]
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
        <p className="text-gray-600 mt-2">汗蒸会员管理系统 - 完整的配置和管理平台</p>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm mb-2">总会员数</p>
          <p className="text-3xl font-bold text-blue-600">156</p>
          <p className="text-xs text-gray-500 mt-2">↑ 12 本周新增</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm mb-2">本月销售额</p>
          <p className="text-3xl font-bold text-green-600">¥8,900</p>
          <p className="text-xs text-gray-500 mt-2">↑ 15% 相比上月</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm mb-2">核销次数</p>
          <p className="text-3xl font-bold text-purple-600">890</p>
          <p className="text-xs text-gray-500 mt-2">本月统计</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm mb-2">待审批佣金</p>
          <p className="text-3xl font-bold text-yellow-600">¥2,580</p>
          <p className="text-xs text-gray-500 mt-2">12 笔待处理</p>
        </div>
      </div>

      {/* 管理模块网格 */}
      <div className="grid grid-cols-3 gap-6">
        {adminModules.map((module, index) => (
          <button
            key={index}
            onClick={() => navigate(module.path)}
            className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group"
          >
            {/* 模块头部（彩色背景 + 图标） */}
            <div className={`${module.color} p-6 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition"></div>
              <i className={`fa-solid ${module.icon} text-3xl mb-2 block relative z-10`}></i>
              <h2 className="text-xl font-bold text-left relative z-10">{module.title}</h2>
            </div>

            {/* 模块内容 */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">{module.description}</p>

              {/* 统计信息 */}
              <div className="space-y-3 mb-4">
                {module.stats.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{stat.label}</span>
                    <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* 进入按钮 */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between group/btn">
                <span className="text-sm font-medium text-blue-600">进入管理</span>
                <i className="fa-solid fa-arrow-right text-blue-600 transform group-hover/btn:translate-x-1 transition"></i>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 操作提示 */}
      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-lightbulb"></i>
            快速提示
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ 检查待审批的佣金记录</li>
            <li>✓ 定期检查会员增长情况</li>
            <li>✓ 监控核销和销售数据</li>
            <li>✓ 及时处理异常交易</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-calendar-check"></i>
            本周任务
          </h3>
          <ul className="text-sm text-green-800 space-y-2">
            <li>☐ 审批待定佣金（12笔）</li>
            <li>☐ 检查异常核销记录</li>
            <li>☐ 更新套餐活动信息</li>
            <li>☐ 发送周报告给股东</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
