// ============================================
// 种子化随机数（mulberry32）
// 同一颗种子必定产出同一道题 —— 每日挑战/复现的基础
// ============================================

export interface Rng {
  /** [0, 1) 浮点 */
  next(): number;
  /** [0, maxExclusive) 整数 */
  int(maxExclusive: number): number;
  pick<T>(arr: T[]): T;
  /** 返回打乱后的新数组 */
  shuffle<T>(arr: readonly T[]): T[];
}

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;

  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const intNum = (maxExclusive: number): number => {
    if (maxExclusive <= 0) return 0;
    return Math.floor(next() * maxExclusive);
  };

  const pick = <T>(arr: readonly T[]): T => arr[intNum(arr.length)];

  const shuffle = <T>(arr: readonly T[]): T[] => {
    const result = arr.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = intNum(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  return { next, int: intNum, pick, shuffle };
}

/** 字符串哈希（FNV-1a 变体），用于把日期变成种子 */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
