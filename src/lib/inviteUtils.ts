/**
 * 邀请和分销工具库
 * 生成邀请链接、二维码、邀请码等
 */

import QRCode from 'qrcode';

/**
 * 生成邀请链接
 * 格式: domain/register?aff=USER_ID
 */
export const generateInviteLink = (userId: string, baseUrl?: string): string => {
  const url = baseUrl || window.location.origin;
  return `${url}/register?aff=${userId}`;
};

/**
 * 生成邀请码（随机6-8位）
 */
export const generateInviteCode = (userId: string): string => {
  // 使用用户ID的前4个字符 + 4个随机数字
  const userPart = userId.substring(0, 4).toUpperCase();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${userPart}${randomPart}`;
};

/**
 * 为邀请链接生成二维码（返回DataURL）
 */
export const generateQRCodeDataUrl = async (
  inviteLink: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> => {
  try {
    const qrOptions = {
      width: options?.width || 300,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#ffffff',
      },
    };

    const dataUrl = await QRCode.toDataURL(inviteLink, qrOptions);
    return dataUrl;
  } catch (error) {
    console.error('生成二维码失败:', error);
    throw new Error('二维码生成失败');
  }
};

/**
 * 为邀请链接生成二维码（返回Canvas元素）
 */
export const generateQRCodeCanvas = async (
  inviteLink: string,
  canvas: HTMLCanvasElement,
  options?: {
    width?: number;
    margin?: number;
  }
): Promise<void> => {
  try {
    const qrOptions = {
      width: options?.width || 300,
      margin: options?.margin || 2,
    };

    await QRCode.toCanvas(canvas, inviteLink, qrOptions);
  } catch (error) {
    console.error('生成二维码失败:', error);
    throw new Error('二维码生成失败');
  }
};

/**
 * 为邀请链接生成二维码（返回SVG字符串）
 */
export const generateQRCodeSVG = async (
  inviteLink: string,
  options?: {
    width?: number;
    margin?: number;
  }
): Promise<string> => {
  try {
    const qrOptions = {
      width: options?.width || 300,
      margin: options?.margin || 2,
      type: 'image/svg+xml',
    };

    const svgString = await QRCode.toString(inviteLink, qrOptions);
    return svgString;
  } catch (error) {
    console.error('生成二维码失败:', error);
    throw new Error('二维码生成失败');
  }
};

/**
 * 下载二维码为PNG图片
 */
export const downloadQRCode = async (
  inviteLink: string,
  fileName: string = 'invite-qrcode.png'
): Promise<void> => {
  try {
    const dataUrl = await generateQRCodeDataUrl(inviteLink);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载二维码失败:', error);
    throw error;
  }
};

/**
 * 分享邀请链接到社交媒体
 */
export const shareInviteLink = (
  inviteLink: string,
  platform: 'wechat' | 'qq' | 'weibo' | 'copy'
): void => {
  const text = `我邀请您加入汗蒸会员，成为我的分销伙伴，赚取佣金。\n邀请码/链接：${inviteLink}`;

  switch (platform) {
    case 'copy':
      navigator.clipboard.writeText(inviteLink);
      break;
    case 'wechat':
      // WeChat分享（需要WeChat SDK）
      console.log('微信分享（需要SDK集成）:', text);
      break;
    case 'qq':
      // QQ分享（需要QQ SDK）
      console.log('QQ分享（需要SDK集成）:', text);
      break;
    case 'weibo':
      // 微博分享（需要Weibo SDK）
      console.log('微博分享（需要SDK集成）:', text);
      break;
  }
};

/**
 * 从URL中提取邀请人ID
 */
export const extractAffiliateIdFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('aff');
};

/**
 * 检查用户是否通过邀请链接注册
 */
export const isFromInviteLink = (): boolean => {
  return extractAffiliateIdFromUrl() !== null;
};

/**
 * 获取邀请链接的完整信息
 */
export const getInviteLinkInfo = (userId: string, baseUrl?: string) => {
  const inviteLink = generateInviteLink(userId, baseUrl);
  const inviteCode = generateInviteCode(userId);
  
  return {
    userId,
    inviteLink,
    inviteCode,
    shortLink: `${inviteCode}`, // 可用于短链服务
  };
};

/**
 * 验证邀请码的有效性
 * 这里是基础验证，实际应在后端验证
 */
export const validateInviteCode = (code: string): boolean => {
  // 基础格式验证：4个大写字母 + 4个数字
  const codePattern = /^[A-Z]{4}\d{4}$/;
  return codePattern.test(code);
};

/**
 * 转换邀请链接为短链
 * 这是占位符实现，实际需要集成短链服务（如 bit.ly、tinyurl等）
 */
export const shortenInviteLink = async (inviteLink: string): Promise<string> => {
  // TODO: 集成短链服务API
  // 示例：
  // const response = await fetch('https://api.bit.ly/v4/shorten', {
  //   method: 'POST',
  //   headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  //   body: JSON.stringify({ long_url: inviteLink })
  // });
  // return response.json().link;
  
  return inviteLink; // 暂时返回原链接
};

/**
 * 邀请链接的追踪信息
 */
export interface InviteLinkTracking {
  userId: string;
  createdAt: Date;
  clicks: number;
  conversions: number;
  conversionRate: number;
}

/**
 * 生成邀请链接的追踪ID
 */
export const generateTrackingId = (): string => {
  return `TRACK_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
