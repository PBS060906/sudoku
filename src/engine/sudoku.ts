// ============================================
// 游戏门面：出题 + 对局状态的全部纯函数操作
// 组件/Store 只通过本文件操作棋盘，便于测试与复用
// ============================================

import {
  BOARD_SHAPES,
  type BoardSize,
  type CellValue,
  type DifficultyLevel,
  type EngineSettings,
  type GameState,
  type Puzzle,
  type Snapshot
} from './types';
import { mulberry32, type Rng } from './rng';
import { digPuzzle, generateSolution } from './generator';
import { DIFFICULTIES, rateStars } from './difficulty';
import { computePeers } from './solver';

const MAX_HISTORY = 200;

/** 根据难度/规格/种子生成一道保证唯一解的题 */
export function createPuzzle(
  level: DifficultyLevel,
  size: BoardSize,
  seed?: number
): Puzzle {
  const shape = BOARD_SHAPES[size];
  const finalSeed = seed ?? Math.floor(Math.random() * 0xffffffff) >>> 0;
  const rng: Rng = mulberry32(finalSeed);
  const config = DIFFICULTIES[level];

  const solution = generateSolution(shape, rng);
  const givens = digPuzzle(solution, shape, rng, config);

  return {
    ...shape,
    givens,
    solution,
    difficulty: level,
    seed: finalSeed
  };
}

export function createGame(puzzle: Puzzle, isDaily = false): GameState {
  const total = puzzle.size * puzzle.size;
  return {
    ...puzzle,
    id: isDaily ? `daily-${puzzle.seed}` : `game-${puzzle.seed}-${Date.now()}`,
    isDaily,
    values: puzzle.givens.slice(),
    notes: new Array<number>(total).fill(0),
    givenMask: puzzle.givens.map((v) => v !== 0),
    hintedMask: new Array<boolean>(total).fill(false),
    selected: -1,
    noteMode: false,
    mistakes: 0,
    hintsUsed: 0,
    status: 'playing',
    elapsedMs: 0,
    startedAt: Date.now(),
    undoStack: [],
    redoStack: [],
    wonAt: null,
    stars: 0
  };
}

/** 从持久化数据恢复（跨启动后一律先进入暂停态，避免计时漂移） */
export function restoreGame(raw: GameState): GameState {
  return {
    ...raw,
    status: raw.status === 'won' ? 'won' : 'paused',
    startedAt: null
  };
}

export function selectCell(state: GameState, index: number): GameState {
  if (state.status === 'won') return state;
  if (state.selected === index) {
    return { ...state, selected: -1 };
  }
  return { ...state, selected: index };
}

export function setNoteMode(state: GameState, enabled: boolean): GameState {
  return { ...state, noteMode: enabled };
}

export interface InputResult {
  state: GameState;
  wrong: boolean;
  won: boolean;
}

/** 输入数字：根据笔记模式切换为填数或候选标记 */
export function inputDigit(
  state: GameState,
  digit: CellValue,
  settings: EngineSettings
): InputResult {
  if (state.status !== 'playing' || digit === 0 || state.selected < 0) {
    return { state, wrong: false, won: false };
  }
  const index = state.selected;
  if (state.givenMask[index]) return { state, wrong: false, won: false };
  // 笔记只能标记在空格上，此操作无意义时不入撤销栈
  if (state.noteMode && state.values[index] !== 0) {
    return { state, wrong: false, won: false };
  }

  const next: GameState = pushUndo(state);
  next.redoStack = [];

  if (next.noteMode) {
    next.notes[index] ^= 1 << digit;
    return { state: next, wrong: false, won: false };
  }

  if (next.values[index] === digit) {
    // 再次点击同一数字：取消填写
    next.values[index] = 0;
    return { state: next, wrong: false, won: false };
  }

  next.values[index] = digit;
  next.notes[index] = 0;
  const wrong = next.solution[index] !== digit;
  if (wrong) {
    next.mistakes += 1;
  } else if (settings.autoRemoveNotes) {
    removePeerNotes(next, index, digit);
  }

  const won = checkWon(next);
  if (won) finishGame(next);
  return { state: next, wrong, won };
}

/** 橡皮：清空当前格的数字/候选 */
export function eraseCell(state: GameState): GameState {
  if (state.status !== 'playing' || state.selected < 0) return state;
  const index = state.selected;
  if (state.givenMask[index]) return state;
  if (state.values[index] === 0 && state.notes[index] === 0) return state;

  const next = pushUndo(state);
  next.redoStack = [];
  next.values[index] = 0;
  next.notes[index] = 0;
  return next;
}

