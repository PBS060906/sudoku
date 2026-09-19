// ============================================
// 出题器：随机生成完整解 + 180° 对称挖洞（保证唯一解）
// 对应 mayerui/sudoku 中 create/shuffle 的 TS 实现
// ============================================

import type { BoardShape, CellValue, Digit } from './types';
import { boxIndexOf, hasUniqueSolution } from './solver';
import type { Rng } from './rng';

/** 随机化回溯生成一个完整解 */
export function generateSolution(shape: BoardShape, rng: Rng): Digit[] {
  const n = shape.size;
  const total = n * n;
  const board = new Array<CellValue>(total).fill(0);
  const rowMask = new Array<number>(n).fill(0);
  const colMask = new Array<number>(n).fill(0);
  const boxMask = new Array<number>(n).fill(0);
  const allowed = (1 << (n + 1)) - 2;

  const fill = (index: number): boolean => {
    if (index === total) return true;
    const r = Math.floor(index / n);
    const c = index % n;
    const b = boxIndexOf(shape, r, c);
    let options = allowed & ~(rowMask[r] | colMask[c] | boxMask[b]);
    if (options === 0) return false;

    // 随机打乱候选数字
    const bits: number[] = [];
    while (options !== 0) {
      const bit = options & -options;
      options ^= bit;
      bits.push(bit);
    }
    const shuffled = rng.shuffle(bits);

    for (const bit of shuffled) {
      // bit = 1 << digit，用 clz32 精确还原数字（避免 log2 浮点误差）
      const digit = (31 - Math.clz32(bit)) as Digit;
      board[index] = digit;
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;

      if (fill(index + 1)) return true;

      rowMask[r] ^= bit;
      colMask[c] ^= bit;
      boxMask[b] ^= bit;
      board[index] = 0;
    }
    return false;
  };

  fill(0);
  return board as Digit[];
}

export interface DigConfig {
  /** 线索格比例下限 */
  minClueRatio: number;
  /** 线索格比例上限 */
  maxClueRatio: number;
}

/**
 * 从完整解中挖洞：
 * - 180° 旋转对称挖洞（视觉更专业）
 * - 每挖一组立即做唯一解检测，破坏唯一解则恢复
 * - 线索数落入 [min,max] 区间即停
 */
export function digPuzzle(
  solution: Digit[],
  shape: BoardShape,
  rng: Rng,
  config: DigConfig
): CellValue[] {
  const n = shape.size;
  const total = n * n;
  const givens = solution.slice() as CellValue[];

  const minClues = Math.ceil(total * config.minClueRatio);
  const maxClues = Math.floor(total * config.maxClueRatio);
  const targetClues = minClues + rng.int(Math.max(1, maxClues - minClues + 1));

  let clueCount = total;
  const order = rng.shuffle(Array.from({ length: total }, (_, i) => i));

  for (const index of order) {
    if (clueCount <= targetClues) break;
    if (givens[index] === 0) continue;

    const row = Math.floor(index / n);
    const col = index % n;
    const mirror = (n - 1 - row) * n + (n - 1 - col);

    const removed: number[] = [index];
    if (mirror !== index && givens[mirror] !== 0) removed.push(mirror);

    const backup = removed.map((i) => givens[i]);
    removed.forEach((i) => (givens[i] = 0));

    if (hasUniqueSolution(givens, shape)) {
      clueCount -= removed.length;
    } else {
      removed.forEach((i, k) => (givens[i] = backup[k]));
    }
  }

  return givens;
}
