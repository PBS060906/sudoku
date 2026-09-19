// ============================================
// 难度配置：线索比例 + 标准用时 + 星级评定
// ============================================

import type { DifficultyLevel } from './types';

export interface DifficultyConfig {
  key: DifficultyLevel;
  label: string;
  shortLabel: string;
  description: string;
  /** 线索格占总格数比例（小规格也按此比例换算） */
  minClueRatio: number;
  maxClueRatio: number;
  /** 9×9 的标准用时（秒），其他规格按格数等比缩放 */
  parSeconds9x9: number;
  /** 主题色（用于卡片/标签区分） */
  color: string;
}

export const DIFFICULTY_ORDER: DifficultyLevel[] = [
  'easy', 'medium', 'hard', 'expert', 'master'
];

export const DIFFICULTIES: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    key: 'easy',
    label: '简单',
    shortLabel: '易',
    description: '大量提示，适合热身与初学者',
    minClueRatio: 0.46,
    maxClueRatio: 0.52,
    parSeconds9x9: 300,
    color: '#10b981'
  },
  medium: {
    key: 'medium',
    label: '普通',
    shortLabel: '普',
    description: '需要基础排除与唯余技巧',
    minClueRatio: 0.39,
    maxClueRatio: 0.44,
    parSeconds9x9: 600,
    color: '#3b82f6'
  },
  hard: {
    key: 'hard',
    label: '困难',
    shortLabel: '难',
    description: '候选数与区块摒除的考验',
    minClueRatio: 0.33,
    maxClueRatio: 0.37,
    parSeconds9x9: 1200,
    color: '#f59e0b'
  },
  expert: {
    key: 'expert',
    label: '专家',
    shortLabel: '专',
    description: '数对、X-Wing 等进阶技法',
    minClueRatio: 0.28,
    maxClueRatio: 0.31,
    parSeconds9x9: 1800,
    color: '#f97316'
  },
  master: {
    key: 'master',
    label: '大师',
    shortLabel: '师',
    description: '极少线索，为硬核玩家准备',
    minClueRatio: 0.25,
    maxClueRatio: 0.28,
    parSeconds9x9: 2700,
    color: '#ef4444'
  }
};

export function parSeconds(level: DifficultyLevel, cellCount: number): number {
  const base = DIFFICULTIES[level].parSeconds9x9;
  return Math.round((base * cellCount) / 81);
}

/**
 * 胜利星级：
 * - 3 星：零提示、错误 ≤2、用时不超过标准用时 1.2 倍
 * - 2 星：提示 ≤3、用时不超过标准用时 2.4 倍
 * - 1 星：完成即可
 */
export function rateStars(
  level: DifficultyLevel,
  cellCount: number,
  elapsedMs: number,
  mistakes: number,
  hintsUsed: number
): number {
  const par = parSeconds(level, cellCount) * 1000;
  if (hintsUsed === 0 && mistakes <= 2 && elapsedMs <= par * 1.2) return 3;
  if (hintsUsed <= 3 && elapsedMs <= par * 2.4) return 2;
  return 1;
}
