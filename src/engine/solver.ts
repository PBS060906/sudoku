// ============================================
// 数独求解器：位掩码 + MRV（最少候选格）回溯
// 对应 mayerui/sudoku 中 solve/unique 判定的 TS 实现
// ============================================

import type { BoardShape, CellValue } from './types';

const peersCache = new Map<string, number[][]>();
const unitsCache = new Map<string, number[][]>();

export function boxIndexOf(shape: BoardShape, row: number, col: number): number {
  const boxesPerRow = shape.size / shape.boxCols;
  return (
    Math.floor(row / shape.boxRows) * boxesPerRow +
    Math.floor(col / shape.boxCols)
  );
}

/** 所有需要满足“不重复”约束的单元：每一行、每一列、每一宫 */
export function computeUnits(shape: BoardShape): number[][] {
  const key = `${shape.size}-${shape.boxRows}x${shape.boxCols}`;
  const cached = unitsCache.get(key);
  if (cached) return cached;

  const n = shape.size;
  const units: number[][] = [];

  for (let r = 0; r < n; r++) {
    const row: number[] = [];
    for (let c = 0; c < n; c++) row.push(r * n + c);
    units.push(row);
  }
  for (let c = 0; c < n; c++) {
    const col: number[] = [];
    for (let r = 0; r < n; r++) col.push(r * n + c);
    units.push(col);
  }
  for (let br = 0; br < n / shape.boxRows; br++) {
    for (let bc = 0; bc < n / shape.boxCols; bc++) {
      const box: number[] = [];
      for (let r = br * shape.boxRows; r < (br + 1) * shape.boxRows; r++) {
        for (let c = bc * shape.boxCols; c < (bc + 1) * shape.boxCols; c++) {
          box.push(r * n + c);
        }
      }
      units.push(box);
    }
  }

  unitsCache.set(key, units);
  return units;
}

/** 每个格子的同行/同列/同宫邻居（不含自己） */
export function computePeers(shape: BoardShape): number[][] {
  const key = `${shape.size}-${shape.boxRows}x${shape.boxCols}`;
  const cached = peersCache.get(key);
  if (cached) return cached;

  const n = shape.size;
  const peerSets: Set<number>[] = Array.from({ length: n * n }, () => new Set<number>());
  for (const unit of computeUnits(shape)) {
    for (const index of unit) {
      for (const other of unit) {
        if (other !== index) peerSets[index].add(other);
      }
    }
  }
  const peers = peerSets.map((set) => Array.from(set));
  peersCache.set(key, peers);
  return peers;
}

/**
 * 统计解的数量（达到 limit 即提前返回），用于挖洞时保证唯一解
 * @returns 0 无解 / 1 唯一解 / >=limit 多解
 */
export function countSolutions(
  input: CellValue[],
  shape: BoardShape,
  limit = 2
): number {
  const n = shape.size;
  const values = input.slice();
  const rowMask = new Array<number>(n).fill(0);
  const colMask = new Array<number>(n).fill(0);
  const boxMask = new Array<number>(n).fill(0);

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = values[r * n + c];
      if (v === 0) continue;
      const bit = 1 << v;
      const b = boxIndexOf(shape, r, c);
      if ((rowMask[r] & bit) !== 0 || (colMask[c] & bit) !== 0 || (boxMask[b] & bit) !== 0) {
        return 0; // 题目本身冲突
      }
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;
    }
  }

  const allowed = (1 << (n + 1)) - 2; // 第 1..n 位
  let count = 0;

  const search = (): void => {
    if (count >= limit) return;

    // MRV：选择候选数最少的空格
    let bestIndex = -1;
    let bestOptions = 0;
    let bestCount = n + 1;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const index = r * n + c;
        if (values[index] !== 0) continue;
        const b = boxIndexOf(shape, r, c);
        const options = allowed & ~(rowMask[r] | colMask[c] | boxMask[b]);
        if (options === 0) return; // 死路
        const optionCount = popCount(options);
        if (optionCount < bestCount) {
          bestCount = optionCount;
          bestOptions = options;
          bestIndex = index;
        }
      }
    }

    if (bestIndex === -1) {
      count++;
      return;
    }

    const r = Math.floor(bestIndex / n);
    const c = bestIndex % n;
    const b = boxIndexOf(shape, r, c);
    let options = bestOptions;
    while (options !== 0) {
      const bit = options & -options;
      options ^= bit;
      values[bestIndex] = trailingDigit(bit);
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;

      search();

      rowMask[r] ^= bit;
      colMask[c] ^= bit;
      boxMask[b] ^= bit;
      values[bestIndex] = 0;
      if (count >= limit) return;
    }
  };

  search();
  return count;
}

/** 题目是否有且仅有一个解 */
export function hasUniqueSolution(values: CellValue[], shape: BoardShape): boolean {
  return countSolutions(values, shape, 2) === 1;
}

/**
 * 计算当前盘面上互相冲突的格子（同行/同列/同宫出现相同数字）。
 * 与“是否等于最终解”无关，纯粹依据数独规则实时判定。
 */
export function computeConflicts(values: CellValue[], shape: BoardShape): boolean[] {
  const conflicts = new Array<boolean>(shape.size * shape.size).fill(false);
  for (const unit of computeUnits(shape)) {
    for (let digit = 1; digit <= shape.size; digit++) {
      const hit = unit.filter((index) => values[index] === digit);
      if (hit.length > 1) hit.forEach((index) => (conflicts[index] = true));
    }
  }
  return conflicts;
}

function popCount(mask: number): number {
  let count = 0;
  let m = mask;
  while (m !== 0) {
    m &= m - 1;
    count++;
  }
  return count;
}

function trailingDigit(bit: number): CellValue {
  // bit = 1 << digit，利用查表避免循环
  switch (bit) {
    case 2: return 1;
    case 4: return 2;
    case 8: return 3;
    case 16: return 4;
    case 32: return 5;
    case 64: return 6;
    case 128: return 7;
    case 256: return 8;
    default: return 9;
  }
}