/** 提示：在当前格（或第一个错误/空格）填入正确数字 */
export function applyHint(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  let target = -1;
  if (state.selected >= 0 && !state.givenMask[state.selected]) {
    const i = state.selected;
    if (state.values[i] !== state.solution[i]) target = i;
  }
  if (target < 0) {
    target = state.values.findIndex((v, i) => v !== state.solution[i] && !state.givenMask[i]);
  }
  if (target < 0) return state;

  const next = pushUndo(state);
  next.redoStack = [];
  const digit = next.solution[target];
  next.values[target] = digit;
  next.notes[target] = 0;
  next.hintedMask[target] = true;
  next.hintsUsed += 1;
  removePeerNotes(next, target, digit);

  if (checkWon(next)) finishGame(next);
  return next;
}

export function undo(state: GameState): GameState {
  if (state.status !== 'playing' || state.undoStack.length === 0) return state;
  const snapshot = state.undoStack[state.undoStack.length - 1];
  const current: Snapshot = {
    values: state.values.slice(),
    notes: state.notes.slice(),
    mistakes: state.mistakes
  };
  return {
    ...state,
    values: snapshot.values,
    notes: snapshot.notes,
    mistakes: snapshot.mistakes,
    undoStack: state.undoStack.slice(0, -1),
    redoStack: [...state.redoStack, current].slice(-MAX_HISTORY)
  };
}

export function redo(state: GameState): GameState {
  if (state.status !== 'playing' || state.redoStack.length === 0) return state;
  const snapshot = state.redoStack[state.redoStack.length - 1];
  const current: Snapshot = {
    values: state.values.slice(),
    notes: state.notes.slice(),
    mistakes: state.mistakes
  };
  return {
    ...state,
    values: snapshot.values,
    notes: snapshot.notes,
    mistakes: snapshot.mistakes,
    redoStack: state.redoStack.slice(0, -1),
    undoStack: [...state.undoStack, current].slice(-MAX_HISTORY)
  };
}

export interface BoardCheckResult {
  empty: number;
  wrong: number;
}

/** 手动检查：返回空格数与错误数（不修改棋盘） */
export function checkBoard(state: GameState): BoardCheckResult {
  let empty = 0;
  let wrong = 0;
  for (let i = 0; i < state.values.length; i++) {
    if (state.values[i] === 0) empty += 1;
    else if (state.values[i] !== state.solution[i]) wrong += 1;
  }
  return { empty, wrong };
}

export function pauseGame(state: GameState, now = Date.now()): GameState {
  if (state.status !== 'playing') return state;
  return {
    ...state,
    status: 'paused',
    elapsedMs: currentElapsed(state, now),
    startedAt: null
  };
}

export function resumeGame(state: GameState, now = Date.now()): GameState {
  if (state.status !== 'paused') return state;
  return { ...state, status: 'playing', startedAt: now };
}

/** 每秒心跳：仅刷新累计时长 */
export function tickGame(state: GameState, now = Date.now()): GameState {
  if (state.status !== 'playing' || state.startedAt === null) return state;
  return { ...state, elapsedMs: currentElapsed(state, now) };
}

export function currentElapsed(state: GameState, now = Date.now()): number {
  if (state.startedAt === null) return state.elapsedMs;
  return state.elapsedMs + (now - state.startedAt);
}

/** 每个数字还需填入的次数（1..size），索引 0 无意义 */
export function remainingCounts(values: CellValue[], solution: CellValue[], size: number): number[] {
  const correctPlaced = new Array<number>(size + 1).fill(0);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== 0 && v === solution[i]) correctPlaced[v] += 1;
  }
  const result = new Array<number>(size + 1).fill(0);
  for (let d = 1; d <= size; d++) result[d] = size - correctPlaced[d];
  return result;
}

export function progressOf(state: GameState): number {
  const total = state.size * state.size;
  const givenCount = state.givens.filter((v) => v !== 0).length;
  let correct = 0;
  for (let i = 0; i < total; i++) {
    if (!state.givenMask[i] && state.values[i] === state.solution[i]) correct += 1;
  }
  return Math.round((correct / (total - givenCount)) * 100);
}

export function checkWon(state: GameState): boolean {
  for (let i = 0; i < state.values.length; i++) {
    if (state.values[i] !== state.solution[i]) return false;
  }
  return true;
}

function finishGame(state: GameState): void {
  const total = state.size * state.size;
  state.status = 'won';
  state.wonAt = Date.now();
  state.startedAt = null;
  state.selected = -1;
  state.elapsedMs = currentElapsed(state, state.wonAt);
  state.stars = rateStars(
    state.difficulty,
    total,
    state.elapsedMs,
    state.mistakes,
    state.hintsUsed
  );
}

function pushUndo(state: GameState): GameState {
  const snapshot: Snapshot = {
    values: state.values.slice(),
    notes: state.notes.slice(),
    mistakes: state.mistakes
  };
  return {
    ...state,
    values: snapshot.values.slice(),
    notes: snapshot.notes.slice(),
    undoStack: [...state.undoStack, snapshot].slice(-MAX_HISTORY)
  };
}

function removePeerNotes(state: GameState, index: number, digit: CellValue): void {
  const peers = computePeers(state)[index];
  const bit = 1 << digit;
  for (const peer of peers) {
    state.notes[peer] &= ~bit;
  }
}
