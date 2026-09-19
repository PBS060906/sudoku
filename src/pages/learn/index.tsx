import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import SectionHeader from '@/components/SectionHeader';
import styles from './index.module.scss';

const RULES: { icon: string; title: string; desc: string }[] = [
  { icon: '📏', title: '横纵不重复', desc: '每一行、每一列都必须包含 1~9，且不能重复' },
  { icon: '🔲', title: '宫不重复', desc: '每个 3×3（其他规格为 2×2 / 2×3）的宫内同样包含 1~9' },
  { icon: '✏️', title: '从已知推未知', desc: '题目保证唯一解，全部依靠逻辑推理即可完成' }
];

const TECHNIQUES: { name: string; tag: string; desc: string }[] = [
  {
    name: '唯一余数',
    tag: '入门',
    desc: '某格所在的行、列、宫中已经出现了 8 个不同数字，剩余的那个数字就是答案。'
  },
  {
    name: '宫摒除法',
    tag: '入门',
    desc: '某个数字在一个宫内只能出现在特定的几个格子中，借此排除同行同列其他位置。'
  },
  {
    name: '隐性唯一',
    tag: '进阶',
    desc: '一个数字在某行 / 某列 / 某宫中只剩一个可能位置，即使其他候选还很多也要填它。'
  },
  {
    name: '候选数对',
    tag: '高级',
    desc: '两格恰好拥有相同的两个候选数，则这两个数字必占据这两格，可从同伴格中删除。'
  }
];

const CODE_SNIPPET =
  "type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9\n\ntype IsCompleteDigitRow<R extends readonly Digit[]> =\n  AllTrue<[\n    Includes<R, 1>, Includes<R, 2>, Includes<R, 3>,\n    Includes<R, 4>, Includes<R, 5>, Includes<R, 6>,\n    Includes<R, 7>, Includes<R, 8>, Includes<R, 9>\n  ]>\n\ntype Assert<T extends true> = T";

function analyzeRow(row: number[]): { ok: boolean; message: string } {
  if (row.includes(0)) {
    return { ok: false, message: "error TS2322: 数字 0 不是 Digit（运行时它只代表空格）" };
  }
  const seen = new Set<number>();
  const duplicated = new Set<number>();
  row.forEach((d) => {
    if (seen.has(d)) duplicated.add(d);
    seen.add(d);
  });
  if (duplicated.size > 0) {
    const digits = Array.from(duplicated).join(', ');
    return {
      ok: false,
      message: `error TS2344: 数字 ${digits} 重复，IsCompleteDigitRow<Row> 解析为 false`
    };
  }
  const missing: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if (!seen.has(d)) missing.push(d);
  }
  if (missing.length > 0) {
    return {
      ok: false,
      message: `error TS2344: 缺少数字 ${missing.join(', ')}，无法满足 Assert<true> 约束`
    };
  }
  return { ok: true, message: '✓ tsc --noEmit：类型检查通过，IsCompleteDigitRow<Row> = true' };
}

const LearnPage: React.FC = () => {
  const [row, setRow] = useState<number[]>([5, 3, 4, 6, 7, 8, 9, 1, 2]);
  const result = useMemo(() => analyzeRow(row), [row]);

  const cycleCell = (index: number) => {
    setRow((prev) => {
      const next = prev.slice();
      next[index] = (next[index] + 1) % 10;
      return next;
    });
  };

  const resetRow = () => setRow([5, 3, 4, 6, 7, 8, 9, 1, 2]);

  const breakRow = () => setRow([1, 1, 2, 3, 4, 5, 6, 7, 8]);

  const startPractice = () => {
    Taro.navigateTo({ url: '/pages/game/index?level=easy&size=4' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>从入门到大师</Text>
        <Text className={styles.headerDesc}>规则、技巧，以及让类型检查器陪你玩数独</Text>
      </View>

      <View className={styles.section}>
        <SectionHeader title="数独规则" desc="三条铁律" />
        {RULES.map((rule) => (
          <View key={rule.title} className={styles.ruleCard}>
            <Text className={styles.ruleIcon}>{rule.icon}</Text>
            <View className={styles.ruleBody}>
              <Text className={styles.ruleTitle}>{rule.title}</Text>
              <Text className={styles.ruleDesc}>{rule.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.section}>
        <SectionHeader title="解题技巧" desc="由浅入深" />
        {TECHNIQUES.map((item) => (
          <View key={item.name} className={styles.techniqueCard}>
            <View className={styles.techniqueHead}>
              <Text className={styles.techniqueName}>{item.name}</Text>
              <Text
                className={classnames(
                  styles.techniqueTag,
                  item.tag === '高级' && styles.techniqueTagHard
                )}
              >
                {item.tag}
              </Text>
            </View>
            <Text className={styles.techniqueDesc}>{item.desc}</Text>
          </View>
        ))}
      </View>

      <View className={styles.section}>
        <SectionHeader title="TypeScript 类型实验室" desc="致敬 typescript-sudoku" />
        <View className={styles.labCard}>
          <Text className={styles.labIntro}>
            开源项目 typescript-sudoku 让 TypeScript 类型检查器在编译期校验数独。点击下面的格子循环切换数字，
            就像在修改一行类型字面量，观察「编译器」的反应：
          </Text>

          <View className={styles.typeRow}>
            {row.map((digit, index) => (
              <View
                key={index}
                className={classnames(
                  styles.typeCell,
                  digit === 0 && styles.typeCellEmpty,
                  !result.ok && digit !== 0 && styles.typeCellWrong
                )}
                onClick={() => cycleCell(index)}
              >
                <Text className={styles.typeCellText}>{digit === 0 ? '·' : digit}</Text>
              </View>
            ))}
          </View>

          <View className={styles.console}>
            <View className={styles.consoleHead}>
              <Text className={styles.consoleTitle}>tsc 输出</Text>
              <View className={styles.consoleActions}>
                <Text className={styles.consoleLink} onClick={breakRow}>
                  制造重复
                </Text>
                <Text className={styles.consoleLink} onClick={resetRow}>
                  重置
                </Text>
              </View>
            </View>
            <Text className={result.ok ? styles.consoleOk : styles.consoleError}>
              {result.message}
            </Text>
          </View>

          <ScrollView scrollX className={styles.codeScroll}>
            <Text className={styles.codeText}>{CODE_SNIPPET}</Text>
          </ScrollView>
        </View>
      </View>

      <View className={styles.section}>
        <SectionHeader title="新手练习" desc="4×4 迷你棋盘，1 分钟上手" />
        <View className={styles.practiceCard} onClick={startPractice}>
          <View className={styles.practiceInfo}>
            <Text className={styles.practiceTitle}>开始一局 4×4 简单难度</Text>
            <Text className={styles.practiceDesc}>宫为 2×2，只需填入数字 1~4</Text>
          </View>
          <Text className={styles.practiceArrow}>›</Text>
        </View>
      </View>
    </View>
  );
};

export default LearnPage;
