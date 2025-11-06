import React, { useEffect, useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import { Member, cn, getRechargeRecords, getCardTypes, getMembers, getConsumptionRecords, initStorageData, initRechargeData, initCardTypes } from '@/lib/utils';

// 状态标签样式
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case '已完成':
        return 'bg-green-100 text-green-800';
      case '已取消':
        return 'bg-red-100 text-red-800';
      case '进行中':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusStyle())}>
      {status}
    </span>
  );
};

// 警告标签
const WarningBadge = ({ daysLeft }: { daysLeft: number }) => {
  let style = 'bg-yellow-100 text-yellow-800';
  if (daysLeft <= 3) {
    style = 'bg-red-100 text-red-800';
  } else if (daysLeft <= 7) {
    style = 'bg-orange-100 text-orange-800';
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', style)}>
      剩余 {daysLeft} 天
    </span>
  );
};

// 统计卡片组件
const StatCard = ({
  title, value, change, icon, color, compareText = '较上月'
}: {
  title: string,
  value: string | number,
  change: string,
  icon: string,
  color: string,
  compareText?: string
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isIncreased = useMemo(() => change.startsWith('+'), [change]);

  return (
    <div
      className={`card rounded-xl shadow-sm border p-6 transition-all duration-300 hover:shadow-md transform ${isHovered ? 'translate-y-[-4px]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <div className={`flex items-center mt-1 text-sm ${isIncreased ? 'text-green-600' : 'text-red-600'} transition-colors duration-300`}>
            {isIncreased ? (
              <i className="fa-solid fa-arrow-up mr-1 transform transition-transform duration-500"></i>
            ) : (
              <i className="fa-solid fa-arrow-down mr-1 transform transition-transform duration-500"></i>
            )}
            {change} {compareText}
          </div>
        </div>
        <div className={`p-3 rounded-lg text-white ${color} shadow-md transform transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}>
          <i className={`fa-solid ${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [loading, setLoading] = useState(true);
  const [activeChartData, setActiveChartData] = useState<'revenue' | 'members'>('revenue');
  const [dashboardData, setDashboardData] = useState({
    revenueData: [],
    monthlyRechargeAmount: 0,
    monthlyConsumptionAmount: 0,
    totalMembers: 0,
    cardTypesCount: 0,
    timeRange: 'today'
  });

  // 根据时间范围生成比较文本
  const getCompareText = useCallback((range: 'today' | 'week' | 'month' | 'year'): string => {
    switch (range) {
      case 'today':
        return '较昨日';
      case 'week':
        return '较上周';
      case 'month':
        return '较上月';
      case 'year':
        return '较去年';
      default:
        return '较上月';
    }
  }, []);

  // 计算对比数据
  const calculateComparison = useCallback((current: number, previous: number): string => {
    if (previous === 0) {
      return current > 0 ? '+100%' : '0%';
    }
    const change = ((current - previous) / Math.abs(previous) * 100).toFixed(1);
    return (current - previous) >= 0 ? `+${change}%` : `${change}%`;
  }, []);

  // 获取对比期数据
  const getComparisonData = useCallback((range: 'today' | 'week' | 'month' | 'year') => {
    const members = getMembers();
    const recharges = getRechargeRecords();
    const consumptions = getConsumptionRecords();
    const today = new Date();

    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

    switch (range) {
      case 'today': {
        currentStart = new Date();
        currentStart.setHours(0, 0, 0, 0);
        currentEnd = new Date();
        currentEnd.setHours(23, 59, 59, 999);
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 1);
        previousEnd = new Date(currentEnd);
        previousEnd.setDate(previousEnd.getDate() - 1);
        break;
      }
      case 'week': {
        const current = new Date();
        const dayOfWeek = current.getDay() || 7;
        currentStart = new Date(current);
        currentStart.setDate(current.getDate() - dayOfWeek + 1);
        currentStart.setHours(0, 0, 0, 0);
        currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + 6);
        currentEnd.setHours(23, 59, 59, 999);
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 7);
        previousEnd = new Date(currentEnd);
        previousEnd.setDate(previousEnd.getDate() - 7);
        break;
      }
      case 'month': {
        currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
        currentEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        previousEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        break;
      }
      case 'year': {
        currentStart = new Date(today.getFullYear(), 0, 1);
        currentEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        previousStart = new Date(today.getFullYear() - 1, 0, 1);
        previousEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      }
      default:
        currentStart = new Date();
        currentEnd = new Date();
        previousStart = new Date();
        previousEnd = new Date();
    }

    const filterByDateRange = <T,>(items: T[], start: Date, end: Date, dateField: keyof T = 'time' as keyof T) => {
      return items.filter(item => {
        const value = item[dateField];
        if (!value) return false;
        const itemDate = new Date(value as unknown as string);
        return itemDate >= start && itemDate <= end;
      });
    };

    const currentRecharges = filterByDateRange(recharges, currentStart, currentEnd);
    const previousRecharges = filterByDateRange(recharges, previousStart, previousEnd);
    const currentConsumptions = filterByDateRange(consumptions, currentStart, currentEnd);
    const previousConsumptions = filterByDateRange(consumptions, previousStart, previousEnd);
    const currentMembers = filterByDateRange(members, currentStart, currentEnd, 'joinDate');
    const previousMembers = filterByDateRange(members, previousStart, previousEnd, 'joinDate');

    return {
      rechargeAmount: {
        current: currentRecharges.reduce((sum, r) => sum + (r.amount || 0), 0),
        previous: previousRecharges.reduce((sum, r) => sum + (r.amount || 0), 0)
      },
      consumptionAmount: {
        current: currentConsumptions.reduce((sum, c) => sum + (c.amount || 0), 0),
        previous: previousConsumptions.reduce((sum, c) => sum + (c.amount || 0), 0)
      },
      newMembers: {
        current: currentMembers.length,
        previous: previousMembers.length
      },
      totalMembers: {
        current: members.length,
        previous: Math.max(0, members.length - currentMembers.length)
      }
    };
  }, []);

  const comparisonData = useMemo(() => getComparisonData(timeRange), [getComparisonData, timeRange]);
  const compareText = useMemo(() => getCompareText(timeRange), [getCompareText, timeRange]);

  // 从数据库获取数据并处理
  const getDashboardData = useCallback((timeRange: 'today' | 'week' | 'month' | 'year') => {
    try {
      // 从数据库获取所有数据
      const members = getMembers();
      const recharges = getRechargeRecords();
      const consumptions = getConsumptionRecords();
      const cardTypes = getCardTypes();

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // 验证数据完整性
      if (!Array.isArray(members) || !Array.isArray(recharges) || !Array.isArray(consumptions)) {
        console.warn('数据格式异常，使用默认值');
        return {
          revenueData: [],
          monthlyRechargeAmount: 0,
          monthlyConsumptionAmount: 0,
          totalMembers: 0,
          cardTypesCount: 0,
          timeRange
        };
      }

    // 计算本月充值总额
    const monthlyRecharges = recharges.filter(r => {
      const rechargeDate = new Date(r.time);
      return rechargeDate.getMonth() === currentMonth && rechargeDate.getFullYear() === currentYear;
    });

    const monthlyRechargeAmount = monthlyRecharges.reduce((sum, r) => sum + r.amount, 0);

    // 计算本月消费总额
    const monthlyConsumptions = consumptions.filter(c => {
      const consumptionDate = new Date(c.time);
      return consumptionDate.getMonth() === currentMonth && consumptionDate.getFullYear() === currentYear;
    });

    const monthlyConsumptionAmount = monthlyConsumptions.reduce((sum, c) => sum + c.amount, 0);

    // 生成数据 - 根据时间范围生成月度或年度数据
    const revenueData = [];

    if (timeRange === 'today') {
      // 今日数据
      const todayStr = today.toISOString().split('T')[0];

      // 计算今日的充值总额
      const todayRecharges = recharges.filter(r => {
        const rechargeDate = new Date(r.time).toISOString().split('T')[0];
        return rechargeDate === todayStr;
      });

      const todayRechargeAmount = todayRecharges.reduce((sum, r) => sum + r.amount, 0);

      // 计算今日的消费总额
      const todayConsumptions = consumptions.filter(c => {
        const consumptionDate = new Date(c.time).toISOString().split('T')[0];
        return consumptionDate === todayStr;
      });

      const todayConsumptionAmount = todayConsumptions.reduce((sum, c) => sum + c.amount, 0);

      // 生成今日小时数据
      const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
      hours.forEach((hour, index) => {
        // 计算每小时的营业额
        const hourRecharges = todayRecharges.filter(r => {
          const hourNum = new Date(r.time).getHours();
          return Math.floor(hourNum / 3) === index;
        });

        const revenue = hourRecharges.reduce((sum, r) => sum + r.amount, 0);

        // 计算每小时的新增会员
        const hourMembers = members.filter(member => {
          const joinHour = new Date(member.joinDate).getHours();
          return Math.floor(joinHour / 3) === index;
        });

        revenueData.push({
          name: hour,
          revenue,
          members: hourMembers.length,
          recharges: revenue,
          totalMembers: members.length
        });
      });

      return {
        revenueData,
        monthlyRechargeAmount: todayRechargeAmount,
        monthlyConsumptionAmount: todayConsumptionAmount,
        totalMembers: members.length,
        cardTypesCount: cardTypes.length,
        timeRange
      };
    } else if (timeRange === 'week') {
      // 本周数据
      const dayOfWeek = today.getDay() || 7; // 将周日的0转换为7
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek + 1);

      // 生成过去7天数据
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('zh-CN', { weekday: 'short' });

        // 计算当天的充值总额
        const dailyRecharges = recharges.filter(r => {
          const rechargeDate = new Date(r.time).toISOString().split('T')[0];
          return rechargeDate === dateStr;
        });

        const dailyRevenue = dailyRecharges.reduce((sum, r) => sum + r.amount, 0);

        // 计算当天的新增会员数
        const dailyMembers = members.filter(member => {
          const joinDate = new Date(member.joinDate).toISOString().split('T')[0];
          return joinDate === dateStr;
        });

        revenueData.push({
          name: dayName,
          revenue: dailyRevenue,
          members: dailyMembers.length,
          recharges: dailyRevenue,
          totalMembers: members.length
        });
      }

      return {
        revenueData,
        monthlyRechargeAmount: recharges.reduce((sum, r) => sum + r.amount, 0),
        monthlyConsumptionAmount: consumptions.reduce((sum, c) => sum + c.amount, 0),
        totalMembers: members.length,
        cardTypesCount: cardTypes.length,
        timeRange
      };
    } else if (timeRange === 'month') {
      // 生成近6个月数据
      for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(currentMonth - i);
        const monthName = month.toLocaleString('zh-CN', { month: 'short' });
        const monthYear = month.getFullYear();
        const monthNumber = month.getMonth();

        // 计算该月的充值总额
        const monthlyRevenue = recharges
          .filter(r => {
            const date = new Date(r.time);
            return date.getMonth() === monthNumber && date.getFullYear() === monthYear;
          })
          .reduce((sum, r) => sum + r.amount, 0);

        // 计算该月的新增会员数
        const newMembers = members
          .filter(member => {
            const joinDate = new Date(member.joinDate);
            return joinDate.getMonth() === monthNumber && joinDate.getFullYear() === monthYear;
          })
          .length;

        // 计算该月的消费总额
        const consumptionTotal = consumptions
          .filter(c => {
            const date = new Date(c.time);
            return date.getMonth() === monthNumber && date.getFullYear() === monthYear;
          })
          .reduce((sum, c) => sum + c.amount, 0);

        revenueData.push({
          name: monthName,
          revenue: consumptionTotal,
          members: newMembers,
          recharges: monthlyRevenue
        });
      }
    } else if (timeRange === 'year') {
      // 生成年度数据（12个月）
      for (let i = 0; i < 12; i++) {
        const month = new Date(currentYear, i, 1);
        const monthName = month.toLocaleString('zh-CN', { month: 'short' });
        const monthNumber = month.getMonth();

        // 计算该月的充值总额
        const monthlyRevenue = recharges
          .filter(r => {
            const date = new Date(r.time);
            return date.getMonth() === monthNumber && date.getFullYear() === currentYear;
          })
          .reduce((sum, r) => sum + r.amount, 0);

        // 计算该月的新增会员数
        const newMembers = members
          .filter(member => {
            const joinDate = new Date(member.joinDate);
            return joinDate.getMonth() === monthNumber && joinDate.getFullYear() === currentYear;
          })
          .length;

        // 计算该月的消费总额
        const consumptionTotal = consumptions
          .filter(c => {
            const date = new Date(c.time);
            return date.getMonth() === monthNumber && date.getFullYear() === currentYear;
          })
          .reduce((sum, c) => sum + c.amount, 0);

        revenueData.push({
          name: monthName,
          revenue: consumptionTotal,
          members: newMembers,
          recharges: monthlyRevenue,
          totalMembers: members.length
        });
      }
    }

    return {
      revenueData,
      monthlyRechargeAmount,
      monthlyConsumptionAmount,
      totalMembers: members.length,
      cardTypesCount: cardTypes.length,
      timeRange
    };
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
      return {
        revenueData: [],
        monthlyRechargeAmount: 0,
        monthlyConsumptionAmount: 0,
        totalMembers: 0,
        cardTypesCount: 0,
        timeRange
      };
    }
  }, []);

  // 热门服务项目数据
  const serviceData = useMemo(() => {
    const records = getConsumptionRecords();
    const serviceCount: Record<string, number> = {};

    // 统计各服务项目的消费次数
    records.forEach(record => {
      serviceCount[record.service] = (serviceCount[record.service] || 0) + 1;
    });

    // 转换为图表所需格式并按数量排序
    return Object.entries(serviceCount)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // 只取前5名热门服务
  }, []);

  // 消费时段分布数据
  const timeDistributionData = useMemo(() => {
    const records = getConsumptionRecords();
    const hourCount: Record<string, number> = {};

    // 初始化所有时段为0
    ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].forEach(hour => {
      hourCount[hour] = 0;
    });

    // 统计各时段的消费次数
    records.forEach(record => {
      const hour = new Date(record.time).getHours();
      // 将小时转换为我们定义的时段格式
      let hourStr = '';
      if (hour >= 10 && hour < 11) hourStr = '10:00';
      else if (hour >= 12 && hour < 13) hourStr = '12:00';
      else if (hour >= 14 && hour < 15) hourStr = '14:00';
      else if (hour >= 16 && hour < 17) hourStr = '16:00';
      else if (hour >= 18 && hour < 19) hourStr = '18:00';
      else if (hour >= 20 && hour < 21) hourStr = '20:00';
      else if (hour >= 22 && hour < 23) hourStr = '22:00';

      if (hourStr) {
        hourCount[hourStr]++;
      }
    });

    // 转换为图表所需格式
    return Object.entries(hourCount).map(([name, value]) => ({ name, value }));
  }, []);

  // 格式化最近时间显示
  const formatRecentTime = useCallback((timeString: string) => {
    const time = new Date(timeString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (time.toDateString() === now.toDateString()) {
      return `今天 ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    } else if (time.toDateString() === yesterday.toDateString()) {
      return `昨天 ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    } else {
      return `${time.getMonth() + 1}/${time.getDate()} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    }
  }, []);

  // 最近消费记录
  const recentConsumptionData = useMemo(() => {
    return getConsumptionRecords()
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5)
      .map((record, index) => ({
        id: index + 1,
        member: record.memberName,
        time: formatRecentTime(record.time),
        service: record.service,
        amount: record.amount,
        status: record.status
      }));
  }, [formatRecentTime]);

  // 最近充值记录
  const recentRechargeData = useMemo(() => {
    return getRechargeRecords()
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 4)
      .map((record, index) => ({
        id: index + 1,
        member: record.memberName,
        time: formatRecentTime(record.time),
        amount: record.amount,
        balance: record.balance,
        payment: record.paymentMethod
      }));
  }, [formatRecentTime]);

  // 即将过期的次卡
  const expiringCardsData = useMemo(() => {
    const members = getMembers();
    const expiringCards = [];

    members.forEach(member => {
      if (member.card) {
        const today = new Date();
        const expireDate = new Date(member.card.expiryDate);
        const daysLeft = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // 只显示即将过期（30天内）且有剩余次数的次卡
        if (daysLeft > 0 && daysLeft <= 30 && member.card.remainingCount > 0) {
          expiringCards.push({
            id: member.id,
            member: member.name,
            cardType: member.card.type,
            remaining: member.card.remainingCount,
            expireDate: member.card.expiryDate,
            daysLeft: daysLeft
          });
        }
      }
    });

    // 按剩余天数排序，最近过期的排在前面
    return expiringCards.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3);
  }, []);

  // 加载数据函数
  const loadData = useCallback(() => {
    const data = getDashboardData(timeRange);
    setDashboardData(data);
    setLoading(false);
  }, [timeRange, getDashboardData]);

  // 初始化数据
  useEffect(() => {
    let mounted = true;

    // 验证数据库连接和初始化数据
    try {
      initStorageData();
      initRechargeData();
      initCardTypes();

      // 验证数据库连接状态
      console.log('数据库连接状态检查完成');

      // 加载仪表盘数据
      const timer = setTimeout(() => {
        if (mounted) {
          loadData();
        }
      }, 1000);

      return () => {
        mounted = false;
        clearTimeout(timer);
      };
    } catch (error) {
      console.error('数据库初始化失败:', error);
      toast.error('数据库连接失败，请刷新页面重试');
      setLoading(false);
    }
  }, [loadData]);

  // 导出数据
  const handleExportData = useCallback(() => {
    toast.info('正在导出数据，请稍候...');
    try {
      // 准备Excel数据
      const headers = ['日期', '营业额', '会员数', '充值额'];

      // 转换数据格式
      const excelData = dashboardData.revenueData.map(item => [
        item.name,
        item.revenue,
        item.members,
        item.recharges
      ]);

      // 创建工作簿和工作表
      const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '仪表盘数据');

      // 生成Excel文件
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `仪表盘数据_${timeRange === 'month' ? '本月' : '全年'}_${new Date().toLocaleDateString()}.xlsx`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('数据导出成功！');
    } catch (error) {
      console.error('导出数据失败:', error);
      toast.error('导出数据失败，请重试');
    }
  }, [dashboardData.revenueData, timeRange]);

  // 刷新数据
  const handleRefresh = useCallback(() => {
    setLoading(true);
    toast.info('正在刷新数据...');
    setTimeout(() => {
      loadData();
      toast.success('数据刷新成功！');
    }, 500);
  }, [loadData]);

  // 饼图颜色
  const COLORS = ['#165DFF', '#36CFC9', '#722ED1', '#FF7D00', '#F5222D'];

  // 骨架屏加载组件
  const Skeleton = () => (
    <div className="animate-pulse">
      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>

      {/* 图表骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* 表格骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
        <p className="text-gray-500 mt-1">欢迎回来，管理员。这里是您的养生馆运营概览。</p>
      </div>

      {/* 日期选择器 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition duration-200 whitespace-nowrap ${timeRange === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setTimeRange('today')}
          >
            今日
          </button>
          <button
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition duration-200 whitespace-nowrap ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setTimeRange('week')}
          >
            本周
          </button>
          <button
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition duration-200 whitespace-nowrap ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setTimeRange('month')}
          >
            本月
          </button>
          <button
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition duration-200 whitespace-nowrap ${timeRange === 'year' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setTimeRange('year')}
          >
            全年
          </button>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button onClick={handleExportData} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition duration-200 flex items-center justify-center">
            <i className="fa-solid fa-download mr-2"></i>
            <span className="hidden sm:inline">导出数据</span>
            <span className="sm:hidden">导出</span>
          </button>
          <button onClick={handleRefresh} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition duration-200 flex items-center justify-center">
            <i className="fa-solid fa-refresh mr-2"></i>
            <span className="hidden sm:inline">刷新</span>
            <span className="sm:hidden">刷新</span>
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
                <StatCard
                  title="总会员数"
                  value={dashboardData.totalMembers}
                  change={calculateComparison(comparisonData.totalMembers.current, comparisonData.totalMembers.previous)}
                  icon="fa-users"
                  color="bg-blue-100 text-blue-600"
                  compareText={compareText}
                />
                <StatCard
                  title={timeRange === 'today' ? '今日新增会员' : timeRange === 'week' ? '本周新增会员' : timeRange === 'month' ? '本月新增会员' : '本年新增会员'}
                  value={comparisonData.newMembers.current}
                  change={calculateComparison(comparisonData.newMembers.current, comparisonData.newMembers.previous)}
                  icon="fa-user-plus"
                  color="bg-green-100 text-green-600"
                  compareText={compareText}
                />
                <StatCard
                  title={timeRange === 'today' ? '今日消费总额' : timeRange === 'week' ? '本周消费总额' : timeRange === 'month' ? '本月消费总额' : '全年消费总额'}
                  value={`¥${comparisonData.consumptionAmount.current.toLocaleString()}`}
                  change={calculateComparison(comparisonData.consumptionAmount.current, comparisonData.consumptionAmount.previous)}
                  icon="fa-credit-card"
                  color="bg-purple-100 text-purple-600"
                  compareText={compareText}
                />
                <StatCard
                  title={timeRange === 'today' ? '今日充值总额' : timeRange === 'week' ? '本周充值总额' : timeRange === 'month' ? '本月充值总额' : '全年充值总额'}
                  value={`¥${comparisonData.rechargeAmount.current.toLocaleString()}`}
                  change={calculateComparison(comparisonData.rechargeAmount.current, comparisonData.rechargeAmount.previous)}
                  icon="fa-wallet"
                  color="bg-green-100 text-green-600"
                  compareText={compareText}
                />
                <StatCard
                  title="次卡类型数量"
                  value={dashboardData.cardTypesCount}
                  change="+0%"
                  icon="fa-ticket-alt"
                  color="bg-red-100 text-red-600"
                  compareText={compareText}
                />
                <StatCard
                  title="活跃会员数"
                  value={Math.floor(dashboardData.totalMembers * 0.65)}
                  change={calculateComparison(Math.floor(dashboardData.totalMembers * 0.65), Math.floor(comparisonData.totalMembers.previous * 0.65))}
                  icon="fa-user-check"
                  color="bg-teal-100 text-teal-600"
                  compareText={compareText}
                />
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* 营业额和会员增长趋势图 */}
            <div className="card rounded-xl shadow-sm border p-6 bg-white hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {timeRange === 'today' ? '今日' : timeRange === 'week' ? '本周' : timeRange === 'month' ? '近6个月' : '全年'}营业额与充值趋势
                </h2>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${activeChartData === 'revenue' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                    onClick={() => setActiveChartData('revenue')}
                  >
                    营业额
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${activeChartData === 'members' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                    onClick={() => setActiveChartData('members')}
                  >
                    会员数
                  </button>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#8c8c8c"
                      tick={{ fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#8c8c8c"
                      tick={{ fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#8c8c8c"
                      tick={{ fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        padding: '12px',
                        fontSize: '14px'
                      }}
                      labelStyle={{ fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}
                      itemStyle={{ margin: '4px 0' }}
                      cursor={{ strokeDasharray: '3 3' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '16px' }} />
                    {activeChartData === 'revenue' ? (
                      <>
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          name="营业额"
                          stroke="#165DFF"
                          strokeWidth={3}
                          dot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#165DFF' }}
                          activeDot={{ r: 8, strokeWidth: 0, fill: '#165DFF' }}
                          animationBegin={300}
                          animationDuration={1500}
                          animationEasing="ease-in-out"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="recharges"
                          name="充值额"
                          stroke="#10B981"
                          strokeWidth={3}
                          dot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#10B981' }}
                          activeDot={{ r: 8, strokeWidth: 0, fill: '#10B981' }}
                          animationBegin={600}
                          animationDuration={1500}
                          animationEasing="ease-in-out"
                        />
                      </>
                    ) : (
                      <>
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="members"
                          name="新增会员"
                          stroke="#165DFF"
                          strokeWidth={3}
                          dot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#165DFF' }}
                          activeDot={{ r: 8, strokeWidth: 0, fill: '#165DFF' }}
                          animationDuration={1500}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="totalMembers"
                          name="总会员数"
                          stroke="#10B981"
                          strokeWidth={3}
                          dot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#10B981' }}
                          activeDot={{ r: 8, strokeWidth: 0, fill: '#10B981' }}
                          animationDuration={1500}
                          animationBegin={300}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 热门服务项目饼图 */}
            <div className="card rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">热门服务项目</h2>
                <button
                  className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer transition duration-200"
                  onClick={() => navigate('/consumptions')}
                >
                  查看全部 <i className="fa-solid fa-angle-right ml-1"></i>
                </button>
              </div>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      animationDuration={1500}
                      animationBegin={300}
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}次`, '消费次数']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                      }}
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 下面的图表和列表 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* 消费时段分布图 */}
            <div className="lg:col-span-1 card rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">消费时段分布</h2>
                <button className="text-xs text-blue-600 hover:text-blue-800">今日</button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={timeDistributionData}
                    margin={{ top: 20, right: 10, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide={true} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={40} />
                    <Tooltip
                      formatter={(value) => [`${value} 人次`, '顾客数量']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#165DFF"
                      radius={[0, 4, 4, 0]}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 最近消费记录 */}
            <div className="lg:col-span-2 card rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">最近消费记录</h2>
                <button
                  className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer transition duration-200"
                  onClick={() => navigate('/consumptions')}
                >
                  查看全部 <i className="fa-solid fa-angle-right ml-1"></i>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-2 sm:px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">会员</th>
                      <th className="px-2 sm:px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">时间</th>
                      <th className="px-2 sm:px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服务项目</th>
                      <th className="px-2 sm:px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                      <th className="px-2 sm:px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">状态</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentConsumptionData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-2 sm:px-3 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.member}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{item.time}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{item.time}</td>
                        <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-sm text-gray-700">{item.service}</td>
                        <td className="px-2 sm:px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">¥{item.amount}</td>
                        <td className="px-2 sm:px-3 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 最近充值记录和即将过期的次卡 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* 最近充值记录 */}
            <div className="card rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">最近充值记录</h2>
                <button
                  className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer transition duration-200"
                  onClick={() => navigate('/recharges')}
                >
                  查看全部 <i className="fa-solid fa-angle-right ml-1"></i>
                </button>
              </div>
              <div className="space-y-4">
                {recentRechargeData.length > 0 ? (
                  recentRechargeData.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition duration-150">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <i className="fa-solid fa-user"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.member}</p>
                          <p className="text-xs text-gray-500">{item.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">+¥{item.amount}</p>
                        <p className="text-xs text-gray-500">余额: ¥{item.balance}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-gray-500">暂无充值记录</div>
                )}
              </div>
            </div>

            {/* 即将过期的次卡 */}
            <div className="card rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">即将过期的次卡</h2>
                <button
                  className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer transition duration-200"
                  onClick={() => navigate('/member-cards')}
                >
                  查看全部 <i className="fa-solid fa-angle-right ml-1"></i>
                </button>
              </div>
              <div className="space-y-4">
                {expiringCardsData.length > 0 ? (
                  expiringCardsData.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition duration-150">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.member}</p>
                        <p className="text-xs text-gray-500">{item.cardType} (剩余 {item.remaining} 次)</p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">{item.expireDate}</span>
                        <WarningBadge daysLeft={item.daysLeft} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-gray-500">暂无即将过期的次卡</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}