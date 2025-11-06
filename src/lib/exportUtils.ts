import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Member, RechargeRecord, ConsumptionRecord, CardType } from './utils';

// 定义导出数据类型
export type ExportDataType = 'members' | 'recharges' | 'consumptions' | 'cardTypes' | 'all';

// 会员数据导出格式化
export function formatMembersForExport(members: Member[]) {
  return members.map(member => ({
    '会员编号': member.id,
    '姓名': member.name,
    '手机号': member.phone,
    '加入日期': member.joinDate,
    '余额': member.balance || 0,
    '次卡类型': member.card?.type || '无',
    '总次数': member.card?.totalCount || 0,
    '已使用次数': member.card?.usedCount || 0,
    '剩余次数': member.card?.remainingCount || 0,
    '过期日期': member.card?.expiryDate || '无',
  }));
}

// 充值记录导出格式化
export function formatRechargesForExport(recharges: RechargeRecord[]) {
  return recharges.map(recharge => ({
    '充值编号': recharge.id,
    '会员编号': recharge.memberId,
    '会员姓名': recharge.memberName,
    '手机号': recharge.phone,
    '充值时间': recharge.time,
    '充值金额': recharge.amount,
    '充值后余额': recharge.balance,
    '支付方式': recharge.paymentMethod,
    '操作员': recharge.operator,
    '备注': recharge.notes || '',
  }));
}

// 消费记录导出格式化
export function formatConsumptionsForExport(consumptions: ConsumptionRecord[]) {
  return consumptions.map(consumption => ({
    '消费编号': consumption.id,
    '会员编号': consumption.memberId,
    '会员姓名': consumption.memberName,
    '手机号': consumption.phone,
    '消费时间': consumption.time,
    '服务项目': consumption.service,
    '服务类别': consumption.category,
    '消费金额': consumption.amount,
    '支付方式': consumption.paymentMethod,
    '使用次卡': consumption.usedCard ? '是' : '否',
    '状态': consumption.status,
    '操作员': consumption.operator,
    '备注': consumption.notes || '',
  }));
}

// 次卡类型导出格式化
export function formatCardTypesForExport(cardTypes: CardType[]) {
  return cardTypes.map(cardType => ({
    '次卡编号': cardType.id,
    '次卡名称': cardType.name,
    '描述': cardType.description,
    '价格': cardType.price,
    '次数': cardType.count,
    '有效天数': cardType.validityDays,
    '状态': cardType.active ? '启用' : '禁用',
  }));
}

/**
 * 导出数据到Excel
 * @param data 要导出的数据
 * @param filename 文件名
 * @param sheetName 工作表名称
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  try {
    if (data.length === 0) {
      toast.warning('没有数据可导出');
      return;
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(data);
    
    // 设置列宽
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key]).length)) + 2
    }));
    ws['!cols'] = colWidths;
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // 生成Excel文件
    XLSX.writeFile(wb, filename);
    
    toast.success('导出成功！');
  } catch (error) {
    console.error('导出失败:', error);
    toast.error('导出失败，请重试');
    throw error;
  }
}

/**
 * 导出多个工作表到一个Excel文件
 * @param sheets 工作表数据数组
 * @param filename 文件名
 */
export function exportMultipleSheets(
  sheets: Array<{ data: any[]; sheetName: string }>,
  filename: string
) {
  try {
    const wb = XLSX.utils.book_new();
    
    sheets.forEach(({ data, sheetName }) => {
      if (data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data);
        
        // 设置列宽
        const colWidths = Object.keys(data[0]).map(key => ({
          wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2
        }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    });
    
    if (wb.SheetNames.length === 0) {
      toast.warning('没有数据可导出');
      return;
    }
    
    XLSX.writeFile(wb, filename);
    toast.success('导出成功！');
  } catch (error) {
    console.error('导出失败:', error);
    toast.error('导出失败，请重试');
    throw error;
  }
}

/**
 * 生成带时间戳的文件名
 * @param prefix 文件名前缀
 * @param extension 文件扩展名
 */
export function generateFilename(prefix: string, extension: string = 'xlsx'): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN').replace(/\//g, '-');
  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-');
  return `${prefix}_${dateStr}_${timeStr}.${extension}`;
}

/**
 * 导入Excel数据
 * @param file Excel文件
 * @returns Promise<导入的数据>
 */
export async function importFromExcel(file: File): Promise<Record<string, any[]>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result: Record<string, any[]> = {};
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          result[sheetName] = jsonData;
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 验证导入的数据格式
 * @param data 导入的数据
 * @param requiredFields 必需字段列表
 */
export function validateImportData(data: any[], requiredFields: string[]): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    toast.error('导入数据为空');
    return false;
  }
  
  const firstRow = data[0];
  const missingFields = requiredFields.filter(field => !(field in firstRow));
  
  if (missingFields.length > 0) {
    toast.error(`缺少必需字段：${missingFields.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * 转换导入的会员数据
 */
export function transformImportedMembers(data: any[]): Member[] {
  return data.map(row => ({
    id: row['会员编号'] || `M${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
    name: row['姓名'],
    phone: row['手机号'],
    joinDate: row['加入日期'] || new Date().toISOString(),
    balance: Number(row['余额']) || 0,
    card: row['次卡类型'] && row['次卡类型'] !== '无' ? {
      id: `C${Date.now()}`,
      type: row['次卡类型'],
      totalCount: Number(row['总次数']) || 0,
      usedCount: Number(row['已使用次数']) || 0,
      remainingCount: Number(row['剩余次数']) || 0,
      expiryDate: row['过期日期'] || new Date().toISOString().split('T')[0]
    } : undefined
  }));
}

/**
 * 转换导入的充值记录
 */
export function transformImportedRecharges(data: any[]): RechargeRecord[] {
  return data.map(row => ({
    id: row['充值编号'] || `R${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
    memberId: row['会员编号'],
    memberName: row['会员姓名'],
    phone: row['手机号'],
    time: row['充值时间'],
    amount: Number(row['充值金额']) || 0,
    balance: Number(row['充值后余额']) || 0,
    paymentMethod: row['支付方式'],
    operator: row['操作员'],
    notes: row['备注'] || ''
  }));
}

/**
 * 转换导入的消费记录
 */
export function transformImportedConsumptions(data: any[]): ConsumptionRecord[] {
  return data.map(row => ({
    id: row['消费编号'] || `C${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
    memberId: row['会员编号'],
    memberName: row['会员姓名'],
    phone: row['手机号'],
    time: row['消费时间'],
    service: row['服务项目'],
    category: row['服务类别'],
    amount: Number(row['消费金额']) || 0,
    paymentMethod: row['支付方式'],
    usedCard: row['使用次卡'] === '是',
    status: (row['状态'] || '已完成') as '已完成' | '已取消' | '进行中',
    operator: row['操作员'],
    notes: row['备注'] || ''
  }));
}

/**
 * 转换导入的次卡类型
 */
export function transformImportedCardTypes(data: any[]): CardType[] {
  return data.map(row => ({
    id: row['次卡编号'] || `CT${Date.now()}${Math.random().toString(36).substr(2, 4)}`,
    name: row['次卡名称'],
    description: row['描述'],
    price: Number(row['价格']) || 0,
    count: Number(row['次数']) || 0,
    validityDays: Number(row['有效天数']) || 365,
    active: row['状态'] === '启用'
  }));
}
