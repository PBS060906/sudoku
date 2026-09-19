// ============================================
// 触感反馈（不内置音频资源，保持安装包精简）
// ============================================

import Taro from '@tarojs/taro';

export type HapticType = 'light' | 'medium';

export function haptic(enabled: boolean, type: HapticType = 'light'): void {
  if (!enabled) return;
  try {
    Taro.vibrateShort({ type: type === 'medium' ? 'medium' : 'light' });
  } catch (error) {
    // 部分平台/模拟器不支持震动，静默降级即可
    console.warn('[Feedback] vibrate unavailable:', error);
  }
}
