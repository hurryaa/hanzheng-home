/**
 * 数据导出工具库
 * 支持CSV、Excel等格式导出
 */

/**
 * 将数据转换为CSV格式
 */
export const convertToCSV = (data: any[], headers?: string[]): string => {
  if (data.length === 0) {
    return '';
  }

  // 如果没有指定headers，从第一行数据的key提取
  const csvHeaders = headers || Object.keys(data[0]);
  
  // 构建header行
  const headerRow = csvHeaders.map(escapeCSVField).join(',');
  
  // 构建数据行
  const dataRows = data.map((row) =>
    csvHeaders.map((header) => {
      const value = row[header];
      return escapeCSVField(value);
    }).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
};

/**
 * 转义CSV字段（处理包含逗号、引号等特殊字符）
 */
const escapeCSVField = (field: any): string => {
  if (field === null || field === undefined) {
    return '';
  }

  let value = String(field);

  // 如果包含逗号、引号或换行，需要用引号包围
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // 双引号转义为两个双引号
    value = value.replace(/"/g, '""');
    value = `"${value}"`;
  }

  return value;
};

/**
 * 下载CSV文件
 */
export const downloadCSV = (csvContent: string, fileName: string = 'export.csv'): void => {
  const link = document.createElement('a');
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 导出会员列表
 */
export const exportMembers = (members: any[], fileName?: string): void => {
  const headers = ['会员ID', '姓名', '电话', '邮箱', '加入时间', '状态'];
  
  const data = members.map((member) => ({
    '会员ID': member.id,
    '姓名': member.name,
    '电话': member.phone,
    '邮箱': member.email || '-',
    '加入时间': member.joinDate
      ? new Date(member.joinDate).toLocaleDateString('zh-CN')
      : '-',
    '状态': member.status === 'active' ? '活跃' : '非活跃',
  }));

  const csv = convertToCSV(data, headers);
  downloadCSV(csv, fileName || `会员列表_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * 导出佣金记录
 */
export const exportCommissions = (commissions: any[], fileName?: string): void => {
  const headers = ['佣金ID', '分销商ID', '用户ID', '金额', '状态', '创建时间'];
  
  const data = commissions.map((commission) => ({
    '佣金ID': commission.id,
    '分销商ID': commission.distributorId,
    '用户ID': commission.inviteeId,
    '金额': `¥${commission.amount.toFixed(2)}`,
    '状态': getCommissionStatusLabel(commission.status),
    '创建时间': new Date(commission.createdAt).toLocaleString('zh-CN'),
  }));

  const csv = convertToCSV(data, headers);
  downloadCSV(csv, fileName || `佣金记录_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * 导出核销记录
 */
export const exportRedemptions = (redemptions: any[], fileName?: string): void => {
  const headers = ['核销ID', '会员ID', '门店', '次数', '卡ID', '员工', '时间', '备注'];
  
  const data = redemptions.map((record) => ({
    '核销ID': record.id,
    '会员ID': record.userId,
    '门店': record.storeId || '-',
    '次数': record.sessionsDeducted,
    '卡ID': record.userPackageId,
    '员工': record.staffId || '-',
    '时间': new Date(record.occurredAt).toLocaleString('zh-CN'),
    '备注': record.remark || '-',
  }));

  const csv = convertToCSV(data, headers);
  downloadCSV(csv, fileName || `核销记录_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * 导出购买记录
 */
export const exportPurchases = (purchases: any[], fileName?: string): void => {
  const headers = ['购买ID', '会员ID', '套餐', '次数', '金额', '门店', '状态', '时间'];
  
  const data = purchases.map((record) => ({
    '购买ID': record.id,
    '会员ID': record.userId,
    '套餐': record.packageId || '自定义',
    '次数': record.sessionsAdded,
    '金额': `¥${record.amount.toFixed(2)}`,
    '门店': record.storeId || '-',
    '状态': getPurchaseStatusLabel(record.status),
    '时间': new Date(record.occurredAt).toLocaleString('zh-CN'),
  }));

  const csv = convertToCSV(data, headers);
  downloadCSV(csv, fileName || `购买记录_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * 导出邀请绑定记录
 */
export const exportInviteBindings = (bindings: any[], fileName?: string): void => {
  const headers = ['邀请人', '被邀请人', '绑定时间', '状态'];
  
  const data = bindings.map((binding) => ({
    '邀请人': binding.distributorId,
    '被邀请人': binding.inviteeId,
    '绑定时间': new Date(binding.createdAt).toLocaleString('zh-CN'),
    '状态': binding.status === 'active' ? '活跃' : '已取消',
  }));

  const csv = convertToCSV(data, headers);
  downloadCSV(csv, fileName || `邀请关系_${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * 生成综合报表（包含多种数据）
 */
export const generateComprehensiveReport = (reportData: {
  summary: any;
  members?: any[];
  commissions?: any[];
  redemptions?: any[];
  purchases?: any[];
}): void => {
  let report = '汗蒸会员管理系统 - 综合报表\n';
  report += `生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;

  // 摘要
  report += '=== 统计摘要 ===\n';
  Object.entries(reportData.summary).forEach(([key, value]) => {
    report += `${key}: ${value}\n`;
  });
  report += '\n';

  // 会员数据
  if (reportData.members && reportData.members.length > 0) {
    report += '=== 会员统计 ===\n';
    report += `总会员数: ${reportData.members.length}\n`;
    const activeMembersCount = reportData.members.filter((m) => m.status === 'active').length;
    report += `活跃会员: ${activeMembersCount}\n\n`;
  }

  // 佣金统计
  if (reportData.commissions && reportData.commissions.length > 0) {
    report += '=== 佣金统计 ===\n';
    const totalCommission = reportData.commissions.reduce((sum, c) => sum + c.amount, 0);
    report += `总佣金: ¥${totalCommission.toFixed(2)}\n`;
    const pendingCommission = reportData.commissions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);
    report += `待审批: ¥${pendingCommission.toFixed(2)}\n\n`;
  }

  // 下载报表
  const link = document.createElement('a');
  link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(report)}`;
  link.download = `综合报表_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 佣金状态标签
 */
const getCommissionStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待审批',
    available: '可提现',
    withdrawn: '已提现',
    rejected: '已拒绝',
  };
  return statusMap[status] || status;
};

/**
 * 购买状态标签
 */
const getPurchaseStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    confirmed: '已确认',
    void: '已作废',
    refunded: '已退款',
  };
  return statusMap[status] || status;
};

/**
 * 批量导出多种报表
 */
export const exportBatchReports = (reports: {
  members?: any[];
  commissions?: any[];
  redemptions?: any[];
  purchases?: any[];
}): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const exportMap: Record<string, [any[], string]> = {
    members: [reports.members || [], `会员列表_${timestamp}.csv`],
    commissions: [reports.commissions || [], `佣金记录_${timestamp}.csv`],
    redemptions: [reports.redemptions || [], `核销记录_${timestamp}.csv`],
    purchases: [reports.purchases || [], `购买记录_${timestamp}.csv`],
  };

  // 为了简化，这里返回一个zip文件的创建（需要额外的库支持）
  // 或者逐个下载
  Object.entries(exportMap).forEach(([key, [data, fileName]]) => {
    if (data.length > 0) {
      switch (key) {
        case 'members':
          exportMembers(data, fileName);
          break;
        case 'commissions':
          exportCommissions(data, fileName);
          break;
        case 'redemptions':
          exportRedemptions(data, fileName);
          break;
        case 'purchases':
          exportPurchases(data, fileName);
          break;
      }
    }
  });
};
