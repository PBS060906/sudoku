// ============================================
// 编译期类型断言 —— 致敬 typescript-sudoku
// 本文件不参与任何运行时逻辑，它的“测试器”是 tsc：
// 运行 `npm run typecheck`，类型检查器会校验数独规则。
// ============================================

import type { Assert, Digit, IsCompleteDigitRow } from './types';

// ✅ 合法行：1~9 各出现一次，类型检查通过
const completeRow = [5, 3, 4, 6, 7, 8, 9, 1, 2] as const;
export type CompleteRowOk = Assert<IsCompleteDigitRow<typeof completeRow>>;

// ❌ 数字 1 重复且遗漏了 9 —— 下面一行必须产生编译错误
const duplicatedRow = [1, 1, 2, 3, 4, 5, 6, 7, 8] as const;
// @ts-expect-error 重复/遗漏的行不能通过 IsCompleteDigitRow 校验
export type DuplicatedRowRejected = Assert<IsCompleteDigitRow<typeof duplicatedRow>>;

// ❌ 0 不是合法数字（运行时 0 代表空格，但 Digit 类型不接受它）
// @ts-expect-error 0 不能赋值给 Digit
const zeroDigit: Digit = 0;

// @ts-expect-error 10 超出了 1~9 的范围
const tenDigit: Digit = 10;

export { completeRow, duplicatedRow, zeroDigit, tenDigit };
