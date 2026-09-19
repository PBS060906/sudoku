// ============================================
// 数独领域模型 + 编译期类型系统
// 灵感来源：typescript-sudoku —— 让 TypeScript 类型检查器在编译期校验数独
// ============================================

/** 合法数字：只允许 1~9，任何越界数字在赋值时就会被 tsc 拒绝 */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 格子取值：0 表示空格 */
export type CellValue = 0 | Digit;

/** 棋盘规格：4×4 / 6×6（2×3 宫）/ 9×9 */
export type BoardSize = 4 | 6 | 9;

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

export type GameStatus = 'playing' | 'paused' | 'won';

/** 棋盘配色主题（对应 LibreSudoku 的棋盘主题能力） */
export type BoardThemeName = 'classic' | 'midnight' | 'matcha';

export interface BoardShape {
  size: BoardSize;
  /** 每个宫的行数 */
  boxRows: number;
  /** 每个宫的列数 */
  boxCols: number;
}

/** 三种规格对应的宫形状 */
export const BOARD_SHAPES: Record<BoardSize, BoardShape> = {
  4: { size: 4, boxRows: 2, boxCols: 2 },
  6: { size: 6, boxRows: 2, boxCols: 3 },
  9: { size: 9, boxRows: 3, boxCols: 3 }
};

export interface Puzzle extends BoardShape {
  /** 题目：0 表示待填空格 */
  givens: CellValue[];
  /** 完整解（出题时保证唯一解） */
  solution: Digit[];
  difficulty: DifficultyLevel;
  /** 出题随机种子（同一规格+难度+种子必定得到同一道题，用于每日挑战） */
  seed: number;
}

/** 可撤销快照 */
export interface Snapshot {
  values: CellValue[];
  notes: number[];
  mistakes: number;
}

export interface GameState extends Puzzle {
  id: string;
  isDaily: boolean;
  /** 当前盘面 */
  values: CellValue[];
  /** 每个格子的候选数字位掩码：第 d 位为 1 表示候选 d */
  notes: number[];
  /** 题目给定格（不可修改） */
  givenMask: boolean[];
  /** 通过提示填入的格子 */
  hintedMask: boolean[];
  selected: number;
  noteMode: boolean;
  mistakes: number;
  hintsUsed: number;
  status: GameStatus;
  elapsedMs: number;
  /** 处于计时中时的时间戳，暂停时为 null */
  startedAt: number | null;
  undoStack: Snapshot[];
  redoStack: Snapshot[];
  wonAt: number | null;
  stars: number;
}

/** 引擎层需要的设置项（页面设置 Store 的子集） */
export interface EngineSettings {
  autoRemoveNotes: boolean;
}

// --------------------------------------------
// 编译期类型实验室（typescript-sudoku 致敬部分）
// --------------------------------------------

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

type Includes<List extends readonly unknown[], Item> =
  List extends readonly [infer Head, ...infer Rest]
    ? Equal<Head, Item> extends true
      ? true
      : Includes<Rest, Item>
    : false;

type AllTrue<List extends readonly boolean[]> = List[number] extends true ? true : false;

/**
 * 编译期校验：一行（9 个字面量）是否恰好包含 1~9 各一次。
 * 任意重复、遗漏或越界数字都会让该类型解析为 false，
 * 再配合 Assert<> 在编译期直接报错。
 */
export type IsCompleteDigitRow<Row extends readonly Digit[]> = AllTrue<[
  Includes<Row, 1>,
  Includes<Row, 2>,
  Includes<Row, 3>,
  Includes<Row, 4>,
  Includes<Row, 5>,
  Includes<Row, 6>,
  Includes<Row, 7>,
  Includes<Row, 8>,
  Includes<Row, 9>
]>;

/** 断言为 true，否则编译失败 —— 类型检查器即数独检查器 */
export type Assert<T extends true> = T;

/** 合法的 9 数字行类型 */
export type DigitRow = readonly [
  Digit, Digit, Digit, Digit, Digit, Digit, Digit, Digit, Digit
];
