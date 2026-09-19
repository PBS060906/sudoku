// ============================================
// 时间工具
// ============================================

const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

/** 计时展示：mm:ss，超过一小时升为 h:mm:ss */
export function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  }
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

/** 统计页用的人类可读时长 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}秒`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}分${pad2(seconds)}秒`;
  const hours = Math.floor(minutes / 60);
  return `${hours}时${pad2(minutes % 60)}分`;
}

/** 本地日期字符串 YYYY-MM-DD（每日挑战/连胜用） */
export function dateStr(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 两个 YYYY-MM-DD 日期相差天数（b - a） */
export function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}
